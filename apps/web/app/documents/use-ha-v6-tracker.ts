'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { create } from 'zustand'
import { HA_V6_ALL_SEED_DOCUMENTS } from '@/app/documents/ha-v6-all-seeds'
import type { HaV6ProgressRow } from '@/app/documents/ha-v6-dashboard-data'
import {
  fetchHaV6TrackerStates,
  migrateHaV6LocalStates,
  patchHaV6DocumentState,
  type HaV6ServerState,
  type HaV6TrackerStatesMap,
} from '@/app/documents/ha-v6-tracker-api'
import type { HaV6DocStatus, HaV6SectionId, HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'
import { defaultProgressForStatus } from '@/app/documents/ha-v6-tracker-types'
import { normalizeHaV6Document } from '@/app/documents/ha-v6-storage-utils'
import {
  applyHaV6DocOverrides,
  customDocToTracked,
  useHaV6DocLayout,
  useHaV6DocOverrides,
} from '@/hooks/use-app-config'
import { usePermissions } from '@/hooks/use-permissions'
import { showErrorToast } from '@/app/common/toast-store'

const LOCAL_STORAGE_KEY = 'ha-v6-tracker-v1'
const SEED_IDS = new Set(HA_V6_ALL_SEED_DOCUMENTS.map((d) => d.id))
const QUERY_KEY = ['ha-v6-tracker-states'] as const

const SECTION_DASHBOARD_LABELS: Record<HaV6SectionId, string> = {
  core: 'แกนหลัก',
  'section-i': 'ตอน I',
  'section-ii': 'ตอน II',
  'section-iii': 'ตอน III',
  'section-iv': 'ตอน IV',
  'sp-pct': 'SP & PCT',
}

function seedDocuments(): Record<string, HaV6TrackedDocument> {
  return Object.fromEntries(HA_V6_ALL_SEED_DOCUMENTS.map((doc) => [doc.id, doc]))
}

function applyServerState(
  doc: HaV6TrackedDocument,
  state?: HaV6ServerState
): HaV6TrackedDocument {
  if (!state) return normalizeHaV6Document(doc)
  return normalizeHaV6Document({
    ...doc,
    status: state.status,
    progressPercent: state.progressPercent,
    storageItems: state.storageItems,
    storageLink: '',
    remarks: state.remarks || doc.remarks,
    updatedAt: state.updatedAt,
  })
}

function buildDocumentsFromServer(
  states: HaV6TrackerStatesMap,
  customDocs: HaV6TrackedDocument[] = []
): Record<string, HaV6TrackedDocument> {
  const base = seedDocuments()
  for (const custom of customDocs) {
    base[custom.id] = normalizeHaV6Document(custom)
  }
  for (const [id, doc] of Object.entries(base)) {
    base[id] = applyServerState(doc, states[id])
  }
  // states for unknown ids (shouldn't happen often) still keep operational data
  for (const [id, state] of Object.entries(states)) {
    if (!base[id]) {
      base[id] = applyServerState(
        {
          id,
          sectionId: 'core',
          order: 9999,
          standardCode: '',
          title: id,
          docType: '',
          responsible: '',
          status: 'not_started',
          progressPercent: 0,
          storageItems: [],
          remarks: '',
        },
        state
      )
    }
  }
  return base
}

type HaV6TrackerState = {
  documents: Record<string, HaV6TrackedDocument>
  hydrated: boolean
  setFromServer: (states: HaV6TrackerStatesMap, customDocs?: HaV6TrackedDocument[]) => void
  patchLocal: (id: string, patch: Partial<HaV6TrackedDocument>) => void
  ensureDocument: (doc: HaV6TrackedDocument) => void
  removeDocument: (id: string) => void
}

export const useHaV6TrackerStore = create<HaV6TrackerState>()((set, get) => ({
  documents: seedDocuments(),
  hydrated: false,
  setFromServer: (states, customDocs) => {
    set({
      documents: buildDocumentsFromServer(states, customDocs),
      hydrated: true,
    })
  },
  patchLocal: (id, patch) => {
    const current = get().documents[id]
    if (!current) return
    set({
      documents: {
        ...get().documents,
        [id]: normalizeHaV6Document({
          ...current,
          ...patch,
          // เคารพ updatedAt จาก server / caller — ไม่บังคับเป็นตอนนี้ทุกรอบ
          updatedAt: patch.updatedAt ?? new Date().toISOString(),
        }),
      },
    })
  },
  ensureDocument: (doc) => {
    if (get().documents[doc.id]) return
    set({
      documents: {
        ...get().documents,
        [doc.id]: normalizeHaV6Document(doc),
      },
    })
  },
  removeDocument: (id) => {
    if (SEED_IDS.has(id)) return
    const next = { ...get().documents }
    delete next[id]
    set({ documents: next })
  },
}))

function readLocalLegacyDocuments(): HaV6TrackedDocument[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { state?: { documents?: Record<string, HaV6TrackedDocument> } }
    const docs = parsed?.state?.documents
    if (!docs || typeof docs !== 'object') return []
    return Object.values(docs)
  } catch {
    return []
  }
}

function clearLocalLegacyStorage() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** โหลดสถานะจากเซิร์ฟเวอร์ + migrate จาก localStorage ครั้งแรกถ้าเซิร์ฟว่าง */
export function useHaV6TrackerSync() {
  const queryClient = useQueryClient()
  const setFromServer = useHaV6TrackerStore((s) => s.setFromServer)
  const layout = useHaV6DocLayout()
  const { canManageOrgDocuments } = usePermissions()
  const migratedRef = useRef(false)

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHaV6TrackerStates,
    staleTime: 30_000,
    retry: 1,
  })

  useEffect(() => {
    if (query.data) {
      const customs = layout.custom.map((c) => customDocToTracked(c))
      setFromServer(query.data, customs)
      return
    }
    // ถ้าโหลดจาก server ไม่ได้ — ยังแสดง seed ได้ ไม่บล็อกหน้าจอ
    if (query.isError) {
      setFromServer({}, layout.custom.map((c) => customDocToTracked(c)))
    }
  }, [query.data, query.isError, layout.custom, setFromServer])

  useEffect(() => {
    if (!query.isSuccess || migratedRef.current) return
    if (!canManageOrgDocuments()) return
    if (Object.keys(query.data ?? {}).length > 0) {
      clearLocalLegacyStorage()
      return
    }

    const localDocs = readLocalLegacyDocuments()
    if (localDocs.length === 0) return

    migratedRef.current = true
    void migrateHaV6LocalStates(
      localDocs.map((doc) => ({
        documentId: doc.id,
        status: doc.status,
        progressPercent: doc.progressPercent,
        remarks: doc.remarks,
        storageItems: (doc.storageItems ?? []).filter((i) => i.kind === 'link'),
      }))
    )
      .then((states) => {
        clearLocalLegacyStorage()
        queryClient.setQueryData(QUERY_KEY, states)
        setFromServer(
          states,
          layout.custom.map((c) => customDocToTracked(c))
        )
      })
      .catch(() => {
        migratedRef.current = false
      })
  }, [query.isSuccess, query.data, canManageOrgDocuments, layout.custom, queryClient, setFromServer])

  return query
}

export function useHaV6DocumentMutations() {
  const queryClient = useQueryClient()
  const patchLocal = useHaV6TrackerStore((s) => s.patchLocal)

  const mutation = useMutation({
    mutationFn: patchHaV6DocumentState,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData<HaV6TrackerStatesMap>(QUERY_KEY)

      patchLocal(input.documentId, {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.progressPercent !== undefined
          ? { progressPercent: input.progressPercent }
          : input.status
            ? { progressPercent: defaultProgressForStatus(input.status) }
            : {}),
        ...(input.storageItems !== undefined ? { storageItems: input.storageItems } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      })

      if (previous) {
        const current = previous[input.documentId]
        const nextProgress =
          input.progressPercent !== undefined
            ? input.progressPercent
            : input.status
              ? defaultProgressForStatus(input.status)
              : (current?.progressPercent ?? 0)
        queryClient.setQueryData<HaV6TrackerStatesMap>(QUERY_KEY, {
          ...previous,
          [input.documentId]: {
            documentId: input.documentId,
            status: input.status ?? current?.status ?? 'not_started',
            progressPercent: nextProgress,
            storageItems: input.storageItems ?? current?.storageItems ?? [],
            remarks: input.remarks ?? current?.remarks ?? '',
            updatedAt: new Date().toISOString(),
            updatedById: current?.updatedById ?? null,
          },
        })
      }

      return { previous }
    },
    onError: (err, input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(QUERY_KEY, ctx.previous)
        const prev = ctx.previous[input.documentId]
        if (prev) {
          patchLocal(input.documentId, {
            status: prev.status,
            progressPercent: prev.progressPercent,
            storageItems: prev.storageItems,
            remarks: prev.remarks,
            updatedAt: prev.updatedAt,
          })
        }
      }
      showErrorToast(err instanceof Error ? err.message : 'บันทึกสถานะไม่สำเร็จ')
    },
    onSuccess: (state) => {
      queryClient.setQueryData<HaV6TrackerStatesMap>(QUERY_KEY, (prev) => ({
        ...(prev ?? {}),
        [state.documentId]: state,
      }))
      patchLocal(state.documentId, {
        status: state.status,
        progressPercent: state.progressPercent,
        storageItems: state.storageItems,
        remarks: state.remarks,
        updatedAt: state.updatedAt,
      })
    },
  })

  const updateDocument = (id: string, patch: Partial<HaV6TrackedDocument>) => {
    return mutation.mutateAsync({
      documentId: id,
      status: patch.status,
      progressPercent: patch.progressPercent,
      storageItems: patch.storageItems,
      remarks: patch.remarks,
    })
  }

  const setDocumentStatus = (id: string, status: HaV6DocStatus) => {
    return mutation.mutateAsync({
      documentId: id,
      status,
      progressPercent: defaultProgressForStatus(status),
    })
  }

  return {
    updateDocument,
    setDocumentStatus,
    isPending: mutation.isPending,
  }
}

/** @deprecated ใช้ useHaV6DocumentMutations แทน — คงไว้ให้เรียก store เดิมยังไม่พัง */
export function useHaV6TrackerActions() {
  return useHaV6DocumentMutations()
}

export function aggregateDocumentsToProgressRow(
  id: HaV6SectionId,
  section: string,
  docs: HaV6TrackedDocument[]
): HaV6ProgressRow {
  return {
    id,
    section,
    total: docs.length,
    notStarted: docs.filter((d) => d.status === 'not_started').length,
    inProgress: docs.filter((d) => d.status === 'in_progress').length,
    review: docs.filter((d) => d.status === 'review').length,
    completed: docs.filter((d) => d.status === 'completed').length,
  }
}

export function useHaV6CustomDocSync() {
  const layout = useHaV6DocLayout()
  const ensureDocument = useHaV6TrackerStore((s) => s.ensureDocument)

  useEffect(() => {
    for (const custom of layout.custom) {
      ensureDocument(customDocToTracked(custom))
    }
  }, [layout.custom, ensureDocument])
}

export function useHaV6SectionDocuments(sectionId: HaV6SectionId): HaV6TrackedDocument[] {
  useHaV6TrackerSync()
  const documents = useHaV6TrackerStore((s) => s.documents)
  const overrides = useHaV6DocOverrides()
  const layout = useHaV6DocLayout()

  useHaV6CustomDocSync()

  return useMemo(() => {
    const hidden = new Set(layout.hidden)
    const byId = new Map<string, HaV6TrackedDocument>()

    for (const doc of Object.values(documents)) {
      if (doc.sectionId !== sectionId || hidden.has(doc.id)) continue
      byId.set(doc.id, applyHaV6DocOverrides(doc, overrides))
    }

    for (const custom of layout.custom) {
      if (custom.sectionId !== sectionId || hidden.has(custom.id)) continue
      if (!byId.has(custom.id)) {
        byId.set(custom.id, applyHaV6DocOverrides(customDocToTracked(custom), overrides))
      }
    }

    return Array.from(byId.values()).sort((a, b) => a.order - b.order)
  }, [documents, sectionId, overrides, layout])
}

/** @deprecated ใช้ useHaV6SectionDocuments('core') แทน */
export function useHaV6CoreDocuments(): HaV6TrackedDocument[] {
  return useHaV6SectionDocuments('core')
}

export function useHaV6ProgressRows(): HaV6ProgressRow[] {
  useHaV6TrackerSync()
  const documents = useHaV6TrackerStore((s) => s.documents)
  const layout = useHaV6DocLayout()

  useHaV6CustomDocSync()

  return useMemo(() => {
    const hidden = new Set(layout.hidden)
    const trackedSections: HaV6SectionId[] = [
      'core',
      'section-i',
      'section-ii',
      'section-iii',
      'section-iv',
      'sp-pct',
    ]

    return trackedSections.map((sectionId) => {
      const docs = Object.values(documents).filter(
        (d) => d.sectionId === sectionId && !hidden.has(d.id)
      )
      const extras = layout.custom
        .filter((c) => c.sectionId === sectionId && !hidden.has(c.id) && !documents[c.id])
        .map((c) => customDocToTracked(c))
      return aggregateDocumentsToProgressRow(
        sectionId,
        SECTION_DASHBOARD_LABELS[sectionId],
        [...docs, ...extras]
      )
    })
  }, [documents, layout])
}

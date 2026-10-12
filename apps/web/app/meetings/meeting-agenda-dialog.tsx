'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileUp, Link2, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileTypeIcon } from '@/app/documents/file-type-icon'
import { openUploadToast } from '@/app/common/upload-progress-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useSyncMeetingAgendas,
  useUploadAgendaAttachment,
} from '@/hooks/use-meeting-rooms'
import { getApiUrl } from '@/app/common/api-url'
import type { MeetingDetailFull } from '@/app/meetings/meeting-rooms-api'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

const SLOT_COUNT = 6

type AgendaSlot = {
  orderNo: number
  id?: string
  title: string
  file: File | null
  fileUrl: string
  hasAttachment: boolean
  attachmentFileName?: string | null
}

function initSlots(meeting: MeetingDetailFull): AgendaSlot[] {
  const sorted = [...meeting.agendas].sort((a, b) => a.orderNo - b.orderNo)
  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const orderNo = i + 1
    const existing = sorted.find((a) => a.orderNo === orderNo)
    return {
      orderNo,
      id: existing?.id,
      title: existing?.title ?? '',
      file: null,
      fileUrl: '',
      hasAttachment: existing?.hasAttachment ?? false,
      attachmentFileName: existing?.attachmentFileName,
    }
  })
}

type Props = {
  meeting: MeetingDetailFull
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MeetingAgendaDialog({ meeting, open, onOpenChange }: Props) {
  const [slots, setSlots] = useState<AgendaSlot[]>(() => initSlots(meeting))
  const [linkOnly, setLinkOnly] = useState(false)
  const queryClient = useQueryClient()
  const syncMutation = useSyncMeetingAgendas()
  const uploadMutation = useUploadAgendaAttachment()

  useEffect(() => {
    if (open) setSlots(initSlots(meeting))
  }, [open, meeting])

  useEffect(() => {
    if (!open) return
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { storage?: { meetings?: string } }) => {
        setLinkOnly(json.storage?.meetings === 'link')
      })
      .catch(() => {})
  }, [open])

  const updateSlot = (orderNo: number, patch: Partial<AgendaSlot>) => {
    setSlots((prev) => prev.map((s) => (s.orderNo === orderNo ? { ...s, ...patch } : s)))
  }

  const handleSave = async () => {
    const withTitle = slots.filter((s) => s.title.trim())
    if (withTitle.length === 0) {
      showErrorToast('กรุณาระบุชื่อวาระอย่างน้อย 1 รายการ')
      return
    }

    const missingFile = withTitle.filter(
      (s) => !s.hasAttachment && !s.file && !s.fileUrl.trim()
    )
    if (missingFile.length > 0) {
      showErrorToast(
        `วาระที่ ${missingFile.map((s) => s.orderNo).join(', ')} ยังไม่มีเอกสารแนบ`
      )
      return
    }

    try {
      const updated = await syncMutation.mutateAsync({
        meetingId: meeting.id,
        agendas: withTitle.map((s) => ({
          id: s.id,
          title: s.title.trim(),
          orderNo: s.orderNo,
        })),
      })

      for (const slot of slots) {
        const agenda = updated.agendas.find((a) => a.orderNo === slot.orderNo)
        if (!agenda) continue

        if (slot.fileUrl.trim()) {
          await uploadMeetingAgendaLink(meeting.id, agenda.id, slot.fileUrl.trim())
          continue
        }

        if (!slot.file) continue

        const handle = openUploadToast({ fileName: slot.file.name, fileSize: slot.file.size })
        try {
          await uploadMutation.mutateAsync({
            meetingId: meeting.id,
            agendaId: agenda.id,
            file: slot.file,
            onProgress: (percent, loaded) => handle.update(percent, loaded),
          })
          handle.success(`แนบไฟล์วาระที่ ${slot.orderNo} แล้ว`)
        } catch (err) {
          handle.error(err instanceof Error ? err.message : 'แนบไฟล์ไม่สำเร็จ')
          throw err
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['meetings', 'detail', meeting.id] })
      showSuccessToast('บันทึกวาระและเอกสารแนบแล้ว')
      onOpenChange(false)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกวาระไม่สำเร็จ')
    }
  }

  const busy = syncMutation.isPending || uploadMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="size-5 text-emerald-600" />
            แนบวาระการประชุม
          </DialogTitle>
          <DialogDescription>
            ระบุชื่อวาระและ{linkOnly ? 'แนบลิงก์ Google Drive' : 'อัปโหลดไฟล์ PDF'} แต่ละวาระ (สูงสุด{' '}
            {SLOT_COUNT} วาระ)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {slots.map((slot) => (
            <div
              key={slot.orderNo}
              className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2"
            >
              <Label htmlFor={`agenda-title-${slot.orderNo}`}>วาระที่ {slot.orderNo}</Label>
              <Input
                id={`agenda-title-${slot.orderNo}`}
                value={slot.title}
                onChange={(e) => updateSlot(slot.orderNo, { title: e.target.value })}
                placeholder="ชื่อวาระการประชุม"
              />
              <div className="flex flex-wrap items-center gap-2">
                {linkOnly ? (
                  <div className="flex w-full items-center gap-2">
                    <Link2 className="size-4 shrink-0 text-primary" />
                    <Input
                      value={slot.fileUrl}
                      onChange={(e) => updateSlot(slot.orderNo, { fileUrl: e.target.value, file: null })}
                      placeholder="https://drive.google.com/file/d/..."
                      className="h-9 text-xs"
                    />
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-primary/40 bg-background px-3 py-2 text-xs font-medium hover:bg-primary/5">
                    <FileUp className="size-4 text-primary" />
                    {slot.file ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์ PDF'}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        if (file && file.type !== 'application/pdf') {
                          showErrorToast('รองรับเฉพาะไฟล์ PDF')
                          return
                        }
                        updateSlot(slot.orderNo, { file, fileUrl: '' })
                      }}
                    />
                  </label>
                )}

                {slot.file && (
                  <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5 text-xs">
                    <FileTypeIcon fileName={slot.file.name} size="sm" />
                    <span className="max-w-[12rem] truncate font-medium text-foreground">
                      {slot.file.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {(slot.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </span>
                )}

                {!slot.file && slot.hasAttachment && slot.attachmentFileName && (() => {
                  const path = meeting.agendas.find(
                    (a) => a.orderNo === slot.orderNo || a.id === slot.id
                  )?.attachmentPath
                  return (
                    <a
                      href={path ? `${getApiUrl()}${path}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs hover:bg-emerald-100"
                    >
                      <FileTypeIcon fileName={slot.attachmentFileName} size="sm" />
                      <span className="max-w-[12rem] truncate font-medium text-emerald-900">
                        {slot.attachmentFileName}
                      </span>
                    </a>
                  )
                })()}

                {(slot.file || slot.fileUrl.trim() || slot.hasAttachment) && (
                  <span className="chip-success">มีเอกสาร</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            ยกเลิก
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy}>
            {busy ? 'กำลังบันทึก...' : 'บันทึกวาระ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

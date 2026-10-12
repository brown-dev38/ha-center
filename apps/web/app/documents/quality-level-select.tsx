'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search } from 'lucide-react'
import { fetchApiData } from '@/app/common/api-json'
import { cn } from '@/app/common/utils'
import {
  DEFAULT_QUALITY_DOCUMENT_LEVELS,
  type QualityDocumentLevel,
} from '@/app/documents/document-quality-levels'

export function useQualityDocumentLevels() {
  return useQuery({
    queryKey: ['quality-document-levels'],
    queryFn: () => fetchApiData<QualityDocumentLevel[]>('documents/quality-levels'),
    placeholderData: DEFAULT_QUALITY_DOCUMENT_LEVELS,
  })
}

export function QualityLevelSelect({
  id,
  value,
  onChange,
  levels,
  disabled,
  className,
  invalid,
}: {
  id?: string
  value: string
  onChange: (code: string) => void
  levels: QualityDocumentLevel[]
  disabled?: boolean
  className?: string
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const ordered = useMemo(
    () => [...levels].sort((a, b) => b.order - a.order || a.code.localeCompare(b.code)),
    [levels]
  )
  const selected = ordered.find((level) => level.code === value)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ordered
    return ordered.filter(
      (level) =>
        level.name.toLowerCase().includes(q) || level.code.toLowerCase().includes(q)
    )
  }, [ordered, query])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => {
          setQuery('')
          setOpen((current) => !current)
        }}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          invalid && 'border-rose-400'
        )}
      >
        <span className={cn('truncate', selected ? 'text-slate-800' : 'text-slate-500')}>
          {selected?.name || 'เลือกระดับเอกสารคุณภาพ'}
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาระดับเอกสาร"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-sm outline-none focus:border-sky-400"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                เลือกระดับเอกสารคุณภาพ
              </button>
            </li>
            {filtered.map((level) => {
              const active = level.code === value
              return (
                <li key={level.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm',
                      active
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-800 hover:bg-slate-50'
                    )}
                    onClick={() => {
                      onChange(level.code)
                      setOpen(false)
                    }}
                  >
                    {level.name}
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-slate-500">ไม่พบระดับเอกสาร</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

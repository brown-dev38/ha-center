'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/app/common/utils'
import {
  dashboardHomeLink,
  filterNavEntries,
  flattenNavLinks,
  haMenuEntries,
  isExternalNavHref,
  type NavLink,
} from '@/app/common/navigation'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** ลงทะเบียนคีย์ลัด Ctrl/⌘+K เพื่อเปิด command palette */
export function useCommandShortcut(onTrigger: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onTrigger()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTrigger])
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { hasPermission, isAdmin } = usePermissions()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const items = useMemo(() => {
    const visible = filterNavEntries(haMenuEntries, (p) => !p || hasPermission(p), isAdmin())
    return [dashboardHomeLink, ...flattenNavLinks(visible)]
  }, [hasPermission, isAdmin])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false)
    )
  }, [items, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const go = (item: NavLink) => {
    onOpenChange(false)
    if (isExternalNavHref(item.href)) {
      window.open(item.href, '_blank', 'noopener,noreferrer')
    } else {
      router.push(item.href)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[active]
      if (item) go(item)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">ค้นหาเมนู</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border/70 px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ค้นหาเมนู / หน้า..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground sm:inline-block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              ไม่พบเมนูที่ตรงกับ “{query}”
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((item, i) => {
                const Icon = item.icon
                const isActive = i === active
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                        isActive ? 'bg-primary/[0.07]' : 'hover:bg-muted/60'
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg transition',
                          isActive
                            ? 'bg-gradient-to-br from-primary to-secondary text-white'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

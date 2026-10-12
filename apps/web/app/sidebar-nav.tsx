'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { cn } from '@/app/common/utils'
import { usePermissions } from '@/hooks/use-permissions'
import { useAppConfig } from '@/hooks/use-app-config'
import { sectionLabelClass } from '@/app/common/ui/section-label'
import {
  applyMenuOverride,
  dashboardHomeLink,
  filterNavEntries,
  haMenuEntries,
  isExternalNavHref,
  isGroupActive,
  isNavGroup,
  isPathActive,
  type NavChild,
  type NavGroup,
  type NavLink,
} from '@/app/common/navigation'

function NavIconBox({
  icon: Icon,
  active,
  nested,
  leaf,
}: {
  icon: NavLink['icon']
  active: boolean
  nested?: boolean
  leaf?: boolean
}) {
  if (leaf) {
    return (
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center',
          active ? 'text-[#6d28d9]' : 'text-slate-400 group-hover:text-[#6d28d9]'
        )}
        aria-hidden
      >
        <Icon className="size-3.5" strokeWidth={active ? 2.25 : 1.75} />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg transition-all duration-200',
        nested ? 'size-7' : 'size-9',
        active
          ? 'bg-[#6d28d9] text-white shadow-[0_6px_14px_-4px_rgba(109,40,217,0.55)]'
          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 group-hover:bg-violet-50 group-hover:text-[#6d28d9] group-hover:ring-violet-200'
      )}
    >
      <Icon className={cn(nested ? 'size-3.5' : 'size-4')} strokeWidth={active ? 2.25 : 2} />
    </span>
  )
}

function NavLinkItem({
  item,
  nested,
  leaf,
  onNavigate,
}: {
  item: NavLink
  nested?: boolean
  leaf?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = isPathActive(pathname, item.href)
  const Icon = item.icon
  const external = isExternalNavHref(item.href)

  const className = cn(
    'group relative flex items-center gap-3 rounded-xl transition-all duration-200',
    leaf ? 'px-2 py-1.5' : nested ? 'px-2 py-2' : 'px-2.5 py-2',
    active
      ? 'bg-violet-50 shadow-[inset_0_0_0_1px_rgba(109,40,217,0.16)]'
      : 'hover:bg-slate-50'
  )

  const content = (
    <>
      {active && !leaf && (
        <span
          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#6d28d9]"
          aria-hidden
        />
      )}
      <NavIconBox icon={Icon} active={active} nested={nested} leaf={leaf} />
      <span
        className={cn(
          'min-w-0 flex-1 leading-snug',
          leaf || nested ? 'text-[13px]' : 'text-sm',
          active ? 'font-semibold text-[#6d28d9]' : 'font-medium text-slate-700 group-hover:text-slate-900'
        )}
      >
        {item.label}
      </span>
    </>
  )

  if (external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  )
}

function NestedNavGroup({
  group,
  onNavigate,
}: {
  group: NavGroup
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const groupActive = isGroupActive(pathname, group)
  const [open, setOpen] = useState(groupActive)
  const Icon = group.icon

  useEffect(() => {
    if (groupActive) setOpen(true)
  }, [groupActive, pathname])

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-all duration-200',
          groupActive ? 'bg-violet-50/80 text-[#6d28d9]' : 'hover:bg-slate-50'
        )}
      >
        <NavIconBox icon={Icon} active={groupActive} nested />
        <span
          className={cn(
            'min-w-0 flex-1 text-[13px] leading-snug',
            groupActive ? 'font-semibold text-[#6d28d9]' : 'font-medium text-slate-700'
          )}
        >
          {group.label}
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-slate-400 transition-transform duration-300',
            open && 'rotate-180 text-[#6d28d9]'
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-3 space-y-0.5 border-l border-slate-200 py-0.5 pl-3">
            {group.children.map((child) =>
              isNavGroup(child) ? (
                <NestedNavGroup key={child.id} group={child} onNavigate={onNavigate} />
              ) : (
                <NavLinkItem key={child.id} item={child} leaf onNavigate={onNavigate} />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderNavChild(child: NavChild, onNavigate?: () => void) {
  if (isNavGroup(child)) {
    return <NestedNavGroup key={child.id} group={child} onNavigate={onNavigate} />
  }
  return <NavLinkItem key={child.id} item={child} nested onNavigate={onNavigate} />
}

function NavGroupItem({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const pathname = usePathname()
  const groupActive = isGroupActive(pathname, group)
  const [open, setOpen] = useState(groupActive)
  const Icon = group.icon

  useEffect(() => {
    if (groupActive) setOpen(true)
  }, [groupActive, pathname])

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-200',
          groupActive
            ? 'bg-violet-50 shadow-[inset_0_0_0_1px_rgba(109,40,217,0.16)]'
            : 'hover:bg-slate-50'
        )}
      >
        {groupActive && (
          <span
            className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#6d28d9]"
            aria-hidden
          />
        )}
        <NavIconBox icon={Icon} active={groupActive} />
        <span
          className={cn(
            'min-w-0 flex-1 text-sm leading-snug',
            groupActive ? 'font-semibold text-[#6d28d9]' : 'font-medium text-slate-700'
          )}
        >
          {group.label}
        </span>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
            open ? 'bg-violet-100 text-[#6d28d9]' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80'
          )}
        >
          <ChevronDown className={cn('size-4 transition-transform duration-300', open && 'rotate-180')} />
        </span>
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="relative ml-5 space-y-0.5 border-l-2 border-slate-200 py-1 pl-3">
            {group.children.map((child) => renderNavChild(child, onNavigate))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { hasPermission, isAdmin } = usePermissions()
  const { config } = useAppConfig()
  const visibleEntries = useMemo(
    () =>
      filterNavEntries(
        applyMenuOverride(haMenuEntries, config.menu),
        (p) => !p || hasPermission(p),
        isAdmin()
      ),
    [hasPermission, isAdmin, config.menu]
  )

  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 scrollbar-thin">
        <div className="space-y-1">
          <p className={cn(sectionLabelClass(), 'px-2')}>
            <LayoutGrid className="size-3.5" />
            ภาพรวม
          </p>
          <NavLinkItem item={dashboardHomeLink} onNavigate={onNavigate} />
        </div>

        <div className="relative">
          <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="space-y-1">
          <p className={cn(sectionLabelClass(), 'px-2 text-muted-foreground/80')}>
            บริการศูนย์ HA
          </p>
          <div className="space-y-0.5">
            {visibleEntries.map((entry) =>
              isNavGroup(entry) ? (
                <NavGroupItem key={entry.id} group={entry} onNavigate={onNavigate} />
              ) : (
                <NavLinkItem key={entry.id} item={entry} onNavigate={onNavigate} />
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

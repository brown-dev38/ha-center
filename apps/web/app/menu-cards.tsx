'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { PremiumCard } from '@/app/common/ui/app-shell'
import { IconBox } from '@/app/common/ui/icon-box'
import { SectionDesc, SectionTitle } from '@/app/common/ui/section-label'
import { cn } from '@/app/common/utils'
import { SectionHeader } from '@/app/section-header'
import { usePermissions } from '@/hooks/use-permissions'
import {
  filterNavEntries,
  flattenNavLinks,
  haMenuEntries,
  isExternalNavHref,
  isNavGroup,
} from '@/app/common/navigation'

const T = {
  menuLabel: '\u0E40\u0E21\u0E19\u0E39\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23',
  menuTitle: '\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E28\u0E39\u0E19\u0E22\u0E4C HA',
  menuDesc: '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19',
  backToDashboard: '\u0E01\u0E25\u0E31\u0E1A\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E41\u0E14\u0E0A\u0E1A\u0E2D\u0E23\u0E4C\u0E14',
} as const

export function MenuCards() {
  const { hasPermission, isAdmin } = usePermissions()
  const visibleEntries = useMemo(
    () => filterNavEntries(haMenuEntries, (p) => !p || hasPermission(p), isAdmin()),
    [hasPermission, isAdmin]
  )

  return (
    <section className="flex flex-col gap-5">
      <SectionHeader
        label={T.menuLabel}
        title={T.menuTitle}
        description={T.menuDesc}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.map((entry) => {
          if (isNavGroup(entry)) {
            const GroupIcon = entry.icon
            return (
              <PremiumCard key={entry.id} className="col-span-full overflow-hidden">
                <div className="flex items-start gap-4 border-b border-slate-200 bg-white px-5 py-4">
                  <IconBox variant="primary" className="size-11">
                    <GroupIcon className="size-5" />
                  </IconBox>
                  <div className="min-w-0">
                    <SectionTitle>{entry.label}</SectionTitle>
                    {entry.description && (
                      <SectionDesc className="mt-0.5">{entry.description}</SectionDesc>
                    )}
                  </div>
                </div>
                <div className="grid gap-px bg-border/60 sm:grid-cols-3">
                  {flattenNavLinks(entry.children).map((child) => {
                    const ChildIcon = child.icon
                    const childClass =
                      'group flex items-center gap-3 bg-card px-4 py-3.5 text-sm transition hover:bg-primary/[0.04]'
                    const childContent = (
                      <>
                        <ChildIcon className="size-4 shrink-0 text-ha-green-dark transition-transform group-hover:scale-110" />
                        <span className="min-w-0 flex-1 font-medium leading-snug text-foreground group-hover:text-primary">
                          {child.label}
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                      </>
                    )
                    return isExternalNavHref(child.href) ? (
                      <a
                        key={child.id}
                        href={child.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={childClass}
                      >
                        {childContent}
                      </a>
                    ) : (
                      <Link key={child.id} href={child.href} className={childClass}>
                        {childContent}
                      </Link>
                    )
                  })}
                </div>
              </PremiumCard>
            )
          }

          const Icon = entry.icon
          const external = isExternalNavHref(entry.href)
          const card = (
            <PremiumCard className="relative flex h-full flex-col p-5">
              <div
                className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-gradient-to-br from-primary/10 to-ha-green/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden
              />

              <div className="relative mb-4 flex items-start justify-between gap-2">
                <IconBox
                  variant="primary"
                  className="size-11 transition-transform duration-300 group-hover:scale-105"
                >
                  <Icon className="size-5" />
                </IconBox>
                <span className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground/50 shadow-sm transition-all group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground">
                  {external ? (
                    <ArrowUpRight className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                </span>
              </div>

              <SectionTitle className="relative">{entry.label}</SectionTitle>
              {entry.description && (
                <SectionDesc className="relative mt-1.5 line-clamp-2">{entry.description}</SectionDesc>
              )}
            </PremiumCard>
          )

          return external ? (
            <a
              key={entry.id}
              href={entry.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full"
            >
              {card}
            </a>
          ) : (
            <Link key={entry.id} href={entry.href} className="group block h-full">
              {card}
            </Link>
          )
        })}
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {T.backToDashboard}
      </Link>
    </section>
  )
}

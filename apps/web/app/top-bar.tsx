'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { AppTopBar } from '@/app/common/ui/app-shell'
import { cn } from '@/app/common/utils'
import { MobileNav } from '@/app/mobile-nav'
import {
  APP_HOME_HREF,
  flattenNavLinks,
  haMenuEntries,
  type NavLink,
} from '@/app/common/navigation'

const T = {
  home: '\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01',
  detail: '\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14',
} as const

type Crumb = { label: string; href?: string }

function findBreadcrumbs(pathname: string): Crumb[] {
  if (!pathname.startsWith('/dashboard')) return []
  const crumbs: Crumb[] = [{ label: T.home, href: APP_HOME_HREF }]

  const all: NavLink[] = flattenNavLinks(haMenuEntries)

  const match = all
    .filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (match) {
    crumbs.push({ label: match.label, href: match.href })

    if (pathname.length > match.href.length) {
      const segments = pathname.slice(match.href.length).split('/').filter(Boolean)
      if (segments.length > 0) {
        crumbs.push({ label: T.detail })
      }
    }
  }

  return crumbs
}

export function TopBar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname() ?? '/dashboard'
  const crumbs = useMemo(() => findBreadcrumbs(pathname), [pathname])

  return (
    <AppTopBar>
      <nav className="flex min-w-0 items-center gap-2 text-sm">
        <MobileNav onLogout={onLogout} />
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <div key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i === 0 && <Home className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
              {c.href && !isLast ? (
                <Link
                  href={c.href}
                  className="truncate font-medium text-muted-foreground transition hover:text-primary"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'truncate',
                    isLast ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {c.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="size-3 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
            </div>
          )
        })}
      </nav>
    </AppTopBar>
  )
}

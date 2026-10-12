'use client'

import Link from 'next/link'
import { LogOut, ShieldCheck, SlidersHorizontal, Sparkles, UserCircle } from 'lucide-react'
import { HaLogo } from '@/app/brand/ha-logo'
import { useAuthUser } from '@/app/common/use-auth'
import { UserAvatar } from '@/app/common/user-avatar'
import { useAppConfig } from '@/hooks/use-app-config'
import { useMe } from '@/hooks/use-me'
import { usePermissions } from '@/hooks/use-permissions'
import { ApiStatusBadge } from '@/app/common/api-status-badge'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'
import { SidebarNav } from '@/app/sidebar-nav'
import { OnlineUsersCard } from '@/app/online-users-card'

const T = {
  title: '\u0E28\u0E39\u0E19\u0E22\u0E4C\u0E1B\u0E23\u0E30\u0E2A\u0E32\u0E19\u0E07\u0E32\u0E19 HA',
  subtitle: '\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E21\u0E2B\u0E32\u0E27\u0E34\u0E17\u0E22\u0E32\u0E25\u0E31\u0E22\u0E1E\u0E30\u0E40\u0E22\u0E32',
  defaultUser: '\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19',
  profile: '\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C',
  manageUsers: '\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19',
  adminCenter: '\u0E23\u0E30\u0E1A\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E49\u0E32\u0E19',
  logout: '\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A',
} as const

type SidebarContentProps = {
  onLogout: () => void
  onNavigate?: () => void
}

export function SidebarContent({ onLogout, onNavigate }: SidebarContentProps) {
  const user = useAuthUser()
  const { data: me, isLoading: meLoading } = useMe()
  const { roleLabel, isAdmin } = usePermissions()
  const { config } = useAppConfig()
  const siteTitle = config.site.siteName?.trim() || T.title
  const siteSubtitle = config.site.siteSubtitle?.trim() || T.subtitle

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative shrink-0 border-b border-slate-200 bg-white px-4 pb-5 pt-5">
        <div className="relative flex items-center gap-3">
          <HaLogo size="md" priority />
          <div className="min-w-0 space-y-0.5">
            <p className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#6d28d9]">
              <Sparkles className="size-2.5" />
              Quality Center
            </p>
            <p className="truncate font-heading text-sm font-bold leading-tight tracking-tight text-slate-900">
              {siteTitle}
            </p>
            <p className="truncate text-[10.5px] text-slate-500">
              {siteSubtitle}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className="group relative mt-5 flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 transition hover:border-violet-300 hover:bg-white hover:shadow-sm"
        >
          <UserAvatar
            name={user?.name ?? me?.name}
            avatarUrl={me?.avatarUrl}
            cacheKey={me?.updatedAt ?? me?.lastLoginAt}
            className="relative size-10 ring-2 ring-white shadow-sm"
            fallbackClassName="bg-[#6d28d9] text-sm font-bold text-white"
          />
          <div className="relative min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {meLoading ? '...' : (user?.name ?? me?.name ?? T.defaultUser)}
            </p>
            <p className="truncate text-[10.5px] text-slate-500">
              {roleLabel ?? user?.role}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#6d28d9]">
              <UserCircle className="size-3" />
              {T.profile}
            </p>
          </div>
        </Link>

        {isAdmin() && (
          <div className="mt-3 space-y-1.5">
            <Link
              href="/dashboard/admin"
              onClick={onNavigate}
              className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 transition hover:border-violet-300 hover:text-[#6d28d9] hover:shadow-sm"
            >
              <ShieldCheck className="size-4 shrink-0 text-[#6d28d9]" />
              {T.adminCenter}
              <SlidersHorizontal className="ml-auto size-3.5 text-slate-400" />
            </Link>
          </div>
        )}
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="mt-auto shrink-0 border-t border-slate-200 bg-white">
        {FEATURE_FLAGS.presence && (
          <div className="mx-3 mt-2">
            <OnlineUsersCard />
          </div>
        )}

        <div className="mx-3 mb-2 mt-2 flex justify-center">
          <ApiStatusBadge />
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={onLogout}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-card py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="size-4 transition-transform group-hover:-translate-x-0.5" />
            {T.logout}
          </button>
        </div>
      </div>
    </div>
  )
}

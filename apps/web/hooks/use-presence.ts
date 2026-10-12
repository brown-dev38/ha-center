'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { CLIENT_POLLING } from '@/app/common/client-polling'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'
import { getApiUrl } from '@/app/common/api-url'
import { fetchOnlineUsers, leavePresence, sendHeartbeat } from '@/app/common/presence-api'

/** ส่ง heartbeat เป็นระยะ — ไม่รีเซ็ต interval ทุกครั้งที่เปลี่ยนหน้า */
export function usePresenceHeartbeat() {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const { status } = useSession()

  useEffect(() => {
    if (!FEATURE_FLAGS.presence || status !== 'authenticated') return

    let cancelled = false

    const beat = () => {
      sendHeartbeat(pathnameRef.current ?? undefined).catch(() => {
        /* ignore — backend อาจตอบ 401 ระหว่างเปลี่ยน token */
      })
    }

    beat()
    const id = setInterval(() => {
      if (!cancelled) beat()
    }, CLIENT_POLLING.presenceHeartbeatMs)

    const onUnload = () => {
      try {
        const url = `${getApiUrl()}/api/v1/presence/leave`
        navigator.sendBeacon?.(url)
      } catch {
        /* noop */
      }
    }
    window.addEventListener('beforeunload', onUnload)

    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [status])
}

export function useOnlineUsers() {
  const { status } = useSession()
  return useQuery({
    queryKey: ['presence', 'online'],
    enabled: FEATURE_FLAGS.presence && status === 'authenticated',
    staleTime: CLIENT_POLLING.onlineUsersMs,
    refetchInterval: CLIENT_POLLING.onlineUsersMs,
    queryFn: fetchOnlineUsers,
  })
}

export async function logoutPresence() {
  await leavePresence()
}

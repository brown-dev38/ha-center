'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApiData } from '@/app/common/api-json'
import { useSession } from 'next-auth/react'
import { CLIENT_POLLING } from '@/app/common/client-polling'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'

export type NotificationItem = {
  id: string
  title: string
  message: string
  type: 'meeting' | 'info'
  at: string
}

/** Poll การประชุมที่กำลังจะมาถึงเป็น notification (จนกว่าจะมี notifications API) */
export function useNotifications() {
  const { status } = useSession()

  return useQuery({
    queryKey: ['notifications'],
    enabled: FEATURE_FLAGS.notifications && status === 'authenticated',
    staleTime: CLIENT_POLLING.notificationsMs,
    refetchInterval: CLIENT_POLLING.notificationsMs,
    queryFn: async () => {
      const meetings = await fetchApiData<
        Array<{
          id: string
          title: string
          startAt: string
          endAt: string
        }>
      >('meetings/upcoming')

      return (meetings ?? []).map((m) => ({
        id: m.id,
        title: 'การประชุมที่กำลังจะมาถึง',
        message: `${m.title} — ${new Date(m.startAt).toLocaleString('th-TH')}`,
        type: 'meeting' as const,
        at: m.startAt,
      })) satisfies NotificationItem[]
    },
  })
}

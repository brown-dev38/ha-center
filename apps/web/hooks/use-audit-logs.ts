'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchAuditLogs,
  fetchAuditLogStats,
  type AuditLogQuery,
} from '@/app/admin/audit-log-api'

export function useAuditLogs(query: AuditLogQuery = {}) {
  return useQuery({
    queryKey: ['audit-logs', query],
    queryFn: () => fetchAuditLogs(query),
    placeholderData: (prev) => prev,
  })
}

export function useAuditLogStats(days = 7) {
  return useQuery({
    queryKey: ['audit-logs', 'stats', days],
    queryFn: () => fetchAuditLogStats(days),
    refetchInterval: 60_000,
  })
}

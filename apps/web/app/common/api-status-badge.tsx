'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/app/common/utils'
import { CLIENT_POLLING } from '@/app/common/client-polling'

type HealthPayload = {
  ok?: boolean
  legacyProxy?: boolean
  database?: boolean
  mode?: string
  code?: string
  error?: string
}

type Status = 'checking' | 'native' | 'database' | 'stale' | 'offline'

const STALE_CODES = new Set([
  'API_BACKEND_UNREACHABLE',
  'LEGACY_API_PROXY_DISABLED',
  'LEGACY_API_PROXY_ENABLED',
  'API_PROXY_ENV_STILL_SET',
])

const DATABASE_CODES = new Set(['DATABASE_URL_MISSING', 'DATABASE_UNAVAILABLE', 'DATABASE_SCHEMA_MISMATCH'])

export function ApiStatusBadge({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>('checking')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        const text = await res.text()
        let json: HealthPayload = {}
        try {
          json = JSON.parse(text) as HealthPayload
        } catch {
          if (!cancelled) {
            setStatus('offline')
            setDetail('ตอบกลับไม่ใช่ JSON')
          }
          return
        }

        if (cancelled) return

        if (json.database === true) {
          setStatus('native')
          setDetail(json.mode ?? 'web-native')
          return
        }

        if (
          json.database === false ||
          (json.code != null && DATABASE_CODES.has(json.code))
        ) {
          setStatus('database')
          setDetail(json.code ?? json.error ?? 'DATABASE_UNAVAILABLE')
          return
        }

        if (json.ok === true && res.ok) {
          setStatus('native')
          setDetail(json.mode ?? 'web-native')
          return
        }

        if (json.code && STALE_CODES.has(json.code)) {
          setStatus('stale')
          setDetail(json.code)
          return
        }

        if (json.legacyProxy === true) {
          setStatus('stale')
          setDetail('legacy proxy')
          return
        }

        setStatus('offline')
        setDetail(json.code ?? json.error ?? `HTTP ${res.status}`)
      } catch {
        if (!cancelled) {
          setStatus('offline')
          setDetail('ไม่ตอบสนอง')
        }
      }
    }

    check()
    const timer = setInterval(check, CLIENT_POLLING.apiHealthMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  if (status === 'native') return null

  const config = {
    checking: { label: 'กำลังตรวจสอบ API', dot: 'bg-amber-400 animate-pulse' },
    native: { label: 'API พร้อม', dot: 'bg-emerald-500' },
    database: { label: 'เชื่อมต่อฐานข้อมูลไม่ได้', dot: 'bg-amber-500' },
    stale: { label: 'API ตั้งค่า proxy เก่า', dot: 'bg-amber-500' },
    offline: { label: 'API ไม่ตอบสนอง', dot: 'bg-rose-500' },
  }[status]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm',
        className
      )}
      title={detail || undefined}
    >
      <span className={cn('size-2 rounded-full', config.dot)} aria-hidden />
      {config.label}
    </div>
  )
}

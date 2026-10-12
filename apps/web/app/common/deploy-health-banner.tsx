'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

type Health = {
  ok?: boolean
  legacyProxy?: boolean
  database?: boolean
  code?: string
  mode?: string
  error?: string
}

export function DeployHealthBanner() {
  const [health, setHealth] = useState<Health | null>(null)
  const [host, setHost] = useState('')

  useEffect(() => {
    setHost(window.location.host)

    let cancelled = false
    fetch('/api/health', { cache: 'no-store' })
      .then(async (res) => {
        const text = await res.text()
        try {
          return JSON.parse(text) as Health
        } catch {
          return { ok: false, legacyProxy: true } satisfies Health
        }
      })
      .then((json) => {
        if (!cancelled) setHealth(json)
      })
      .catch(() => {
        if (!cancelled) setHealth({ ok: false, legacyProxy: true })
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (health === null) return null

  const isNative = health.database === true || (health.ok === true && health.database !== false)
  if (isNative) return null

  const dbIssue =
    health.database === false ||
    health.code === 'DATABASE_URL_MISSING' ||
    health.code === 'DATABASE_UNAVAILABLE'

  const onVercel = host.includes('vercel.app')

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <div className="mx-auto flex max-w-5xl gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">
            {dbIssue ? 'ยังเชื่อมต่อฐานข้อมูล MySQL ไม่ได้' : 'API ยังเป็นเวอร์ชันเก่าหรือตั้งค่า proxy ไม่ถูกต้อง'}
          </p>
          {dbIssue && health.error ? (
            <p>{health.error}</p>
          ) : onVercel ? (
            <p>
              คุณเปิด <strong>{host}</strong> (โหมด Demo) — ตั้ง{' '}
              <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> เป็น MySQL คลาวด์
              รัน <code className="rounded bg-amber-100 px-1">db:push</code> +{' '}
              <code className="rounded bg-amber-100 px-1">db:seed</code> แล้ว Redeploy · ดู{' '}
              <code className="rounded bg-amber-100 px-1">DEPLOY-VERCEL.md</code>
            </p>
          ) : (
            <p>
              ปิด dev server เก่า แล้วดับเบิลคลิก <strong>start-web.cmd</strong> ที่โฟลเดอร์โปรเจกต์
              (อย่าใช้ <code className="rounded bg-amber-100 px-1">npm run dev</code> ถ้า bun ไม่อยู่ใน
              PATH)
            </p>
          )}
          <p className="text-xs text-amber-800/90">
            ตรวจสอบ:{' '}
            <a className="underline" href="/api/health" target="_blank" rel="noreferrer">
              /api/health
            </a>
            {health.code ? ` (รหัส: ${health.code})` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

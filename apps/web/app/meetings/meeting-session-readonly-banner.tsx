'use client'

import { Eye } from 'lucide-react'
import type { MeetingSessionRole } from '@/app/meetings/meeting-session-access'

type Role = MeetingSessionRole

const ROLE_COPY: Record<Role, { title: string; hint: string }> = {
  participant: {
    title: 'โหมดผู้เข้าร่วม — ดูอย่างเดียว',
    hint: 'เนื้อหาวาระและเวลานำเสนออัปเดตโดยผู้จัดการประชุม คุณไม่สามารถแก้ไขหรือควบคุมได้',
  },
  viewer: {
    title: 'โหมดดูอย่างเดียว',
    hint: 'คุณสามารถติดตามวาระและเวลาการนำเสนอได้ แต่ไม่มีสิทธิ์แก้ไข',
  },
  organizer: {
    title: '',
    hint: '',
  },
}

export function MeetingSessionReadonlyBanner({ role }: { role: Role }) {
  if (role === 'organizer') return null
  const copy = ROLE_COPY[role]

  return (
    <div className="flex gap-3 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 shadow-sm print:hidden">
      <Eye className="mt-0.5 size-5 shrink-0 text-sky-600" />
      <div>
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-0.5 text-xs text-sky-800/90">{copy.hint}</p>
      </div>
    </div>
  )
}

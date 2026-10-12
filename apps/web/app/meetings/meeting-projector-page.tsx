'use client'

import { useParams } from 'next/navigation'
import { MeetingProjectorOverlay } from '@/app/meetings/meeting-projector-overlay'

/** หน้าโปรเจคเตอร์แยก — เปิดบนจอที่สอง รับสัญญาณจากหน้าควบคุมผ่าน BroadcastChannel */
export function MeetingProjectorPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : ''

  if (!id) {
    return (
      <p className="flex min-h-screen items-center justify-center bg-white text-muted-foreground">
        ไม่พบรหัสการประชุม
      </p>
    )
  }

  return <MeetingProjectorOverlay meetingId={id} standalone />
}

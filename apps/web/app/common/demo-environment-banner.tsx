'use client'

import { Info } from 'lucide-react'
import { isPublicDemoMode } from '@/app/common/demo-mode'

export function DemoEnvironmentBanner() {
  if (!isPublicDemoMode()) return null

  return (
    <div
      role="status"
      className="border-b border-sky-300 bg-sky-50 px-4 py-2.5 text-sm text-sky-950"
    >
      <div className="mx-auto flex max-w-5xl items-start gap-2">
        <Info className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden />
        <p>
          <strong>ระบบทดลอง (Demo)</strong> — สำหรับให้ผู้ใช้ลองเล่นก่อนขึ้นเซิร์ฟเวอร์ภายในโรงพยาบาล
          อย่าใส่ข้อมูลจริงของผู้ป่วยหรือข้อมูลลับของ รพ.
        </p>
      </div>
    </div>
  )
}

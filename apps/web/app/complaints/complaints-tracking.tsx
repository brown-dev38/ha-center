'use client'

import { useEffect, useMemo, useState } from 'react'
import { ComplaintsFrame } from '@/app/complaints/complaints-frame'
import {
  COMPLAINT_DEPARTMENTS,
  COMPLAINT_PRIORITY_LABEL,
  COMPLAINT_STATUSES,
  COMPLAINT_STATUS_LABEL,
  formatThaiDate,
  type ComplaintCase,
  type ComplaintStatus,
} from '@/app/complaints/complaint-model'
import { loadComplaintCases, updateComplaintCase } from '@/app/complaints/complaint-store'
import { showSuccessToast } from '@/app/common/toast-store'
import { Button } from '@/components/ui/button'

export function ComplaintsTracking() {
  const [cases, setCases] = useState<ComplaintCase[]>([])
  const [includeClosed, setIncludeClosed] = useState(false)

  useEffect(() => {
    setCases(loadComplaintCases())
  }, [])

  const rows = useMemo(
    () => cases.filter((item) => includeClosed || item.status !== 'closed'),
    [cases, includeClosed]
  )

  const save = (item: ComplaintCase) => {
    setCases(updateComplaintCase(item.id, item))
    showSuccessToast(`บันทึก ${item.caseNo} แล้ว`)
  }

  return (
    <ComplaintsFrame
      title="ติดตามเรื่อง"
      description="มอบหมายหน่วยงาน เปลี่ยนสถานะ และบันทึกผลการตอบกลับ"
    >
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={includeClosed}
          onChange={(event) => setIncludeClosed(event.target.checked)}
        />
        แสดงเรื่องที่ปิดแล้ว
      </label>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          ไม่มีเรื่องที่ต้องติดตาม
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <TrackingCard key={item.id} item={item} onSave={save} />
          ))}
        </div>
      )}
    </ComplaintsFrame>
  )
}

function TrackingCard({ item, onSave }: { item: ComplaintCase; onSave: (item: ComplaintCase) => void }) {
  const [draft, setDraft] = useState(item)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-bold text-slate-900">{draft.caseNo}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {formatThaiDate(draft.submittedAt)} · {COMPLAINT_PRIORITY_LABEL[draft.priority]} · {draft.department}
          </p>
        </div>
        <Button type="button" onClick={() => onSave(draft)}>
          บันทึก
        </Button>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-700">{draft.detail}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-xs font-semibold text-slate-600">
          สถานะ
          <select
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as ComplaintStatus })}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium"
          >
            {COMPLAINT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {COMPLAINT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-600">
          หน่วยงาน
          <select
            value={draft.department}
            onChange={(event) => setDraft({ ...draft, department: event.target.value })}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium"
          >
            {COMPLAINT_DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-600">
          กำหนดตอบ
          <input
            type="date"
            value={draft.dueDate}
            onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          />
        </label>
      </div>
      <label className="mt-3 block space-y-1 text-xs font-semibold text-slate-600">
        บันทึกการติดตาม
        <textarea
          value={draft.responseNote}
          onChange={(event) => setDraft({ ...draft, responseNote: event.target.value })}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
        />
      </label>
    </article>
  )
}

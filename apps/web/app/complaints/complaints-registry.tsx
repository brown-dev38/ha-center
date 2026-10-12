'use client'

import { useEffect, useMemo, useState } from 'react'
import { ComplaintsFrame } from '@/app/complaints/complaints-frame'
import {
  COMPLAINT_KIND_LABEL,
  COMPLAINT_PRIORITY_LABEL,
  COMPLAINT_STATUS_LABEL,
  formatThaiDate,
  type ComplaintCase,
  type ComplaintKind,
  type ComplaintStatus,
} from '@/app/complaints/complaint-model'
import { loadComplaintCases } from '@/app/complaints/complaint-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ComplaintsRegistry() {
  const [cases, setCases] = useState<ComplaintCase[]>([])
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<ComplaintKind | 'all'>('all')
  const [status, setStatus] = useState<ComplaintStatus | 'all'>('all')
  const [selected, setSelected] = useState<ComplaintCase | null>(null)

  useEffect(() => {
    setCases(loadComplaintCases())
  }, [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cases.filter((item) => {
      if (kind !== 'all' && item.kind !== kind) return false
      if (status !== 'all' && item.status !== status) return false
      if (!q) return true
      return [item.caseNo, item.detail, item.reporterName, item.department, item.phone]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [cases, query, kind, status])

  return (
    <ComplaintsFrame
      title="ทะเบียนเรื่อง"
      description="ค้นหาเรื่องตามเลขที่ เนื้อหา ผู้แจ้ง และสถานะ"
    >
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเลขเรื่องหรือเนื้อหา" />
        <Select
          value={kind}
          onChange={(value) => setKind(value as ComplaintKind | 'all')}
          options={[['all', 'ทุกประเภท'], ...kindOptions()]}
        />
        <Select
          value={status}
          onChange={(value) => setStatus(value as ComplaintStatus | 'all')}
          options={[['all', 'ทุกสถานะ'], ...statusOptions()]}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
          {rows.length.toLocaleString('th-TH')} เรื่อง
        </div>
        <div className="max-h-[36rem] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">เลขเรื่อง</th>
                <th className="px-4 py-3 font-semibold">วันที่ส่ง</th>
                <th className="px-4 py-3 font-semibold">ประเภท</th>
                <th className="px-4 py-3 font-semibold">เรื่อง</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    ไม่พบเรื่อง
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.caseNo}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatThaiDate(item.submittedAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{COMPLAINT_KIND_LABEL[item.kind]}</td>
                    <td className="max-w-md px-4 py-3 text-slate-700">
                      <p className="line-clamp-2">{item.detail}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{COMPLAINT_STATUS_LABEL[item.status]}</td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(item)}>
                        ดู
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.caseNo}</DialogTitle>
                <DialogDescription>
                  {COMPLAINT_KIND_LABEL[selected.kind]} · {COMPLAINT_PRIORITY_LABEL[selected.priority]} ·{' '}
                  {COMPLAINT_STATUS_LABEL[selected.status]}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-slate-700">
                <p className="whitespace-pre-wrap">{selected.detail}</p>
                <p>ผู้แจ้ง: {selected.reporterName || 'ไม่ระบุชื่อ'}</p>
                <p>ติดต่อ: {[selected.contactEmail, selected.phone].filter(Boolean).join(' · ') || '—'}</p>
                <p>หน่วยงาน: {selected.department}</p>
                <p>วันที่เกิดเหตุ: {formatThaiDate(selected.incidentDate)}</p>
                {selected.evidenceUrl ? (
                  <a href={selected.evidenceUrl} target="_blank" rel="noreferrer" className="text-[#6d28d9] underline">
                    เปิดหลักฐาน
                  </a>
                ) : null}
                {selected.responseNote ? <p>บันทึกการติดตาม: {selected.responseNote}</p> : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </ComplaintsFrame>
  )
}

function kindOptions(): [string, string][] {
  return Object.entries(COMPLAINT_KIND_LABEL)
}

function statusOptions(): [string, string][] {
  return Object.entries(COMPLAINT_STATUS_LABEL)
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
    >
      {options.map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  )
}

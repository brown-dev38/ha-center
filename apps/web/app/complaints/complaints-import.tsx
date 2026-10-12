'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ComplaintsFrame } from '@/app/complaints/complaints-frame'
import { COMPLAINT_KIND_LABEL, formatThaiDate } from '@/app/complaints/complaint-model'
import { parseComplaintFile, type ComplaintDraft } from '@/app/complaints/complaint-parse'
import { importComplaintCases } from '@/app/complaints/complaint-store'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { Button } from '@/components/ui/button'

export function ComplaintsImport() {
  const router = useRouter()
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ComplaintDraft[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [reading, setReading] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setReading(true)
    try {
      const result = await parseComplaintFile(file)
      setFileName(file.name)
      setRows(result.rows)
      setWarnings(result.warnings)
    } catch (error) {
      setRows([])
      setWarnings([])
      showErrorToast(error instanceof Error ? error.message : 'อ่านไฟล์ไม่สำเร็จ')
    } finally {
      setReading(false)
    }
  }

  const confirmImport = () => {
    const result = importComplaintCases(rows, fileName)
    showSuccessToast(
      `นำเข้า ${result.added.toLocaleString('th-TH')} เรื่อง` +
        (result.skipped ? ` · ข้ามรายการซ้ำ ${result.skipped.toLocaleString('th-TH')} เรื่อง` : '')
    )
    router.push('/dashboard/complaints/registry')
  }

  return (
    <ComplaintsFrame
      title="นำเข้า Excel"
      description="รองรับไฟล์คำตอบแบบฟอร์มที่มีวันเวลา รายละเอียด ผู้แจ้ง ช่องทางติดต่อ และลิงก์หลักฐาน"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-600">
          หัวคอลัมน์ที่อ่านได้: ประทับเวลา, วันที่, รายละเอียดคำร้องเรียน/ข้อเสนอแนะ/ความคิดเห็น,
          ชื่อผู้แจ้ง, อีเมลหรือช่องทางติดต่อ, เบอร์โทร และลิงก์ Google Drive
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          {reading ? 'กำลังอ่านไฟล์...' : 'เลือกไฟล์ .xlsx .xls หรือ .csv'}
        </label>
        {warnings.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-slate-500">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {rows.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">{fileName}</h2>
              <p className="text-sm text-slate-500">ตัวอย่าง {Math.min(rows.length, 8)} จาก {rows.length.toLocaleString('th-TH')} เรื่อง</p>
            </div>
            <Button type="button" onClick={confirmImport}>
              นำเข้า {rows.length.toLocaleString('th-TH')} เรื่อง
            </Button>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">วันที่ส่ง</th>
                  <th className="px-4 py-3 font-semibold">ประเภท</th>
                  <th className="px-4 py-3 font-semibold">ผู้แจ้ง</th>
                  <th className="px-4 py-3 font-semibold">เรื่อง</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((row) => (
                  <tr key={row.fingerprint} className="border-t border-slate-100">
                    <td className="px-4 py-3 whitespace-nowrap">{formatThaiDate(row.submittedAt)}</td>
                    <td className="px-4 py-3">{COMPLAINT_KIND_LABEL[row.kind]}</td>
                    <td className="px-4 py-3">{row.reporterName || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-2">{row.detail}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </ComplaintsFrame>
  )
}

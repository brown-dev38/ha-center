'use client'

import { cn } from '@/app/common/utils'
import { PE_RATING_SCALE } from '@/app/patient-experience/pe-survey-form-content'
import type { PePart2ItemScore } from '@/app/patient-experience/pe-types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function scoreTone(score: number): string {
  if (score >= 4.7) return 'text-emerald-700'
  if (score >= 4.4) return 'text-amber-700'
  if (score >= 4.0) return 'text-orange-700'
  return 'text-rose-700'
}

function barWidth(score: number): string {
  return `${Math.max(0, Math.min(100, (score / 5) * 100))}%`
}

type PePart2ScoresPanelProps = {
  items: PePart2ItemScore[]
}

export function PePart2ScoresPanel({ items }: PePart2ScoresPanelProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-heading text-base font-bold text-slate-900">
          ส่วนที่ 2 สอบถามความพึงพอใจต่อการให้บริการในโรงพยาบาล
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          คะแนนเฉลี่ยรายข้อ 1–16 ตามแบบประเมิน (ไม่รวมคะแนน 0 = ไม่ได้ใช้บริการ)
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-600">
          {PE_RATING_SCALE.map((r) => (
            <span key={r.score}>
              <span className="font-bold text-slate-800">{r.score}</span> = {r.label}
            </span>
          ))}
        </div>
      </div>

      <div className="max-h-[28rem] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/90">
              <TableHead className="w-12 text-center">ที่</TableHead>
              <TableHead>หัวข้อ</TableHead>
              <TableHead className="w-28 text-center">คะแนนเฉลี่ย</TableHead>
              <TableHead className="w-40">ระดับ</TableHead>
              <TableHead className="w-20 text-center">n</TableHead>
              <TableHead className="w-24 text-center">ไม่ได้ใช้ (0)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.questionNo}>
                <TableCell className="text-center text-sm font-semibold text-slate-600">
                  {item.questionNo}
                </TableCell>
                <TableCell>
                  <p className="text-sm leading-snug text-slate-800">{item.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{item.shortLabel}</p>
                </TableCell>
                <TableCell
                  className={cn(
                    'text-center text-base font-bold tabular-nums',
                    scoreTone(item.avgScore)
                  )}
                >
                  {item.avgScore > 0 ? item.avgScore.toFixed(2) : '—'}
                </TableCell>
                <TableCell>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#6d28d9]"
                      style={{ width: barWidth(item.avgScore) }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums text-slate-600">
                  {item.responseCount || '—'}
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums text-slate-500">
                  {item.unusedCount || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

export type HscsScoreBand = 'red' | 'orange' | 'yellow' | 'green' | 'grey'

export function getScoreBand(score: number | null | undefined): HscsScoreBand {
  if (score === null || score === undefined || Number.isNaN(score)) return 'grey'
  if (score < 60) return 'red'
  if (score <= 70) return 'orange'
  if (score <= 80) return 'yellow'
  return 'green'
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return '—'
  return `${score.toFixed(1)}%`
}

export const HSCS_BAND_LABELS: Record<HscsScoreBand, string> = {
  red: 'ควรพัฒนาด่วน',
  orange: 'เร่งพัฒนา',
  yellow: 'ควรพัฒนาต่อเนื่อง',
  green: 'ควรส่งเสริม',
  grey: 'ไม่มีข้อมูล',
}

export const HSCS_BAND_STYLES: Record<
  HscsScoreBand,
  { bg: string; text: string; border: string; subBg: string; subText: string }
> = {
  red: {
    bg: 'bg-[#dc2626]',
    text: 'text-white',
    border: 'border-[#b91c1c]',
    subBg: 'bg-[#ef4444]',
    subText: 'text-white',
  },
  orange: {
    bg: 'bg-[#ea580c]',
    text: 'text-white',
    border: 'border-[#c2410c]',
    subBg: 'bg-[#f97316]',
    subText: 'text-white',
  },
  yellow: {
    bg: 'bg-[#eab308]',
    text: 'text-[#422006]',
    border: 'border-[#ca8a04]',
    subBg: 'bg-[#facc15]',
    subText: 'text-[#422006]',
  },
  green: {
    bg: 'bg-[#16a34a]',
    text: 'text-white',
    border: 'border-[#15803d]',
    subBg: 'bg-[#22c55e]',
    subText: 'text-white',
  },
  grey: {
    bg: 'bg-slate-400',
    text: 'text-white',
    border: 'border-slate-500',
    subBg: 'bg-slate-300',
    subText: 'text-slate-800',
  },
}

export const HSCS_LEGEND: {
  band: HscsScoreBand
  range: string
  description: string
}[] = [
  { band: 'green', range: '> 80%', description: 'ควรส่งเสริม' },
  { band: 'yellow', range: '70.1–80%', description: 'ควรพัฒนาต่อเนื่อง' },
  { band: 'orange', range: '60–70%', description: 'เร่งพัฒนา' },
  { band: 'red', range: '< 60%', description: 'ควรพัฒนาด่วน' },
  { band: 'grey', range: '—', description: 'ไม่มีข้อมูล' },
]

/** รายการสัญลักษณ์ตามแบบรายงาน HSCS (ไม่รวมไม่มีข้อมูล) */
export const HSCS_SYMBOL_LEGEND = [
  { band: 'green' as const, label: 'ควรส่งเสริม', swatch: '#16a34a' },
  { band: 'yellow' as const, label: 'ควรพัฒนาต่อเนื่อง', swatch: '#eab308' },
  { band: 'orange' as const, label: 'เร่งพัฒนา', swatch: '#ea580c' },
  { band: 'red' as const, label: 'ควรพัฒนาด่วน', swatch: '#dc2626' },
]

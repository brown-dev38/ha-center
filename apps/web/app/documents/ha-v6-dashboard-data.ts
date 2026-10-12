export type HaV6ProgressRow = {
  id: string
  section: string
  total: number
  notStarted: number
  inProgress: number
  review: number
  completed: number
}

export const HA_V6_DASHBOARD_META = {
  title: 'แดชบอร์ดติดตามความคืบหน้าแฟ้มเอกสาร HA ฉบับที่ 6',
  subtitle:
    'โรงพยาบาลมหาวิทยาลัยพะเยา | มาตรฐาน HA ฉบับที่ 6 | มีผลบังคับใช้ 1 ตุลาคม 2569 | ISQuaEEA Accredited 2026–2030',
} as const

/** ไม่มีแถว static — ทุกหมวดคำนวณจาก tracker แล้ว */
export const HA_V6_PROGRESS_ROWS_STATIC: HaV6ProgressRow[] = []

export const HA_V6_KEY_CHANGES = [
  'บทใหม่ II-10 Digital Care (การดูแลผู้ป่วยโดยใช้เทคโนโลยีดิจิทัล) — ตอน II เพิ่มจาก II-1 ถึง II-10',
  'เนื้อหาใหม่: I-1.2c Sustainability, I-4.2c Information Security/PDPA, II-7.3 Blood Bank, III-4.3zh Critical Care, I-5 Personnel',
  'สีเขียว "ใหม่ ฉ.6" ในคอลัมน์ E บ่งชี้เอกสาร/ระบบที่ต้องสร้างใหม่สำหรับฉบับที่ 6',
  'การให้คะแนน HA ครอบคลุม 60 บท (54 บทกระบวนการ ตอน I–III + 6 บทผลลัพธ์ ตอน IV) แบ่งเป็น 5 ระดับ',
  'เกณฑ์การให้คะแนน 5 ระดับ: 1 Design → 2 Partial → 3 Effective → 4 Continuous Improvement & Integration → 5 Role',
  'แนวคิดหลัก: 3P-DALI (Design-Action-Learning-Improvement) และ 3C (Concept-Criteria-Context) มุ่งเพิ่ม Maturity',
  'มาตรฐานความปลอดภัย: เปลี่ยนจากระบบต่ออายุ 4 ปี เป็น Essential Criteria for Safety ตามประกาศสรพ.',
  '3P Safety: Patient-Personnel-People Safety',
] as const

export function sumHaV6Progress(rows: HaV6ProgressRow[]): HaV6ProgressRow {
  return rows.reduce(
    (acc, row) => ({
      id: 'total',
      section: 'รวมทั้งหมด',
      total: acc.total + row.total,
      notStarted: acc.notStarted + row.notStarted,
      inProgress: acc.inProgress + row.inProgress,
      review: acc.review + row.review,
      completed: acc.completed + row.completed,
    }),
    { id: 'total', section: 'รวมทั้งหมด', total: 0, notStarted: 0, inProgress: 0, review: 0, completed: 0 }
  )
}

export function percentCompleted(row: Pick<HaV6ProgressRow, 'total' | 'completed'>): number {
  if (row.total <= 0) return 0
  return Math.round((row.completed / row.total) * 1000) / 10
}

export function toChartRows(
  rows: HaV6ProgressRow[],
  labels: { notStarted: string; inProgress: string; review: string; completed: string }
) {
  return rows.map((row) => ({
    name: row.section,
    [labels.notStarted]: row.notStarted,
    [labels.inProgress]: row.inProgress,
    [labels.review]: row.review,
    [labels.completed]: row.completed,
    total: row.total,
    percent: percentCompleted(row),
  }))
}

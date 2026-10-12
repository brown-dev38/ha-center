/** แบบประเมินรับฟังความคิดเห็นผู้ป่วย — โรงพยาบาลมหาวิทยาลัยพะเยา (แหล่งความจริงเดียว) */

export const PE_SURVEY_TITLE = 'แบบประเมินรับฟังความคิดเห็นผู้ป่วย'
export const PE_SURVEY_ORG = 'โรงพยาบาลมหาวิทยาลัยพะเยา'
export const PE_SURVEY_SUBTITLE =
  'ส่วนที่ 1 ข้อมูลผู้ตอบ · ส่วนที่ 2 ความพึงพอใจ (คะแนน 0–5) · ส่วนที่ 3 ข้อเสนอแนะ'

export const PE_RATING_SCALE = [
  { score: 0, label: 'ไม่ได้ใช้บริการ' },
  { score: 1, label: 'น้อยที่สุด' },
  { score: 2, label: 'น้อย' },
  { score: 3, label: 'ปานกลาง' },
  { score: 4, label: 'มาก' },
  { score: 5, label: 'มากที่สุด' },
] as const

export const PE_VISIT_FREQUENCY = ['ครั้งแรก', 'มากกว่า 1 ครั้ง'] as const
export const PE_GENDER = ['ชาย', 'หญิง'] as const
export const PE_AGE_GROUPS = [
  'ต่ำกว่า 18 ปี',
  '19-35 ปี',
  '36-51 ปี',
  '52-70 ปี',
  '70 ปี ขึ้นไป',
] as const
export const PE_EDUCATION = [
  'ประถมศึกษา',
  'มัธยมศึกษา',
  'อนุปริญญา',
  'ปริญญาตรี',
  'สูงกว่าปริญญาตรี',
] as const
export const PE_RIGHTS = [
  'ไม่มีสิทธิการรักษา',
  'สวัสดิการข้าราชการ',
  'ประกันสังคม',
  'หลักประกันสุขภาพถ้วนหน้า',
  'อื่น ๆ',
] as const

export type PeServiceGroup = 'opd' | 'ipd'

export type PeSurveyDepartment = {
  id: string
  label: string
  group: PeServiceGroup
}

export const PE_PART2_QUESTIONS: string[] = [
  'แพทย์ให้ความสำคัญกับการตรวจร่างกาย เพื่อการวินิจฉัยโรค',
  'แพทย์ให้ข้อมูล / แนะนำวิธีการ และทางเลือกในการรักษา',
  'คำถามและข้อสงสัย ได้รับคำตอบที่ชัดเจนจากแพทย์',
  'แพทย์รับฟัง / พูดคุยให้ท่านคลายความกังวลในอาการเจ็บป่วย',
  'มีโอกาสได้พูดคุยกับพยาบาลหรือเจ้าหน้าที่ เรื่องอาการเจ็บป่วย',
  'พยาบาลหรือเจ้าหน้าที่ สามารถตอบคำถามและ ข้อสงสัยได้ชัดเจน',
  'ท่านได้รับการดูแลเอาใจใส่',
  'ได้มีส่วนร่วมในการตัดสินใจ ในเรื่องการรักษา',
  'ได้รับการดูแลอย่างเท่าเทียม และไม่เลือกปฏิบัติ',
  'ได้รับคำแนะนำ และขั้นตอนในการรับบริการ ของโรงพยาบาล',
  'อาการเจ็บป่วยทั้งกาย และใจได้รับการดูแลเป็นอย่างดี',
  'แพทย์ผู้ให้การรักษา เปิดโอกาสให้ผู้ป่วย/ญาติได้ซักถาม',
  'ผู้ป่วยและญาติ ได้รับข้อมูลการรักษาที่เป็นประโยชน์จนสามารถดูแลตนเองได้',
  'ได้รับข้อมูลการใช้ยา ผลข้างเคียง และอาการที่ต้องเฝ้าระวังอย่างชัดเจน',
  'ได้รับคำแนะนำอย่างชัดเจน ถึงอาการผิดปกติ ที่ต้องกลับมาพบแพทย์ และการมาตรวจตามนัด',
  'ท่านมีความพึงพอใจต่อบริการที่ได้รับจากโรงพยาบาล โดยรวม ในระดับใด',
]

/** ป้ายสั้นสำหรับกราฟ / ตารางแดชบอร์ด */
export const PE_PART2_SHORT_LABELS: string[] = [
  'แพทย์ — ตรวจร่างกาย',
  'แพทย์ — ข้อมูล/ทางเลือก',
  'แพทย์ — ตอบคำถามชัดเจน',
  'แพทย์ — คลายความกังวล',
  'พยาบาล — ได้พูดคุย',
  'พยาบาล — ตอบข้อสงสัย',
  'ได้รับการดูแลเอาใจใส่',
  'มีส่วนร่วมตัดสินใจ',
  'ดูแลเท่าเทียม',
  'คำแนะนำขั้นตอนบริการ',
  'ดูแลกายและใจ',
  'แพทย์เปิดโอกาสซักถาม',
  'ข้อมูลดูแลตนเอง',
  'ข้อมูลยา/ผลข้างเคียง',
  'อาการผิดปกติ/นัดติดตาม',
  'พึงพอใจโดยรวม',
]

export const PE_PART2_Q17 =
  'ท่านจะแนะนำญาติหรือคนรู้จัก ให้มาใช้บริการที่โรงพยาบาลนี้หรือไม่'

/** กลุ่มมิติสำหรับ Radar ตามโครงสร้างส่วนที่ 2 */
export const PE_PART2_DIMENSION_GROUPS: {
  id: string
  label: string
  questionNos: number[]
}[] = [
  { id: 'doctor', label: 'แพทย์', questionNos: [1, 2, 3, 4, 12] },
  { id: 'nurse', label: 'พยาบาล/เจ้าหน้าที่', questionNos: [5, 6, 7] },
  { id: 'participation', label: 'มีส่วนร่วม/เท่าเทียม', questionNos: [8, 9] },
  { id: 'information', label: 'ข้อมูล/คำแนะนำ', questionNos: [10, 13, 14, 15] },
  { id: 'holistic', label: 'ดูแลองค์รวม', questionNos: [11] },
  { id: 'overall', label: 'พึงพอใจโดยรวม', questionNos: [16] },
]

export const PE_PART3_SUGGESTIONS: string[] = [
  'ได้รับคำแนะนำ และขั้นตอนในการรับบริการของเจ้าหน้าที่ได้อย่างครบถ้วน',
  'เจ้าหน้าที่ดูแลเอาใจใส่ เป็นกันเอง ปฏิบัติงานเต็มที่ และได้รับบริการดี มีบริการที่เป็นเลิศ',
  'เจ้าหน้าที่ ทีมงาน มีความสามารถ มีความรู้และมีประสบการณ์ในการดูแลรักษา',
  'รพ.มีกระบวนการดูแลรักษาที่มีมาตรฐาน ทำให้มีความเชื่อมั่น และไว้วางใจในการรักษา',
  'รพ. มีบรรยากาศที่ดี ไม่แออัด สะดวกต่อการมารับบริการ',
]

export const PE_PART3_SHORT_LABELS: string[] = [
  'ด้านบุคลากร',
  'ด้านบริการ',
  'ด้านอาคารสถานที่',
  'ด้านอุปกรณ์เทคโนโลยี',
  'ด้านการประชาสัมพันธ์/ติดต่อ',
]

export const PE_PART3_THEME_DESCRIPTIONS: string[] = [
  'ทัศนคติ ความรู้ และการดูแลของแพทย์ พยาบาล และเจ้าหน้าที่',
  'ขั้นตอนการรับบริการ ความรวดเร็ว และการดูแลโดยรวม',
  'อาคาร ห้องน้ำ ที่จอดรถ ความสะอาด และบรรยากาศ',
  'เครื่องมือแพทย์ ระบบคิว และเทคโนโลยีที่ใช้บริการ',
  'การแจ้งข้อมูล ช่องทางติดต่อ และการสื่อสารกับผู้ป่วย',
]

const OPD_LABELS = [
  'ผู้ป่วยนอก 1',
  'OPD 1 ล้างแผล',
  'OPD 2 คลินิกผู้สูงอายุ',
  'OPD 2 ตรวจสุขภาพ',
  'OPD 2 คลินิกโรคมะเร็ง',
  'OPD 2 โรคผิวหนัง',
  'OPD 3 กุมารเวชกรรม',
  'ผู้ป่วยนอก 3 สูตินรีเวช',
  'ผู้ป่วยนอก 3 ตา หู คอ จมูก',
  'OPD 4 คลินิกโรคหัวใจ',
  'OPD 4 คลินิกโรคไม่ติดต่อเรื้อรัง',
  'OPD 4 อายุรศาสตร์ประสาทและสมอง',
  'OPD 4 อายุรศาสตร์ระบบทางเดินอาหารและลำไส้',
  'ศูนย์ศัลยกรรมกระดูกและข้อ',
  'ผู้ป่วยฉุกเฉิน',
  'ห้องผ่าตัด',
  'วิสัญญี',
  'รังสีวินิจฉัย',
  'กายภาพบำบัด',
  'เทคนิคการแพทย์',
  'แผนไทย',
  'แผนจีน',
  'ปฐมภูมิ (CE)',
  'เภสัชกรรม',
  'การเงิน',
  'เวชระเบียน',
  'เวรเปล',
  'จุดคัดกรอง',
] as const

const IPD_LABELS = [
  'ผู้ป่วยในสามัญ',
  'ผู้ป่วยใน 3/1',
  'ผู้ป่วยใน 3/2',
  'ผู้ป่วยวิกฤต (ICU)',
  'ห้องคลอด',
  'งานประกัน (ประกันชีวิต)',
] as const

function slugDept(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^\w\u0e00-\u0e7f]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const PE_SURVEY_DEPARTMENTS: PeSurveyDepartment[] = [
  ...OPD_LABELS.map((label) => ({ id: slugDept(label), label, group: 'opd' as const })),
  ...IPD_LABELS.map((label) => ({ id: slugDept(label), label, group: 'ipd' as const })),
]

/** รายการชื่อหน่วยงาน (สำหรับ PDF / checkbox) */
export const PE_OPD_DEPARTMENTS: string[] = [...OPD_LABELS]
export const PE_IPD_DEPARTMENTS: string[] = [...IPD_LABELS]

export type PeCommentLike = {
  department: string
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
  part3ThemeIndex?: number | null
}

const PE_PART3_THEME_KEYWORDS: { index: number; weight: number; pattern: RegExp }[] = [
  // 1. ด้านบุคลากร
  {
    index: 0,
    weight: 3,
    pattern:
      /บุคลากร|แพทย์|หมอ|พยาบาล|เจ้าหน้าที่|ทีมงาน|พนักงาน|บุคลิก|อัธยาศัย|ยิ้มแย้ม|สุภาพ|ใจดี|เอาใจใส่|เป็นกันเอง|ใส่ใจ|น้ำใจ|มารยาท|ความรู้|ประสบการณ์|เชี่ยวชาญ|ความสามารถ|ปฏิบัติงานเต็มที่|อธิบาย|ซักถาม|พูดจา/,
  },
  // 2. ด้านบริการ
  {
    index: 1,
    weight: 3,
    pattern:
      /บริการ|ขั้นตอน|รับบริการ|รอคิว|คิวนาน|รอนาน|ล่าช้า|ช้ามาก|รวดเร็ว|ลงทะเบียน|ตรวจรักษา|กระบวนการ|คุณภาพบริการ|บริการดี|เป็นเลิศ|มาตรฐานการดูแล|ดูแลรักษา|คิว/,
  },
  // 3. ด้านอาคารสถานที่
  {
    index: 2,
    weight: 3,
    pattern:
      /อาคาร|สถานที่|ห้องน้ำ|ที่จอด|จอดรถ|บรรยากาศ|แออัด|ไม่แออัด|สะอาด|สะดวก|ที่นั่ง|เก้าอี้|ทางเดิน|ลิฟต์|แอร์|อุณหภูมิ|พื้นที่|สถานพยาบาล/,
  },
  // 4. ด้านอุปกรณ์เทคโนโลยี
  {
    index: 3,
    weight: 3,
    pattern:
      /อุปกรณ์|เทคโนโลยี|เครื่องมือ|เครื่องแพทย์|คอมพิวเตอร์|ระบบคิว|คิวอิเล็ก|คีออสก์|kiosk|แอป(?:พลิเคชัน)?|แอพ|ไลน์|line|wifi|ไวไฟ|จอแสดง|เครื่องตรวจ/,
  },
  // 5. ด้านการประชาสัมพันธ์/ติดต่อ
  {
    index: 4,
    weight: 3,
    pattern:
      /ประชาสัมพันธ์|ติดต่อ|สื่อสาร|แจ้ง|ประกาศ|ช่องทาง|โทรศัพท์|สายด่วน|นัด(?:หมาย|ตรวจ)?|คำแนะนำ|ข้อมูล|ป้ายบอกทาง|ป้ายประกาศ|สอบถาม|ติดตามนัด/,
  },
]

/** จัดความคิดเห็นเข้า 5 ด้านตามหัวข้อ — คะแนนคำสำคัญสูงสุดเป็นด้านหลัก */
export function matchPart3Suggestion(text: string): number | null {
  const t = text.trim().toLowerCase()
  if (!t) return null

  const scores = [0, 0, 0, 0, 0]
  for (const { index, weight, pattern } of PE_PART3_THEME_KEYWORDS) {
    const hits = t.match(new RegExp(pattern.source, 'gi'))
    if (hits?.length) scores[index] += weight * hits.length
  }

  let best = -1
  let bestScore = 0
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i]
      best = i
    }
  }
  return bestScore > 0 ? best : null
}

/** แบ่งร้อยละ 1 ตำแหน่งทศนิยม ให้รวมครบ 100.0 (วิธีส่วนที่เหลือมากสุด) */
export function sharePercents(counts: number[]): number[] {
  const total = counts.reduce((s, n) => s + n, 0)
  if (total <= 0) return counts.map(() => 0)

  const raw = counts.map((n) => (n / total) * 100)
  const floors = raw.map((n) => Math.floor(n * 10) / 10)
  let remain = Math.round((100 - floors.reduce((s, n) => s + n, 0)) * 10)
  const order = raw
    .map((n, i) => ({ i, frac: n * 10 - Math.floor(n * 10) }))
    .sort((a, b) => b.frac - a.frac)

  const out = [...floors]
  let idx = 0
  while (remain > 0 && order.length) {
    out[order[idx % order.length].i] = Math.round((out[order[idx % order.length].i] + 0.1) * 10) / 10
    remain -= 1
    idx += 1
  }
  return out
}

export function summarizePart3Themes(comments: PeCommentLike[]) {
  const counts = PE_PART3_SUGGESTIONS.map(() => 0)
  let other = 0
  for (const c of comments) {
    const idx = resolvePart3ThemeIndex(c)
    if (idx == null) other += 1
    else counts[idx] += 1
  }
  return { counts, other }
}

export function resolvePart3ThemeIndex(comment: PeCommentLike): number | null {
  const fromText = matchPart3Suggestion(comment.text)
  if (fromText != null) return fromText
  if (typeof comment.part3ThemeIndex === 'number' && comment.part3ThemeIndex >= 0) {
    return comment.part3ThemeIndex
  }
  return null
}

function compactDeptKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u0e00-\u0e7f]+/g, '')
}

const DEPT_BY_COMPACT = new Map<string, string>()
for (const dept of PE_SURVEY_DEPARTMENTS) {
  DEPT_BY_COMPACT.set(compactDeptKey(dept.label), dept.label)
  DEPT_BY_COMPACT.set(dept.id.replace(/-/g, ''), dept.label)
}

/** รหัสสั้นที่ต้องไม่ไปปนกับคลินิกย่อย เช่น OPD 1 ≠ OPD 1 ล้างแผล */
const DEPT_SHORT_ALIASES: Record<string, string> = {
  opd1: 'ผู้ป่วยนอก 1',
  ผู้ป่วยนอก1: 'ผู้ป่วยนอก 1',
  นอก1: 'ผู้ป่วยนอก 1',
  ล้างแผล: 'OPD 1 ล้างแผล',
  icu: 'ผู้ป่วยวิกฤต (ICU)',
  er: 'ผู้ป่วยฉุกเฉิน',
}

const DEPT_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /ล้างแผล/, label: 'OPD 1 ล้างแผล' },
  { pattern: /ผู้สูงอายุ/, label: 'OPD 2 คลินิกผู้สูงอายุ' },
  { pattern: /ตรวจสุขภาพ/, label: 'OPD 2 ตรวจสุขภาพ' },
  { pattern: /มะเร็ง/, label: 'OPD 2 คลินิกโรคมะเร็ง' },
  { pattern: /ผิวหนัง/, label: 'OPD 2 โรคผิวหนัง' },
  { pattern: /กุมาร/, label: 'OPD 3 กุมารเวชกรรม' },
  { pattern: /สูติ|นรีเวช/, label: 'ผู้ป่วยนอก 3 สูตินรีเวช' },
  { pattern: /หู\s*คอ\s*จมูก|โสต|นาสิก/, label: 'ผู้ป่วยนอก 3 ตา หู คอ จมูก' },
  { pattern: /หัวใจ/, label: 'OPD 4 คลินิกโรคหัวใจ' },
  { pattern: /ไม่ติดต่อ|ncd/i, label: 'OPD 4 คลินิกโรคไม่ติดต่อเรื้อรัง' },
  { pattern: /ประสาท|สมอง/, label: 'OPD 4 อายุรศาสตร์ประสาทและสมอง' },
  { pattern: /ทางเดินอาหาร|ลำไส้/, label: 'OPD 4 อายุรศาสตร์ระบบทางเดินอาหารและลำไส้' },
  { pattern: /กระดูก/, label: 'ศูนย์ศัลยกรรมกระดูกและข้อ' },
  { pattern: /ฉุกเฉิน/, label: 'ผู้ป่วยฉุกเฉิน' },
  { pattern: /ห้องผ่าตัด|ผ่าตัด/, label: 'ห้องผ่าตัด' },
  { pattern: /วิสัญญี/, label: 'วิสัญญี' },
  { pattern: /รังสี/, label: 'รังสีวินิจฉัย' },
  { pattern: /กายภาพ/, label: 'กายภาพบำบัด' },
  { pattern: /เทคนิคการแพทย์/, label: 'เทคนิคการแพทย์' },
  { pattern: /แผนไทย/, label: 'แผนไทย' },
  { pattern: /แผนจีน/, label: 'แผนจีน' },
  { pattern: /ปฐมภูมิ/, label: 'ปฐมภูมิ (CE)' },
  { pattern: /เภสัช/, label: 'เภสัชกรรม' },
  { pattern: /การเงิน/, label: 'การเงิน' },
  { pattern: /เวชระเบียน/, label: 'เวชระเบียน' },
  { pattern: /เวรเปล|รถเปล|จุดเปล/, label: 'เวรเปล' },
  { pattern: /คัดกรอง/, label: 'จุดคัดกรอง' },
  { pattern: /icu|วิกฤต/i, label: 'ผู้ป่วยวิกฤต (ICU)' },
  { pattern: /ห้องคลอด|คลอด/, label: 'ห้องคลอด' },
  { pattern: /ประกัน/, label: 'งานประกัน (ประกันชีวิต)' },
  { pattern: /3\s*[\/\-]\s*1/, label: 'ผู้ป่วยใน 3/1' },
  { pattern: /3\s*[\/\-]\s*2/, label: 'ผู้ป่วยใน 3/2' },
  { pattern: /ผู้ป่วยในสามัญ/, label: 'ผู้ป่วยในสามัญ' },
  { pattern: /opd\s*[-_]?\s*1|ผู้ป่วยนอก\s*1/i, label: 'ผู้ป่วยนอก 1' },
]

/**
 * หัวคอลัมน์ติ๊กหน่วยงาน
 * รองรับชื่อตรงตัว และรูปแบบฟอร์ม `ครั้งนี้ท่านเข้ารับบริการแบบใด [OPD 2 โรคผิวหนัง]`
 */
export function officialDepartmentFromHeader(header: string): string | null {
  const trimmed = header.trim()
  const compact = compactDeptKey(trimmed)
  if (compact.length < 2) return null

  const direct = DEPT_BY_COMPACT.get(compact)
  if (direct) return direct

  const bracket = [...trimmed.matchAll(/\[([^\[\]]+)\]/g)].map((match) => match[1].trim()).pop()
  if (bracket) {
    const resolved = resolveSurveyDepartmentLabel(bracket)
    const inner = compactDeptKey(bracket)
    const known =
      PE_SURVEY_DEPARTMENTS.some((dept) => dept.label === resolved) &&
      (DEPT_BY_COMPACT.has(inner) ||
        Boolean(DEPT_SHORT_ALIASES[inner]) ||
        inner === compactDeptKey(resolved))
    if (known) return resolved
  }

  if (!/เข้ารับบริการ|หน่วยงาน|แผนก|คลินิก|แบบใด/.test(trimmed)) return null

  const hits = PE_SURVEY_DEPARTMENTS.filter((dept) => {
    const key = compactDeptKey(dept.label)
    return key.length >= 6 && compact.includes(key)
  }).sort((a, b) => compactDeptKey(b.label).length - compactDeptKey(a.label).length)

  if (!hits.length) return null
  const longest = compactDeptKey(hits[0].label)
  const others = hits.slice(1).filter((dept) => !longest.includes(compactDeptKey(dept.label)))
  return others.length ? null : hits[0].label
}

/**
 * จับคู่ชื่อหน่วยงานจากไฟล์กับรายการในแบบฟอร์ม
 * ไม่ใช้การค้นหาแบบคลุมคำ เพื่อไม่ให้ "OPD 1" กลายเป็น "OPD 1 ล้างแผล"
 */
export function resolveSurveyDepartmentLabel(raw: string): string {
  const t = raw.trim()
  if (!t) return 'ไม่ระบุ'

  const exact = PE_SURVEY_DEPARTMENTS.find((d) => d.label === t)
  if (exact) return exact.label

  const compact = compactDeptKey(t)
  const byCompact = DEPT_BY_COMPACT.get(compact) ?? DEPT_SHORT_ALIASES[compact]
  if (byCompact) return byCompact

  if (/^\d{1,2}$/.test(t)) {
    const index = Number(t) - 1
    if (index >= 0 && index < PE_SURVEY_DEPARTMENTS.length) {
      return PE_SURVEY_DEPARTMENTS[index].label
    }
  }

  const hits = DEPT_KEYWORDS.filter((rule) => rule.pattern.test(t))
  if (hits.length === 1) return hits[0].label

  return t
}

export function departmentMatchesId(
  row: { id: string; label: string },
  departmentId: string
): boolean {
  if (!departmentId || departmentId === 'all') return true
  if (row.id === departmentId) return true
  const official = PE_SURVEY_DEPARTMENTS.find((d) => d.id === departmentId)
  const label = resolveSurveyDepartmentLabel(row.label)
  if (!official) return label === departmentId || row.label === departmentId
  return label === official.label
}

export function mergeDepartmentCatalog<T extends {
  id: string
  label: string
  count: number
  avgSatisfaction: number
  returnRate: number
  recommendRate: number
  dissatisfactionRate: number
  part2Avgs?: number[]
}>(rows: T[]): T[] {
  const buckets = new Map<string, T>()

  for (const row of rows) {
    const label = resolveSurveyDepartmentLabel(row.label)
    const official = PE_SURVEY_DEPARTMENTS.find((d) => d.label === label)
    const next = { ...row, id: official?.id ?? row.id, label }
    const prev = buckets.get(label)
    if (!prev) {
      buckets.set(label, next)
      continue
    }
    const count = prev.count + next.count
    const weighted = (a: number, b: number) =>
      count > 0 ? (a * prev.count + b * next.count) / count : 0
    buckets.set(label, {
      ...prev,
      count,
      avgSatisfaction: Math.round(weighted(prev.avgSatisfaction, next.avgSatisfaction) * 100) / 100,
      returnRate: Math.round(weighted(prev.returnRate, next.returnRate) * 10) / 10,
      recommendRate: Math.round(weighted(prev.recommendRate, next.recommendRate) * 10) / 10,
      dissatisfactionRate:
        Math.round(weighted(prev.dissatisfactionRate, next.dissatisfactionRate) * 10) / 10,
      part2Avgs: prev.part2Avgs ?? next.part2Avgs,
    })
  }

  const officialRows = PE_SURVEY_DEPARTMENTS.map((dept) => {
    const hit = buckets.get(dept.label)
    if (hit) return hit
    return {
      ...rows[0],
      id: dept.id,
      label: dept.label,
      count: 0,
      avgSatisfaction: 0,
      returnRate: 0,
      recommendRate: 0,
      dissatisfactionRate: 0,
      part2Avgs: undefined,
    } as T
  })

  const extras = [...buckets.values()].filter(
    (row) => !PE_SURVEY_DEPARTMENTS.some((dept) => dept.label === row.label)
  )
  return [...officialRows, ...extras]
}

/**
 * จับคู่หัวคอลัมน์ CSV/XLSX → ฟิลด์แบบประเมิน PEP (ส่วนที่ 1–3)
 * รองรับชื่อคอลัมน์ภาษาไทย/อังกฤษ รหัส part2_*, และข้อความหัวข้อเต็ม/บางส่วน
 */

import {
  PE_AGE_GROUPS,
  PE_EDUCATION,
  PE_GENDER,
  PE_PART2_Q17,
  PE_PART2_QUESTIONS,
  PE_PART2_SHORT_LABELS,
  PE_PART3_SHORT_LABELS,
  PE_PART3_SUGGESTIONS,
  PE_RIGHTS,
  PE_VISIT_FREQUENCY,
  officialDepartmentFromHeader,
} from '@/app/patient-experience/pe-survey-form-content'

export type PeMappedField =
  | 'department'
  | 'departmentOther'
  | 'date'
  | 'visitFrequency'
  | 'gender'
  | 'age'
  | 'education'
  | 'rights'
  | 'recommend'
  | 'comment'
  | `part2_${number}`
  | `part3_${number}`

export type PeColumnMap = {
  /** header ต้นฉบับ → ฟิลด์ที่จับคู่ได้ */
  byHeader: Map<string, PeMappedField>
  /** ฟิลด์ → header ต้นฉบับ (คอลัมน์หลัก) */
  fields: Partial<Record<PeMappedField, string>>
  /** ข้อ 1–16 → header */
  part2Headers: (string | null)[]
  /** ธีมส่วนที่ 3 ข้อ 1–5 → header */
  part3Headers: (string | null)[]
  mappedCount: number
  unmappedHeaders: string[]
  reportLines: string[]
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

/** ทำหัวคอลัมน์ให้เทียบกันได้ */
export function normalizeHeaderKey(h: string): string {
  return cleanText(h)
    .toLowerCase()
    .replace(/["'`]/g, '')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[_./\\|:;,+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactKey(h: string): string {
  return normalizeHeaderKey(h).replace(/\s+/g, '')
}

const FIELD_ALIASES: Array<{ field: PeMappedField; aliases: string[] }> = [
  {
    field: 'department',
    aliases: [
      'department',
      'department name',
      'หน่วยงาน',
      'แผนก',
      'คลินิก',
      'หน่วยบริการ',
      'กลุ่มงาน',
      'จุดบริการ',
      'clinic',
      'service',
      'unit',
      'ครั้งนี้ท่านเข้ารับบริการแบบใด',
      'เข้ารับบริการแบบใด',
      'ประเภทบริการ',
      'งานผู้ป่วยนอก',
      'งานผู้ป่วยใน',
    ],
  },
  {
    field: 'departmentOther',
    aliases: ['department other', 'department_other', 'หน่วยงานอื่น', 'แผนกอื่น', 'อื่น ๆ ระบุหน่วยงาน'],
  },
  {
    field: 'date',
    aliases: [
      'date',
      'วันที่',
      'วันที่เข้ารับการรักษา',
      'วันเข้ารับบริการ',
      'survey date',
      'accessip time',
      'accessip_time',
      'sheet lastupdatedtime',
      'timestamp',
      'เวลา',
    ],
  },
  {
    field: 'visitFrequency',
    aliases: [
      'visit',
      'visit frequency',
      'ท่านมาใช้บริการ',
      'มาใช้บริการ',
      'ความถี่',
      'ครั้งแรก',
      'frequency',
      'first visit',
    ],
  },
  {
    field: 'gender',
    aliases: ['gender', 'sex', 'เพศ'],
  },
  {
    field: 'age',
    aliases: ['age', 'อายุ', 'ช่วงอายุ', 'age group'],
  },
  {
    field: 'education',
    aliases: ['education', 'การศึกษา', 'วุฒิการศึกษา'],
  },
  {
    field: 'rights',
    aliases: [
      'rights',
      'สิทธิการรักษา',
      'สิทธิ',
      'ประกัน',
      'coverage',
      'insurance',
      'สิทธิประโยชน์',
    ],
  },
  {
    field: 'recommend',
    aliases: [
      'recommend',
      'recommendation',
      'แนะนำ',
      'การบอกต่อ',
      'บอกต่อ',
      'nps',
      'part2 17',
      'part217',
      'q17',
      'ข้อ 17',
      'ข้อ17',
      PE_PART2_Q17,
      'ท่านจะแนะนำญาติ',
    ],
  },
  {
    field: 'comment',
    aliases: [
      'comment',
      'feedback',
      'ความคิดเห็น',
      'ข้อเสนอแนะ',
      'ข้อเสนอ',
      'answer part3 text',
      'answer_part3_text',
      'part3 text',
      'อื่น ๆ โปรดระบุ',
      'อื่นๆ โปรดระบุ',
      'หมายเหตุ',
      'suggestion',
    ],
  },
]

/** คำสำคัญเฉพาะต่อข้อส่วนที่ 2 (ลำดับสำคัญเมื่อข้อความหัวคอลัมน์ยาว) */
const PART2_KEYWORDS: string[][] = [
  ['ตรวจร่างกาย', 'วินิจฉัย'],
  ['ทางเลือกในการรักษา', 'แนะนำวิธีการ', 'ให้ข้อมูล'],
  ['คำตอบที่ชัดเจนจากแพทย์', 'ข้อสงสัย', 'คำถามและข้อสงสัย'],
  ['คลายความกังวล', 'รับฟัง', 'พูดคุยให้ท่าน'],
  ['มีโอกาสได้พูดคุยกับพยาบาล', 'พูดคุยกับพยาบาล'],
  ['พยาบาลหรือเจ้าหน้าที่ สามารถตอบ', 'ตอบคำถามและ ข้อสงสัย'],
  ['ได้รับการดูแลเอาใจใส่', 'ดูแลเอาใจใส่'],
  ['มีส่วนร่วมในการตัดสินใจ', 'ตัดสินใจ ในเรื่องการรักษา'],
  ['เท่าเทียม', 'ไม่เลือกปฏิบัติ'],
  ['ขั้นตอนในการรับบริการ ของโรงพยาบาล', 'คำแนะนำ และขั้นตอน'],
  ['ทั้งกาย และใจ', 'กาย และใจ'],
  ['เปิดโอกาสให้ผู้ป่วย', 'เปิดโอกาสให้ผู้ป่วย/ญาติ'],
  ['ดูแลตนเองได้', 'ข้อมูลการรักษาที่เป็นประโยชน์'],
  ['การใช้ยา', 'ผลข้างเคียง', 'เฝ้าระวัง'],
  ['อาการผิดปกติ', 'ตรวจตามนัด', 'กลับมาพบแพทย์'],
  ['พึงพอใจต่อบริการ', 'โดยรวม ในระดับใด', 'ความพึงพอใจโดยรวม'],
]

const PART3_KEYWORDS: string[][] = [
  ['คำแนะนำ และขั้นตอนในการรับบริการของเจ้าหน้าที่', 'ได้อย่างครบถ้วน'],
  ['เป็นกันเอง', 'บริการที่เป็นเลิศ', 'ปฏิบัติงานเต็มที่'],
  ['มีความสามารถ', 'มีประสบการณ์ในการดูแลรักษา'],
  ['มีมาตรฐาน', 'เชื่อมั่น', 'ไว้วางใจในการรักษา'],
  ['บรรยากาศที่ดี', 'ไม่แออัด', 'สะดวกต่อการมารับบริการ'],
]

function scoreKeywordHit(norm: string, keywords: string[]): number {
  let score = 0
  for (const kw of keywords) {
    const k = normalizeHeaderKey(kw)
    if (!k) continue
    if (norm.includes(k) || compactKey(norm).includes(compactKey(k))) {
      score += Math.min(12, k.length / 2)
    }
  }
  return score
}

function matchPart2ByNumber(norm: string, compact: string): number | null {
  const patterns = [
    /^part\s*2\s*[_\-]?\s*0*(\d+)$/,
    /^part2\s*0*(\d+)$/,
    /^q\s*0*(\d+)$/,
    /^ข้อ\s*0*(\d+)$/,
    /^item\s*0*(\d+)$/,
    /^question\s*0*(\d+)$/,
    /^คะแนน\s*ข้อ\s*0*(\d+)$/,
    /^satisfaction\s*0*(\d+)$/,
    /^s\s*0*(\d+)$/,
  ]
  for (const re of patterns) {
    const m = norm.match(re) || compact.match(re)
    if (!m) continue
    const n = Number(m[1])
    if (n >= 1 && n <= 16) return n
    if (n === 17) return 17
  }
  // "ส่วนที่ 2 ข้อ 3" / "ส่วนที่2-ข้อ12"
  const m2 = norm.match(/ส่วนที่\s*2.*ข้อ\s*0*(\d+)/) || compact.match(/ส่วนที่2.*ข้อ0*(\d+)/)
  if (m2) {
    const n = Number(m2[1])
    if (n >= 1 && n <= 16) return n
  }
  return null
}

function matchPart3ByNumber(norm: string, compact: string): number | null {
  const patterns = [
    /^part\s*3\s*[_\-]?\s*0*(\d+)$/,
    /^part3\s*0*(\d+)$/,
    /^theme\s*0*(\d+)$/,
    /^suggestion\s*0*(\d+)$/,
    /^ข้อเสนอแนะ\s*0*(\d+)$/,
  ]
  for (const re of patterns) {
    const m = norm.match(re) || compact.match(re)
    if (!m) continue
    const n = Number(m[1])
    if (n >= 1 && n <= 5) return n
  }
  return null
}

function findBestPart2ByText(norm: string): number | null {
  let best = -1
  let bestScore = 0
  for (let i = 0; i < PART2_KEYWORDS.length; i++) {
    const s = scoreKeywordHit(norm, [
      ...PART2_KEYWORDS[i],
      PE_PART2_QUESTIONS[i],
      PE_PART2_SHORT_LABELS[i],
    ])
    if (s > bestScore) {
      bestScore = s
      best = i
    }
  }
  // ต้องมีคะแนนพอสมควรเพื่อลด false positive
  return bestScore >= 6 ? best + 1 : null
}

function findBestPart3ByText(norm: string): number | null {
  let best = -1
  let bestScore = 0
  for (let i = 0; i < PART3_KEYWORDS.length; i++) {
    const s = scoreKeywordHit(norm, [
      ...PART3_KEYWORDS[i],
      PE_PART3_SUGGESTIONS[i],
      PE_PART3_SHORT_LABELS[i],
    ])
    if (s > bestScore) {
      bestScore = s
      best = i
    }
  }
  return bestScore >= 6 ? best + 1 : null
}

function matchAliasField(norm: string, compact: string): PeMappedField | null {
  for (const { field, aliases } of FIELD_ALIASES) {
    for (const alias of aliases) {
      const a = normalizeHeaderKey(alias)
      const ac = compactKey(alias)
      if (!a) continue
      if (norm === a || compact === ac || (a.length >= 4 && norm.includes(a))) {
        // กันชนกับหัวข้อยาวส่วนที่ 2
        if (field !== 'comment' && field !== 'recommend' && norm.length > a.length + 40) continue
        return field
      }
    }
  }
  return null
}

/**
 * สร้างแผนที่คอลัมน์จากหัวตารางไฟล์อัปโหลด
 */
export function buildPeColumnMap(headers: string[]): PeColumnMap {
  const byHeader = new Map<string, PeMappedField>()
  const fields: Partial<Record<PeMappedField, string>> = {}
  const part2Headers: (string | null)[] = Array.from({ length: 16 }, () => null)
  const part3Headers: (string | null)[] = Array.from({ length: 5 }, () => null)
  const used = new Set<string>()
  const unmappedHeaders: string[] = []

  const claim = (header: string, field: PeMappedField) => {
    if (used.has(header)) return false
    byHeader.set(header, field)
    used.add(header)
    if (!fields[field]) fields[field] = header
    return true
  }

  // รอบ 1: รหัสข้อชัดเจน (part2_1, q3, ข้อ 12)
  for (const header of headers) {
    if (!header || used.has(header)) continue
    const norm = normalizeHeaderKey(header)
    const compact = compactKey(header)
    if (!norm) continue

    const q = matchPart2ByNumber(norm, compact)
    if (q === 17) {
      claim(header, 'recommend')
      continue
    }
    if (q != null && q >= 1 && q <= 16) {
      if (!part2Headers[q - 1]) {
        part2Headers[q - 1] = header
        claim(header, `part2_${q}`)
      }
      continue
    }

    const t = matchPart3ByNumber(norm, compact)
    if (t != null) {
      if (!part3Headers[t - 1]) {
        part3Headers[t - 1] = header
        claim(header, `part3_${t}`)
      }
    }
  }

  // รอบ 2: alias ฟิลด์ส่วนที่ 1 / วันที่ / ความคิดเห็น / แนะนำ
  for (const header of headers) {
    if (!header || used.has(header)) continue
    if (officialDepartmentFromHeader(header)) continue
    const norm = normalizeHeaderKey(header)
    const compact = compactKey(header)
    const field = matchAliasField(norm, compact)
    if (!field) continue
    if (field === 'recommend' && fields.recommend) continue
    if (field.startsWith('part2_') || field.startsWith('part3_')) continue
    claim(header, field)
  }

  // รอบ 3: จับคู่ข้อความหัวข้อส่วนที่ 2 / 3
  for (const header of headers) {
    if (!header || used.has(header)) continue
    const norm = normalizeHeaderKey(header)
    if (norm.length < 8) continue

    const q = findBestPart2ByText(norm)
    if (q != null && !part2Headers[q - 1]) {
      part2Headers[q - 1] = header
      claim(header, `part2_${q}`)
      continue
    }

    const t = findBestPart3ByText(norm)
    if (t != null && !part3Headers[t - 1]) {
      part3Headers[t - 1] = header
      claim(header, `part3_${t}`)
    }
  }

  for (const header of headers) {
    if (!header) continue
    if (!used.has(header)) unmappedHeaders.push(header)
  }

  const mappedPart2 = part2Headers.filter(Boolean).length
  const mappedPart3 = part3Headers.filter(Boolean).length
  const reportLines = [
    `จับคู่คอลัมน์: ส่วนที่ 2 ${mappedPart2}/16 ข้อ` +
      (fields.recommend ? ' · ข้อ 17 (แนะนำ) ✓' : ' · ข้อ 17 ✗') +
      ` · ส่วนที่ 3 ${mappedPart3}/5 ธีม` +
      (fields.comment ? ' · ความคิดเห็น ✓' : '') +
      (fields.department || fields.departmentOther ? ' · หน่วยงาน ✓' : ' · หน่วยงาน ✗'),
  ]

  if (fields.visitFrequency || fields.gender || fields.age || fields.education || fields.rights) {
    const demo = [
      fields.visitFrequency && 'ความถี่',
      fields.gender && 'เพศ',
      fields.age && 'อายุ',
      fields.education && 'การศึกษา',
      fields.rights && 'สิทธิ',
    ].filter(Boolean)
    reportLines.push(`ส่วนที่ 1 ที่จับได้: ${demo.join(', ')}`)
  }

  if (mappedPart2 < 16) {
    const missing = part2Headers
      .map((h, i) => (h ? null : i + 1))
      .filter((n): n is number => n != null)
    if (missing.length && missing.length <= 8) {
      reportLines.push(`ยังไม่พบคอลัมน์ข้อ: ${missing.join(', ')}`)
    } else if (missing.length > 8) {
      reportLines.push(`ยังไม่พบคอลัมน์ส่วนที่ 2 จำนวน ${missing.length} ข้อ`)
    }
  }

  return {
    byHeader,
    fields,
    part2Headers,
    part3Headers,
    mappedCount: used.size,
    unmappedHeaders,
    reportLines,
  }
}

export function isLikelyRawSurvey(map: PeColumnMap, headers: string[]): boolean {
  const part2 = map.part2Headers.filter(Boolean).length
  if (part2 >= 4) return true
  const checkboxDepts = headers.filter((h) => officialDepartmentFromHeader(h)).length
  if (checkboxDepts >= 2 && part2 >= 2) return true
  const norm = headers.map(normalizeHeaderKey)
  const hasDept = Boolean(map.fields.department || map.fields.departmentOther)
  const hasClassic = norm.some((h) => /^part2/.test(h) || /^q\d+$/.test(h))
  return hasDept && (hasClassic || part2 >= 2)
}

export function getRowValue(
  row: Record<string, unknown>,
  map: PeColumnMap,
  field: PeMappedField
): string {
  const header = map.fields[field]
  if (!header) return ''
  return cleanText(row[header])
}

/** แปลงค่าคะแนน Likert จากตัวเลขหรือข้อความไทย */
export function parseLikertCell(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 0 && value <= 5) return Math.round(value)
    return null
  }
  const raw = cleanText(value)
  if (!raw) return null

  const asNum = Number(raw.replace(/,/g, ''))
  if (Number.isFinite(asNum) && asNum >= 0 && asNum <= 5) return Math.round(asNum)

  const lower = raw.toLowerCase()
  if (/ไม่ได้ใช้|ไม่ใช้บริการ|n\/?a|na|none/.test(lower)) return 0
  if (/น้อยที่สุด|very\s*low|1\s*=/.test(lower)) return 1
  if (/^น้อย$|low(?!\s*est)/.test(lower)) return 2
  if (/ปานกลาง|medium|moderate|average/.test(lower)) return 3
  if (/มากที่สุด|very\s*high|excellent/.test(lower)) return 5
  if (/^มาก$|high|good/.test(lower)) return 4

  // "4 - มาก" / "5=มากที่สุด"
  const m = raw.match(/^([0-5])\b/)
  if (m) return Number(m[1])
  return null
}

export function collectPart2FromMap(
  row: Record<string, unknown>,
  map: PeColumnMap
): (number | null)[] {
  return map.part2Headers.map((header) => {
    if (!header) return null
    return parseLikertCell(row[header])
  })
}

export function parseRecommendValue(value: unknown): boolean | null {
  const raw = cleanText(value)
  if (!raw) return null
  if (/ไม่แนะนำ|ไม่บอกต่อ/.test(raw)) return false
  if (/^(no|false|0)$/i.test(raw)) return false
  if (/แนะนำ|บอกต่อ/.test(raw)) return true
  if (/^(yes|true|1)$/i.test(raw)) return true
  return null
}

export function collectPart3FromMap(row: Record<string, unknown>, map: PeColumnMap): number[] {
  const checked: number[] = []
  map.part3Headers.forEach((header, i) => {
    if (!header) return
    const v = cleanText(row[header])
    if (!v) return
    const likert = parseLikertCell(v)
    if (likert !== null && likert >= 1) {
      checked.push(i)
      return
    }
    if (/1|true|yes|✓|✔|x|ใช่|เลือก|มี|✓/.test(v) && !/ไม่|0|false|no/i.test(v)) {
      checked.push(i)
    }
  })
  return checked
}

function canonicalizeOption(raw: string, options: readonly string[]): string | null {
  const t = cleanText(raw)
  if (!t) return null
  const exact = options.find((o) => o === t)
  if (exact) return exact
  const lower = t.toLowerCase()
  const fuzzy = options.find(
    (o) => lower.includes(o.toLowerCase()) || o.toLowerCase().includes(lower)
  )
  return fuzzy ?? null
}

export function canonicalizeVisitFrequency(raw: string): string | null {
  const t = cleanText(raw)
  if (!t) return null
  if (/ครั้งแรก|first/i.test(t)) return PE_VISIT_FREQUENCY[0]
  if (/มากกว่า|มากกว่า 1|ซ้ำ|เคยมา|more than|return/i.test(t)) return PE_VISIT_FREQUENCY[1]
  return canonicalizeOption(t, PE_VISIT_FREQUENCY)
}

export function canonicalizeGender(raw: string): string | null {
  const t = cleanText(raw)
  if (!t) return null
  if (/ชาย|male|^m$/i.test(t)) return PE_GENDER[0]
  if (/หญิง|female|^f$/i.test(t)) return PE_GENDER[1]
  return canonicalizeOption(t, PE_GENDER)
}

export function canonicalizeAge(raw: string): string | null {
  const t = cleanText(raw)
  if (!t) return null
  const n = Number(t.replace(/[^\d.]/g, ''))
  if (Number.isFinite(n) && n > 0) {
    if (n < 18) return PE_AGE_GROUPS[0]
    if (n <= 35) return PE_AGE_GROUPS[1]
    if (n <= 51) return PE_AGE_GROUPS[2]
    if (n <= 70) return PE_AGE_GROUPS[3]
    return PE_AGE_GROUPS[4]
  }
  if (/ต่ำกว่า\s*18|ต่ำกว่า18|< ?18|under 18/i.test(t)) return PE_AGE_GROUPS[0]
  if (/19\s*[-–]\s*35|19-35/.test(t)) return PE_AGE_GROUPS[1]
  if (/36\s*[-–]\s*51|36-51/.test(t)) return PE_AGE_GROUPS[2]
  if (/52\s*[-–]\s*70|52-70/.test(t)) return PE_AGE_GROUPS[3]
  if (/70\s*ปี|70\+|ขึ้นไป|> ?70/i.test(t)) return PE_AGE_GROUPS[4]
  return canonicalizeOption(t, PE_AGE_GROUPS)
}

export function canonicalizeEducation(raw: string): string | null {
  const t = cleanText(raw)
  if (!t) return null
  if (/สูงกว่า|โท|เอก|master|phd|post/i.test(t)) return PE_EDUCATION[4]
  if (/ปริญญาตรี|bachelor|ป\.ตรี/i.test(t)) return PE_EDUCATION[3]
  if (/อนุปริญญา|diploma|ปวส|ปวช/i.test(t)) return PE_EDUCATION[2]
  if (/มัธยม|ม\.ต้น|ม\.ปลาย|secondary|high school/i.test(t)) return PE_EDUCATION[1]
  if (/ประถม|primary|elementary/i.test(t)) return PE_EDUCATION[0]
  return canonicalizeOption(t, PE_EDUCATION)
}

export function canonicalizeRights(raw: string): string | null {
  const t = cleanText(raw)
  if (!t) return null
  if (/ไม่มีสิทธิ|自费|self|จ่ายเอง/i.test(t)) return PE_RIGHTS[0]
  if (/ข้าราชการ|civil|กรมบัญชี/i.test(t)) return PE_RIGHTS[1]
  if (/ประกันสังคม|social security|สปส/i.test(t)) return PE_RIGHTS[2]
  if (/หลักประกัน|บัตรทอง|uc|universal|สปสช/i.test(t)) return PE_RIGHTS[3]
  if (/อื่น|other/i.test(t)) return PE_RIGHTS[4]
  return canonicalizeOption(t, PE_RIGHTS)
}

export type DemoCounters = {
  visitFrequency: Map<string, number>
  gender: Map<string, number>
  age: Map<string, number>
  education: Map<string, number>
  rights: Map<string, number>
}

export function createDemoCounters(): DemoCounters {
  return {
    visitFrequency: new Map(),
    gender: new Map(),
    age: new Map(),
    education: new Map(),
    rights: new Map(),
  }
}

function bump(map: Map<string, number>, key: string | null) {
  if (!key) return
  map.set(key, (map.get(key) ?? 0) + 1)
}

export function accumulateDemographics(
  counters: DemoCounters,
  row: Record<string, unknown>,
  map: PeColumnMap
) {
  bump(counters.visitFrequency, canonicalizeVisitFrequency(getRowValue(row, map, 'visitFrequency')))
  bump(counters.gender, canonicalizeGender(getRowValue(row, map, 'gender')))
  bump(counters.age, canonicalizeAge(getRowValue(row, map, 'age')))
  bump(counters.education, canonicalizeEducation(getRowValue(row, map, 'education')))
  bump(counters.rights, canonicalizeRights(getRowValue(row, map, 'rights')))
}

export function demoCountersToBuckets(counters: DemoCounters) {
  const toBuckets = (order: readonly string[], map: Map<string, number>) =>
    order
      .map((label) => ({ label, count: map.get(label) ?? 0 }))
      .filter((b) => b.count > 0)

  return {
    visitFrequency: toBuckets(PE_VISIT_FREQUENCY, counters.visitFrequency),
    gender: toBuckets(PE_GENDER, counters.gender),
    age: toBuckets(PE_AGE_GROUPS, counters.age),
    education: toBuckets(PE_EDUCATION, counters.education),
    rights: toBuckets(PE_RIGHTS, counters.rights),
  }
}

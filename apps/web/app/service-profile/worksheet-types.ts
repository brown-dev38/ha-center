export const WORKSHEET_STORAGE_KEY = 'ha-unit-profile-worksheet'

/** Vision โรงพยาบาล — ข้อความคงที่ */
export const VISION_HOSPITAL =
  'โรงพยาบาลโรงเรียนแพทย์ชั้นนำของภาคเหนือที่ให้บริการทางการแพทย์อย่างมีคุณภาพแก่ชุมชนและสังคม'

/** Core Value องค์กร — ข้อความคงที่ */
export const CORE_VALUE = `MEDUP
M = Moral and Integrity
E = Education and Organization Learning
D = Data driven
U = Unity
P = Professionalism`

/** เข็มมุ่ง (Focus area) ใต้ Vision - Faculty — ข้อความคงที่ */
export const VISION_FACULTY_FOCUS_ITEMS = [
  'Excellence service',
  'Data driven',
  'Financial sustainability',
] as const

export const VISION_FACULTY_FOCUS = `เข็มมุ่ง (Focus area)
${VISION_FACULTY_FOCUS_ITEMS.map((item) => `• ${item}`).join('\n')}`

/** Mission (in Alignment with Organization) — ข้อความคงที่ */
export const MISSION_ALIGNMENT_FIXED_ITEMS = [
  'ให้บริการทางการแพทย์ที่มีคุณภาพ: ครอบคลุมโรคซับซ้อนด้วยมาตรฐานสากลและหัวใจความเป็นมนุษย์',
  'การสร้างวิจัยและนวัตกรรม: นำไปใช้ประโยชน์ภายในองค์กรและภายนอกระดับชาติและนานาชาติ',
  'การจัดการเรียนการสอน: เพื่อผลิตบัณฑิตทางด้านการแพทย์ที่มีภูมิปัญญาความเป็นมืออาชีพและมีภาวะผู้นำในการดูแลสุขภาพแบบองค์รวม',
  'ทำนุบำรุงศิลปวัฒนธรรมและสืบสานประเพณี',
  'บริหารด้านหลักธรรมาภิบาลและพัฒนาองค์กรอย่างต่อเนื่อง',
] as const

/** Strategy (MED UP) — ข้อความคงที่ */
export const STRATEGY_MED_UP_FIXED_ITEMS = [
  'ยุทธศาสตร์ที่ 1 ModernizedHuman capital บริหารทรัพยากรมนุษย์ศตวรรษที่ 21 ',
  'ยุทธศาสตร์ที่ 2 Excellence of Service and Healthcare ศูนย์ความเป็นเลิศบริการที่ได้มาตรฐาน',
  'ยุทธศาสตร์ที่ 3 Digital technology for AI transformation ปัญญาประดิษฐ์ smart hospital',
  'ยุทธศาสตร์ที่ 4 Uplifting Management Organiztion for sustainability บริหารอย่างยั่งยืน',
  'ยุทธศาสตร์ที่ 5 Professional for Academic and Research งานวิจัย/นวัตกรรม/การเรียนการสอน',

  

] as const

export type RiskMatrixCell = {
  likelihood: number
  consequence: number
  note?: string
}

/** หัวข้อประเมินความเสี่ยง 1 รายการ (รองรับหลายหัวข้อ) */
export type RiskAssessment = {
  id: string
  topic: string
  cells: RiskMatrixCell[]
}

export type CqiProgressRow = {
  topic: string
  result: string
}

export type CqiDevelopmentStep = {
  content: string
}

export type CqiDevelopmentPlan = {
  id: string
  year: string
  title: string
  owner: string
  objective: string
  timeline: string
  steps: CqiDevelopmentStep[]
}

export type DaliFrameworkData = {
  keyProcess: string
  coreValues: string
  context: string
  criteria: string
  purpose: string
  design: string
  action: string
  learning: string
  improve: string
  spread: string
  patientCare: string
  monitorLearning: string
}

export type UnitProfileWorksheet = {
  date: string
  unitHeader: string

  unit: string
  visionFaculty: string
  visionFacultyFocus: string
  visionHospital: string
  coreValue: string

  missionOfUnit: string[]
  missionAlignment: string[]

  strategyMedUp: string[]
  unitStrategy: string[]

  /** ประเมินความเสี่ยงหลายหัวข้อ */
  riskAssessments: RiskAssessment[]

  /** @deprecated ใช้ riskAssessments แทน */
  riskTopic: string
  /** @deprecated ใช้ riskAssessments แทน */
  riskCells: RiskMatrixCell[]

  cqiInProgress: {
    y2023: CqiProgressRow[]
    y2024: CqiProgressRow[]
    y2025: CqiProgressRow[]
  }

  daliFramework: DaliFrameworkData

  /** แผน CQI พัฒนาคุณภาพ — รองรับหลายโครงการ */
  cqiPlans: CqiDevelopmentPlan[]

  /** @deprecated ใช้ cqiPlans แทน — คงไว้เพื่อเอกสารเก่า */
  cqiPlanYear: string
  /** @deprecated ใช้ cqiPlans แทน */
  cqiTitle: string
  /** @deprecated ใช้ cqiPlans แทน */
  cqiOwner: string
  /** @deprecated ใช้ cqiPlans แทน */
  cqiObjective: string
  /** @deprecated ใช้ cqiPlans แทน */
  cqiTimeline: string
  /** @deprecated ใช้ cqiPlans แทน */
  cqiSteps: CqiDevelopmentStep[]

  kpiIndicators: string[]
  kpiResults: string[]
  bestPractices: string[]

  preparedBy: string
}

export function createEmptyDaliFramework(): DaliFrameworkData {
  return {
    keyProcess: '',
    coreValues: '',
    context: '',
    criteria: '',
    purpose: '',
    design: '',
    action: '',
    learning: '',
    improve: '',
    spread: '',
    patientCare: '',
    monitorLearning: '',
  }
}

function newCqiPlanId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `cqi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function newRiskAssessmentId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `risk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyRiskAssessment(partial?: Partial<RiskAssessment>): RiskAssessment {
  return {
    id: partial?.id ?? newRiskAssessmentId(),
    topic: partial?.topic ?? '',
    cells: Array.isArray(partial?.cells) ? partial!.cells.map((c) => ({ ...c })) : [],
  }
}

function legacyRiskHasContent(raw: Partial<UnitProfileWorksheet>): boolean {
  return Boolean(raw.riskTopic?.trim() || (raw.riskCells && raw.riskCells.length > 0))
}

function riskAssessmentHasContent(item: RiskAssessment): boolean {
  return Boolean(item.topic.trim() || item.cells.length > 0)
}

/** รวมหลายหัวข้อ + migrate จากฟิลด์เก่า — มีอย่างน้อย 1 หัวข้อ */
export function resolveRiskAssessments(raw?: Partial<UnitProfileWorksheet> | null): RiskAssessment[] {
  const fromArray = Array.isArray(raw?.riskAssessments)
    ? raw!.riskAssessments!.map((a) =>
        createEmptyRiskAssessment({
          id: a.id,
          topic: a.topic,
          cells: a.cells,
        })
      )
    : []

  if (fromArray.length > 0) return fromArray

  if (raw && legacyRiskHasContent(raw)) {
    return [
      createEmptyRiskAssessment({
        topic: raw.riskTopic ?? '',
        cells: raw.riskCells ?? [],
      }),
    ]
  }

  return [createEmptyRiskAssessment()]
}

export function syncLegacyRiskFields(assessments: RiskAssessment[]) {
  const primary = assessments[0] ?? createEmptyRiskAssessment()
  return {
    riskTopic: primary.topic,
    riskCells: primary.cells,
  }
}

export function isRiskAssessmentsFilled(assessments: RiskAssessment[]): boolean {
  return assessments.some(riskAssessmentHasContent)
}

export function createEmptyCqiPlan(partial?: Partial<CqiDevelopmentPlan>): CqiDevelopmentPlan {
  return {
    id: partial?.id ?? newCqiPlanId(),
    year: partial?.year ?? '',
    title: partial?.title ?? '',
    owner: partial?.owner ?? '',
    objective: partial?.objective ?? '',
    timeline: partial?.timeline ?? '',
    steps:
      partial?.steps?.length === 5
        ? partial.steps.map((s) => ({ content: s.content ?? '' }))
        : Array.from({ length: 5 }, () => ({ content: '' })),
  }
}

function legacyPlanHasContent(raw: Partial<UnitProfileWorksheet>): boolean {
  return Boolean(
    raw.cqiPlanYear?.trim() ||
      raw.cqiTitle?.trim() ||
      raw.cqiOwner?.trim() ||
      raw.cqiObjective?.trim() ||
      raw.cqiTimeline?.trim() ||
      raw.cqiSteps?.some((s) => s.content?.trim())
  )
}

function planHasContent(plan: CqiDevelopmentPlan): boolean {
  return Boolean(
    plan.year.trim() ||
      plan.title.trim() ||
      plan.owner.trim() ||
      plan.objective.trim() ||
      plan.timeline.trim() ||
      plan.steps.some((s) => s.content.trim())
  )
}

/** รวมแผนใหม่ + migrate จากฟิลด์เก่า — รับประกันมีอย่างน้อย 1 แผน */
export function resolveCqiPlans(raw?: Partial<UnitProfileWorksheet> | null): CqiDevelopmentPlan[] {
  const fromArray = Array.isArray(raw?.cqiPlans)
    ? raw!.cqiPlans!.map((p) =>
        createEmptyCqiPlan({
          id: p.id,
          year: p.year,
          title: p.title,
          owner: p.owner,
          objective: p.objective,
          timeline: p.timeline,
          steps: p.steps,
        })
      )
    : []

  if (fromArray.length > 0) return fromArray

  if (raw && legacyPlanHasContent(raw)) {
    return [
      createEmptyCqiPlan({
        year: raw.cqiPlanYear ?? '',
        title: raw.cqiTitle ?? '',
        owner: raw.cqiOwner ?? '',
        objective: raw.cqiObjective ?? '',
        timeline: raw.cqiTimeline ?? '',
        steps: raw.cqiSteps,
      }),
    ]
  }

  return [createEmptyCqiPlan()]
}

/** sync ฟิลด์เก่าจากแผนแรก — ให้ deriveWorksheetMeta / export เดิมยังใช้ได้ */
export function syncLegacyCqiFields(plans: CqiDevelopmentPlan[]) {
  const primary = plans[0] ?? createEmptyCqiPlan()
  return {
    cqiPlanYear: primary.year,
    cqiTitle: primary.title,
    cqiOwner: primary.owner,
    cqiObjective: primary.objective,
    cqiTimeline: primary.timeline,
    cqiSteps: primary.steps,
  }
}

export function isCqiPlansFilled(plans: CqiDevelopmentPlan[]): boolean {
  return plans.some(planHasContent)
}

export function createEmptyWorksheet(): UnitProfileWorksheet {
  const emptyList = (n: number) => Array.from({ length: n }, () => '')
  const emptyRows = () => [
    { topic: '', result: '' },
    { topic: '', result: '' },
  ]

  return {
    date: '',
    unitHeader: '',
    unit: '',
    visionFaculty: '',
    visionFacultyFocus: VISION_FACULTY_FOCUS,
    visionHospital: VISION_HOSPITAL,
    coreValue: CORE_VALUE,
    missionOfUnit: emptyList(5),
    missionAlignment: [...MISSION_ALIGNMENT_FIXED_ITEMS],
    strategyMedUp: [...STRATEGY_MED_UP_FIXED_ITEMS],
    unitStrategy: emptyList(5),
    riskAssessments: [createEmptyRiskAssessment()],
    riskTopic: '',
    riskCells: [],
    cqiInProgress: {
      y2023: emptyRows(),
      y2024: emptyRows(),
      y2025: emptyRows(),
    },
    daliFramework: createEmptyDaliFramework(),
    cqiPlans: [createEmptyCqiPlan()],
    cqiPlanYear: '',
    cqiTitle: '',
    cqiOwner: '',
    cqiObjective: '',
    cqiTimeline: '',
    cqiSteps: emptyList(5).map(() => ({ content: '' })),
    kpiIndicators: emptyList(3),
    kpiResults: emptyList(3),
    bestPractices: emptyList(3),
    preparedBy: '',
  }
}

/** รวมข้อมูล remote/local กับค่าว่าง — รองรับเอกสารเก่าที่ยังไม่มี daliFramework */
export function normalizeWorksheet(raw?: Partial<UnitProfileWorksheet> | null): UnitProfileWorksheet {
  const base = createEmptyWorksheet()
  if (!raw) return base
  const cqiPlans = resolveCqiPlans(raw)
  const legacyCqi = syncLegacyCqiFields(cqiPlans)
  const riskAssessments = resolveRiskAssessments(raw)
  const legacyRisk = syncLegacyRiskFields(riskAssessments)
  return {
    ...base,
    ...raw,
    visionHospital: VISION_HOSPITAL,
    coreValue: CORE_VALUE,
    visionFacultyFocus: VISION_FACULTY_FOCUS,
    missionAlignment: [...MISSION_ALIGNMENT_FIXED_ITEMS],
    strategyMedUp: [...STRATEGY_MED_UP_FIXED_ITEMS],
    cqiInProgress: {
      ...base.cqiInProgress,
      ...raw.cqiInProgress,
      y2023: raw.cqiInProgress?.y2023 ?? base.cqiInProgress.y2023,
      y2024: raw.cqiInProgress?.y2024 ?? base.cqiInProgress.y2024,
      y2025:
        raw.cqiInProgress?.y2025 ??
        (raw.cqiInProgress as { y2026?: CqiProgressRow[] } | undefined)?.y2026 ??
        base.cqiInProgress.y2025,
    },
    daliFramework: {
      ...base.daliFramework,
      ...raw.daliFramework,
    },
    cqiPlans,
    ...legacyCqi,
    riskAssessments,
    ...legacyRisk,
  }
}

export const CQI_STEP_META = [
  {
    title: '1. Content (เนื้อหา / ประเด็น)',
    color: 'bg-pink-100 border-pink-300 text-pink-900',
    hints: [
      'Key issue/problem (ประเด็นปัญหาหลัก)',
      'Background (ความเป็นมา)',
      'Cause/Significance (สาเหตุ / ความสำคัญ)',
    ],
  },
  {
    title: '2. Concept (แนวคิด)',
    color: 'bg-orange-100 border-orange-300 text-orange-900',
    hints: [
      'Root cause analysis (วิเคราะห์สาเหตุราก)',
      'Evidence/Important Information (หลักฐาน / ข้อมูลสำคัญ)',
      'Alternative approaches (แนวทางทางเลือก)',
    ],
  },
  {
    title: '3. Content & Criteria (เนื้อหาและเกณฑ์)',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    hints: [
      'Current situation (สถานการณ์ปัจจุบัน)',
      'Related context (บริบทที่เกี่ยวข้อง)',
      'Standards/Criteria (มาตรฐาน / เกณฑ์)',
    ],
  },
  {
    title: '4. Purpose → Design (วัตถุประสงค์ → การออกแบบ)',
    color: 'bg-green-100 border-green-300 text-green-900',
    hints: [
      'CQI objectives (วัตถุประสงค์ CQI)',
      'Target group (กลุ่มเป้าหมาย)',
      'Approach/Implementation plan (แนวทาง / แผนดำเนินงาน)',
    ],
  },
  {
    title: '5. Action (การดำเนินงาน: CQI, นวัตกรรม, RCA)',
    color: 'bg-teal-100 border-teal-300 text-teal-900',
    hints: [
      'Implementation plan (แผนดำเนินงาน)',
      'Monitoring/Evaluation (ติดตาม / ประเมินผล)',
      'Continuous improvement (การปรับปรุงอย่างต่อเนื่อง)',
    ],
  },
] as const

export function riskScore(likelihood: number, consequence: number) {
  return likelihood * consequence
}

export function riskLevel(score: number): 'low' | 'moderate' | 'high' | 'extreme' {
  if (score <= 3) return 'low'
  if (score <= 6) return 'moderate'
  if (score <= 12) return 'high'
  return 'extreme'
}

export const RISK_LEVEL_CLASS: Record<ReturnType<typeof riskLevel>, string> = {
  low: 'bg-emerald-200 text-emerald-950 border-emerald-400',
  moderate: 'bg-yellow-200 text-yellow-950 border-yellow-400',
  high: 'bg-orange-300 text-orange-950 border-orange-500',
  extreme: 'bg-red-400 text-red-950 border-red-600',
}

const RISK_LEVEL_TH: Record<ReturnType<typeof riskLevel>, string> = {
  low: 'ต่ำ',
  moderate: 'ปานกลาง',
  high: 'สูง',
  extreme: 'สูงมาก',
}

export function buildRiskAssessmentSummary(cells: RiskMatrixCell[]): string {
  if (!cells.length) return 'ยังไม่ได้เลือกช่องใน Risk Matrix'

  const scored = cells.map((cell) => {
    const score = riskScore(cell.likelihood, cell.consequence)
    return { ...cell, score, level: riskLevel(score) }
  })

  const maxScore = Math.max(...scored.map((c) => c.score))
  const worst = scored.filter((c) => c.score === maxScore)
  const detail = scored
    .sort((a, b) => b.score - a.score)
    .map((c) => `L${c.likelihood}xC${c.consequence}=${c.score} (${RISK_LEVEL_TH[c.level]})`)
    .join(', ')

  return `เลือก ${scored.length} ช่อง | คะแนนสูงสุด ${maxScore} (${worst
    .map((c) => `L${c.likelihood}xC${c.consequence}`)
    .join(', ')}) | ระดับความเสี่ยง ${RISK_LEVEL_TH[worst[0].level]} | รายการที่เลือก: ${detail}`
}

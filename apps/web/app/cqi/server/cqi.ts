export function formatUserName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim()
}

const VALID_STATUS = ['active', 'completed', 'draft', 'on_hold']

export type CqiInput = {
  title: string
  description: string | null
  departmentId: string | null
  year: number | null
  status: string
  planDetail: string | null
  doDetail: string | null
  checkDetail: string | null
  actDetail: string | null
  isOutstanding: boolean
  awardName: string | null
}

function nullableString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed ? trimmed : null
}

/** ตรวจและแปลง body สำหรับสร้าง/แก้ไขโครงการ CQI */
export function parseCqiInput(
  body: unknown
): { ok: true; data: CqiInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' }
  }
  const b = body as Record<string, unknown>
  const title = typeof b.title === 'string' ? b.title.trim() : ''
  if (!title) return { ok: false, error: 'กรุณาระบุชื่อโครงการ' }

  const status = typeof b.status === 'string' && VALID_STATUS.includes(b.status) ? b.status : 'active'
  const yearRaw = b.year
  const year =
    yearRaw === null || yearRaw === undefined || yearRaw === ''
      ? null
      : Number.isFinite(Number(yearRaw))
        ? Number(yearRaw)
        : null

  return {
    ok: true,
    data: {
      title,
      description: nullableString(b.description),
      departmentId: nullableString(b.departmentId),
      year,
      status,
      planDetail: nullableString(b.planDetail),
      doDetail: nullableString(b.doDetail),
      checkDetail: nullableString(b.checkDetail),
      actDetail: nullableString(b.actDetail),
      isOutstanding: Boolean(b.isOutstanding),
      awardName: nullableString(b.awardName),
    },
  }
}

export function mapCqiDetail(project: {
  id: string
  title: string
  description: string | null
  department: { id: string; name: string; code: string } | null
  year: number | null
  status: string
  isOutstanding: boolean
  awardName: string | null
  lead: { id: string; firstName: string; lastName: string; email: string }
  planDetail: string | null
  doDetail: string | null
  checkDetail: string | null
  actDetail: string | null
  awards: unknown[]
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    department: project.department,
    year: project.year,
    status: project.status,
    isOutstanding: project.isOutstanding,
    awardName: project.awardName,
    owner: {
      id: project.lead.id,
      name: formatUserName(project.lead.firstName, project.lead.lastName),
      email: project.lead.email,
    },
    pdca: {
      plan: project.planDetail,
      do: project.doDetail,
      check: project.checkDetail,
      act: project.actDetail,
    },
    awards: project.awards,
    startDate: project.startDate?.toISOString() ?? null,
    endDate: project.endDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

export function mapCqiListItem(project: {
  id: string
  title: string
  year: number | null
  status: string
  isOutstanding: boolean
  awardName: string | null
  department: { id: string; name: string; code: string } | null
  lead: { id: string; firstName: string; lastName: string }
}) {
  return {
    id: project.id,
    title: project.title,
    year: project.year,
    status: project.status,
    isOutstanding: project.isOutstanding,
    awardName: project.awardName,
    department: project.department,
    owner: {
      id: project.lead.id,
      name: formatUserName(project.lead.firstName, project.lead.lastName),
    },
  }
}

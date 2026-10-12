import type { PrismaClient } from '@prisma/client'

/**
 * รหัสมาตรฐานทั้งระบบ: {PREFIX}-{SEQ 4 หลัก} หรือ {PREFIX}-{CODE}
 *
 * ตารางที่จัดแล้วแยกต่างหาก (ไม่ใช้ชุดนี้):
 *   USR / ROLE / DEPT / UPW
 * ตารางที่ไม่เปลี่ยน PK:
 *   app_settings (key), ha_v6_document_states (documentId จากแคตตาล็อก)
 */

export type EntityIdMode = 'seq' | 'code' | 'slug'

export type EntityIdSpec = {
  /** ชื่อ model ใน Prisma (PascalCase ตาม $extends) */
  model: string
  table: string
  prefix: string
  mode: EntityIdMode
  /** ฟิลด์สำหรับ mode code/slug */
  codeField?: string
}

/** สเปกสำหรับ create อัตโนมัติ + migrate */
export const ENTITY_ID_SPECS: EntityIdSpec[] = [
  { model: 'DocumentCategory', table: 'document_categories', prefix: 'DCAT', mode: 'code', codeField: 'code' },
  { model: 'HaDocument', table: 'ha_documents', prefix: 'DOC', mode: 'seq' },
  { model: 'DocumentVersion', table: 'document_versions', prefix: 'DOCVER', mode: 'seq' },
  { model: 'HaV6TrackerFile', table: 'ha_v6_tracker_files', prefix: 'HV6F', mode: 'seq' },
  { model: 'DocumentDownloadLog', table: 'document_download_logs', prefix: 'DLOG', mode: 'seq' },
  { model: 'NewsCategory', table: 'news_categories', prefix: 'NCAT', mode: 'slug', codeField: 'slug' },
  { model: 'News', table: 'news', prefix: 'NEWS', mode: 'seq' },
  { model: 'RelatedLink', table: 'related_links', prefix: 'LINK', mode: 'seq' },
  { model: 'ConsultRequest', table: 'consult_requests', prefix: 'CONS', mode: 'seq' },
  { model: 'MeetingRoom', table: 'meeting_rooms', prefix: 'ROOM', mode: 'code', codeField: 'code' },
  { model: 'Meeting', table: 'meetings', prefix: 'MTG', mode: 'seq' },
  { model: 'MeetingParticipant', table: 'meeting_participants', prefix: 'MTGP', mode: 'seq' },
  { model: 'MeetingAgenda', table: 'meeting_agendas', prefix: 'MTGA', mode: 'seq' },
  { model: 'MeetingMinute', table: 'meeting_minutes', prefix: 'MTGM', mode: 'seq' },
  { model: 'MeetingChecklistItem', table: 'meeting_checklist_items', prefix: 'MTGC', mode: 'seq' },
  { model: 'IndicatorCategory', table: 'indicator_categories', prefix: 'ICAT', mode: 'code', codeField: 'code' },
  { model: 'Indicator', table: 'indicators', prefix: 'IND', mode: 'code', codeField: 'code' },
  { model: 'IndicatorValue', table: 'indicator_values', prefix: 'INDV', mode: 'seq' },
  { model: 'KmSession', table: 'km_sessions', prefix: 'KMS', mode: 'seq' },
  { model: 'KmResult', table: 'km_results', prefix: 'KMR', mode: 'seq' },
  { model: 'KmInnovation', table: 'km_innovations', prefix: 'KMI', mode: 'seq' },
  { model: 'CqiProject', table: 'cqi_projects', prefix: 'CQI', mode: 'seq' },
  { model: 'CqiAward', table: 'cqi_awards', prefix: 'CQIA', mode: 'seq' },
  { model: 'ServiceProfile', table: 'service_profiles', prefix: 'SP', mode: 'seq' },
  {
    model: 'UnitProfileWorksheetDownloadLog',
    table: 'unit_profile_worksheet_download_logs',
    prefix: 'WDL',
    mode: 'seq',
  },
  { model: 'Course', table: 'courses', prefix: 'CRS', mode: 'seq' },
  { model: 'Lesson', table: 'lessons', prefix: 'LSN', mode: 'seq' },
  { model: 'Quiz', table: 'quizzes', prefix: 'QUIZ', mode: 'seq' },
  { model: 'QuizQuestion', table: 'quiz_questions', prefix: 'QQ', mode: 'seq' },
  { model: 'UserProgress', table: 'user_progress', prefix: 'UPRG', mode: 'seq' },
  { model: 'Certificate', table: 'certificates', prefix: 'CERT', mode: 'seq' },
  { model: 'Notification', table: 'notifications', prefix: 'NTF', mode: 'seq' },
  { model: 'LineOaLog', table: 'line_oa_logs', prefix: 'LLOG', mode: 'seq' },
  { model: 'AuditLog', table: 'audit_logs', prefix: 'AUD', mode: 'seq' },
]

const SPEC_BY_MODEL = new Map(ENTITY_ID_SPECS.map((s) => [s.model, s]))

export function getEntityIdSpec(model: string): EntityIdSpec | undefined {
  return SPEC_BY_MODEL.get(model)
}

export function normalizeCodeToken(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
  return cleaned || 'X'
}

export function formatSeqEntityId(prefix: string, sequence: number): string {
  if (sequence < 1 || sequence > 9999) throw new Error('ENTITY_SEQUENCE_OUT_OF_RANGE')
  return `${prefix}-${String(sequence).padStart(4, '0')}`
}

export function formatCodeEntityId(prefix: string, code: string): string {
  return `${prefix}-${normalizeCodeToken(code)}`
}

export function isStructuredSeqId(id: string, prefix: string): boolean {
  return new RegExp(`^${prefix}-\\d{4}$`).test(id)
}

export function isStructuredCodeId(id: string, prefix: string): boolean {
  return new RegExp(`^${prefix}-[A-Z0-9_-]+$`).test(id)
}

export function isStructuredEntityId(id: string, spec: EntityIdSpec): boolean {
  if (spec.mode === 'seq') return isStructuredSeqId(id, spec.prefix)
  return isStructuredCodeId(id, spec.prefix)
}

/** หาเลขถัดไปจากแถวที่ขึ้นต้นด้วย PREFIX- */
export async function allocateSeqEntityId(
  client: PrismaClient,
  table: string,
  prefix: string
): Promise<string> {
  const rows = await client.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT \`id\` FROM \`${table}\` WHERE \`id\` LIKE ? ORDER BY \`id\` DESC LIMIT 1`,
    `${prefix}-%`
  )

  let next = 1
  const latest = rows[0]?.id
  if (latest) {
    const match = latest.match(new RegExp(`^${prefix}-(\\d{4})$`))
    if (match) next = Number(match[1]) + 1
  }

  return formatSeqEntityId(prefix, next)
}

export async function resolveCreateEntityId(
  client: PrismaClient,
  model: string,
  data: Record<string, unknown>
): Promise<string | null> {
  const spec = getEntityIdSpec(model)
  if (!spec) return null
  if (data.id != null && String(data.id).length > 0) return null

  if (spec.mode === 'seq') {
    return allocateSeqEntityId(client, spec.table, spec.prefix)
  }

  const raw = data[spec.codeField ?? 'code']
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error(`ENTITY_ID_CODE_REQUIRED:${model}`)
  }
  return formatCodeEntityId(spec.prefix, raw)
}

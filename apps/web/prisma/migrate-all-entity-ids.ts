/**
 * ย้าย PK ของตารางที่ยังเป็น cuid/uuid → รหัสมาตรฐาน (DOC-0001, ROOM-MR-01, …)
 *
 * - ไม่ลบข้อมูล — remap PK + FK
 * - ข้ามแถวที่มีรูปแบบใหม่แล้ว
 * - อัปเดต path ใน DB และ rename โฟลเดอร์ไฟล์บนดิสก์ถ้ามี
 *
 * รันหลัง (หรือรวมกับ) user / role / department / worksheet:
 *   npm run db:migrate-all-entity-ids
 */
import { rename } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import {
  ENTITY_ID_SPECS,
  formatCodeEntityId,
  formatSeqEntityId,
  isStructuredEntityId,
  type EntityIdSpec,
} from '../app/common/server/entity-id'
import { resolveUploadRoot } from '../app/common/server/deployment'

const prisma = new PrismaClient()

const MEETING_ROOT = resolveUploadRoot('MEETING_UPLOAD_DIR', 'meetings')
const ELEARN_ROOT = resolveUploadRoot('ELEARNING_UPLOAD_DIR', 'elearning')

type FkRef = { table: string; column: string }

type MigrateSpec = EntityIdSpec & {
  /** คอลัมน์สำหรับเรียงลำดับตอนออกเลข seq */
  orderColumn?: string
  fks: FkRef[]
  /** คอลัมน์ที่อาจฝัง id เก่าใน path */
  pathColumns?: FkRef[]
}

const MIGRATE_SPECS: MigrateSpec[] = [
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'DocumentCategory')!,
    orderColumn: 'created_at',
    fks: [{ table: 'ha_documents', column: 'category_id' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'HaDocument')!,
    orderColumn: 'created_at',
    fks: [
      { table: 'document_versions', column: 'document_id' },
      { table: 'document_download_logs', column: 'document_id' },
    ],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'DocumentVersion')!,
    orderColumn: 'created_at',
    fks: [{ table: 'document_download_logs', column: 'version_id' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'HaV6TrackerFile')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'DocumentDownloadLog')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'NewsCategory')!,
    orderColumn: 'created_at',
    fks: [{ table: 'news', column: 'category_id' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'News')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'RelatedLink')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'ConsultRequest')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'MeetingRoom')!,
    orderColumn: 'created_at',
    fks: [{ table: 'meetings', column: 'room_id' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'Meeting')!,
    orderColumn: 'created_at',
    fks: [
      { table: 'meeting_participants', column: 'meeting_id' },
      { table: 'meeting_agendas', column: 'meeting_id' },
      { table: 'meeting_minutes', column: 'meeting_id' },
      { table: 'meeting_checklist_items', column: 'meeting_id' },
    ],
    pathColumns: [
      { table: 'meeting_minutes', column: 'file_path' },
      { table: 'meeting_agendas', column: 'attachment_path' },
    ],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'MeetingParticipant')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'MeetingAgenda')!,
    orderColumn: 'created_at',
    fks: [],
    pathColumns: [{ table: 'meeting_agendas', column: 'attachment_path' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'MeetingMinute')!,
    orderColumn: 'created_at',
    fks: [],
    pathColumns: [{ table: 'meeting_minutes', column: 'file_path' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'MeetingChecklistItem')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'IndicatorCategory')!,
    orderColumn: 'created_at',
    fks: [{ table: 'indicators', column: 'category_id' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'Indicator')!,
    orderColumn: 'created_at',
    fks: [{ table: 'indicator_values', column: 'indicator_id' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'IndicatorValue')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'KmSession')!,
    orderColumn: 'created_at',
    fks: [
      { table: 'km_results', column: 'session_id' },
      { table: 'km_innovations', column: 'session_id' },
    ],
    pathColumns: [{ table: 'km_sessions', column: 'file_path' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'KmResult')!,
    orderColumn: 'created_at',
    fks: [],
    pathColumns: [
      { table: 'km_results', column: 'file_url' },
      { table: 'km_results', column: 'image_url' },
    ],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'KmInnovation')!,
    orderColumn: 'created_at',
    fks: [],
    pathColumns: [{ table: 'km_innovations', column: 'file_url' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'CqiProject')!,
    orderColumn: 'created_at',
    fks: [{ table: 'cqi_awards', column: 'project_id' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'CqiAward')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'ServiceProfile')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'UnitProfileWorksheetDownloadLog')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'Course')!,
    orderColumn: 'created_at',
    fks: [
      { table: 'lessons', column: 'course_id' },
      { table: 'quizzes', column: 'course_id' },
      { table: 'user_progress', column: 'course_id' },
      { table: 'certificates', column: 'course_id' },
    ],
    pathColumns: [
      { table: 'lessons', column: 'file_path' },
      { table: 'lessons', column: 'content_url' },
      { table: 'lessons', column: 'video_url' },
    ],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'Lesson')!,
    orderColumn: 'created_at',
    fks: [{ table: 'user_progress', column: 'lesson_id' }],
    pathColumns: [
      { table: 'lessons', column: 'file_path' },
      { table: 'lessons', column: 'content_url' },
      { table: 'lessons', column: 'video_url' },
    ],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'Quiz')!,
    orderColumn: 'created_at',
    fks: [{ table: 'quiz_questions', column: 'quiz_id' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'QuizQuestion')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'UserProgress')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'Certificate')!,
    orderColumn: 'created_at',
    fks: [],
    pathColumns: [{ table: 'certificates', column: 'file_path' }],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'Notification')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'LineOaLog')!,
    orderColumn: 'created_at',
    fks: [],
  },
  {
    ...ENTITY_ID_SPECS.find((s) => s.model === 'AuditLog')!,
    orderColumn: 'created_at',
    fks: [],
  },
]

async function tryRename(from: string, to: string) {
  try {
    await rename(from, to)
    console.log(`  disk: ${from} → ${to}`)
  } catch {
    // ไม่มีโฟลเดอร์/ไฟล์ — ข้าม
  }
}

async function renameDiskArtifacts(
  spec: MigrateSpec,
  oldId: string,
  newId: string,
  extra?: { meetingId?: string; courseId?: string }
) {
  if (spec.model === 'Meeting') {
    await tryRename(path.join(MEETING_ROOT, oldId), path.join(MEETING_ROOT, newId))
  }
  if (spec.model === 'MeetingAgenda' && extra?.meetingId) {
    await tryRename(
      path.join(MEETING_ROOT, extra.meetingId, 'agendas', oldId),
      path.join(MEETING_ROOT, extra.meetingId, 'agendas', newId)
    )
  }
  if (spec.model === 'Course') {
    await tryRename(
      path.join(ELEARN_ROOT, 'lessons', oldId),
      path.join(ELEARN_ROOT, 'lessons', newId)
    )
  }
  if (spec.model === 'Lesson' && extra?.courseId) {
    await tryRename(
      path.join(ELEARN_ROOT, 'lessons', extra.courseId, oldId),
      path.join(ELEARN_ROOT, 'lessons', extra.courseId, newId)
    )
  }
  if (spec.model === 'Certificate') {
    await tryRename(
      path.join(ELEARN_ROOT, 'certificates', `${oldId}.pdf`),
      path.join(ELEARN_ROOT, 'certificates', `${newId}.pdf`)
    )
  }
}

async function migrateTable(spec: MigrateSpec) {
  const codeSelect =
    spec.mode !== 'seq' && spec.codeField
      ? `, \`${spec.codeField === 'slug' ? 'slug' : spec.codeField}\` AS code_token`
      : ', NULL AS code_token'

  const orderCol = spec.orderColumn ?? 'created_at'
  const rows = await prisma.$queryRawUnsafe<
    Array<{ id: string; code_token: string | null; meeting_id?: string | null; course_id?: string | null }>
  >(
    `SELECT \`id\`${codeSelect}${
      spec.model === 'MeetingAgenda' ? ', `meeting_id`' : ''
    }${spec.model === 'Lesson' ? ', `course_id`' : ''}
     FROM \`${spec.table}\`
     ORDER BY \`${orderCol}\` ASC, \`id\` ASC`
  )

  let nextSeq = 1
  for (const row of rows) {
    if (isStructuredEntityId(row.id, spec) && spec.mode === 'seq') {
      const n = Number(row.id.slice(spec.prefix.length + 1))
      if (n >= nextSeq) nextSeq = n + 1
    }
  }

  let migrated = 0
  let skipped = 0

  for (const row of rows) {
    let newId: string
    if (spec.mode === 'seq') {
      if (isStructuredEntityId(row.id, spec)) {
        skipped++
        continue
      }
      newId = formatSeqEntityId(spec.prefix, nextSeq)
      nextSeq++
    } else {
      const token = row.code_token
      if (!token) throw new Error(`MISSING_CODE:${spec.table}:${row.id}`)
      newId = formatCodeEntityId(spec.prefix, token)
      if (row.id === newId) {
        skipped++
        continue
      }
    }

    const clash = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT \`id\` FROM \`${spec.table}\` WHERE \`id\` = ? LIMIT 1`,
      newId
    )
    if (clash[0] && clash[0].id !== row.id) {
      throw new Error(`ID_CONFLICT:${spec.table}: ${row.id} → ${newId}`)
    }

    const oldId = row.id

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')

      for (const fk of spec.fks) {
        await tx.$executeRawUnsafe(
          `UPDATE \`${fk.table}\` SET \`${fk.column}\` = ? WHERE \`${fk.column}\` = ?`,
          newId,
          oldId
        )
      }

      for (const pc of spec.pathColumns ?? []) {
        await tx.$executeRawUnsafe(
          `UPDATE \`${pc.table}\` SET \`${pc.column}\` = REPLACE(\`${pc.column}\`, ?, ?) WHERE \`${pc.column}\` LIKE ?`,
          oldId,
          newId,
          `%${oldId}%`
        )
      }

      await tx.$executeRawUnsafe(
        `UPDATE \`${spec.table}\` SET \`id\` = ? WHERE \`id\` = ?`,
        newId,
        oldId
      )

      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
    })

    await renameDiskArtifacts(spec, oldId, newId, {
      meetingId: row.meeting_id ?? undefined,
      courseId: row.course_id ?? undefined,
    })

    console.log(`✓ [${spec.table}] ${oldId} → ${newId}`)
    migrated++
  }

  console.log(`  → ${spec.table}: ย้าย ${migrated}, ข้าม ${skipped}`)
  return { migrated, skipped }
}

async function main() {
  console.log('=== migrate-all-entity-ids ===\n')
  let totalMigrated = 0
  let totalSkipped = 0

  for (const spec of MIGRATE_SPECS) {
    const result = await migrateTable(spec)
    totalMigrated += result.migrated
    totalSkipped += result.skipped
  }

  console.log(`\nเสร็จสิ้นทั้งหมด: ย้าย ${totalMigrated}, ข้าม ${totalSkipped}`)
  console.log('หมายเหตุ: users/roles/departments/worksheets ใช้สคริปต์แยก (หรือรัน db:migrate-all-ids)')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())



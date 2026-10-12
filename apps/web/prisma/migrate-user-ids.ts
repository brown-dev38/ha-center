/**
 * ย้าย users.id เดิม (cuid / user-admin) → รูปแบบมาตรฐาน USR-0001
 *
 * อัปเดต FK ทุกตารางที่อ้างอิง users.id และเปลี่ยนชื่อไฟล์ avatar ถ้ามี
 * ข้อมูลเดิมไม่ถูกลบ — แค่ remap รหัส
 *
 * รัน:
 *   cd apps/web
 *   bun run db:migrate-user-ids
 *   # หรือ
 *   bunx dotenv -e .env -e .env.local -- bunx tsx prisma/migrate-user-ids.ts
 */
import { rename } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { formatUserId, isStructuredUserId } from '../app/auth/server/user-id'
import { resolveUploadRoot } from '../app/common/server/deployment'

const prisma = new PrismaClient()
const AVATAR_ROOT = resolveUploadRoot('AVATAR_UPLOAD_DIR', 'avatars')
const AVATAR_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const

type FkUpdate = {
  table: string
  column: string
}

/** คอลัมน์ FK ที่อ้างอิง users.id (ชื่อตาราง/คอลัมน์จริงใน MySQL) */
const USER_FK_COLUMNS: FkUpdate[] = [
  { table: 'ha_documents', column: 'uploaded_by_id' },
  { table: 'document_versions', column: 'uploaded_by_id' },
  { table: 'ha_v6_document_states', column: 'updated_by_id' },
  { table: 'ha_v6_tracker_files', column: 'uploaded_by_id' },
  { table: 'document_download_logs', column: 'user_id' },
  { table: 'news', column: 'author_id' },
  { table: 'meetings', column: 'organizer_id' },
  { table: 'meeting_participants', column: 'user_id' },
  { table: 'meeting_agendas', column: 'presenter_id' },
  { table: 'meeting_minutes', column: 'author_id' },
  { table: 'indicator_values', column: 'recorded_by_id' },
  { table: 'km_sessions', column: 'presenter_id' },
  { table: 'km_results', column: 'author_id' },
  { table: 'km_innovations', column: 'author_id' },
  { table: 'cqi_projects', column: 'lead_id' },
  { table: 'unit_profile_worksheets', column: 'prepared_by_id' },
  { table: 'unit_profile_worksheet_versions', column: 'generated_by_id' },
  { table: 'unit_profile_worksheet_download_logs', column: 'user_id' },
  { table: 'user_progress', column: 'user_id' },
  { table: 'certificates', column: 'user_id' },
  { table: 'notifications', column: 'user_id' },
  { table: 'audit_logs', column: 'user_id' },
]

async function renameAvatarFiles(oldId: string, newId: string) {
  for (const ext of AVATAR_EXTS) {
    const from = path.join(AVATAR_ROOT, `${oldId}.${ext}`)
    const to = path.join(AVATAR_ROOT, `${newId}.${ext}`)
    try {
      await rename(from, to)
      console.log(`  avatar: ${oldId}.${ext} → ${newId}.${ext}`)
    } catch {
      // ไม่มีไฟล์ — ข้าม
    }
  }
}

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, email: true, avatarUrl: true },
  })

  let nextSeq = 1
  for (const u of users) {
    if (isStructuredUserId(u.id)) {
      const seq = Number(u.id.slice(4))
      if (seq >= nextSeq) nextSeq = seq + 1
    }
  }

  let migrated = 0
  let skipped = 0

  for (const user of users) {
    if (isStructuredUserId(user.id)) {
      console.log(`⏭ ข้าม ${user.id} (${user.email}) — มีรูปแบบใหม่แล้ว`)
      skipped++
      continue
    }

    const newId = formatUserId(nextSeq)
    nextSeq++
    const oldId = user.id

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')

      for (const { table, column } of USER_FK_COLUMNS) {
        await tx.$executeRawUnsafe(
          `UPDATE \`${table}\` SET \`${column}\` = ? WHERE \`${column}\` = ?`,
          newId,
          oldId
        )
      }

      await tx.$executeRawUnsafe(`UPDATE \`users\` SET \`id\` = ? WHERE \`id\` = ?`, newId, oldId)

      if (user.avatarUrl?.includes(oldId)) {
        await tx.$executeRawUnsafe(
          `UPDATE \`users\` SET \`avatar_url\` = ? WHERE \`id\` = ?`,
          user.avatarUrl.replaceAll(oldId, newId),
          newId
        )
      }

      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
    })

    await renameAvatarFiles(oldId, newId)

    console.log(`✓ ${oldId} → ${newId} (${user.email})`)
    migrated++
  }

  console.log(`\nเสร็จสิ้น: ย้าย ${migrated} รายการ, ข้าม ${skipped} รายการ`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())

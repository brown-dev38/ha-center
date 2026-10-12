/**
 * ย้าย roles.id → รูปแบบมาตรฐาน ROLE-{NAME}
 * เช่น role-admin / cuid / uuid → ROLE-ADMIN
 *
 * อัปเดต users.role_id — ไม่ลบข้อมูล
 * สิทธิ์ระบบยังอิง roles.name เหมือนเดิม จึงไม่กระทบ permission
 *
 * รัน:
 *   npm run db:migrate-role-ids
 */
import { PrismaClient } from '@prisma/client'
import { formatRoleId } from '../app/admin/server/role-id'

const prisma = new PrismaClient()

async function main() {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  let migrated = 0
  let skipped = 0

  for (const role of roles) {
    const newId = formatRoleId(role.name)
    if (role.id === newId) {
      console.log(`⏭ ข้าม ${role.id} (${role.name})`)
      skipped++
      continue
    }

    const clash = await prisma.role.findUnique({ where: { id: newId } })
    if (clash && clash.id !== role.id) {
      throw new Error(`ROLE_ID_CONFLICT: ${newId} มีอยู่แล้ว (จาก ${role.id} / ${role.name})`)
    }

    const oldId = role.id

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')
      await tx.$executeRawUnsafe(
        `UPDATE \`users\` SET \`role_id\` = ? WHERE \`role_id\` = ?`,
        newId,
        oldId
      )
      await tx.$executeRawUnsafe(`UPDATE \`roles\` SET \`id\` = ? WHERE \`id\` = ?`, newId, oldId)
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
    })

    console.log(`✓ ${oldId} → ${newId} (${role.name})`)
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


  

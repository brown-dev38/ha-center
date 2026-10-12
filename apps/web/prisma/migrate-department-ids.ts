/**
 * ย้าย departments.id → รูปแบบมาตรฐาน DEPT-{CODE}
 * เช่น dept-ha / cuid / uuid → DEPT-HA
 *
 * อัปเดตทุกคอลัมน์ department_id ที่อ้างอิง — ไม่ลบข้อมูล
 * เลขที่ worksheet (UPW-HA-…) อิง departments.code ไม่ใช่ id จึงไม่กระทบ
 *
 * รัน:
 *   npm run db:migrate-department-ids
 */
import { PrismaClient } from '@prisma/client'
import { formatDepartmentId } from '../app/admin/server/department-id'

const prisma = new PrismaClient()

/** ตารางที่มีคอลัมน์ department_id (รวมที่ไม่มี FK ใน Prisma เช่น km_innovations) */
const DEPARTMENT_FK_TABLES = [
  'users',
  'indicators',
  'indicator_values',
  'km_sessions',
  'km_innovations',
  'cqi_projects',
  'service_profiles',
  'unit_profile_worksheets',
] as const

async function main() {
  const departments = await prisma.department.findMany({
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  })

  let migrated = 0
  let skipped = 0

  for (const dept of departments) {
    const newId = formatDepartmentId(dept.code)
    if (dept.id === newId) {
      console.log(`⏭ ข้าม ${dept.id} (${dept.code})`)
      skipped++
      continue
    }

    const clash = await prisma.department.findUnique({ where: { id: newId } })
    if (clash && clash.id !== dept.id) {
      throw new Error(`DEPARTMENT_ID_CONFLICT: ${newId} มีอยู่แล้ว (จาก ${dept.id} / ${dept.code})`)
    }

    const oldId = dept.id

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')

      for (const table of DEPARTMENT_FK_TABLES) {
        await tx.$executeRawUnsafe(
          `UPDATE \`${table}\` SET \`department_id\` = ? WHERE \`department_id\` = ?`,
          newId,
          oldId
        )
      }

      await tx.$executeRawUnsafe(
        `UPDATE \`departments\` SET \`id\` = ? WHERE \`id\` = ?`,
        newId,
        oldId
      )

      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
    })

    console.log(`✓ ${oldId} → ${newId} (${dept.code} — ${dept.name})`)
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

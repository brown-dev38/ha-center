/**
 * ย้ายเลขที่เอกสารเดิม (cuid) → รูปแบบมาตรฐาน UPW-{DEPT}-{YEAR}-{SEQ}
 *
 * รัน:
 *   cd apps/web
 *   npx dotenv -e .env -e .env.local -- tsx prisma/migrate-worksheet-ids.ts
 */
import { PrismaClient } from '@prisma/client'
import {
  formatWorksheetId,
  formatWorksheetVersionId,
  isStructuredWorksheetId,
  normalizeDeptCode,
} from '../app/service-profile/server/worksheet-id'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.unitProfileWorksheet.findMany({
    orderBy: [{ departmentId: 'asc' }, { year: 'asc' }, { createdAt: 'asc' }],
    include: {
      department: { select: { code: true } },
      versions: { orderBy: { versionNo: 'asc' } },
    },
  })

  const counters = new Map<string, number>()
  let migrated = 0
  let skipped = 0

  for (const row of rows) {
    if (isStructuredWorksheetId(row.id)) {
      skipped++
      continue
    }

    const deptCode = normalizeDeptCode(row.department.code)
    const counterKey = `${deptCode}-${row.year}`
    const next = (counters.get(counterKey) ?? 0) + 1
    counters.set(counterKey, next)

    const newWorksheetId = formatWorksheetId(deptCode, row.year, next)
    const oldWorksheetId = row.id

    await prisma.$transaction(async (tx) => {
      // ปิด FK ชั่วคราวเพื่อเปลี่ยน PK ที่ถูกอ้างอิง
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')

      for (const version of row.versions) {
        const newVersionId = formatWorksheetVersionId(newWorksheetId, version.versionNo)
        if (version.id === newVersionId) continue

        await tx.unitProfileWorksheetDownloadLog.updateMany({
          where: { versionId: version.id },
          data:  { versionId: newVersionId },
        })

        await tx.unitProfileWorksheetVersion.update({
          where: { id: version.id },
          data:  { id: newVersionId, worksheetId: newWorksheetId },
        })
      }

      await tx.unitProfileWorksheetDownloadLog.updateMany({
        where: { worksheetId: oldWorksheetId },
        data:  { worksheetId: newWorksheetId },
      })

      
      await tx.unitProfileWorksheetVersion.updateMany({
        where: { worksheetId: oldWorksheetId },
        data:  { worksheetId: newWorksheetId },
      })

      await tx.unitProfileWorksheet.update({
        where: { id: oldWorksheetId },
        data:  { id: newWorksheetId },
      })

      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
    })

    console.log(`✓ ${oldWorksheetId} → ${newWorksheetId}`)
    migrated++
  }

  console.log(`\nเสร็จสิ้น: ย้าย ${migrated} รายการ, ข้าม ${skipped} รายการ (มีรูปแบบใหม่แล้ว)`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())



 





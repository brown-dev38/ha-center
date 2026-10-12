/**
 * ย้ายไฟล์ PDF จากดิสก์ (file_path) เข้า column file_data
 * รัน: npm run db:migrate-documents
 */
import { readFile } from 'node:fs/promises'
import { PrismaClient } from '@prisma/client'
import { DB_INLINE_PATH, readVersionPdf } from '../app/documents/server/document-storage'

const prisma = new PrismaClient()

async function main() {
  const versions = await prisma.documentVersion.findMany({
    where: {
      OR: [{ fileData: null }, { fileData: { equals: Buffer.alloc(0) } }],
      NOT: { filePath: DB_INLINE_PATH },
    },
  })

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const v of versions) {
    try {
      const buffer = await readVersionPdf({ filePath: v.filePath, fileData: v.fileData })
      await prisma.documentVersion.update({
        where: { id: v.id },
        data: { fileData: buffer, filePath: DB_INLINE_PATH },
      })
      migrated++
      console.log(`OK ${v.id} (${v.fileName})`)
    } catch {
      try {
        const absolute = v.filePath
        const buffer = await readFile(absolute)
        await prisma.documentVersion.update({
          where: { id: v.id },
          data: { fileData: buffer, filePath: DB_INLINE_PATH },
        })
        migrated++
        console.log(`OK (direct path) ${v.id}`)
      } catch (e) {
        failed++
        console.warn(`SKIP ${v.id}: ${e instanceof Error ? e.message : e}`)
      }
    }
  }

  console.log(`Done: migrated=${migrated} failed=${failed} skipped=${skipped}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

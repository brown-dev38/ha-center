import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRESERVED = new Set(['admin', 'qa_manager'])
const TARGET = 'document_manager'

async function main() {
  const docManagerRole = await prisma.role.findUnique({ where: { name: TARGET } })
  if (!docManagerRole) throw new Error(`ไม่พบ role ${TARGET}`)

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      microsoftOid: { not: null },
      role: { name: { notIn: [...PRESERVED, TARGET] } },
    },
    include: { role: true },
  })

  if (users.length === 0) {
    console.log('✓ ไม่มีผู้ใช้ Microsoft ที่ต้องอัปเดต')
    return
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: users.map((u) => u.id) } },
    data: { roleId: docManagerRole.id },
  })

  console.log(`✓ อัปเดต ${result.count} บัญชี Microsoft → ${TARGET}`)
  for (const u of users) {
    console.log(`  - ${u.email} (${u.role.name} → ${TARGET})`)
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

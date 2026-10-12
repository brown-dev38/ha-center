import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) {
    console.error('Usage: tsx prisma/promote-user-admin.ts <email>')
    process.exit(1)
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  if (!adminRole) {
    throw new Error('ไม่พบ role admin ในฐานข้อมูล')
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (!existing) {
    throw new Error(`ไม่พบผู้ใช้ ${email}`)
  }

  if (existing.role.name === 'admin') {
    console.log(`✓ ${email} เป็นผู้ดูแลระบบอยู่แล้ว`)
    return
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { roleId: adminRole.id },
    include: { role: true },
  })

  console.log(`✓ อัปเดตแล้ว: ${updated.email} -> ${updated.role.name} (${updated.role.displayName})`)
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'
import { getEntityIdSpec, resolveCreateEntityId } from '@/app/common/server/entity-id'

type PrismaGlobal = {
  prisma?: PrismaClient
  prismaDatabaseUrl?: string
}

const globalForPrisma = globalThis as unknown as PrismaGlobal

function attachEntityIdMiddleware(client: PrismaClient) {
  client.$use(async (params, next) => {
    if (!params.model) return next(params)

    const spec = getEntityIdSpec(params.model)
    if (!spec) return next(params)

    if (params.action === 'create' && params.args?.data && typeof params.args.data === 'object') {
      const data = params.args.data as Record<string, unknown>
      const id = await resolveCreateEntityId(client, params.model, data)
      if (id) data.id = id
    }

    if (params.action === 'upsert' && params.args?.create && typeof params.args.create === 'object') {
      const data = params.args.create as Record<string, unknown>
      const id = await resolveCreateEntityId(client, params.model, data)
      if (id) data.id = id
    }

    if (params.action === 'createMany' && Array.isArray(params.args?.data)) {
      const rows = params.args.data as Record<string, unknown>[]
      for (const row of rows) {
        const id = await resolveCreateEntityId(client, params.model, row)
        if (id) row.id = id
      }
    }

    return next(params)
  })
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  attachEntityIdMiddleware(client)
  return client
}

function getPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL

  if (globalForPrisma.prisma && globalForPrisma.prismaDatabaseUrl === databaseUrl) {
    return globalForPrisma.prisma
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect()
  }

  const client = createPrismaClient()
  globalForPrisma.prisma = client
  globalForPrisma.prismaDatabaseUrl = databaseUrl
  return client
}

export const prisma = getPrismaClient()

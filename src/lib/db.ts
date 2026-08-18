import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaSchemaVersion: string | undefined
}

// Force a fresh PrismaClient when the schema changes (dev hot-reload).
// The generated client exports a version hash we can compare.
const SCHEMA_VERSION = 'blaknet-v3-enquiries' // bump this when the schema changes

function makeClient() {
  return new PrismaClient({
    log: ['query'],
  })
}

if (
  process.env.NODE_ENV !== 'production' &&
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION
) {
  // schema changed — discard the old client
  try { globalForPrisma.prisma.$disconnect() } catch { /* ignore */ }
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  makeClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION
}

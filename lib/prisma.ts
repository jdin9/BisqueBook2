import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

function buildPool() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it to .env.local to enable database access.")
  }

  const url = new URL(connectionString)
  const sslmode = url.searchParams.get("sslmode")

  if (sslmode === "require") {
    url.searchParams.delete("sslmode")
  }

  return new Pool({
    connectionString: url.toString(),
    ssl: sslmode === "require" ? { rejectUnauthorized: false } : undefined,
  })
}

function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to .env.local to enable database access.")
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      adapter: new PrismaPg(buildPool()),
    })
  }

  return globalForPrisma.prisma
}

export async function ensureDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to .env.local to enable database access.")
  }

  const client = getPrismaClient()
  await client.$queryRaw`SELECT 1`
}

export { getPrismaClient }

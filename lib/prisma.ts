import { PrismaClient } from "@prisma/client";

// Force Prisma to use the Node.js binary engine during local/server execution.
// The "client" engine type requires Accelerate or an adapter, which isn't configured here.
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE || process.env.PRISMA_CLIENT_ENGINE_TYPE === "client") {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensureDatabaseConnection() {
  // Lightweight connectivity check to verify the connection string works in local dev.
  await prisma.$queryRaw`SELECT 1`;
}

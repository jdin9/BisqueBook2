import { PrismaClient } from "./generated/prisma/client";

// Ensure Prisma uses the Node.js binary engine instead of Accelerate/data proxy when
// an environment variable (e.g., PRISMA_CLIENT_ENGINE_TYPE=client) is present.
process.env.PRISMA_CLIENT_ENGINE_TYPE ??= "binary";

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
    // Force the Node.js binary engine to avoid requiring Accelerate/adapter config in local and server builds.
    engineType: "binary",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensureDatabaseConnection() {
  // Lightweight connectivity check to verify the connection string works in local dev.
  await prisma.$queryRaw`SELECT 1`;
}

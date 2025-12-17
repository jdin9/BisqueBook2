import { PrismaClient } from "./generated/prisma/client";

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

// Prisma configuration for BisqueBook2
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Provide sane fallbacks so `prisma generate` can run even when local env vars
// aren't set (e.g., on fresh clones or CI where DATABASE_URL isn't configured).
const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";

const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});

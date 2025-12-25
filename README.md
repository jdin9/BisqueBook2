# BisqueBook2

Next.js App Router starter with TypeScript, Tailwind, shadcn/ui, Clerk authentication, Prisma (PostgreSQL), and Supabase Storage.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in secrets for local dev:

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`: from your Clerk project.
   - `DATABASE_URL` / `DIRECT_URL`: Postgres connection string (Neon or Supabase) with `sslmode=require`.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`: Supabase Storage settings.

3. Run the app locally:

   ```bash
   npm run dev
   ```

## Testing

Run lint checks after installing dependencies to avoid missing-module errors:

```bash
npm install
npm run lint
```

## Authentication
- `middleware.ts` protects `/dashboard` (and any nested routes) using Clerk.
- Sign-in and sign-up routes are available at `/sign-in` and `/sign-up`.
- Update redirect URLs in `.env.example` to match your deployment.

## Database (Prisma + hosted Postgres)
- Schema lives in `prisma/schema.prisma` with a starter `UserProfile` model.
- Migration SQL is generated in `prisma/migrations/20241024000000_init/migration.sql`.
- Helpful scripts (see `package.json`):
  - `npm run prisma:generate` – regenerate the Prisma client.
  - `npm run prisma:migrate:create` – regenerate the SQL migration script from the schema.
  - `npm run prisma:migrate:deploy` – apply migrations against the configured database.
  - `npm run prisma:studio` – open Prisma Studio locally.

## Storage
- `lib/storage.ts` exposes Supabase anon and service-role clients.
- `ensureStorageBucketExists` can be used at startup or in a setup route to make sure your bucket is created.

## Admin tabs (Supabase setup)
- The kiln tab writes to a Supabase table named `Kilns`; the pottery tab writes to `Clays` and `Glazes`.
- Create all three tables by running `supabase/kilns.sql` in the Supabase SQL editor (or via `psql`).
- Required environment variables (already listed in `.env.example`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- If any tables are missing, the UI will show a message asking you to create them with `supabase/kilns.sql.`

## Deployment notes
- Vercel: add all environment variables from `.env.example` to your Project Settings and redeploy.
- Local verification: start a Postgres instance (e.g., Docker), export `DATABASE_URL`/`DIRECT_URL`, and run `npm run prisma:migrate:deploy`.

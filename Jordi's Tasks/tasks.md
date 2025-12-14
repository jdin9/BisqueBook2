# Jordi's Tasks

I completed everything in the README that can be automated in this environment (installed dependencies, created `.env.local` from the template, and ran lint). Please handle the following items to finish setup:

1. Fill in real secrets in `.env.local`:
   - Clerk keys: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
   - Postgres URLs: `DATABASE_URL`, `DIRECT_URL` (Neon/Supabase with `sslmode=require`).
   - Supabase Storage: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (bucket name like `attachments`).
2. Provision the database and apply the migration:
   - Point `DATABASE_URL`/`DIRECT_URL` to your Postgres instance.
   - Run `npm run prisma:migrate:deploy` to apply `prisma/migrations/20241024000000_init`.
3. Verify Supabase Storage access (optional but recommended):
   - Ensure the configured bucket exists; run a small script or call `ensureStorageBucketExists` during startup.
4. Start the app:
   - `npm run dev` and sign in/up via Clerk to confirm dashboard access.

Tip: For Vercel deployment, copy the finalized `.env.local` values into the project settings after local verification.

-- Add global role enum if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'GlobalRole'
  ) THEN
    CREATE TYPE "GlobalRole" AS ENUM ('User', 'SiteAdmin');
  END IF;
END $$;

-- Add globalRole column to UserProfile.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'UserProfile' AND column_name = 'globalRole'
  ) THEN
    ALTER TABLE "UserProfile" ADD COLUMN "globalRole" "GlobalRole" NOT NULL DEFAULT 'User';
  END IF;
END $$;

-- Ensure existing rows have a value.
UPDATE "UserProfile" SET "globalRole" = 'User' WHERE "globalRole" IS NULL;

-- Seed site admins:
-- 1) Promote studio owners to SiteAdmin.
UPDATE "UserProfile"
SET "globalRole" = 'SiteAdmin'
WHERE "globalRole" <> 'SiteAdmin'
  AND "id" IN (SELECT DISTINCT "ownerId" FROM "Studio");

-- 2) Optionally promote a specific account by userId via a session setting.
--    Set `SET app.site_admin_user_id = '<clerk_user_id>';` before running migrations to use this.
DO $$
DECLARE
  target_user_id TEXT := current_setting('app.site_admin_user_id', true);
BEGIN
  IF target_user_id IS NOT NULL AND length(target_user_id) > 0 THEN
    UPDATE "UserProfile"
    SET "globalRole" = 'SiteAdmin'
    WHERE "userId" = target_user_id;
  END IF;
END $$;

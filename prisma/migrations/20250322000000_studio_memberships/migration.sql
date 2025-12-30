-- Rename the existing membership table to match the new model name.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'StudioMember'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'StudioMembership'
  ) THEN
    ALTER TABLE "StudioMember" RENAME TO "StudioMembership";
  END IF;
END $$;

-- Refresh the status enum with the expanded values and migrate existing rows.
DO $$
DECLARE
  has_legacy_status BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'StudioMembershipStatus'
      AND e.enumlabel IN ('pending', 'active', 'revoked')
  ) INTO has_legacy_status;

  IF has_legacy_status THEN
    ALTER TYPE "StudioMembershipStatus" RENAME TO "StudioMembershipStatus_old";
    CREATE TYPE "StudioMembershipStatus" AS ENUM ('Pending', 'Approved', 'Denied', 'Removed');
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'status'
    ) THEN
      ALTER TABLE "StudioMembership" ALTER COLUMN "status" DROP DEFAULT;
      ALTER TABLE "StudioMembership" ALTER COLUMN "status" TYPE "StudioMembershipStatus" USING (
        CASE "status"
          WHEN 'pending' THEN 'Pending'
          WHEN 'active' THEN 'Approved'
          WHEN 'revoked' THEN 'Removed'
          ELSE 'Pending'
        END::"StudioMembershipStatus"
      );
      ALTER TABLE "StudioMembership" ALTER COLUMN "status" SET DEFAULT 'Pending';
    END IF;
    DROP TYPE IF EXISTS "StudioMembershipStatus_old";
  END IF;
END $$;

-- Create the role enum and migrate existing data into it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'StudioMembershipRole'
  ) THEN
    CREATE TYPE "StudioMembershipRole" AS ENUM ('Admin', 'Member');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'role'
  ) THEN
    ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET DEFAULT 'Member';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'role' AND udt_name <> 'StudioMembershipRole'
    ) THEN
      ALTER TABLE "StudioMembership" ALTER COLUMN "role" TYPE "StudioMembershipRole" USING (
        CASE "role"
          WHEN 'Admin' THEN 'Admin'
          ELSE 'Member'
        END::"StudioMembershipRole"
      );
    END IF;
    ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET NOT NULL;
  END IF;
END $$;

-- Track updates on memberships.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "StudioMembership" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    UPDATE "StudioMembership" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
  END IF;
END $$;

-- Enforce constraints: one studio per user and one admin per studio.
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_userId_key" ON "StudioMembership"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_one_admin_per_studio" ON "StudioMembership"("studioId") WHERE "role" = 'Admin';

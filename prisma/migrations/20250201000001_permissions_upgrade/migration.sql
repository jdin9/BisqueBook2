-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'StudioMembershipRole'
  ) THEN
    CREATE TYPE "StudioMembershipRole" AS ENUM ('Admin', 'Member');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'StudioMembershipStatus'
  ) THEN
    CREATE TYPE "StudioMembershipStatus" AS ENUM ('Pending', 'Approved', 'Denied', 'Removed');
  END IF;
END $$;

-- AlterTable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Studio' AND column_name = 'inviteToken'
  ) THEN
    ALTER TABLE "Studio" ADD COLUMN "inviteToken" TEXT NOT NULL DEFAULT concat(md5(random()::text), md5(clock_timestamp()::text));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Studio' AND column_name = 'inviteTokenCreatedAt'
  ) THEN
    ALTER TABLE "Studio" ADD COLUMN "inviteTokenCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Studio' AND column_name = 'joinPasswordHash'
  ) THEN
    ALTER TABLE "Studio" ADD COLUMN "joinPasswordHash" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Studio' AND column_name = 'joinPasswordSalt'
  ) THEN
    ALTER TABLE "Studio" ADD COLUMN "joinPasswordSalt" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Studio' AND column_name = 'joinPasswordUpdatedAt'
  ) THEN
    ALTER TABLE "Studio" ADD COLUMN "joinPasswordUpdatedAt" TIMESTAMP(3);
  END IF;
END $$;

-- AlterTable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Clay' AND column_name = 'isActive'
  ) THEN
    ALTER TABLE "Clay" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Rename the legacy membership table instead of dropping it to preserve data.
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

-- Rename legacy indexes to match the new table name before recreating constraints.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'StudioMember_studioId_userId_key'
  ) THEN
    ALTER INDEX "StudioMember_studioId_userId_key" RENAME TO "StudioMembership_studioId_userId_key";
  END IF;
END $$;

-- Update the role column to use the new enum with a safe fallback.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'role'
  ) THEN
    ALTER TABLE "StudioMembership" ALTER COLUMN "role" DROP DEFAULT;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'role' AND udt_name <> 'StudioMembershipRole'
    ) THEN
      ALTER TABLE "StudioMembership" ALTER COLUMN "role" TYPE "StudioMembershipRole" USING CASE
          WHEN lower(coalesce("role", '')) = 'admin' THEN 'Admin'::"StudioMembershipRole"
          ELSE 'Member'::"StudioMembershipRole"
      END;
    END IF;
    ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET DEFAULT 'Member';
    ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET NOT NULL;
  END IF;
END $$;

-- Add new status and timestamp columns required by the updated access model.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'status'
  ) THEN
    ALTER TABLE "StudioMembership" ADD COLUMN "status" "StudioMembershipStatus" NOT NULL DEFAULT 'Pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "StudioMembership" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Ensure the existing createdAt column always has a default timestamp.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "StudioMembership" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Default any existing members to Approved so they retain access.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'status'
  ) THEN
    UPDATE "StudioMembership" SET "status" = 'Approved' WHERE "status" = 'Pending';
  END IF;
END $$;

-- Enforce new uniqueness rules: one membership per user and per studio/user pair.
DROP INDEX IF EXISTS "StudioMembership_userId_key";
DROP INDEX IF EXISTS "StudioMembership_studioId_userId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_userId_key" ON "StudioMembership"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_studioId_userId_key" ON "StudioMembership"("studioId", "userId");

-- Recreate foreign keys to reflect the renamed table.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'StudioMembership'
  ) THEN
    ALTER TABLE "StudioMembership" DROP CONSTRAINT IF EXISTS "StudioMember_studioId_fkey";
    ALTER TABLE "StudioMembership" DROP CONSTRAINT IF EXISTS "StudioMember_userId_fkey";
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND constraint_name = 'StudioMembership_studioId_fkey'
    ) THEN
      ALTER TABLE "StudioMembership" ADD CONSTRAINT "StudioMembership_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND constraint_name = 'StudioMembership_userId_fkey'
    ) THEN
      ALTER TABLE "StudioMembership" ADD CONSTRAINT "StudioMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- Token must remain unique per studio.
CREATE UNIQUE INDEX IF NOT EXISTS "Studio_inviteToken_key" ON "Studio"("inviteToken");

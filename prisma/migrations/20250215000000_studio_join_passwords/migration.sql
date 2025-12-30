-- CreateEnum (safe if it already exists)
DO $$
BEGIN
  CREATE TYPE "StudioMembershipStatus" AS ENUM ('pending', 'active', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
DO $$
BEGIN
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
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'StudioMembership'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'status'
  ) THEN
    ALTER TABLE "StudioMembership" ADD COLUMN "status" "StudioMembershipStatus" NOT NULL DEFAULT 'pending';
  END IF;
END $$;

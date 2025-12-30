-- CreateEnum (safe if it already exists)
DO $$
BEGIN
  CREATE TYPE "StudioMembershipStatus" AS ENUM ('pending', 'active', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Studio" ADD COLUMN "joinPasswordHash" TEXT;
ALTER TABLE "Studio" ADD COLUMN "joinPasswordSalt" TEXT;
ALTER TABLE "Studio" ADD COLUMN "joinPasswordUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioMember" ADD COLUMN "status" "StudioMembershipStatus" NOT NULL DEFAULT 'pending';

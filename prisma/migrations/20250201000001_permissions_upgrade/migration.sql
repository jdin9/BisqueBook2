-- CreateEnum
CREATE TYPE "StudioMembershipRole" AS ENUM ('Admin', 'Member');

-- CreateEnum
CREATE TYPE "StudioMembershipStatus" AS ENUM ('Pending', 'Approved', 'Denied', 'Removed');

-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "inviteToken" TEXT NOT NULL DEFAULT concat(md5(random()::text), md5(clock_timestamp()::text)),
ADD COLUMN     "inviteTokenCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "joinPasswordHash" TEXT,
ADD COLUMN     "joinPasswordSalt" TEXT,
ADD COLUMN     "joinPasswordUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Clay" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Rename the legacy membership table instead of dropping it to preserve data.
ALTER TABLE "StudioMember" RENAME TO "StudioMembership";

-- Rename legacy indexes to match the new table name before recreating constraints.
ALTER INDEX "StudioMember_studioId_userId_key" RENAME TO "StudioMembership_studioId_userId_key";

-- Update the role column to use the new enum with a safe fallback.
ALTER TABLE "StudioMembership" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "StudioMembership" ALTER COLUMN "role" TYPE "StudioMembershipRole" USING CASE
    WHEN lower(coalesce("role", '')) = 'admin' THEN 'Admin'::"StudioMembershipRole"
    ELSE 'Member'::"StudioMembershipRole"
END;
ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET DEFAULT 'Member';
ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET NOT NULL;

-- Add new status and timestamp columns required by the updated access model.
ALTER TABLE "StudioMembership" ADD COLUMN     "status" "StudioMembershipStatus" NOT NULL DEFAULT 'Pending';
ALTER TABLE "StudioMembership" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Ensure the existing createdAt column always has a default timestamp.
ALTER TABLE "StudioMembership" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Default any existing members to Approved so they retain access.
UPDATE "StudioMembership" SET "status" = 'Approved' WHERE "status" = 'Pending';

-- Enforce new uniqueness rules: one membership per user and per studio/user pair.
DROP INDEX IF EXISTS "StudioMembership_userId_key";
DROP INDEX IF EXISTS "StudioMembership_studioId_userId_key";
CREATE UNIQUE INDEX "StudioMembership_userId_key" ON "StudioMembership"("userId");
CREATE UNIQUE INDEX "StudioMembership_studioId_userId_key" ON "StudioMembership"("studioId", "userId");

-- Recreate foreign keys to reflect the renamed table.
ALTER TABLE "StudioMembership" DROP CONSTRAINT IF EXISTS "StudioMember_studioId_fkey";
ALTER TABLE "StudioMembership" DROP CONSTRAINT IF EXISTS "StudioMember_userId_fkey";
ALTER TABLE "StudioMembership" ADD CONSTRAINT "StudioMembership_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudioMembership" ADD CONSTRAINT "StudioMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Token must remain unique per studio.
CREATE UNIQUE INDEX "Studio_inviteToken_key" ON "Studio"("inviteToken");

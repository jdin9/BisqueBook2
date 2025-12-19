-- CreateEnum
CREATE TYPE "StudioMembershipStatus" AS ENUM ('pending', 'active', 'revoked');

-- AlterTable
ALTER TABLE "Studio" ADD COLUMN "joinPasswordHash" TEXT;
ALTER TABLE "Studio" ADD COLUMN "joinPasswordSalt" TEXT;
ALTER TABLE "Studio" ADD COLUMN "joinPasswordUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioMember" ADD COLUMN "status" "StudioMembershipStatus" NOT NULL DEFAULT 'pending';

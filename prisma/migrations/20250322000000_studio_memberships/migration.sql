-- Rename the existing membership table to match the new model name.
ALTER TABLE "StudioMember" RENAME TO "StudioMembership";

-- Refresh the status enum with the expanded values and migrate existing rows.
ALTER TYPE "StudioMembershipStatus" RENAME TO "StudioMembershipStatus_old";
CREATE TYPE "StudioMembershipStatus" AS ENUM ('Pending', 'Approved', 'Denied', 'Removed');
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
DROP TYPE "StudioMembershipStatus_old";

-- Create the role enum and migrate existing data into it.
CREATE TYPE "StudioMembershipRole" AS ENUM ('Admin', 'Member');
ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET DEFAULT 'Member';
ALTER TABLE "StudioMembership" ALTER COLUMN "role" TYPE "StudioMembershipRole" USING (
  CASE "role"
    WHEN 'Admin' THEN 'Admin'
    ELSE 'Member'
  END::"StudioMembershipRole"
);
ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET NOT NULL;

-- Track updates on memberships.
ALTER TABLE "StudioMembership" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "StudioMembership" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Enforce constraints: one studio per user and one admin per studio.
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_userId_key" ON "StudioMembership"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_one_admin_per_studio" ON "StudioMembership"("studioId") WHERE "role" = 'Admin';

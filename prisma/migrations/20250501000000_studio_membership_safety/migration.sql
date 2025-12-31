-- Safety migration to normalize StudioMembership schema without mutating prior migration history.

-- Ensure the membership table name matches the current model.
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

-- Ensure role enum exists.
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

-- Ensure status enum exists with the expected values; upgrade lowercase legacy enum if present.
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
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'StudioMembershipStatus'
    ) THEN
      CREATE TYPE "StudioMembershipStatus" AS ENUM ('Pending', 'Approved', 'Denied', 'Removed');
    END IF;
  END IF;
END $$;

-- Ensure Studio membership columns exist and types are correct.
DO $$
BEGIN
  -- role
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'role'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'role' AND udt_name <> 'StudioMembershipRole'
    ) THEN
      ALTER TABLE "StudioMembership" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TABLE "StudioMembership" ALTER COLUMN "role" TYPE "StudioMembershipRole" USING (
        CASE lower(coalesce("role", ''))
          WHEN 'admin' THEN 'Admin'
          ELSE 'Member'
        END::"StudioMembershipRole"
      );
    END IF;
    ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET DEFAULT 'Member';
    ALTER TABLE "StudioMembership" ALTER COLUMN "role" SET NOT NULL;
  ELSE
    ALTER TABLE "StudioMembership" ADD COLUMN "role" "StudioMembershipRole" NOT NULL DEFAULT 'Member';
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'status'
  ) THEN
    ALTER TABLE "StudioMembership" ADD COLUMN "status" "StudioMembershipStatus" NOT NULL DEFAULT 'Pending';
  END IF;

  -- updatedAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "StudioMembership" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    UPDATE "StudioMembership" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
  END IF;

  -- createdAt default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudioMembership' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "StudioMembership" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Enforce indexes.
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_userId_key" ON "StudioMembership"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_studioId_userId_key" ON "StudioMembership"("studioId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudioMembership_one_admin_per_studio" ON "StudioMembership"("studioId") WHERE "role" = 'Admin';

-- Recreate foreign keys if missing.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'StudioMembership'
  ) THEN
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

-- Ensure Studio join-password columns exist.
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

-- Ensure Clay has isActive flag.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Clay' AND column_name = 'isActive'
  ) THEN
    ALTER TABLE "Clay" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- Ensure Studio invite columns and unique index exist.
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
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Studio_inviteToken_key" ON "Studio"("inviteToken");

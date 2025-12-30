-- Add invite tokens to studios for controlled member onboarding.
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

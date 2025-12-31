-- Add invite tokens to studios for controlled member onboarding.
ALTER TABLE "Studio" ADD COLUMN "inviteToken" TEXT NOT NULL DEFAULT concat(md5(random()::text), md5(clock_timestamp()::text));
ALTER TABLE "Studio" ADD COLUMN "inviteTokenCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Studio_inviteToken_key" ON "Studio"("inviteToken");

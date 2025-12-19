-- Enable row level security for user profiles and migration metadata
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProfile" FORCE ROW LEVEL SECURITY;

CREATE POLICY "userprofile_self_access"
  ON "UserProfile"
  USING ("userId" = coalesce(current_setting('request.jwt.claim.sub', true), auth.uid()::text))
  WITH CHECK ("userId" = coalesce(current_setting('request.jwt.claim.sub', true), auth.uid()::text));

CREATE POLICY "userprofile_service_access"
  ON "UserProfile"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Restrict access to Prisma migration metadata to the service role
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" FORCE ROW LEVEL SECURITY;

CREATE POLICY "prisma_migrations_service_access"
  ON "_prisma_migrations"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create domain tables if they are missing (e.g., when only RLS migration was applied)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Studio'
  ) THEN
    CREATE TABLE "Studio" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "ownerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Studio_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE "StudioMembership" (
        "id" TEXT NOT NULL,
        "studioId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "StudioMembership_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE "Kiln" (
        "id" TEXT NOT NULL,
        "studioId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT,
        "maxTemperature" INTEGER,
        "atmosphere" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Kiln_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE "Clay" (
        "id" TEXT NOT NULL,
        "studioId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "manufacturer" TEXT,
        "cone" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Clay_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE "Glaze" (
        "id" TEXT NOT NULL,
        "studioId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "manufacturer" TEXT,
        "color" TEXT,
        "cone" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Glaze_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE "Project" (
        "id" TEXT NOT NULL,
        "studioId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "clayId" TEXT,
        "glazeId" TEXT,
        "createdById" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE "Firing" (
        "id" TEXT NOT NULL,
        "projectId" TEXT NOT NULL,
        "kilnId" TEXT NOT NULL,
        "firedById" TEXT,
        "type" TEXT,
        "cone" TEXT,
        "startTime" TIMESTAMP(3),
        "endTime" TIMESTAMP(3),
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Firing_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX "StudioMembership_studioId_userId_key" ON "StudioMembership"("studioId", "userId");

    ALTER TABLE "Studio" ADD CONSTRAINT "Studio_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "StudioMembership" ADD CONSTRAINT "StudioMembership_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "StudioMembership" ADD CONSTRAINT "StudioMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Kiln" ADD CONSTRAINT "Kiln_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Clay" ADD CONSTRAINT "Clay_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Glaze" ADD CONSTRAINT "Glaze_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Project" ADD CONSTRAINT "Project_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Project" ADD CONSTRAINT "Project_clayId_fkey" FOREIGN KEY ("clayId") REFERENCES "Clay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

    ALTER TABLE "Project" ADD CONSTRAINT "Project_glazeId_fkey" FOREIGN KEY ("glazeId") REFERENCES "Glaze"("id") ON DELETE SET NULL ON UPDATE CASCADE;

    ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

    ALTER TABLE "Firing" ADD CONSTRAINT "Firing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Firing" ADD CONSTRAINT "Firing_kilnId_fkey" FOREIGN KEY ("kilnId") REFERENCES "Kiln"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Firing" ADD CONSTRAINT "Firing_firedById_fkey" FOREIGN KEY ("firedById") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- Add isActive flag to clays so inactive materials stay out of selection lists
ALTER TABLE "Clay"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

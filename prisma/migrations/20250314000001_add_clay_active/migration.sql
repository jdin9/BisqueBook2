-- Add isActive flag to clays so inactive materials stay out of selection lists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Clay' AND column_name = 'isActive'
  ) THEN
    ALTER TABLE "Clay"
    ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

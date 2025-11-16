-- Add userId column to families table (nullable first to handle existing records)
ALTER TABLE "families" ADD COLUMN "user_id" text;
-- Set a default user ID for existing records (if any)
UPDATE "families" SET "user_id" = 'system-user' WHERE "user_id" IS NULL;
-- Make the column NOT NULL after populating existing records
ALTER TABLE "families" ALTER COLUMN "user_id" SET NOT NULL;
-- Create index on userId for better query performance
CREATE INDEX "families_user_id_idx" ON "families" ("user_id");


-- Add reactionType column to playlist_reactions table
-- First, add the column as nullable to handle existing records
ALTER TABLE "playlist_reactions" ADD COLUMN "reaction_type" text;

-- Set default value 'like' for existing records (if any)
UPDATE "playlist_reactions" SET "reaction_type" = 'like' WHERE "reaction_type" IS NULL;

-- Make the column NOT NULL after populating existing records
ALTER TABLE "playlist_reactions" ALTER COLUMN "reaction_type" SET NOT NULL;


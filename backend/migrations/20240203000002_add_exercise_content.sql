-- Add animation_url and description to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS animation_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

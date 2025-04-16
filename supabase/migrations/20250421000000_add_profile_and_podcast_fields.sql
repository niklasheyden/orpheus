-- Add new fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS banner_background text;

-- Add new fields to podcasts table
ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS listen_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS citation_count integer DEFAULT 0; 
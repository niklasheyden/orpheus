/*
  # Add is_public column to podcasts table

  1. Changes
    - Add is_public column with default value true
    - Update RLS policies to respect is_public flag
    
  2. Security
    - Maintains existing RLS policies
    - Adds visibility control based on is_public flag
*/

-- Add is_public column
ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Update the "Anyone can view podcasts" policy to respect is_public flag
DROP POLICY IF EXISTS "Anyone can view podcasts" ON podcasts;
CREATE POLICY "Anyone can view podcasts"
  ON podcasts
  FOR SELECT
  TO public
  USING (is_public = true);

-- Create a new policy for users to view their own private podcasts
CREATE POLICY "Users can view their own private podcasts"
  ON podcasts
  FOR SELECT
  TO authenticated
  USING (
    (is_public = true) OR
    (auth.uid() = user_id)
  ); 
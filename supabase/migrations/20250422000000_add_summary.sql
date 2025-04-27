/*
  # Add summary column to podcasts table

  1. Changes
    - Add summary column to store AI-generated summaries
    - Make the column nullable since existing podcasts won't have summaries
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add summary column
ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS summary text; 
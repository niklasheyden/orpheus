/*
  # Update podcasts table fields

  1. Changes
    - Add field_of_research column if it doesn't exist
    - Keep keywords column separate from field_of_research
    - Ensure both columns are properly typed as text
    
  2. Security
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  -- Add field_of_research column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'podcasts' 
    AND column_name = 'field_of_research'
  ) THEN
    ALTER TABLE podcasts 
    ADD COLUMN field_of_research text NOT NULL DEFAULT 'Computer Science';
  END IF;

  -- Ensure keywords column exists and is properly typed
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'podcasts' 
    AND column_name = 'keywords'
  ) THEN
    ALTER TABLE podcasts 
    ADD COLUMN keywords text NOT NULL DEFAULT '';
  END IF;
END $$; 
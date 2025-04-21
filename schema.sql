-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text,
    email text,
    role text,
    research_field text,
    experience text,
    interests text[],
    challenges text[],
    use_case text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert" ON survey_responses;
DROP POLICY IF EXISTS "Allow admin read" ON survey_responses;

-- Create policies
CREATE POLICY "Allow public insert" ON survey_responses
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read" ON survey_responses
FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- Create invite_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS invite_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    email text,
    is_used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    type text
); 
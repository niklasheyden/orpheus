-- Add is_admin column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    role text NOT NULL,
    research_field text NOT NULL,
    experience text NOT NULL,
    interests text[] NOT NULL,
    challenges text[] NOT NULL,
    use_case text NOT NULL,
    submitted_at timestamp with time zone NOT NULL,
    type text
);

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    email text NOT NULL,
    is_used boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    type text
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert" ON survey_responses;
DROP POLICY IF EXISTS "Allow admin read" ON survey_responses;
DROP POLICY IF EXISTS "Allow public insert" ON invite_codes;
DROP POLICY IF EXISTS "Allow admin read" ON invite_codes;

-- Enable RLS
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for survey_responses
CREATE POLICY "Allow public insert" ON survey_responses
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read" ON survey_responses
FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- Create policies for invite_codes
CREATE POLICY "Allow public insert" ON invite_codes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read" ON invite_codes
FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
); 
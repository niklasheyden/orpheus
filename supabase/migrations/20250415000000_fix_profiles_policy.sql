-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create a new policy that allows anyone to view profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
TO public 
USING (true);

-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 
-- Insert profiles for any users that don't have one
INSERT INTO profiles (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles); 
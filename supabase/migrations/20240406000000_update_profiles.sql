-- Update profiles table with new fields
alter table profiles
  add column if not exists full_name text,
  add column if not exists banner_url text,
  add column if not exists research_interests text[],
  add column if not exists twitter_url text,
  add column if not exists github_url text,
  add column if not exists website_url text,
  add column if not exists onboarding_completed boolean default false;

-- Add RLS policies for the new fields
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true); 
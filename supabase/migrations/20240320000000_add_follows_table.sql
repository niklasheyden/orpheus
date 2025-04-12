-- Create follows table
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure a user can't follow another user multiple times
  constraint unique_follow unique (follower_id, following_id),
  -- Prevent self-following
  constraint no_self_follow check (follower_id != following_id)
);

-- Add RLS policies
alter table public.follows enable row level security;

create policy "Users can see who they follow and who follows them"
  on public.follows for select
  using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow others"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Create indexes for better performance
create index follows_follower_id_idx on public.follows(follower_id);
create index follows_following_id_idx on public.follows(following_id); 
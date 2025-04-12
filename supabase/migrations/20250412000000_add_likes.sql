-- Create likes table
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  podcast_id uuid references public.podcasts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, podcast_id)
);

-- Enable RLS
alter table public.likes enable row level security;

-- Create policies
create policy "Users can view all likes"
  on public.likes for select
  to authenticated
  using (true);

create policy "Users can add their own likes"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists likes_user_id_idx on public.likes(user_id);
create index if not exists likes_podcast_id_idx on public.likes(podcast_id); 
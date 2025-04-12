-- Create playlists table
create table if not exists public.playlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  podcast_id uuid references public.podcasts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, podcast_id)
);

-- Enable RLS
alter table public.playlists enable row level security;

-- Create policies
create policy "Users can view their own playlists"
  on public.playlists for select
  using (auth.uid() = user_id);

create policy "Users can add to their own playlists"
  on public.playlists for insert
  with check (auth.uid() = user_id);

create policy "Users can remove from their own playlists"
  on public.playlists for delete
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists playlists_user_id_idx on public.playlists(user_id);
create index if not exists playlists_podcast_id_idx on public.playlists(podcast_id); 
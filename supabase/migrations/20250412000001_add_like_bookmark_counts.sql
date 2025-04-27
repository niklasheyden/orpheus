-- Add columns to podcasts table
alter table public.podcasts 
add column if not exists like_count integer default 0,
add column if not exists bookmark_count integer default 0;

-- Create function to update like count
create or replace function update_podcast_like_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update podcasts
    set like_count = like_count + 1
    where id = NEW.podcast_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update podcasts
    set like_count = like_count - 1
    where id = OLD.podcast_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

-- Create function to update bookmark count
create or replace function update_podcast_bookmark_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update podcasts
    set bookmark_count = bookmark_count + 1
    where id = NEW.podcast_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update podcasts
    set bookmark_count = bookmark_count - 1
    where id = OLD.podcast_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

-- Create triggers
drop trigger if exists update_podcast_like_count on public.likes;
create trigger update_podcast_like_count
after insert or delete on public.likes
for each row execute function update_podcast_like_count();

drop trigger if exists update_podcast_bookmark_count on public.playlists;
create trigger update_podcast_bookmark_count
after insert or delete on public.playlists
for each row execute function update_podcast_bookmark_count();

-- Initialize the counts from existing data
update podcasts p
set 
  like_count = (
    select count(*)
    from likes l
    where l.podcast_id = p.id
  ),
  bookmark_count = (
    select count(*)
    from playlists pl
    where pl.podcast_id = p.id
  ); 
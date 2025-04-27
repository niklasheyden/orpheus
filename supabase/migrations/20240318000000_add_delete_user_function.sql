-- Create a function to delete a user and their data
create or replace function public.delete_user(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Delete user data from tables
  delete from public.podcasts where user_id = $1;
  delete from public.likes where user_id = $1;
  delete from public.playlists where user_id = $1;
  
  -- Delete the user's auth account
  delete from auth.users where id = $1;
end;
$$; 
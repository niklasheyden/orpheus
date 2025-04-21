-- Create invite_codes table
create table if not exists invite_codes (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  is_used boolean not null default false,
  used_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  used_at timestamp with time zone
);

-- Create index on code for faster lookups
create index if not exists invite_codes_code_idx on invite_codes(code);

-- Enable RLS
alter table invite_codes enable row level security;

-- Create policies
create policy "Allow public read access to unused codes"
  on invite_codes for select
  using (not is_used);

create policy "Allow authenticated users to update their own used codes"
  on invite_codes for update
  using (auth.uid() = used_by)
  with check (auth.uid() = used_by);

create policy "Allow service role to manage all codes"
  on invite_codes for all
  using (auth.role() = 'service_role'); 
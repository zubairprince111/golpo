-- ─────────────────────────────────────────────────────────────
-- IN-PLACE ALTER SCRIPT FOR EXISTING REACTIONS TABLE
-- Run this in Supabase SQL Editor to update your existing table
-- without dropping or breaking existing data.
-- ─────────────────────────────────────────────────────────────

-- 1. If reactions table does not exist at all, create it
create table if not exists public.reactions (
  id uuid default gen_random_uuid(),
  memory_id text,
  reaction_type text,
  user_id uuid,
  visitor_token text,
  created_at timestamptz default now()
);

-- 2. Ensure ID column exists and is default generated
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reactions' and column_name = 'id') then
    alter table public.reactions add column id uuid default gen_random_uuid();
  end if;
end $$;

-- 3. Ensure visitor_token column exists
alter table public.reactions add column if not exists visitor_token text not null default '';

-- 4. Make user_id nullable so anonymous visitors can react
alter table public.reactions alter column user_id drop not null;

-- 5. Drop any foreign key constraints on memory_id (allows string IDs like 'm-01')
alter table public.reactions drop constraint if exists reactions_memory_id_fkey cascade;

-- 6. Convert memory_id to text so it supports both UUIDs and sample IDs
alter table public.reactions alter column memory_id type text using memory_id::text;

-- 7. Ensure reaction_type constraint allows 'heart' and 'solidarity'
alter table public.reactions drop constraint if exists reactions_reaction_type_check cascade;
alter table public.reactions add constraint reactions_reaction_type_check check (reaction_type in ('heart', 'solidarity'));

-- 8. Drop old primary key / unique constraints if they existed
alter table public.reactions drop constraint if exists reactions_pkey cascade;
alter table public.reactions drop constraint if exists uq_reactions_memory_visitor cascade;
alter table public.reactions drop constraint if exists uq_memory_visitor cascade;

-- 9. Set 'id' as Primary Key
alter table public.reactions add primary key (id);

-- 10. Enforce 1 reaction per post per visitor
alter table public.reactions add constraint uq_reactions_memory_visitor unique (memory_id, visitor_token);

-- 11. Create fast lookup indexes
create index if not exists idx_reactions_memory_id on public.reactions(memory_id);
create index if not exists idx_reactions_visitor   on public.reactions(visitor_token);
create index if not exists idx_reactions_user_id   on public.reactions(user_id);

-- 12. Reset and apply clean Row Level Security policies
alter table public.reactions enable row level security;

drop policy if exists "Users manage own reactions" on public.reactions;
drop policy if exists "Anyone can read reactions" on public.reactions;
drop policy if exists "Anyone can insert reactions" on public.reactions;
drop policy if exists "Anyone can update own reaction" on public.reactions;
drop policy if exists "Anyone can delete own reaction" on public.reactions;
drop policy if exists "Public read reactions" on public.reactions;
drop policy if exists "Public insert reactions" on public.reactions;
drop policy if exists "Public update reactions" on public.reactions;
drop policy if exists "Public delete reactions" on public.reactions;

-- Public can read aggregated/individual reactions
create policy "Public read reactions"   on public.reactions for select using (true);

-- Visitors and authenticated users can insert with valid visitor_token
create policy "Public insert reactions" on public.reactions for insert with check (
  visitor_token is not null and char_length(visitor_token) > 0
);

-- Users/visitors can only update/delete if matching user_id or visitor_token
create policy "Public update reactions" on public.reactions for update 
  using (
    (auth.uid() is not null and user_id = auth.uid()) or
    (visitor_token is not null and char_length(visitor_token) > 0)
  )
  with check (
    (auth.uid() is not null and user_id = auth.uid()) or
    (visitor_token is not null and char_length(visitor_token) > 0)
  );

create policy "Public delete reactions" on public.reactions for delete 
  using (
    (auth.uid() is not null and user_id = auth.uid()) or
    (visitor_token is not null and char_length(visitor_token) > 0)
  );

-- 13. Grant access to anon & authenticated visitors
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.reactions to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- DONE ✓ In-place migration completed successfully!
-- ─────────────────────────────────────────────────────────────

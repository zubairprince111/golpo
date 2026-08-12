-- ─────────────────────────────────────────────────────────────
-- FIX SAVED_MEMORIES TABLE (SUPPORTS BOTH SEED & DB MEMORIES)
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- Allows bookmarking any memory (both initial seed memories & DB stories)
-- ─────────────────────────────────────────────────────────────

-- 1. Create table if not exists
create table if not exists public.saved_memories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  memory_id  text not null,
  saved_at   timestamptz not null default now()
);

-- 2. Drop foreign key constraint on memory_id (allows string IDs like 'm-01')
alter table public.saved_memories drop constraint if exists saved_memories_memory_id_fkey cascade;

-- 3. Convert memory_id to text so it accepts both live UUIDs and sample IDs
alter table public.saved_memories alter column memory_id type text using memory_id::text;

-- 4. Ensure unique constraint on (user_id, memory_id) for upsert/deduplication
alter table public.saved_memories drop constraint if exists saved_memories_user_id_memory_id_key cascade;
alter table public.saved_memories drop constraint if exists uq_saved_user_memory cascade;
alter table public.saved_memories add constraint uq_saved_user_memory unique (user_id, memory_id);

-- 5. Fast lookup indexes
create index if not exists idx_saved_user_id   on public.saved_memories(user_id);
create index if not exists idx_saved_memory_id on public.saved_memories(memory_id);

-- 6. Enable Row Level Security & permissions
alter table public.saved_memories enable row level security;

drop policy if exists "Users manage own saved memories" on public.saved_memories;

create policy "Users manage own saved memories"
  on public.saved_memories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.saved_memories to authenticated;

-- ─────────────────────────────────────────────────────────────
-- DONE ✓
-- ─────────────────────────────────────────────────────────────

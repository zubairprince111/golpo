-- ─────────────────────────────────────────────────────────────
-- FIX REPORTS TABLE (SUPPORTS ALL STORIES & ADMIN QUEUE)
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ─────────────────────────────────────────────────────────────

-- 1. Create table if not exists
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  memory_id        text not null,
  memory_snapshot  jsonb,
  reporter_anon_id text,
  reported_by      uuid references public.profiles(id) on delete set null,
  reason           text not null,
  reason_label     text not null,
  details          text,
  status           text not null default 'pending',
  reviewed_by      uuid references public.profiles(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- 2. Drop foreign key constraint on memory_id (allows reporting seed memories like 'm-01')
alter table public.reports drop constraint if exists reports_memory_id_fkey cascade;

-- 3. Ensure memory_id is text
alter table public.reports alter column memory_id type text using memory_id::text;

-- 4. Re-apply robust check constraints for reason and status
alter table public.reports drop constraint if exists reports_reason_check cascade;
alter table public.reports drop constraint if exists reports_status_check cascade;
alter table public.reports add constraint reports_reason_check check (
  reason in ('targeting_bullying', 'personal_doxxing', 'inappropriate', 'spam_vandalism')
);
alter table public.reports add constraint reports_status_check check (
  status in ('pending', 'resolved', 'deleted')
);

-- 5. Indexes for fast admin dashboard lookup
create index if not exists idx_reports_status    on public.reports(status);
create index if not exists idx_reports_memory_id on public.reports(memory_id);
create index if not exists idx_reports_created   on public.reports(created_at desc);

-- 6. Enable Row Level Security & set policies
alter table public.reports enable row level security;

drop policy if exists "Anyone can submit a report" on public.reports;
drop policy if exists "Admins manage reports" on public.reports;
drop policy if exists "Authenticated can submit a report" on public.reports;

-- Any user can submit a report
create policy "Authenticated can submit a report"
  on public.reports for insert
  with check (true);

-- Admins can read, update, and manage reports
create policy "Admins manage reports"
  on public.reports for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

grant select, insert, update, delete on public.reports to authenticated;
grant insert on public.reports to anon;

-- ─────────────────────────────────────────────────────────────
-- DONE ✓
-- ─────────────────────────────────────────────────────────────

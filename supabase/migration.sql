-- ============================================================
-- GOLPO — Supabase PostgreSQL Schema Migration
-- Version: 1.0.0
-- Created: 2026-08-12
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard
-- 2. Open the SQL Editor (left sidebar)
-- 3. Paste this entire file and click RUN
-- 4. After running, enable Google OAuth under:
--    Authentication → Providers → Google
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- Auto-populated when a user signs in with Google OAuth.
-- Stores the user's Golpo identity (their anonymous GOLPO-XXXXX badge).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  anonymous_id  text not null unique,
  display_name  text,
  avatar_url    text,
  is_admin      boolean not null default false,
  is_banned     boolean not null default false,
  ban_reason    text,
  created_at    timestamptz not null default now(),
  last_active   timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 1a. TRIGGER: auto-create profile on Google sign-up
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_anon_id  text;
  alphabet     text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i            integer;
begin
  -- Generate a unique 5-character anonymous ID
  loop
    new_anon_id := '';
    for i in 1..5 loop
      new_anon_id := new_anon_id
        || substr(alphabet, floor(random() * length(alphabet) + 1)::integer, 1);
    end loop;
    exit when not exists (
      select 1 from public.profiles where anonymous_id = new_anon_id
    );
  end loop;

  insert into public.profiles (id, email, anonymous_id, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new_anon_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop if exists, then create cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. MEMORIES TABLE
-- Public and private memory posts anchored to Bangladesh map.
-- Coordinates are validated to Bangladesh bounding box.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.memories (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete set null,
  anonymous_id  text not null,
  title         text,
  content       text not null
                  check (char_length(content) >= 10 and char_length(content) <= 2000),
  latitude      double precision not null
                  check (latitude  between 20.5  and 26.7),
  longitude     double precision not null
                  check (longitude between 88.0  and 92.7),
  location_name text not null,
  visibility    text not null default 'public'
                  check (visibility in ('public', 'private')),
  icon          text
                  check (icon in (
                    'family','love','friendship','nostalgia','grief',
                    'solitude','journey','growth','heart','sparkle',
                    'coffee','leaf','cloud','compass','moon','flame'
                  )),
  status        text not null default 'published'
                  check (status in ('published', 'removed', 'blocked')),
  is_seed       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_memories_user_id    on public.memories(user_id);
create index if not exists idx_memories_status     on public.memories(status);
create index if not exists idx_memories_visibility on public.memories(visibility);
create index if not exists idx_memories_created_at on public.memories(created_at desc);

-- RLS
alter table public.memories enable row level security;

-- Anyone can read published public memories (the map)
create policy "Public memories visible to all"
  on public.memories for select
  using (status = 'published' and visibility = 'public');

-- Auth users can read their own private memories
create policy "Users can read own memories"
  on public.memories for select
  using (auth.uid() = user_id);

-- Only non-banned auth users can insert
create policy "Non-banned users can insert memories"
  on public.memories for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_banned = true
    )
  );

-- Users can update their own memories
create policy "Users can update own memories"
  on public.memories for update
  using (auth.uid() = user_id);

-- Users can delete their own memories
create policy "Users can delete own memories"
  on public.memories for delete
  using (auth.uid() = user_id);

-- Admins have full access
create policy "Admins have full access to memories"
  on public.memories for all
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

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists memories_updated_at on public.memories;
create trigger memories_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 3. SAVED_MEMORIES TABLE
-- Authenticated users' bookmarked/diary entries.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.saved_memories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  memory_id  uuid not null references public.memories(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  unique (user_id, memory_id)
);

create index if not exists idx_saved_user_id   on public.saved_memories(user_id);
create index if not exists idx_saved_memory_id on public.saved_memories(memory_id);

alter table public.saved_memories enable row level security;

create policy "Users manage own saved memories"
  on public.saved_memories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 4. REPORTS TABLE
-- Community safety reports submitted against memories.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id               uuid primary key default uuid_generate_v4(),
  memory_id        uuid references public.memories(id) on delete set null,
  memory_snapshot  jsonb,          -- captures content at time of reporting
  reporter_anon_id text,           -- anonymous reporter identifier
  reported_by      uuid references public.profiles(id) on delete set null,
  reason           text not null
                     check (reason in (
                       'targeting_bullying',
                       'personal_doxxing',
                       'inappropriate',
                       'spam_vandalism'
                     )),
  reason_label     text not null,
  details          text,
  status           text not null default 'pending'
                     check (status in ('pending', 'resolved', 'deleted')),
  reviewed_by      uuid references public.profiles(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists idx_reports_status    on public.reports(status);
create index if not exists idx_reports_memory_id on public.reports(memory_id);
create index if not exists idx_reports_created   on public.reports(created_at desc);

alter table public.reports enable row level security;

-- Anyone (even anonymous visitors) can submit a report
create policy "Anyone can submit a report"
  on public.reports for insert
  with check (true);

-- Only admins can read, update, and delete reports
create policy "Admins manage reports"
  on public.reports for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 5. SITE_SETTINGS TABLE
-- Admin-controlled global platform switches.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- Seed default settings
insert into public.site_settings (key, value) values
  ('submissions_enabled',  to_jsonb(true)),
  ('maintenance_mode',     to_jsonb(false)),
  ('emergency_broadcast',  'null'::jsonb),
  ('require_auth',         to_jsonb(false))
on conflict (key) do nothing;

alter table public.site_settings enable row level security;

-- Everyone reads settings (needed for broadcast banner on public map)
create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

-- Only admins can write settings
create policy "Admins can write site settings"
  on public.site_settings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 6. ANALYTICS_EVENTS TABLE
-- Lightweight event log for admin traffic dashboard.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id         bigserial primary key,
  event_type text not null
               check (event_type in (
                 'page_view',
                 'memory_created',
                 'report_submitted',
                 'user_signed_in'
               )),
  user_id    uuid references public.profiles(id) on delete set null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_type       on public.analytics_events(event_type);
create index if not exists idx_analytics_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_user_id    on public.analytics_events(user_id);

alter table public.analytics_events enable row level security;

-- Anyone (anon visitors) can insert page_view events
create policy "Anyone can insert analytics events"
  on public.analytics_events for insert
  with check (true);

-- Only admins can read analytics
create policy "Admins can read analytics"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 7. ADMIN DASHBOARD VIEW
-- Pre-aggregated stats for /aajp admin panel.
-- ─────────────────────────────────────────────────────────────
create or replace view public.admin_dashboard_stats
with (security_invoker = true)
as
select
  (select count(*)::int  from public.memories         where status = 'published')         as total_memories,
  (select count(*)::int  from public.profiles)                                             as total_users,
  (select count(*)::int  from public.profiles         where is_banned = true)             as banned_users,
  (select count(*)::int  from public.reports          where status = 'pending')           as pending_reports,
  (select count(*)::bigint from public.analytics_events where event_type = 'page_view')  as lifetime_visits,
  (select count(*)::bigint from public.analytics_events
   where event_type = 'page_view'
     and created_at >= now() - interval '7 days')                                          as visits_last_7d,
  (select count(*)::int  from public.memories
   where created_at >= now() - interval '7 days')                                          as memories_last_7d;


-- ─────────────────────────────────────────────────────────────
-- 8. DAILY ANALYTICS VIEW
-- 7-day breakdown for the admin traffic chart.
-- ─────────────────────────────────────────────────────────────
create or replace view public.admin_daily_stats
with (security_invoker = true)
as
select
  d.day::date                                                          as date,
  coalesce(pv.visits, 0)::int                                         as visits,
  coalesce(mc.submissions, 0)::int                                     as submissions,
  coalesce(rs.reports, 0)::int                                         as reports
from
  generate_series(
    (now() - interval '6 days')::date,
    now()::date,
    interval '1 day'
  ) as d(day)
left join (
  select date_trunc('day', created_at)::date as day, count(*)::int as visits
  from public.analytics_events
  where event_type = 'page_view'
    and created_at >= now() - interval '7 days'
  group by 1
) pv on pv.day = d.day::date
left join (
  select date_trunc('day', created_at)::date as day, count(*)::int as submissions
  from public.memories
  where created_at >= now() - interval '7 days'
  group by 1
) mc on mc.day = d.day::date
left join (
  select date_trunc('day', created_at)::date as day, count(*)::int as reports
  from public.reports
  where created_at >= now() - interval '7 days'
  group by 1
) rs on rs.day = d.day::date
order by d.day;


-- ─────────────────────────────────────────────────────────────
-- 9. GRANT PERMISSIONS
-- Service role bypasses RLS (used by server-side admin queries).
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

-- Anon role can read public data (map & settings)
grant select on public.memories        to anon;
grant select on public.site_settings   to anon;
grant insert on public.analytics_events to anon;
grant insert on public.reports          to anon;

-- Authenticated role
grant select, insert, update, delete on public.memories        to authenticated;
grant select, insert, delete         on public.saved_memories  to authenticated;
grant select, insert                 on public.reports         to authenticated;
grant select                         on public.site_settings   to authenticated;
grant insert                         on public.analytics_events to authenticated;
grant select, update                 on public.profiles        to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 10. AFTER FIRST LOGIN — SET YOURSELF AS ADMIN
-- After you run this migration and log in once with Google,
-- run this query with YOUR email to grant admin access:
--
--   update public.profiles
--   set is_admin = true
--   where email = 'your.email@gmail.com';
--
-- ─────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────
-- DONE ✓
-- Tables created:
--   profiles, memories, saved_memories, reports,
--   site_settings, analytics_events, reactions
-- Views created:
--   admin_dashboard_stats, admin_daily_stats
-- Triggers:
--   on_auth_user_created → auto-creates profile on Google login
--   memories_updated_at  → auto-sets updated_at on edits
-- ─────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────
-- 11. REACTIONS TABLE
-- Stores heart / solidarity reactions on memories.
-- Run this in Supabase SQL Editor if upgrading an existing DB.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.reactions (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  memory_id    uuid not null references public.memories(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'solidarity')),
  created_at   timestamptz not null default now(),
  primary key (user_id, memory_id, reaction_type)
);

create index if not exists idx_reactions_memory_id on public.reactions(memory_id);
create index if not exists idx_reactions_user_id   on public.reactions(user_id);

alter table public.reactions enable row level security;

-- Users can manage their own reactions
create policy "Users manage own reactions"
  on public.reactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone can read reaction counts
create policy "Anyone can read reactions"
  on public.reactions for select
  using (true);

-- Grant permissions
grant select           on public.reactions to anon;
grant select, insert, delete on public.reactions to authenticated;

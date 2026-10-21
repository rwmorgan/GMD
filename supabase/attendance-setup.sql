-- ============================================================
-- Attendance tracking
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor
-- -> New query -> paste -> Run). Safe to re-run.
--
-- Teacher-only: students can never read any of these tables.
--   att_classes         a class (e.g. Line 1) + its weekly lesson pattern
--   att_class_students  which class each student is in (one class each)
--   att_terms           term start/end dates (lessons are calculated
--                       from these + the weekly pattern, not stored)
--   att_closures        whole-school closed days (public holidays,
--                       pupil-free days) - shown as H
--   attendance          one row per student per lesson. status P/A/E;
--                       no row = roll not taken. Late/left-early minutes
--                       and a "called home" note ride along.
-- ============================================================

create table if not exists public.att_classes (
  id      text primary key,                    -- 'line1'
  name    text not null,
  pattern jsonb not null default '[]'::jsonb,  -- [{"dow":1,"period":"P1","slot":"L1"},...]
  sort    int  not null default 0
);

create table if not exists public.att_class_students (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  class_id   text not null references public.att_classes (id) on delete cascade
);

create table if not exists public.att_terms (
  id         text primary key,                 -- '2027-T1'
  year       int  not null,
  number     int  not null,
  name       text not null,
  start_date date not null,
  end_date   date not null
);

create table if not exists public.att_closures (
  day   date primary key,
  label text not null default ''
);

create table if not exists public.attendance (
  class_id    text not null references public.att_classes (id) on delete cascade,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  day         date not null,
  slot        text not null,                   -- 'L1' / 'L2' / 'L3'
  status      text check (status in ('P','A','E')),
  late_min    int  not null default 0 check (late_min  >= 0),
  early_min   int  not null default 0 check (early_min >= 0),
  called_home boolean not null default false,
  note        text,
  source      text not null default 'manual',  -- 'manual' | 'edupoint'
  updated_at  timestamptz not null default now(),
  primary key (class_id, student_id, day, slot)
);

create index if not exists attendance_class_day on public.attendance (class_id, day);

alter table public.att_classes        enable row level security;
alter table public.att_class_students enable row level security;
alter table public.att_terms          enable row level security;
alter table public.att_closures       enable row level security;
alter table public.attendance         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['att_classes','att_class_students','att_terms','att_closures','attendance'] loop
    execute format('drop policy if exists %I_teacher on public.%I', t, t);
    execute format('create policy %I_teacher on public.%I for all using (public.is_teacher()) with check (public.is_teacher())', t, t);
  end loop;
end $$;

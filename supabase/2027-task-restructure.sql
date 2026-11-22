-- ============================================================
-- 2027 GMD task restructure — DATABASE CHANGES.
--
-- WHEN TO RUN: only after the branch `2027-task-restructure` has been
-- merged to main and the site has updated (see 2027-task-restructure-RUN-STEPS.md).
-- Running it earlier would change what students see on the OLD site.
--
-- Run in: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Re-runnable (everything uses IF NOT EXISTS / DROP IF EXISTS / ON CONFLICT).
--
-- What it does
--   1. form_entries      — students' answers to the online forms
--                          (2.1 Steal Like a Designer, and the Unit 5
--                          Agreement / Check-in Log / Peer & Self Evaluation).
--   2. tester_assignments — which student tests which student's game.
--   3. my_test_partners() — lets a student see their partner's NAME only.
--   4. Removes the criteria/elements from task A2.1 (it is no longer marked).
--      The curriculum import only ADDS links, so this has to be done here.
--
-- Touches: two NEW tables, one NEW function, and the task_criteria /
-- task_elements rows of task A2.1 only. No existing column or table is
-- altered. Needs gen2-migration.sql (classes, can_see_student, teaches_class).
-- No student data is read or changed.
--
-- ROLLBACK: 2027-task-restructure-rollback.sql
-- ============================================================

-- ---------- 1. Form answers ----------
create table if not exists public.form_entries (
  id         bigint generated always as identity primary key,
  task_id    text not null references public.tasks (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,  -- whose answers these are
  entry_no   int  not null,
  data       jsonb not null default '{}'::jsonb,
  shared     boolean not null default false,        -- true = the tester partner may read/edit (check-in log)
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (task_id, student_id, entry_no)
);
create index if not exists form_entries_student_idx on public.form_entries (student_id);

-- ---------- 2. Developer–tester pairs ----------
-- One row per student: developer_id's game is tested by tester_id. A reciprocal
-- pair is two rows; a 3-way rotation is three. Each student tests exactly one game.
create table if not exists public.tester_assignments (
  developer_id uuid primary key references public.profiles (id) on delete cascade,
  tester_id    uuid not null unique references public.profiles (id) on delete cascade,
  class_id     text not null references public.classes (id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  check (developer_id <> tester_id)
);

-- ---------- helper functions ----------
create or replace function public.is_tester_of(p_developer uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.tester_assignments
                  where developer_id = p_developer and tester_id = auth.uid()) $$;

-- A student can see only their own partner names (profiles are otherwise private).
create or replace function public.my_test_partners()
returns table (developer_id uuid, developer_name text, tester_id uuid, tester_name text, class_id text)
language sql stable security definer set search_path = public as
$$ select a.developer_id, d.display_name, a.tester_id, t.display_name, a.class_id
   from public.tester_assignments a
   join public.profiles d on d.id = a.developer_id
   join public.profiles t on t.id = a.tester_id
   where a.developer_id = auth.uid() or a.tester_id = auth.uid() $$;
grant execute on function public.my_test_partners() to authenticated;

-- ---------- row level security ----------
alter table public.form_entries      enable row level security;
alter table public.tester_assignments enable row level security;

-- form_entries: own rows; the teacher of the student's class; a tester partner for SHARED rows only
drop policy if exists form_entries_select on public.form_entries;
create policy form_entries_select on public.form_entries for select using (
  student_id = auth.uid() or public.can_see_student(student_id)
  or (shared and public.is_tester_of(student_id)));

drop policy if exists form_entries_insert on public.form_entries;
create policy form_entries_insert on public.form_entries for insert with check (
  student_id = auth.uid() or (shared and public.is_tester_of(student_id)));

drop policy if exists form_entries_update on public.form_entries;
create policy form_entries_update on public.form_entries for update
  using      (student_id = auth.uid() or (shared and public.is_tester_of(student_id)))
  with check (student_id = auth.uid() or (shared and public.is_tester_of(student_id)));

drop policy if exists form_entries_delete on public.form_entries;
create policy form_entries_delete on public.form_entries for delete using (student_id = auth.uid());

-- tester_assignments: the two students involved can read their row; the class's teacher manages them
drop policy if exists tester_assignments_select on public.tester_assignments;
create policy tester_assignments_select on public.tester_assignments for select using (
  developer_id = auth.uid() or tester_id = auth.uid() or public.teaches_class(class_id));

drop policy if exists tester_assignments_write on public.tester_assignments;
create policy tester_assignments_write on public.tester_assignments for all
  using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));

-- ---------- 3. A2.1 "Steal Like a Designer" is formative: no criteria, no elements ----------
delete from public.task_criteria where task_id = 'A2.1';
delete from public.task_elements where task_id = 'A2.1';

-- Check: both new tables exist and A2.1 has no links.
select
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('form_entries', 'tester_assignments')) as new_tables_want_2,
  (select count(*) from public.task_criteria where task_id = 'A2.1') as a21_criteria_want_0,
  (select count(*) from public.task_elements where task_id = 'A2.1') as a21_elements_want_0;

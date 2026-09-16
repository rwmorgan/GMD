-- ============================================================
-- AI-assisted marking — audit log
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor
-- -> New query -> paste -> Run). Safe to re-run.
--
-- This table only ever RECORDS what the ai-mark Edge Function
-- drafted. It is never read by saveMarks() and never feeds back
-- into marks / mark_feedback automatically — the teacher's own
-- save action is still the only thing that creates an official
-- mark. Teacher-only visibility (students never see AI drafts).
-- ============================================================

create table if not exists public.ai_mark_suggestions (
  id            bigint generated always as identity primary key,
  student_id    uuid not null references public.profiles (id) on delete cascade,
  task_id       text not null references public.tasks (id) on delete cascade,
  submission_id bigint references public.submissions (id) on delete set null,
  model         text not null,
  ratings       jsonb not null,
  feedback      text not null,
  requested_by  uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.ai_mark_suggestions enable row level security;

drop policy if exists ai_mark_suggestions_teacher on public.ai_mark_suggestions;
create policy ai_mark_suggestions_teacher on public.ai_mark_suggestions
  for all using (public.is_teacher()) with check (public.is_teacher());

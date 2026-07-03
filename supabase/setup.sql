-- ============================================================
-- LEVEL UP LMS — Supabase setup
-- Run this whole file once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: objects are created only if missing.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

-- One row of site settings. The join code gates enrolment; the
-- teacher email is auto-promoted to the teacher role at signup.
create table if not exists public.settings (
  id            int primary key default 1 check (id = 1),
  join_code     text not null default 'CHANGE-ME',
  teacher_email text
);

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,             -- first name + last initial only
  role         text not null default 'student' check (role in ('student','teacher')),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.courses (
  id     text primary key,                -- 'ICT205114'
  title  text not null,
  level  int  not null,
  points int  not null,
  awards text not null,                   -- e.g. 'EA / CA / SA / PA'
  notes  text,
  url    text,
  sort   int not null default 0
);

create table if not exists public.criteria (
  id        text primary key,             -- 'ICT-C1'
  course_id text not null references public.courses (id) on delete cascade,
  number    int  not null,
  title     text not null
);

create table if not exists public.elements (
  id           text primary key,          -- 'ICT-C1-a'
  criterion_id text not null references public.criteria (id) on delete cascade,
  standard     text not null default 'C' check (standard in ('C','A')),
  ord          int  not null default 0,
  text         text not null
);

create table if not exists public.units (
  id          text primary key,           -- 'u1'
  number      int  not null,
  title       text not null,
  subtitle    text,
  weeks       text,                       -- 'Weeks 1–4'
  phase       int  not null default 1,
  description text,
  sort        int  not null default 0
);

create table if not exists public.tasks (
  id           text primary key,          -- 'T1.1' or 'Q1.1'
  unit_id      text not null references public.units (id) on delete cascade,
  code         text not null,             -- '1.1'
  title        text not null,
  type         text not null default 'submission' check (type in ('submission','quiz')),
  overview     text,
  body         jsonb not null default '{}'::jsonb,  -- {sections:[{title,html}], checklist:[..], marking:[{criterion_id,c,a}]}
  tools        text,
  est_time     text,
  weeks        text,
  submit_kinds text[] not null default '{file,url}', -- for submission tasks
  max_attempts int,                       -- quizzes: null = unlimited
  pass_pct     int not null default 80,   -- quizzes: celebration threshold
  published    boolean not null default true,
  sort         int not null default 0
);

create table if not exists public.task_criteria (
  task_id      text not null references public.tasks (id) on delete cascade,
  criterion_id text not null references public.criteria (id) on delete cascade,
  primary key (task_id, criterion_id)
);

create table if not exists public.task_elements (
  task_id    text not null references public.tasks (id) on delete cascade,
  element_id text not null references public.elements (id) on delete cascade,
  primary key (task_id, element_id)
);

-- Quiz questions. The answer key lives in a separate table with
-- NO select policy, so browsers can never read it.
create table if not exists public.questions (
  id      text primary key,               -- 'Q1.1-1'
  task_id text not null references public.tasks (id) on delete cascade,
  ord     int  not null default 0,
  qtype   text not null check (qtype in ('mc','multi','match','order','numeric','short')),
  prompt  text not null,
  options jsonb not null default '{}'::jsonb,
  points  numeric not null default 1,
  explain text                            -- shown after answering
);

create table if not exists public.answers (
  question_id text primary key references public.questions (id) on delete cascade,
  answer      jsonb not null
);

create table if not exists public.quiz_attempts (
  id         bigint generated always as identity primary key,
  task_id    text not null references public.tasks (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  score      numeric not null,
  max_score  numeric not null,
  responses  jsonb not null default '[]'::jsonb,  -- [{question_id,given,result,awarded}]
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id         bigint generated always as identity primary key,
  task_id    text not null references public.tasks (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  url        text,
  file_path  text,
  file_name  text,
  comment    text,
  created_at timestamptz not null default now()
);

create table if not exists public.marks (
  student_id   uuid not null references public.profiles (id) on delete cascade,
  task_id      text not null references public.tasks (id) on delete cascade,
  criterion_id text not null references public.criteria (id) on delete cascade,
  rating       text not null check (rating in ('A','C','t','z')),
  primary key (student_id, task_id, criterion_id)
);

create table if not exists public.mark_feedback (
  student_id uuid not null references public.profiles (id) on delete cascade,
  task_id    text not null references public.tasks (id) on delete cascade,
  feedback   text,
  marked_at  timestamptz not null default now(),
  primary key (student_id, task_id)
);

create table if not exists public.task_progress (
  student_id uuid not null references public.profiles (id) on delete cascade,
  task_id    text not null references public.tasks (id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (student_id, task_id)
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- ------------------------------------------------------------

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'teacher' and active) $$;

-- Students cannot change their own role/active flags.
create or replace function public.enforce_profile_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_teacher() then
    new.role   := old.role;
    new.active := old.active;
  end if;
  return new;
end $$;

drop trigger if exists profile_guard on public.profiles;
create trigger profile_guard before update on public.profiles
for each row execute function public.enforce_profile_guard();

-- ------------------------------------------------------------
-- 3. SIGNUP: redeem the class join code
-- ------------------------------------------------------------
-- Called by the app right after auth signup. Without a valid
-- code no profile row exists and RLS blocks everything.

create or replace function public.redeem_join_code(p_code text, p_display_name text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_set   record;
  v_email text;
  v_role  text := 'student';
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select * into v_set from settings where id = 1;
  if v_set.join_code is null or lower(trim(p_code)) <> lower(trim(v_set.join_code)) then
    raise exception 'Invalid join code';
  end if;
  select email into v_email from auth.users where id = v_uid;
  if v_set.teacher_email is not null and lower(v_email) = lower(trim(v_set.teacher_email)) then
    v_role := 'teacher';
  end if;
  insert into profiles (id, display_name, role)
  values (v_uid, left(trim(p_display_name), 60), v_role)
  on conflict (id) do update set display_name = excluded.display_name;
  return v_role;
end $$;

-- ------------------------------------------------------------
-- 4. QUIZ GRADING (server-side; answer keys never leave the DB)
-- ------------------------------------------------------------
-- p_answers: {"<question_id>": <given>, ...}
--   mc      given = option index (number)
--   multi   given = array of option indexes
--   match   given = array: position i = chosen right-side index for left item i
--   order   given = array of item indexes in the student's order
--   numeric given = number
--   short   given = string
-- Partial credit: multi/match/order score proportionally.

create or replace function public.submit_quiz_attempt(p_task_id text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_task    record;
  q         record;
  given     jsonb;
  v_score   numeric := 0;
  v_max     numeric := 0;
  v_frac    numeric;
  v_awarded numeric;
  v_detail  jsonb := '[]'::jsonb;
  v_result  text;
  v_used    int;
  v_id      bigint;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from profiles where id = v_uid and active) then
    raise exception 'No active profile';
  end if;

  select * into v_task from tasks where id = p_task_id and type = 'quiz' and published;
  if not found then raise exception 'Quiz not found'; end if;

  if v_task.max_attempts is not null then
    select count(*) into v_used from quiz_attempts where task_id = p_task_id and student_id = v_uid;
    if v_used >= v_task.max_attempts then raise exception 'No attempts remaining'; end if;
  end if;

  for q in
    select qq.id, qq.qtype, qq.points, qq.explain, a.answer
    from questions qq join answers a on a.question_id = qq.id
    where qq.task_id = p_task_id
    order by qq.ord
  loop
    given := p_answers -> q.id;
    v_max := v_max + q.points;
    v_frac := 0;

    if given is not null and jsonb_typeof(given) <> 'null' then
      if q.qtype = 'mc' then
        if (given #>> '{}') = (q.answer ->> 'correct') then v_frac := 1; end if;

      elsif q.qtype = 'multi' then
        declare
          n_right int := coalesce(jsonb_array_length(q.answer -> 'correct'), 0);
          n_hit   int := 0;
          n_wrong int := 0;
          sel     jsonb;
        begin
          for sel in select * from jsonb_array_elements(given) loop
            if q.answer -> 'correct' @> jsonb_build_array((sel #>> '{}')::int) then
              n_hit := n_hit + 1;
            else
              n_wrong := n_wrong + 1;
            end if;
          end loop;
          if n_right > 0 then
            v_frac := greatest(0, (n_hit - n_wrong)::numeric / n_right);
          end if;
        end;

      elsif q.qtype in ('match','order') then
        declare
          n_total int := coalesce(jsonb_array_length(q.answer -> 'correct'), 0);
          n_hit   int := 0;
          i       int;
        begin
          for i in 0 .. n_total - 1 loop
            if (given ->> i) is not distinct from (q.answer -> 'correct' ->> i) then
              n_hit := n_hit + 1;
            end if;
          end loop;
          if n_total > 0 then v_frac := n_hit::numeric / n_total; end if;
        end;

      elsif q.qtype = 'numeric' then
        begin
          if abs((given #>> '{}')::numeric - (q.answer ->> 'value')::numeric)
             <= coalesce((q.answer ->> 'tolerance')::numeric, 0) then
            v_frac := 1;
          end if;
        exception when others then v_frac := 0;
        end;

      elsif q.qtype = 'short' then
        declare
          v_given text := lower(trim(given #>> '{}'));
          pat     jsonb;
        begin
          for pat in select * from jsonb_array_elements(q.answer -> 'accept') loop
            if coalesce((q.answer ->> 'regex')::boolean, false) then
              if v_given ~* ('^' || (pat #>> '{}') || '$') then v_frac := 1; exit; end if;
            else
              if v_given = lower(trim(pat #>> '{}')) then v_frac := 1; exit; end if;
            end if;
          end loop;
        end;
      end if;
    end if;

    v_awarded := round(q.points * v_frac, 2);
    v_score := v_score + v_awarded;
    v_result := case when v_frac >= 1 then 'correct' when v_frac > 0 then 'partial' else 'incorrect' end;
    v_detail := v_detail || jsonb_build_object(
      'question_id', q.id, 'given', given, 'result', v_result,
      'awarded', v_awarded, 'points', q.points, 'explain', q.explain);
  end loop;

  insert into quiz_attempts (task_id, student_id, score, max_score, responses)
  values (p_task_id, v_uid, v_score, v_max, v_detail)
  returning id into v_id;

  return jsonb_build_object('attempt_id', v_id, 'score', v_score, 'max', v_max, 'detail', v_detail);
end $$;

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.settings      enable row level security;
alter table public.profiles      enable row level security;
alter table public.courses       enable row level security;
alter table public.criteria      enable row level security;
alter table public.elements      enable row level security;
alter table public.units         enable row level security;
alter table public.tasks         enable row level security;
alter table public.task_criteria enable row level security;
alter table public.task_elements enable row level security;
alter table public.questions     enable row level security;
alter table public.answers       enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.submissions   enable row level security;
alter table public.marks         enable row level security;
alter table public.mark_feedback enable row level security;
alter table public.task_progress enable row level security;

-- settings: teacher only (join code stays secret)
drop policy if exists settings_teacher on public.settings;
create policy settings_teacher on public.settings
  for all using (public.is_teacher()) with check (public.is_teacher());

-- profiles: see self; teacher sees all; self-update guarded by trigger
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_teacher());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_teacher());
drop policy if exists profiles_teacher_delete on public.profiles;
create policy profiles_teacher_delete on public.profiles
  for delete using (public.is_teacher());

-- curriculum: public read (published tasks only), teacher write
do $$
declare t text;
begin
  foreach t in array array['courses','criteria','elements','units','task_criteria','task_elements'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (true)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all using (public.is_teacher()) with check (public.is_teacher())', t, t);
  end loop;
end $$;

drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks
  for select using (published or public.is_teacher());
drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists questions_read on public.questions;
create policy questions_read on public.questions
  for select using (exists (select 1 from tasks t where t.id = task_id and t.published) or public.is_teacher());
drop policy if exists questions_write on public.questions;
create policy questions_write on public.questions
  for all using (public.is_teacher()) with check (public.is_teacher());

-- answers: TEACHER ONLY. Students grade via the RPC above.
drop policy if exists answers_teacher on public.answers;
create policy answers_teacher on public.answers
  for all using (public.is_teacher()) with check (public.is_teacher());

-- attempts: own rows (insert happens inside the RPC); teacher reads all
drop policy if exists attempts_select on public.quiz_attempts;
create policy attempts_select on public.quiz_attempts
  for select using (student_id = auth.uid() or public.is_teacher());

-- submissions: create/see own; teacher sees all
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions
  for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions
  for insert with check (student_id = auth.uid());
drop policy if exists submissions_teacher_delete on public.submissions;
create policy submissions_teacher_delete on public.submissions
  for delete using (public.is_teacher());

-- marks + feedback: teacher writes, student reads own
drop policy if exists marks_select on public.marks;
create policy marks_select on public.marks
  for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists marks_write on public.marks;
create policy marks_write on public.marks
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists feedback_select on public.mark_feedback;
create policy feedback_select on public.mark_feedback
  for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists feedback_write on public.mark_feedback;
create policy feedback_write on public.mark_feedback
  for all using (public.is_teacher()) with check (public.is_teacher());

-- task progress: own rows; teacher reads all
drop policy if exists progress_select on public.task_progress;
create policy progress_select on public.task_progress
  for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists progress_insert on public.task_progress;
create policy progress_insert on public.task_progress
  for insert with check (student_id = auth.uid());

-- ------------------------------------------------------------
-- 6. STORAGE: private bucket for file submissions
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- Files are stored under <student-uuid>/<filename>
drop policy if exists sub_upload on storage.objects;
create policy sub_upload on storage.objects
  for insert with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists sub_read on storage.objects;
create policy sub_read on storage.objects
  for select using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_teacher())
  );

-- ------------------------------------------------------------
-- 7. AFTER RUNNING THIS FILE
-- ------------------------------------------------------------
-- a) Set your join code and your own email (auto-promotes you
--    to teacher when you sign up):
--      update settings set join_code = 'YOUR-CODE', teacher_email = 'you@education.tas.gov.au' where id = 1;
-- b) Sign up on the site with that email + the join code.
-- c) In the teacher dashboard, open Settings → "Import curriculum"
--    to load all units, tasks and quizzes.

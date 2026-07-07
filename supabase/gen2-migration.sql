-- ============================================================
-- GEN2 MIGRATION — multi-course, multi-teacher extension
-- Run ONCE in the Supabase SQL Editor, AFTER setup.sql.
-- Idempotent + additive: safe to re-run, does not drop data.
-- ------------------------------------------------------------
-- Terminology note (important):
--   The build spec's "course" (GMD / General Maths / Automotive)
--   maps to the NEW `programs` table here, because the existing
--   `courses` table is already occupied by TASC subject codes
--   (ESC205114, ICT205114, PRJ205118, MTG215123 ...). A program
--   groups one or more TASC courses + their units + classes.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROGRAMS  (top level: GMD, Gen2, future Automotive)
-- ------------------------------------------------------------
create table if not exists public.programs (
  id            text primary key,            -- 'GMD', 'GEN2'
  title         text not null,
  site_path     text,                        -- 'GMD', 'Gen2'
  rating_scale  text not null default 'ACt', -- informational: allowed criterion ratings
  sort          int  not null default 0
);

insert into public.programs (id, title, site_path, rating_scale, sort) values
  ('GMD',  'Game Making & Design', 'GMD',  'ACtz', 0),
  ('GEN2', 'General Mathematics',  'Gen2', 'ABCt', 1)
on conflict (id) do nothing;

-- Attach existing curriculum to the GMD program.
alter table public.courses add column if not exists program_id text references public.programs (id);
alter table public.units   add column if not exists program_id text references public.programs (id);

update public.courses set program_id = 'GMD' where program_id is null;
update public.units   set program_id = 'GMD' where program_id is null;

-- ------------------------------------------------------------
-- 2. ROLES: add 'lal' (Learning Area Leader / admin)
-- ------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add  constraint profiles_role_check
  check (role in ('student','teacher','lal'));

-- General Maths reports A/B/C(+t); GMD used A/C(+t/z). Allow both.
alter table public.marks drop constraint if exists marks_rating_check;
alter table public.marks add  constraint marks_rating_check
  check (rating in ('A','B','C','t','z'));

-- ------------------------------------------------------------
-- 3. CLASSES / TEACHERS / ENROLMENTS
-- ------------------------------------------------------------
-- A class belongs to one program, has one join code and its own
-- delivery pace (no global week counter). Students join a class.
create table if not exists public.classes (
  id              text primary key,          -- 'gen2-morgan-a'
  program_id      text not null references public.programs (id),
  name            text not null,
  join_code       text not null unique,
  primary_teacher_id uuid references public.profiles (id) on delete set null,
  current_unit_id text references public.units (id),      -- where this class is up to
  pace_note       text,                                   -- free text, e.g. 'behind on trig'
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Which teachers may manage a class (primary + any assistants/co-teachers).
create table if not exists public.class_teachers (
  class_id   text not null references public.classes (id)  on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'assistant' check (role in ('primary','assistant')),
  primary key (class_id, teacher_id)
);

-- A student is enrolled in a class (which implies a program/course).
create table if not exists public.enrolments (
  student_id uuid not null references public.profiles (id) on delete cascade,
  class_id   text not null references public.classes (id)  on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (student_id, class_id)
);

create index if not exists enrolments_class_idx    on public.enrolments (class_id);
create index if not exists class_teachers_tid_idx  on public.class_teachers (teacher_id);

-- Keep class_teachers in sync when a primary teacher is set.
create or replace function public.sync_primary_teacher()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.primary_teacher_id is not null then
    insert into class_teachers (class_id, teacher_id, role)
    values (new.id, new.primary_teacher_id, 'primary')
    on conflict (class_id, teacher_id) do update set role = 'primary';
  end if;
  return new;
end $$;

drop trigger if exists class_primary_sync on public.classes;
create trigger class_primary_sync after insert or update of primary_teacher_id on public.classes
for each row execute function public.sync_primary_teacher();

-- ------------------------------------------------------------
-- 4. HELPER FUNCTIONS  (security definer => bypass RLS, no recursion)
-- ------------------------------------------------------------
-- Redefine is_teacher() to mean "staff" (teacher OR lal) so every
-- existing policy that calls it keeps working and now includes LAL.
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles
                  where id = auth.uid() and role in ('teacher','lal') and active) $$;

create or replace function public.is_lal()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles
                  where id = auth.uid() and role = 'lal' and active) $$;

-- Does the current user teach this class? (LAL sees all.)
create or replace function public.teaches_class(p_class text)
returns boolean language sql stable security definer set search_path = public as
$$ select public.is_lal()
        or exists (select 1 from class_teachers
                   where class_id = p_class and teacher_id = auth.uid()) $$;

-- May the current user see this student's data?
--   self, OR LAL, OR a teacher of a class the student is enrolled in.
create or replace function public.can_see_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select p_student = auth.uid()
        or public.is_lal()
        or exists (
             select 1 from enrolments e
             join class_teachers ct on ct.class_id = e.class_id
             where e.student_id = p_student and ct.teacher_id = auth.uid()) $$;

-- ------------------------------------------------------------
-- 5. ENROLMENT: redeem a CLASS join code
-- ------------------------------------------------------------
-- Unifies GMD + Gen2: the code identifies the class, which implies
-- the program. Creates a student profile if none, then enrols.
-- Teachers/LAL keep their role (never demoted to student here).
create or replace function public.redeem_class_code(p_code text, p_display_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_class record;
  v_role  text;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;

  select * into v_class from classes
   where lower(trim(join_code)) = lower(trim(p_code)) and active;
  if not found then raise exception 'Invalid join code'; end if;

  insert into profiles (id, display_name, role)
  values (v_uid, left(trim(p_display_name), 60), 'student')
  on conflict (id) do update set display_name = excluded.display_name;

  select role into v_role from profiles where id = v_uid;

  insert into enrolments (student_id, class_id)
  values (v_uid, v_class.id)
  on conflict (student_id, class_id) do nothing;

  return jsonb_build_object(
    'class_id', v_class.id, 'class_name', v_class.name,
    'program_id', v_class.program_id, 'role', v_role);
end $$;

-- Backwards-compatible shim: the app still calls redeem_join_code(code,name).
-- It now resolves the code to a class and enrols. Returns the role text.
create or replace function public.redeem_join_code(p_code text, p_display_name text)
returns text language plpgsql security definer set search_path = public as $$
declare v_res jsonb;
begin
  v_res := public.redeem_class_code(p_code, p_display_name);
  return v_res ->> 'role';
end $$;

-- LAL-only: promote/demote an account (invite-based teacher onboarding).
create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_lal() then raise exception 'Only the Learning Area Leader can set roles'; end if;
  if p_role not in ('student','teacher','lal') then raise exception 'Invalid role'; end if;
  update profiles set role = p_role where id = p_user;
end $$;

-- ------------------------------------------------------------
-- 6. QUIZ GRADING: add matrix + fill-blank handling
-- ------------------------------------------------------------
-- Extend the question-type whitelist. 'numeric'/'short' already
-- cover numeric-with-tolerance and fill-blank; add 'matrix'.
alter table public.questions drop constraint if exists questions_qtype_check;
alter table public.questions add  constraint questions_qtype_check
  check (qtype in ('mc','multi','match','order','numeric','short','matrix'));

-- Grade a matrix question: answer = {rows, cols, cells:[[..]], tolerance}.
-- given = [[..],[..]] of the same shape; each cell numeric-with-tolerance;
-- score is the fraction of correct cells (partial credit).
-- (Full grading logic is added by re-running the patched submit_quiz_attempt
--  below; the branch is appended to the existing type ladder.)
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

      elsif q.qtype = 'matrix' then
        -- answer.cells = [[..row..],..]; per-cell tolerance from answer.tolerance
        -- (or per-cell answer.tol[[..]] if present). Fraction of correct cells.
        declare
          rows   int := coalesce(jsonb_array_length(q.answer -> 'cells'), 0);
          cols   int;
          n_tot  int := 0;
          n_hit  int := 0;
          ri     int;
          ci     int;
          gt     numeric;
          ct     numeric;
          tol    numeric := coalesce((q.answer ->> 'tolerance')::numeric, 0);
        begin
          for ri in 0 .. rows - 1 loop
            cols := coalesce(jsonb_array_length(q.answer -> 'cells' -> ri), 0);
            for ci in 0 .. cols - 1 loop
              n_tot := n_tot + 1;
              begin
                ct := (q.answer -> 'cells' -> ri ->> ci)::numeric;
                gt := (given -> ri ->> ci)::numeric;
                if abs(gt - ct) <= tol then n_hit := n_hit + 1; end if;
              exception when others then null;  -- missing/non-numeric cell = wrong
              end;
            end loop;
          end loop;
          if n_tot > 0 then v_frac := n_hit::numeric / n_tot; end if;
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
-- 7. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.programs       enable row level security;
alter table public.classes        enable row level security;
alter table public.class_teachers enable row level security;
alter table public.enrolments     enable row level security;

-- programs: public read, LAL write
drop policy if exists programs_read on public.programs;
create policy programs_read on public.programs for select using (true);
drop policy if exists programs_write on public.programs;
create policy programs_write on public.programs
  for all using (public.is_lal()) with check (public.is_lal());

-- classes: staff see classes they teach (LAL all); students see their own enrolled class
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes
  for select using (
    public.teaches_class(id)
    or exists (select 1 from enrolments e where e.class_id = id and e.student_id = auth.uid())
  );
drop policy if exists classes_insert on public.classes;
create policy classes_insert on public.classes
  for insert with check (public.is_teacher());          -- staff create classes
drop policy if exists classes_update on public.classes;
create policy classes_update on public.classes
  for update using (public.teaches_class(id)) with check (public.teaches_class(id));
drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes
  for delete using (public.is_lal());

-- class_teachers: staff of the class + LAL manage; teachers can see their own memberships
drop policy if exists class_teachers_select on public.class_teachers;
create policy class_teachers_select on public.class_teachers
  for select using (teacher_id = auth.uid() or public.teaches_class(class_id));
drop policy if exists class_teachers_write on public.class_teachers;
create policy class_teachers_write on public.class_teachers
  for all using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));

-- enrolments: student sees own; class teacher sees their class roster; LAL all
drop policy if exists enrolments_select on public.enrolments;
create policy enrolments_select on public.enrolments
  for select using (student_id = auth.uid() or public.teaches_class(class_id));
drop policy if exists enrolments_write on public.enrolments;
create policy enrolments_write on public.enrolments
  for all using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));
-- (students self-enrol only through redeem_class_code, which is security definer)

-- ---- Tighten the student-data tables to be CLASS-SCOPED ----
-- profiles: self, or a teacher who teaches a class this student is in, or LAL
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.can_see_student(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.can_see_student(id));
drop policy if exists profiles_teacher_delete on public.profiles;
create policy profiles_teacher_delete on public.profiles
  for delete using (public.is_lal());

-- quiz attempts: own, or a teacher of the student's class, or LAL
drop policy if exists attempts_select on public.quiz_attempts;
create policy attempts_select on public.quiz_attempts
  for select using (public.can_see_student(student_id));

-- submissions
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions
  for select using (public.can_see_student(student_id));
drop policy if exists submissions_teacher_delete on public.submissions;
create policy submissions_teacher_delete on public.submissions
  for delete using (public.is_teacher() and public.can_see_student(student_id));

-- marks + feedback: staff of the student's class write; student reads own
drop policy if exists marks_select on public.marks;
create policy marks_select on public.marks
  for select using (public.can_see_student(student_id));
drop policy if exists marks_write on public.marks;
create policy marks_write on public.marks
  for all using (public.is_teacher() and public.can_see_student(student_id))
      with check (public.is_teacher() and public.can_see_student(student_id));

drop policy if exists feedback_select on public.mark_feedback;
create policy feedback_select on public.mark_feedback
  for select using (public.can_see_student(student_id));
drop policy if exists feedback_write on public.mark_feedback;
create policy feedback_write on public.mark_feedback
  for all using (public.is_teacher() and public.can_see_student(student_id))
      with check (public.is_teacher() and public.can_see_student(student_id));

-- task progress
drop policy if exists progress_select on public.task_progress;
create policy progress_select on public.task_progress
  for select using (public.can_see_student(student_id));

-- Storage: teachers should only reach files of students they teach.
drop policy if exists sub_read on storage.objects;
create policy sub_read on storage.objects
  for select using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[1] = auth.uid()::text
         or public.can_see_student(((storage.foldername(name))[1])::uuid))
  );

-- ------------------------------------------------------------
-- 8. SEED: General Mathematics course + its 8 criteria
--    (units/tasks/questions are added per-topic in the content phase)
-- ------------------------------------------------------------
insert into public.courses (id, title, level, points, awards, notes, sort, program_id) values
  ('MTG215123', 'General Mathematics', 2, 15, 'EA / HA / CA / SA / PA',
   'TASC Level 2. Modules 1–3; 8 criteria; ratings A/B/C(+t).', 10, 'GEN2')
on conflict (id) do update set program_id = 'GEN2';

insert into public.criteria (id, course_id, number, title) values
  ('GM-C1','MTG215123',1,'communicate mathematical ideas and information and apply mathematical conventions'),
  ('GM-C2','MTG215123',2,'manage and take responsibility for learning and evaluate mathematical development'),
  ('GM-C3','MTG215123',3,'apply mathematical and statistical models to investigate, represent and analyse real-world situations and solve problems'),
  ('GM-C4','MTG215123',4,'use digital technology and other sources to develop mathematical ideas and find solutions to mathematical problems'),
  ('GM-C5','MTG215123',5,'interpret concepts and apply mathematical techniques to solve problems involving algebra and matrices'),
  ('GM-C6','MTG215123',6,'interpret concepts and apply mathematical techniques to model and solve problems involving linear equations and finance in a variety of contexts'),
  ('GM-C7','MTG215123',7,'interpret concepts and apply mathematical techniques to solve problems involving univariate data analysis using the statistical investigation process'),
  ('GM-C8','MTG215123',8,'interpret concepts and apply mathematical techniques to solve problems involving right-angled trigonometry, shape and measurement in a variety of contexts')
on conflict (id) do update set title = excluded.title, course_id = excluded.course_id;

-- ------------------------------------------------------------
-- 9. BOOTSTRAP: promote the LAL and migrate GMD to a class
-- ------------------------------------------------------------
-- Uses the existing settings.teacher_email to identify Rob (LAL),
-- then wraps existing GMD students into a default class so the
-- class-scoped policies keep working for the live course.
do $$
declare
  v_lal   uuid;
  v_code  text;
begin
  select p.id into v_lal
    from profiles p join auth.users u on u.id = p.id
    join settings s on s.id = 1
   where lower(u.email) = lower(trim(s.teacher_email))
   limit 1;

  if v_lal is not null then
    update profiles set role = 'lal', active = true where id = v_lal;
  end if;

  select coalesce(nullif(trim(join_code),''), 'GMD-2026') into v_code from settings where id = 1;

  insert into classes (id, program_id, name, join_code, primary_teacher_id)
  values ('gmd-default', 'GMD', 'GMD 2026', v_code, v_lal)
  on conflict (id) do nothing;

  -- Enrol every existing student into the default GMD class.
  insert into enrolments (student_id, class_id)
  select id, 'gmd-default' from profiles where role = 'student'
  on conflict (student_id, class_id) do nothing;
end $$;

-- ------------------------------------------------------------
-- 10. AFTER RUNNING THIS FILE
-- ------------------------------------------------------------
-- a) Confirm you (LAL) can sign in and see the teacher dashboard.
-- b) Create a Gen2 class:
--      insert into classes (id, program_id, name, join_code, primary_teacher_id)
--      values ('gen2-morgan-a','GEN2','General Maths 11A','GEN2-A-2026', '<your-uuid>');
-- c) Invite a colleague: they sign up, then you run
--      select admin_set_role('<their-uuid>', 'teacher');
--    and add them to a class via the class_teachers table (or the
--    dashboard once Phase 4 ships).
-- d) Verify isolation (Phase 5): sign in as teacher B and confirm a
--    select on teacher A's students returns zero rows.

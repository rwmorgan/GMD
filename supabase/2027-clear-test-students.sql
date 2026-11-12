-- ============================================================
-- CLEAR THE 2026 TEST STUDENTS (destructive — read first).
--
-- Deletes every STUDENT account and everything attached to it:
-- submissions, marks, feedback, quiz attempts, task progress,
-- class enrolments and attendance. It does NOT touch:
--   * your teacher / LAL account(s)
--   * tasks, quizzes, units, criteria (the curriculum)
--   * classes, join codes, attendance classes/terms/closures
-- It refuses to run if any General Maths (non-GMD) student exists,
-- because those are student accounts too.
-- It cannot be undone. Only run it if the data really is test data.
--
-- Run in: Supabase dashboard → SQL Editor.
--
-- HOW: run the file as it is — it deletes NOTHING, and the table at the
-- bottom shows what exists now (including how many General Maths
-- students; must be 0). To delete, change
--     v_really_delete boolean := false;
-- to  true  below and run again; the same table then shows the result
-- (everything 0).
--
-- Uploaded files are NOT removed by this SQL: afterwards open
-- Dashboard → Storage → submissions and delete the student folders.
-- ============================================================

do $$
declare
  v_really_delete boolean := false;   -- <<< change to true to delete
  v_gen2 int;
  v_n int;
begin
  if not v_really_delete then
    raise notice 'Nothing deleted (v_really_delete is false).';
    return;
  end if;

  select count(distinct e.student_id) into v_gen2
  from public.enrolments e join public.classes c on c.id = e.class_id
  where c.program_id <> 'GMD';
  if v_gen2 > 0 then
    raise exception 'Stopped: % student(s) are in a non-GMD (General Maths) class. Nothing deleted.', v_gen2;
  end if;

  -- Deleting the auth user cascades to profiles and from there to every
  -- table in the list below (all reference profiles ... on delete cascade).
  delete from auth.users where id in (select id from public.profiles where role = 'student');
  get diagnostics v_n = row_count;
  raise notice 'Deleted % student account(s) and all their work.', v_n;
end $$;

-- The result you see. Before deleting: what would go. After: all 0.
select 'student accounts' as what, count(*) as n from public.profiles where role = 'student'
union all select 'submissions',   count(*) from public.submissions
union all select 'marks',         count(*) from public.marks
union all select 'mark_feedback', count(*) from public.mark_feedback
union all select 'quiz_attempts', count(*) from public.quiz_attempts
union all select 'task_progress', count(*) from public.task_progress
union all select 'enrolments',    count(*) from public.enrolments
union all select 'students in General Maths classes (must be 0 to delete)', count(distinct e.student_id)
  from public.enrolments e join public.classes c on c.id = e.class_id where c.program_id <> 'GMD';

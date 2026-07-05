-- ============================================================
-- Post-import cleanup for the 2026-07-05 Canvas resync.
--
-- The "Import / update curriculum" button UPSERTS — it never
-- deletes. After importing the new seed (units u1–u5, tasks
-- A*.*, quizzes QZ*.*), the pre-sync tasks (T*.*), quizzes
-- (Q*.*) and unit u6 remain in the database until removed.
--
-- Run STEP 1 first. Deleting a task cascades to its questions,
-- answers, submissions, marks, quiz attempts and progress —
-- so only run STEP 2 when STEP 1 shows nothing you want to keep
-- (export CSVs from Teach → Settings first if in doubt).
--
-- Run in: Supabase dashboard → SQL Editor.
-- ============================================================

-- STEP 1 — check for student work attached to the old tasks.
select 'submissions'  as kind, task_id, count(*) from public.submissions
  where task_id like 'T%' or task_id like 'Q%' group by task_id
union all
select 'quiz_attempts', task_id, count(*) from public.quiz_attempts
  where task_id like 'T%' or task_id like 'Q%' group by task_id
union all
select 'marks', task_id, count(*) from public.marks
  where task_id like 'T%' or task_id like 'Q%' group by task_id
order by kind, task_id;

-- STEP 2 — remove the retired curriculum (uncomment to run).
-- All old ids used the T/Q prefixes; the new seed uses A/QZ.
-- delete from public.tasks where id like 'T%' or (id like 'Q%' and id not like 'QZ%');
-- delete from public.units where id = 'u6';

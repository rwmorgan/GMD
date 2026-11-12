-- ============================================================
-- 2027 GMD classes: Line 1 and Line 3.
--
-- Creates two classes, each with its OWN join code, and closes the
-- old "GMD 2026" test class to new sign-ups. Students who sign up
-- with a class's code are enrolled in that class automatically.
--
-- Run ONCE in: Supabase dashboard → SQL Editor → New query → Run.
-- Re-runnable: existing classes are left alone (ON CONFLICT DO NOTHING).
-- Change the join codes below first if you want different ones
-- (or change them later in Teach → Settings → Classes & join codes).
--
-- Touches only the classes table, for the GMD program.
-- REQUIRES supabase/gen2-migration.sql to have been run first (it creates
-- the classes/enrolments tables). If you get 'relation public.classes
-- does not exist', run that file first, then this one.
-- No student data is touched.
--
-- ROLLBACK:
--   delete from public.classes where id in ('gmd-line1-2027','gmd-line3-2027');
--   update public.classes set active = true where id = 'gmd-default';
-- ============================================================

do $$
declare
  v_teacher uuid;
begin
  -- You: prefer the LAL account, else any active teacher.
  select id into v_teacher from public.profiles
   where role in ('lal', 'teacher') and active
   order by (role = 'lal') desc, created_at
   limit 1;

  insert into public.classes (id, program_id, name, join_code, primary_teacher_id)
  values
    ('gmd-line1-2027', 'GMD', 'GMD Line 1 2027', 'GMD-L1-2027', v_teacher),
    ('gmd-line3-2027', 'GMD', 'GMD Line 3 2027', 'GMD-L3-2027', v_teacher)
  on conflict (id) do nothing;

  -- Close the 2026 test class to new sign-ups (its students/work are kept
  -- until you clear them with 2027-clear-test-students.sql).
  update public.classes
     set active = false, name = 'GMD 2026 (test — closed)'
   where id = 'gmd-default';
end $$;

-- Check: you should see the two new classes (active) and the old one closed.
select id, name, join_code, active,
       (select count(*) from public.enrolments e where e.class_id = c.id) as students
from public.classes c
where program_id = 'GMD'
order by active desc, name;

-- ============================================================
-- 2027 task restructure — ROLLBACK of the database side.
--
-- The import never deletes, so undoing the restructure takes two steps:
--   1. Git: revert the merge on main, push, then press
--      Teach → Settings → "Import / update curriculum" again. This restores the
--      old task text, rubric rows and published flags (A2.1, A3.1, A3.2, A4.2, A5.x).
--   2. Run THIS file to put the links back and hide the new Unit 5 tasks.
--
-- Re-runnable. Touches only the task ids named below in tasks / task_criteria /
-- task_elements. The two new tables are LEFT IN PLACE (they are harmless and may
-- hold students' answers); the optional DROP at the bottom is commented out.
--
-- Run in: Supabase dashboard → SQL Editor.
-- ============================================================

begin;

-- A2.1: back to a marked task (ESC C1–C3).
insert into public.task_criteria (task_id, criterion_id) values
  ('A2.1', 'ESC-C1'), ('A2.1', 'ESC-C2'), ('A2.1', 'ESC-C3')
on conflict do nothing;
insert into public.task_elements (task_id, element_id) values
  ('A2.1', 'ESC-C1-a'), ('A2.1', 'ESC-C1-b'), ('A2.1', 'ESC-C2-a'),
  ('A2.1', 'ESC-C2-b'), ('A2.1', 'ESC-C3-a'), ('A2.1', 'ESC-C3-b')
on conflict do nothing;

-- A3.1 / A3.2: Unreal and Unity journals separate again.
update public.tasks set published = true where id = 'A3.2';
delete from public.task_criteria where (task_id, criterion_id) in (('A3.1', 'ESC-C1'), ('A3.1', 'ICT-C1'));
delete from public.task_elements where (task_id, element_id) in (('A3.1', 'ESC-C1-b'), ('A3.1', 'ICT-C1-e'));

-- New Unit 5 tasks: hidden (not deleted, in case students already entered answers).
update public.tasks set published = false where id in ('A5.5', 'A5.6', 'A5.7');

commit;

-- OPTIONAL — only if you are SURE nobody has entered anything you want to keep.
-- Deleting the tables erases all form answers and all tester pairings.
-- drop table if exists public.form_entries;
-- drop table if exists public.tester_assignments;
-- drop function if exists public.my_test_partners();
-- drop function if exists public.is_tester_of(uuid);

-- Check: A2.1 should show 3 criteria / 6 elements again; A3.2 published = true.
select t.id, t.published,
       (select count(*) from public.task_criteria tc where tc.task_id = t.id) as criteria,
       (select count(*) from public.task_elements te where te.task_id = t.id) as elements
from public.tasks t where t.id in ('A2.1', 'A3.1', 'A3.2', 'A5.5', 'A5.6', 'A5.7') order by t.id;

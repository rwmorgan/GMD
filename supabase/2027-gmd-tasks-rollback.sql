-- ============================================================
-- 2027 GMD task changes — ROLLBACK of the database side.
--
-- The forward change needs NO SQL: it is the Teach → Settings →
-- "Import / update curriculum" button (upsert only, additive).
-- Because the import never deletes, undoing it takes two steps:
--
--   1. Git: revert the 2027 task commit, push, then press
--      "Import / update curriculum" again. This restores the old
--      task text, rubric rows and the A1.2 "published" flag.
--   2. Run THIS file to remove the links the import added.
--
-- Re-runnable (deletes only match rows that exist). Touches only
-- GMD task ids A1.2/A1.3/A1.4/A2.3/A3.3 in the shared tasks,
-- task_criteria and task_elements tables — nothing else, no DDL,
-- no student data. Existing submissions and marks are untouched.
--
-- Run in: Supabase dashboard → SQL Editor.
-- ============================================================

begin;

-- Un-retire A1.2 (also done by step 1; harmless to repeat).
update public.tasks set published = true where id = 'A1.2';

-- Criteria added to tasks.
delete from public.task_criteria where (task_id, criterion_id) in (
  ('A1.3', 'ESC-C4'),
  ('A1.4', 'ESC-C4'),
  ('A1.4', 'ICT-C2'),
  ('A3.3', 'ESC-C3')
);

-- Elements added to tasks.
delete from public.task_elements where (task_id, element_id) in (
  ('A1.3', 'ESC-C4-a'),
  ('A1.3', 'ICT-C1-b'),
  ('A1.3', 'ICT-C4-f'),
  ('A1.4', 'ESC-C4-b'),
  ('A1.4', 'ICT-C2-d'),
  ('A2.3', 'ESC-C4-e'),
  ('A2.3', 'ICT-C2-b'),
  ('A2.3', 'ICT-C2-c'),
  ('A3.3', 'ESC-C3-c')
);

commit;

-- Check: A1.3 should be back to 6 criteria / 15 elements.
select t.id,
       (select count(*) from public.task_criteria tc where tc.task_id = t.id) as criteria,
       (select count(*) from public.task_elements te where te.task_id = t.id) as elements
from public.tasks t where t.id in ('A1.2', 'A1.3', 'A1.4', 'A2.3', 'A3.3') order by t.id;

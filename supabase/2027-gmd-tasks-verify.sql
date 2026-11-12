-- ============================================================
-- 2027 GMD task changes — READ-ONLY verification.
--
-- Run AFTER you have pushed the site and pressed
-- Teach → Settings → "Import / update curriculum".
-- Changes nothing (select only). Safe to re-run any time.
-- Scoped to ESC205114 and ICT205114; General Maths rows are
-- never matched. Returns counts only — no student names/ids.
--
-- Run in: Supabase dashboard → SQL Editor.
-- ============================================================

-- 1. EXPECTED: 0 rows. Standard elements not mapped to any LIVE task.
select e.id as unmapped_element
from public.elements e
join public.criteria c on c.id = e.criterion_id
where c.course_id in ('ESC205114', 'ICT205114')
  and not exists (
    select 1 from public.task_elements te
    join public.tasks t on t.id = te.task_id
    where te.element_id = e.id and t.published)
order by e.id;

-- 2. EXPECTED: 0 rows. An element on a task whose criterion is NOT on that task.
select te.task_id, te.element_id
from public.task_elements te
join public.elements e on e.id = te.element_id
join public.criteria c on c.id = e.criterion_id
join public.tasks t on t.id = te.task_id
where c.course_id in ('ESC205114', 'ICT205114')
  and t.published
  and not exists (
    select 1 from public.task_criteria tc
    where tc.task_id = te.task_id and tc.criterion_id = e.criterion_id)
order by 1, 2;

-- 3. EXPECTED: 0 rows. A criterion on a task with no element of it on that task.
select tc.task_id, tc.criterion_id
from public.task_criteria tc
join public.criteria c on c.id = tc.criterion_id
join public.tasks t on t.id = tc.task_id
where c.course_id in ('ESC205114', 'ICT205114')
  and t.published
  and not exists (
    select 1 from public.task_elements te
    join public.elements e on e.id = te.element_id
    where te.task_id = tc.task_id and e.criterion_id = tc.criterion_id)
order by 1, 2;

-- 4. EXPECTED: A1.2 published = false; the others true.
select id, title, published from public.tasks
where id in ('A1.2', 'A1.3', 'A1.4', 'A2.3', 'A3.3') order by id;

-- 5. EXPECTED: A1.3 = ESC-C1,C2,C3,C4, ICT-C1,C3,C4 (7 criteria, 18 elements);
--    A1.4 gains ESC-C4 + ICT-C2; A3.3 gains ESC-C3.
select t.id,
       (select string_agg(tc.criterion_id, ', ' order by tc.criterion_id)
          from public.task_criteria tc where tc.task_id = t.id) as criteria,
       (select count(*) from public.task_elements te where te.task_id = t.id) as element_count
from public.tasks t
where t.id in ('A1.2', 'A1.3', 'A1.4', 'A2.3', 'A3.3') order by t.id;

-- 6. EXPECTED: unchanged from before the import. Work still attached to the
--    retired A1.2 (it is hidden, never deleted). Counts only.
select 'submissions' as kind, count(*) from public.submissions where task_id = 'A1.2'
union all select 'marks',         count(*) from public.marks         where task_id = 'A1.2'
union all select 'mark_feedback', count(*) from public.mark_feedback where task_id = 'A1.2'
union all select 'task_progress', count(*) from public.task_progress where task_id = 'A1.2';

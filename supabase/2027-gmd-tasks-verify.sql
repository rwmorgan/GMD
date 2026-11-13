-- ============================================================
-- 2027 GMD task changes — READ-ONLY verification (one result table).
--
-- Run AFTER you have pushed the site and pressed
-- Teach → Settings → "Import / update curriculum".
-- Changes nothing (select only). Safe to re-run any time.
-- Scoped to ESC205114 and ICT205114; General Maths rows are
-- never matched. Counts only — no student names/ids.
--
-- Every row's "result" should equal its "want". Rows marked (want 0)
-- count problems; if one is not 0, tell Claude which row.
--
-- Run in: Supabase dashboard → SQL Editor.
-- ============================================================

select check_name, result, want,
       case when want = '(any)' then 'info'
            when result = want then 'OK' else 'CHECK' end as status
from (

  -- 1. Standard elements not mapped to any live task.
  select 1 as n, 'Elements not mapped to any live task' as check_name,
    (select count(*) from public.elements e
       join public.criteria c on c.id = e.criterion_id
      where c.course_id in ('ESC205114', 'ICT205114')
        and not exists (
          select 1 from public.task_elements te
          join public.tasks t on t.id = te.task_id
          where te.element_id = e.id and t.published))::text as result,
    '0' as want

  union all
  -- 2. An element on a task whose criterion is not on that task.
  select 2, 'Elements on a task without their criterion',
    (select count(*) from public.task_elements te
       join public.elements e on e.id = te.element_id
       join public.criteria c on c.id = e.criterion_id
       join public.tasks t on t.id = te.task_id
      where c.course_id in ('ESC205114', 'ICT205114')
        and t.published and t.type = 'submission'
        and not exists (
          select 1 from public.task_criteria tc
          where tc.task_id = te.task_id and tc.criterion_id = e.criterion_id))::text,
    '0'

  union all
  -- 3. A criterion on a task with no element of it on that task.
  select 3, 'Criteria on a task with no element of it',
    (select count(*) from public.task_criteria tc
       join public.criteria c on c.id = tc.criterion_id
       join public.tasks t on t.id = tc.task_id
      where c.course_id in ('ESC205114', 'ICT205114')
        and t.published and t.type = 'submission'
        and not exists (
          select 1 from public.task_elements te
          join public.elements e on e.id = te.element_id
          where te.task_id = tc.task_id and e.criterion_id = tc.criterion_id))::text,
    '0'

  union all
  select 4, 'A1.2 published (retired = false)',
    coalesce((select published::text from public.tasks where id = 'A1.2'), 'missing'), 'false'

  union all
  select 5, 'A1.3 criteria / elements',
    (select count(*) from public.task_criteria where task_id = 'A1.3')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A1.3')::text, '7 / 18'

  union all
  select 6, 'A1.4 criteria / elements',
    (select count(*) from public.task_criteria where task_id = 'A1.4')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A1.4')::text, '8 / 13'

  union all
  select 7, 'A2.3 elements',
    (select count(*) from public.task_elements where task_id = 'A2.3')::text, '11'

  union all
  select 8, 'A3.3 criteria / elements',
    (select count(*) from public.task_criteria where task_id = 'A3.3')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A3.3')::text, '4 / 6'

  union all
  -- 9. Work attached to the retired A1.2 is still there (hidden, never deleted).
  select 9, 'Submissions + marks still attached to A1.2 (test data: any number is fine)',
    ((select count(*) from public.submissions where task_id = 'A1.2') +
     (select count(*) from public.marks where task_id = 'A1.2'))::text, '(any)'

) q
order by n;

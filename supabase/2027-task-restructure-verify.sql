-- ============================================================
-- 2027 task restructure — READ-ONLY verification (one result table).
--
-- Run AFTER 2027-task-restructure.sql AND the curriculum import
-- (Teach → Settings → Import / update curriculum).
-- Changes nothing. Safe to re-run. Counts only — no student names or ids.
-- Every row's "result" should equal "want" (status OK).
--
-- Run in: Supabase dashboard → SQL Editor.
-- ============================================================

select check_name, result, want,
       case when result = want then 'OK' else 'CHECK' end as status
from (

  select 1 as n, 'New tables exist (form_entries, tester_assignments)' as check_name,
    (select count(*) from information_schema.tables
      where table_schema = 'public' and table_name in ('form_entries', 'tester_assignments'))::text as result,
    '2' as want

  union all
  select 2, 'Function my_test_partners exists',
    (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'my_test_partners')::text, '1'

  union all
  -- Every ESC / ICT / PRJ element is evidenced by at least one live SUBMISSION task
  -- (quizzes are supporting evidence only and do not count here).
  select 3, 'Elements with no live submission task (ESC/ICT/PRJ)',
    (select count(*) from public.elements e
       join public.criteria c on c.id = e.criterion_id
      where c.course_id in ('ESC205114', 'ICT205114', 'PRJ205118')
        and not exists (
          select 1 from public.task_elements te join public.tasks t on t.id = te.task_id
          where te.element_id = e.id and t.published and t.type = 'submission'))::text, '0'

  union all
  -- Every criterion is assessed by at least two live submission tasks.
  select 4, 'Criteria assessed by fewer than 2 live tasks',
    (select count(*) from public.criteria c
      where c.course_id in ('ESC205114', 'ICT205114', 'PRJ205118')
        and (select count(distinct tc.task_id) from public.task_criteria tc
               join public.tasks t on t.id = tc.task_id
              where tc.criterion_id = c.id and t.published and t.type = 'submission') < 2)::text, '0'

  union all
  select 5, 'Elements on a task without their criterion',
    (select count(*) from public.task_elements te
       join public.elements e on e.id = te.element_id
       join public.criteria c on c.id = e.criterion_id
       join public.tasks t on t.id = te.task_id
      where c.course_id in ('ESC205114', 'ICT205114', 'PRJ205118') and t.published and t.type = 'submission'
        and not exists (select 1 from public.task_criteria tc
                         where tc.task_id = te.task_id and tc.criterion_id = e.criterion_id))::text, '0'

  union all
  select 6, 'Criteria on a task with no element of it',
    (select count(*) from public.task_criteria tc
       join public.criteria c on c.id = tc.criterion_id
       join public.tasks t on t.id = tc.task_id
      where c.course_id in ('ESC205114', 'ICT205114', 'PRJ205118') and t.published and t.type = 'submission'
        and not exists (select 1 from public.task_elements te join public.elements e on e.id = te.element_id
                         where te.task_id = tc.task_id and e.criterion_id = tc.criterion_id))::text, '0'

  union all
  select 7, 'A2.1 criteria / elements (formative)',
    (select count(*) from public.task_criteria where task_id = 'A2.1')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A2.1')::text, '0 / 0'

  union all
  select 8, 'A3.1 criteria / elements (merged journal)',
    (select count(*) from public.task_criteria where task_id = 'A3.1')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A3.1')::text, '4 / 9'

  union all
  select 9, 'A3.2 published (retired = false)',
    coalesce((select published::text from public.tasks where id = 'A3.2'), 'missing'), 'false'

  union all
  select 10, 'A5.5 criteria / elements (Agreement)',
    (select count(*) from public.task_criteria where task_id = 'A5.5')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A5.5')::text, '2 / 4'

  union all
  select 11, 'A5.6 criteria / elements (Check-in Log)',
    (select count(*) from public.task_criteria where task_id = 'A5.6')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A5.6')::text, '4 / 4'

  union all
  select 12, 'A5.7 criteria / elements (Peer & Self Evaluation)',
    (select count(*) from public.task_criteria where task_id = 'A5.7')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A5.7')::text, '1 / 2'

  union all
  select 13, 'A4.2 criteria / elements (unchanged)',
    (select count(*) from public.task_criteria where task_id = 'A4.2')::text || ' / ' ||
    (select count(*) from public.task_elements where task_id = 'A4.2')::text, '3 / 5'

  union all
  select 14, 'Live tasks A5.5, A5.6, A5.7 published',
    (select count(*) from public.tasks where id in ('A5.5', 'A5.6', 'A5.7') and published)::text, '3'

) q
order by n;

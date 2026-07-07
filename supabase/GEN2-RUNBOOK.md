# General Maths (Gen2) — deploy & QA runbook

Everything below needs the **live Supabase** project and must be done by you
(the anon key in the repo can't run DDL). Do it when few students are online —
step 1 rewrites RLS on the live GMD database.

## 1. Apply the migration
Supabase dashboard → SQL Editor → New query → paste all of
[`gen2-migration.sql`](gen2-migration.sql) → Run. It is idempotent and additive
(no data dropped). It also promotes you to **LAL** (via `settings.teacher_email`)
and wraps existing GMD students into a `gmd-default` class.

Sanity check after running:
```sql
select id, role from profiles where role in ('teacher','lal');   -- you should be 'lal'
select * from programs;                                          -- GMD, GEN2
select id, name, join_code, program_id from classes;            -- gmd-default
select count(*) from criteria where course_id = 'MTG215123';    -- 8
```

## 2. Import the content
Sign in → Teacher dashboard → **Settings → Import / update curriculum**. The
importer now also merges the six Gen2 JSON banks (6 units, ~26 lessons,
15 quizzes, 107 questions). Verify:
```sql
select id, title, program_id from units where program_id = 'GEN2';        -- 6 rows
select count(*) from questions q join tasks t on t.id=q.task_id
  join units u on u.id=t.unit_id where u.program_id='GEN2';                -- ~107
```

## 3. Create a Gen2 class and invite a teacher
```sql
-- your uuid:
select id from profiles where role='lal';

insert into classes (id, program_id, name, join_code, primary_teacher_id)
values ('gen2-11a','GEN2','General Maths 11A','GEN2-A-2026','<your-uuid>');
```
Colleague signs up (any email) → then you promote + assign them:
```sql
select admin_set_role('<their-uuid>', 'teacher');
insert into class_teachers (class_id, teacher_id, role)
values ('gen2-11a','<their-uuid>','primary');
```
Students join with the class's `join_code` on the normal sign-up screen.

## 4. QA — RLS isolation (the important one)
Create a **second** class under a different teacher and enrol a test student in
each. Signed in as **teacher B**, confirm you get **zero rows** for teacher A's
student:
```sql
-- as teacher B (via the app's session, not the SQL editor which is superuser):
select * from profiles;        -- should show only B's class students + self
select * from quiz_attempts;   -- only B's students
```
Easiest real test: open the site in two browsers, sign in as each teacher, and
confirm each dashboard's Overview lists only their own class roster. The LAL
account should see everyone.

> The SQL Editor runs as a superuser and **bypasses RLS** — always test isolation
> through the app (an authenticated anon session), never from the SQL Editor.

## 5. QA — content & mobile
- Answer keys: `python tools/verify_answers.py` (expect `0 FAILED, 0 ERROR`).
- On a phone (or the browser at 375px): open a Gen2 unit → a lesson (reads as a
  page, no upload box), a numeric quiz, and a **matrix** quiz (Algebra & Matrices
  Q2/Q3) — check the grid inputs are tappable and grading shows per-cell.

## Known follow-ups (not blocking)
- **Piecewise-linear/step graphs** (TASC Linear requirement) are not in the
  compendium — teach in class; no auto-marked content was invented for them.
- Student unit browsing defaults to the first program with a switcher; per-student
  auto-scoping by enrolment is a future refinement.
- Gen2 overall award bands (A/B/C, exam-moderated) are shown as "—" — provisional
  award computation is GMD-only by design.
- Tier-2 quiz items (multi-step scaffolded, MCQ-about-a-rendered-graph) are future
  work; Tier 1 is complete.

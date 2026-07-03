# Level Up — Game Design & Digital Technology LMS

A lightweight LMS for the Years 11–12 Game Making and Design class (Tasmania), delivering three TASC courses: **ESC205114**, **ICT205114** and **PRJ205118**. Students get accounts, auto-marked quizzes, task submissions, XP/badges and progress tracking; the teacher gets a class overview, marking queue, live criteria-coverage matrix, quiz item analysis, CSV export, and a task/quiz editor.

**Live site:** https://rwmorgan.github.io/GMD

## How it's built (and why it's low-maintenance)

- **No build step.** Plain HTML/CSS/JavaScript ES modules. Deploying = pushing files to GitHub. Nothing to install, compile, or patch.
- **Backend: Supabase** (free tier, managed Postgres + Auth + Storage). Student data is protected by Row Level Security enforced in the database. Quiz answer keys live in a table the browser can never read — grading happens server-side.
- **Demo mode.** Until you add Supabase credentials to `js/config.js`, the whole site runs on sample data in the browser (accounts `teacher@demo.school` / `ava.p@demo.school`, password `demo1234`, join code `LEVELUP26`). Great for testing changes safely.

```
index.html            SPA shell (everything renders under #/routes)
css/style.css         Base "Neon" theme      css/lms.css   LMS components
js/app.js             Routes + nav           js/router.js  Hash router
js/api.js             Picks demo or live     js/api-demo.js / js/api-supabase.js
js/store.js           Derived data: status, XP, badges, coverage matrix, awards
js/views/*.js         Pages (home, units, task, quiz, dashboard, teacher, …)
js/data/seed-*.js     Curriculum: courses, criteria, 67 elements, units,
                      23 tasks, 12 quizzes — with full assessment mappings
supabase/setup.sql    Database schema, security rules, grading function
resources/, gallery.html, contact.html   Static pages from the original site
```

## One-time setup (≈15 minutes)

1. **Create the Supabase project** — [supabase.com](https://supabase.com) → New project. Choose the **Sydney (ap-southeast-2)** region. The free plan is enough.
2. **Run the database setup** — Dashboard → SQL Editor → New query → paste the entire contents of [`supabase/setup.sql`](supabase/setup.sql) → Run.
3. **Set your join code and email** — in the same SQL editor run (with your values):
   ```sql
   update settings set join_code = 'PICK-A-CODE', teacher_email = 'you@education.tas.gov.au' where id = 1;
   ```
4. **Turn off email confirmation** (recommended for a class) — Dashboard → Authentication → Sign In / Providers → Email → disable "Confirm email". Otherwise students must click an email link before first sign-in.
5. **Connect the site** — Dashboard → Project Settings → API. Copy the **Project URL** and **anon public key** into [`js/config.js`](js/config.js). The anon key is safe to publish; Row Level Security protects the data.
6. **Create your account** — open the site, Sign up with *your* email (from step 3) + the join code. You'll be auto-promoted to teacher.
7. **Import the curriculum** — Teach → Settings → **Import / update curriculum**. This loads all units, tasks, quizzes and assessment mappings into the database.
8. **Enrol students** — give them the join code. They sign up with school email + password, first name + last initial only.

### Keep-alive (important)

Supabase pauses free projects after ~1 week without traffic. The included GitHub Action pings the database every 3 days. Enable it once: repo → Settings → Secrets and variables → Actions → **Variables** → add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (same values as `js/config.js`). If the project ever does pause (e.g. long holidays + Action disabled), open the Supabase dashboard and click Restore — no data is lost.

## Everyday use

- **Marking:** Teach → Marking Queue. Every unmarked submission appears there; quizzes never do (they mark themselves). Rate each criterion (A/C/t/z — A only offered on ICT criteria), write feedback, save. Students see it instantly on the task page.
- **Coverage matrix:** Teach → Matrix (also public at `#/matrix`). Recalculated live from task mappings: every criterion must be assessed ≥2×, every standard element ≥1×. Gaps are flagged automatically the moment an edit breaks the rule.
- **Adding/editing tasks and quizzes:** Teach → Editor. Everything is a form — no code. Quiz questions use simple text formats (e.g. multiple choice = one option per line, `*` marks the correct one). Tick the criteria and elements each task assesses; the matrix updates itself.
- **Exports:** Teach → Settings — results by student & task, criterion marks, and quiz attempts as CSV for your markbook.
- **Student management:** Teach → Students — deactivate/reactivate accounts. Password resets: Supabase Dashboard → Authentication → Users → ⋯ → Send password recovery.
- **Provisional awards** on the class overview use the best rating per criterion so far (ICT: EA/CA/SA/PA; ESC & PRJ: SA/PA). PRJ also requires all six TASC work requirements — verify those manually before finalising.

## Publishing changes

The site deploys from the `main` branch via GitHub Pages, exactly like the old static site:

```
git add -A
git commit -m "Describe the change"
git push
```

The rebuilt LMS lives on the `lms-rebuild` branch until you're ready to launch; the old static site is preserved on `legacy-static-site`. To launch: merge `lms-rebuild` into `main` and push.

## Privacy notes

- Students are identified by first name + last initial and school email only. Emails are visible only to the teacher.
- Enrolment requires the class join code (validated in the database, not the browser). Change it any time in Teach → Settings — existing accounts keep working.
- Submissions bucket is private: students can only access their own files; you can access all.
- Data is hosted in Supabase's Sydney region.

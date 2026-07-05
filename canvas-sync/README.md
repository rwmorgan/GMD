# Canvas → Level Up sync

Working folder for pulling current GMD course content out of Canvas and comparing
it against the Level Up site's seed data (`js/data/seed-*.js`).

**Not part of the deployed site.** Safe to delete or keep out of git.

## Where the content lives

- **Canvas source of truth:** blueprint course **94239 – "Blue Print Game Making and Design"**
  (canvas.education.tas.gov.au). The 2026 class sections ICT205114BG1A (210788) and
  ICT205114BG2B (210840) inherit from it; only per-section due-date overrides differ.
- **Site content:** `js/data/seed-tasks.js`, `js/data/seed-quizzes.js`, `js/data/seed-curriculum.js`.
  After changing these files and pushing, re-import into Supabase via
  **Teach → Settings → Import / update curriculum** on the live site.

## How to re-extract (repeatable)

1. Sign in to Canvas in Chrome, open any Canvas page.
2. Run `extract-canvas.js` in the DevTools console (or let Claude run it through the
   Claude-in-Chrome connection). It uses Canvas's own REST API (`/api/v1/...`) via your
   session cookie — read-only GETs, no UI clicking.
3. Save the result over `canvas-assignments.json`.

## Applying a sync to the live site

1. Update `js/data/seed-curriculum.js` / `seed-tasks.js` / `seed-quizzes.js` from
   the extracted JSON (preserve facts exactly; tighten wording for students).
2. Preview locally in demo mode (temporarily blank the two values in `js/config.js`),
   then restore config, commit and push to `main`.
3. On the live site: **Teach → Settings → Import / update curriculum** (teacher login).
4. If task ids were retired, run `cleanup.sql` in the Supabase SQL Editor —
   **read its STEP 1 check first**; deletes cascade to student submissions.

Notes learned on the first run (2026-07-05):

- The Claude Chrome extension blocks tool output containing URLs with query strings
  and any single string containing multiple URLs. The extractor therefore strips
  query strings (Canvas file links carry `verifier=` tokens) and replaces each
  link/iframe/img with a numbered `[Ln]` marker resolved through a per-assignment
  `links` map (one URL per JSON leaf).
- Canvas due dates are UTC; `12:59:59Z`/`13:59:59Z` = 11:59 pm Hobart time.
- Rubric rows named "Description of criterion [Full Marks/No Marks]" are Canvas
  placeholder rows — ignore them.

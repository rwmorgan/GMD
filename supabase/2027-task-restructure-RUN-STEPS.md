# 2027 task restructure — plain-English run steps

Everything for this lives on the branch **`2027-task-restructure`**. The live site
runs from `main`, so nothing here affects students until the branch is merged.

## What changes for students
- **1.2 → 1.3:** already live (1.2 hidden, its content is Part A of 1.3).
- **2.1 "Steal Like a Designer":** an online form (5 games). Not marked — complete when all 5 are filled in.
- **4.2 Game Design Brief:** new required "Borrowed mechanics" section; the student's 2.1 list is shown on the page.
- **3.1 + 3.2:** one "Engine Skills Journal (Unreal + Unity)". 3.2 is hidden. 3.1 gains ESC-C1 / ICT-C1.
- **Unit 5:** three new online forms — 5.5 Developer–Tester Agreement, 5.6 Check-in Log, 5.7 Peer & Self Evaluation.
- **Teachers:** pair students on **Teach → Students** (pick the class in "Viewing" first).

## When to do it
**After Jump Start (1–2 Dec 2026).** The import and the SQL change what is in the live
database, which the current site shows straight away. Do it in one sitting, in this order.

## Steps (in this order)
1. **Merge the branch to `main`** and push (Claude does this when you say "merge it").
   Wait a couple of minutes, then hard-refresh the site (Ctrl+Shift+R).
2. **Run the SQL.** Supabase → SQL Editor → New query → paste the whole of
   `supabase/2027-task-restructure.sql` → Run. The last result should read
   `2 / 0 / 0` (two new tables, A2.1 has no criteria, no elements).
   It is safe to run twice.
3. **Import the curriculum.** On the site: Teach → Settings → ⬆ Import / update
   curriculum. Wait for "Curriculum imported". (If it errors, the message now says
   which table — send it to Claude.)
4. **Verify.** New query → paste `supabase/2027-task-restructure-verify.sql` → Run.
   Every row should say **OK**.
5. **Set up the pairs** (when Unit 5 gets near): Teach → Students → choose the class
   in "Viewing" → 🤝 Developer–tester pairs → "Auto-pair randomly" (or choose testers
   by hand) → 💾 Save pairs. Students can't open 5.5–5.7 until they have a partner.

## If something goes wrong
- `supabase/2027-task-restructure-rollback.sql` puts the database side back (see the
  note at the top: revert the merge, import again, then run it).
- The two new tables are left in place by the rollback — they are harmless.

## Things to know
- The form answers are private to each student and the teacher. The **only** thing
  shared with a partner is the **Check-in Log** (5.6): the developer and their tester
  can both add and edit entries for the developer's game.
- 5.5 and 5.7 are marked in the normal marking queue once the student has completed the
  form; the student's answers show inside the marking window. 2.1 never appears in the
  marking queue.
- Canvas is **not** changed by any of this — see the Canvas edit list Claude gave you.

# AI-assisted marking — setup

Lets you click **✨ AI Draft** in the marking queue to get a suggested rating per
criterion + feedback text for a submitted file (image, PDF, or Word .docx),
grounded in that task's existing marking guide. It only ever *suggests* — you
still review, edit, and click **Save marks** yourself. Nothing is written to a
student's record until you save it. External-link submissions (OneDrive/Drive
links) aren't supported yet — mark those manually, same as today.

No Node.js, Docker, or command line needed. Everything below is done in the
Supabase web dashboard and takes about 10 minutes.

## 1. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in / create an account.
2. Add a small amount of prepaid credit (a few dollars covers a full year at classroom scale).
3. Create an API key (Settings → API Keys) and copy it — you won't be able to see it again.

## 2. Run the database migration

1. Supabase Dashboard → your project → **SQL Editor** → New query.
2. Paste the contents of [`ai-mark-setup.sql`](ai-mark-setup.sql) and click **Run**.
3. This adds one new table (`ai_mark_suggestions`) that quietly logs every AI draft you generate, for your own records — nothing else changes.

## 3. Create the Edge Function

1. Supabase Dashboard → **Edge Functions** → **Create a new function**.
2. Name it exactly `ai-mark`.
3. Delete the placeholder code it gives you, and paste in the full contents of [`functions/ai-mark/index.ts`](functions/ai-mark/index.ts).
4. Click **Deploy updates**.

## 4. Add the secret key

1. Still in Edge Functions, go to **Secrets** (sometimes called "Manage secrets").
2. Add a new secret: Key = `ANTHROPIC_API_KEY`, Value = the key you copied in step 1.
3. Save.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are already
available to every Edge Function automatically — you don't need to add those.

## 5. Try it

1. Have a student submit a task with an uploaded file (not just a link).
2. Teach → Marking Queue → open that submission → **✨ AI Draft**.
3. It takes a few seconds (Claude reads the file and thinks about the rubric).
   Ratings and feedback pre-fill — check them, edit anything you'd change, then
   **Save marks** as normal.

## Updating the function later

If this file ever changes (a future improvement, a bug fix), the fix will be
committed here first. To pick it up: open the updated `functions/ai-mark/index.ts`
in this repo, copy its full contents, paste over the function's code in the
Supabase dashboard editor, and click **Deploy updates** again. The dashboard
editor doesn't keep version history itself — this repo is the source of truth.

## Cost

At classroom scale (a few hundred submissions a year), this costs roughly
$5–15 USD/year on Claude Opus 5 — genuinely negligible. You can watch actual
spend at console.anthropic.com → Usage.

## Second stage (not built yet)

Pushing marks/comments into the Canvas gradebook automatically is a separate,
later piece of work — it needs a Canvas API token with grading permission and
its own small function. This stage only builds the on-site draft-and-review
feature; you still copy final marks into Canvas by hand for now.

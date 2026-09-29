-- ============================================================
-- Task due dates
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor
-- -> New query -> paste -> Run). Safe to re-run.
--
-- Adds a real, comparable due date to each task, so the site can
-- tell "on time" from "late" instead of only having free-text
-- descriptions like "due Fri 30 Oct" buried in the weeks field.
-- Nullable — tasks without a due date just show no late/on-time
-- flag, nothing breaks.
-- ============================================================

alter table public.tasks add column if not exists due_date date;

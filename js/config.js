/* ============================================================
   LEVEL UP — Site configuration
   ------------------------------------------------------------
   To connect the real backend, paste your Supabase project's
   URL and anon/public key below (Supabase dashboard → Project
   Settings → API). The anon key is safe to publish — student
   data is protected by Row Level Security in the database.

   While both values are empty the site runs in DEMO MODE:
   everything works in the browser with sample accounts and no
   data leaves the machine. Great for previewing.
   ============================================================ */

export const SUPABASE_URL = 'https://xheysgfvmvcjtgfbxgjr.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXlzZ2Z2bXZjanRnZmJ4Z2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzA3NjQsImV4cCI6MjA5ODY0Njc2NH0.P02mOziwTpeY957X7PVW52l3Scgz2j3mPrN--xoCgZE';

/* Site identity */
export const SITE_NAME = 'Level Up';
export const SITE_TAGLINE = 'Game Design & Digital Technology · Years 11–12 · Tasmania';

/* Demo-mode sample logins (shown on the login page in demo mode) */
export const DEMO_ACCOUNTS = {
  teacher: { email: 'teacher@demo.school', password: 'demo1234' },
  student: { email: 'ava.p@demo.school', password: 'demo1234' },
};

/* Demo-mode class join code */
export const DEMO_JOIN_CODE = 'LEVELUP26';

export const IS_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

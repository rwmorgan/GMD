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

export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

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

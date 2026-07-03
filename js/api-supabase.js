/* ============================================================
   LIVE adapter — Supabase backend. Same interface as the demo
   adapter. Quiz grading happens in the database via the
   submit_quiz_attempt RPC, so answer keys never reach the
   browser. Row Level Security enforces who can see what.
   ============================================================ */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { seed, flattenSeed } from './data/seed.js';

const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

function fail(error, fallback) {
  const msg = error?.message || fallback || 'Something went wrong.';
  throw new Error(msg);
}

export class SupabaseAdapter {
  constructor() {
    this.mode = 'live';
    this.client = null;
    this.user = null;       // {id, email, name, role}
    this.profileMissing = false;
    this.listeners = [];
  }

  async init() {
    const { createClient } = await import(SUPABASE_JS);
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { session } } = await this.client.auth.getSession();
    await this.loadProfile(session);
    this.client.auth.onAuthStateChange(async (_event, sess) => {
      await this.loadProfile(sess);
      this.emit();
    });
  }

  async loadProfile(session) {
    if (!session?.user) { this.user = null; this.profileMissing = false; return; }
    const { data: profile } = await this.client
      .from('profiles').select('display_name, role, active').eq('id', session.user.id).maybeSingle();
    if (!profile) {
      // Signed up but never redeemed a join code (or was removed).
      this.user = { id: session.user.id, email: session.user.email, name: session.user.email, role: null };
      this.profileMissing = true;
    } else {
      this.user = { id: session.user.id, email: session.user.email, name: profile.display_name, role: profile.role };
      this.profileMissing = !profile.active;
    }
  }

  currentUser() { return this.user && this.user.role ? this.user : null; }
  onAuthChange(cb) { this.listeners.push(cb); }
  emit() { this.listeners.forEach(cb => cb(this.currentUser())); }

  /* ---------- auth ---------- */
  async signUp({ email, password, name, joinCode }) {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) fail(error);
    if (!data.session) {
      throw new Error('Account created — but email confirmation is switched on in Supabase. Confirm via the email link, then sign in and enter the join code when asked. (Teachers: you can disable "Confirm email" in Supabase → Authentication → Providers.)');
    }
    await this.redeem(joinCode, name);
    return this.currentUser();
  }

  async redeem(joinCode, name) {
    const { error } = await this.client.rpc('redeem_join_code', {
      p_code: joinCode, p_display_name: name,
    });
    if (error) {
      if (/invalid join code/i.test(error.message)) throw new Error('That join code is not correct. Check with your teacher.');
      fail(error);
    }
    const { data: { session } } = await this.client.auth.getSession();
    await this.loadProfile(session);
    this.emit();
  }

  async signIn(email, password) {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      if (/invalid login/i.test(error.message)) throw new Error('Email or password is incorrect.');
      fail(error);
    }
    const { data: { session } } = await this.client.auth.getSession();
    await this.loadProfile(session);
    this.emit();
    return this.currentUser();
  }

  async signOut() {
    await this.client.auth.signOut();
    this.user = null;
    this.emit();
  }

  /* ---------- curriculum ---------- */
  async getCurriculum() {
    const c = this.client;
    const [courses, criteria, elements, units, tasks, tc, te, questions] = await Promise.all([
      c.from('courses').select('*').order('sort'),
      c.from('criteria').select('*'),
      c.from('elements').select('*').order('ord'),
      c.from('units').select('*').order('sort'),
      c.from('tasks').select('*').order('sort'),
      c.from('task_criteria').select('*'),
      c.from('task_elements').select('*'),
      c.from('questions').select('id, task_id, ord, qtype, prompt, options, points, explain').order('ord'),
    ]);
    for (const r of [courses, criteria, elements, units, tasks, tc, te, questions]) {
      if (r.error) fail(r.error, 'Could not load course content.');
    }
    return {
      courses: courses.data,
      criteria: criteria.data,
      elements: elements.data,
      units: units.data,
      tasks: tasks.data.map(t => ({
        ...t,
        criteria: tc.data.filter(x => x.task_id === t.id).map(x => x.criterion_id),
        elements: te.data.filter(x => x.task_id === t.id).map(x => x.element_id),
        questions: questions.data.filter(q => q.task_id === t.id),
      })),
    };
  }

  /* ---------- student ---------- */
  async getMyState() {
    const uid = this.user?.id;
    if (!uid) throw new Error('Not signed in.');
    const c = this.client;
    const [attempts, submissions, marks, feedback, progress] = await Promise.all([
      c.from('quiz_attempts').select('*').eq('student_id', uid),
      c.from('submissions').select('*').eq('student_id', uid),
      c.from('marks').select('*').eq('student_id', uid),
      c.from('mark_feedback').select('*').eq('student_id', uid),
      c.from('task_progress').select('*').eq('student_id', uid),
    ]);
    for (const r of [attempts, submissions, marks, feedback, progress]) if (r.error) fail(r.error);
    return {
      attempts: attempts.data, submissions: submissions.data,
      marks: marks.data, feedback: feedback.data, progress: progress.data,
    };
  }

  async startTask(taskId) {
    const uid = this.user?.id;
    if (!uid) return;
    await this.client.from('task_progress').upsert(
      { student_id: uid, task_id: taskId },
      { onConflict: 'student_id,task_id', ignoreDuplicates: true });
  }

  async submitQuiz(taskId, givenMap) {
    const { data, error } = await this.client.rpc('submit_quiz_attempt', {
      p_task_id: taskId, p_answers: givenMap,
    });
    if (error) fail(error, 'Could not submit the quiz.');
    return data;
  }

  async submitWork(taskId, { url, file, comment }) {
    const uid = this.user?.id;
    if (!uid) throw new Error('Not signed in.');
    let file_path = null, file_name = null;
    if (file) {
      const safe = file.name.replace(/[^\w.\-]+/g, '_');
      file_path = `${uid}/${taskId}/${Date.now()}_${safe}`;
      const { error: upErr } = await this.client.storage.from('submissions').upload(file_path, file);
      if (upErr) fail(upErr, 'File upload failed.');
      file_name = file.name;
    }
    const { data, error } = await this.client.from('submissions')
      .insert({ task_id: taskId, student_id: uid, url: url || null, file_path, file_name, comment: comment || null })
      .select().single();
    if (error) fail(error, 'Could not record the submission.');
    return data;
  }

  /* ---------- teacher ---------- */
  async listStudents() {
    const { data, error } = await this.client.from('profiles')
      .select('id, display_name, role, active, created_at').eq('role', 'student').order('display_name');
    if (error) fail(error);
    return data;
  }

  async getClassData() {
    const c = this.client;
    const [profiles, attempts, submissions, marks, feedback, progress] = await Promise.all([
      this.listStudents(),
      c.from('quiz_attempts').select('*'),
      c.from('submissions').select('*'),
      c.from('marks').select('*'),
      c.from('mark_feedback').select('*'),
      c.from('task_progress').select('*'),
    ]);
    for (const r of [attempts, submissions, marks, feedback, progress]) if (r.error) fail(r.error);
    return {
      profiles,
      attempts: attempts.data, submissions: submissions.data,
      marks: marks.data, feedback: feedback.data, progress: progress.data,
    };
  }

  async saveMarks(studentId, taskId, ratings, feedbackText) {
    const c = this.client;
    const del = await c.from('marks').delete().eq('student_id', studentId).eq('task_id', taskId);
    if (del.error) fail(del.error);
    const rows = Object.entries(ratings).filter(([, r]) => r)
      .map(([criterion_id, rating]) => ({ student_id: studentId, task_id: taskId, criterion_id, rating }));
    if (rows.length) {
      const ins = await c.from('marks').insert(rows);
      if (ins.error) fail(ins.error);
    }
    const fb = await c.from('mark_feedback').upsert(
      { student_id: studentId, task_id: taskId, feedback: feedbackText || '', marked_at: new Date().toISOString() },
      { onConflict: 'student_id,task_id' });
    if (fb.error) fail(fb.error);
  }

  async setStudentActive(studentId, active) {
    const { error } = await this.client.from('profiles').update({ active }).eq('id', studentId);
    if (error) fail(error);
  }

  async getFileUrl(path) {
    if (!path) return null;
    const { data, error } = await this.client.storage.from('submissions').createSignedUrl(path, 3600);
    if (error) fail(error, 'Could not open the file.');
    return data.signedUrl;
  }

  async getTaskAnswers(taskId) {
    const { data: qs, error: qErr } = await this.client.from('questions').select('id').eq('task_id', taskId);
    if (qErr) fail(qErr);
    const ids = qs.map(q => q.id);
    if (!ids.length) return {};
    const { data, error } = await this.client.from('answers').select('*').in('question_id', ids);
    if (error) fail(error);
    return Object.fromEntries(data.map(a => [a.question_id, a.answer]));
  }

  async saveTask(def) {
    const c = this.client;
    const { criteria = [], elements = [], questions = [], ...row } = def;
    const up = await c.from('tasks').upsert(row);
    if (up.error) fail(up.error);

    for (const [table, col, values] of [
      ['task_criteria', 'criterion_id', criteria],
      ['task_elements', 'element_id', elements],
    ]) {
      const del = await c.from(table).delete().eq('task_id', row.id);
      if (del.error) fail(del.error);
      if (values.length) {
        const ins = await c.from(table).insert(values.map(v => ({ task_id: row.id, [col]: v })));
        if (ins.error) fail(ins.error);
      }
    }

    if (row.type === 'quiz') {
      const del = await c.from('questions').delete().eq('task_id', row.id); // cascades to answers
      if (del.error) fail(del.error);
      if (questions.length) {
        const qRows = questions.map(({ answer, ...q }) => ({ ...q, task_id: row.id }));
        const aRows = questions.map(q => ({ question_id: q.id, answer: q.answer }));
        const insQ = await c.from('questions').insert(qRows);
        if (insQ.error) fail(insQ.error);
        const insA = await c.from('answers').insert(aRows);
        if (insA.error) fail(insA.error);
      }
    }
  }

  async deleteTask(taskId) {
    const { error } = await this.client.from('tasks').delete().eq('id', taskId);
    if (error) fail(error);
  }

  async getSettings() {
    const { data, error } = await this.client.from('settings').select('*').eq('id', 1).single();
    if (error) fail(error, 'Only the teacher can view settings.');
    return data;
  }

  async saveSettings(patch) {
    const { error } = await this.client.from('settings').update(patch).eq('id', 1);
    if (error) fail(error);
  }

  /* Push the bundled seed curriculum into the database.
     Teacher-only (RLS enforces it). Upserts, so re-running is safe. */
  async importCurriculum(onProgress = () => {}) {
    const c = this.client;
    const data = flattenSeed(seed);
    const steps = [
      ['courses', data.courses],
      ['criteria', data.criteria],
      ['elements', data.elements],
      ['units', data.units],
      ['tasks', data.tasks],
      ['task_criteria', data.task_criteria],
      ['task_elements', data.task_elements],
      ['questions', data.questions],
      ['answers', data.answers],
    ];
    let done = 0;
    for (const [table, rows] of steps) {
      onProgress(`Importing ${table} (${rows.length} rows)…`, done / steps.length);
      const { error } = await c.from(table).upsert(rows);
      if (error) fail(error, `Import failed at ${table}: ${error.message}`);
      done++;
    }
    onProgress('Import complete.', 1);
    return { imported: data.tasks.length };
  }
}

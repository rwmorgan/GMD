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
    this.client.auth.onAuthStateChange((event, sess) => {
      // supabase-js holds its auth lock while this callback runs: a query
      // awaited here deadlocks every later request once a token refresh
      // fires. Skip refreshes (profile unchanged) and defer the rest.
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;
      setTimeout(() => { this.loadProfile(sess).then(() => this.emit()); }, 0);
    });
  }

  async loadProfile(session) {
    if (!session?.user) { this.user = null; this.profileMissing = false; return; }
    const { data: profile } = await this.client
      .from('profiles').select('display_name, role, active, avatar').eq('id', session.user.id).maybeSingle();
    if (!profile) {
      // Signed up but never redeemed a join code (or was removed).
      this.user = { id: session.user.id, email: session.user.email, name: session.user.email, role: null };
      this.profileMissing = true;
    } else {
      this.user = { id: session.user.id, email: session.user.email, name: profile.display_name, role: profile.role, avatar: profile.avatar };
      this.profileMissing = !profile.active;
    }
  }

  currentUser() { return this.user && this.user.role ? this.user : null; }
  onAuthChange(cb) { this.listeners.push(cb); }
  emit() { this.listeners.forEach(cb => cb(this.currentUser())); }

  async updateAvatar(avatarId) {
    const uid = this.user?.id;
    if (!uid) throw new Error('Not signed in.');
    const { error } = await this.client.from('profiles').update({ avatar: avatarId }).eq('id', uid);
    if (error) fail(error);
    this.user = { ...this.user, avatar: avatarId };
    this.emit();
  }

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
      .select('id, display_name, role, active, avatar, created_at').eq('role', 'student').order('display_name');
    if (error) fail(error);
    return data;
  }

  /* Classes the signed-in user can see (RLS scopes this: a teacher gets
     their own classes, the LAL gets all). Returns rosters + programs.
     Degrades gracefully to empty if the Gen2 tables aren't present yet. */
  async getClasses() {
    const c = this.client;
    try {
      const [classes, enrol, ct, programs] = await Promise.all([
        c.from('classes').select('*').order('name'),
        c.from('enrolments').select('student_id, class_id'),
        c.from('class_teachers').select('class_id, teacher_id, role'),
        c.from('programs').select('*').order('sort'),
      ]);
      for (const r of [classes, enrol, ct, programs]) if (r.error) throw r.error;
      const rosters = {};
      for (const e of enrol.data) (rosters[e.class_id] ||= []).push(e.student_id);
      return {
        ready: true,
        programs: programs.data,
        classes: classes.data.map(cl => ({
          ...cl,
          roster: rosters[cl.id] || [],
          teachers: ct.data.filter(t => t.class_id === cl.id),
        })),
      };
    } catch (e) {
      console.warn('getClasses: Gen2 tables not available yet.', e?.message || e);
      return { ready: false, programs: [], classes: [] };
    }
  }

  /* Create or update a class. A join code is unique per class; students who
     sign up with it are enrolled in that class (redeem_class_code, SQL side). */
  async saveClass(cls) {
    const c = this.client;
    const code = (cls.join_code || '').trim();
    if (!cls.name?.trim()) throw new Error('Give the class a name.');
    if (!code) throw new Error('Give the class a join code.');
    let error;
    if (cls.isNew) {
      ({ error } = await c.from('classes').insert({
        id: cls.id, program_id: cls.program_id || 'GMD', name: cls.name.trim(), join_code: code,
        active: cls.active !== false, primary_teacher_id: this.user?.id || null,
      }));
    } else {
      ({ error } = await c.from('classes').update({
        name: cls.name.trim(), join_code: code, active: cls.active !== false,
      }).eq('id', cls.id));
    }
    if (error) {
      if (error.code === '23505') throw new Error('That join code (or class id) is already used by another class.');
      fail(error);
    }
  }

  /* Put a student in exactly one class of that class's program (classId ''
     = take them out of their class). Their marks and submissions stay with
     the student, so moving between lines never loses work. */
  async moveStudent(studentId, classId, programId = 'GMD') {
    const c = this.client;
    const sibs = await c.from('classes').select('id').eq('program_id', programId);
    if (sibs.error) fail(sibs.error);
    const ids = sibs.data.map(x => x.id);
    if (ids.length) {
      const del = await c.from('enrolments').delete().eq('student_id', studentId).in('class_id', ids);
      if (del.error) fail(del.error);
    }
    if (classId) {
      const ins = await c.from('enrolments').insert({ student_id: studentId, class_id: classId });
      if (ins.error) fail(ins.error);
    }
  }

  async getClassData(classId = null) {
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
    let data = {
      profiles,
      attempts: attempts.data, submissions: submissions.data,
      marks: marks.data, feedback: feedback.data, progress: progress.data,
    };
    if (classId) {
      const enrol = await c.from('enrolments').select('student_id').eq('class_id', classId);
      if (enrol.error) fail(enrol.error);
      const ids = new Set(enrol.data.map(e => e.student_id));
      data = {
        profiles: data.profiles.filter(p => ids.has(p.id)),
        attempts: data.attempts.filter(a => ids.has(a.student_id)),
        submissions: data.submissions.filter(s => ids.has(s.student_id)),
        marks: data.marks.filter(m => ids.has(m.student_id)),
        feedback: data.feedback.filter(f => ids.has(f.student_id)),
        progress: data.progress.filter(p => ids.has(p.student_id)),
      };
    }
    return data;
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

  /* AI-drafted mark for a submission. Never writes marks/feedback —
     returns {ok, ratings, feedback} for the teacher to review and
     save via the normal saveMarks() path, or {ok:false, message}. */
  async aiDraftMark(studentId, taskId) {
    const { data, error } = await this.client.functions.invoke('ai-mark', { body: { studentId, taskId } });
    if (error) {
      // supabase-js's error.message is just a generic "non-2xx status code"
      // string — the function's own {ok:false, message} JSON body (the
      // actually useful part) sits on error.context, a raw Response.
      let detail = null;
      if (error?.context?.json) {
        try { detail = (await error.context.json())?.message; } catch { /* body wasn't JSON */ }
      }
      throw new Error(detail || error?.message || 'AI drafting is unavailable right now.');
    }
    return data;
  }

  /* ---------- attendance (teacher-only tables; see supabase/attendance-setup.sql) ---------- */
  /* Degrades to {ready:false} until the SQL has been run, so pages that
     show attendance (markbook, student page) keep working without it. */
  async attGetAll() {
    const c = this.client;
    try {
      const [classes, cs, terms, closures] = await Promise.all([
        c.from('att_classes').select('*').order('sort').order('name'),
        c.from('att_class_students').select('*'),
        c.from('att_terms').select('*').order('start_date'),
        c.from('att_closures').select('*').order('day'),
      ]);
      for (const r of [classes, cs, terms, closures]) if (r.error) throw r.error;
      const records = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await c.from('attendance').select('*')
          .order('day').order('slot').order('student_id').order('class_id')
          .range(from, from + 999);
        if (error) throw error;
        records.push(...data);
        if (data.length < 1000) break;
      }
      return { ready: true, classes: classes.data, classStudents: cs.data, terms: terms.data, closures: closures.data, records };
    } catch (e) {
      console.warn('Attendance tables not available yet.', e?.message || e);
      return { ready: false, classes: [], classStudents: [], terms: [], closures: [], records: [] };
    }
  }

  async attSaveClass(cls) {
    const { error } = await this.client.from('att_classes').upsert(
      { id: cls.id, name: cls.name, pattern: cls.pattern || [], sort: cls.sort || 0 });
    if (error) fail(error);
  }

  async attDeleteClass(id) {
    const { error } = await this.client.from('att_classes').delete().eq('id', id);
    if (error) fail(error);
  }

  /* One class per student: adding a student here removes them from any other class. */
  async attSetClassStudents(classId, studentIds) {
    const c = this.client;
    const del = await c.from('att_class_students').delete().eq('class_id', classId);
    if (del.error) fail(del.error);
    if (!studentIds.length) return;
    const moved = await c.from('att_class_students').delete().in('student_id', studentIds);
    if (moved.error) fail(moved.error);
    const ins = await c.from('att_class_students').insert(studentIds.map(student_id => ({ student_id, class_id: classId })));
    if (ins.error) fail(ins.error);
  }

  async attSaveTerms(terms) {
    const c = this.client;
    const existing = await c.from('att_terms').select('id');
    if (existing.error) fail(existing.error);
    const keep = new Set(terms.map(t => t.id));
    const gone = existing.data.map(r => r.id).filter(id => !keep.has(id));
    if (gone.length) { const d = await c.from('att_terms').delete().in('id', gone); if (d.error) fail(d.error); }
    if (terms.length) {
      const up = await c.from('att_terms').upsert(terms.map(({ id, year, number, name, start_date, end_date }) => ({ id, year, number, name, start_date, end_date })));
      if (up.error) fail(up.error);
    }
  }

  async attSaveClosures(closures) {
    const c = this.client;
    const existing = await c.from('att_closures').select('day');
    if (existing.error) fail(existing.error);
    const keep = new Set(closures.map(x => x.day));
    const gone = existing.data.map(r => r.day).filter(d => !keep.has(d));
    if (gone.length) { const d = await c.from('att_closures').delete().in('day', gone); if (d.error) fail(d.error); }
    if (closures.length) {
      const up = await c.from('att_closures').upsert(closures.map(({ day, label }) => ({ day, label: label || '' })));
      if (up.error) fail(up.error);
    }
  }

  /* entries: [{student_id, status:'P'|'A'|'E'|null, late_min, early_min, called_home, note}].
     A student with no status and no called-home note has their row removed (= not taken). */
  async attSaveRoll(classId, day, slot, entries) {
    const c = this.client;
    const blank = entries.filter(e => !e.status && !e.called_home).map(e => e.student_id);
    const rows = entries.filter(e => e.status || e.called_home).map(e => ({
      class_id: classId, student_id: e.student_id, day, slot,
      status: e.status || null,
      late_min: e.status === 'P' ? (e.late_min | 0) : 0,
      early_min: e.status === 'P' ? (e.early_min | 0) : 0,
      called_home: !!e.called_home, note: e.note || null,
      source: 'manual', updated_at: new Date().toISOString(),
    }));
    if (blank.length) {
      const d = await c.from('attendance').delete().eq('class_id', classId).eq('day', day).eq('slot', slot).in('student_id', blank);
      if (d.error) fail(d.error);
    }
    if (rows.length) {
      const u = await c.from('attendance').upsert(rows, { onConflict: 'class_id,student_id,day,slot' });
      if (u.error) fail(u.error);
    }
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
     Teacher-only (RLS enforces it). Upserts, so re-running is safe.

     GMD rows and General Maths (Gen2) rows are sent in SEPARATE batches per
     table: a bulk upsert fills any column missing from a row with NULL, so a
     mixed batch would blank Gen2-only columns such as units.program_id on the
     GMD units (and due_date on the Gen2 tasks). Each batch is also
     de-duplicated by primary key — Postgres rejects a batch that touches the
     same row twice ("ON CONFLICT DO UPDATE command cannot affect row a second
     time"). */
  async importCurriculum(onProgress = () => {}) {
    const c = this.client;
    const data = flattenSeed(seed);
    let gen2 = null;

    // Merge any authored Gen2 (General Maths) content — but only if this
    // database has actually had supabase/gen2-migration.sql applied. Without
    // this probe, Gen2's units (which carry a program_id column) would fail
    // the upsert below on any GMD-only database with a schema-cache error,
    // blocking the whole import including plain GMD content.
    try {
      const probe = await c.from('programs').select('id').limit(1);
      if (probe.error) throw probe.error;
      const { loadGen2Banks, flattenGen2 } = await import('./data/gen2/index.js');
      gen2 = flattenGen2(await loadGen2Banks());
    } catch (e) {
      console.warn('Gen2 content not merged (migration not applied on this database yet):', e?.message || e);
    }

    const keyOf = {
      courses: r => r.id, criteria: r => r.id, elements: r => r.id, units: r => r.id, tasks: r => r.id,
      task_criteria: r => `${r.task_id}|${r.criterion_id}`, task_elements: r => `${r.task_id}|${r.element_id}`,
      questions: r => r.id, answers: r => r.question_id,
    };
    const dedupe = (table, rows) => [...new Map(rows.map(r => [keyOf[table](r), r])).values()];

    const tables = ['courses', 'criteria', 'elements', 'units', 'tasks', 'task_criteria', 'task_elements', 'questions', 'answers'];
    let done = 0;
    for (const table of tables) {
      const batches = [
        ['GMD', data[table] || []],
        ['General Maths', gen2?.[table] || []],
      ].filter(([, rows]) => rows.length);
      for (const [label, raw] of batches) {
        const rows = dedupe(table, raw);
        onProgress(`Importing ${table} — ${label} (${rows.length} rows)…`, done / tables.length);
        const { error } = await c.from(table).upsert(rows);
        if (error) throw new Error(`Import failed at ${table} (${label} batch, ${rows.length} rows): ${error.message}`);
      }
      done++;
    }
    onProgress('Import complete.', 1);
    return { imported: data.tasks.length };
  }
}

/* ============================================================
   DEMO adapter — runs the whole LMS in the browser with no
   backend. Used when js/config.js has no Supabase credentials.
   State persists to localStorage so a demo session survives
   reloads. Passwords here are demo-only and stored in plain
   text on the local machine — never use this mode for a real
   class.
   ============================================================ */

import { seed, flattenSeed } from './data/seed.js';
import { DEMO_ACCOUNTS, DEMO_JOIN_CODE } from './config.js';

const LS_KEY = 'levelup-demo-v1';

/* ---------- grading (mirrors supabase/setup.sql submit_quiz_attempt) ---------- */
function gradeQuestion(q, answer, given) {
  if (given === undefined || given === null || given === '') return 0;
  switch (q.qtype) {
    case 'mc':
      return String(given) === String(answer.correct) ? 1 : 0;
    case 'multi': {
      const right = answer.correct.map(String);
      const sel = (Array.isArray(given) ? given : []).map(String);
      const hit = sel.filter(s => right.includes(s)).length;
      const wrong = sel.length - hit;
      return right.length ? Math.max(0, (hit - wrong) / right.length) : 0;
    }
    case 'match':
    case 'order': {
      const right = answer.correct;
      const sel = Array.isArray(given) ? given : [];
      let hit = 0;
      for (let i = 0; i < right.length; i++) {
        if (String(sel[i]) === String(right[i])) hit++;
      }
      return right.length ? hit / right.length : 0;
    }
    case 'numeric': {
      const v = parseFloat(given);
      if (Number.isNaN(v)) return 0;
      return Math.abs(v - answer.value) <= (answer.tolerance ?? 0) ? 1 : 0;
    }
    case 'short': {
      const g = String(given).trim().toLowerCase();
      for (const pat of answer.accept || []) {
        if (answer.regex) {
          try { if (new RegExp('^' + pat + '$', 'i').test(g)) return 1; } catch { /* bad pattern */ }
        } else if (g === String(pat).trim().toLowerCase()) return 1;
      }
      return 0;
    }
    default:
      return 0;
  }
}

export function gradeQuiz(questions, answersById, givenMap) {
  let score = 0, max = 0;
  const detail = [];
  for (const q of questions) {
    const frac = gradeQuestion(q, answersById[q.id], givenMap[q.id]);
    const awarded = Math.round(q.points * frac * 100) / 100;
    score += awarded;
    max += q.points;
    detail.push({
      question_id: q.id,
      given: givenMap[q.id] ?? null,
      result: frac >= 1 ? 'correct' : frac > 0 ? 'partial' : 'incorrect',
      awarded, points: q.points, explain: q.explain || null,
    });
  }
  return { score: Math.round(score * 100) / 100, max, detail };
}

/* ---------- demo state ---------- */
function freshState() {
  const data = flattenSeed(seed);
  const users = [
    { id: 'u-teacher', email: DEMO_ACCOUNTS.teacher.email, password: DEMO_ACCOUNTS.teacher.password, display_name: 'Mr Morgan', role: 'teacher', active: true },
    { id: 'u-ava', email: DEMO_ACCOUNTS.student.email, password: DEMO_ACCOUNTS.student.password, display_name: 'Ava P.', role: 'student', active: true },
    { id: 'u-ben', email: 'ben.t@demo.school', password: 'demo1234', display_name: 'Ben T.', role: 'student', active: true },
    { id: 'u-chloe', email: 'chloe.m@demo.school', password: 'demo1234', display_name: 'Chloe M.', role: 'student', active: true },
    { id: 'u-dev', email: 'dev.k@demo.school', password: 'demo1234', display_name: 'Dev K.', role: 'student', active: true },
  ];

  const day = 86400000;
  const at = (d) => new Date(Date.now() - d * day).toISOString();

  /* Sample activity so the demo dashboards feel alive. */
  const attempts = [
    { id: 1, task_id: 'Q1.1', student_id: 'u-ava', score: 9, max_score: 10, created_at: at(24), responses: [] },
    { id: 2, task_id: 'Q1.2', student_id: 'u-ava', score: 8, max_score: 9, created_at: at(20), responses: [] },
    { id: 3, task_id: 'Q1.1', student_id: 'u-ben', score: 6, max_score: 10, created_at: at(23), responses: [] },
    { id: 4, task_id: 'Q1.1', student_id: 'u-ben', score: 8.5, max_score: 10, created_at: at(22), responses: [] },
    { id: 5, task_id: 'Q1.1', student_id: 'u-chloe', score: 10, max_score: 10, created_at: at(24), responses: [] },
    { id: 6, task_id: 'Q1.2', student_id: 'u-chloe', score: 9, max_score: 9, created_at: at(19), responses: [] },
    { id: 7, task_id: 'Q2.1', student_id: 'u-chloe', score: 7.5, max_score: 9, created_at: at(10), responses: [] },
    { id: 8, task_id: 'Q1.1', student_id: 'u-dev', score: 7, max_score: 10, created_at: at(21), responses: [] },
  ];

  const submissions = [
    { id: 1, task_id: 'T1.1', student_id: 'u-ava', url: null, file_path: null, file_name: 'Task1.1_Ava_P.docx', comment: 'Finished Part B conclusion in class today.', created_at: at(18) },
    { id: 2, task_id: 'T1.1', student_id: 'u-ben', url: null, file_path: null, file_name: 'Task1.1_Ben_T.docx', comment: '', created_at: at(17) },
    { id: 3, task_id: 'T1.2', student_id: 'u-ava', url: null, file_path: null, file_name: 'Task1.2_Ava_P.docx', comment: '', created_at: at(12) },
    { id: 4, task_id: 'T1.1', student_id: 'u-chloe', url: 'https://onedrive.live.com/example-chloe-t11', file_path: null, file_name: null, comment: 'Shared via OneDrive link.', created_at: at(16) },
    { id: 5, task_id: 'T1.3', student_id: 'u-chloe', url: null, file_path: null, file_name: 'Task1.3_Chloe_M.pdf', comment: '', created_at: at(8) },
  ];

  const marks = [
    { student_id: 'u-ava', task_id: 'T1.1', criterion_id: 'ESC-C1', rating: 'C' },
    { student_id: 'u-ava', task_id: 'T1.1', criterion_id: 'ESC-C2', rating: 'C' },
    { student_id: 'u-ava', task_id: 'T1.1', criterion_id: 'ICT-C1', rating: 'A' },
    { student_id: 'u-chloe', task_id: 'T1.1', criterion_id: 'ESC-C1', rating: 'C' },
    { student_id: 'u-chloe', task_id: 'T1.1', criterion_id: 'ESC-C2', rating: 'C' },
    { student_id: 'u-chloe', task_id: 'T1.1', criterion_id: 'ICT-C1', rating: 'A' },
  ];

  const feedback = [
    { student_id: 'u-ava', task_id: 'T1.1', feedback: 'Excellent justification of engine choices — your lab suitability conclusion showed real analysis. Watch APA formatting on web sources.', marked_at: at(15) },
    { student_id: 'u-chloe', task_id: 'T1.1', feedback: 'Thorough comparison table. To push into A-standard consistently, justify hardware picks against the specific game type in each scenario.', marked_at: at(14) },
  ];

  const progress = [
    { student_id: 'u-ava', task_id: 'T1.3', started_at: at(9) },
    { student_id: 'u-ben', task_id: 'T1.2', started_at: at(11) },
    { student_id: 'u-dev', task_id: 'T1.1', started_at: at(15) },
  ];

  return {
    settings: { join_code: DEMO_JOIN_CODE, teacher_email: DEMO_ACCOUNTS.teacher.email },
    users,
    sessionUserId: null,
    ...data,
    attempts,
    submissions,
    marks,
    feedback,
    progress,
    nextId: 100,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.tasks && s.users) return s;
    }
  } catch { /* corrupted -> reset */ }
  return freshState();
}

export class DemoAdapter {
  constructor() {
    this.mode = 'demo';
    this.state = load();
    this.listeners = [];
  }

  save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.state)); } catch { /* storage full/blocked */ }
  }

  async init() {}

  resetDemo() {
    this.state = freshState();
    this.save();
    this.emit();
  }

  /* ---------- auth ---------- */
  currentUser() {
    const u = this.state.users.find(x => x.id === this.state.sessionUserId);
    if (!u) return null;
    return { id: u.id, email: u.email, name: u.display_name, role: u.role };
  }

  onAuthChange(cb) { this.listeners.push(cb); }
  emit() { this.listeners.forEach(cb => cb(this.currentUser())); }

  async signUp({ email, password, name, joinCode }) {
    if (joinCode.trim().toLowerCase() !== this.state.settings.join_code.trim().toLowerCase()) {
      throw new Error('That join code is not correct. Check with your teacher.');
    }
    if (this.state.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account already exists for that email. Try signing in.');
    }
    const role = email.toLowerCase() === (this.state.settings.teacher_email || '').toLowerCase() ? 'teacher' : 'student';
    const user = { id: 'u-' + (this.state.nextId++), email, password, display_name: name, role, active: true };
    this.state.users.push(user);
    this.state.sessionUserId = user.id;
    this.save();
    this.emit();
    return this.currentUser();
  }

  async signIn(email, password) {
    const u = this.state.users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!u) throw new Error('Email or password is incorrect.');
    if (!u.active) throw new Error('This account has been deactivated. See your teacher.');
    this.state.sessionUserId = u.id;
    this.save();
    this.emit();
    return this.currentUser();
  }

  async signOut() {
    this.state.sessionUserId = null;
    this.save();
    this.emit();
  }

  /* ---------- curriculum ---------- */
  async getCurriculum() {
    const s = this.state;
    const user = this.currentUser();
    const isTeacher = user?.role === 'teacher';
    const tasks = s.tasks
      .filter(t => t.published || isTeacher)
      .map(t => ({
        ...t,
        criteria: s.task_criteria.filter(tc => tc.task_id === t.id).map(tc => tc.criterion_id),
        elements: s.task_elements.filter(te => te.task_id === t.id).map(te => te.element_id),
        questions: s.questions.filter(q => q.task_id === t.id).sort((a, b) => a.ord - b.ord),
      }));
    return {
      courses: [...s.courses],
      criteria: [...s.criteria],
      elements: [...s.elements],
      units: [...s.units].sort((a, b) => a.sort - b.sort),
      tasks,
    };
  }

  /* ---------- student ---------- */
  requireUser() {
    const u = this.currentUser();
    if (!u) throw new Error('Not signed in.');
    return u;
  }

  async getMyState() {
    const u = this.requireUser();
    const s = this.state;
    return {
      attempts: s.attempts.filter(a => a.student_id === u.id),
      submissions: s.submissions.filter(x => x.student_id === u.id),
      marks: s.marks.filter(m => m.student_id === u.id),
      feedback: s.feedback.filter(f => f.student_id === u.id),
      progress: s.progress.filter(p => p.student_id === u.id),
    };
  }

  async startTask(taskId) {
    const u = this.requireUser();
    if (!this.state.progress.some(p => p.student_id === u.id && p.task_id === taskId)) {
      this.state.progress.push({ student_id: u.id, task_id: taskId, started_at: new Date().toISOString() });
      this.save();
    }
  }

  async submitQuiz(taskId, givenMap) {
    const u = this.requireUser();
    const s = this.state;
    const task = s.tasks.find(t => t.id === taskId && t.type === 'quiz' && t.published);
    if (!task) throw new Error('Quiz not found.');
    if (task.max_attempts != null) {
      const used = s.attempts.filter(a => a.task_id === taskId && a.student_id === u.id).length;
      if (used >= task.max_attempts) throw new Error('No attempts remaining for this quiz.');
    }
    const questions = s.questions.filter(q => q.task_id === taskId).sort((a, b) => a.ord - b.ord);
    const answersById = Object.fromEntries(
      s.answers.filter(a => questions.some(q => q.id === a.question_id)).map(a => [a.question_id, a.answer]));
    const result = gradeQuiz(questions, answersById, givenMap);
    const attempt = {
      id: this.state.nextId++, task_id: taskId, student_id: u.id,
      score: result.score, max_score: result.max, responses: result.detail,
      created_at: new Date().toISOString(),
    };
    s.attempts.push(attempt);
    this.save();
    return { attempt_id: attempt.id, ...result };
  }

  async submitWork(taskId, { url, file, comment }) {
    const u = this.requireUser();
    const sub = {
      id: this.state.nextId++, task_id: taskId, student_id: u.id,
      url: url || null,
      file_path: file ? `demo/${u.id}/${file.name}` : null,
      file_name: file ? file.name : null,
      comment: comment || null,
      created_at: new Date().toISOString(),
    };
    this.state.submissions.push(sub);
    this.save();
    return sub;
  }

  /* ---------- teacher ---------- */
  requireTeacher() {
    const u = this.requireUser();
    if (u.role !== 'teacher') throw new Error('Teacher access only.');
    return u;
  }

  async listStudents() {
    this.requireTeacher();
    return this.state.users
      .filter(u => u.role === 'student')
      .map(u => ({ id: u.id, email: u.email, display_name: u.display_name, role: u.role, active: u.active }));
  }

  async getClassData() {
    this.requireTeacher();
    const s = this.state;
    return {
      profiles: await this.listStudents(),
      attempts: [...s.attempts],
      submissions: [...s.submissions],
      marks: [...s.marks],
      feedback: [...s.feedback],
      progress: [...s.progress],
    };
  }

  async saveMarks(studentId, taskId, ratings, feedbackText) {
    this.requireTeacher();
    const s = this.state;
    s.marks = s.marks.filter(m => !(m.student_id === studentId && m.task_id === taskId));
    for (const [criterionId, rating] of Object.entries(ratings)) {
      if (rating) s.marks.push({ student_id: studentId, task_id: taskId, criterion_id: criterionId, rating });
    }
    s.feedback = s.feedback.filter(f => !(f.student_id === studentId && f.task_id === taskId));
    s.feedback.push({ student_id: studentId, task_id: taskId, feedback: feedbackText || '', marked_at: new Date().toISOString() });
    this.save();
  }

  async setStudentActive(studentId, active) {
    this.requireTeacher();
    const u = this.state.users.find(x => x.id === studentId);
    if (u) { u.active = active; this.save(); }
  }

  async getFileUrl(path) {
    return null; // demo files aren't real uploads
  }

  async getTaskAnswers(taskId) {
    this.requireTeacher();
    const qids = this.state.questions.filter(q => q.task_id === taskId).map(q => q.id);
    return Object.fromEntries(this.state.answers.filter(a => qids.includes(a.question_id)).map(a => [a.question_id, a.answer]));
  }

  async saveTask(def) {
    this.requireTeacher();
    const s = this.state;
    const { criteria = [], elements = [], questions = [], ...row } = def;
    const idx = s.tasks.findIndex(t => t.id === row.id);
    if (idx >= 0) s.tasks[idx] = { ...s.tasks[idx], ...row };
    else s.tasks.push(row);
    s.task_criteria = s.task_criteria.filter(tc => tc.task_id !== row.id)
      .concat(criteria.map(c => ({ task_id: row.id, criterion_id: c })));
    s.task_elements = s.task_elements.filter(te => te.task_id !== row.id)
      .concat(elements.map(e => ({ task_id: row.id, element_id: e })));
    if (row.type === 'quiz') {
      const oldQids = s.questions.filter(q => q.task_id === row.id).map(q => q.id);
      s.questions = s.questions.filter(q => q.task_id !== row.id);
      s.answers = s.answers.filter(a => !oldQids.includes(a.question_id));
      for (const q of questions) {
        const { answer, ...qRow } = q;
        qRow.task_id = row.id;
        s.questions.push(qRow);
        s.answers.push({ question_id: q.id, answer });
      }
    }
    this.save();
  }

  async deleteTask(taskId) {
    this.requireTeacher();
    const s = this.state;
    const qids = s.questions.filter(q => q.task_id === taskId).map(q => q.id);
    s.tasks = s.tasks.filter(t => t.id !== taskId);
    s.task_criteria = s.task_criteria.filter(tc => tc.task_id !== taskId);
    s.task_elements = s.task_elements.filter(te => te.task_id !== taskId);
    s.questions = s.questions.filter(q => q.task_id !== taskId);
    s.answers = s.answers.filter(a => !qids.includes(a.question_id));
    s.attempts = s.attempts.filter(a => a.task_id !== taskId);
    s.submissions = s.submissions.filter(x => x.task_id !== taskId);
    s.marks = s.marks.filter(m => m.task_id !== taskId);
    this.save();
  }

  async getSettings() {
    this.requireTeacher();
    return { ...this.state.settings };
  }

  async saveSettings(patch) {
    this.requireTeacher();
    Object.assign(this.state.settings, patch);
    this.save();
  }

  async importCurriculum() {
    // Demo state is already seeded; re-seed curriculum only, keeping accounts and work.
    this.requireTeacher();
    const data = flattenSeed(seed);
    Object.assign(this.state, {
      courses: data.courses, criteria: data.criteria, elements: data.elements,
      units: data.units, tasks: data.tasks, task_criteria: data.task_criteria,
      task_elements: data.task_elements, questions: data.questions, answers: data.answers,
    });
    this.save();
    return { imported: data.tasks.length };
  }
}

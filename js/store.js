/* ============================================================
   Store: caches curriculum + per-user state and computes all
   derived data — task status, XP/levels/badges, criterion
   coverage, and the assessment matrix with gap detection.
   ============================================================ */

import { api } from './api.js';

let curriculum = null;
let myState = null;

export function invalidate({ curriculum: c = false, state: s = true } = {}) {
  if (c) curriculum = null;
  if (s) myState = null;
}

export async function getCurriculum(force = false) {
  if (!curriculum || force) curriculum = await api.getCurriculum();
  return curriculum;
}

export async function getMyState(force = false) {
  if (!myState || force) myState = await api.getMyState();
  return myState;
}

/* ---------- lookups ---------- */
export function courseOfCriterion(cur, criterionId) {
  return cur.criteria.find(c => c.id === criterionId)?.course_id;
}

export function criterionLabel(cur, criterionId) {
  const c = cur.criteria.find(x => x.id === criterionId);
  if (!c) return criterionId;
  return `${c.course_id.slice(0, 3)} C${c.number}`;
}

export function taskById(cur, id) {
  return cur.tasks.find(t => t.id === id);
}

/* ---------- per-task status for one student ---------- */
export function taskStatus(task, state) {
  if (task.type === 'quiz') {
    const attempts = state.attempts.filter(a => a.task_id === task.id);
    if (attempts.length) return 'marked';
  } else {
    const hasMark = state.marks.some(m => m.task_id === task.id) ||
      state.feedback.some(f => f.task_id === task.id);
    if (hasMark) return 'marked';
    if (state.submissions.some(s => s.task_id === task.id)) return 'submitted';
  }
  if (state.progress.some(p => p.task_id === task.id)) return 'in_progress';
  return 'not_started';
}

export function bestAttempt(taskId, state) {
  const attempts = state.attempts.filter(a => a.task_id === taskId);
  if (!attempts.length) return null;
  return attempts.reduce((best, a) => (a.score / a.max_score > best.score / best.max_score ? a : best));
}

/* ---------- XP, levels, badges ---------- */
const RATING_XP = { A: 60, C: 40, t: 10, z: 0 };

export function computeXP(cur, state) {
  let xp = 0;
  for (const t of cur.tasks.filter(t => t.type === 'quiz')) {
    const best = bestAttempt(t.id, state);
    if (best && best.max_score > 0) xp += Math.round((best.score / best.max_score) * 50);
  }
  for (const m of state.marks) xp += RATING_XP[m.rating] ?? 0;
  xp += state.submissions.length * 10; // shipping work counts
  return xp;
}

export function levelFromXP(xp) {
  const level = Math.floor(xp / 150) + 1;
  const into = xp % 150;
  return { level, into, next: 150, pct: (into / 150) * 100 };
}

const BADGES = [
  { id: 'first-steps', icon: '👟', name: 'First Steps', desc: 'Started your first task',
    earned: (cur, s) => s.progress.length + s.submissions.length + s.attempts.length > 0 },
  { id: 'quiz-whiz', icon: '🧠', name: 'Quiz Whiz', desc: 'Scored 80%+ on a quiz',
    earned: (cur, s) => s.attempts.some(a => a.max_score > 0 && a.score / a.max_score >= 0.8) },
  { id: 'perfectionist', icon: '💯', name: 'Perfectionist', desc: '100% on any quiz',
    earned: (cur, s) => s.attempts.some(a => a.max_score > 0 && a.score >= a.max_score) },
  { id: 'shipped', icon: '📦', name: 'Shipped It', desc: 'Made your first submission',
    earned: (cur, s) => s.submissions.length > 0 },
  { id: 'on-fire', icon: '🔥', name: 'On Fire', desc: '80%+ on three different quizzes',
    earned: (cur, s) => {
      const passed = new Set(s.attempts.filter(a => a.max_score > 0 && a.score / a.max_score >= 0.8).map(a => a.task_id));
      return passed.size >= 3;
    } },
  { id: 'a-game', icon: '⭐', name: 'A-Game', desc: 'Earned an A rating on a criterion',
    earned: (cur, s) => s.marks.some(m => m.rating === 'A') },
  { id: 'unit-clear', icon: '🏁', name: 'Unit Clear', desc: 'Completed every task in a unit',
    earned: (cur, s) => cur.units.some(u => {
      const unitTasks = cur.tasks.filter(t => t.unit_id === u.id);
      return unitTasks.length > 0 && unitTasks.every(t => ['submitted', 'marked'].includes(taskStatus(t, s)));
    }) },
  { id: 'full-coverage', icon: '🗺️', name: 'Full Coverage', desc: 'Evidence against every criterion',
    earned: (cur, s) => {
      const covered = studentCriterionEvidence(cur, s);
      return cur.criteria.every(c => (covered[c.id] || []).length > 0);
    } },
];

export function computeBadges(cur, state) {
  return BADGES.map(b => ({ ...b, earned: b.earned(cur, state) }));
}

/* ---------- student criterion evidence ----------
   Evidence for a criterion = a teacher mark against it, or a
   passed quiz (>= pass_pct) that assesses it. Returns
   {criterionId: [{taskId, kind, label}]}. */
export function studentCriterionEvidence(cur, state) {
  const out = {};
  const add = (critId, ev) => { (out[critId] = out[critId] || []).push(ev); };
  for (const m of state.marks) {
    add(m.criterion_id, { taskId: m.task_id, kind: 'mark', label: m.rating });
  }
  for (const t of cur.tasks.filter(t => t.type === 'quiz')) {
    const best = bestAttempt(t.id, state);
    if (best && best.max_score > 0 && (best.score / best.max_score) * 100 >= (t.pass_pct ?? 80)) {
      for (const c of t.criteria) add(c, { taskId: t.id, kind: 'quiz', label: Math.round((best.score / best.max_score) * 100) + '%' });
    }
  }
  return out;
}

/* ---------- per-course progress ---------- */
export function courseProgress(cur, state) {
  return cur.courses.map(course => {
    const courseCrit = cur.criteria.filter(c => c.course_id === course.id).map(c => c.id);
    const tasks = cur.tasks.filter(t => t.criteria.some(c => courseCrit.includes(c)));
    const done = tasks.filter(t => ['submitted', 'marked'].includes(taskStatus(t, state))).length;
    return { course, total: tasks.length, done, pct: tasks.length ? (done / tasks.length) * 100 : 0 };
  });
}

/* ---------- coverage matrix + gap detection ---------- */
export function coverageMatrix(cur) {
  const perCriterion = {};
  const perElement = {};
  for (const c of cur.criteria) perCriterion[c.id] = [];
  for (const e of cur.elements) perElement[e.id] = [];
  for (const t of cur.tasks.filter(t => t.published !== false)) {
    for (const c of t.criteria) if (perCriterion[c]) perCriterion[c].push(t.id);
    for (const e of t.elements) if (perElement[e]) perElement[e].push(t.id);
  }
  const gaps = [];
  for (const c of cur.criteria) {
    const n = perCriterion[c.id].length;
    if (n < 2) gaps.push({ kind: 'criterion', id: c.id, count: n, need: 2, text: `${c.id} is assessed by ${n} task${n === 1 ? '' : 's'} — minimum is 2.` });
  }
  for (const e of cur.elements) {
    const n = perElement[e.id].length;
    if (n < 1) gaps.push({ kind: 'element', id: e.id, count: n, need: 1, text: `Element ${e.id} is not assessed by any task.` });
  }
  return { perCriterion, perElement, gaps };
}

/* ---------- provisional award estimation (teacher view) ----------
   Uses the BEST rating per criterion across all marked tasks.
   ESC/PRJ use C-only standards; ICT uses A and C.
   PRJ additionally requires all 6 work requirements (manual check). */
const RANK = { A: 3, C: 2, t: 1, z: 0 };

export function bestRatingsFor(cur, marks) {
  const best = {};
  for (const m of marks) {
    if (!best[m.criterion_id] || RANK[m.rating] > RANK[best[m.criterion_id]]) best[m.criterion_id] = m.rating;
  }
  return best;
}

export function provisionalAward(cur, courseId, marks) {
  const critIds = cur.criteria.filter(c => c.course_id === courseId).map(c => c.id);
  const best = bestRatingsFor(cur, marks.filter(m => critIds.includes(m.criterion_id)));
  const ratings = critIds.map(id => best[id] || '—');
  const nA = ratings.filter(r => r === 'A').length;
  const nC = ratings.filter(r => r === 'C' || r === 'A').length; // A counts as at least C
  const n = critIds.length;
  let award = '—';
  if (courseId.startsWith('ICT')) {
    if (nA === 5) award = 'EA';
    else if (nA >= 2 && nC >= 5) award = 'CA';
    else if (nC >= 5) award = 'SA';
    else if (nC >= 2) award = 'PA';
  } else {
    if (nC >= n) award = 'SA';
    else if (nC >= n - 1) award = 'PA';
  }
  return { ratings, award, best };
}

/* Units list and single-unit view with task cards + status chips. */

import { api } from '../api.js';
import { render, esc, spinner, statusChip, badge, courseBadgeClass, progressBar } from '../ui.js';
import { getCurriculum, getMyState, taskStatus, criterionLabel, bestAttempt, filterCurByProgram, programsIn } from '../store.js';
import { getScope, setScope } from '../scope.js';

const PROGRAM_LABEL = { GMD: 'Game Design', GEN2: 'General Maths' };

/* Choose which program's units to show. When more than one program exists,
   default to the scope's program (or the first) and offer a switcher, so
   GMD and General Maths units don't collide on shared unit numbers. */
export function unitBanner(u) {
  if (u.program_id === 'GEN2') {
    return `<span class="phase-banner phase-2">◈ ${esc(u.subtitle || 'General Maths')}</span>`;
  }
  return `<span class="phase-banner ${u.phase === 2 ? 'phase-2' : 'phase-1'}">${u.phase === 2 ? '◈ Phase 2 · PRJ' : '⬡ Phase 1 · ESC + ICT'}</span>`;
}

export async function unitsView() {
  render(spinner('Loading units…'));
  const curAll = await getCurriculum();
  const progs = programsIn(curAll);
  const programId = getScope().programId || (progs.length > 1 ? progs[0] : null);
  const cur = filterCurByProgram(curAll, programId);
  const user = api.currentUser();
  const state = user ? await getMyState() : null;

  const switcher = progs.length > 1 ? `<div class="meta-row" style="margin-top:0.75rem;">${progs.map(p =>
    `<button class="btn btn-sm ${p === programId ? 'btn-primary' : 'btn-secondary'}" data-prog="${esc(p)}">${esc(PROGRAM_LABEL[p] || p)}</button>`).join('')}</div>` : '';

  const cards = cur.units.map(u => {
    const tasks = cur.tasks.filter(t => t.unit_id === u.id);
    const quizCount = tasks.filter(t => t.type === 'quiz').length;
    const lessonCount = tasks.filter(t => t.type === 'lesson').length;
    let progressHtml = '';
    if (state && tasks.length) {
      const done = tasks.filter(t => ['submitted', 'marked'].includes(taskStatus(t, state))).length;
      progressHtml = progressBar((done / tasks.length) * 100, { label: `Unit ${u.number} progress` });
    }
    return `
      <a class="card unit-card ${u.phase === 2 ? 'unit-card--prj' : ''}" href="#/units/${u.number}">
        <div class="unit-num">${u.number}</div>
        <div class="unit-meta">
          ${unitBanner(u)}
          <span class="unit-weeks">${esc(u.weeks)}</span>
        </div>
        <h3>${esc(u.title)}</h3>
        <p>${esc(u.subtitle || '')}</p>
        <p class="unit-counts">${tasks.length - quizCount - lessonCount} tasks · ${lessonCount ? `${lessonCount} lessons · ` : ''}${quizCount} quizzes</p>
        ${progressHtml}
      </a>`;
  }).join('');

  render(`
<div class="page-header">
  <div class="container">
    <div class="breadcrumb"><a href="#/">Home</a> › Units</div>
    <h1>Course <span class="text-teal">Units</span></h1>
    <p class="lead">Work through the year unit by unit.</p>
    ${switcher}
  </div>
</div>
<section class="section">
  <div class="container">
    <div class="grid grid-3 units-grid">${cards}</div>
  </div>
</section>`, { title: 'Units' });

  document.querySelectorAll('[data-prog]').forEach(b => b.addEventListener('click', (e) => {
    e.preventDefault();
    setScope({ programId: b.dataset.prog, classId: null });
    location.reload();
  }));
}

export async function unitView({ n }) {
  render(spinner('Loading unit…'));
  const cur = filterCurByProgram(await getCurriculum(), getScope().programId);
  const unit = cur.units.find(u => String(u.number) === String(n));
  if (!unit) { render(`<section class="section"><div class="container"><h1>Unit not found</h1><a class="btn btn-secondary" href="#/units">← All units</a></div></section>`); return; }
  const user = api.currentUser();
  const state = user ? await getMyState() : null;
  const tasks = cur.tasks.filter(t => t.unit_id === unit.id);

  const critBadges = [...new Set(tasks.flatMap(t => t.criteria))]
    .sort()
    .map(c => badge(criterionLabel(cur, c), courseBadgeClass(c))).join(' ');

  const rows = tasks.map(t => {
    const isQuiz = t.type === 'quiz';
    const isLesson = t.type === 'lesson';
    const st = state && !isLesson ? taskStatus(t, state) : null;
    let scoreNote = '';
    if (state && isQuiz) {
      const best = bestAttempt(t.id, state);
      if (best) scoreNote = `<span class="score-note">Best: ${Math.round((best.score / best.max_score) * 100)}%</span>`;
    }
    return `
    <a class="task-row ${isQuiz ? 'task-row--quiz' : ''} ${isLesson ? 'task-row--lesson' : ''}" href="#/task/${encodeURIComponent(t.id)}">
      <div class="task-row-num">${isQuiz ? '⚡' : isLesson ? '📖' : esc(t.code)}</div>
      <div class="task-row-main">
        <h3>${esc(t.title)} ${t.published === false ? '<span class="chip chip-idle">Hidden</span>' : ''}</h3>
        <div class="task-row-badges">
          ${t.criteria.map(c => badge(criterionLabel(cur, c), courseBadgeClass(c))).join(' ')}
        </div>
        <div class="task-row-meta">⏱ ${esc(t.est_time || '—')} · 🛠 ${esc(t.tools || '—')} · 📅 ${esc(t.weeks || '')}</div>
      </div>
      <div class="task-row-side">
        ${isQuiz ? '<span class="chip chip-quiz">Auto-marked quiz</span>' : ''}
        ${isLesson ? '<span class="chip chip-idle">Lesson</span>' : ''}
        ${st ? statusChip(st) : ''}
        ${scoreNote}
      </div>
    </a>`;
  }).join('');

  const prev = cur.units.find(u => u.number === unit.number - 1);
  const next = cur.units.find(u => u.number === unit.number + 1);

  render(`
<div class="page-header ${unit.phase === 2 ? 'page-header--prj' : ''}">
  <div class="container">
    <div class="breadcrumb"><a href="#/">Home</a> › <a href="#/units">Units</a> › Unit ${unit.number}</div>
    <div class="meta-row">
      <span class="phase-banner ${unit.phase === 2 ? 'phase-2' : 'phase-1'}">${unit.phase === 2 ? '◈ Phase 2 · Project Implementation' : '⬡ Phase 1 · ESC + ICT'}</span>
      <span class="unit-weeks">${esc(unit.weeks)}</span>
    </div>
    <h1 style="margin-top:0.75rem;">Unit ${unit.number}: <span class="${unit.phase === 2 ? 'text-purple' : 'text-teal'}">${esc(unit.title)}</span></h1>
    <p class="lead">${esc(unit.description || '')}</p>
    <div class="meta-row">${critBadges}</div>
  </div>
</div>
<section class="section">
  <div class="container">
    ${!user ? `<div class="info-box" style="margin-bottom:1.5rem;"><p><strong>Viewing as guest.</strong> <a href="#/login">Sign in</a> to submit tasks, take quizzes and track your progress.</p></div>` : ''}
    <div class="task-rows">${rows}</div>
    <div class="unit-nav">
      ${prev ? `<a href="#/units/${prev.number}" class="btn btn-secondary">← Unit ${prev.number}: ${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a href="#/units/${next.number}" class="btn btn-primary">Unit ${next.number}: ${esc(next.title)} →</a>` : ''}
    </div>
  </div>
</section>`, { title: `Unit ${unit.number}: ${unit.title}` });
}

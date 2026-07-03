/* Student dashboard (XP, level, badges, course progress, recent
   activity) and the detailed progress / evidence view. */

import { api } from '../api.js';
import { render, esc, spinner, statusChip, progressBar, badge, courseBadgeClass, fmtDate } from '../ui.js';
import {
  getCurriculum, getMyState, taskStatus, computeXP, levelFromXP, computeBadges,
  courseProgress, studentCriterionEvidence, criterionLabel, bestAttempt,
} from '../store.js';

export async function dashboardView() {
  render(spinner('Loading your dashboard…'));
  const cur = await getCurriculum();
  const state = await getMyState(true);
  const user = api.currentUser();

  const xp = computeXP(cur, state);
  const lvl = levelFromXP(xp);
  const badges = computeBadges(cur, state);
  const earned = badges.filter(b => b.earned);
  const courses = courseProgress(cur, state);

  const nextTask = cur.tasks.find(t => !['submitted', 'marked'].includes(taskStatus(t, state)));

  const recent = [
    ...state.attempts.map(a => ({ at: a.created_at, html: quizActivity(cur, a) })),
    ...state.submissions.map(s => ({ at: s.created_at, html: subActivity(cur, s) })),
    ...state.feedback.map(f => ({ at: f.marked_at, html: markActivity(cur, f) })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  render(`
<div class="page-header">
  <div class="container">
    <h1>Hey, <span class="text-gradient">${esc(user.name)}</span> 👋</h1>
    <p class="lead">Level ${lvl.level} · ${xp} XP total</p>
    <div class="xp-wrap">
      ${progressBar(lvl.pct, { label: 'XP to next level', xp: true })}
      <span class="xp-note">${lvl.into} / ${lvl.next} XP to Level ${lvl.level + 1}</span>
    </div>
  </div>
</div>
<section class="section section--sm">
  <div class="container">
    <div class="grid grid-4 stat-grid">
      <div class="stat-card"><b data-count="${xp}">0</b><span>Total XP</span></div>
      <div class="stat-card"><b data-count="${state.attempts.length}">0</b><span>Quiz attempts</span></div>
      <div class="stat-card"><b data-count="${state.submissions.length}">0</b><span>Submissions</span></div>
      <div class="stat-card"><b data-count="${earned.length}">0</b><span>Badges</span></div>
    </div>

    ${nextTask ? `
    <div class="cta-panel cta-panel--slim">
      <div>
        <h3>▶ Continue your quest</h3>
        <p>Next up: <strong>${esc(nextTask.code)} — ${esc(nextTask.title)}</strong></p>
      </div>
      <a class="btn btn-primary" href="#/task/${encodeURIComponent(nextTask.id)}">Open task →</a>
    </div>` : `
    <div class="cta-panel cta-panel--slim">
      <div><h3>🏆 Everything's submitted!</h3><p>All published tasks are done or awaiting marking. Legend.</p></div>
    </div>`}

    <h2 style="margin-top:2.5rem;">Course progress</h2>
    <div class="grid grid-3" style="margin-top:1rem;">
      ${courses.map(cp => `
        <div class="card">
          <span class="badge badge-${esc(cp.course.id.slice(0, 3).toLowerCase())}">${esc(cp.course.id)}</span>
          <h3 style="margin:0.5rem 0;">${esc(cp.course.title)}</h3>
          ${progressBar(cp.pct, { label: `${cp.course.id} progress` })}
          <p class="unit-counts">${cp.done} of ${cp.total} tasks complete</p>
        </div>`).join('')}
    </div>

    <h2 style="margin-top:2.5rem;">Badges</h2>
    <div class="badge-grid">
      ${badges.map(b => `
        <div class="badge-card ${b.earned ? 'badge-card--earned' : ''}" title="${esc(b.desc)}">
          <span class="badge-icon">${b.icon}</span>
          <span class="badge-name">${esc(b.name)}</span>
          <span class="badge-desc">${esc(b.desc)}</span>
        </div>`).join('')}
    </div>

    <div class="grid grid-2" style="margin-top:2.5rem; align-items:start;">
      <div>
        <h2>Recent activity</h2>
        ${recent.length ? `<ul class="activity-list">${recent.map(r => `<li>${r.html}<span class="sub-date">${fmtDate(r.at)}</span></li>`).join('')}</ul>`
          : '<p>No activity yet — open a unit and start your first task!</p>'}
      </div>
      <div>
        <h2>My criterion coverage</h2>
        <p class="unit-counts">Evidence recorded against each TASC criterion. <a href="#/progress">Full detail →</a></p>
        ${coverageMini(cur, state)}
      </div>
    </div>
  </div>
</section>`, { title: 'My Dashboard' });
}

function quizActivity(cur, a) {
  const t = cur.tasks.find(x => x.id === a.task_id);
  const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
  return `⚡ Scored <strong>${pct}%</strong> on <a href="#/task/${encodeURIComponent(a.task_id)}">${esc(t?.title || a.task_id)}</a>`;
}
function subActivity(cur, s) {
  const t = cur.tasks.find(x => x.id === s.task_id);
  return `📤 Submitted <a href="#/task/${encodeURIComponent(s.task_id)}">${esc(t?.code || '')} ${esc(t?.title || s.task_id)}</a>`;
}
function markActivity(cur, f) {
  const t = cur.tasks.find(x => x.id === f.task_id);
  return `📋 Feedback received on <a href="#/task/${encodeURIComponent(f.task_id)}">${esc(t?.code || '')} ${esc(t?.title || f.task_id)}</a>`;
}

function coverageMini(cur, state) {
  const evidence = studentCriterionEvidence(cur, state);
  return `<div class="coverage-mini">
    ${cur.courses.map(course => {
      const crits = cur.criteria.filter(c => c.course_id === course.id).sort((a, b) => a.number - b.number);
      return `<div class="coverage-mini-row">
        <span class="badge badge-${esc(course.id.slice(0, 3).toLowerCase())}">${esc(course.id.slice(0, 3))}</span>
        ${crits.map(c => {
          const n = (evidence[c.id] || []).length;
          return `<span class="cov-dot ${n > 0 ? 'cov-dot--on' : ''}" title="${esc(c.id)}: ${n} piece${n === 1 ? '' : 's'} of evidence">C${c.number}</span>`;
        }).join('')}
      </div>`;
    }).join('')}
  </div>`;
}

export async function progressView() {
  render(spinner('Loading your progress…'));
  const cur = await getCurriculum();
  const state = await getMyState(true);
  const evidence = studentCriterionEvidence(cur, state);

  const courseBlocks = cur.courses.map(course => {
    const crits = cur.criteria.filter(c => c.course_id === course.id).sort((a, b) => a.number - b.number);
    return `
    <div class="card" style="margin-bottom:1.5rem;">
      <span class="badge badge-${esc(course.id.slice(0, 3).toLowerCase())}">${esc(course.id)}</span>
      <h3 style="margin:0.5rem 0 1rem;">${esc(course.title)}</h3>
      ${crits.map(c => {
        const evs = evidence[c.id] || [];
        return `
        <div class="evidence-row">
          <div class="evidence-crit"><strong>C${c.number}</strong> ${esc(c.title)}</div>
          <div class="evidence-chips">
            ${evs.length ? evs.map(ev => {
              const t = cur.tasks.find(x => x.id === ev.taskId);
              return `<a class="rating-chip ${ev.kind === 'mark' ? 'rating-' + esc(ev.label) : 'rating-quiz'}" href="#/task/${encodeURIComponent(ev.taskId)}" title="${esc(t?.title || '')}">${esc(t?.code || ev.taskId)}: <b>${esc(ev.label)}</b></a>`;
            }).join('') : '<span class="chip chip-idle">No evidence yet</span>'}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');

  const results = state.attempts
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(a => {
      const t = cur.tasks.find(x => x.id === a.task_id);
      const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
      const best = bestAttempt(a.task_id, state);
      return `<tr>
        <td><a href="#/task/${encodeURIComponent(a.task_id)}">${esc(t?.title || a.task_id)}</a></td>
        <td>${a.score} / ${a.max_score}</td>
        <td><strong>${pct}%</strong>${best?.id === a.id ? ' <span class="chip chip-marked">best</span>' : ''}</td>
        <td>${fmtDate(a.created_at)}</td>
      </tr>`;
    }).join('');

  render(`
<div class="page-header">
  <div class="container">
    <div class="breadcrumb"><a href="#/">Home</a> › <a href="#/dashboard">Dashboard</a> › Progress</div>
    <h1>My <span class="text-teal">Progress</span></h1>
    <p class="lead">Your evidence against every TASC criterion, plus your full quiz results history.</p>
  </div>
</div>
<section class="section">
  <div class="container">
    <h2>Criterion evidence</h2>
    <p class="unit-counts" style="margin-bottom:1rem;">Evidence = a teacher mark (C/A/t) on a submitted task, or a passed quiz (≥ pass mark) that assesses the criterion.</p>
    ${courseBlocks}
    <h2 style="margin-top:2.5rem;">Quiz results history</h2>
    ${results ? `
    <div class="marking-wrap"><table class="data-table">
      <thead><tr><th>Quiz</th><th>Score</th><th>%</th><th>When</th></tr></thead>
      <tbody>${results}</tbody>
    </table></div>` : '<p>No quiz attempts yet.</p>'}
  </div>
</section>`, { title: 'My Progress' });
}

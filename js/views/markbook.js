/* Teacher markbook: every student × every task in one place.
   Grid (default) or student cards; status colour + rating letters,
   late/overdue markers, filters, sort, chase list and print view. */

import { api } from '../api.js';
import { render, esc, spinner, toast, openModal, fmtDate, fmtDateOnly, localDateStr, avatarHTML, progressBar } from '../ui.js';
import { getCurriculum, taskStatus, criterionLabel, filterCurByProgram } from '../store.js';
import { getScope } from '../scope.js';
import { teacherHeader, scopeBar, wireScopeBar, studentState, openMarkingModal } from './teacher.js';

const UI_KEY = 'levelup-markbook-ui';
const DEFAULT_UI = { view: 'grid', unit: '', show: 'all', sort: 'name', inactive: false };

function loadUi() {
  try { return { ...DEFAULT_UI, ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') }; } catch { return { ...DEFAULT_UI }; }
}
function saveUi(ui) {
  try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch { /* private mode etc. */ }
}

function shortDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

const STATE_LABEL = {
  marked: 'Marked', submitted: 'Submitted — needs marking', overdue: 'Overdue',
  progress: 'In progress', idle: 'Not started',
};
const STATE_CHIP = {
  marked: 'chip-marked', submitted: 'chip-submitted', overdue: 'chip-overdue',
  progress: 'chip-progress', idle: 'chip-idle',
};

/* One student × one task. Quizzes report best %, submission tasks report
   a status plus the ratings/late flag that go with it. */
function computeCell(task, st, today) {
  if (task.type === 'quiz') {
    const attempts = st.attempts.filter(a => a.task_id === task.id);
    if (!attempts.length) return { kind: 'quiz', state: 'idle', pct: null, attempts: 0 };
    const pct = Math.round(Math.max(...attempts.map(a => (a.max_score > 0 ? a.score / a.max_score * 100 : 0))));
    return { kind: 'quiz', state: pct >= (task.pass_pct ?? 80) ? 'marked' : 'progress', pct, attempts: attempts.length };
  }
  const status = taskStatus(task, st);
  const subs = st.submissions.filter(s => s.task_id === task.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const sub = subs[subs.length - 1] || null;
  const marks = st.marks.filter(m => m.task_id === task.id);
  const feedback = st.feedback.find(f => f.task_id === task.id) || null;
  const due = task.due_date || null;
  const late = !!(sub && due && localDateStr(sub.created_at) > due);
  let state;
  if (status === 'marked') state = 'marked';
  else if (status === 'submitted') state = 'submitted';
  else if (due && due < today) state = 'overdue';
  else if (status === 'in_progress') state = 'progress';
  else state = 'idle';
  return { kind: 'task', state, sub, marks, feedback, due, late };
}

function buildRows(cur, data, ui, today) {
  const tasks = cur.tasks.filter(t => t.published !== false && (!ui.unit || t.unit_id === ui.unit));
  const subTasks = tasks.filter(t => t.type === 'submission');
  const quizTasks = tasks.filter(t => t.type === 'quiz');

  const allRows = data.profiles
    .filter(p => ui.inactive || p.active !== false)
    .map(p => {
      const st = studentState(data, p.id);
      const cells = new Map();
      for (const t of tasks) cells.set(t.id, computeCell(t, st, today));
      let done = 0, overdue = 0, toMark = 0;
      for (const t of subTasks) {
        const c = cells.get(t.id);
        if (c.state === 'marked' || c.state === 'submitted') done++;
        if (c.state === 'overdue') overdue++;
        if (c.state === 'submitted') toMark++;
      }
      const pcts = quizTasks.map(t => cells.get(t.id).pct).filter(v => v != null);
      const quizAvg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
      return { p, cells, done, overdue, toMark, total: subTasks.length, quizAvg };
    });

  let rows = allRows;
  if (ui.show === 'overdue') rows = rows.filter(r => r.overdue > 0);
  else if (ui.show === 'tomark') rows = rows.filter(r => r.toMark > 0);

  const byName = (a, b) => a.p.display_name.localeCompare(b.p.display_name);
  rows = [...rows];
  if (ui.sort === 'overdue') rows.sort((a, b) => b.overdue - a.overdue || byName(a, b));
  else if (ui.sort === 'progress') rows.sort((a, b) => (a.total ? a.done / a.total : 0) - (b.total ? b.done / b.total : 0) || byName(a, b));
  else rows.sort(byName);

  return { tasks, subTasks, quizTasks, allRows, rows };
}

/* ---------- rendering ---------- */
function ratingLetters(task, c) {
  return task.criteria.map(cid => {
    const m = c.marks.find(x => x.criterion_id === cid);
    return m ? `<span class="mb-r mb-r-${esc(m.rating)}">${esc(m.rating)}</span>` : '<span class="mb-r mb-r-none">·</span>';
  }).join('');
}

function cellTitle(cur, p, task, c) {
  const bits = [`${p.display_name} · ${task.code} ${task.title}`];
  if (c.kind === 'quiz') {
    bits.push(c.pct == null ? 'No attempts' : `Best ${c.pct}% (${c.attempts} attempt${c.attempts === 1 ? '' : 's'})`);
  } else {
    bits.push(STATE_LABEL[c.state] + (c.late ? ' · submitted late' : ''));
    if (c.due) bits.push('Due ' + shortDate(c.due));
    if (c.marks.length) bits.push(c.marks.map(m => `${criterionLabel(cur, m.criterion_id)}: ${m.rating}`).join(', '));
  }
  return bits.join('\n');
}

function cellContent(task, c) {
  if (c.kind === 'quiz') return c.pct == null ? '—' : `${c.pct}%`;
  const late = c.late ? '<sup class="mb-late" title="Submitted late">⏱</sup>' : '';
  switch (c.state) {
    case 'marked': return ratingLetters(task, c) + late;
    case 'submitted': return '✓' + late;
    case 'overdue': return '!';
    case 'progress': return '…';
    default: return '';
  }
}

function gridHTML(cur, built) {
  const { rows, subTasks, quizTasks } = built;
  if (!rows.length) return '<div class="info-box"><p>No students match these filters.</p></div>';

  const groups = [];
  for (const t of subTasks) {
    const last = groups[groups.length - 1];
    if (last && last.unit === t.unit_id) last.n++;
    else groups.push({ unit: t.unit_id, n: 1 });
  }
  const unitLabel = id => `Unit ${cur.units.find(u => u.id === id)?.number ?? '?'}`;

  const head1 = `<tr>
    <th class="mb-name" rowspan="2">Student</th>
    ${groups.map(g => `<th class="mb-unit" colspan="${g.n}">${esc(unitLabel(g.unit))}</th>`).join('')}
    ${quizTasks.length ? `<th class="mb-unit mb-block-start" colspan="${quizTasks.length}">⚡ Quizzes (best %)</th>` : ''}
  </tr>`;
  const taskTh = (t, extra = '') => `<th class="mb-task ${extra}"><a href="#/teach/tasks/${encodeURIComponent(t.id)}" title="${esc(t.title)}">${esc(t.code)}</a>${t.type === 'submission' && t.due_date ? `<small>${esc(shortDate(t.due_date))}</small>` : ''}</th>`;
  const head2 = `<tr>
    ${subTasks.map(t => taskTh(t)).join('')}
    ${quizTasks.map((t, i) => taskTh(t, i === 0 ? 'mb-block-start' : '')).join('')}
  </tr>`;

  const body = rows.map(r => {
    const sub = `${r.done}/${r.total} done${r.overdue ? ` · <span class="mb-od">${r.overdue} overdue</span>` : ''}${r.toMark ? ` · ${r.toMark} to mark` : ''}`;
    const tds = [...subTasks, ...quizTasks].map((t, i) => {
      const c = r.cells.get(t.id);
      const blockStart = quizTasks.length && t.id === quizTasks[0].id ? ' mb-block-start' : '';
      return `<td class="mb-cell mb-${c.state}${blockStart}" data-s="${esc(r.p.id)}" data-t="${esc(t.id)}" title="${esc(cellTitle(cur, r.p, t, c))}">${cellContent(t, c)}</td>`;
    }).join('');
    return `<tr>
      <td class="mb-name"><a href="#/teach/students/${encodeURIComponent(r.p.id)}">${avatarHTML(r.p, 'avatar--sm')} ${esc(r.p.display_name)}</a>${r.p.active === false ? ' <span class="chip chip-idle">inactive</span>' : ''}<small>${sub}</small></td>
      ${tds}
    </tr>`;
  }).join('');

  return `<div class="mb-wrap"><table class="mb-table"><thead>${head1}${head2}</thead><tbody>${body}</tbody></table></div>`;
}

function cardsHTML(cur, built) {
  const { rows, subTasks } = built;
  if (!rows.length) return '<div class="info-box"><p>No students match these filters.</p></div>';
  return `<div class="mb-cards">${rows.map(r => `
    <div class="card mb-card">
      <h3><a href="#/teach/students/${encodeURIComponent(r.p.id)}">${avatarHTML(r.p, 'avatar--sm')} ${esc(r.p.display_name)}</a>${r.p.active === false ? ' <span class="chip chip-idle">inactive</span>' : ''}</h3>
      ${progressBar(r.total ? r.done / r.total * 100 : 0, { label: `${r.p.display_name} progress` })}
      <div class="mb-card-stats">
        <span>${r.done}/${r.total} done</span>
        ${r.overdue ? `<span class="chip chip-overdue">${r.overdue} overdue</span>` : ''}
        ${r.toMark ? `<span class="chip chip-submitted">${r.toMark} to mark</span>` : ''}
        ${r.quizAvg != null ? `<span class="chip chip-quiz">Quiz avg ${r.quizAvg}%</span>` : ''}
      </div>
      <div class="mb-dots">${subTasks.map(t => {
        const c = r.cells.get(t.id);
        return `<button type="button" class="mb-dot mb-cell mb-${c.state}" data-s="${esc(r.p.id)}" data-t="${esc(t.id)}" title="${esc(cellTitle(cur, r.p, t, c))}">${esc(t.code)}</button>`;
      }).join('')}</div>
    </div>`).join('')}</div>`;
}

function chaseHTML(built, today) {
  const withOd = built.allRows.filter(r => r.overdue > 0).sort((a, b) => b.overdue - a.overdue);
  if (!withOd.length) return '<p>🎉 Nobody has overdue work.</p>';
  return `<ul>${withOd.map(r => {
    const items = built.subTasks.filter(t => r.cells.get(t.id).state === 'overdue')
      .map(t => `${esc(t.code)} ${esc(t.title)} <em>(due ${esc(shortDate(t.due_date))})</em>`);
    return `<li><strong>${esc(r.p.display_name)}</strong> — ${r.overdue} overdue: ${items.join('; ')}</li>`;
  }).join('')}</ul>`;
}

function chaseText(built, today) {
  const withOd = built.allRows.filter(r => r.overdue > 0).sort((a, b) => b.overdue - a.overdue);
  const lines = [`Overdue work as of ${fmtDateOnly(today)}`];
  for (const r of withOd) {
    const items = built.subTasks.filter(t => r.cells.get(t.id).state === 'overdue')
      .map(t => `${t.code} ${t.title} (due ${shortDate(t.due_date)})`);
    lines.push(`${r.p.display_name}: ${items.join('; ')}`);
  }
  return lines.join('\n');
}

/* ---------- detail popover ---------- */
function openDetail(cur, data, sid, taskId, reload, today) {
  const task = cur.tasks.find(t => t.id === taskId);
  const p = data.profiles.find(x => x.id === sid);
  if (!task || !p) return;
  const st = studentState(data, sid);
  const c = computeCell(task, st, today);

  let inner;
  if (c.kind === 'quiz') {
    const atts = st.attempts.filter(a => a.task_id === task.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
    inner = c.pct == null
      ? '<p><em>No attempts yet.</em></p>'
      : `<p>Best score <strong>${c.pct}%</strong> <span class="unit-counts">(pass mark ${task.pass_pct ?? 80}%)</span></p>
         <ul class="activity-list">${atts.map(a => `<li><span>${fmtDate(a.created_at)}</span><span>${a.score}/${a.max_score}</span></li>`).join('')}</ul>`;
  } else {
    const lateTxt = c.sub && c.due
      ? (c.late ? '<span class="chip chip-overdue">Submitted late</span>' : '<span class="chip chip-marked">On time</span>')
      : '';
    inner = `
      <div class="meta-row">
        <span class="chip ${STATE_CHIP[c.state]}">${STATE_LABEL[c.state]}</span>
        ${lateTxt}
        ${c.due ? `<span class="unit-counts">Due ${esc(fmtDateOnly(c.due))}</span>` : ''}
      </div>
      <p class="unit-counts">${c.sub ? `Submitted ${esc(fmtDate(c.sub.created_at))}${c.sub.file_name ? ' · ' + esc(c.sub.file_name) : ''}${c.sub.url ? ' · link' : ''}${c.sub.comment ? ` · “${esc(c.sub.comment)}”` : ''}` : 'No submission yet.'}</p>
      ${c.marks.length ? `<div class="rating-chips">${c.marks.map(m => `<span class="rating-chip rating-${esc(m.rating)}">${esc(criterionLabel(cur, m.criterion_id))}: <b>${esc(m.rating)}</b></span>`).join('')}</div>` : ''}
      ${c.feedback?.feedback ? `<p style="margin-top:0.75rem;"><strong>Feedback:</strong> ${esc(c.feedback.feedback)}</p>` : ''}`;
  }

  const canMark = task.type === 'submission' && (c.sub || c.marks.length);
  const modal = openModal(`
    <h2>${esc(p.display_name)} — ${esc(task.code)}</h2>
    <p class="unit-counts">${esc(task.title)}</p>
    ${inner}
    <div class="quiz-actions" style="margin-top:1.25rem;">
      ${canMark ? '<button class="btn btn-primary" id="mb-mark">✏️ Mark / edit marks</button>' : ''}
      <a class="btn btn-secondary" href="#/teach/tasks/${encodeURIComponent(task.id)}" data-close="1">Task page</a>
      <a class="btn btn-secondary" href="#/teach/students/${encodeURIComponent(p.id)}" data-close="1">Student page</a>
    </div>`);

  // openMarkingModal replaces the modal contents itself, so don't also close() here
  // (the delayed clear from close() would wipe the marking modal).
  modal.el.querySelector('#mb-mark')?.addEventListener('click', () => openMarkingModal(cur, data, sid, task, reload));
}

/* ---------- the page ---------- */
export async function markbookView() {
  render(spinner('Loading markbook…'));
  const scope = getScope();
  const [curAll, data, classesData] = await Promise.all([
    getCurriculum(), api.getClassData(scope.classId || null), api.getClasses(),
  ]);
  const cur = filterCurByProgram(curAll, scope.programId);
  const ui = loadUi();
  const today = localDateStr(new Date().toISOString());
  const nSub = cur.tasks.filter(t => t.published !== false && t.type === 'submission').length;
  const nQuiz = cur.tasks.filter(t => t.published !== false && t.type === 'quiz').length;
  let chaseOpen = false;

  const unitOpts = cur.units.map(u => `<option value="${esc(u.id)}" ${ui.unit === u.id ? 'selected' : ''}>Unit ${u.number}: ${esc(u.title)}</option>`).join('');

  render(`
${teacherHeader('Markbook', `${data.profiles.length} students · ${nSub} tasks · ${nQuiz} quizzes`, scopeBar(classesData))}
<section class="section section--sm">
  <div class="container container--wide">
    <div class="mb-controls" id="mb-controls">
      <div class="meta-row" role="group" aria-label="View">
        <button class="btn btn-sm" data-view="grid">▦ Grid</button>
        <button class="btn btn-sm" data-view="cards">🗂 Cards</button>
      </div>
      <select id="mb-unit" class="scope-select" aria-label="Filter by unit"><option value="">All units</option>${unitOpts}</select>
      <select id="mb-show" class="scope-select" aria-label="Filter students">
        <option value="all" ${ui.show === 'all' ? 'selected' : ''}>Everyone</option>
        <option value="overdue" ${ui.show === 'overdue' ? 'selected' : ''}>Has overdue work</option>
        <option value="tomark" ${ui.show === 'tomark' ? 'selected' : ''}>Has work to mark</option>
      </select>
      <select id="mb-sort" class="scope-select" aria-label="Sort students">
        <option value="name" ${ui.sort === 'name' ? 'selected' : ''}>Sort: name</option>
        <option value="overdue" ${ui.sort === 'overdue' ? 'selected' : ''}>Sort: most overdue</option>
        <option value="progress" ${ui.sort === 'progress' ? 'selected' : ''}>Sort: least progress</option>
      </select>
      <label class="mb-check"><input type="checkbox" id="mb-inactive" ${ui.inactive ? 'checked' : ''}> Include inactive</label>
      <span class="mb-spacer"></span>
      <button class="btn btn-secondary btn-sm" id="mb-chase-btn">📣 Chase list</button>
      <button class="btn btn-secondary btn-sm" id="mb-print">🖨 Print</button>
      <a class="btn btn-secondary btn-sm" href="#/teach/settings">📥 Excel markbook sync</a>
    </div>
    <div class="grid grid-4 stat-grid" id="mb-stats"></div>
    <div class="mb-chase card" id="mb-chase" hidden></div>
    <div class="mb-legend">
      <span class="mb-key"><span class="mb-swatch mb-marked"></span> Marked (ratings shown)</span>
      <span class="mb-key"><span class="mb-swatch mb-submitted"></span> ✓ Submitted — to mark</span>
      <span class="mb-key"><span class="mb-swatch mb-overdue"></span> ! Overdue</span>
      <span class="mb-key"><span class="mb-swatch mb-progress"></span> … In progress / quiz below pass</span>
      <span class="mb-key"><span class="mb-swatch"></span> Not started / not yet due</span>
      <span class="mb-key">⏱ Submitted late</span>
    </div>
    <div class="mb-print-title" id="mb-print-title"></div>
    <div id="mb-content"></div>
  </div>
</section>`, { title: 'Markbook' });
  wireScopeBar();

  const root = document.getElementById('mb-content');
  const reload = () => markbookView();
  let built;

  function paint() {
    built = buildRows(cur, data, ui, today);
    const totals = built.allRows.reduce((a, r) => ({ od: a.od + r.overdue, tm: a.tm + r.toMark, sod: a.sod + (r.overdue ? 1 : 0) }), { od: 0, tm: 0, sod: 0 });
    document.getElementById('mb-stats').innerHTML = `
      <div class="stat-card"><b>${built.allRows.length}</b><span>Students</span></div>
      <div class="stat-card"><b>${totals.tm}</b><span>To mark</span></div>
      <div class="stat-card"><b>${totals.od}</b><span>Overdue items</span></div>
      <div class="stat-card"><b>${totals.sod}</b><span>Students with overdue</span></div>`;
    root.innerHTML = ui.view === 'cards' ? cardsHTML(cur, built) : gridHTML(cur, built);
    document.querySelectorAll('[data-view]').forEach(b => {
      const on = b.dataset.view === ui.view;
      b.classList.toggle('btn-primary', on);
      b.classList.toggle('btn-secondary', !on);
    });
    document.getElementById('mb-print-title').textContent =
      `Game Making & Design — Markbook — ${fmtDateOnly(today)}${ui.unit ? ' — ' + (cur.units.find(u => u.id === ui.unit)?.title || '') : ''}`;
    const chase = document.getElementById('mb-chase');
    chase.hidden = !chaseOpen;
    if (chaseOpen) {
      chase.innerHTML = `<div class="meta-row"><h3 style="margin:0;">📣 Chase list</h3><span class="mb-spacer"></span><button class="btn btn-secondary btn-sm" id="mb-copy">Copy as text</button></div>${chaseHTML(built, today)}`;
      document.getElementById('mb-copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(chaseText(built, today)); toast('Chase list copied.', 'success'); }
        catch { toast('Couldn’t copy automatically — select the list and copy it manually.', 'error'); }
      });
    }
  }

  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { ui.view = b.dataset.view; saveUi(ui); paint(); }));
  document.getElementById('mb-unit').addEventListener('change', e => { ui.unit = e.target.value; saveUi(ui); paint(); });
  document.getElementById('mb-show').addEventListener('change', e => { ui.show = e.target.value; saveUi(ui); paint(); });
  document.getElementById('mb-sort').addEventListener('change', e => { ui.sort = e.target.value; saveUi(ui); paint(); });
  document.getElementById('mb-inactive').addEventListener('change', e => { ui.inactive = e.target.checked; saveUi(ui); paint(); });
  document.getElementById('mb-chase-btn').addEventListener('click', () => { chaseOpen = !chaseOpen; paint(); });
  document.getElementById('mb-print').addEventListener('click', () => window.print());

  root.addEventListener('click', (e) => {
    const cell = e.target.closest('[data-s][data-t]');
    if (!cell) return;
    const { s: sid, t: tid } = cell.dataset;
    const task = cur.tasks.find(t => t.id === tid);
    const c = computeCell(task, studentState(data, sid), today);
    if (task.type === 'submission' && c.state === 'submitted') openMarkingModal(cur, data, sid, task, reload);
    else openDetail(cur, data, sid, tid, reload, today);
  });

  paint();
}

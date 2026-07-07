/* Teacher views: class overview, marking queue, quiz item
   analysis, student management, settings/export, task editor. */

import { api } from '../api.js';
import { IS_DEMO } from '../config.js';
import { render, esc, spinner, badge, courseBadgeClass, statusChip, toast, openModal, closeModal, fmtDate, downloadCSV, progressBar } from '../ui.js';
import { getCurriculum, invalidate, taskStatus, criterionLabel, provisionalAward, coverageMatrix, filterCurByProgram } from '../store.js';
import { getScope, setScope } from '../scope.js';
import { navigate } from '../router.js';

function teacherHeader(title, sub, scopeHtml = '') {
  return `
<div class="page-header page-header--teach">
  <div class="container container--wide">
    <div class="breadcrumb"><a href="#/">Home</a> › <a href="#/teach">Teacher</a> › ${esc(title)}</div>
    <h1>${esc(title)}</h1>
    ${sub ? `<p class="lead">${sub}</p>` : ''}
    <div class="meta-row teach-nav">
      <a class="btn btn-secondary btn-sm" href="#/teach">🏫 Overview</a>
      <a class="btn btn-secondary btn-sm" href="#/teach/marking">📝 Marking</a>
      <a class="btn btn-secondary btn-sm" href="#/matrix">📊 Matrix</a>
      <a class="btn btn-secondary btn-sm" href="#/teach/analysis">📈 Item analysis</a>
      <a class="btn btn-secondary btn-sm" href="#/teach/editor">🛠 Editor</a>
      <a class="btn btn-secondary btn-sm" href="#/teach/students">👥 Students</a>
      <a class="btn btn-secondary btn-sm" href="#/teach/settings">⚙️ Settings</a>
    </div>
    ${scopeHtml}
  </div>
</div>`;
}

/* Program + class filter shown in the teacher header. Only appears once
   the Gen2 classes/programs exist; degrades to nothing otherwise. */
function scopeBar(classesData) {
  if (!classesData || !classesData.classes.length) return '';
  const scope = getScope();
  const programs = classesData.programs.length
    ? classesData.programs
    : [...new Set(classesData.classes.map(c => c.program_id))].map(id => ({ id, title: id }));
  const classesForProg = classesData.classes.filter(c => !scope.programId || c.program_id === scope.programId);
  return `
    <div class="meta-row scope-bar">
      <span class="unit-counts">Viewing:</span>
      <select id="scope-program" class="scope-select" aria-label="Filter by program">
        <option value="">All programs</option>
        ${programs.map(p => `<option value="${esc(p.id)}" ${scope.programId === p.id ? 'selected' : ''}>${esc(p.title || p.id)}</option>`).join('')}
      </select>
      <select id="scope-class" class="scope-select" aria-label="Filter by class">
        <option value="">All classes</option>
        ${classesForProg.map(c => `<option value="${esc(c.id)}" ${scope.classId === c.id ? 'selected' : ''}>${esc(c.name)} (${c.roster.length})</option>`).join('')}
      </select>
    </div>`;
}

function wireScopeBar() {
  const prog = document.getElementById('scope-program');
  const cls = document.getElementById('scope-class');
  if (prog) prog.addEventListener('change', () => { setScope({ programId: prog.value || null, classId: null }); location.reload(); });
  if (cls) cls.addEventListener('change', () => { setScope({ classId: cls.value || null }); location.reload(); });
}

function studentState(data, studentId) {
  return {
    attempts: data.attempts.filter(a => a.student_id === studentId),
    submissions: data.submissions.filter(s => s.student_id === studentId),
    marks: data.marks.filter(m => m.student_id === studentId),
    feedback: data.feedback.filter(f => f.student_id === studentId),
    progress: data.progress.filter(p => p.student_id === studentId),
  };
}

/* ---------- class overview ---------- */
export async function teacherHomeView() {
  render(spinner('Loading class data…'));
  const scope = getScope();
  const [curAll, data, classesData] = await Promise.all([
    getCurriculum(), api.getClassData(scope.classId || null), api.getClasses(),
  ]);
  const cur = filterCurByProgram(curAll, scope.programId);
  const { gaps } = coverageMatrix(cur);

  const queue = unmarkedQueue(cur, data);

  const rows = data.profiles.map(p => {
    const st = studentState(data, p.id);
    const done = cur.tasks.filter(t => ['submitted', 'marked'].includes(taskStatus(t, st))).length;
    const lastActivity = [...st.attempts.map(a => a.created_at), ...st.submissions.map(s => s.created_at)]
      .sort().pop();
    const awards = cur.courses.map(c => {
      const pa = provisionalAward(cur, c.id, st.marks);
      return `<span class="award-chip award-${esc(pa.award)}" title="${esc(c.id)} provisional: ${esc(pa.award)}">${esc(c.id.slice(0, 3))}: ${esc(pa.award)}</span>`;
    }).join(' ');
    return `
    <tr class="${p.active === false ? 'row-inactive' : ''}">
      <td><strong>${esc(p.display_name)}</strong>${p.active === false ? ' <span class="chip chip-idle">inactive</span>' : ''}</td>
      <td>${done} / ${cur.tasks.length} ${progressBar((done / Math.max(1, cur.tasks.length)) * 100, { label: `${p.display_name} progress` })}</td>
      <td>${st.attempts.length}</td>
      <td>${st.submissions.length}</td>
      <td>${awards}</td>
      <td>${lastActivity ? fmtDate(lastActivity) : '<em>never</em>'}</td>
    </tr>`;
  }).join('');

  render(`
${teacherHeader('Class Overview', `${data.profiles.length} students · ${cur.tasks.length} published tasks &amp; quizzes`, scopeBar(classesData))}
<section class="section section--sm">
  <div class="container container--wide">
    <div class="grid grid-4 stat-grid">
      <div class="stat-card"><b data-count="${data.profiles.length}">0</b><span>Students</span></div>
      <div class="stat-card"><b data-count="${queue.length}">0</b><span>To mark</span></div>
      <div class="stat-card"><b data-count="${data.attempts.length}">0</b><span>Quiz attempts</span></div>
      <div class="stat-card"><b data-count="${gaps.length}">0</b><span>Coverage gaps</span></div>
    </div>
    ${gaps.length ? `<div class="warning-box"><p><strong>⚠ ${gaps.length} coverage gap${gaps.length === 1 ? '' : 's'}</strong> — <a href="#/matrix">review the matrix</a>.</p></div>` : ''}
    ${queue.length ? `<div class="cta-panel cta-panel--slim">
      <div><h3>📝 ${queue.length} submission${queue.length === 1 ? '' : 's'} waiting</h3><p>Oldest: ${esc(queue[0].studentName)} — ${esc(queue[0].task.code)} ${esc(queue[0].task.title)}</p></div>
      <a class="btn btn-primary" href="#/teach/marking">Open marking queue →</a>
    </div>` : ''}
    <div class="marking-wrap" style="margin-top:1.5rem;">
      <table class="data-table">
        <thead><tr><th>Student</th><th style="min-width:180px;">Tasks complete</th><th>Quiz attempts</th><th>Submissions</th><th>Provisional awards</th><th>Last activity</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6"><em>No students enrolled yet. Share the join code from Settings.</em></td></tr>'}</tbody>
      </table>
    </div>
    <p class="unit-counts" style="margin-top:0.75rem;">Provisional awards use the best rating per criterion so far. PRJ also requires all six work requirements — check manually before finalising. General Maths (A/B/C) awards are exam-moderated and shown as “—”. Export everything from <a href="#/teach/settings">Settings</a>.</p>
  </div>
</section>`, { title: 'Class Overview' });
  wireScopeBar();
}

/* ---------- marking queue ---------- */
function unmarkedQueue(cur, data) {
  const items = [];
  for (const s of data.submissions) {
    const task = cur.tasks.find(t => t.id === s.task_id);
    const profile = data.profiles.find(p => p.id === s.student_id);
    if (!task || !profile) continue;
    const marked = data.feedback.some(f => f.student_id === s.student_id && f.task_id === s.task_id) ||
      data.marks.some(m => m.student_id === s.student_id && m.task_id === s.task_id);
    // Only queue the latest submission per (student, task)
    const newer = data.submissions.some(o => o.student_id === s.student_id && o.task_id === s.task_id && o.created_at > s.created_at);
    if (!marked && !newer) items.push({ sub: s, task, studentName: profile.display_name, studentId: profile.id });
  }
  return items.sort((a, b) => a.sub.created_at.localeCompare(b.sub.created_at));
}

export async function markingView() {
  render(spinner('Loading marking queue…'));
  const [cur, data] = await Promise.all([getCurriculum(), api.getClassData()]);
  const queue = unmarkedQueue(cur, data);

  const markedList = data.feedback
    .sort((a, b) => b.marked_at.localeCompare(a.marked_at)).slice(0, 12)
    .map(f => {
      const task = cur.tasks.find(t => t.id === f.task_id);
      const p = data.profiles.find(x => x.id === f.student_id);
      const ratings = data.marks.filter(m => m.student_id === f.student_id && m.task_id === f.task_id);
      return `<li>
        <span>✅ <strong>${esc(p?.display_name || '?')}</strong> — ${esc(task?.code || '')} ${esc(task?.title || f.task_id)}</span>
        <span class="rating-chips">${ratings.map(m => `<span class="rating-chip rating-${esc(m.rating)}">${esc(criterionLabel(cur, m.criterion_id))}: <b>${esc(m.rating)}</b></span>`).join('')}</span>
        <button class="btn btn-ghost btn-sm" data-remark="${esc(f.student_id)}|${esc(f.task_id)}">Edit</button>
      </li>`;
    }).join('');

  render(`
${teacherHeader('Marking Queue', queue.length ? `${queue.length} submission${queue.length === 1 ? '' : 's'} waiting for rubric marks.` : 'Queue is clear. 🎉')}
<section class="section section--sm">
  <div class="container container--wide">
    ${queue.length ? `<div class="queue-list">
      ${queue.map((q, i) => `
        <div class="queue-item">
          <div class="queue-main">
            <strong>${esc(q.studentName)}</strong> · ${esc(q.task.code)} ${esc(q.task.title)}
            <div class="task-row-meta">Submitted ${fmtDate(q.sub.created_at)}
              ${q.sub.comment ? ` · “${esc(q.sub.comment)}”` : ''}</div>
          </div>
          <div class="queue-actions">
            ${q.sub.url ? `<a class="btn btn-secondary btn-sm" href="${esc(q.sub.url)}" target="_blank" rel="noopener">🔗 Open link</a>` : ''}
            ${q.sub.file_path ? `<button class="btn btn-secondary btn-sm" data-file="${esc(q.sub.file_path)}">📄 ${esc(q.sub.file_name || 'File')}</button>`
              : (q.sub.file_name ? `<span class="chip chip-idle">📄 ${esc(q.sub.file_name)} (demo)</span>` : '')}
            <button class="btn btn-primary btn-sm" data-mark="${i}">Mark →</button>
          </div>
        </div>`).join('')}
    </div>` : '<div class="info-box info-box--ok"><p>Nothing to mark right now. Auto-marked quizzes never appear here — that\'s the point. 🏖</p></div>'}
    <h2 style="margin-top:2.5rem;">Recently marked</h2>
    ${markedList ? `<ul class="activity-list">${markedList}</ul>` : '<p>No marked work yet.</p>'}
  </div>
</section>`, { title: 'Marking Queue' });

  document.querySelectorAll('[data-file]').forEach(b => b.addEventListener('click', async () => {
    try {
      const url = await api.getFileUrl(b.dataset.file);
      if (url) window.open(url, '_blank', 'noopener');
      else toast('Demo mode: uploaded files are not stored.', 'info');
    } catch (err) { toast(err.message, 'error'); }
  }));
  document.querySelectorAll('[data-mark]').forEach(b => b.addEventListener('click', () => {
    const q = queue[parseInt(b.dataset.mark, 10)];
    openMarkingModal(cur, data, q.studentId, q.task);
  }));
  document.querySelectorAll('[data-remark]').forEach(b => b.addEventListener('click', () => {
    const [studentId, taskId] = b.dataset.remark.split('|');
    const task = cur.tasks.find(t => t.id === taskId);
    openMarkingModal(cur, data, studentId, task);
  }));
}

function openMarkingModal(cur, data, studentId, task) {
  const profile = data.profiles.find(p => p.id === studentId);
  const existing = Object.fromEntries(
    data.marks.filter(m => m.student_id === studentId && m.task_id === task.id).map(m => [m.criterion_id, m.rating]));
  const existingFb = data.feedback.find(f => f.student_id === studentId && f.task_id === task.id)?.feedback || '';

  const rubricRows = task.criteria.map(cid => {
    const isICT = cid.startsWith('ICT');
    const guide = (task.body?.marking || []).find(m => m.criterion === cid);
    const options = isICT ? ['A', 'C', 't', 'z'] : ['C', 't', 'z'];
    return `
    <div class="rubric-row" data-crit="${esc(cid)}">
      <div class="rubric-crit">
        <strong>${esc(criterionLabel(cur, cid))}</strong>
        ${guide?.c ? `<p class="rubric-desc"><b>C:</b> ${esc(guide.c)}</p>` : ''}
        ${guide?.a ? `<p class="rubric-desc"><b>A:</b> ${esc(guide.a)}</p>` : ''}
      </div>
      <div class="rubric-btns" role="radiogroup" aria-label="Rating for ${esc(cid)}">
        ${options.map(r => `<button type="button" class="rate-btn rate-${r} ${existing[cid] === r ? 'selected' : ''}" data-rating="${r}">${r}</button>`).join('')}
        <button type="button" class="rate-btn rate-clear ${!existing[cid] ? 'selected' : ''}" data-rating="">—</button>
      </div>
    </div>`;
  }).join('');

  const modal = openModal(`
    <h2>Mark: ${esc(profile?.display_name || '?')} — ${esc(task.code)}</h2>
    <p class="unit-counts">${esc(task.title)} · Ratings: A = high standard (ICT only), C = satisfactory, t = below standard, z = no evidence.</p>
    <div class="rubric">${rubricRows}</div>
    <label class="field"><span>Feedback for the student</span>
      <textarea id="mark-feedback" rows="4" placeholder="What worked, and one specific way to level up…">${esc(existingFb)}</textarea>
    </label>
    <div class="quiz-actions">
      <button class="btn btn-primary" id="save-marks">💾 Save marks</button>
      <button class="btn btn-ghost" data-close="1">Cancel</button>
    </div>`);

  modal.el.querySelectorAll('.rubric-btns').forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.rate-btn');
      if (!btn) return;
      group.querySelectorAll('.rate-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  modal.el.querySelector('#save-marks').addEventListener('click', async () => {
    const ratings = {};
    modal.el.querySelectorAll('.rubric-row').forEach(row => {
      const sel = row.querySelector('.rate-btn.selected');
      ratings[row.dataset.crit] = sel?.dataset.rating || '';
    });
    const fb = modal.el.querySelector('#mark-feedback').value.trim();
    try {
      await api.saveMarks(studentId, task.id, ratings, fb);
      invalidate({ state: true });
      toast(`Saved marks for ${profile?.display_name}.`, 'success');
      modal.close();
      markingView();
    } catch (err) { toast(err.message, 'error'); }
  });
}

/* ---------- quiz item analysis ---------- */
export async function analysisView() {
  render(spinner('Crunching quiz data…'));
  const [cur, data] = await Promise.all([getCurriculum(), api.getClassData()]);
  const quizzes = cur.tasks.filter(t => t.type === 'quiz');

  const blocks = quizzes.map(quiz => {
    const attempts = data.attempts.filter(a => a.task_id === quiz.id);
    if (!attempts.length) {
      return `<div class="card" style="margin-bottom:1.5rem;">
        <h3>⚡ ${esc(quiz.code)} ${esc(quiz.title)}</h3><p><em>No attempts yet.</em></p></div>`;
    }
    const avg = attempts.reduce((s, a) => s + (a.max_score > 0 ? a.score / a.max_score : 0), 0) / attempts.length;
    const qStats = quiz.questions.map(q => {
      let n = 0, fracSum = 0;
      for (const a of attempts) {
        const d = (a.responses || []).find(r => r.question_id === q.id);
        if (d) { n++; fracSum += d.points > 0 ? d.awarded / d.points : 0; }
      }
      const pct = n ? Math.round((fracSum / n) * 100) : null;
      return { q, n, pct };
    });
    return `
    <div class="card" style="margin-bottom:1.5rem;">
      <div class="analysis-head">
        <h3>⚡ ${esc(quiz.code)} ${esc(quiz.title)}</h3>
        <span>${attempts.length} attempt${attempts.length === 1 ? '' : 's'} · class average <strong>${Math.round(avg * 100)}%</strong></span>
      </div>
      <div class="marking-wrap"><table class="data-table">
        <thead><tr><th>#</th><th>Question</th><th>Type</th><th>Answered</th><th>Avg correct</th><th></th></tr></thead>
        <tbody>
          ${qStats.map(({ q, n, pct }, i) => `
            <tr>
              <td>Q${i + 1}</td>
              <td>${esc(q.prompt.length > 90 ? q.prompt.slice(0, 90) + '…' : q.prompt)}</td>
              <td><span class="chip chip-idle">${esc(q.qtype)}</span></td>
              <td>${n}</td>
              <td>${pct === null ? '—' : pct + '%'}</td>
              <td>${pct !== null && pct < 50 ? '<span class="chip chip-submitted">⚠ reteach</span>' : ''}</td>
            </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  }).join('');

  render(`
${teacherHeader('Quiz Item Analysis', 'Which questions the class gets wrong — your reteaching radar.')}
<section class="section section--sm">
  <div class="container container--wide">
    ${blocks || '<p>No quizzes defined.</p>'}
  </div>
</section>`, { title: 'Item Analysis' });
}

/* ---------- students ---------- */
export async function studentsView() {
  render(spinner());
  const students = await api.listStudents();
  render(`
${teacherHeader('Students', `${students.length} enrolled. Deactivating blocks sign-in and hides the student from the class overview.`)}
<section class="section section--sm">
  <div class="container">
    <div class="marking-wrap"><table class="data-table">
      <thead><tr><th>Name</th><th>Email</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${students.map(s => `
          <tr class="${s.active === false ? 'row-inactive' : ''}">
            <td><strong>${esc(s.display_name)}</strong></td>
            <td>${esc(s.email || '—')}</td>
            <td>${s.active === false ? '<span class="chip chip-idle">Inactive</span>' : '<span class="chip chip-marked">Active</span>'}</td>
            <td><button class="btn btn-secondary btn-sm" data-toggle="${esc(s.id)}" data-active="${s.active !== false}">
              ${s.active === false ? 'Reactivate' : 'Deactivate'}</button></td>
          </tr>`).join('') || '<tr><td colspan="4"><em>No students yet — share the join code from Settings.</em></td></tr>'}
      </tbody>
    </table></div>
    <p class="unit-counts" style="margin-top:0.75rem;">Password resets: in live mode use Supabase Dashboard → Authentication → Users → “Send password recovery”. Student emails are only visible to you.</p>
  </div>
</section>`, { title: 'Students' });

  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', async () => {
    try {
      await api.setStudentActive(b.dataset.toggle, b.dataset.active !== 'true');
      toast('Updated.', 'success');
      studentsView();
    } catch (err) { toast(err.message, 'error'); }
  }));
}

/* ---------- settings + export ---------- */
export async function settingsView() {
  render(spinner());
  const scope = getScope();
  const [curAll, data, settings, classesData] = await Promise.all([
    getCurriculum(), api.getClassData(scope.classId || null), api.getSettings(), api.getClasses(),
  ]);
  const cur = filterCurByProgram(curAll, scope.programId);

  render(`
${teacherHeader('Settings & Export', 'CSV exports respect the program/class filter below.', scopeBar(classesData))}
<section class="section section--sm">
  <div class="container">
    <div class="grid grid-2" style="align-items:start;">
      <div class="card">
        <h3>🎟 Class enrolment</h3>
        <form id="settings-form">
          <label class="field"><span>Join code (students need this to sign up)</span>
            <input type="text" name="join_code" value="${esc(settings.join_code || '')}" required>
          </label>
          <label class="field"><span>Teacher email (auto-promoted to teacher at signup)</span>
            <input type="email" name="teacher_email" value="${esc(settings.teacher_email || '')}">
          </label>
          <button class="btn btn-primary" type="submit">Save settings</button>
        </form>
      </div>
      <div class="card">
        <h3>📦 Curriculum</h3>
        <p>Push the bundled curriculum (courses, criteria, elements, units, ${cur.tasks.length}+ tasks &amp; quizzes) into the ${IS_DEMO ? 'demo store' : 'database'}. Safe to re-run — existing rows are updated, and your students' work is untouched.</p>
        <button class="btn btn-secondary" id="import-btn">⬆ Import / update curriculum</button>
        <p id="import-status" class="unit-counts" style="margin-top:0.5rem;"></p>
        ${IS_DEMO ? `<hr style="border-color:var(--border); margin:1rem 0;">
        <p>Demo data got messy? Reset everything back to the sample state.</p>
        <button class="btn btn-secondary" id="reset-demo">↻ Reset demo data</button>` : ''}
      </div>
    </div>
    <div class="card" style="margin-top:1.5rem;">
      <h3>📤 CSV export (for your markbook)</h3>
      <div class="meta-row">
        <button class="btn btn-primary" id="csv-results">Results by student &amp; task</button>
        <button class="btn btn-secondary" id="csv-marks">Criterion marks (long format)</button>
        <button class="btn btn-secondary" id="csv-quiz">Quiz attempts</button>
      </div>
    </div>
  </div>
</section>`, { title: 'Settings' });

  wireScopeBar();

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await api.saveSettings({ join_code: f.join_code.value.trim(), teacher_email: f.teacher_email.value.trim() || null });
      toast('Settings saved.', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('import-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('import-status');
    try {
      await api.importCurriculum((msg) => { statusEl.textContent = msg; });
      invalidate({ curriculum: true });
      statusEl.textContent = '✅ Curriculum imported.';
      toast('Curriculum imported.', 'success');
    } catch (err) {
      statusEl.textContent = '❌ ' + err.message;
      toast(err.message, 'error');
    }
  });

  document.getElementById('reset-demo')?.addEventListener('click', () => {
    if (!confirm('Reset ALL demo data (accounts, submissions, marks) back to the sample state?')) return;
    api.resetDemo();
    invalidate({ curriculum: true, state: true });
    toast('Demo data reset.', 'success');
    navigate('/');
  });

  const studentName = id => data.profiles.find(p => p.id === id)?.display_name || id;

  document.getElementById('csv-results').addEventListener('click', () => {
    const rows = [['Student', 'Task code', 'Task title', 'Type', 'Status', 'Best quiz %', 'Ratings', 'Feedback']];
    for (const p of data.profiles) {
      const st = studentState(data, p.id);
      for (const t of cur.tasks) {
        const status = taskStatus(t, st);
        let bestPct = '';
        if (t.type === 'quiz') {
          const atts = st.attempts.filter(a => a.task_id === t.id);
          if (atts.length) bestPct = Math.round(Math.max(...atts.map(a => a.max_score > 0 ? a.score / a.max_score * 100 : 0)));
        }
        const ratings = st.marks.filter(m => m.task_id === t.id)
          .map(m => `${criterionLabel(cur, m.criterion_id)}=${m.rating}`).join('; ');
        const fb = st.feedback.find(f => f.task_id === t.id)?.feedback || '';
        rows.push([p.display_name, t.code, t.title, t.type, status, bestPct, ratings, fb]);
      }
    }
    downloadCSV('levelup-results.csv', rows);
  });

  document.getElementById('csv-marks').addEventListener('click', () => {
    const rows = [['Student', 'Course', 'Criterion', 'Task', 'Rating']];
    for (const m of data.marks) {
      const course = cur.criteria.find(c => c.id === m.criterion_id)?.course_id || '';
      rows.push([studentName(m.student_id), course, m.criterion_id, m.task_id, m.rating]);
    }
    downloadCSV('levelup-criterion-marks.csv', rows);
  });

  document.getElementById('csv-quiz').addEventListener('click', () => {
    const rows = [['Student', 'Quiz', 'Score', 'Max', 'Percent', 'When']];
    for (const a of data.attempts) {
      const t = cur.tasks.find(x => x.id === a.task_id);
      rows.push([studentName(a.student_id), t?.title || a.task_id, a.score, a.max_score,
        a.max_score > 0 ? Math.round(a.score / a.max_score * 100) : 0, a.created_at]);
    }
    downloadCSV('levelup-quiz-attempts.csv', rows);
  });
}

/* ---------- task & quiz editor ---------- */
export async function editorListView() {
  render(spinner());
  const cur = await getCurriculum(true);
  const { gaps } = coverageMatrix(cur);

  const rows = cur.units.map(u => {
    const tasks = cur.tasks.filter(t => t.unit_id === u.id);
    return `
    <h3 class="editor-unit-head">Unit ${u.number}: ${esc(u.title)}</h3>
    <div class="task-rows">
      ${tasks.map(t => `
      <div class="task-row task-row--editor">
        <div class="task-row-num">${t.type === 'quiz' ? '⚡' : esc(t.code)}</div>
        <div class="task-row-main">
          <h3>${esc(t.title)}</h3>
          <div class="task-row-badges">${t.criteria.map(c => badge(criterionLabel(cur, c), courseBadgeClass(c))).join(' ')}</div>
        </div>
        <div class="task-row-side">
          ${t.published === false ? '<span class="chip chip-idle">Hidden</span>' : '<span class="chip chip-marked">Published</span>'}
          <a class="btn btn-secondary btn-sm" href="#/teach/editor/${encodeURIComponent(t.id)}">✏️ Edit</a>
        </div>
      </div>`).join('')}
    </div>`;
  }).join('');

  render(`
${teacherHeader('Task & Quiz Editor', 'Create, edit, hide or delete tasks. The coverage matrix updates automatically.')}
<section class="section section--sm">
  <div class="container container--wide">
    ${gaps.length ? `<div class="warning-box"><p><strong>⚠ ${gaps.length} coverage gap${gaps.length === 1 ? '' : 's'}:</strong> ${gaps.map(g => esc(g.id)).join(', ')} — <a href="#/matrix">details</a>.</p></div>` : ''}
    <div class="meta-row" style="margin-bottom:1.5rem;">
      <a class="btn btn-primary" href="#/teach/editor/new-task">＋ New submission task</a>
      <a class="btn btn-primary" href="#/teach/editor/new-quiz">＋ New quiz</a>
    </div>
    ${rows}
  </div>
</section>`, { title: 'Editor' });
}

/* --- question text-format helpers (teacher-friendly editing) --- */
function questionToText(q, answer) {
  switch (q.qtype) {
    case 'mc':
    case 'multi': {
      const correct = q.qtype === 'mc' ? [answer?.correct] : (answer?.correct || []);
      return q.options.choices.map((c, i) => (correct.includes(i) ? '*' : '') + c).join('\n');
    }
    case 'match':
      return q.options.left.map((l, i) => `${l} = ${q.options.right[answer?.correct?.[i] ?? i] ?? ''}`).join('\n');
    case 'order':
      return (answer?.correct || q.options.items.map((_, i) => i)).map(i => q.options.items[i]).join('\n');
    case 'numeric':
      return `${answer?.value ?? ''}${answer?.tolerance ? ' ± ' + answer.tolerance : ''}${q.options.unit ? ' [' + q.options.unit + ']' : ''}`;
    case 'short':
      return (answer?.accept || []).join('\n');
    default: return '';
  }
}

function textToQuestion(qtype, text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  switch (qtype) {
    case 'mc': {
      const choices = lines.map(l => l.replace(/^\*/, ''));
      const correct = lines.findIndex(l => l.startsWith('*'));
      if (correct < 0) throw new Error('Multiple choice: mark the correct line with a leading *');
      return { options: { choices }, answer: { correct } };
    }
    case 'multi': {
      const choices = lines.map(l => l.replace(/^\*/, ''));
      const correct = lines.map((l, i) => l.startsWith('*') ? i : -1).filter(i => i >= 0);
      if (!correct.length) throw new Error('Multi-select: mark correct lines with a leading *');
      return { options: { choices }, answer: { correct } };
    }
    case 'match': {
      const pairs = lines.map(l => l.split('=').map(s => s.trim()));
      if (pairs.some(p => p.length !== 2 || !p[0] || !p[1])) throw new Error('Matching: one "left = right" pair per line');
      return {
        options: { left: pairs.map(p => p[0]), right: pairs.map(p => p[1]) },
        answer: { correct: pairs.map((_, i) => i) },
      };
    }
    case 'order': {
      if (lines.length < 2) throw new Error('Ordering: at least two lines, in the CORRECT order');
      return { options: { items: lines }, answer: { correct: lines.map((_, i) => i) } };
    }
    case 'numeric': {
      const m = text.match(/^\s*(-?[\d.]+)\s*(?:±\s*([\d.]+))?\s*(?:\[(.+)\])?\s*$/);
      if (!m) throw new Error('Numeric: format is "42" or "42 ± 0.5" or "42 ± 0.5 [unit]"');
      return {
        options: m[3] ? { unit: m[3] } : {},
        answer: { value: parseFloat(m[1]), tolerance: m[2] ? parseFloat(m[2]) : 0 },
      };
    }
    case 'short': {
      if (!lines.length) throw new Error('Short answer: one accepted answer per line');
      return { options: {}, answer: { accept: lines } };
    }
    default: throw new Error('Unknown question type');
  }
}

const Q_HELP = {
  mc: 'One choice per line. Put * in front of the ONE correct choice.',
  multi: 'One choice per line. Put * in front of EVERY correct choice.',
  match: 'One pair per line: left item = right item. (Right side is shuffled for students.)',
  order: 'One item per line, in the CORRECT order. (Shuffled for students.)',
  numeric: 'The answer, e.g. "42" or "44.1 ± 0.1 [kHz]".',
  short: 'One accepted answer per line (case-insensitive).',
};

export async function editorView({ id }) {
  render(spinner());
  const cur = await getCurriculum(true);
  const isNew = id === 'new-task' || id === 'new-quiz';
  const type = id === 'new-quiz' ? 'quiz' : id === 'new-task' ? 'submission' : null;
  let task = isNew
    ? { id: '', unit_id: 'u1', code: '', title: '', type, overview: '', body: { sections: [], checklist: [], marking: [] }, tools: '', est_time: '', weeks: '', published: true, sort: 99, pass_pct: 80, max_attempts: null, criteria: [], elements: [], questions: [] }
    : cur.tasks.find(t => t.id === id);
  if (!task) { render('<section class="section"><div class="container"><h1>Task not found</h1></div></section>'); return; }
  const isQuiz = task.type === 'quiz';

  let answers = {};
  if (isQuiz && !isNew) {
    try { answers = await api.getTaskAnswers(task.id); } catch { answers = {}; }
  }

  const critChecks = cur.courses.map(course => `
    <div class="crit-group">
      <strong>${esc(course.id)}</strong>
      ${cur.criteria.filter(c => c.course_id === course.id).map(c => `
        <label class="crit-check"><input type="checkbox" data-crit="${esc(c.id)}" ${task.criteria.includes(c.id) ? 'checked' : ''}>
          <span>C${c.number} — ${esc(c.title)}</span></label>`).join('')}
    </div>`).join('');

  const elChecks = cur.criteria.map(c => {
    const els = cur.elements.filter(e => e.criterion_id === c.id);
    return `
    <div class="el-group" data-elgroup="${esc(c.id)}" ${task.criteria.includes(c.id) ? '' : 'hidden'}>
      <strong>${esc(c.id)}</strong>
      ${els.map(e => `
        <label class="crit-check"><input type="checkbox" data-el="${esc(e.id)}" ${task.elements.includes(e.id) ? 'checked' : ''}>
          <span>${esc(e.id.split('-').pop())} (${e.standard}) — ${esc(e.text)}</span></label>`).join('')}
    </div>`;
  }).join('');

  const sectionsHtml = (task.body?.sections || []).map((s, i) => sectionEditor(s, i)).join('');
  const questionsHtml = isQuiz ? task.questions.map((q, i) => questionEditor(q, i, answers[q.id])).join('') : '';

  render(`
${teacherHeader(isNew ? (isQuiz ? 'New Quiz' : 'New Task') : `Edit ${task.code}`)}
<section class="section section--sm">
  <div class="container">
    <form id="editor-form" class="editor-form">
      <div class="grid grid-2">
        <label class="field"><span>ID (unique, e.g. T1.4 or Q3.3) ${isNew ? '' : '— locked'}</span>
          <input name="id" value="${esc(task.id)}" ${isNew ? 'required' : 'readonly'}></label>
        <label class="field"><span>Code shown to students (e.g. 1.4)</span>
          <input name="code" value="${esc(task.code)}" required></label>
        <label class="field"><span>Title</span>
          <input name="title" value="${esc(task.title)}" required></label>
        <label class="field"><span>Unit</span>
          <select name="unit_id">${cur.units.map(u => `<option value="${esc(u.id)}" ${task.unit_id === u.id ? 'selected' : ''}>Unit ${u.number}: ${esc(u.title)}</option>`).join('')}</select></label>
        <label class="field"><span>Estimated time</span><input name="est_time" value="${esc(task.est_time || '')}"></label>
        <label class="field"><span>Tools</span><input name="tools" value="${esc(task.tools || '')}"></label>
        <label class="field"><span>Weeks</span><input name="weeks" value="${esc(task.weeks || '')}"></label>
        <label class="field"><span>Sort order (lower = earlier)</span><input type="number" name="sort" value="${task.sort ?? 99}"></label>
        ${isQuiz ? `
        <label class="field"><span>Pass mark %</span><input type="number" name="pass_pct" min="0" max="100" value="${task.pass_pct ?? 80}"></label>
        <label class="field"><span>Max attempts (blank = unlimited)</span><input type="number" name="max_attempts" min="1" value="${task.max_attempts ?? ''}"></label>` : ''}
      </div>
      <label class="field"><span>Overview</span><textarea name="overview" rows="3">${esc(task.overview || '')}</textarea></label>
      <label class="crit-check" style="margin:0.5rem 0 1.5rem;"><input type="checkbox" name="published" ${task.published !== false ? 'checked' : ''}><span><strong>Published</strong> (visible to students)</span></label>

      <h3>Assessment mapping</h3>
      <p class="unit-counts">Tick every criterion this task assesses, then the specific standard elements. The coverage matrix recalculates automatically.</p>
      <div class="crit-checks">${critChecks}</div>
      <div class="el-checks">${elChecks}</div>

      ${!isQuiz ? `
      <h3 style="margin-top:2rem;">Instructions</h3>
      <div id="sections">${sectionsHtml}</div>
      <button type="button" class="btn btn-secondary btn-sm" id="add-section">＋ Add section</button>
      <label class="field" style="margin-top:1.5rem;"><span>Submission checklist (one item per line)</span>
        <textarea name="checklist" rows="5">${esc((task.body?.checklist || []).join('\n'))}</textarea></label>
      <h3 style="margin-top:1.5rem;">Marking guide</h3>
      <p class="unit-counts">For each ticked criterion, describe the C (and A, for ICT) standard.</p>
      <div id="marking-rows"></div>` : `
      <h3 style="margin-top:2rem;">Questions</h3>
      <div id="questions">${questionsHtml}</div>
      <div class="meta-row">
        <select id="new-q-type">
          <option value="mc">Multiple choice</option><option value="multi">Multi-select</option>
          <option value="match">Matching</option><option value="order">Ordering</option>
          <option value="numeric">Numeric</option><option value="short">Short answer</option>
        </select>
        <button type="button" class="btn btn-secondary btn-sm" id="add-question">＋ Add question</button>
      </div>`}

      <p class="form-error" id="editor-error" role="alert" hidden></p>
      <div class="quiz-actions" style="margin-top:2rem;">
        <button class="btn btn-primary btn-lg" type="submit">💾 Save ${isQuiz ? 'quiz' : 'task'}</button>
        <a class="btn btn-ghost" href="#/teach/editor">Cancel</a>
        ${!isNew ? `<button type="button" class="btn btn-danger" id="delete-task">🗑 Delete</button>` : ''}
      </div>
    </form>
  </div>
</section>`, { title: 'Editor' });

  const form = document.getElementById('editor-form');
  const errEl = document.getElementById('editor-error');

  // criteria ↔ element group visibility + marking rows
  const refreshDependent = () => {
    const selected = [...form.querySelectorAll('[data-crit]:checked')].map(x => x.dataset.crit);
    form.querySelectorAll('[data-elgroup]').forEach(g => { g.hidden = !selected.includes(g.dataset.elgroup); });
    const markingWrap = document.getElementById('marking-rows');
    if (markingWrap) {
      const existing = {};
      markingWrap.querySelectorAll('[data-markrow]').forEach(r => {
        existing[r.dataset.markrow] = {
          c: r.querySelector('[data-mc]').value,
          a: r.querySelector('[data-ma]')?.value ?? '',
        };
      });
      const base = Object.fromEntries((task.body?.marking || []).map(m => [m.criterion, m]));
      markingWrap.innerHTML = selected.map(cid => {
        const prev = existing[cid] || base[cid] || {};
        return `
        <div class="mark-editor" data-markrow="${esc(cid)}">
          <strong>${esc(criterionLabel(cur, cid))}</strong>
          <label class="field"><span>C — Satisfactory descriptor</span><textarea data-mc rows="2">${esc(prev.c || '')}</textarea></label>
          ${cid.startsWith('ICT') ? `<label class="field"><span>A — High Standard descriptor</span><textarea data-ma rows="2">${esc(prev.a || '')}</textarea></label>` : ''}
        </div>`;
      }).join('');
    }
  };
  form.querySelectorAll('[data-crit]').forEach(cb => cb.addEventListener('change', refreshDependent));
  refreshDependent();

  document.getElementById('add-section')?.addEventListener('click', () => {
    document.getElementById('sections').insertAdjacentHTML('beforeend', sectionEditor({ title: '', html: '' }, Date.now()));
  });
  document.getElementById('add-question')?.addEventListener('click', () => {
    const qtype = document.getElementById('new-q-type').value;
    const q = { id: `${form.id.value || task.id || 'Q'}-${Date.now() % 100000}`, ord: 99, qtype, prompt: '', points: qtype === 'mc' || qtype === 'numeric' || qtype === 'short' ? 1 : 2, explain: '', options: { choices: [], left: [], right: [], items: [] } };
    document.getElementById('questions').insertAdjacentHTML('beforeend', questionEditor(q, Date.now(), null));
  });
  form.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) { e.preventDefault(); rm.closest('.section-editor, .q-editor').remove(); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    try {
      const def = {
        id: form.id.value.trim(),
        code: form.code.value.trim(),
        title: form.title.value.trim(),
        unit_id: form.unit_id.value,
        type: task.type,
        overview: form.overview.value.trim(),
        tools: form.tools.value.trim(),
        est_time: form.est_time.value.trim(),
        weeks: form.weeks.value.trim(),
        sort: parseInt(form.sort.value, 10) || 99,
        published: form.published.checked,
        pass_pct: isQuiz ? (parseInt(form.pass_pct.value, 10) || 80) : 80,
        max_attempts: isQuiz ? (form.max_attempts.value ? parseInt(form.max_attempts.value, 10) : null) : null,
        submit_kinds: task.submit_kinds || ['file', 'url'],
        criteria: [...form.querySelectorAll('[data-crit]:checked')].map(x => x.dataset.crit),
        elements: [...form.querySelectorAll('[data-el]:checked')]
          .filter(x => !x.closest('[data-elgroup]').hidden)
          .map(x => x.dataset.el),
        body: { sections: [], checklist: [], marking: [] },
        questions: [],
      };
      if (!def.id) throw new Error('ID is required.');
      if (!def.criteria.length) throw new Error('Tick at least one criterion — every task must declare what it assesses.');

      if (!isQuiz) {
        document.querySelectorAll('.section-editor').forEach(sec => {
          const title = sec.querySelector('[data-sec-title]').value.trim();
          const html = sec.querySelector('[data-sec-html]').value.trim();
          if (title || html) def.body.sections.push({ title, html });
        });
        def.body.checklist = form.checklist.value.split('\n').map(l => l.trim()).filter(Boolean);
        document.querySelectorAll('[data-markrow]').forEach(r => {
          const c = r.querySelector('[data-mc]').value.trim();
          const a = r.querySelector('[data-ma]')?.value.trim() || null;
          if (c || a) def.body.marking.push({ criterion: r.dataset.markrow, c, a: a || null });
        });
      } else {
        let ord = 1;
        for (const qe of document.querySelectorAll('.q-editor')) {
          const qtype = qe.dataset.qtype;
          const prompt = qe.querySelector('[data-q-prompt]').value.trim();
          if (!prompt) throw new Error('Every question needs a prompt (or remove the empty one).');
          const parsed = textToQuestion(qtype, qe.querySelector('[data-q-body]').value);
          def.questions.push({
            id: qe.dataset.qid,
            ord: ord++,
            qtype,
            prompt,
            points: parseFloat(qe.querySelector('[data-q-points]').value) || 1,
            explain: qe.querySelector('[data-q-explain]').value.trim() || null,
            options: parsed.options,
            answer: parsed.answer,
          });
        }
        if (!def.questions.length) throw new Error('A quiz needs at least one question.');
      }

      await api.saveTask(def);
      invalidate({ curriculum: true, state: true });
      toast('Saved. Coverage matrix updated.', 'success');
      navigate('/teach/editor');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
      errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  document.getElementById('delete-task')?.addEventListener('click', async () => {
    if (!confirm(`Delete ${task.code} "${task.title}" and all related student work? This cannot be undone.`)) return;
    try {
      await api.deleteTask(task.id);
      invalidate({ curriculum: true, state: true });
      toast('Deleted.', 'success');
      navigate('/teach/editor');
    } catch (err) { toast(err.message, 'error'); }
  });
}

function sectionEditor(s, key) {
  return `
  <div class="section-editor" data-key="${key}">
    <div class="section-editor-head">
      <input data-sec-title placeholder="Section title (e.g. Part A — …)" value="${esc(s.title || '')}">
      <button class="btn btn-ghost btn-sm" data-remove title="Remove section">✕</button>
    </div>
    <textarea data-sec-html rows="6" placeholder="Section content — HTML allowed (<p>, <ol>, <ul>, <strong>, <code>, <pre>)">${esc(s.html || '')}</textarea>
  </div>`;
}

function questionEditor(q, key, answer) {
  return `
  <div class="q-editor" data-key="${key}" data-qid="${esc(q.id)}" data-qtype="${esc(q.qtype)}">
    <div class="q-editor-head">
      <span class="chip chip-quiz">${esc(q.qtype)}</span>
      <input type="number" data-q-points value="${q.points ?? 1}" min="0.5" step="0.5" title="Points" style="width:70px;"> pts
      <button class="btn btn-ghost btn-sm" data-remove title="Remove question">✕</button>
    </div>
    <label class="field"><span>Prompt</span><input data-q-prompt value="${esc(q.prompt || '')}"></label>
    <label class="field"><span>${esc(Q_HELP[q.qtype])}</span>
      <textarea data-q-body rows="4">${esc(questionToText(q, answer))}</textarea></label>
    <label class="field"><span>Explanation shown after answering (optional)</span>
      <input data-q-explain value="${esc(q.explain || '')}"></label>
  </div>`;
}

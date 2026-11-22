/* Task detail: instructions, checklist, marking guide, plus the
   interactive parts — quiz player (auto-marked, instant feedback)
   or file/URL submission with history and teacher feedback. */

import { api } from '../api.js';
import { render, esc, spinner, statusChip, badge, courseBadgeClass, toast, confetti, fmtDate } from '../ui.js';
import { getCurriculum, getMyState, invalidate, taskStatus, criterionLabel, bestAttempt, isUnmarkedTask } from '../store.js';
import { formDef, formProgress, formMax, formPanelHTML, blankCardHTML, collectCard, cardIsBlank } from '../forms.js';
import { navigate } from '../router.js';

function shuffled(indexes) {
  const a = [...indexes];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- quiz question rendering ---------- */
function questionHTML(q, idx) {
  const head = `
    <div class="q-head">
      <span class="q-num">Q${idx + 1}</span>
      <p class="q-prompt">${esc(q.prompt)}</p>
      <span class="q-points">${q.points} pt${q.points === 1 ? '' : 's'}</span>
    </div>`;
  let body = '';
  switch (q.qtype) {
    case 'mc':
      body = q.options.choices.map((c, i) => `
        <label class="q-choice"><input type="radio" name="${esc(q.id)}" value="${i}"><span>${esc(c)}</span></label>`).join('');
      break;
    case 'multi':
      body = `<p class="q-hint">Select all that apply — partial credit, but wrong picks cost you.</p>` +
        q.options.choices.map((c, i) => `
        <label class="q-choice"><input type="checkbox" name="${esc(q.id)}" value="${i}"><span>${esc(c)}</span></label>`).join('');
      break;
    case 'match': {
      const order = shuffled(q.options.right.map((_, i) => i));
      body = `<div class="q-match">` + q.options.left.map((l, li) => `
        <div class="q-match-row">
          <span class="q-match-left">${esc(l)}</span>
          <select data-match="${esc(q.id)}" data-left="${li}" aria-label="Match for ${esc(l)}">
            <option value="">— choose —</option>
            ${order.map(ri => `<option value="${ri}">${esc(q.options.right[ri])}</option>`).join('')}
          </select>
        </div>`).join('') + `</div>`;
      break;
    }
    case 'order': {
      const disp = shuffled(q.options.items.map((_, i) => i));
      body = `<p class="q-hint">Use the arrows to arrange the items in order (top = first).</p>
        <ul class="q-order" data-order="${esc(q.id)}">
          ${disp.map(oi => `
            <li data-idx="${oi}">
              <span>${esc(q.options.items[oi])}</span>
              <span class="q-order-btns">
                <button type="button" data-move="up" aria-label="Move up">▲</button>
                <button type="button" data-move="down" aria-label="Move down">▼</button>
              </span>
            </li>`).join('')}
        </ul>`;
      break;
    }
    case 'numeric':
      body = `<div class="q-inline">
        <input type="number" step="any" name="${esc(q.id)}" placeholder="Your answer" aria-label="Numeric answer">
        ${q.options.unit ? `<span class="q-unit">${esc(q.options.unit)}</span>` : ''}
      </div>`;
      break;
    case 'short':
      body = `<input type="text" class="q-short" name="${esc(q.id)}" placeholder="${esc(q.options.placeholder || 'Type your answer')}" aria-label="Short answer">`;
      break;
    case 'matrix': {
      const rows = q.options.rows, cols = q.options.cols;
      const colLabels = q.options.colLabels || [];
      const rowLabels = q.options.rowLabels || [];
      const thead = colLabels.length
        ? `<thead><tr>${rowLabels.length ? '<th></th>' : ''}${colLabels.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>`
        : '';
      let tbody = '';
      for (let r = 0; r < rows; r++) {
        tbody += `<tr>${rowLabels.length ? `<th scope="row">${esc(rowLabels[r] || '')}</th>` : ''}`;
        for (let c = 0; c < cols; c++) {
          tbody += `<td><input type="number" step="any" data-cell data-row="${r}" data-col="${c}" aria-label="Row ${r + 1}, column ${c + 1}"></td>`;
        }
        tbody += `</tr>`;
      }
      body = `<div class="q-matrix-wrap"><table class="q-matrix">${thead}<tbody>${tbody}</tbody></table>${q.options.unit ? `<span class="q-unit">${esc(q.options.unit)}</span>` : ''}</div>`;
      break;
    }
  }
  return `<div class="q-card" data-q="${esc(q.id)}" data-qtype="${esc(q.qtype)}">${head}<div class="q-body">${body}</div><div class="q-feedback" hidden></div></div>`;
}

function collectAnswers(container, questions) {
  const given = {};
  for (const q of questions) {
    const card = container.querySelector(`[data-q="${CSS.escape(q.id)}"]`);
    if (!card) continue;
    switch (q.qtype) {
      case 'mc': {
        const sel = card.querySelector('input[type=radio]:checked');
        if (sel) given[q.id] = parseInt(sel.value, 10);
        break;
      }
      case 'multi': {
        const vals = [...card.querySelectorAll('input[type=checkbox]:checked')].map(x => parseInt(x.value, 10));
        if (vals.length) given[q.id] = vals;
        break;
      }
      case 'match': {
        const vals = [];
        let any = false;
        card.querySelectorAll('select[data-match]').forEach(s => {
          const v = s.value === '' ? null : parseInt(s.value, 10);
          if (v !== null) any = true;
          vals[parseInt(s.dataset.left, 10)] = v;
        });
        if (any) given[q.id] = vals;
        break;
      }
      case 'order': {
        const vals = [...card.querySelectorAll('.q-order li')].map(li => parseInt(li.dataset.idx, 10));
        given[q.id] = vals;
        break;
      }
      case 'numeric': {
        const v = card.querySelector('input').value.trim();
        if (v !== '') given[q.id] = parseFloat(v);
        break;
      }
      case 'short': {
        const v = card.querySelector('input').value.trim();
        if (v !== '') given[q.id] = v;
        break;
      }
      case 'matrix': {
        const grid = [];
        let any = false;
        for (let r = 0; r < q.options.rows; r++) {
          const row = [];
          for (let c = 0; c < q.options.cols; c++) {
            const inp = card.querySelector(`input[data-cell][data-row="${r}"][data-col="${c}"]`);
            const v = inp ? inp.value.trim() : '';
            if (v !== '') { row.push(parseFloat(v)); any = true; } else { row.push(null); }
          }
          grid.push(row);
        }
        if (any) given[q.id] = grid;
        break;
      }
    }
  }
  return given;
}

const RESULT_META = {
  correct: ['✅ Correct', 'q-correct'],
  partial: ['🟡 Partially correct', 'q-partial'],
  incorrect: ['❌ Not quite', 'q-incorrect'],
};

/* ---------- main view ---------- */
export async function taskView({ id }) {
  render(spinner('Loading task…'));
  const cur = await getCurriculum();
  const task = cur.tasks.find(t => t.id === id);
  if (!task) {
    render(`<section class="section"><div class="container"><h1>Task not found</h1><a class="btn btn-secondary" href="#/units">← All units</a></div></section>`);
    return;
  }
  const unit = cur.units.find(u => u.id === task.unit_id);
  const user = api.currentUser();
  const isStudent = user?.role === 'student';
  const state = user ? await getMyState() : null;
  const status = state ? taskStatus(task, state) : null;
  const isQuiz = task.type === 'quiz';
  const isLesson = task.type === 'lesson';

  /* Structured-form tasks (js/forms.js): load this student's answers + partners. */
  const def = formDef(task);
  const unmarked = isUnmarkedTask(task);
  let fc = null;
  if (def && isStudent) {
    const partners = (def.needsPartner || def.shared) ? await api.getMyPartners().catch(() => ({})) : {};
    const myEntries = (state?.entries || []).filter(e => e.task_id === task.id);
    const sharedEntries = def.shared && partners.testing
      ? await api.getFormEntries(task.id, partners.testing.developer_id).catch(() => []) : [];
    fc = { def, partners, myEntries, sharedEntries, me: user.name || user.display_name || 'you' };
  }

  if (isStudent && status === 'not_started' && !isLesson) {
    api.startTask(task.id).then(() => invalidate({ state: true })).catch(() => {});
  }

  /* --- shared blocks --- */
  const critBadges = task.criteria.map(c => badge(criterionLabel(cur, c), courseBadgeClass(c))).join(' ');
  const sections = (task.body?.sections || []).map(s => `
    <div class="task-section"><h4>${esc(s.title)}</h4><div class="task-html">${s.html}</div></div>`).join('');
  const checklist = (task.body?.checklist || []).length ? `
    <div class="task-section">
      <h4>Submission Checklist</h4>
      <ul class="checklist checklist--interactive" data-task="${esc(task.id)}">
        ${task.body.checklist.map((c, i) => `
          <li><label><input type="checkbox" data-check="${i}"><span>${esc(c)}</span></label></li>`).join('')}
      </ul>
    </div>` : '';
  const marking = (task.body?.marking || []).length ? `
    <div class="task-section">
      <h4>Marking Guide</h4>
      <div class="marking-wrap"><table class="marking-table">
        <thead><tr><th>Criterion</th><th class="grade-c">C — Satisfactory</th><th class="grade-a">A — High Standard</th></tr></thead>
        <tbody>
          ${task.body.marking.map(m => `
            <tr><td>${esc(criterionLabel(cur, m.criterion))}</td><td class="grade-c">${esc(m.c || '')}</td><td class="grade-a">${m.a ? esc(m.a) : '—'}</td></tr>`).join('')}
        </tbody>
      </table></div>
    </div>` : '';

  /* Show this student's saved answers from another form task (e.g. 4.2 shows the 2.1 mechanics). */
  let borrowedBlock = '';
  const srcTask = task.body?.showEntriesFrom && cur.tasks.find(t => t.id === task.body.showEntriesFrom);
  if (srcTask && isStudent) {
    const ids = task.body.showFields || [];
    const sdef = formDef(srcTask);
    const ents = (state?.entries || []).filter(e => e.task_id === srcTask.id).sort((a, b) => a.entry_no - b.entry_no)
      .filter(e => ids.some(id => (e.data?.[id] ?? '') !== ''));
    borrowedBlock = `
    <div class="task-section">
      <h4>Your saved list from ${esc(srcTask.code)} — ${esc(srcTask.title)}</h4>
      ${ents.length ? `<ol class="borrowed-list">${ents.map(e => `<li>${ids.map(id => {
        const f = sdef?.fields.find(x => x.id === id);
        const v = e.data?.[id];
        return v ? `<span><b>${esc(f?.short || f?.label || id)}:</b> ${esc(String(v))}</span>` : '';
      }).join(' ')}</li>`).join('')}</ol>`
        : `<p class="unit-counts">You haven't filled in ${esc(srcTask.code)} yet. <a href="#/task/${encodeURIComponent(srcTask.id)}">Open ${esc(srcTask.code)} →</a></p>`}
    </div>`;
  }

  /* --- interactive area --- */
  let actionArea = '';
  if (isLesson) {
    // Content-only page: lesson body + worked examples render above; no action area.
    actionArea = '';
  } else if (isQuiz) {
    const attempts = state ? state.attempts.filter(a => a.task_id === task.id) : [];
    const best = state ? bestAttempt(task.id, state) : null;
    const attemptsLeft = task.max_attempts == null ? null : Math.max(0, task.max_attempts - attempts.length);
    actionArea = `
      <div class="quiz-panel" id="quiz-panel">
        <div class="quiz-panel-head">
          <h2>⚡ ${esc(task.title)}</h2>
          <div class="quiz-meta">
            <span>${task.questions.length} questions</span>
            <span>Pass: ${task.pass_pct}%</span>
            <span>${task.max_attempts == null ? 'Unlimited attempts' : `${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left`}</span>
            ${best ? `<span class="score-note">Best so far: ${Math.round((best.score / best.max_score) * 100)}%</span>` : ''}
          </div>
        </div>
        ${!user ? `<div class="info-box"><p><a href="#/login">Sign in</a> to take this quiz and record your score.</p></div>` : ''}
        ${user && attemptsLeft === 0 ? `<div class="info-box"><p>You've used all attempts for this quiz. Best score: <strong>${best ? Math.round((best.score / best.max_score) * 100) + '%' : '—'}</strong></p></div>` : ''}
        ${user && (attemptsLeft === null || attemptsLeft > 0) ? `
          <form id="quiz-form">
            ${task.questions.map((q, i) => questionHTML(q, i)).join('')}
            <div class="quiz-actions">
              <button type="submit" class="btn btn-primary btn-lg">Submit answers ⚡</button>
            </div>
          </form>
          <div id="quiz-result" hidden></div>` : ''}
      </div>`;
  } else if (def) {
    actionArea = formAreaHTML(task, fc, user, unmarked, status);
  } else {
    const mySubs = state ? state.submissions.filter(s => s.task_id === task.id).sort((a, b) => b.created_at.localeCompare(a.created_at)) : [];
    const myMarks = state ? state.marks.filter(m => m.task_id === task.id) : [];
    const myFb = state ? state.feedback.find(f => f.task_id === task.id) : null;
    const kinds = task.submit_kinds || ['file', 'url'];

    const feedbackBlock = (myMarks.length || myFb) ? `
      <div class="feedback-panel">
        <h3>📋 Marked — teacher feedback</h3>
        ${myMarks.length ? `<div class="rating-chips">${myMarks.map(m =>
          `<span class="rating-chip rating-${esc(m.rating)}">${esc(criterionLabel(cur, m.criterion_id))}: <b>${esc(m.rating)}</b></span>`).join('')}</div>` : ''}
        ${myFb?.feedback ? `<blockquote class="feedback-quote">${esc(myFb.feedback)}</blockquote>` : ''}
        ${myFb ? `<p class="feedback-date">Marked ${fmtDate(myFb.marked_at)}</p>` : ''}
      </div>` : '';

    const historyBlock = mySubs.length ? `
      <div class="task-section">
        <h4>Your submissions</h4>
        <ul class="submission-history">
          ${mySubs.map(s => `
            <li>
              <span class="sub-icon">${s.url ? '🔗' : '📄'}</span>
              <span class="sub-main">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : esc(s.file_name || 'File')}
                ${s.comment ? `<span class="sub-comment">“${esc(s.comment)}”</span>` : ''}</span>
              <span class="sub-date">${fmtDate(s.created_at)}</span>
            </li>`).join('')}
        </ul>
      </div>` : '';

    actionArea = `
      ${feedbackBlock}
      ${historyBlock}
      <div class="submit-panel">
        <h3>📤 Submit your work</h3>
        ${!user ? `<div class="info-box"><p><a href="#/login">Sign in</a> to submit this task.</p></div>` : `
        <form id="submit-form">
          ${kinds.includes('file') ? `
          <label class="field">
            <span>Upload a file ${kinds.includes('url') ? '(or share a link below)' : ''}</span>
            <input type="file" name="file">
          </label>` : ''}
          ${kinds.includes('url') ? `
          <label class="field">
            <span>…or paste a link (OneDrive, itch.io, video, etc.)</span>
            <input type="url" name="url" placeholder="https://">
          </label>` : ''}
          <label class="field">
            <span>Comment for your teacher (optional)</span>
            <textarea name="comment" rows="2" placeholder="Anything you want me to know about this submission?"></textarea>
          </label>
          <p class="form-error" id="submit-error" role="alert" hidden></p>
          <button class="btn btn-primary btn-lg" type="submit">Submit ${mySubs.length ? 'again' : ''} →</button>
        </form>`}
      </div>`;
  }

  render(`
<div class="page-header ${unit?.phase === 2 ? 'page-header--prj' : ''}">
  <div class="container">
    <div class="breadcrumb"><a href="#/">Home</a> › <a href="#/units">Units</a> › <a href="#/units/${unit?.number}">Unit ${unit?.number}</a> › ${esc(task.code)}</div>
    <div class="meta-row">
      ${isQuiz ? '<span class="chip chip-quiz">⚡ Auto-marked quiz</span>'
        : def ? `<span class="chip chip-idle">${unmarked ? '📝 Activity — not marked' : '📋 Online form'}</span>`
        : '<span class="chip chip-idle">📤 Submission task</span>'}
      ${status ? statusChip(status, { unmarked }) : ''}
      <span class="unit-weeks">⏱ ${esc(task.est_time || '')} · 🛠 ${esc(task.tools || '')} · 📅 ${esc(task.weeks || '')}</span>
    </div>
    <h1 style="margin-top:0.75rem;">${esc(task.code)} — ${esc(task.title)}</h1>
    <div class="meta-row">${critBadges}</div>
  </div>
</div>
<section class="section">
  <div class="container">
    ${task.overview ? `<div class="task-section"><h4>Overview</h4><p>${esc(task.overview)}</p></div>` : ''}
    ${sections}
    ${borrowedBlock}
    ${checklist}
    ${marking}
    ${actionArea}
    <div class="unit-nav" style="margin-top:2.5rem;">
      <a href="#/units/${unit?.number}" class="btn btn-secondary">← Back to Unit ${unit?.number}</a>
      <button class="btn btn-ghost" onclick="window.print()">🖨 Print task sheet</button>
    </div>
  </div>
</section>`, { title: `${task.code} ${task.title}` });

  wireChecklist(task.id);
  if (isQuiz) wireQuiz(task);
  else if (def) wireForm(task, fc, user);
  else wireSubmit(task);
}

/* ---------- structured forms ---------- */
function formAreaHTML(task, fc, user, unmarked, status) {
  const def = formDef(task);
  if (!user) return `<div class="submit-panel"><h3>📝 Fill this in</h3><div class="info-box"><p><a href="#/login">Sign in</a> to fill in this task.</p></div></div>`;
  if (!fc) {
    // a teacher looking at the student's page
    return `<div class="submit-panel"><h3>📝 Online form</h3><div class="info-box"><p>Students fill this task in on this page. See their answers under <strong>Teach → Tasks</strong>${unmarked ? '' : ' and in the marking queue'}.</p></div></div>`;
  }
  const ctx = { partners: fc.partners, me: fc.me };
  if ((def.needsPartner || def.shared) && !fc.partners.myTester && !fc.partners.testing) {
    return `<div class="submit-panel"><h3>📝 Not ready yet</h3>
      <div class="info-box"><p>Your teacher hasn't set up your developer–tester partner yet. Once they have, this form will open here.</p></div></div>`;
  }
  const { done, need, complete } = formProgress(def, fc.myEntries);
  const ownTitle = def.shared
    ? `Check-in log for your game${fc.partners.myTester ? ` — your tester is ${fc.partners.myTester.tester_name}` : ''}`
    : '';
  const own = formPanelHTML(def, { key: 'own', owner: user.id, title: ownTitle, entries: fc.myEntries, ctx });
  const theirs = def.shared && fc.partners.testing
    ? formPanelHTML(def, { key: 'partner', owner: fc.partners.testing.developer_id,
        title: `Check-in log for ${fc.partners.testing.developer_name}'s game — you are the tester`, entries: fc.sharedEntries, ctx })
    : '';
  return `
  <div class="submit-panel" id="form-area" data-task="${esc(task.id)}">
    <h3>📝 ${unmarked ? 'Fill this in' : 'Your answers'}</h3>
    ${complete
      ? `<div class="info-box info-box--ok"><p>✅ <strong>Complete.</strong> ${unmarked ? 'Nothing more to do — this activity is not marked.' : 'Your teacher can see it now and will mark it. You can still improve your answers.'}</p></div>`
      : `<p class="unit-counts">Progress: ${done} of ${need} complete. Save as you go — your answers are kept.</p>`}
    ${own}
    ${theirs}
  </div>`;
}

function wireForm(task, fc, user) {
  const area = document.getElementById('form-area');
  if (!area || !fc) return;
  const def = fc.def;
  const ctx = { partners: fc.partners, me: fc.me };

  area.addEventListener('click', async (e) => {
    const panel = e.target.closest('.form-panel');
    if (!panel) return;
    const owner = panel.dataset.owner, key = panel.dataset.key;

    if (e.target.closest('[data-add]')) {
      const cards = [...panel.querySelectorAll('.form-card')];
      const next = Math.max(0, ...cards.map(c => Number(c.dataset.entry))) + 1;
      if (cards.length >= formMax(def)) { toast(`That's the maximum number of entries.`, 'info'); return; }
      panel.querySelector('.form-cards').insertAdjacentHTML('beforeend', blankCardHTML(def, key, ctx, next));
      return;
    }

    const rm = e.target.closest('[data-remove]');
    if (rm) {
      if (!confirm('Delete this entry? This cannot be undone.')) return;
      try {
        await api.deleteFormEntry(task.id, owner, Number(rm.dataset.remove));
        invalidate({ state: true });
        taskView({ id: task.id });
      } catch (err) { toast(err.message, 'error'); }
      return;
    }

    if (e.target.closest('[data-save]')) {
      const btn = e.target.closest('[data-save]');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const existing = new Set(
          (key === 'own' ? fc.myEntries : fc.sharedEntries).map(x => x.entry_no));
        for (const card of panel.querySelectorAll('.form-card')) {
          const n = Number(card.dataset.entry);
          const data = collectCard(card, def);
          if (cardIsBlank(data) && !existing.has(n)) continue;
          if (def.needsPartner) {
            data._names = { developer: fc.me, tester: fc.partners.myTester?.tester_name || null, testing: fc.partners.testing?.developer_name || null };
          }
          await api.saveFormEntry({ task_id: task.id, student_id: owner, entry_no: n, data, shared: !!def.shared });
        }
        invalidate({ state: true });
        const st = await getMyState(true);
        const mine = (st.entries || []).filter(x => x.task_id === task.id);
        const alreadySubmitted = st.submissions.some(x => x.task_id === task.id);
        if (formProgress(def, mine).complete && !alreadySubmitted) {
          await api.submitWork(task.id, { comment: 'Form completed' });
          invalidate({ state: true });
          toast(isUnmarkedTask(task) ? 'Complete! Nice work. 🎉' : 'Complete — your teacher can see it now. 📬', 'success');
          confetti({ count: 60, duration: 1200 });
        } else {
          toast('Saved.', 'success');
        }
        taskView({ id: task.id });
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false; btn.textContent = '💾 Save';
      }
    }
  });
}

/* Checklist ticks persist locally per user+task (study aid only). */
function wireChecklist(taskId) {
  const list = document.querySelector('.checklist--interactive');
  if (!list) return;
  const user = api.currentUser();
  const key = `lu-check-${user?.id || 'guest'}-${taskId}`;
  let ticked = [];
  try { ticked = JSON.parse(localStorage.getItem(key) || '[]'); } catch { /* ignore */ }
  list.querySelectorAll('input[data-check]').forEach(cb => {
    cb.checked = ticked.includes(cb.dataset.check);
    cb.addEventListener('change', () => {
      const now = [...list.querySelectorAll('input[data-check]:checked')].map(x => x.dataset.check);
      try { localStorage.setItem(key, JSON.stringify(now)); } catch { /* ignore */ }
    });
  });
}

function wireQuiz(task) {
  const form = document.getElementById('quiz-form');
  if (!form) return;

  form.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-move]');
    if (!btn) return;
    e.preventDefault();
    const li = btn.closest('li');
    if (btn.dataset.move === 'up' && li.previousElementSibling) li.parentElement.insertBefore(li, li.previousElementSibling);
    if (btn.dataset.move === 'down' && li.nextElementSibling) li.parentElement.insertBefore(li.nextElementSibling, li);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const given = collectAnswers(form, task.questions);
    const unanswered = task.questions.filter(q => given[q.id] === undefined ||
      (q.qtype === 'match' && (given[q.id] || []).some(v => v === null || v === undefined)) ||
      (q.qtype === 'matrix' && (given[q.id] || []).some(row => row.some(v => v === null || v === undefined))));
    if (unanswered.length && !confirm(`You have ${unanswered.length} unanswered question${unanswered.length === 1 ? '' : 's'}. Submit anyway?`)) return;

    const submitBtn = form.querySelector('button[type=submit]');
    submitBtn.disabled = true; submitBtn.textContent = 'Marking…';
    let result;
    try {
      result = await api.submitQuiz(task.id, given);
    } catch (err) {
      toast(err.message, 'error');
      submitBtn.disabled = false; submitBtn.textContent = 'Submit answers ⚡';
      return;
    }
    invalidate({ state: true });

    const pct = result.max > 0 ? Math.round((result.score / result.max) * 100) : 0;
    const passed = pct >= (task.pass_pct ?? 80);

    for (const d of result.detail) {
      const card = form.querySelector(`[data-q="${CSS.escape(d.question_id)}"]`);
      if (!card) continue;
      const [label, cls] = RESULT_META[d.result] || RESULT_META.incorrect;
      card.classList.add(cls);
      const fb = card.querySelector('.q-feedback');
      fb.innerHTML = `<span class="q-verdict">${label} · ${d.awarded}/${d.points} pts</span>${d.explain ? `<p>${esc(d.explain)}</p>` : ''}`;
      fb.hidden = false;
      card.querySelectorAll('input, select, button[data-move]').forEach(el => { el.disabled = true; });
    }
    submitBtn.remove();

    const resultEl = document.getElementById('quiz-result');
    resultEl.innerHTML = `
      <div class="quiz-scorecard ${passed ? 'quiz-scorecard--pass' : ''}">
        <div class="quiz-score-big">${pct}%</div>
        <p>${result.score} / ${result.max} points ${passed ? '· <strong>Level cleared!</strong> 🎉' : `· Pass mark is ${task.pass_pct}%`}</p>
        ${passed
          ? `<p class="quiz-encourage">Recorded to your results. XP added to your profile.</p>`
          : `<p class="quiz-encourage">The explanations above show where to revise — you've got this.</p>`}
        <div class="quiz-actions">
          <button class="btn btn-secondary" id="retake-btn">↻ Retake quiz</button>
          <a class="btn btn-ghost" href="#/dashboard">My dashboard →</a>
        </div>
      </div>`;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (passed) confetti();
    document.getElementById('retake-btn')?.addEventListener('click', () => taskView({ id: task.id }));
  });
}

function wireSubmit(task) {
  const form = document.getElementById('submit-form');
  if (!form) return;
  const errEl = document.getElementById('submit-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const file = form.file?.files?.[0] || null;
    const url = form.url?.value?.trim() || '';
    if (!file && !url) {
      errEl.textContent = 'Attach a file or paste a link before submitting.';
      errEl.hidden = false;
      return;
    }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await api.submitWork(task.id, { url, file, comment: form.comment.value.trim() });
      invalidate({ state: true });
      toast('Submitted! Your teacher can see it now. 📬', 'success');
      confetti({ count: 60, duration: 1200 });
      taskView({ id: task.id });
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
      btn.disabled = false; btn.textContent = 'Submit →';
    }
  });
}

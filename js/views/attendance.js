/* Teacher attendance: overview + roll-not-taken, take roll, review grid, setup.
   Lessons are calculated (see attendance-lib.js); only per-student rows are
   stored, so "no row" = roll not taken. */

import { api } from '../api.js';
import { render, esc, spinner, toast, openModal, avatarHTML } from '../ui.js';
import { navigate } from '../router.js';
import { teacherHeader } from './teacher.js';
import {
  DOW_NAMES, buildLessons, currentTerm, summarise, pctChip, rollNotTaken, shortDay, todayStr, parseDay,
} from '../attendance-lib.js';
import { DEFAULT_CLASSES, DEFAULT_TERMS, SUGGESTED_CLOSURES } from '../data/att-defaults.js';

const CLASS_KEY = 'levelup-att-class';

async function load() {
  const [att, students] = await Promise.all([api.attGetAll(), api.listStudents()]);
  return { att, students: students.filter(s => s.active !== false) };
}

function pickClass(att) {
  let id = null;
  try { id = localStorage.getItem(CLASS_KEY); } catch { /* ignore */ }
  return att.classes.find(c => c.id === id) || att.classes[0] || null;
}
function rememberClass(id) { try { localStorage.setItem(CLASS_KEY, id); } catch { /* ignore */ } }

const byName = (a, b) => a.display_name.localeCompare(b.display_name);
function classStudents(att, students, classId) {
  const ids = new Set(att.classStudents.filter(x => x.class_id === classId).map(x => x.student_id));
  return students.filter(s => ids.has(s.id)).sort(byName);
}

function notReadyHTML() {
  return `
<section class="section section--sm"><div class="container">
  <div class="warning-box">
    <p><strong>Attendance tables aren't set up yet.</strong> One-off step: open Supabase → SQL Editor → New query, paste the contents of
    <code>supabase/attendance-setup.sql</code> (from the repo) and click Run. Then reload this page.</p>
  </div>
</div></section>`;
}

function needsSetupHTML() {
  return `
<section class="section section--sm"><div class="container">
  <div class="info-box"><p>No classes or terms yet. <a class="btn btn-primary btn-sm" href="#/teach/attendance/setup">Open attendance setup →</a></p></div>
</div></section>`;
}

function classTabs(att, classId) {
  return `<div class="meta-row" role="group" aria-label="Class">${att.classes.map(c =>
    `<button class="btn btn-sm ${c.id === classId ? 'btn-primary' : 'btn-secondary'}" data-class="${esc(c.id)}">${esc(c.name)}</button>`).join('')}</div>`;
}

const rollHref = (classId, day, slot) => `#/teach/attendance/roll/${encodeURIComponent(classId)}/${encodeURIComponent(day)}/${encodeURIComponent(slot)}`;
const lessonLabel = l => `${shortDay(l.day)} · ${l.slot} (${l.period}) · ${l.termName} wk ${l.week}`;

/* ---------------- overview ---------------- */
export async function attendanceView() {
  render(spinner('Loading attendance…'));
  const { att, students } = await load();
  const head = teacherHeader('Attendance', 'Take the roll, catch up on missed lessons, and see attendance by student.');
  if (!att.ready) { render(head + notReadyHTML(), { title: 'Attendance' }); return; }
  if (!att.classes.length || !att.terms.length) { render(head + needsSetupHTML(), { title: 'Attendance' }); return; }

  let cls = pickClass(att);
  let termSel = currentTerm(att.terms)?.id || 'all';

  render(`
${head}
<section class="section section--sm">
  <div class="container container--wide">
    <div class="mb-controls">
      <div id="att-tabs"></div>
      <span class="mb-spacer"></span>
      <a class="btn btn-secondary btn-sm" id="att-grid-link" href="#">▦ Review grid</a>
      <a class="btn btn-secondary btn-sm" href="#/teach/attendance/setup">⚙️ Setup</a>
    </div>
    <div id="att-body"></div>
  </div>
</section>`, { title: 'Attendance' });

  function paint() {
    document.getElementById('att-tabs').innerHTML = classTabs(att, cls.id);
    document.getElementById('att-grid-link').href = `#/teach/attendance/grid/${encodeURIComponent(cls.id)}`;
    const lessons = buildLessons(att.terms, att.closures, cls);
    const today = todayStr();
    const roster = classStudents(att, students, cls.id);
    const todays = lessons.filter(l => l.day === today);
    const next = lessons.find(l => l.day > today && !l.closed);
    const missed = rollNotTaken(lessons, att.records, cls.id, today);
    const recent = lessons.filter(l => l.day <= today).slice(-40).reverse();

    const todayHtml = todays.length
      ? todays.map(l => l.closed
          ? `<div class="att-lesson att-lesson--closed"><strong>${esc(lessonLabel(l))}</strong> <span class="chip chip-idle">H — ${esc(l.closed)}</span></div>`
          : `<div class="att-lesson"><strong>${esc(lessonLabel(l))}</strong>
               <a class="btn btn-primary btn-sm" href="${rollHref(cls.id, l.day, l.slot)}">📝 Take roll</a></div>`).join('')
      : `<p class="unit-counts">No ${esc(cls.name)} lesson today.${next ? ` Next: ${esc(lessonLabel(next))}.` : ''}</p>`;

    const missedHtml = missed.length
      ? `<table class="data-table"><thead><tr><th>Lesson</th><th></th></tr></thead><tbody>
          ${missed.slice(0, 12).map(l => `<tr><td>${esc(lessonLabel(l))}</td><td><a class="btn btn-secondary btn-sm" href="${rollHref(cls.id, l.day, l.slot)}">Take roll →</a></td></tr>`).join('')}
        </tbody></table>${missed.length > 12 ? `<p class="unit-counts">…and ${missed.length - 12} earlier lessons without a roll.</p>` : ''}`
      : '<p>✅ Every lesson so far has a roll recorded.</p>';

    const term = termSel === 'all' ? null : att.terms.find(t => t.id === termSel);
    const inRange = r => !term || (r.day >= term.start_date && r.day <= term.end_date);
    const recs = att.records.filter(r => r.class_id === cls.id && inRange(r));
    const rows = roster.map(s => ({ s, sum: summarise(recs.filter(r => r.student_id === s.id)) }));
    const all = summarise(recs.filter(r => roster.some(s => s.id === r.student_id)));
    const rowHtml = (name, sum, strong) => `<tr>
      <td>${strong ? `<strong>${name}</strong>` : name}</td><td>${pctChip(sum.pct)}</td><td>${sum.P}</td><td>${sum.A}</td><td>${sum.E}</td>
      <td>${sum.lateCount ? `${sum.lateCount}× · ${sum.lateMin} min` : '—'}</td>
      <td>${sum.earlyCount ? `${sum.earlyCount}× · ${sum.earlyMin} min` : '—'}</td>
      <td>${sum.calledHome || '—'}</td></tr>`;

    document.getElementById('att-body').innerHTML = `
      <div class="grid grid-2" style="align-items:start;">
        <div class="card"><h3>Today</h3>${todayHtml}
          <h4 style="margin-top:1.25rem;">Any other lesson</h4>
          <div class="meta-row">
            <select id="att-pick" class="scope-select" aria-label="Choose a lesson">${recent.map(l => `<option value="${esc(l.key)}">${esc(lessonLabel(l))}${l.closed ? ' (closed)' : ''}</option>`).join('')}</select>
            <button class="btn btn-secondary btn-sm" id="att-open">Open roll</button>
          </div>
        </div>
        <div class="card"><h3>Roll not taken (${missed.length})</h3>${missedHtml}</div>
      </div>
      <div class="meta-row" style="margin:1.5rem 0 0.75rem;">
        <h2 style="margin:0;">Attendance — ${esc(cls.name)}</h2>
        <select id="att-term" class="scope-select" aria-label="Period">
          <option value="all" ${termSel === 'all' ? 'selected' : ''}>All recorded</option>
          ${att.terms.map(t => `<option value="${esc(t.id)}" ${termSel === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
        </select>
      </div>
      <p class="unit-counts">% = present ÷ (present + absent). Explained absences, closed days and "called home" notes aren't counted; late and left-early students still count as present. Green ≥ 85%, amber 75–85%, red below 75%.</p>
      ${roster.length ? `<div class="marking-wrap"><table class="data-table">
        <thead><tr><th>Student</th><th>Attendance</th><th>Present</th><th>Absent</th><th>Explained</th><th>Late</th><th>Left early</th><th>Called home</th></tr></thead>
        <tbody>${rows.map(({ s, sum }) => rowHtml(`<a href="#/teach/students/${encodeURIComponent(s.id)}" style="color:inherit;">${avatarHTML(s, 'avatar--sm')} ${esc(s.display_name)}</a>`, sum)).join('')}
        ${rowHtml('Class', all, true)}</tbody></table></div>`
        : `<div class="info-box"><p>No students in ${esc(cls.name)} yet — assign them in <a href="#/teach/attendance/setup">Setup</a>.</p></div>`}`;

    document.querySelectorAll('[data-class]').forEach(b => b.addEventListener('click', () => {
      cls = att.classes.find(c => c.id === b.dataset.class); rememberClass(cls.id); paint();
    }));
    document.getElementById('att-term').addEventListener('change', e => { termSel = e.target.value; paint(); });
    document.getElementById('att-open').addEventListener('click', () => {
      const l = lessons.find(x => x.key === document.getElementById('att-pick').value);
      if (l) navigate(rollHref(cls.id, l.day, l.slot).slice(1));
    });
  }
  paint();
}

/* ---------------- take roll ---------------- */
export async function attendanceRollView({ classId, day, slot }) {
  render(spinner('Loading roll…'));
  const { att, students } = await load();
  const head = teacherHeader('Take roll', '');
  if (!att.ready) { render(head + notReadyHTML(), { title: 'Take roll' }); return; }
  const cls = att.classes.find(c => c.id === classId);
  const lessons = cls ? buildLessons(att.terms, att.closures, cls) : [];
  const lesson = lessons.find(l => l.key === `${day}|${slot}`);
  if (!cls || !lesson) {
    render(head + `<section class="section"><div class="container"><div class="warning-box"><p>That lesson isn't in the calendar. <a href="#/teach/attendance">Back to attendance</a></p></div></div></section>`, { title: 'Take roll' });
    return;
  }
  const roster = classStudents(att, students, classId);
  const open = lessons.filter(l => !l.closed);
  const idx = open.findIndex(l => l.key === lesson.key);
  const prev = idx > 0 ? open[idx - 1] : null;
  const nextL = idx >= 0 && idx < open.length - 1 ? open[idx + 1] : null;

  const state = {};
  for (const s of roster) {
    const r = att.records.find(x => x.class_id === classId && x.student_id === s.id && x.day === day && x.slot === slot);
    state[s.id] = {
      status: r?.status || null, late: r?.late_min || 0, early: r?.early_min || 0,
      home: !!r?.called_home, note: r?.note || '',
      showMin: !!(r && (r.late_min || r.early_min)), showHome: !!r?.called_home,
    };
  }

  const rowHtml = s => `
    <div class="att-row" data-sid="${esc(s.id)}">
      <div class="att-who">${avatarHTML(s, 'avatar--sm')} <strong>${esc(s.display_name)}</strong></div>
      <div class="att-btns" role="group" aria-label="Status for ${esc(s.display_name)}">
        <button type="button" class="att-btn att-P" data-st="P">P</button>
        <button type="button" class="att-btn att-A" data-st="A">A</button>
        <button type="button" class="att-btn att-E" data-st="E">E</button>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" data-act="min" title="Late / left early (Present only)">⏱</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="home" title="Called home">📞</button>
      <div class="att-extra" data-panel="min" hidden>
        Late <input type="number" min="0" max="120" data-f="late" aria-label="Minutes late"> min ·
        Left early <input type="number" min="0" max="120" data-f="early" aria-label="Minutes left early"> min
      </div>
      <div class="att-extra" data-panel="home" hidden>
        <input type="text" data-f="note" placeholder="Called home — note (optional)" aria-label="Called home note" style="min-width:260px;">
      </div>
    </div>`;

  render(`
${teacherHeader('Take roll', `${esc(cls.name)} · ${esc(lessonLabel(lesson))} · ${esc(parseDay(day).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }))}`)}
<section class="section section--sm">
  <div class="container">
    <div class="meta-row" style="margin-bottom:1rem;">
      <a class="btn btn-secondary btn-sm" href="#/teach/attendance">← Attendance</a>
      ${prev ? `<a class="btn btn-secondary btn-sm" href="${rollHref(classId, prev.day, prev.slot)}">‹ Previous lesson</a>` : ''}
      ${nextL ? `<a class="btn btn-secondary btn-sm" href="${rollHref(classId, nextL.day, nextL.slot)}">Next lesson ›</a>` : ''}
    </div>
    ${lesson.closed ? `<div class="warning-box"><p><strong>Closed day — ${esc(lesson.closed)}.</strong> Counted as H. To take a roll anyway, remove this date from the closed days in <a href="#/teach/attendance/setup">Setup</a>.</p></div>` : `
    <div class="meta-row att-toolbar">
      <button class="btn btn-secondary btn-sm" id="all-p">✔ All present</button>
      <button class="btn btn-secondary btn-sm" id="all-a">✖ All absent</button>
      <button class="btn btn-ghost btn-sm" id="all-clear">Clear all</button>
      <span class="mb-spacer"></span>
      <span class="unit-counts" id="att-count"></span>
      <button class="btn btn-primary" id="att-save">💾 Save roll</button>
    </div>
    <p class="unit-counts">Nothing is pre-filled — students you leave blank stay "not taken". P present · A absent · E explained. ⏱ late / left early (present only) · 📞 called home.</p>
    <div class="att-list">${roster.map(rowHtml).join('') || '<p><em>No students in this class yet — assign them in Setup.</em></p>'}</div>`}
  </div>
</section>`, { title: 'Take roll' });

  if (lesson.closed || !roster.length) return;

  const rowEl = sid => document.querySelector(`.att-row[data-sid="${CSS.escape(sid)}"]`);
  function paintRow(sid) {
    const st = state[sid], el = rowEl(sid);
    el.querySelectorAll('.att-btn').forEach(b => b.classList.toggle('selected', b.dataset.st === st.status));
    el.querySelector('[data-act=min]').disabled = st.status !== 'P';
    el.querySelector('[data-act=min]').classList.toggle('active', st.showMin || st.late > 0 || st.early > 0);
    el.querySelector('[data-act=home]').classList.toggle('active', st.showHome || st.home);
    el.querySelector('[data-panel=min]').hidden = !(st.showMin && st.status === 'P');
    el.querySelector('[data-panel=home]').hidden = !st.showHome;
    el.querySelector('[data-f=late]').value = st.late || '';
    el.querySelector('[data-f=early]').value = st.early || '';
    el.querySelector('[data-f=note]').value = st.note;
  }
  function paintCount() {
    const n = roster.filter(s => state[s.id].status).length;
    document.getElementById('att-count').textContent = `${n} of ${roster.length} marked`;
  }
  const paintAll = () => { roster.forEach(s => paintRow(s.id)); paintCount(); };

  document.querySelector('.att-list').addEventListener('click', e => {
    const row = e.target.closest('.att-row'); if (!row) return;
    const st = state[row.dataset.sid];
    const b = e.target.closest('[data-st]');
    if (b) {
      st.status = st.status === b.dataset.st ? null : b.dataset.st;
      if (st.status !== 'P') { st.late = 0; st.early = 0; st.showMin = false; }
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'min' && st.status === 'P') st.showMin = !st.showMin;
    if (act === 'home') { st.showHome = !st.showHome; st.home = st.showHome; if (!st.showHome) st.note = ''; }
    paintRow(row.dataset.sid); paintCount();
  });
  document.querySelector('.att-list').addEventListener('input', e => {
    const row = e.target.closest('.att-row'); const f = e.target.dataset.f; if (!row || !f) return;
    const st = state[row.dataset.sid];
    if (f === 'note') st.note = e.target.value;
    else st[f] = Math.max(0, parseInt(e.target.value, 10) || 0);
  });
  const setAll = v => { roster.forEach(s => { state[s.id].status = v; if (v !== 'P') { state[s.id].late = 0; state[s.id].early = 0; state[s.id].showMin = false; } }); paintAll(); };
  document.getElementById('all-p').addEventListener('click', () => setAll('P'));
  document.getElementById('all-a').addEventListener('click', () => setAll('A'));
  document.getElementById('all-clear').addEventListener('click', () => setAll(null));

  document.getElementById('att-save').addEventListener('click', async (e) => {
    e.target.disabled = true;
    try {
      await api.attSaveRoll(classId, day, slot, roster.map(s => {
        const st = state[s.id];
        return { student_id: s.id, status: st.status, late_min: st.late, early_min: st.early, called_home: st.home, note: st.home ? st.note : '' };
      }));
      toast('Roll saved.', 'success');
      navigate('/teach/attendance');
    } catch (err) { toast(err.message, 'error'); e.target.disabled = false; }
  });
  paintAll();
}

/* ---------------- review grid ---------------- */
export async function attendanceGridView({ classId }) {
  render(spinner('Loading grid…'));
  const { att, students } = await load();
  const head = teacherHeader('Attendance grid', '');
  if (!att.ready) { render(head + notReadyHTML(), { title: 'Attendance grid' }); return; }
  const cls = att.classes.find(c => c.id === classId) || att.classes[0];
  if (!cls) { render(head + needsSetupHTML(), { title: 'Attendance grid' }); return; }
  rememberClass(cls.id);
  const roster = classStudents(att, students, cls.id);
  const allLessons = buildLessons(att.terms, att.closures, cls);
  let termSel = currentTerm(att.terms)?.id || 'all';

  render(`
${teacherHeader('Attendance grid', `${esc(cls.name)} — every lesson, every student`)}
<section class="section section--sm">
  <div class="container container--wide">
    <div class="mb-controls">
      <a class="btn btn-secondary btn-sm" href="#/teach/attendance">← Attendance</a>
      <select id="grid-class" class="scope-select" aria-label="Class">${att.classes.map(c => `<option value="${esc(c.id)}" ${c.id === cls.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <select id="grid-term" class="scope-select" aria-label="Term">
        <option value="all" ${termSel === 'all' ? 'selected' : ''}>All terms</option>
        ${att.terms.map(t => `<option value="${esc(t.id)}" ${termSel === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
      </select>
    </div>
    <div class="mb-legend">
      <span class="mb-key"><span class="mb-swatch att-P"></span> P present</span>
      <span class="mb-key"><span class="mb-swatch att-A"></span> A absent</span>
      <span class="mb-key"><span class="mb-swatch att-E"></span> E explained</span>
      <span class="mb-key"><span class="mb-swatch att-H"></span> H closed day</span>
      <span class="mb-key">⏱ late / left early</span><span class="mb-key">📞 called home</span>
      <span class="mb-key">Click a cell to edit · click a lesson header to take that whole roll</span>
    </div>
    <div id="grid-body"></div>
  </div>
</section>`, { title: 'Attendance grid' });

  const today = todayStr();
  function paint() {
    const lessons = allLessons.filter(l => termSel === 'all' || l.termId === termSel);
    const recMap = new Map();
    for (const r of att.records) if (r.class_id === cls.id) recMap.set(`${r.student_id}|${r.day}|${r.slot}`, r);
    if (!lessons.length) { document.getElementById('grid-body').innerHTML = '<div class="info-box"><p>No lessons in that period.</p></div>'; return; }
    if (!roster.length) { document.getElementById('grid-body').innerHTML = '<div class="info-box"><p>No students in this class yet — assign them in <a href="#/teach/attendance/setup">Setup</a>.</p></div>'; return; }

    const weeks = [];
    for (const l of lessons) {
      const k = `${l.termId}|${l.week}`;
      const last = weeks[weeks.length - 1];
      if (last && last.k === k) last.n++; else weeks.push({ k, n: 1, label: `${termSel === 'all' ? l.termName.replace(/ \(.*/, '') + ' · ' : ''}Wk ${l.week}` });
    }
    const head1 = `<tr><th class="mb-name" rowspan="2">Student</th>${weeks.map(w => `<th class="mb-unit" colspan="${w.n}">${esc(w.label)}</th>`).join('')}</tr>`;
    const head2 = `<tr>${lessons.map(l => `<th class="mb-task"><a href="${rollHref(cls.id, l.day, l.slot)}" title="${esc(lessonLabel(l))}">${DOW_NAMES[l.dow]}</a><small>${esc(parseDay(l.day).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }))}</small></th>`).join('')}</tr>`;

    const body = roster.map(s => {
      const sum = summarise(lessons.map(l => recMap.get(`${s.id}|${l.day}|${l.slot}`)).filter(Boolean));
      const tds = lessons.map(l => {
        if (l.closed) return `<td class="att-cell att-H" title="${esc(l.closed)}">H</td>`;
        const r = recMap.get(`${s.id}|${l.day}|${l.slot}`);
        const future = l.day > today ? ' att-future' : '';
        const marks = r ? `${r.late_min || r.early_min ? '<sup>⏱</sup>' : ''}${r.called_home ? '<sup>📞</sup>' : ''}` : '';
        const tip = r ? `${s.display_name} · ${shortDay(l.day)} ${l.slot}${r.late_min ? ` · ${r.late_min} min late` : ''}${r.early_min ? ` · left ${r.early_min} min early` : ''}${r.note ? ` · ${r.note}` : ''}` : `${s.display_name} · ${shortDay(l.day)} ${l.slot} · not taken`;
        return `<td class="att-cell${r?.status ? ' att-' + r.status : ''}${future}" data-s="${esc(s.id)}" data-d="${esc(l.day)}" data-l="${esc(l.slot)}" title="${esc(tip)}">${r?.status || ''}${marks}</td>`;
      }).join('');
      return `<tr><td class="mb-name"><a href="#/teach/students/${encodeURIComponent(s.id)}">${avatarHTML(s, 'avatar--sm')} ${esc(s.display_name)}</a> ${pctChip(sum.pct)}<small>${sum.P}P · ${sum.A}A · ${sum.E}E</small></td>${tds}</tr>`;
    }).join('');
    document.getElementById('grid-body').innerHTML = `<div class="mb-wrap"><table class="mb-table"><thead>${head1}${head2}</thead><tbody>${body}</tbody></table></div>`;
  }

  document.getElementById('grid-class').addEventListener('change', e => navigate(`/teach/attendance/grid/${encodeURIComponent(e.target.value)}`));
  document.getElementById('grid-term').addEventListener('change', e => { termSel = e.target.value; paint(); });
  document.getElementById('grid-body').addEventListener('click', e => {
    const td = e.target.closest('.att-cell[data-s]'); if (!td) return;
    openCellEditor(cls, roster.find(s => s.id === td.dataset.s), td.dataset.d, td.dataset.l,
      att.records.find(r => r.class_id === cls.id && r.student_id === td.dataset.s && r.day === td.dataset.d && r.slot === td.dataset.l),
      () => attendanceGridView({ classId: cls.id }));
  });
  paint();
}

function openCellEditor(cls, student, day, slot, rec, reload) {
  const st = { status: rec?.status || null, late: rec?.late_min || 0, early: rec?.early_min || 0, home: !!rec?.called_home, note: rec?.note || '' };
  const modal = openModal(`
    <h2>${esc(student.display_name)}</h2>
    <p class="unit-counts">${esc(cls.name)} · ${esc(shortDay(day))} · ${esc(slot)}</p>
    <div class="att-btns" id="ce-st" style="margin:1rem 0;">
      <button type="button" class="att-btn att-P" data-st="P">P</button>
      <button type="button" class="att-btn att-A" data-st="A">A</button>
      <button type="button" class="att-btn att-E" data-st="E">E</button>
    </div>
    <div class="att-extra" id="ce-min">Late <input type="number" min="0" max="120" id="ce-late" value="${st.late || ''}"> min · Left early <input type="number" min="0" max="120" id="ce-early" value="${st.early || ''}"> min</div>
    <label class="crit-check" style="margin:0.75rem 0;"><input type="checkbox" id="ce-home" ${st.home ? 'checked' : ''}><span>📞 Called home</span></label>
    <input type="text" id="ce-note" placeholder="Note (optional)" value="${esc(st.note)}" style="width:100%;">
    <div class="quiz-actions" style="margin-top:1.25rem;">
      <button class="btn btn-primary" id="ce-save">💾 Save</button>
      <button class="btn btn-ghost" id="ce-clear">Clear (not taken)</button>
      <button class="btn btn-ghost" data-close="1">Cancel</button>
    </div>`);
  const el = modal.el;
  const paint = () => {
    el.querySelectorAll('#ce-st .att-btn').forEach(b => b.classList.toggle('selected', b.dataset.st === st.status));
    el.querySelector('#ce-min').hidden = st.status !== 'P';
  };
  el.querySelector('#ce-st').addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    st.status = st.status === b.dataset.st ? null : b.dataset.st; paint();
  });
  const save = async (entry) => {
    try {
      await api.attSaveRoll(cls.id, day, slot, [{ student_id: student.id, ...entry }]);
      toast('Saved.', 'success'); modal.close(); reload();
    } catch (err) { toast(err.message, 'error'); }
  };
  el.querySelector('#ce-save').addEventListener('click', () => save({
    status: st.status, late_min: parseInt(el.querySelector('#ce-late').value, 10) || 0, early_min: parseInt(el.querySelector('#ce-early').value, 10) || 0,
    called_home: el.querySelector('#ce-home').checked, note: el.querySelector('#ce-note').value.trim(),
  }));
  el.querySelector('#ce-clear').addEventListener('click', () => save({ status: null, called_home: false }));
  paint();
}

/* ---------------- setup ---------------- */
export async function attendanceSetupView() {
  render(spinner('Loading setup…'));
  const { att, students } = await load();
  const head = teacherHeader('Attendance setup', 'Classes and their weekly lessons, term dates, and closed days.');
  if (!att.ready) { render(head + notReadyHTML(), { title: 'Attendance setup' }); return; }

  const classes = JSON.parse(JSON.stringify(att.classes));
  const originalClassIds = new Set(att.classes.map(c => c.id));
  const roster = {};                      // classId -> Set(studentId)
  for (const c of classes) roster[c.id] = new Set(att.classStudents.filter(x => x.class_id === c.id).map(x => x.student_id));
  let terms = JSON.parse(JSON.stringify(att.terms));
  let closures = JSON.parse(JSON.stringify(att.closures));

  render(`
${head}
<section class="section section--sm">
  <div class="container">
    <div class="mb-controls">
      <a class="btn btn-secondary btn-sm" href="#/teach/attendance">← Attendance</a>
      <span class="mb-spacer"></span>
      <button class="btn btn-primary" id="set-save">💾 Save all</button>
    </div>
    <div id="set-body"></div>
  </div>
</section>`, { title: 'Attendance setup' });

  const body = document.getElementById('set-body');
  const nextSlot = c => { let n = 1; const used = new Set((c.pattern || []).map(p => p.slot)); while (used.has('L' + n)) n++; return 'L' + n; };
  const slug = n => (n || 'class').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'class';

  function paint() {
    const dowOpts = sel => [1, 2, 3, 4, 5].map(d => `<option value="${d}" ${sel === d ? 'selected' : ''}>${DOW_NAMES[d]}</option>`).join('');
    const classBlocks = classes.map((c, ci) => `
      <div class="card" style="margin-bottom:1rem;" data-ci="${ci}">
        <div class="meta-row">
          <label class="field" style="margin:0;"><span>Class name</span><input data-f="name" value="${esc(c.name)}"></label>
          <span class="mb-spacer"></span>
          <button class="btn btn-danger btn-sm" data-act="del-class">Delete class</button>
        </div>
        <h4>Weekly lessons</h4>
        ${(c.pattern || []).map((p, pi) => `<div class="meta-row" data-pi="${pi}">
          <select data-f="dow">${dowOpts(p.dow)}</select>
          <input data-f="period" value="${esc(p.period)}" placeholder="Period (e.g. P1)" style="width:120px;">
          <span class="chip chip-idle" title="Stays the same once records exist">${esc(p.slot)}</span>
          <button class="btn btn-ghost btn-sm" data-act="del-lesson">✕</button></div>`).join('')}
        <button class="btn btn-secondary btn-sm" data-act="add-lesson">＋ Add weekly lesson</button>
        <h4 style="margin-top:1rem;">Students in ${esc(c.name || 'this class')}</h4>
        <div class="crit-checks">${students.map(s => {
          const other = classes.find((o, oi) => oi !== ci && roster[o.id]?.has(s.id));
          return `<label class="crit-check"><input type="checkbox" data-sid="${esc(s.id)}" ${roster[c.id]?.has(s.id) ? 'checked' : ''}><span>${esc(s.display_name)}${other ? ` <em>(now in ${esc(other.name)})</em>` : ''}</span></label>`;
        }).join('') || '<em>No students enrolled yet.</em>'}</div>
      </div>`).join('');

    body.innerHTML = `
      <h2>Classes</h2>
      ${classBlocks}
      <div class="meta-row"><button class="btn btn-secondary btn-sm" id="add-class">＋ Add class</button>
        <button class="btn btn-secondary btn-sm" id="fill-classes">Fill Line 1 / Line 2 timetable</button></div>

      <h2 style="margin-top:2rem;">Terms</h2>
      <p class="unit-counts">Use your college's dates. A term that starts mid-week (e.g. Thu 28 Jan) simply has fewer lessons in week 1.</p>
      <div class="marking-wrap"><table class="data-table">
        <thead><tr><th>Name</th><th>Start</th><th>End</th><th></th></tr></thead>
        <tbody>${terms.map((t, ti) => `<tr data-ti="${ti}">
          <td><input data-f="name" value="${esc(t.name)}" style="min-width:230px;"></td>
          <td><input type="date" data-f="start_date" value="${esc(t.start_date)}"></td>
          <td><input type="date" data-f="end_date" value="${esc(t.end_date)}"></td>
          <td><button class="btn btn-ghost btn-sm" data-act="del-term">✕</button></td></tr>`).join('')}</tbody></table></div>
      <div class="meta-row" style="margin-top:0.5rem;"><button class="btn btn-secondary btn-sm" id="add-term">＋ Add term</button>
        <button class="btn btn-secondary btn-sm" id="fill-terms">Fill suggested terms (Term 4 2026 – Term 4 2027)</button></div>

      <h2 style="margin-top:2rem;">Closed days (counted as H)</h2>
      <p class="unit-counts">Public holidays and pupil-free days for the whole school. A closed day that isn't a lesson day does nothing.</p>
      <div class="marking-wrap"><table class="data-table">
        <thead><tr><th>Date</th><th>Reason</th><th></th></tr></thead>
        <tbody>${closures.map((c, i) => `<tr data-ci2="${i}">
          <td><input type="date" data-f="day" value="${esc(c.day)}"></td>
          <td><input data-f="label" value="${esc(c.label)}" style="min-width:300px;"></td>
          <td><button class="btn btn-ghost btn-sm" data-act="del-closure">✕</button></td></tr>`).join('') || '<tr><td colspan="3"><em>None yet.</em></td></tr>'}</tbody></table></div>
      <div class="meta-row" style="margin-top:0.5rem;"><button class="btn btn-secondary btn-sm" id="add-closure">＋ Add closed day</button></div>
      <div class="card" style="margin-top:1rem;">
        <h4>Suggested Tasmanian public holidays (2027)</h4>
        <p class="unit-counts">Only dates falling on a lesson day (Mon/Wed/Fri) are listed. The first five are confirmed; the last two are marked "confirm" because they depend on your college. ANZAC Day 2027 is a Sunday with no weekday substitute. No 2026 Term 4 holidays fall on a lesson day. Pupil-free days are school-specific — add yours above.</p>
        ${SUGGESTED_CLOSURES.map(s => `<label class="crit-check"><input type="checkbox" data-sug="${esc(s.day)}" ${closures.some(c => c.day === s.day) ? 'checked disabled' : (s.sure ? 'checked' : '')}><span>${esc(shortDay(s.day))} ${parseDay(s.day).getFullYear()} — ${esc(s.label)}</span></label>`).join('')}
        <button class="btn btn-secondary btn-sm" id="add-sug" style="margin-top:0.5rem;">Add ticked dates</button>
      </div>`;
  }

  body.addEventListener('input', e => {
    const f = e.target.dataset.f; if (!f) return;
    const clsEl = e.target.closest('[data-ci]'), pr = e.target.closest('[data-pi]');
    const tr = e.target.closest('[data-ti]'), cr = e.target.closest('[data-ci2]');
    if (clsEl && pr) { const p = classes[+clsEl.dataset.ci].pattern[+pr.dataset.pi]; p[f] = f === 'dow' ? +e.target.value : e.target.value; }
    else if (clsEl) classes[+clsEl.dataset.ci][f] = e.target.value;
    else if (tr) terms[+tr.dataset.ti][f] = e.target.value;
    else if (cr) closures[+cr.dataset.ci2][f] = e.target.value;
  });
  body.addEventListener('change', e => {
    const sid = e.target.dataset.sid; if (!sid) return;
    const ci = +e.target.closest('[data-ci]').dataset.ci, c = classes[ci];
    if (e.target.checked) { for (const o of classes) roster[o.id]?.delete(sid); (roster[c.id] ||= new Set()).add(sid); }
    else roster[c.id]?.delete(sid);
    paint();
  });
  body.addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    const clsEl = e.target.closest('[data-ci]'), pr = e.target.closest('[data-pi]');
    if (act === 'add-lesson') { const c = classes[+clsEl.dataset.ci]; (c.pattern ||= []).push({ dow: 1, period: '', slot: nextSlot(c) }); paint(); }
    else if (act === 'del-lesson') { classes[+clsEl.dataset.ci].pattern.splice(+pr.dataset.pi, 1); paint(); }
    else if (act === 'del-class') {
      const c = classes[+clsEl.dataset.ci];
      if (!confirm(`Delete ${c.name}? Its attendance records are deleted when you save.`)) return;
      classes.splice(+clsEl.dataset.ci, 1); paint();
    }
    else if (act === 'del-term') { terms.splice(+e.target.closest('[data-ti]').dataset.ti, 1); paint(); }
    else if (act === 'del-closure') { closures.splice(+e.target.closest('[data-ci2]').dataset.ci2, 1); paint(); }
    else if (e.target.id === 'add-class') {
      let id = slug('class'), n = 1; while (classes.some(c => c.id === id)) id = slug('class') + (++n);
      classes.push({ id, name: 'New class', pattern: [], sort: classes.length + 1 }); roster[id] = new Set(); paint();
    }
    else if (e.target.id === 'fill-classes') {
      for (const d of DEFAULT_CLASSES) if (!classes.some(c => c.id === d.id)) { classes.push(JSON.parse(JSON.stringify(d))); roster[d.id] = new Set(); }
      paint();
    }
    else if (e.target.id === 'add-term') { terms.push({ id: 't' + Date.now().toString(36), year: new Date().getFullYear(), number: terms.length + 1, name: 'New term', start_date: todayStr(), end_date: todayStr() }); paint(); }
    else if (e.target.id === 'fill-terms') { for (const d of DEFAULT_TERMS) if (!terms.some(t => t.id === d.id)) terms.push({ ...d }); terms.sort((a, b) => a.start_date.localeCompare(b.start_date)); paint(); }
    else if (e.target.id === 'add-closure') { closures.push({ day: todayStr(), label: '' }); paint(); }
    else if (e.target.id === 'add-sug') {
      body.querySelectorAll('[data-sug]:checked:not(:disabled)').forEach(cb => {
        const s = SUGGESTED_CLOSURES.find(x => x.day === cb.dataset.sug);
        if (s && !closures.some(c => c.day === s.day)) closures.push({ day: s.day, label: s.label.replace(/ — confirm.*/, '') });
      });
      closures.sort((a, b) => a.day.localeCompare(b.day)); paint();
    }
  });

  document.getElementById('set-save').addEventListener('click', async (e) => {
    const bad = terms.find(t => !t.start_date || !t.end_date || t.end_date < t.start_date);
    if (bad) { toast(`Check the dates for “${bad.name}”.`, 'error'); return; }
    if (classes.some(c => !c.name.trim())) { toast('Every class needs a name.', 'error'); return; }
    if (closures.some(c => !c.day)) { toast('Every closed day needs a date.', 'error'); return; }
    e.target.disabled = true;
    try {
      for (const id of originalClassIds) if (!classes.some(c => c.id === id)) await api.attDeleteClass(id);
      for (const [i, c] of classes.entries()) {
        c.sort = i + 1;
        c.pattern = (c.pattern || []).map(p => ({ ...p, period: (p.period || '').trim() }));
        await api.attSaveClass(c);
      }
      for (const c of classes) await api.attSetClassStudents(c.id, [...(roster[c.id] || [])]);
      terms.forEach((t, i) => { t.year = parseDay(t.start_date).getFullYear(); t.number = t.number || i + 1; });
      await api.attSaveTerms(terms);
      await api.attSaveClosures(closures.filter(c => c.day));
      toast('Attendance setup saved.', 'success');
      navigate('/teach/attendance');
    } catch (err) { toast(err.message, 'error'); e.target.disabled = false; }
  });
  paint();
}

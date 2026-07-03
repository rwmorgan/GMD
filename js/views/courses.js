/* Assessment views: overview, per-course criteria pages, and the
   live coverage matrix (criterion + element level, gap flags). */

import { render, esc, spinner, badge, courseBadgeClass } from '../ui.js';
import { getCurriculum, coverageMatrix, criterionLabel } from '../store.js';
import { api } from '../api.js';

const COURSE_ACCENT = { ESC205114: 'teal', ICT205114: 'amber', PRJ205118: 'purple' };

export async function assessmentView() {
  render(spinner());
  const cur = await getCurriculum();
  const { gaps } = coverageMatrix(cur);
  render(`
<div class="page-header">
  <div class="container">
    <div class="breadcrumb"><a href="#/">Home</a> › Assessment</div>
    <h1>Assessment <span class="text-teal">Overview</span></h1>
    <p class="lead">Three TASC courses, ${cur.criteria.length} criteria, ${cur.elements.length} standard elements — every one mapped to the tasks that assess it.</p>
  </div>
</div>
<section class="section">
  <div class="container">
    <div class="grid grid-3">
      ${cur.courses.map(c => `
        <a class="card card-link" href="#/courses/${esc(c.id)}">
          <span class="badge badge-${esc(c.id.slice(0, 3).toLowerCase())}">${esc(c.id)}</span>
          <h3>${esc(c.title)}</h3>
          <p>${cur.criteria.filter(x => x.course_id === c.id).length} criteria · ${c.points} TCE points · Awards: ${esc(c.awards)}</p>
          <span class="card-cta">Criteria detail →</span>
        </a>`).join('')}
    </div>
    <div class="card" style="margin-top:2rem;">
      <h3>📊 Coverage guarantee</h3>
      <p>Every criterion is assessed by <strong>at least two tasks</strong> and every standard element by <strong>at least one</strong> — verified live from the task mappings.</p>
      <p>${gaps.length === 0
        ? '<span class="chip chip-marked">✓ All coverage requirements currently met</span>'
        : `<span class="chip chip-submitted">⚠ ${gaps.length} gap${gaps.length === 1 ? '' : 's'} flagged — see matrix</span>`}</p>
      <a class="btn btn-secondary" href="#/matrix">Open the coverage matrix →</a>
    </div>
  </div>
</section>`, { title: 'Assessment' });
}

export async function courseView({ id }) {
  render(spinner());
  const cur = await getCurriculum();
  const course = cur.courses.find(c => c.id === id);
  if (!course) { render('<section class="section"><div class="container"><h1>Course not found</h1></div></section>'); return; }
  const accent = COURSE_ACCENT[course.id] || 'teal';
  const crits = cur.criteria.filter(c => c.course_id === course.id).sort((a, b) => a.number - b.number);

  const blocks = crits.map(c => {
    const els = cur.elements.filter(e => e.criterion_id === c.id).sort((a, b) => a.ord - b.ord);
    const cEls = els.filter(e => e.standard === 'C');
    const aEls = els.filter(e => e.standard === 'A');
    const assessedBy = cur.tasks.filter(t => t.criteria.includes(c.id));
    return `
    <div class="criteria-block open">
      <div class="criteria-header"><span class="c-badge">C${c.number}</span><h3>${esc(c.title)}</h3></div>
      <div class="criteria-body">
        <div class="standard-row">
          <div class="standard-col">
            <h5>C — Satisfactory</h5>
            <ul>${cEls.map(e => `<li>${esc(e.text)}</li>`).join('')}</ul>
          </div>
          ${aEls.length ? `
          <div class="standard-col">
            <h5>A — High Standard</h5>
            <ul>${aEls.map(e => `<li>${esc(e.text)}</li>`).join('')}</ul>
          </div>` : ''}
        </div>
        <div class="assessed-in">
          <strong>Assessed in:</strong>
          ${assessedBy.map(t => `<a href="#/task/${encodeURIComponent(t.id)}" class="badge ${courseBadgeClass(c.id)}">${t.type === 'quiz' ? '⚡' : ''}${esc(t.code)}</a>`).join(' ') || '<em>No tasks yet</em>'}
        </div>
      </div>
    </div>`;
  }).join('');

  render(`
<div class="page-header">
  <div class="container">
    <div class="breadcrumb"><a href="#/">Home</a> › <a href="#/assessment">Assessment</a> › ${esc(course.id)}</div>
    <div class="meta-row"><span class="badge badge-${esc(course.id.slice(0, 3).toLowerCase())}">${esc(course.id)}</span></div>
    <h1 style="margin-top:0.75rem;">${esc(course.title)} <span class="text-${accent}">Level ${course.level}</span></h1>
    <p class="lead">${crits.length} criteria · ${course.points} TCE credit points · Awards: ${esc(course.awards)}</p>
    <div class="meta-row">
      <a href="${esc(course.url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">TASC Course Page ↗</a>
      <a href="#/matrix" class="btn btn-secondary btn-sm">Coverage Matrix →</a>
    </div>
  </div>
</div>
<section class="section">
  <div class="container">
    ${course.notes ? `<div class="info-box" style="margin-bottom:2rem;"><p><strong>How ratings work:</strong> ${esc(course.notes)}</p></div>` : ''}
    ${blocks}
  </div>
</section>`, { title: course.id });
}

export async function matrixView() {
  render(spinner('Building matrix…'));
  const cur = await getCurriculum();
  const { perCriterion, perElement, gaps } = coverageMatrix(cur);
  const isTeacher = api.currentUser()?.role === 'teacher';

  const critCols = cur.courses.flatMap(course =>
    cur.criteria.filter(c => c.course_id === course.id).sort((a, b) => a.number - b.number));

  const headGroups = cur.courses.map(course => {
    const n = cur.criteria.filter(c => c.course_id === course.id).length;
    return `<th colspan="${n}" class="mx-course mx-${esc(course.id.slice(0, 3).toLowerCase())}">${esc(course.id)}</th>`;
  }).join('');

  const headCrit = critCols.map(c =>
    `<th class="mx-${esc(c.course_id.slice(0, 3).toLowerCase())}">C${c.number}</th>`).join('');

  const bodyRows = cur.units.map(unit => {
    const unitTasks = cur.tasks.filter(t => t.unit_id === unit.id);
    if (!unitTasks.length) return '';
    const unitHead = `<tr><td class="mx-unit" colspan="${critCols.length + 1}">Unit ${unit.number}: ${esc(unit.title)} (${esc(unit.weeks)})</td></tr>`;
    const rows = unitTasks.map(t => `
      <tr>
        <td class="mx-task"><a href="#/task/${encodeURIComponent(t.id)}">${t.type === 'quiz' ? '⚡' : ''}${esc(t.code)}</a> ${esc(t.title)}${t.published === false ? ' <span class="chip chip-idle">hidden</span>' : ''}</td>
        ${critCols.map(c => t.criteria.includes(c.id)
          ? `<td class="mx-hit mx-hit-${esc(c.course_id.slice(0, 3).toLowerCase())}">✓</td>`
          : '<td></td>').join('')}
      </tr>`).join('');
    return unitHead + rows;
  }).join('');

  const totals = `
    <tr class="mx-total">
      <td>Tasks per criterion</td>
      ${critCols.map(c => {
        const n = perCriterion[c.id].length;
        return `<td class="${n < 2 ? 'mx-gap' : ''}">${n}</td>`;
      }).join('')}
    </tr>
    <tr class="mx-total">
      <td>Minimum met? (≥2 tasks)</td>
      ${critCols.map(c => perCriterion[c.id].length >= 2
        ? '<td class="mx-ok">✓</td>' : '<td class="mx-gap">✗</td>').join('')}
    </tr>`;

  const elementSummary = cur.courses.map(course => {
    const els = cur.elements.filter(e => cur.criteria.some(c => c.id === e.criterion_id && c.course_id === course.id));
    const covered = els.filter(e => perElement[e.id].length >= 1).length;
    return `<div class="element-stat">
      <span class="badge badge-${esc(course.id.slice(0, 3).toLowerCase())}">${esc(course.id)}</span>
      <strong>${covered}/${els.length}</strong> standard elements covered
      ${covered === els.length ? '<span class="mx-ok">✓</span>' : '<span class="mx-gap">⚠</span>'}
    </div>`;
  }).join('');

  const gapPanel = gaps.length ? `
    <div class="warning-box" style="margin-bottom:1.5rem;">
      <h3>⚠ Coverage gaps detected</h3>
      <ul>${gaps.map(g => `<li>${esc(g.text)}</li>`).join('')}</ul>
      ${isTeacher ? '<p>Fix these by editing task mappings in the <a href="#/teach/editor">Task &amp; Quiz Editor</a>.</p>' : ''}
    </div>` : `
    <div class="info-box info-box--ok" style="margin-bottom:1.5rem;">
      <p><strong>✅ Coverage complete.</strong> Every criterion is assessed at least twice and every standard element at least once. This matrix is generated live from the task mappings — if a task changes, gaps are flagged here automatically.</p>
    </div>`;

  render(`
<div class="page-header">
  <div class="container">
    <div class="breadcrumb"><a href="#/">Home</a> › <a href="#/assessment">Assessment</a> › Matrix</div>
    <h1>Coverage <span class="text-teal">Matrix</span></h1>
    <p class="lead">Every task mapped to every criterion across all three TASC courses — computed live. Print it for TASC QA documentation.</p>
  </div>
</div>
<section class="section">
  <div class="container container--wide">
    ${gapPanel}
    <div class="element-stats">${elementSummary}</div>
    <div class="matrix-wrap">
      <table class="matrix-table">
        <thead>
          <tr><th class="mx-task-col">Task</th>${headGroups}</tr>
          <tr><th class="mx-task-col">Unit / Task</th>${headCrit}</tr>
        </thead>
        <tbody>${bodyRows}${totals}</tbody>
      </table>
    </div>
    <div class="unit-nav" style="margin-top:2rem;">
      <span>
        <a href="#/courses/ESC205114" class="btn btn-secondary btn-sm">ESC criteria →</a>
        <a href="#/courses/ICT205114" class="btn btn-secondary btn-sm">ICT criteria →</a>
        <a href="#/courses/PRJ205118" class="btn btn-secondary btn-sm">PRJ criteria →</a>
      </span>
      <button class="btn btn-ghost" onclick="window.print()">🖨 Print matrix</button>
    </div>
  </div>
</section>`, { title: 'Coverage Matrix' });
}

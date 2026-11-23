/* ============================================================
   Structured-form tasks (task.body.form).

   A form task is an ordinary 'submission' task whose body carries a
   form definition, e.g.
     form: {
       entries: 5,            // exact number of entries (fixed form), OR
       min: 3, max: 15,       // a growing log: at least `min`, at most `max`
       shared: true,          // log shared with the developer–tester partner
       needsPartner: true,    // needs a tester assignment before it can be used
       entryLabel: 'Check-in',
       fields: [ { id, label, type, required, ... } ],
     }
   Field types: text, url, date, textarea, select (options[]),
   rating (min/max/labels), checkbox, heading, info, partner.

   Answers live in form_entries (one row per entry). The form is
   "complete" when at least `min` entries have every required field
   filled; the site then records an ordinary submission so the marking
   queue, markbook and late flags work exactly as for uploads.
   ============================================================ */

import { esc } from './ui.js';

const DISPLAY_ONLY = new Set(['heading', 'info', 'partner']);

export const formDef = (task) => task?.body?.form || null;
export const isFormTask = (task) => !!formDef(task);

/* Minimum number of complete entries needed. */
export function formMin(def) { return def.entries ?? def.min ?? 1; }
export function formMax(def) { return def.entries ?? def.max ?? 1; }

function fieldDone(f, v) {
  if (DISPLAY_ONLY.has(f.type) || !f.required) return true;
  if (f.type === 'checkbox') return v === true;
  if (f.type === 'rating') return Number.isInteger(+v) && +v >= (f.min ?? 1) && +v <= (f.max ?? 5);
  return typeof v === 'string' ? v.trim() !== '' : (v !== undefined && v !== null && v !== '');
}

export function entryComplete(def, data) {
  return def.fields.every(f => fieldDone(f, data?.[f.id]));
}

/* entries: this student's own rows for the task. */
export function formProgress(def, entries) {
  const done = entries.filter(e => entryComplete(def, e.data)).length;
  const need = formMin(def);
  return { done, need, complete: done >= need };
}

/* ---------- rendering ---------- */
function fieldHTML(f, value, key, ctx) {
  const id = `${key}-${f.id}`;
  const lab = `<span class="form-label">${esc(f.label || '')}${f.required ? ' <em class="req" title="Required">*</em>' : ''}</span>`;
  const help = f.help ? `<small class="form-help">${esc(f.help)}</small>` : '';
  const v = value ?? '';
  switch (f.type) {
    case 'heading':
      return `<h4 class="form-heading">${esc(f.label)}</h4>${f.help ? `<p class="unit-counts">${esc(f.help)}</p>` : ''}`;
    case 'info':
      return `<div class="info-box"><p>${f.html || ''}</p></div>`;
    case 'partner': {
      const p = ctx.partners || {};
      return `<div class="form-partner">
        <span><strong>You</strong> — developer of your own game: ${esc(ctx.me || 'you')}</span>
        <span><strong>Your tester</strong> (tests your game): ${esc(p.myTester?.tester_name || '—')}</span>
        <span><strong>You test</strong> the game made by: ${esc(p.testing?.developer_name || '—')}</span>
      </div>`;
    }
    case 'textarea':
      return `<label class="field form-field">${lab}<textarea data-f="${esc(f.id)}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea>${help}</label>`;
    case 'select':
      return `<label class="field form-field">${lab}<select data-f="${esc(f.id)}">
        <option value="">— choose —</option>
        ${(f.options || []).map(o => `<option value="${esc(o)}" ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}
      </select>${help}</label>`;
    case 'rating': {
      const min = f.min ?? 1, max = f.max ?? 5;
      const items = [];
      for (let n = min; n <= max; n++) {
        items.push(`<label class="form-rate"><input type="radio" name="${esc(id)}" data-f="${esc(f.id)}" value="${n}" ${+v === n ? 'checked' : ''}><span>${n}</span></label>`);
      }
      return `<div class="field form-field" role="radiogroup" aria-label="${esc(f.label)}">${lab}
        <div class="form-rating">${items.join('')}</div>
        ${f.lowLabel || f.highLabel ? `<small class="form-help">${esc(min)} = ${esc(f.lowLabel || '')} · ${esc(max)} = ${esc(f.highLabel || '')}</small>` : ''}${help}</div>`;
    }
    case 'checkbox':
      return `<label class="crit-check form-check"><input type="checkbox" data-f="${esc(f.id)}" ${v === true ? 'checked' : ''}><span>${esc(f.label)}${f.required ? ' <em class="req" title="Required">*</em>' : ''}</span></label>`;
    default: { // text, url, date
      const type = f.type === 'url' ? 'url' : f.type === 'date' ? 'date' : 'text';
      return `<label class="field form-field">${lab}<input type="${type}" data-f="${esc(f.id)}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}">${help}</label>`;
    }
  }
}

function cardHTML(def, entry, key, ctx, { n, removable }) {
  const data = entry?.data || {};
  const done = entry && entryComplete(def, data);
  const multi = formMax(def) > 1;
  return `
  <div class="form-card ${done ? 'form-card--done' : ''}" data-entry="${n}">
    ${multi ? `<div class="form-card-head"><strong>${esc(def.entryLabel || 'Entry')} ${n}</strong>
      <span class="chip ${done ? 'chip-marked' : 'chip-idle'}">${done ? '✅ Complete' : 'Not finished'}</span>
      ${removable ? `<button type="button" class="btn btn-ghost btn-sm" data-remove="${n}">Delete</button>` : ''}</div>` : ''}
    ${def.fields.map(f => fieldHTML(f, data[f.id], `${key}-${n}`, ctx)).join('')}
  </div>`;
}

/* One panel = one owner's set of entries (the student's own, or — for a
   shared log — the game they are testing). */
export function formPanelHTML(def, { key, owner, title, entries, ctx, readOnly = false, preview = false }) {
  const byNo = new Map(entries.map(e => [e.entry_no, e]));
  const fixed = def.entries != null;
  const nos = fixed
    ? Array.from({ length: def.entries }, (_, i) => i + 1)
    : [...byNo.keys()].sort((a, b) => a - b);
  if (!fixed && !nos.length) nos.push(1);
  const { done, need } = formProgress(def, entries);
  return `
  <div class="form-panel" data-key="${esc(key)}" data-owner="${esc(owner)}" data-max="${formMax(def)}">
    ${title ? `<h3>${esc(title)}</h3>` : ''}
    <p class="unit-counts">${done} of ${need}${fixed ? '' : '+'} ${esc((def.entryLabel || 'entries').toLowerCase())}${need === 1 ? '' : 's'} complete.${def.shared ? ' Both of you can add and edit these.' : ''}</p>
    <div class="form-cards">
      ${nos.map(n => cardHTML(def, byNo.get(n), key, ctx, { n, removable: !fixed && byNo.has(n) })).join('')}
    </div>
    ${readOnly ? '' : `<div class="quiz-actions">
      ${!fixed ? `<button type="button" class="btn btn-secondary" data-add>＋ Add ${esc((def.entryLabel || 'entry').toLowerCase())}</button>` : ''}
      ${preview ? '' : '<button type="button" class="btn btn-primary" data-save>💾 Save</button>'}
    </div>`}
  </div>`;
}

/* Blank card for the "add entry" button (entry number n). */
export function blankCardHTML(def, key, ctx, n) {
  return cardHTML(def, null, key, ctx, { n, removable: false });
}

/* ---------- reading values back ---------- */
export function collectCard(card, def) {
  const data = {};
  for (const f of def.fields) {
    if (DISPLAY_ONLY.has(f.type)) continue;
    if (f.type === 'rating') {
      const r = card.querySelector(`input[data-f="${f.id}"]:checked`);
      if (r) data[f.id] = Number(r.value);
    } else if (f.type === 'checkbox') {
      data[f.id] = !!card.querySelector(`[data-f="${f.id}"]`)?.checked;
    } else {
      const el = card.querySelector(`[data-f="${f.id}"]`);
      data[f.id] = el ? el.value.trim() : '';
    }
  }
  return data;
}

export function cardIsBlank(data) {
  return Object.values(data).every(v => v === '' || v === false || v === undefined);
}

/* ---------- read-only view (teacher marking modal, "View answers") ---------- */
export function entriesReadOnlyHTML(def, entries) {
  if (!entries.length) return '<p class="unit-counts"><em>No answers saved yet.</em></p>';
  const multi = formMax(def) > 1;
  return [...entries].sort((a, b) => a.entry_no - b.entry_no).map(e => `
    <div class="form-card form-card--ro">
      ${e.data?._names ? `<p class="unit-counts">Developer: ${esc(e.data._names.developer || '—')} · Their tester: ${esc(e.data._names.tester || '—')} · Tests the game of: ${esc(e.data._names.testing || '—')}</p>` : ''}
      ${multi ? `<div class="form-card-head"><strong>${esc(def.entryLabel || 'Entry')} ${e.entry_no}</strong></div>` : ''}
      <dl class="form-ro">
        ${def.fields.filter(f => !DISPLAY_ONLY.has(f.type) || f.type === 'heading').map(f => {
          if (f.type === 'heading') return `<dt class="form-ro-head">${esc(f.label)}</dt><dd></dd>`;
          const v = e.data?.[f.id];
          const shown = f.type === 'rating' ? (v ? `${v} / ${f.max ?? 5}` : '—')
            : f.type === 'checkbox' ? (v ? '✔ Yes' : '—')
            : (v === undefined || v === '' ? '—' : String(v));
          return `<dt>${esc(f.label)}</dt><dd>${esc(shown)}</dd>`;
        }).join('')}
      </dl>
    </div>`).join('');
}

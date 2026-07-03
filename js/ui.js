/* Shared UI helpers: escaping, rendering, toasts, modals, confetti,
   scroll reveal, animated counters. */

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Render into #app > main with a fade transition, then run animations. */
export function render(html, { title } = {}) {
  const app = document.getElementById('app');
  app.innerHTML = `<main>${html}</main>`;
  if (title) document.title = `${title} — Level Up`;
  window.scrollTo({ top: 0, behavior: 'instant' });
  const main = app.querySelector('main');
  main.classList.add('page-enter');
  requestAnimationFrame(() => requestAnimationFrame(() => main.classList.add('page-enter-active')));
  initScrollReveal(main);
  initCounters(main);
}

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ---------- Scroll reveal ---------- */
export function initScrollReveal(root = document) {
  if (reducedMotion() || !('IntersectionObserver' in window)) return;
  const els = root.querySelectorAll('.card, .unit-card, .task-block, .criteria-block, .stat-card, .q-card, section .container > h2');
  els.forEach(el => {
    el.classList.add('reveal');
    const idx = Array.prototype.indexOf.call(el.parentElement.children, el);
    if (idx > 0) el.classList.add('reveal-delay-' + Math.min(idx % 4, 3));
  });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ---------- Animated stat counters (elements with data-count) ---------- */
export function initCounters(root = document) {
  const els = root.querySelectorAll('[data-count]');
  if (!els.length) return;
  const animate = el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reducedMotion()) { el.textContent = target + suffix; return; }
    const dur = 900;
    const t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!('IntersectionObserver' in window)) { els.forEach(animate); return; }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.4 });
  els.forEach(el => obs.observe(el));
}

/* ---------- Toasts ---------- */
export function toast(message, kind = 'info', ms = 3500) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="toast-icon">${kind === 'success' ? '✅' : kind === 'error' ? '⚠️' : 'ℹ️'}</span><span>${esc(message)}</span>`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, ms);
}

/* ---------- Modal ---------- */
export function openModal(html, { onClose } = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" data-close="1">
      <div class="modal" role="dialog" aria-modal="true">
        <button class="modal-x" data-close="1" aria-label="Close">✕</button>
        ${html}
      </div>
    </div>`;
  const backdrop = root.firstElementChild;
  requestAnimationFrame(() => backdrop.classList.add('open'));
  const close = () => {
    backdrop.classList.remove('open');
    setTimeout(() => { root.innerHTML = ''; onClose && onClose(); }, 220);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  backdrop.addEventListener('click', e => {
    if (e.target.dataset.close) close();
  });
  const focusable = backdrop.querySelector('input, select, textarea, button:not(.modal-x)');
  if (focusable) focusable.focus();
  return { close, el: backdrop };
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  const backdrop = root.firstElementChild;
  if (backdrop) { backdrop.classList.remove('open'); setTimeout(() => { root.innerHTML = ''; }, 220); }
}

/* ---------- Confetti (canvas, transform-cheap, reduced-motion aware) ---------- */
export function confetti({ count = 140, duration = 1800 } = {}) {
  if (reducedMotion()) return;
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
  const colors = ['#38BDF8', '#818CF8', '#C084FC', '#F59E0B', '#22C55E', '#F1F5F9'];
  const parts = Array.from({ length: count }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5,
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -6 - Math.random() * 10,
    s: 4 + Math.random() * 6,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  const tick = now => {
    const t = now - t0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - t / duration);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(tick);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
  };
  requestAnimationFrame(tick);
}

/* ---------- Small builders ---------- */
export function badge(text, cls = '') {
  return `<span class="badge ${cls}">${esc(text)}</span>`;
}

export function courseBadgeClass(courseId) {
  if (!courseId) return '';
  if (courseId.startsWith('ESC')) return 'badge-esc';
  if (courseId.startsWith('ICT')) return 'badge-ict';
  return 'badge-prj';
}

export function statusChip(status) {
  const map = {
    not_started: ['Not started', 'chip-idle'],
    in_progress: ['In progress', 'chip-progress'],
    submitted: ['Submitted', 'chip-submitted'],
    marked: ['Marked', 'chip-marked'],
  };
  const [label, cls] = map[status] || map.not_started;
  return `<span class="chip ${cls}">${label}</span>`;
}

export function progressBar(pct, { label = '', xp = false } = {}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return `
    <div class="pbar ${xp ? 'pbar-xp' : ''}" role="progressbar" aria-valuenow="${clamped}" aria-valuemin="0" aria-valuemax="100" ${label ? `aria-label="${esc(label)}"` : ''}>
      <div class="pbar-fill" style="width:${clamped}%"></div>
      <span class="pbar-label">${clamped}%</span>
    </div>`;
}

export function spinner(text = 'Loading…') {
  return `<div class="page-loading" role="status"><div class="loading-hex">⬡</div><p>${esc(text)}</p></div>`;
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

/* CSV download helper */
export function downloadCSV(filename, rows) {
  const escCell = v => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = rows.map(r => r.map(escCell).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

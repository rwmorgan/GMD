/* ============================================================
   LEVEL UP — Game Design & Digital Technology
   Shared JavaScript · v2 — nav/footer injection, scroll reveal,
   3D card tilt, accordions, tabs. Relative-path safe (works
   when opened locally from any subfolder).
   ============================================================ */

/* Detect how deep we are and set the root prefix accordingly.
   Root pages (index.html, gallery.html, contact.html) → prefix = ""
   Subfolders (units/, resources/, assessment/)          → prefix = "../"  */
function getRoot() {
  const path = window.location.pathname;
  const inSub = path.includes('/units/') || path.includes('/resources/') || path.includes('/assessment/');
  return inSub ? '../' : '';
}

function navHTML() {
  const r = getRoot();
  return `
<nav id="site-nav">
  <div class="nav-inner">
    <a class="nav-logo" href="${r}index.html">
      <span class="logo-mark">⬡</span> Level <span>Up</span>
    </a>
    <ul class="nav-links" id="nav-links">
      <li class="has-dropdown">
        <button onclick="toggleDropdown(this)">Units <span class="chevron">▾</span></button>
        <ul class="nav-dropdown">
          <li><a href="${r}index.html#/units/1"><span class="badge-dot" style="background:#0EA5E9;"></span> Unit 1: Computers &amp; Digital Foundations</a></li>
          <li><a href="${r}index.html#/units/2"><span class="badge-dot" style="background:#0EA5E9;"></span> Unit 2: Reviewing Games</a></li>
          <li><a href="${r}index.html#/units/3"><span class="badge-dot" style="background:#0EA5E9;"></span> Unit 3: Game Engines</a></li>
          <li><a href="${r}index.html#/units/4"><span class="badge-dot" style="background:#0EA5E9;"></span> Unit 4: Design &amp; Digital Citizenship</a></li>
          <li><a href="${r}index.html#/units/5"><span class="badge-dot" style="background:#A855F7;"></span> Unit 5: Major Project</a></li>
          <li><a href="${r}index.html#/units">↗ All Units Overview</a></li>
        </ul>
      </li>
      <li class="has-dropdown">
        <button onclick="toggleDropdown(this)">Resources <span class="chevron">▾</span></button>
        <ul class="nav-dropdown">
          <li><a href="${r}resources/tutorials.html">🎓 Tutorials Hub</a></li>
          <li><a href="${r}resources/unity.html">🎮 Unity</a></li>
          <li><a href="${r}resources/unreal.html">🔷 Unreal Engine</a></li>
          <li><a href="${r}resources/gms2.html">🟡 GameMaker Studio 2</a></li>
          <li><a href="${r}resources/adobe.html">🅰 Adobe Suite</a></li>
          <li><a href="${r}resources/microsoft.html">🟦 Microsoft Office</a></li>
          <li><a href="${r}resources/research.html">📚 Research &amp; References</a></li>
          <li><a href="${r}resources/index.html">↗ All Resources</a></li>
        </ul>
      </li>
      <li class="has-dropdown">
        <button onclick="toggleDropdown(this)">Assessment <span class="chevron">▾</span></button>
        <ul class="nav-dropdown">
          <li><a href="${r}index.html#/courses/ICT205114"><span class="badge-dot" style="background:#F59E0B;"></span> ICT205114 – Computer Applications</a></li>
          <li><a href="${r}index.html#/courses/ESC205114"><span class="badge-dot" style="background:#0EA5E9;"></span> ESC205114 – Essential Skills</a></li>
          <li><a href="${r}index.html#/courses/PRJ205118"><span class="badge-dot" style="background:#A855F7;"></span> PRJ205118 – Project Implementation</a></li>
          <li><a href="${r}index.html#/matrix">📊 Coverage Matrix</a></li>
          <li><a href="${r}index.html#/assessment">↗ Assessment Overview</a></li>
        </ul>
      </li>
      <li><a href="${r}resources/tutorials.html">Tutorials</a></li>
      <li><a href="${r}gallery.html">Gallery</a></li>
      <li><a href="${r}contact.html">Contact</a></li>
    </ul>
    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" onclick="toggleMobileNav()">☰</button>
  </div>
</nav>`;
}

function footerHTML() {
  const r = getRoot();
  return `
<footer id="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div style="font-family:var(--font-head);font-weight:700;font-size:1.05rem;display:flex;align-items:center;gap:0.5rem;">
        <span style="color:var(--teal)">⬡</span> Level <span style="color:var(--teal)">Up</span>
      </div>
      <p>Game Design &amp; Digital Technology<br>Years 11–12 · Tasmania</p>
      <p style="margin-top:0.75rem;font-size:0.78rem;">Aligned to TASC courses ICT205114, ESC205114 and PRJ205118.</p>
    </div>
    <div class="footer-col">
      <h4>Units</h4>
      <ul>
        <li><a href="${r}index.html#/units/1">1 · Computers &amp; Digital Foundations</a></li>
        <li><a href="${r}index.html#/units/2">2 · Reviewing Games</a></li>
        <li><a href="${r}index.html#/units/3">3 · Game Engines</a></li>
        <li><a href="${r}index.html#/units/4">4 · Design &amp; Digital Citizenship</a></li>
        <li><a href="${r}index.html#/units/5">5 · Major Project</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Assessment</h4>
      <ul>
        <li><a href="${r}index.html#/courses/ICT205114">ICT205114</a></li>
        <li><a href="${r}index.html#/courses/ESC205114">ESC205114</a></li>
        <li><a href="${r}index.html#/courses/PRJ205118">PRJ205118</a></li>
        <li><a href="${r}index.html#/matrix">Coverage Matrix</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Resources</h4>
      <ul>
        <li><a href="${r}resources/tutorials.html">Tutorials Hub</a></li>
        <li><a href="${r}resources/unity.html">Unity</a></li>
        <li><a href="${r}resources/unreal.html">Unreal Engine</a></li>
        <li><a href="${r}resources/gms2.html">GameMaker Studio 2</a></li>
        <li><a href="${r}resources/research.html">Research &amp; Ethics</a></li>
        <li><a href="${r}gallery.html">Student Gallery</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© 2026 Game Design &amp; Digital Technology · Tasmania</p>
    <p>TASC courses are the property of the Tasmanian Assessment, Standards and Certification.</p>
  </div>
</footer>`;
}

/* ---------- Inject Nav & Footer ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', navHTML());
  document.body.insertAdjacentHTML('beforeend', footerHTML());

  // Highlight active nav link
  const currentFile = window.location.pathname.split('/').pop();
  document.querySelectorAll('#site-nav a').forEach(link => {
    const linkFile = link.getAttribute('href') ? link.getAttribute('href').split('/').pop() : '';
    if (linkFile && linkFile === currentFile) link.classList.add('active');
  });

  initTaskAccordions();
  initCriteriaAccordions();
  initTabs();
  initScrollReveal();
  initCardTilt();
  initSpotlight();

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-dropdown')) {
      document.querySelectorAll('.has-dropdown').forEach(el => el.classList.remove('open'));
    }
  });
});

/* ---------- Dropdown Toggle ---------- */
function toggleDropdown(btn) {
  const li = btn.closest('.has-dropdown');
  const isOpen = li.classList.contains('open');
  document.querySelectorAll('.has-dropdown').forEach(el => el.classList.remove('open'));
  if (!isOpen) li.classList.add('open');
}

/* ---------- Mobile Nav ---------- */
function toggleMobileNav() {
  const links = document.getElementById('nav-links');
  const toggle = document.getElementById('nav-toggle');
  links.classList.toggle('mobile-open');
  toggle.textContent = links.classList.contains('mobile-open') ? '✕' : '☰';
}

/* ---------- Scroll Reveal ----------
   Auto-tags common card/section elements so every page gets
   entrance animations without editing any HTML. */
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const selectors = [
    '.card', '.unit-card', '.resource-card', '.gallery-card',
    '.task-block', '.criteria-block', '.timeline-item', '.tool-chip',
    'section .container > h2', '.page-header h1'
  ];
  const els = document.querySelectorAll(selectors.join(','));

  els.forEach((el, i) => {
    el.classList.add('reveal');
    // stagger siblings inside the same grid for a cascade effect
    const idx = Array.prototype.indexOf.call(el.parentElement.children, el);
    if (idx > 0) el.classList.add('reveal-delay-' + Math.min(idx % 4, 3));
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

  els.forEach(el => obs.observe(el));
}

/* ---------- 3D Card Tilt ----------
   Pointer-tracked perspective tilt on cards. Skipped on touch
   devices and when reduced motion is preferred. */
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

  const MAX_DEG = 7;
  document.querySelectorAll('.unit-card, .resource-card, .card-link, .gallery-card').forEach(card => {
    card.classList.add('tilt');

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        'perspective(700px) rotateX(' + (-py * MAX_DEG).toFixed(2) + 'deg)' +
        ' rotateY(' + (px * MAX_DEG).toFixed(2) + 'deg) translateY(-4px)';
      card.style.transition = 'transform 0.06s linear';
    });

    card.addEventListener('pointerleave', () => {
      card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.65, 0.3, 1)';
      card.style.transform = '';
    });
  });
}

/* ---------- Spotlight hover (resource cards) ---------- */
function initSpotlight() {
  document.querySelectorAll('.resource-card').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
  });
}

/* ---------- Task Accordions ---------- */
function initTaskAccordions() {
  document.querySelectorAll('.task-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.task-block').classList.toggle('open');
    });
  });
  const first = document.querySelector('.task-block');
  if (first) first.classList.add('open');
}

/* ---------- Criteria Accordions ---------- */
function initCriteriaAccordions() {
  document.querySelectorAll('.criteria-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.criteria-block').classList.toggle('open');
    });
  });
  document.querySelectorAll('.criteria-block').forEach(b => b.classList.add('open'));
}

/* ---------- Tabs ---------- */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group || 'default';
      const target = btn.dataset.tab;
      document.querySelectorAll(`.tab-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`.tab-panel[data-group="${group}"]`).forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.querySelector(`.tab-panel[data-group="${group}"][data-tab="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });
  const groups = new Set();
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const g = btn.dataset.group || 'default';
    if (!groups.has(g)) { groups.add(g); btn.click(); }
  });
}

function filterMatrix(course) {
  document.querySelectorAll('.matrix-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.course === course);
  });
  document.querySelectorAll('.matrix-row').forEach(row => {
    const phase = row.dataset.phase || '';
    row.style.display = (course === 'all' || phase === course || phase === 'both') ? '' : 'none';
  });
}

function printTask(taskId) {
  const task = document.getElementById(taskId);
  if (task) task.classList.add('open');
  setTimeout(() => window.print(), 100);
}

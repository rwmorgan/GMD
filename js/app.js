/* ============================================================
   LEVEL UP LMS — app entry: nav, routes, auth guards.
   ============================================================ */

import { IS_DEMO } from './config.js';
import { api } from './api.js';
import { route, setNotFound, setBeforeEach, startRouter, navigate } from './router.js';
import { render, esc, toast } from './ui.js';
import { invalidate } from './store.js';

import { homeView } from './views/home.js';
import { unitsView, unitView } from './views/units.js';
import { taskView } from './views/task.js';
import { courseView, matrixView, assessmentView } from './views/courses.js';
import { loginView, signupView, enrolView } from './views/auth.js';
import { dashboardView, progressView } from './views/dashboard.js';
import { teacherHomeView, markingView, analysisView, studentsView, settingsView, editorListView, editorView } from './views/teacher.js';

/* ---------- navigation ---------- */
function navHTML() {
  const user = api.currentUser();
  const teacher = user?.role === 'teacher';
  return `
<nav id="site-nav" aria-label="Main">
  <div class="nav-inner">
    <a class="nav-logo" href="#/"><span class="logo-mark">⬡</span> Level <span>Up</span></a>
    <ul class="nav-links" id="nav-links">
      <li class="has-dropdown">
        <button aria-haspopup="true" data-dd>Units <span class="chevron">▾</span></button>
        <ul class="nav-dropdown">
          <li><a href="#/units/1"><span class="badge-dot" style="background:var(--teal);"></span> 1 · Digital Foundations</a></li>
          <li><a href="#/units/2"><span class="badge-dot" style="background:var(--teal);"></span> 2 · Game Design &amp; Docs</a></li>
          <li><a href="#/units/3"><span class="badge-dot" style="background:var(--teal);"></span> 3 · Asset Creation</a></li>
          <li><a href="#/units/4"><span class="badge-dot" style="background:var(--teal);"></span> 4 · Game Prototype</a></li>
          <li><a href="#/units/5"><span class="badge-dot" style="background:var(--teal);"></span> 5 · Showcase &amp; Review</a></li>
          <li><a href="#/units/6"><span class="badge-dot" style="background:var(--purple);"></span> 6 · Full Game Project</a></li>
          <li><a href="#/units">↗ All Units</a></li>
        </ul>
      </li>
      <li class="has-dropdown">
        <button aria-haspopup="true" data-dd>Assessment <span class="chevron">▾</span></button>
        <ul class="nav-dropdown">
          <li><a href="#/courses/ESC205114"><span class="badge-dot" style="background:var(--teal);"></span> ESC205114 – Essential Skills</a></li>
          <li><a href="#/courses/ICT205114"><span class="badge-dot" style="background:var(--amber);"></span> ICT205114 – Computer Applications</a></li>
          <li><a href="#/courses/PRJ205118"><span class="badge-dot" style="background:var(--purple);"></span> PRJ205118 – Project Implementation</a></li>
          <li><a href="#/matrix">📊 Coverage Matrix</a></li>
          <li><a href="#/assessment">↗ Assessment Overview</a></li>
        </ul>
      </li>
      <li class="has-dropdown">
        <button aria-haspopup="true" data-dd>Resources <span class="chevron">▾</span></button>
        <ul class="nav-dropdown">
          <li><a href="resources/tutorials.html">🎓 Tutorials Hub</a></li>
          <li><a href="resources/unity.html">🎮 Unity</a></li>
          <li><a href="resources/unreal.html">🔷 Unreal Engine</a></li>
          <li><a href="resources/gms2.html">🟡 GameMaker Studio 2</a></li>
          <li><a href="resources/adobe.html">🅰 Adobe Suite</a></li>
          <li><a href="resources/microsoft.html">🟦 Microsoft Office</a></li>
          <li><a href="resources/research.html">📚 Research &amp; References</a></li>
        </ul>
      </li>
      <li><a href="gallery.html">Gallery</a></li>
      ${user ? `<li><a href="#/dashboard">My Dashboard</a></li>` : ''}
      ${teacher ? `<li class="has-dropdown">
        <button aria-haspopup="true" data-dd class="nav-teach">Teach <span class="chevron">▾</span></button>
        <ul class="nav-dropdown">
          <li><a href="#/teach">🏫 Class Overview</a></li>
          <li><a href="#/teach/marking">📝 Marking Queue</a></li>
          <li><a href="#/matrix">📊 Coverage Matrix</a></li>
          <li><a href="#/teach/analysis">📈 Quiz Item Analysis</a></li>
          <li><a href="#/teach/editor">🛠 Task &amp; Quiz Editor</a></li>
          <li><a href="#/teach/students">👥 Students</a></li>
          <li><a href="#/teach/settings">⚙️ Settings &amp; Export</a></li>
        </ul>
      </li>` : ''}
    </ul>
    <div class="nav-auth">
      ${user
        ? `<div class="has-dropdown user-menu">
             <button aria-haspopup="true" data-dd><span class="avatar">${esc(user.name.slice(0, 1))}</span> ${esc(user.name)} <span class="chevron">▾</span></button>
             <ul class="nav-dropdown nav-dropdown--right">
               <li><a href="#/dashboard">📊 My Dashboard</a></li>
               <li><a href="#/progress">🗺️ My Progress</a></li>
               <li><button data-signout>↩ Sign out</button></li>
             </ul>
           </div>`
        : `<a class="btn btn-primary btn-sm" href="#/login">Sign in</a>`}
      <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">☰</button>
    </div>
  </div>
</nav>
${IS_DEMO ? `<div class="demo-banner" role="note"><strong>Demo mode</strong> — no backend connected; sample accounts only, data stays in this browser. See the README to connect Supabase.</div>` : ''}`;
}

function footerHTML() {
  return `
<footer id="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo"><span style="color:var(--teal)">⬡</span> Level <span style="color:var(--teal)">Up</span></div>
      <p>Game Design &amp; Digital Technology<br>Years 11–12 · Tasmania</p>
      <p class="footer-fine">Aligned to TASC courses ICT205114, ESC205114 and PRJ205118.</p>
    </div>
    <div class="footer-col">
      <h4>Units</h4>
      <ul>
        <li><a href="#/units/1">1 · Digital Foundations</a></li>
        <li><a href="#/units/2">2 · Game Design &amp; Docs</a></li>
        <li><a href="#/units/3">3 · Asset Creation</a></li>
        <li><a href="#/units/4">4 · Game Prototype</a></li>
        <li><a href="#/units/5">5 · Showcase &amp; Review</a></li>
        <li><a href="#/units/6">6 · Full Game Project</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Assessment</h4>
      <ul>
        <li><a href="#/courses/ESC205114">ESC205114</a></li>
        <li><a href="#/courses/ICT205114">ICT205114</a></li>
        <li><a href="#/courses/PRJ205118">PRJ205118</a></li>
        <li><a href="#/matrix">Coverage Matrix</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Resources</h4>
      <ul>
        <li><a href="resources/tutorials.html">Tutorials Hub</a></li>
        <li><a href="resources/unity.html">Unity</a></li>
        <li><a href="resources/gms2.html">GameMaker Studio 2</a></li>
        <li><a href="resources/research.html">Research &amp; Ethics</a></li>
        <li><a href="gallery.html">Student Gallery</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© 2026 Game Design &amp; Digital Technology · Tasmania</p>
    <p>TASC course criteria are the property of the Office of Tasmanian Assessment, Standards and Certification.</p>
  </div>
</footer>`;
}

function mountChrome() {
  document.querySelector('#site-nav')?.remove();
  document.querySelector('.demo-banner')?.remove();
  document.querySelector('#site-footer')?.remove();
  document.body.insertAdjacentHTML('afterbegin', navHTML());
  document.body.insertAdjacentHTML('beforeend', footerHTML());

  const nav = document.getElementById('site-nav');
  nav.addEventListener('click', async (e) => {
    const dd = e.target.closest('[data-dd]');
    if (dd) {
      const li = dd.closest('.has-dropdown');
      const wasOpen = li.classList.contains('open');
      nav.querySelectorAll('.has-dropdown').forEach(el => el.classList.remove('open'));
      if (!wasOpen) li.classList.add('open');
      return;
    }
    if (e.target.closest('[data-signout]')) {
      await api.signOut();
      invalidate({ curriculum: true, state: true });
      toast('Signed out. See you next lesson!', 'info');
      navigate('/');
      return;
    }
    if (e.target.closest('a')) {
      nav.querySelectorAll('.has-dropdown').forEach(el => el.classList.remove('open'));
      document.getElementById('nav-links').classList.remove('mobile-open');
    }
  });
  document.getElementById('nav-toggle').addEventListener('click', () => {
    const links = document.getElementById('nav-links');
    const btn = document.getElementById('nav-toggle');
    links.classList.toggle('mobile-open');
    const open = links.classList.contains('mobile-open');
    btn.textContent = open ? '✕' : '☰';
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-dropdown')) {
      nav.querySelectorAll('.has-dropdown').forEach(el => el.classList.remove('open'));
    }
  });
}

/* ---------- routes ---------- */
function requireAuth(view) {
  return (params) => {
    if (api.mode === 'live' && api.profileMissing && api.user) return enrolView();
    if (!api.currentUser()) { navigate('/login'); return; }
    return view(params);
  };
}

function requireTeacher(view) {
  return (params) => {
    const u = api.currentUser();
    if (!u) { navigate('/login'); return; }
    if (u.role !== 'teacher') { toast('Teacher access only.', 'error'); navigate('/dashboard'); return; }
    return view(params);
  };
}

route('/', homeView);
route('/units', unitsView);
route('/units/:n', unitView);
route('/task/:id', taskView);
route('/assessment', assessmentView);
route('/courses/:id', courseView);
route('/matrix', matrixView);
route('/login', loginView);
route('/signup', signupView);
route('/enrol', enrolView);
route('/dashboard', requireAuth(dashboardView));
route('/progress', requireAuth(progressView));
route('/teach', requireTeacher(teacherHomeView));
route('/teach/marking', requireTeacher(markingView));
route('/teach/analysis', requireTeacher(analysisView));
route('/teach/students', requireTeacher(studentsView));
route('/teach/settings', requireTeacher(settingsView));
route('/teach/editor', requireTeacher(editorListView));
route('/teach/editor/:id', requireTeacher(editorView));

setNotFound(() => {
  render(`
    <section class="section" style="text-align:center;">
      <div class="container">
        <h1 style="font-size:5rem;">4<span class="text-gradient">0</span>4</h1>
        <p class="lead">That page doesn't exist — maybe it fell off the level.</p>
        <a class="btn btn-primary" href="#/">Respawn at Home →</a>
      </div>
    </section>`, { title: 'Not found' });
});

/* ---------- boot ---------- */
(async function boot() {
  try {
    await api.init();
  } catch (err) {
    render(`
      <section class="section"><div class="container">
        <h1>Can't reach the server</h1>
        <p class="lead">${esc(err.message)}</p>
        <p>If this is a new setup, check the Supabase URL and key in <code>js/config.js</code>. If the site was working yesterday, the free-tier project may be paused — open the Supabase dashboard to resume it.</p>
      </div></section>`, { title: 'Connection problem' });
    return;
  }
  mountChrome();
  api.onAuthChange(() => mountChrome());
  startRouter();
})();

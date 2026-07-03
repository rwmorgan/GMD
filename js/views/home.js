/* Home: animated hero, stats, course cards, how-it-works. */

import { api } from '../api.js';
import { render } from '../ui.js';

const FLOATERS = ['🎮', '🕹️', '👾', '🧩', '⭐', '🏆', '💎', '🔊'];

export function homeView() {
  const user = api.currentUser();
  render(`
<section class="hero section--lg">
  <div class="hero-bg" aria-hidden="true">
    ${FLOATERS.map((f, i) => `<span class="floater floater-${i + 1}">${f}</span>`).join('')}
    <div class="hero-glow hero-glow-1"></div>
    <div class="hero-glow hero-glow-2"></div>
  </div>
  <div class="container">
    <div class="tag">Years 11 &amp; 12 · Tasmania · TASC Accredited</div>
    <h1>Design it. Build it. <em>Ship it.</em></h1>
    <p class="lead">Game Design &amp; Digital Technology — a full-year course where you go from zero to a finished, playable game using the same engines the industry uses: Unity, Unreal Engine and GameMaker Studio 2.</p>
    <div class="hero-actions">
      ${user
        ? `<a href="#/dashboard" class="btn btn-primary btn-lg">Continue your quest →</a>`
        : `<a href="#/signup" class="btn btn-primary btn-lg">Join the class →</a>
           <a href="#/login" class="btn btn-secondary btn-lg">Sign in</a>`}
      <a href="#/units" class="btn btn-ghost btn-lg">Browse units</a>
    </div>
    <div class="hero-stats">
      <div class="stat"><b data-count="34">0</b><span>Weeks</span></div>
      <div class="stat"><b data-count="6">0</b><span>Units</span></div>
      <div class="stat"><b data-count="35" data-suffix="">0</b><span>Tasks &amp; Quizzes</span></div>
      <div class="stat"><b data-count="3">0</b><span>TASC Courses</span></div>
      <div class="stat"><b data-count="15">0</b><span>TCE Points</span></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2>Three courses. One game. <span class="text-gradient">Fifteen points.</span></h2>
    <div class="grid grid-3" style="margin-top:2rem;">
      <a class="card card-link" href="#/courses/ESC205114">
        <span class="badge badge-esc">ESC205114</span>
        <h3>Essential Skills</h3>
        <p>Using computers and the internet — the everyday digital literacy every adult needs, taught through game development.</p>
        <span class="card-cta">4 criteria · 5 points →</span>
      </a>
      <a class="card card-link" href="#/courses/ICT205114">
        <span class="badge badge-ict">ICT205114</span>
        <h3>Computer Applications</h3>
        <p>Hardware, software, ethics, research, and problem-solving — with A-standard stretch goals for high achievers.</p>
        <span class="card-cta">5 criteria · 5 points →</span>
      </a>
      <a class="card card-link" href="#/courses/PRJ205118">
        <span class="badge badge-prj">PRJ205118</span>
        <h3>Project Implementation</h3>
        <p>A 12-week full game project — planned, built, playtested and published like a real studio release.</p>
        <span class="card-cta">5 criteria · 5 points →</span>
      </a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2>How your year <span class="text-gradient">levels up</span></h2>
    <div class="grid grid-3" style="margin-top:2rem;">
      <div class="card">
        <div class="how-icon">🗺️</div>
        <h3>Phase 1 · Weeks 1–22</h3>
        <p>Units 1–5: digital foundations, design docs, asset creation, and a working prototype. Every task earns evidence toward ESC and ICT criteria.</p>
      </div>
      <div class="card">
        <div class="how-icon">🚀</div>
        <h3>Phase 2 · Weeks 23–34</h3>
        <p>Unit 6: the full game project. Brief, Gantt, sprints, playtesting, and a published game page — the complete PRJ205118 framework.</p>
      </div>
      <div class="card">
        <div class="how-icon">🏆</div>
        <h3>Track everything here</h3>
        <p>Quizzes mark themselves instantly. Submissions and feedback live in your dashboard. XP, badges and progress bars show exactly where you stand.</p>
      </div>
    </div>
  </div>
</section>

<section class="section section--sm">
  <div class="container">
    <div class="cta-panel">
      <h2>Ready, Player One?</h2>
      <p>Grab the join code from your teacher and start earning XP today.</p>
      ${user
        ? `<a href="#/units/1" class="btn btn-primary btn-lg">Open Unit 1 →</a>`
        : `<a href="#/signup" class="btn btn-primary btn-lg">Create your account →</a>`}
    </div>
  </div>
</section>`, { title: 'Home' });
}

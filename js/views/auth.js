/* Auth views: sign in, sign up (join-code gated), and the
   enrol-completion screen for live accounts without a profile. */

import { api } from '../api.js';
import { IS_DEMO, DEMO_ACCOUNTS } from '../config.js';
import { render, esc, toast } from '../ui.js';
import { navigate } from '../router.js';
import { invalidate } from '../store.js';

function authShell(title, inner) {
  return `
<section class="section auth-section">
  <div class="container auth-container">
    <div class="card auth-card">
      <div class="auth-logo">⬡</div>
      <h1 class="auth-title">${title}</h1>
      ${inner}
    </div>
  </div>
</section>`;
}

export function loginView() {
  render(authShell('Sign in', `
    <form id="login-form" novalidate>
      <label class="field">
        <span>School email</span>
        <input type="email" name="email" autocomplete="username" required placeholder="you@education.tas.gov.au">
      </label>
      <label class="field">
        <span>Password</span>
        <input type="password" name="password" autocomplete="current-password" required placeholder="Your password">
      </label>
      <p class="form-error" id="form-error" role="alert" hidden></p>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Sign in →</button>
    </form>
    <p class="auth-alt">New to the class? <a href="#/signup">Create your account</a> with the join code from your teacher.</p>
    ${IS_DEMO ? `
    <div class="demo-hint">
      <p><strong>Demo accounts</strong> (password <code>demo1234</code>):</p>
      <div class="demo-hint-btns">
        <button class="btn btn-secondary btn-sm" data-demo="teacher">👩‍🏫 Sign in as Teacher</button>
        <button class="btn btn-secondary btn-sm" data-demo="student">🎓 Sign in as Student (Ava)</button>
      </div>
    </div>` : ''}
  `), { title: 'Sign in' });

  const form = document.getElementById('login-form');
  const errEl = document.getElementById('form-error');
  const doLogin = async (email, password) => {
    errEl.hidden = true;
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      await api.signIn(email, password);
      invalidate({ curriculum: true, state: true });
      const u = api.currentUser();
      toast(`Welcome back, ${u.name}!`, 'success');
      navigate(u.role === 'teacher' ? '/teach' : '/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = 'Sign in →';
    }
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    doLogin(form.email.value.trim(), form.password.value);
  });
  document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => {
    const acct = DEMO_ACCOUNTS[b.dataset.demo];
    form.email.value = acct.email;
    form.password.value = acct.password;
    doLogin(acct.email, acct.password);
  }));
}

export function signupView() {
  render(authShell('Join the class', `
    <p class="auth-blurb">You need the <strong>class join code</strong> from your teacher. For privacy, use only your first name and last initial.</p>
    <form id="signup-form" novalidate>
      <label class="field">
        <span>Display name — first name + last initial</span>
        <input type="text" name="name" required maxlength="40" placeholder="e.g. Sam T." pattern=".*\\S.*">
      </label>
      <label class="field">
        <span>School email</span>
        <input type="email" name="email" autocomplete="username" required placeholder="you@education.tas.gov.au">
      </label>
      <label class="field">
        <span>Password (8+ characters)</span>
        <input type="password" name="password" autocomplete="new-password" minlength="8" required placeholder="Make it memorable">
      </label>
      <label class="field">
        <span>Class join code</span>
        <input type="text" name="joinCode" required placeholder="From your teacher" autocapitalize="characters" autocomplete="off">
      </label>
      <p class="form-error" id="form-error" role="alert" hidden></p>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Create account →</button>
    </form>
    <p class="auth-alt">Already enrolled? <a href="#/login">Sign in</a>.</p>
  `), { title: 'Join the class' });

  const form = document.getElementById('signup-form');
  const errEl = document.getElementById('form-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      await api.signUp({
        email: form.email.value.trim(),
        password: form.password.value,
        name: form.name.value.trim(),
        joinCode: form.joinCode.value.trim(),
      });
      invalidate({ curriculum: true, state: true });
      const u = api.currentUser();
      toast(`Welcome to Level Up, ${u.name}! 🎉`, 'success');
      navigate(u.role === 'teacher' ? '/teach' : '/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = 'Create account →';
    }
  });
}

/* Live-mode: signed in with Supabase but no profile yet
   (e.g. email confirmation flow, or interrupted signup). */
export function enrolView() {
  render(authShell('One more step', `
    <p class="auth-blurb">Your account exists but isn't enrolled in the class yet. Enter the class join code from your teacher to finish.</p>
    <form id="enrol-form" novalidate>
      <label class="field">
        <span>Display name — first name + last initial</span>
        <input type="text" name="name" required maxlength="40" placeholder="e.g. Sam T.">
      </label>
      <label class="field">
        <span>Class join code</span>
        <input type="text" name="joinCode" required placeholder="From your teacher" autocomplete="off">
      </label>
      <p class="form-error" id="form-error" role="alert" hidden></p>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Enrol →</button>
    </form>
  `), { title: 'Finish enrolment' });

  const form = document.getElementById('enrol-form');
  const errEl = document.getElementById('form-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    try {
      await api.redeem(form.joinCode.value.trim(), form.name.value.trim());
      invalidate({ curriculum: true, state: true });
      toast('Enrolled! Welcome to Level Up 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    }
  });
}

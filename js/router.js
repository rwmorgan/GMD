/* Hash router: registers patterns like '/units/:n' and renders on change. */

const routes = [];
let notFoundHandler = null;
let beforeEach = null;

export function route(pattern, handler) {
  const keys = [];
  const rxSrc = pattern.replace(/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; });
  routes.push({ rx: new RegExp('^' + rxSrc + '$'), keys, handler });
}

export function setNotFound(handler) { notFoundHandler = handler; }
export function setBeforeEach(fn) { beforeEach = fn; }

export function currentPath() {
  const hash = window.location.hash || '#/';
  return hash.replace(/^#/, '').split('?')[0] || '/';
}

export function queryParams() {
  const hash = window.location.hash || '';
  const q = hash.split('?')[1] || '';
  return Object.fromEntries(new URLSearchParams(q));
}

export function navigate(path) {
  if (('#' + path) === window.location.hash) dispatch();
  else window.location.hash = path;
}

async function dispatch() {
  const path = currentPath();
  for (const r of routes) {
    const m = path.match(r.rx);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      if (beforeEach) {
        const redirect = await beforeEach(path, params);
        if (redirect) { navigate(redirect); return; }
      }
      await r.handler(params);
      return;
    }
  }
  if (notFoundHandler) notFoundHandler(path);
}

export function startRouter() {
  window.addEventListener('hashchange', dispatch);
  dispatch();
}

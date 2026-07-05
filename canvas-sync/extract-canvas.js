/* Canvas GMD extractor — run in DevTools console on any authenticated
   canvas.education.tas.gov.au page. Read-only: GET requests only.
   Produces window.__gmdExtract with assignments, modules, pages. */

const COURSE = 94239; // Blue Print Game Making and Design (content master)
const SECTIONS = [210788, 210840]; // 2026 classes: ICT205114BG1A, ICT205114BG2B

async function allPages(url) {
  let results = [], next = url;
  while (next) {
    const r = await fetch(next, { headers: { Accept: 'application/json' } });
    results = results.concat(await r.json());
    const m = (r.headers.get('Link') || '').match(/<([^>]+)>; rel="next"/);
    next = m ? m[1] : null;
  }
  return results;
}

/* Sanitize description HTML so it can leave the browser:
   - every <a>/<img>/<iframe> URL becomes an [Ln] marker in a links map
     (query strings stripped — Canvas file links carry verifier tokens)
   - bare URLs typed in text are tokenised the same way
   - all other attributes removed */
function sanitize(html) {
  const links = {}; let n = 0;
  const div = document.createElement('div'); div.innerHTML = html || '';
  div.querySelectorAll('a[href]').forEach(el => {
    const id = 'L' + (++n); links[id] = el.getAttribute('href').split('?')[0];
    el.insertAdjacentText('beforeend', ' [' + id + ']');
  });
  div.querySelectorAll('iframe[src], img[src]').forEach(el => {
    const id = 'L' + (++n); links[id] = el.getAttribute('src').split('?')[0];
    const s = document.createElement('span');
    s.textContent = '[' + (el.tagName === 'IMG' ? 'IMAGE ' : 'VIDEO ') + id + ']';
    el.replaceWith(s);
  });
  div.querySelectorAll('*').forEach(el =>
    [...el.attributes].forEach(at => el.removeAttribute(at.name)));
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(nd => {
    if (/(https?:\/\/|www\.)\S/.test(nd.textContent)) {
      nd.textContent = nd.textContent.replace(/(?:https?:\/\/|www\.)[^\s<>"')]+/g, m => {
        const id = 'L' + (++n); links[id] = m.split('?')[0]; return '[' + id + ']';
      });
    }
  });
  return { html: div.innerHTML.replace(/\n\s*/g, ' '), links };
}

(async () => {
  const [assignments, modules, pages, ...sections] = await Promise.all([
    allPages(`/api/v1/courses/${COURSE}/assignments?per_page=100`),
    allPages(`/api/v1/courses/${COURSE}/modules?include[]=items&per_page=100`),
    allPages(`/api/v1/courses/${COURSE}/pages?per_page=100`),
    ...SECTIONS.map(id => allPages(`/api/v1/courses/${id}/assignments?per_page=100`)),
  ]);
  window.__gmdExtract = {
    extracted: new Date().toISOString(),
    course: COURSE,
    assignments: assignments.map(a => {
      const { html, links } = sanitize(a.description);
      return {
        id: a.id, name: a.name, due_at: a.due_at, published: a.published,
        types: a.submission_types, desc_html: html, links,
        rubric: a.rubric ? a.rubric.map(r =>
          r.description + ' [' + (r.ratings || []).map(t => t.description).join('/') + ']') : null,
      };
    }),
    modules: modules.map(m => ({
      name: m.name, published: m.published,
      items: (m.items || []).map(i => `${i.type}: ${i.title}${i.published === false ? ' [unpublished]' : ''}`),
    })),
    pages: pages.map(p => ({ url: p.url, title: p.title, published: p.published, updated: p.updated_at })),
    sectionDueDates: Object.fromEntries(SECTIONS.map((id, i) =>
      [id, sections[i].map(a => ({ name: a.name, due: a.due_at, published: a.published }))])),
  };
  console.log('done — window.__gmdExtract', window.__gmdExtract);
})();

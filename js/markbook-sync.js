/* ============================================================
   Markbook sync — reads Robert's real Excel markbook in the
   browser and fills in marks/dates the site already knows about,
   into currently-empty or 'x'/'NS' cells only. Never overwrites a
   value that's already been typed in — a mismatch is reported,
   not applied.

   Deliberately does NOT use a library's full read-workbook/
   write-workbook round trip (SheetJS Community Edition silently
   strips almost all cell styling on read, and cannot round-trip
   conditional formatting at all — that's a Pro-only feature, not
   a missing option). Instead this edits the file's underlying
   XML directly: only the exact `<c>` cell elements this tool
   targets are touched. Every other byte — fonts, fills, column
   widths, conditional formatting rules, merged cells, everything
   on every other sheet — passes through completely unchanged,
   because it's never parsed into an object model that could
   drop it in the first place.

   Entirely client-side: the file never goes anywhere except the
   download the teacher triggers themselves.
   ============================================================ */

const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const SHEETJS_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
let jszipPromise = null;
let sheetjsPromise = null;

export function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;
  jszipPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSZIP_CDN;
    s.onload = () => resolve(window.JSZip);
    s.onerror = () => reject(new Error('Could not load the zip library — check your internet connection and try again.'));
    document.head.appendChild(s);
  });
  return jszipPromise;
}

/* Only used for cell-address math (encode/decode row+col <-> "B9") —
   never for reading or writing workbook content, so it can't be the
   thing that drops formatting. */
export function loadSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (sheetjsPromise) return sheetjsPromise;
  sheetjsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SHEETJS_CDN;
    s.onload = () => resolve(window.XLSX);
    s.onerror = () => reject(new Error('Could not load the spreadsheet library — check your internet connection and try again.'));
    document.head.appendChild(s);
  });
  return sheetjsPromise;
}

/* Site task id -> exact markbook task name (Settings/student sheet row 4).
   Confirmed 1:1 against the real 2026 V4 markbook. "OH&S Issues for
   Professional Gamers" has no site task and is intentionally absent —
   it stays a manual-only column forever. */
export const MARKBOOK_TASK_MAP = {
  'A1.1': 'Top Down and Platformer plus bkup',
  'A1.2': 'Parts of a Computer and OS',
  'A1.3': 'Build a Computer',
  'A1.4': 'Safe Gaming Space',
  'A2.1': 'Web Browser Games',
  'A2.2': 'Full Version Game Review',
  'A2.3': 'Video Game Review Using Adobe Premiere',
  'A3.1': 'Unreal Skills Journal',
  'A3.2': 'Unity Skills Journal',
  'A3.3': 'Game Skills Journal and Critical Reflection',
  'A4.1': 'e-Waste',
  'A4.2': 'Game Design Brief',
  'A5.1': 'Project Brief - Designing the Project',
  'A5.2': 'Project Plan',
  'A5.3': 'Major Project',
  'A5.4': 'Presentation',
};

const STRUCTURAL_SHEETS = new Set(['⚙ Settings', '📊 Gradebook', '📋 Attendance', 'Quizzes']);
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';

function normName(s) {
  return String(s || '').trim().replace(/\.+$/, '').toLowerCase();
}

function courseRowLabel(courseId) {
  if (courseId.startsWith('ESC')) return 'Essential Skills';
  if (courseId.startsWith('ICT')) return 'Computer Apps';
  if (courseId.startsWith('PRJ')) return 'Project Imp';
  return courseId;
}

const FILLABLE = new Set(['', 'x', 'ns']);

/* ---------- zip/XML plumbing ---------- */

async function openWorkbookZip(JSZip, buf) {
  const zip = await JSZip.loadAsync(buf);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  const workbookXml = await zip.file('xl/workbook.xml').async('string');
  const workbookDoc = parser.parseFromString(workbookXml, 'application/xml');
  const sheetEls = [...workbookDoc.getElementsByTagName('sheet')];

  const relsXml = await zip.file('xl/_rels/workbook.xml.rels').async('string');
  const relsDoc = parser.parseFromString(relsXml, 'application/xml');
  const relEls = [...relsDoc.getElementsByTagName('Relationship')];
  const ridToTarget = {};
  for (const r of relEls) ridToTarget[r.getAttribute('Id')] = r.getAttribute('Target');

  const sheetPathMap = {};
  for (const el of sheetEls) {
    const rid = el.getAttribute('r:id') || el.getAttributeNS(NS_R, 'id');
    const target = ridToTarget[rid];
    if (!target) continue;
    sheetPathMap[el.getAttribute('name')] = 'xl/' + target.replace(/^\/?xl\//, '');
  }

  let sharedStrings = [];
  const ssFile = zip.file('xl/sharedStrings.xml');
  if (ssFile) {
    const ssXml = await ssFile.async('string');
    const ssDoc = parser.parseFromString(ssXml, 'application/xml');
    sharedStrings = [...ssDoc.getElementsByTagName('si')].map(
      (si) => [...si.getElementsByTagName('t')].map((t) => t.textContent).join('')
    );
  }

  return {
    zip, parser, serializer, workbookDoc, relsDoc, sheetPathMap, sharedStrings,
    sheetDocCache: new Map(), dirtySheets: new Set(),
  };
}

export function detectStudentSheets(ctx) {
  return Object.keys(ctx.sheetPathMap).filter((n) => !STRUCTURAL_SHEETS.has(n));
}

export function guessStudentMapping(profiles, sheetNames) {
  const map = {};
  for (const p of profiles) {
    const target = normName(p.display_name);
    map[p.id] = sheetNames.find((s) => normName(s) === target) || null;
  }
  return map;
}

async function getSheetDoc(ctx, sheetName) {
  if (ctx.sheetDocCache.has(sheetName)) return ctx.sheetDocCache.get(sheetName);
  const path = ctx.sheetPathMap[sheetName];
  if (!path) return null;
  const xml = await ctx.zip.file(path).async('string');
  const doc = ctx.parser.parseFromString(xml, 'application/xml');
  const entry = { path, doc };
  ctx.sheetDocCache.set(sheetName, entry);
  return entry;
}

function findCellEl(doc, addr) {
  const cs = doc.getElementsByTagName('c');
  for (const c of cs) if (c.getAttribute('r') === addr) return c;
  return null;
}

function cellText(ctx, doc, addr) {
  const c = findCellEl(doc, addr);
  if (!c) return '';
  const t = c.getAttribute('t');
  if (t === 's') {
    const v = c.getElementsByTagName('v')[0];
    const idx = v ? parseInt(v.textContent, 10) : -1;
    return ctx.sharedStrings[idx] ?? '';
  }
  if (t === 'inlineStr') {
    const is = c.getElementsByTagName('is')[0];
    const tEl = is ? is.getElementsByTagName('t')[0] : null;
    return tEl ? tEl.textContent : '';
  }
  const v = c.getElementsByTagName('v')[0];
  return v ? v.textContent : '';
}

function findHeaderCol(XLSX, ctx, doc, label, headerRowIdx = 3, maxCol = 40) {
  const target = normName(label);
  for (let c = 0; c < maxCol; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRowIdx, c });
    if (normName(cellText(ctx, doc, addr)) === target) return c;
  }
  return -1;
}

function findRowLabel(XLSX, ctx, doc, label, col = 0, maxRow = 80) {
  const target = normName(label);
  for (let r = 0; r < maxRow; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: col });
    if (normName(cellText(ctx, doc, addr)) === target) return r;
  }
  return -1;
}

// Guarantees exactly one leading XML declaration. XMLSerializer's own
// behaviour here isn't reliably one way or the other — assuming it always
// drops the declaration and unconditionally prepending one is exactly what
// produced a duplicate (a hard parse error: a second "<?xml...?>" is only
// legal as the very first thing in a document, never partway through).
function withXmlDecl(xmlString) {
  return xmlString.startsWith('<?xml') ? xmlString : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + xmlString;
}

function excelSerialDate(date) {
  const epoch = Date.UTC(1899, 11, 30);
  return (date.getTime() - epoch) / 86400000;
}

/* Sets a cell's value in place — only ever touches the target <c>
   element's type/content. Its style ref (s="..."), and everything
   about every other cell/row/sheet, is left completely alone. */
function setCellValue(XLSX, doc, sheetEntry, rowIdx, colIdx, kind, value) {
  const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
  const rowNum = rowIdx + 1;
  const rows = [...doc.getElementsByTagName('row')];
  const rowEl = rows.find((r) => parseInt(r.getAttribute('r'), 10) === rowNum);
  if (!rowEl) return false;

  let cellEl = findCellEl(doc, addr);
  if (!cellEl) {
    // createElementNS, not createElement — this document's elements live in
    // the spreadsheetml namespace, and the plain (non-NS) DOM method creates
    // elements with NO namespace instead of inheriting it. That mismatch is
    // exactly what made Excel flag the file as needing repair.
    cellEl = doc.createElementNS(NS_MAIN, 'c');
    cellEl.setAttribute('r', addr);
    const siblings = [...rowEl.getElementsByTagName('c')];
    const insertBefore = siblings.find((c) => XLSX.utils.decode_cell(c.getAttribute('r')).c > colIdx);
    if (insertBefore) rowEl.insertBefore(cellEl, insertBefore);
    else rowEl.appendChild(cellEl);
  }

  while (cellEl.firstChild) cellEl.removeChild(cellEl.firstChild);

  if (kind === 'string') {
    cellEl.setAttribute('t', 'inlineStr');
    const is = doc.createElementNS(NS_MAIN, 'is');
    const t = doc.createElementNS(NS_MAIN, 't');
    t.textContent = value;
    is.appendChild(t);
    cellEl.appendChild(is);
  } else {
    cellEl.removeAttribute('t');
    const v = doc.createElementNS(NS_MAIN, 'v');
    v.textContent = String(excelSerialDate(value));
    cellEl.appendChild(v);
  }
  return true;
}

/* ---------- the main sync run ---------- */
export async function runMarkbookSync({ XLSX, ctx, cur, data, studentMap }) {
  const result = { marksFilled: 0, datesFilled: 0, quizFilled: 0, disagreements: [], skippedStudents: [] };
  const submissionTasks = cur.tasks.filter((t) => t.type === 'submission');

  for (const p of data.profiles) {
    const sheetName = studentMap[p.id];
    if (!sheetName) { result.skippedStudents.push(p.display_name); continue; }
    const entry = await getSheetDoc(ctx, sheetName);
    if (!entry) { result.skippedStudents.push(p.display_name); continue; }
    const { doc } = entry;

    const stMarks = data.marks.filter((m) => m.student_id === p.id);
    const stSubs = data.submissions.filter((s) => s.student_id === p.id);
    const dateRow = findRowLabel(XLSX, ctx, doc, 'Date Submitted');

    for (const t of submissionTasks) {
      const mbName = MARKBOOK_TASK_MAP[t.id];
      if (!mbName) continue;
      const col = findHeaderCol(XLSX, ctx, doc, mbName);
      if (col < 0) continue;
      let touchedThisSheet = false;

      for (const cid of t.criteria) {
        const crit = cur.criteria.find((c) => c.id === cid);
        if (!crit) continue;
        const label = `${courseRowLabel(crit.course_id)} C${crit.number}`;
        const row = findRowLabel(XLSX, ctx, doc, label);
        if (row < 0) continue;
        const siteMark = stMarks.find((m) => m.criterion_id === cid)?.rating;
        if (!siteMark) continue;
        const curText = cellText(ctx, doc, XLSX.utils.encode_cell({ r: row, c: col })).trim();
        if (FILLABLE.has(curText.toLowerCase())) {
          setCellValue(XLSX, doc, entry, row, col, 'string', siteMark);
          result.marksFilled++; touchedThisSheet = true;
        } else if (curText !== siteMark) {
          result.disagreements.push({ student: p.display_name, task: t.code, criterion: label, markbook: curText, site: siteMark });
        }
      }

      if (dateRow >= 0) {
        const subs = stSubs.filter((s) => s.task_id === t.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
        const latest = subs[subs.length - 1];
        if (latest) {
          const curText = cellText(ctx, doc, XLSX.utils.encode_cell({ r: dateRow, c: col })).trim();
          if (FILLABLE.has(curText.toLowerCase())) {
            setCellValue(XLSX, doc, entry, dateRow, col, 'date', new Date(latest.created_at));
            result.datesFilled++; touchedThisSheet = true;
          }
        }
      }
      if (touchedThisSheet) ctx.dirtySheets.add(sheetName);
    }
  }

  // Write back every modified sheet's XML — untouched sheets are never
  // even re-serialized, so they're guaranteed byte-identical.
  for (const sheetName of ctx.dirtySheets) {
    const entry = ctx.sheetDocCache.get(sheetName);
    ctx.zip.file(entry.path, withXmlDecl(ctx.serializer.serializeToString(entry.doc)));
  }

  // Quizzes have no home in the existing file — a brand-new sheet, hand-
  // built and fully regenerated by this tool each run (nothing hand-
  // entered there, so no formatting to protect and no library needed).
  const quizzes = cur.tasks.filter((t) => t.type === 'quiz');
  if (quizzes.length) {
    const matched = data.profiles.filter((p) => studentMap[p.id]);
    addQuizzesSheet(XLSX, ctx, matched, quizzes, data, result);
  }

  return result;
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function addQuizzesSheet(XLSX, ctx, students, quizzes, data, result) {
  const rows = [];
  rows.push([{ c: 0, s: 'Quizzes — Game Making and Design' }]);
  const header = [{ c: 0, s: 'Quiz (best %)' }];
  students.forEach((p, i) => header.push({ c: i + 1, s: p.display_name }));
  rows.push({ atRow: 4, cells: header });
  quizzes.forEach((q, qi) => {
    const cells = [{ c: 0, s: q.title }];
    students.forEach((p, i) => {
      const attempts = data.attempts.filter((a) => a.student_id === p.id && a.task_id === q.id);
      if (!attempts.length) return;
      const bestPct = Math.round(Math.max(...attempts.map((a) => (a.max_score > 0 ? a.score / a.max_score * 100 : 0))));
      cells.push({ c: i + 1, n: bestPct });
      result.quizFilled++;
    });
    rows.push({ atRow: 5 + qi, cells });
  });
  // first entry (title) uses row 1, rest carry explicit atRow
  const rowXml = [];
  rowXml.push(`<row r="1">${cellXml(XLSX, 0, 0, rows[0][0].s)}</row>`);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const cellsXml = r.cells.map((cell) =>
      'n' in cell ? cellXml(XLSX, r.atRow - 1, cell.c, cell.n, true) : cellXml(XLSX, r.atRow - 1, cell.c, cell.s)
    ).join('');
    rowXml.push(`<row r="${r.atRow}">${cellsXml}</row>`);
  }

  const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml.join('')}</sheetData></worksheet>`;

  // Unique new sheet file name
  const existingSheetFiles = Object.values(ctx.sheetPathMap).map((p) => p.replace('xl/worksheets/', ''));
  let n = 1;
  while (existingSheetFiles.includes(`sheet${n}.xml`)) n++;
  const newPath = `xl/worksheets/sheet${n}.xml`;

  // Register in workbook.xml
  const sheetsEl = ctx.workbookDoc.getElementsByTagName('sheets')[0];
  const existingIds = [...ctx.workbookDoc.getElementsByTagName('sheet')].map((el) => parseInt(el.getAttribute('sheetId'), 10));
  const newSheetId = Math.max(0, ...existingIds) + 1;
  const existingRids = [...ctx.relsDoc.getElementsByTagName('Relationship')].map((el) => parseInt((el.getAttribute('Id') || '').replace('rId', ''), 10) || 0);
  const newRid = 'rId' + (Math.max(0, ...existingRids) + 1);

  const sheetEl = ctx.workbookDoc.createElementNS(NS_MAIN, 'sheet');
  sheetEl.setAttribute('name', 'Quizzes');
  sheetEl.setAttribute('sheetId', String(newSheetId));
  sheetEl.setAttributeNS(NS_R, 'r:id', newRid);
  sheetsEl.appendChild(sheetEl);

  const relEl = ctx.relsDoc.createElementNS(NS_PKG_REL, 'Relationship');
  relEl.setAttribute('Id', newRid);
  relEl.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet');
  relEl.setAttribute('Target', `worksheets/sheet${n}.xml`);
  ctx.relsDoc.getElementsByTagName('Relationships')[0].appendChild(relEl);

  ctx.zip.file('xl/workbook.xml', withXmlDecl(ctx.serializer.serializeToString(ctx.workbookDoc)));
  ctx.zip.file('xl/_rels/workbook.xml.rels', withXmlDecl(ctx.serializer.serializeToString(ctx.relsDoc)));
  ctx.zip.file(newPath, worksheetXml);

  // Register content type so Excel recognises the new part
  const ctPath = '[Content_Types].xml';
  ctx.zip.file(ctPath, addContentTypeOverride(ctx, newPath));
}

function addContentTypeOverride(ctx, path) {
  return ctx.__contentTypesText.replace(
    '</Types>',
    `<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
  );
}

function cellXml(XLSX, rowIdx, colIdx, value, isNumber = false) {
  const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
  if (isNumber) return `<c r="${addr}"><v>${value}</v></c>`;
  return `<c r="${addr}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
}

export async function loadWorkbookForSync(JSZip, buf) {
  const ctx = await openWorkbookZip(JSZip, buf);
  ctx.__contentTypesText = await ctx.zip.file('[Content_Types].xml').async('string');
  return ctx;
}

export async function downloadWorkbook(ctx, filename) {
  const blob = await ctx.zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

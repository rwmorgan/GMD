/* ============================================================
   Markbook sync — reads Robert's real Excel markbook in the
   browser, fills in marks/dates the site already knows about
   into currently-empty or 'x'/'NS' cells only, and hands back an
   updated copy to download. Never overwrites a value that's
   already been typed in — a mismatch is reported, not applied.
   Entirely client-side: the file never goes anywhere except the
   download the teacher triggers themselves.
   ============================================================ */

const SHEETJS_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
let sheetjsPromise = null;

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

function normName(s) {
  return String(s || '').trim().replace(/\.+$/, '').toLowerCase();
}

export function detectStudentSheets(wb) {
  return wb.SheetNames.filter(n => !STRUCTURAL_SHEETS.has(n));
}

/* Best-guess site-student -> sheet-tab mapping, by name. Nicknames
   (e.g. tab "Vin E" for enrolment name "Chloe Edmond") won't match —
   left null for the teacher to pick manually. Returns {profileId: sheetName|null}. */
export function guessStudentMapping(profiles, sheetNames) {
  const map = {};
  for (const p of profiles) {
    const target = normName(p.display_name);
    map[p.id] = sheetNames.find(s => normName(s) === target) || null;
  }
  return map;
}

function courseRowLabel(courseId) {
  if (courseId.startsWith('ESC')) return 'Essential Skills';
  if (courseId.startsWith('ICT')) return 'Computer Apps';
  if (courseId.startsWith('PRJ')) return 'Project Imp';
  return courseId;
}

function findHeaderCol(XLSX, ws, headerRowIdx, label) {
  if (!ws['!ref']) return -1;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const target = normName(label);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRowIdx, c })];
    if (cell && normName(cell.v) === target) return c;
  }
  return -1;
}

function findRowLabel(XLSX, ws, label, col = 0) {
  if (!ws['!ref']) return -1;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const target = normName(label);
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: col })];
    if (cell && normName(cell.v) === target) return r;
  }
  return -1;
}

function getCellText(cell) {
  if (!cell || cell.v === undefined || cell.v === null) return '';
  return String(cell.v).trim();
}

/* Mutate only .t/.v on the target cell — preserves its existing style
   ref (.s), number format (.z) and everything else about the sheet. */
function setCellPreserveStyle(ws, XLSX, r, c, value, type) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const existing = ws[addr] || {};
  const next = { ...existing, t: type, v: value };
  delete next.w; // cached display text — recomputed on next open
  ws[addr] = next;
  const ref = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: { r, c }, e: { r, c } };
  ref.s.r = Math.min(ref.s.r, r); ref.s.c = Math.min(ref.s.c, c);
  ref.e.r = Math.max(ref.e.r, r); ref.e.c = Math.max(ref.e.c, c);
  ws['!ref'] = XLSX.utils.encode_range(ref);
}

const FILLABLE = new Set(['', 'x', 'ns']);

/* ---------- the main sync run ---------- */
export function runMarkbookSync({ XLSX, wb, cur, data, studentMap }) {
  const result = { marksFilled: 0, datesFilled: 0, quizFilled: 0, disagreements: [], skippedStudents: [] };
  const submissionTasks = cur.tasks.filter(t => t.type === 'submission');

  for (const p of data.profiles) {
    const sheetName = studentMap[p.id];
    if (!sheetName) { result.skippedStudents.push(p.display_name); continue; }
    const ws = wb.Sheets[sheetName];
    if (!ws) { result.skippedStudents.push(p.display_name); continue; }

    const stMarks = data.marks.filter(m => m.student_id === p.id);
    const stSubs = data.submissions.filter(s => s.student_id === p.id);
    const dateRow = findRowLabel(XLSX, ws, 'Date Submitted');

    for (const t of submissionTasks) {
      const mbName = MARKBOOK_TASK_MAP[t.id];
      if (!mbName) continue;
      const col = findHeaderCol(XLSX, ws, 3, mbName); // row 4 (0-indexed 3) = task names
      if (col < 0) continue;

      for (const cid of t.criteria) {
        const crit = cur.criteria.find(c => c.id === cid);
        if (!crit) continue;
        const label = `${courseRowLabel(crit.course_id)} C${crit.number}`;
        const row = findRowLabel(XLSX, ws, label);
        if (row < 0) continue;
        const siteMark = stMarks.find(m => m.criterion_id === cid)?.rating;
        if (!siteMark) continue;
        const curText = getCellText(ws[XLSX.utils.encode_cell({ r: row, c: col })]);
        if (FILLABLE.has(curText.toLowerCase())) {
          setCellPreserveStyle(ws, XLSX, row, col, siteMark, 's');
          result.marksFilled++;
        } else if (curText !== siteMark) {
          result.disagreements.push({ student: p.display_name, task: t.code, criterion: label, markbook: curText, site: siteMark });
        }
      }

      if (dateRow >= 0) {
        const subs = stSubs.filter(s => s.task_id === t.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
        const latest = subs[subs.length - 1];
        if (latest) {
          const curText = getCellText(ws[XLSX.utils.encode_cell({ r: dateRow, c: col })]);
          if (FILLABLE.has(curText.toLowerCase())) {
            setCellPreserveStyle(ws, XLSX, dateRow, col, new Date(latest.created_at), 'd');
            result.datesFilled++;
          }
        }
      }
    }
  }

  // Quizzes have no home in the existing file — a dedicated sheet, fully
  // owned and regenerated by this tool each run (nothing hand-entered there).
  const quizzes = cur.tasks.filter(t => t.type === 'quiz');
  if (quizzes.length) {
    const matched = data.profiles.filter(p => studentMap[p.id]);
    let ws = wb.Sheets['Quizzes'];
    if (!ws) { ws = {}; wb.SheetNames.push('Quizzes'); wb.Sheets['Quizzes'] = ws; }
    setCellPreserveStyle(ws, XLSX, 0, 0, 'Quizzes — Game Making and Design', 's');
    setCellPreserveStyle(ws, XLSX, 3, 0, 'Quiz (best %)', 's');
    matched.forEach((p, i) => setCellPreserveStyle(ws, XLSX, 3, i + 1, p.display_name, 's'));
    quizzes.forEach((q, qi) => {
      setCellPreserveStyle(ws, XLSX, 4 + qi, 0, q.title, 's');
      matched.forEach((p, i) => {
        const attempts = data.attempts.filter(a => a.student_id === p.id && a.task_id === q.id);
        if (!attempts.length) return;
        const bestPct = Math.round(Math.max(...attempts.map(a => a.max_score > 0 ? a.score / a.max_score * 100 : 0)));
        setCellPreserveStyle(ws, XLSX, 4 + qi, i + 1, bestPct, 'n');
        result.quizFilled++;
      });
    });
  }

  return result;
}

export function downloadWorkbook(XLSX, wb, filename) {
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellDates: true });
  const blob = new Blob([out], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

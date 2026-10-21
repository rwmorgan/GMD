/* Attendance logic shared by the attendance views and the markbook/student
   pages. Pure functions only — no DOM, no network.

   Lessons are never stored: they're calculated from the terms, the class's
   weekly pattern and the closed days. A lesson with no attendance rows is
   "roll not taken". The percentage matches the teacher's Excel markbook:
   P ÷ (P + A) — explained (E), holidays (H) and called-home notes are left
   out, and late/left-early students still count as Present. */

export const THRESH = { good: 85, concern: 75 };
export const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseDay(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function fmtDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function todayStr() { return fmtDay(new Date()); }
export function shortDay(s) {
  return parseDay(s).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

/* All lessons for a class across the given terms, oldest first. */
export function buildLessons(terms, closures, cls) {
  const closed = new Map(closures.map(c => [c.day, c.label || 'Closed']));
  const out = [];
  for (const t of terms) {
    const start = parseDay(t.start_date), end = parseDay(t.end_date);
    const monday = new Date(start);
    monday.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      for (const p of (cls.pattern || []).filter(x => x.dow === dow)) {
        const day = fmtDay(d);
        const dayIndex = Math.round((d - monday) / 86400000);
        out.push({
          key: `${day}|${p.slot}`, day, slot: p.slot, period: p.period, dow,
          termId: t.id, termName: t.name, termNo: t.number, year: t.year,
          week: Math.floor(dayIndex / 7) + 1, closed: closed.get(day) ?? null,
        });
      }
    }
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || a.slot.localeCompare(b.slot));
}

export function termFor(terms, day) {
  return terms.find(t => t.start_date <= day && day <= t.end_date) || null;
}

/* The term to show by default: the one containing today, else the most
   recently started, else the next one coming. */
export function currentTerm(terms, today = todayStr()) {
  const sorted = [...terms].sort((a, b) => a.start_date.localeCompare(b.start_date));
  return termFor(sorted, today)
    || [...sorted].reverse().find(t => t.start_date <= today)
    || sorted[0] || null;
}

export function summarise(records) {
  const s = { P: 0, A: 0, E: 0, lateMin: 0, earlyMin: 0, lateCount: 0, earlyCount: 0, calledHome: 0, pct: null };
  for (const r of records) {
    if (r.status) s[r.status]++;
    if (r.late_min > 0) { s.lateMin += r.late_min; s.lateCount++; }
    if (r.early_min > 0) { s.earlyMin += r.early_min; s.earlyCount++; }
    if (r.called_home) s.calledHome++;
  }
  s.pct = s.P + s.A ? s.P / (s.P + s.A) : null;
  return s;
}

export function pctBand(pct) {
  if (pct == null) return 'none';
  const v = Math.round(pct * 100);
  return v >= THRESH.good ? 'good' : v >= THRESH.concern ? 'concern' : 'low';
}

export function pctChip(pct) {
  if (pct == null) return '<span class="chip chip-idle">—</span>';
  return `<span class="chip att-chip att-${pctBand(pct)}">${Math.round(pct * 100)}%</span>`;
}

/* Lessons that have already happened (or are today) with no row recorded
   for anyone in the class, and aren't closed. Newest first. */
export function rollNotTaken(lessons, records, classId, today = todayStr()) {
  const taken = new Set(records.filter(r => r.class_id === classId).map(r => `${r.day}|${r.slot}`));
  return lessons.filter(l => l.day <= today && !l.closed && !taken.has(l.key)).reverse();
}

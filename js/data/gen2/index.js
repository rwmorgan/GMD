/* ============================================================
   Gen2 (General Mathematics) content loader.
   ------------------------------------------------------------
   Each topic is a JSON bank (the single source of truth that the
   answer-key verifier in tools/verify_answers.py also reads). At
   import time these are flattened into the same row shape the
   Supabase importer already uses for the GMD seed.

   The Gen2 COURSE row + its 8 CRITERIA are seeded by
   supabase/gen2-migration.sql, so this loader only contributes
   units, tasks (lessons + quizzes), task links, questions and the
   protected answer keys.

   IMPORTANT: verifier-only fields (check/params/expect/verify_tol)
   live in the JSON for tools/verify_answers.py but are stripped
   here — the `questions` table has no such columns.
   ============================================================ */

// Topics in the teaching sequence (Phase 3 order).
const TOPIC_FILES = [
  'consumer-arithmetic.json',
  'algebra-matrices.json',
  'linear-equations.json',
  'univariate-data.json',
  'shape-measurement.json',
  'trigonometry.json',
];

export async function loadGen2Banks() {
  const banks = await Promise.all(TOPIC_FILES.map(async (name) => {
    try {
      const url = new URL(`./${name}`, import.meta.url);
      const res = await fetch(url);
      if (!res.ok) return null;           // topic not authored yet — skip quietly
      return await res.json();
    } catch {
      return null;
    }
  }));
  return banks.filter(Boolean);
}

export function flattenGen2(banks) {
  const units = [];
  const tasks = [];
  const task_criteria = [];
  const task_elements = [];
  const questions = [];
  const answers = [];

  for (const bank of banks) {
    if (bank.unit) units.push(bank.unit);
    const items = [...(bank.lessons || []), ...(bank.quizzes || [])];
    for (const t of items) {
      const { criteria = [], elements = [], questions: qs = [], ...row } = t;
      row.published = row.published ?? true;
      row.body = row.body ?? {};
      row.max_attempts = row.max_attempts ?? null;
      row.pass_pct = row.pass_pct ?? 80;
      row.submit_kinds = row.submit_kinds ?? ['file', 'url'];
      tasks.push(row);
      for (const c of criteria) task_criteria.push({ task_id: t.id, criterion_id: c });
      for (const e of elements) task_elements.push({ task_id: t.id, element_id: e });
      for (const q of qs) {
        // Drop the answer key AND the verifier-only fields.
        const { answer, check, params, expect, verify_tol, ...qRow } = q; // eslint-disable-line no-unused-vars
        qRow.task_id = t.id;
        questions.push(qRow);
        answers.push({ question_id: q.id, answer });
      }
    }
  }

  return { units, tasks, task_criteria, task_elements, questions, answers };
}

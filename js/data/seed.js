/* Combined curriculum seed. Tasks and quizzes are both "tasks";
   quizzes carry their questions inline. */

import { courses, criteria, elements, units } from './seed-curriculum.js';
import { tasks } from './seed-tasks.js';
import { quizzes } from './seed-quizzes.js';

const allTasks = [...tasks, ...quizzes].sort((a, b) => a.sort - b.sort);

export const seed = {
  courses,
  criteria,
  elements,
  units,
  tasks: allTasks,
};

/* Flatten helpers used by both the demo adapter and the
   Supabase curriculum importer. */
export function flattenSeed(s = seed) {
  const taskRows = [];
  const taskCriteria = [];
  const taskElements = [];
  const questions = [];
  const answers = [];

  for (const t of s.tasks) {
    const { criteria: crit = [], elements: els = [], questions: qs = [], ...row } = t;
    row.published = row.published ?? true;
    row.body = row.body ?? {};
    row.max_attempts = row.max_attempts ?? null;
    row.pass_pct = row.pass_pct ?? 80;
    row.submit_kinds = row.submit_kinds ?? ['file', 'url'];
    taskRows.push(row);
    for (const c of crit) taskCriteria.push({ task_id: t.id, criterion_id: c });
    for (const e of els) taskElements.push({ task_id: t.id, element_id: e });
    for (const q of qs) {
      const { answer, ...qRow } = q;
      qRow.task_id = t.id;
      questions.push(qRow);
      answers.push({ question_id: q.id, answer });
    }
  }

  return {
    courses: s.courses,
    criteria: s.criteria,
    elements: s.elements,
    units: s.units,
    tasks: taskRows,
    task_criteria: taskCriteria,
    task_elements: taskElements,
    questions,
    answers,
  };
}

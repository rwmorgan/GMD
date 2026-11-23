/* A class whose name contains the word "test" (e.g. "Test class") is a test
   class: the teacher's practice students live there, and are left out of the
   "All classes" views, totals and exports. Pick the test class in the
   "Viewing" box to see it. */

export const isTestClass = (c) => /\btest\b/i.test(c?.name || '');

/* Ids of students whose ONLY class(es) are test classes.
   classes: [{id, name}], enrolments: [{student_id, class_id}] */
export function testOnlyStudentIds(classes, enrolments) {
  const testIds = new Set(classes.filter(isTestClass).map(c => c.id));
  if (!testIds.size) return new Set();
  const inRealClass = new Set(enrolments.filter(e => !testIds.has(e.class_id)).map(e => e.student_id));
  return new Set(enrolments.filter(e => testIds.has(e.class_id) && !inRealClass.has(e.student_id)).map(e => e.student_id));
}

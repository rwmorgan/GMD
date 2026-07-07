/* ============================================================
   Teacher/LAL dashboard scope: which program + class is being
   viewed. Persisted in localStorage so it survives navigation.
     { programId: 'GMD'|'GEN2'|null,  classId: string|null }
   null programId = all programs (LAL aggregate);
   null classId   = all classes the user can see in that program.
   ============================================================ */
const KEY = 'lms.scope';

export function getScope() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

export function setScope(patch) {
  const next = { ...getScope(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

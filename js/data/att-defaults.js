/* Suggested starting point for the attendance calendar. Nothing here is
   applied automatically: the Attendance setup page offers it as a one-click
   fill that the teacher reviews and saves.

   Term dates are the college's (Years 11-12), NOT the DECYP K-10 dates —
   e.g. Term 1 2027 starts Thu 28 Jan. 2027 Term 4's end date is unconfirmed
   (29 Oct or 5 Nov); adjust it in setup once known. */

export const DEFAULT_CLASSES = [
  { id: 'line1', name: 'Line 1', sort: 1,
    pattern: [{ dow: 1, period: 'P1', slot: 'L1' }, { dow: 3, period: 'P3', slot: 'L2' }, { dow: 5, period: 'P2', slot: 'L3' }] },
  { id: 'line2', name: 'Line 2', sort: 2,
    pattern: [{ dow: 1, period: 'P2', slot: 'L1' }, { dow: 3, period: 'P1', slot: 'L2' }, { dow: 5, period: 'P3', slot: 'L3' }] },
];

export const DEFAULT_TERMS = [
  { id: '2026-T4', year: 2026, number: 4, name: 'Term 4 2026', start_date: '2026-10-19', end_date: '2026-11-06' },
  { id: '2027-T1', year: 2027, number: 1, name: 'Term 1 2027', start_date: '2027-01-28', end_date: '2027-04-09' },
  { id: '2027-T2', year: 2027, number: 2, name: 'Term 2 2027', start_date: '2027-04-26', end_date: '2027-07-02' },
  { id: '2027-T3', year: 2027, number: 3, name: 'Term 3 2027', start_date: '2027-07-19', end_date: '2027-09-24' },
  { id: '2027-T4', year: 2027, number: 4, name: 'Term 4 2027 (end date unconfirmed)', start_date: '2027-10-11', end_date: '2027-11-05' },
];

/* Tasmanian public holidays that fall on a lesson day (Mon/Wed/Fri) in these
   terms. sure:false = needs the teacher's confirmation before adding. */
export const SUGGESTED_CLOSURES = [
  { day: '2027-02-08', label: 'Royal Hobart Regatta (south)', sure: true },
  { day: '2027-03-08', label: 'Eight Hours Day', sure: true },
  { day: '2027-03-26', label: 'Good Friday', sure: true },
  { day: '2027-03-29', label: 'Easter Monday', sure: true },
  { day: '2027-06-14', label: "King's Birthday", sure: true },
  { day: '2027-03-30', label: 'Easter Tuesday (State Service only) — confirm', sure: false },
  { day: '2027-06-11', label: 'Statewide professional learning day (K-12) — confirm for your college', sure: false },
];

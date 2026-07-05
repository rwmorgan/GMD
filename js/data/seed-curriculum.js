/* ============================================================
   Curriculum seed: courses, criteria and standard elements.
   Source of truth: TASC course pages for ICT205114, ESC205114
   and PRJ205118 (fetched 2026-07-03).
   Element ids: <COURSE>-C<n>-<letter>. standard: 'C' or 'A'.
   ============================================================ */

export const courses = [
  {
    id: 'ESC205114', title: 'Essential Skills – Using Computers and the Internet',
    level: 2, points: 5, awards: 'SA / PA', sort: 1,
    url: 'https://www.tasc.tas.gov.au/students/courses/technologies/esc205114-9/',
    notes: "C = Satisfactory Standard only (no A rating). SA requires C in all 4 criteria; PA requires C in 3. All assessment is internal — no external exam.",
  },
  {
    id: 'ICT205114', title: 'Computer Applications',
    level: 2, points: 5, awards: 'EA / CA / SA / PA', sort: 2,
    url: 'https://www.tasc.tas.gov.au/students/courses/technologies/ict205114-9/',
    notes: "Uses both C (Satisfactory) and A (High Standard) ratings. EA = 5×A. CA = 2×A + 3×C. SA = 5×C. PA = 2×C. A 'z' in any criterion results in a PA regardless of other ratings.",
  },
  {
    id: 'PRJ205118', title: 'Project Implementation',
    level: 2, points: 5, awards: 'SA / PA', sort: 3,
    url: 'https://www.tasc.tas.gov.au/students/courses/mixed-field/prj205118-8/',
    notes: 'All 6 TASC work requirements must be completed to be eligible for SA: Project Brief, Time Schedule/Gantt, Team/Working Agreement, 3 documented check-in meetings, Journal (500–800 words), Peer & Self Evaluation.',
  },
];

export const criteria = [
  { id: 'ESC-C1', course_id: 'ESC205114', number: 1, title: 'Identify digital technology tools suitable for routine tasks' },
  { id: 'ESC-C2', course_id: 'ESC205114', number: 2, title: 'Interpret information to access and use digital technology' },
  { id: 'ESC-C3', course_id: 'ESC205114', number: 3, title: 'Follow procedures to perform given tasks, and review performance' },
  { id: 'ESC-C4', course_id: 'ESC205114', number: 4, title: 'Use digital technologies effectively, safely and productively' },

  { id: 'ICT-C1', course_id: 'ICT205114', number: 1, title: 'Identify and apply basic terminology and concepts relating to computer hardware and software' },
  { id: 'ICT-C2', course_id: 'ICT205114', number: 2, title: 'Identify social and ethical issues related to the use of computers' },
  { id: 'ICT-C3', course_id: 'ICT205114', number: 3, title: 'Collect and communicate ideas and information using digital technologies' },
  { id: 'ICT-C4', course_id: 'ICT205114', number: 4, title: 'Complete tasks and solve problems using computers and other digital technologies' },
  { id: 'ICT-C5', course_id: 'ICT205114', number: 5, title: 'Plan and organise resources and activities to complete computer application tasks' },

  { id: 'PRJ-C1', course_id: 'PRJ205118', number: 1, title: 'Work productively to negotiate and complete tasks' },
  { id: 'PRJ-C2', course_id: 'PRJ205118', number: 2, title: 'Communicate ideas and information' },
  { id: 'PRJ-C3', course_id: 'PRJ205118', number: 3, title: 'Work collaboratively with others to implement a project' },
  { id: 'PRJ-C4', course_id: 'PRJ205118', number: 4, title: 'Apply critical thinking and problem solving strategies' },
  { id: 'PRJ-C5', course_id: 'PRJ205118', number: 5, title: 'Reflect on thinking and processes' },
];

const E = (criterion, letter, standard, ord, text) =>
  ({ id: `${criterion}-${letter}`, criterion_id: criterion, standard, ord, text });

export const elements = [
  // ---- ESC205114 (C standard only) ----
  E('ESC-C1', 'a', 'C', 1, 'Correctly identifies routine tasks in everyday adult settings, including the workplace'),
  E('ESC-C1', 'b', 'C', 2, 'Correctly identifies digital technology tools appropriate to such routine tasks'),

  E('ESC-C2', 'a', 'C', 1, 'Correctly interprets routine information and terminology from a range of sources'),
  E('ESC-C2', 'b', 'C', 2, 'Uses such information to access and employ digital technologies for routine tasks'),

  E('ESC-C3', 'a', 'C', 1, 'Correctly follows given instructions, specifications and/or directions'),
  E('ESC-C3', 'b', 'C', 2, 'Uses digital technologies to successfully complete routine tasks'),
  E('ESC-C3', 'c', 'C', 3, 'Undertakes review of their performance in such tasks'),

  E('ESC-C4', 'a', 'C', 1, 'Follows given guidelines/procedures relating to the healthy and safe use of digital technologies'),
  E('ESC-C4', 'b', 'C', 2, 'Identifies and describes everyday potential hazards in the use of digital technologies'),
  E('ESC-C4', 'c', 'C', 3, 'Describes and complies with given principles and practices relating to use of the internet and email'),
  E('ESC-C4', 'd', 'C', 4, 'Describes safe and unsafe practices in the use of social media and related technologies'),
  E('ESC-C4', 'e', 'C', 5, "Describes and complies with given principles and practices relating to use of other peoples' information, images, ideas or words"),

  // ---- ICT205114 (C and A standards) ----
  E('ICT-C1', 'a', 'C', 1, 'Correctly identifies hardware components and describes their usage'),
  E('ICT-C1', 'b', 'C', 2, 'Correctly identifies software types and formats, and describes their usage'),
  E('ICT-C1', 'c', 'C', 3, 'Applies file management skills'),
  E('ICT-C1', 'd', 'C', 4, 'Describes ways of dealing with data storage issues'),
  E('ICT-C1', 'e', 'A', 5, 'Correctly identifies hardware and software components for specific purposes and justifies the choice'),
  E('ICT-C1', 'f', 'A', 6, 'Applies knowledge and understanding of hardware and software to effectively solve real-world problems'),

  E('ICT-C2', 'a', 'C', 1, 'Describes social and ethical issues related to the use of computers and digital technologies'),
  E('ICT-C2', 'b', 'C', 2, 'Correctly describes concepts of intellectual property and copyright'),
  E('ICT-C2', 'c', 'C', 3, "Correctly describes and complies with given principles and practices relating to use of other peoples' information, images, ideas or words"),
  E('ICT-C2', 'd', 'C', 4, 'Correctly describes and complies with given occupational health and safety procedures'),
  E('ICT-C2', 'e', 'A', 5, 'Correctly identifies social and ethical issues related to specific situations and justifies the choice'),
  E('ICT-C2', 'f', 'A', 6, "Accurately describes OHS issues related to specific situations, their possible impact on an individual's health/safety, and methods to avoid, remove or minimise adverse impact"),

  E('ICT-C3', 'a', 'C', 1, 'Collects relevant information from a range of sources, including the internet'),
  E('ICT-C3', 'b', 'C', 2, 'Selects and re-synthesises information into a logical presentation'),
  E('ICT-C3', 'c', 'C', 3, 'Uses computer applications/digital media to clearly present ideas and information'),
  E('ICT-C3', 'd', 'A', 4, 'Assesses the relevance, accuracy and completeness of collected information'),
  E('ICT-C3', 'e', 'A', 5, 'Considers and effectively addresses the needs of various audiences and/or stakeholders'),

  E('ICT-C4', 'a', 'C', 1, 'Selects and uses software and hardware appropriate to a given task'),
  E('ICT-C4', 'b', 'C', 2, 'Uses basic features of selected software packages'),
  E('ICT-C4', 'c', 'C', 3, "Uses 'help' features, manuals and/or on-line support to solve problems"),
  E('ICT-C4', 'd', 'C', 4, 'Uses effective internet search strategies, and navigates and uses web-based applications'),
  E('ICT-C4', 'e', 'A', 5, 'Uses advanced features of selected software packages'),
  E('ICT-C4', 'f', 'A', 6, 'Uses advanced internet search strategies including Boolean searches'),

  E('ICT-C5', 'a', 'C', 1, 'Maintains task focus for agreed periods of time'),
  E('ICT-C5', 'b', 'C', 2, 'Sets goals which are generally measurable, achievable and realistic, and follows given plans/directions'),
  E('ICT-C5', 'c', 'C', 3, 'Reflects on progress towards meeting goals and articulates ways in which goals might be met in the future'),
  E('ICT-C5', 'd', 'C', 4, 'Uses strategies as directed to perform tasks within established timelines'),
  E('ICT-C5', 'e', 'A', 5, 'Maintains task focus'),
  E('ICT-C5', 'f', 'A', 6, 'Sets goals which are measurable, achievable and realistic, and plans effective actions'),
  E('ICT-C5', 'g', 'A', 7, 'Reflects on progress towards meeting goals, evaluates progress and plans future actions'),
  E('ICT-C5', 'h', 'A', 8, 'Considers, selects and uses strategies to manage and complete activities within established timelines'),

  // ---- PRJ205118 (C standard) ----
  E('PRJ-C1', 'a', 'C', 1, 'Negotiates planning and completion of tasks with stakeholders to achieve project goals'),
  E('PRJ-C1', 'b', 'C', 2, 'Negotiates appropriate adaptations with stakeholders to meet specific needs/goals as required'),
  E('PRJ-C1', 'c', 'C', 3, 'Plans, prioritises and undertakes own work to achieve intended group outcomes'),
  E('PRJ-C1', 'd', 'C', 4, 'Follows established safety procedures for the use of equipment and facilities, as directed'),
  E('PRJ-C1', 'e', 'C', 5, 'Delivers upon agreed, achievable project goals within proposed timeframes'),

  E('PRJ-C2', 'a', 'C', 1, 'Clearly communicates — verbally, digitally and in writing — basic ideas and information related to the project (nature, scope, processes, people, progress)'),
  E('PRJ-C2', 'b', 'C', 2, 'Develops, presents and explains ideas related to the project to different audiences'),
  E('PRJ-C2', 'c', 'C', 3, 'Uses digital media and technology to complete and review the project'),
  E('PRJ-C2', 'd', 'C', 4, 'Uses appropriate ICT tools to support reporting about the project'),
  E('PRJ-C2', 'e', 'C', 5, 'Incorporates and documents feedback and input into the project'),

  E('PRJ-C3', 'a', 'C', 1, 'Correctly identifies own roles and responsibilities'),
  E('PRJ-C3', 'b', 'C', 2, "Correctly identifies others' roles and responsibilities"),
  E('PRJ-C3', 'c', 'C', 3, 'Identifies and describes group goals'),
  E('PRJ-C3', 'd', 'C', 4, 'Documents consultation with relevant stakeholders'),
  E('PRJ-C3', 'e', 'C', 5, 'Identifies and utilises respectful communication strategies'),

  E('PRJ-C4', 'a', 'C', 1, 'Sets goals which are generally measurable, achievable, specific, time-referenced and realistic'),
  E('PRJ-C4', 'b', 'C', 2, 'Identifies and utilises basic problem solving strategies'),
  E('PRJ-C4', 'c', 'C', 3, 'Identifies and poses questions that assist in producing outcomes of the project'),
  E('PRJ-C4', 'd', 'C', 4, 'Exercises flexibility and adaptability to meet changing conditions and achieve project goals'),

  E('PRJ-C5', 'a', 'C', 1, 'Explains how parts of the project interact with each other to produce project outcomes'),
  E('PRJ-C5', 'b', 'C', 2, 'Identifies and poses questions that clarify thinking that leads to better solutions'),
  E('PRJ-C5', 'c', 'C', 3, 'Assesses benefits of implementing a project by identifying risks, costs and effort involved'),
  E('PRJ-C5', 'd', 'C', 4, 'Identifies, utilises and documents problem solving techniques used to solve specific problems'),
  E('PRJ-C5', 'e', 'C', 5, 'Reflects on progress towards meeting goals and articulates ways goals can be met in the future'),
];

/* Units mirror the real Canvas course (blueprint 94239), synced 2026-07-05. */
export const units = [
  { id: 'u1', number: 1, title: 'Computers & Digital Foundations', subtitle: 'Know your machine, work safely', weeks: 'Term 1 · Weeks 1–4', phase: 1, sort: 1,
    description: 'Game developers need to know the hardware they build on. This unit starts with simple browser game-making, then digs into what a computer actually is — its parts, types and operating systems — before you spec and cost a build of your own and design a safe, ergonomic space to game and study in.' },
  { id: 'u2', number: 2, title: 'Reviewing Games', subtitle: 'Play, analyse, publish your verdict', weeks: 'Term 1 · Weeks 5–10', phase: 1, sort: 2,
    description: "Before you make games, learn to read them. You'll review browser games in writing, review a full-release game as a designed A3 poster in Adobe Illustrator or Photoshop, and finish with a video review edited in Premiere Pro and published to YouTube — three reviews, three different ways of communicating to an audience." },
  { id: 'u3', number: 3, title: 'Game Engines', subtitle: 'Unreal & Unity skills journals', weeks: 'Term 2 · Weeks 1–9', phase: 1, sort: 3,
    description: "Hands-on time in the two industry engines. You'll work through Unreal Engine and then Unity, and the assessment isn't the games you make — it's the skills journal you keep as you learn: a how-to guide good enough to teach someone else, finished with a critical review of your own work." },
  { id: 'u4', number: 4, title: 'Design & Digital Citizenship', subtitle: 'Design briefs, ethics and e-waste', weeks: 'Term 2 · Weeks 8–11', phase: 1, sort: 4,
    description: "Two ways of thinking like a professional: the ethical and the creative. You'll examine where our technology really ends up — the e-waste flows from our devices to places like Agbogbloshie, Ghana — then switch to designer mode and write the design brief for a game of your own." },
  { id: 'u5', number: 5, title: 'Major Project', subtitle: 'PRJ205118 — 12-week game project', weeks: 'Terms 3–4 · 12 weeks (~50 hours)', phase: 2, sort: 5,
    description: "The big one. Over 12 weeks you'll brief, plan, build, playtest and present a complete game in Unreal, Unity3D or GameMaker Studio — running it like a real project with a project brief, a Gantt chart, a development journal, and a final presentation to the class. This unit delivers the TASC Project Implementation course." },
];

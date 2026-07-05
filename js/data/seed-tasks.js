/* ============================================================
   Task seed: the 16 published assessment tasks from the real
   Canvas course (blueprint 94239 "Blue Print Game Making and
   Design"), synced 2026-07-05 and rewritten for clarity.
   Facts (deliverables, budgets, counts, criteria) are preserved
   from Canvas exactly; only the wording/structure is improved.

   body.sections[].html is trusted teacher-authored HTML.
   criteria: criterion ids assessed (exactly as per the Canvas
   rubric). elements: element ids (element-level mappings are
   teacher judgement where Canvas only specified criteria).
   marking: rubric rows shown to students and used in the
   teacher marking queue.

   Ids use the A-prefix (A1.1…) so they can coexist with — and
   then cleanly replace — the pre-sync T- and Q-prefixed tasks
   in the live database (see canvas-sync/cleanup.sql).

   Due dates verified against Canvas 2026-07-05 (updated after
   Rob fixed the stale 2025 dates). Presentation is still TBC in
   Canvas — fix there, then update here.
   ============================================================ */

export const tasks = [

  // ================= UNIT 1 — Computers & Digital Foundations =================
  {
    id: 'A1.1', unit_id: 'u1', code: '1.1', title: 'Top-Down & Platformer Games + Backup',
    type: 'submission', sort: 11, est_time: '2–3 lessons', tools: 'Flowlab or Scratch, Word, OneDrive', weeks: 'T1 Weeks 1–2 · due Wed 11 Feb',
    overview: "Start by making something. After building a simple game in Flowlab or Scratch, you'll research the two genres you just touched — top-down and platformer — and write up what defines them. Along the way you'll set up the folder and backup habits you'll rely on all year.",
    criteria: ['ESC-C3', 'ESC-C4', 'ICT-C1', 'ICT-C3'],
    elements: ['ESC-C3-a', 'ESC-C3-b', 'ESC-C4-c', 'ICT-C1-c', 'ICT-C1-d', 'ICT-C3-a', 'ICT-C3-c'],
    body: {
      sections: [
        { title: 'Part A — Create', html: `
<p>Build a simple game using <a href="http://flowlab.io" target="_blank" rel="noopener">Flowlab</a> or <a href="http://scratch.mit.edu" target="_blank" rel="noopener">Scratch</a>. This is your warm-up — experiment with movement, obstacles and win conditions.</p>` },
        { title: 'Part B — Research & Write-Up', html: `
<p>Research <strong>top-down</strong> and <strong>platformer</strong> games, then write up your findings in Word. Cover what defines each genre, how the camera and movement work, and give examples of well-known games in each.</p>` },
        { title: 'Part C — Save & Back Up', html: `
<ol>
  <li>Create a folder called <strong>“Game Making and Design”</strong> in your OneDrive.</li>
  <li>Save your Word document into that folder.</li>
  <li>Take a <strong>screenshot showing the file saved in the correct location</strong> — this is part of your submission.</li>
  <li>Keep your own backup of all your work. This habit is assessed all year: lost work is not an excuse.</li>
</ol>` },
      ],
      checklist: [
        'Made a simple game in Flowlab or Scratch',
        'Word write-up covers both top-down and platformer genres with examples',
        '“Game Making and Design” folder created in OneDrive',
        'Screenshot shows the document saved in the correct folder',
        'A personal backup of your work exists',
      ],
      marking: [
        { criterion: 'ESC-C3', c: 'Follows the task steps as given and uses Flowlab/Scratch, Word and OneDrive to complete them.', a: null },
        { criterion: 'ESC-C4', c: 'Stores and shares files through OneDrive following safe cloud and internet practice.', a: null },
        { criterion: 'ICT-C1', c: 'Creates the OneDrive folder, names and saves files correctly, and keeps a backup (file management and data storage).', a: 'Explains why cloud storage plus a personal backup protects a project, and applies this without prompting.' },
        { criterion: 'ICT-C3', c: 'Collects genre information from online sources and presents it clearly in Word.', a: 'Synthesises research from multiple sources into a well-structured, accurate comparison of the two genres.' },
      ],
    },
  },

  {
    id: 'A1.2', unit_id: 'u1', code: '1.2', title: 'Parts of a Computer, Computer Types & OS',
    type: 'submission', sort: 12, est_time: '1–2 lessons', tools: 'Word, YouTube', weeks: 'T1 Week 2 · due Fri 13 Feb',
    overview: "What's actually inside the machine you game on? Two short research tasks: name the main parts of a computer, then use the videos to sort out computer types and operating systems. Two documents, clearly named.",
    criteria: ['ESC-C1', 'ESC-C2', 'ESC-C4', 'ICT-C1'],
    elements: ['ESC-C1-a', 'ESC-C1-b', 'ESC-C2-a', 'ESC-C2-b', 'ESC-C4-a', 'ICT-C1-a', 'ICT-C1-b'],
    body: {
      sections: [
        { title: 'Part One — Parts of a Computer', html: `
<p>What are the <strong>5 main parts of a computer</strong> (excluding the case they fit into)? List your answers in a Word document. This video will help:</p>
<p><a href="https://www.youtube.com/watch?v=HB4I2CgkcCo" target="_blank" rel="noopener">▶ Video: the parts of a computer</a></p>` },
        { title: 'Part Two — Computer Types & Operating Systems', html: `
<p>Watch the video, then answer the following in a second Word document:</p>
<p><a href="https://www.youtube.com/watch?v=Cu3R5it4cQs" target="_blank" rel="noopener">▶ Video: computer types and operating systems</a></p>
<ol>
  <li>Computers use a combination of __________ and _________</li>
  <li>What are the two main types of personal computers?</li>
  <li>What are the 3 main types of operating systems on PCs?</li>
</ol>` },
        { title: 'Submit', html: `
<p>Submit <strong>TWO separate documents</strong>: one called <em>Parts</em>, and one called <em>Computers and OS</em>. Both must also be saved in your <strong>Game Making and Design</strong> folder on OneDrive.</p>` },
      ],
      checklist: [
        '“Parts” document: 5 main parts of a computer listed',
        '“Computers and OS” document: all 3 questions answered',
        'Both documents named exactly as specified',
        'Both documents saved in your Game Making and Design OneDrive folder',
      ],
      marking: [
        { criterion: 'ESC-C1', c: 'Identifies the parts and types of computers used for everyday tasks.', a: null },
        { criterion: 'ESC-C2', c: 'Interprets information from the videos correctly and uses it to answer the questions.', a: null },
        { criterion: 'ESC-C4', c: 'Works safely and productively with the videos and documents; files stored correctly.', a: null },
        { criterion: 'ICT-C1', c: 'Correctly identifies hardware components and operating system types using accurate terminology.', a: 'Goes beyond naming — accurately explains what each part/OS does and how they differ.' },
      ],
    },
  },

  {
    id: 'A1.3', unit_id: 'u1', code: '1.3', title: 'Build a Computer',
    type: 'submission', sort: 14, est_time: '3–4 lessons', tools: 'PowerPoint, Excel, browser', weeks: 'T1 Weeks 2–3 · due Fri 20 Feb',
    overview: "Time to go shopping (fictitiously). You'll spec complete computer builds for two different budgets, justify every choice, and present the lot as a PowerPoint backed by a costed spreadsheet. One build must be a gaming machine.",
    criteria: ['ESC-C1', 'ESC-C2', 'ESC-C3', 'ICT-C1', 'ICT-C3', 'ICT-C4'],
    elements: ['ESC-C1-a', 'ESC-C1-b', 'ESC-C2-a', 'ESC-C2-b', 'ESC-C3-a', 'ESC-C3-b', 'ICT-C1-a', 'ICT-C1-e', 'ICT-C1-f', 'ICT-C3-a', 'ICT-C3-b', 'ICT-C3-c', 'ICT-C3-d', 'ICT-C4-a', 'ICT-C4-d'],
    body: {
      sections: [
        { title: 'The Brief', html: `
<p>Computers are built from components working together for a purpose. Your job: <strong>fictitiously build a computer out of parts for two (2) of the following budgets — $1,500, $2,500, and unlimited.</strong> At the end of each build, explain your choices and the purpose of the computer. <strong>One build must be for gaming.</strong></p>
<p>The main components to cover:</p>
<ul>
  <li>CPU/Processor</li><li>Motherboard</li><li>Hard drive</li><li>Memory/RAM</li><li>Graphics card/GPU</li><li>Case</li><li>Power supply</li><li>Optical drive</li><li>Screen/Monitor</li><li>Keyboard</li><li>Mouse</li>
</ul>` },
        { title: 'Rules', html: `
<ul>
  <li>Websites must be <strong>Australian</strong> and prices in <strong>Australian dollars</strong>.</li>
  <li>You do <strong>not</strong> need to factor in freight costs.</li>
  <li>You must use <strong>at least 3 different sites</strong> for purchasing parts.</li>
</ul>
<p>Starter sites:
<a href="https://www.pccasegear.com/" target="_blank" rel="noopener">PC Case Gear</a> ·
<a href="https://www.msy.com.au/" target="_blank" rel="noopener">MSY</a> ·
<a href="https://www.scorptec.com.au/" target="_blank" rel="noopener">Scorptec</a> ·
<a href="https://www.umart.com.au/" target="_blank" rel="noopener">Umart</a> ·
<a href="https://www.eyo.com.au/" target="_blank" rel="noopener">EYO</a> ·
<a href="https://www.computeralliance.com.au/systems" target="_blank" rel="noopener">Computer Alliance</a> ·
<a href="https://www.whatpsu.com/" target="_blank" rel="noopener">WhatPSU</a> (power supply calculator)</p>` },
        { title: 'Deliverables', html: `
<ol>
  <li><strong>PowerPoint</strong> — for every part: the part name, a picture, the price, and the site you would buy it from. Finish each build with your explanation of the choices and the computer's purpose.</li>
  <li><strong>Spreadsheet</strong> — duplicate the part names and prices into Excel, using <strong>formulas</strong> to calculate the total for each budget.</li>
</ol>
<p>Worth thinking about as you build: <em>what parts make a good gaming computer, and why?</em></p>` },
      ],
      checklist: [
        'Two complete builds, each within its chosen budget ($1,500 / $2,500 / unlimited)',
        'One of the builds is a gaming computer',
        'Every component: name, picture, price and source site in the PowerPoint',
        'Explanation of choices and purpose at the end of each build',
        'At least 3 different Australian retailer sites used, prices in AUD',
        'Excel sheet totals each budget using formulas',
      ],
      marking: [
        { criterion: 'ESC-C1', c: 'Identifies appropriate components and retail tools for the task.', a: null },
        { criterion: 'ESC-C2', c: 'Interprets product specifications and pricing information correctly.', a: null },
        { criterion: 'ESC-C3', c: 'Follows the brief: two builds, budget rules, Australian sites, both deliverables.', a: null },
        { criterion: 'ICT-C1', c: 'Correctly identifies hardware components and describes their usage.', a: 'Justifies component choices for a specific purpose (e.g. gaming) and applies hardware knowledge to the real-world problem of building to a budget.' },
        { criterion: 'ICT-C3', c: 'Collects parts and pricing information from multiple sites and presents it logically in PowerPoint.', a: 'Compares across retailers and assesses the relevance/accuracy of the information collected.' },
        { criterion: 'ICT-C4', c: 'Uses PowerPoint, Excel (with formulas) and web research effectively to complete the task.', a: 'Uses advanced features (e.g. spreadsheet formulas beyond a simple sum, PSU calculators) to strengthen the build.' },
      ],
    },
  },

  {
    id: 'A1.4', unit_id: 'u1', code: '1.4', title: 'Safe Gaming Space',
    type: 'submission', sort: 15, est_time: '2–3 lessons', tools: 'Word (or design software of your choice)', weeks: 'T1 Weeks 3–4 · due Fri 27 Feb',
    overview: "Design your ideal study/gaming space — one that won't wreck your back, eyes or wallet. Your write-up must show you understand ergonomics, and it doubles as a Word formatting workout.",
    criteria: ['ESC-C1', 'ESC-C2', 'ESC-C3', 'ICT-C3', 'ICT-C4', 'ICT-C5'],
    elements: ['ESC-C1-b', 'ESC-C2-a', 'ESC-C2-b', 'ESC-C3-a', 'ESC-C3-b', 'ICT-C3-b', 'ICT-C3-c', 'ICT-C4-a', 'ICT-C4-b', 'ICT-C5-b', 'ICT-C5-d'],
    body: {
      sections: [
        { title: 'The Design', html: `
<p>Design a study/gaming space. Things to consider:</p>
<ul>
  <li>Desk</li>
  <li>Chair</li>
  <li>Lighting</li>
  <li>Wall colour</li>
  <li>Decoration</li>
</ul>
<p>You're welcome to do your design in any software you choose — including the drawing tools in Word.</p>
<p>Include a <strong>budget/expenses list</strong> for your space.</p>` },
        { title: 'The Write-Up (Word)', html: `
<p>Your write-up must include information about <strong>ergonomics</strong> — how your choices protect posture, eyes and health — and be submitted in Word format.</p>
<p>Formatting requirements (these are assessed):</p>
<ul>
  <li>Include images</li>
  <li>Use 2 different font types</li>
  <li>Some words <strong>bold</strong>, some <em>italic</em> and some <u>underlined</u> (the same words may be all 3)</li>
  <li>Mostly black text, but include at least one other colour somewhere in the document</li>
</ul>` },
      ],
      checklist: [
        'Space design covers desk, chair, lighting, wall colour and decoration',
        'Write-up explains the ergonomics behind your choices',
        'Budget/expenses list included',
        'Images, 2 font types, bold + italic + underline, and a second colour all present',
        'Submitted as a Word document',
      ],
      marking: [
        { criterion: 'ESC-C1', c: 'Identifies appropriate tools and furniture for a safe study/gaming setup.', a: null },
        { criterion: 'ESC-C2', c: 'Interprets ergonomic information and applies it to the design.', a: null },
        { criterion: 'ESC-C3', c: 'Follows all design and formatting requirements as specified.', a: null },
        { criterion: 'ICT-C3', c: 'Presents the design and research clearly, combining text and images.', a: 'Presentation choices (layout, images, emphasis) deliberately serve the reader.' },
        { criterion: 'ICT-C4', c: 'Uses Word (or chosen design software) features to produce the required formatting.', a: 'Uses advanced features of the chosen software to strengthen the design.' },
        { criterion: 'ICT-C5', c: 'Plans the space to a budget and completes the task within the set timeframe.', a: 'Budget is realistic, itemised and clearly connected to the design decisions.' },
      ],
    },
  },

  // ================= UNIT 2 — Reviewing Games =================
  {
    id: 'A2.1', unit_id: 'u2', code: '2.1', title: 'Web Browser Games — 5 Reviews',
    type: 'submission', sort: 21, est_time: '2 lessons', tools: 'Browser, Word', weeks: 'T1 Weeks 5–6 · due Fri 13 Mar',
    overview: "Play games, on purpose, for marks. Five browser games, five different genres, and a short written review of each — then crown your favourite and defend the choice.",
    criteria: ['ESC-C1', 'ESC-C2', 'ESC-C3'],
    elements: ['ESC-C1-a', 'ESC-C1-b', 'ESC-C2-a', 'ESC-C2-b', 'ESC-C3-a', 'ESC-C3-b'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>Play <strong>5 different web browser games</strong> for 10–20 minutes each. All games should be of <strong>different genres</strong>.</p>
<p>After each game, write a brief review (about 2–3 paragraphs) including, as a minimum:</p>
<ul>
  <li>Name</li>
  <li>Target audience</li>
  <li>Graphics</li>
  <li>Audio (sound effects and music)</li>
  <li>General thoughts</li>
  <li>Rating out of 10</li>
</ul>` },
        { title: 'The Verdict', html: `
<p>When your 5 reviews are done, write a couple of paragraphs on <strong>which game was your favourite and why</strong>, comparing it to the others.</p>
<p>Include <strong>screenshots and images</strong>, plus a <strong>link to each game</strong>.</p>
<p>You have <strong>2 lessons</strong> for this task. Submit your reviews when complete.</p>` },
      ],
      checklist: [
        '5 games played, each from a different genre, 10–20 minutes each',
        'Each review covers name, target audience, graphics, audio, general thoughts, and /10 rating',
        'Favourite-game comparison written (a couple of paragraphs)',
        'Screenshots/images included and every game linked',
        'Completed within 2 lessons and submitted',
      ],
      marking: [
        { criterion: 'ESC-C1', c: 'Selects appropriate browser games across five distinct genres.', a: null },
        { criterion: 'ESC-C2', c: 'Interprets each game (audience, genre conventions) and uses correct terminology in the reviews.', a: null },
        { criterion: 'ESC-C3', c: 'Follows the review structure for all 5 games and completes the comparison within the timeframe.', a: null },
      ],
    },
  },

  {
    id: 'A2.2', unit_id: 'u2', code: '2.2', title: 'Full Version Game Review — A3 Poster',
    type: 'submission', sort: 23, est_time: '4–5 lessons', tools: 'Adobe Illustrator or Photoshop (MS Publisher only by exception)', weeks: 'T1 Weeks 6–7 · due Fri 20 Mar',
    overview: "Review a full-release game you've actually played — as a designed A3 poster. This assesses your reviewing AND your Adobe skills, so a skills journal of what you learn in the software travels with it.",
    criteria: ['ICT-C4', 'ICT-C5'],
    elements: ['ICT-C4-a', 'ICT-C4-b', 'ICT-C4-c', 'ICT-C4-e', 'ICT-C5-a', 'ICT-C5-b', 'ICT-C5-d'],
    body: {
      sections: [
        { title: 'Part 1 — The Poster', html: `
<p>Review a <strong>full version A-release game</strong> — not a mobile/tablet game, but a purchased game on PC or console. Ideally one you've played recently, preferably one you've finished.</p>
<p>Format: <strong>poster, A3</strong>, landscape or portrait. Pictures are a big plus.</p>
<p>You must include:</p>
<ul>
  <li>Name of game</li>
  <li>Company who released it</li>
  <li>Date of release</li>
  <li>Available formats</li>
  <li>Genre</li>
  <li>Classification</li>
  <li>Audio</li>
  <li>Graphics</li>
  <li>Levels</li>
  <li>Personal thoughts</li>
  <li>Game play</li>
  <li>Your rating</li>
</ul>
<p>Software: <strong>Adobe Illustrator or Adobe Photoshop</strong> preferred. MS Publisher may be used if the Adobe tools prove too difficult, but it will not allow for high marks. Google and YouTube tutorials are your friends — this task also assesses your technical skill with the software.</p>
<p><a href="https://gdcvault.com/gamenarrativereview" target="_blank" rel="noopener">Example review posters (GDC Game Narrative Review)</a></p>` },
        { title: 'Part 2 — Skills Journal', html: `
<p>Alongside the poster, you <strong>must</strong> keep a skills journal on the features of the software you use: what you used, how you used it, with pictures.</p>
<p><a href="https://canvas.education.tas.gov.au/courses/94239/files/6208635" target="_blank" rel="noopener">Skills Journal Template.docx</a> (opens in Canvas — sign in first)</p>
<p><strong>Submit both the poster and the journal.</strong></p>` },
      ],
      checklist: [
        'Game is a full-release PC/console title (not mobile)',
        'A3 poster includes all 12 required areas',
        'Made in Illustrator or Photoshop (Publisher only if agreed, and it caps marks)',
        'Skills journal documents the software features you used, with pictures',
        'Both poster and journal submitted',
      ],
      marking: [
        { criterion: 'ICT-C4', c: 'Uses the chosen software\'s features to produce a complete A3 poster; uses tutorials/help to solve problems along the way.', a: 'Uses advanced Illustrator/Photoshop features, evidenced in the poster and journal.' },
        { criterion: 'ICT-C5', c: 'Maintains focus across the task and manages poster + journal within the timeline.', a: 'Journal shows deliberate goal-setting and strategy in learning the software.' },
      ],
    },
  },

  {
    id: 'A2.3', unit_id: 'u2', code: '2.3', title: 'Video Game Review — Premiere Pro',
    type: 'submission', sort: 24, est_time: '4–6 lessons', tools: 'Adobe Premiere Pro, capture hardware/software, YouTube', weeks: 'T1 Weeks 8–10 · due Fri 10 Apr',
    overview: "Your third review format: video. Capture footage of a game of your choice, script a voiceover, edit it in Premiere Pro, and publish to YouTube — the way working reviewers actually do it.",
    criteria: ['ESC-C2', 'ESC-C4', 'ICT-C2', 'ICT-C3'],
    elements: ['ESC-C2-a', 'ESC-C2-b', 'ESC-C4-c', 'ESC-C4-d', 'ICT-C2-a', 'ICT-C2-e', 'ICT-C3-c', 'ICT-C3-e'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<ol>
  <li>Choose a game and <strong>capture footage</strong> from PC or console (a variety of capture methods is fine).</li>
  <li><strong>Write a script</strong> outlining what you'll say <em>before</em> recording your voiceover review.</li>
  <li>Edit the review in <strong>Adobe Premiere Pro</strong>.</li>
  <li><strong>Export using the settings from the video tutorial provided in class</strong>, and upload to YouTube.</li>
</ol>` },
        { title: 'Submit', html: `
<p>Submit a <strong>Word document of your script</strong> plus a <strong>link to the review on YouTube</strong>.</p>
<p>Privacy tip from the task: unless you're sure you want the video available for all the world to see, keep it <strong>unlisted</strong> — visible only to those who have the link (i.e. Rob).</p>` },
      ],
      checklist: [
        'Footage captured from PC or console',
        'Script written before the voiceover was recorded',
        'Edited in Premiere Pro and exported with the tutorial settings',
        'Uploaded to YouTube (unlisted recommended)',
        'Script document + YouTube link submitted',
      ],
      marking: [
        { criterion: 'ESC-C2', c: 'Interprets the export/upload instructions correctly and applies them.', a: null },
        { criterion: 'ESC-C4', c: 'Publishes safely — appropriate visibility settings and no personal information exposed.', a: null },
        { criterion: 'ICT-C2', c: 'Handles the social/ethical side of publishing: captured content, privacy and audience.', a: 'Identifies the ethical issues in their specific situation (footage rights, privacy choices) and justifies the decisions made.' },
        { criterion: 'ICT-C3', c: 'Communicates the review clearly through scripted voiceover and edited video.', a: 'Script and edit are shaped for the target audience — pacing, tone and structure all serve the viewer.' },
      ],
    },
  },

  // ================= UNIT 3 — Game Engines =================
  {
    id: 'A3.1', unit_id: 'u3', code: '3.1', title: 'Unreal Skills Journal',
    type: 'submission', sort: 31, est_time: 'Ongoing through the Unreal weeks', tools: 'Unreal Engine, Word', weeks: 'T2 Weeks 1–5 · due Fri 29 May',
    overview: "The assessment for our Unreal work isn't the game you end up with — it's the skills journal you keep while learning. Think of it as a guide that could teach someone with no experience, and a reference future-you will genuinely use.",
    criteria: ['ICT-C4', 'ICT-C5'],
    elements: ['ICT-C4-b', 'ICT-C4-c', 'ICT-C4-e', 'ICT-C5-a', 'ICT-C5-d', 'ICT-C5-e', 'ICT-C5-h'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>Keep a skills journal in <strong>Word</strong> as you work through Unreal Engine. It should include <strong>tips, tricks and general software usage</strong> — written as a guide showing someone with no experience how to use different aspects of the software.</p>
<p>It will also become genuinely useful: when you come back later and can't remember how to do something, your journal is where you'll look.</p>
<p><a href="https://canvas.education.tas.gov.au/courses/94239/files/6208635" target="_blank" rel="noopener">Skills Journal Template.docx</a> (opens in Canvas — sign in first)</p>` },
      ],
      checklist: [
        'Journal kept in Word, updated as you learn (not written in one sitting at the end)',
        'Covers tips, tricks and general Unreal usage',
        'Clear enough to teach a beginner each feature you document',
        'Screenshots support the explanations',
      ],
      marking: [
        { criterion: 'ICT-C4', c: 'Documents real problem-solving in Unreal — features used, help/tutorials consulted, issues fixed.', a: 'Journal evidences advanced engine features, not just the basics.' },
        { criterion: 'ICT-C5', c: 'Journal maintained consistently across the Unreal weeks within the timeline.', a: 'Entries show planned, strategic skill-building rather than random exploration.' },
      ],
    },
  },

  {
    id: 'A3.2', unit_id: 'u3', code: '3.2', title: 'Unity Skills Journal',
    type: 'submission', sort: 32, est_time: 'Ongoing through the Unity weeks', tools: 'Unity, Word', weeks: 'T2 Weeks 5–7 · due Fri 12 Jun',
    overview: "Same deal as Unreal: the assessment is the journal, not the game. Document Unity as you learn it — tips, tricks and how-tos a beginner could follow.",
    criteria: ['ICT-C4', 'ICT-C5'],
    elements: ['ICT-C4-b', 'ICT-C4-c', 'ICT-C4-e', 'ICT-C5-a', 'ICT-C5-d', 'ICT-C5-e', 'ICT-C5-h'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>Keep a skills journal in <strong>Word</strong> as you work through Unity — <strong>tips, tricks and general software usage</strong>, written as a guide for someone with no experience. It doubles as your own future reference.</p>
<p>Two sample/example/template documents:</p>
<ul>
  <li><a href="https://canvas.education.tas.gov.au/courses/94239/files/6208635" target="_blank" rel="noopener">Template with a Photoshop example</a></li>
  <li><a href="https://canvas.education.tas.gov.au/courses/94239/files/6289651" target="_blank" rel="noopener">Template with an Unreal example</a></li>
</ul>
<p>(Both open in Canvas — sign in first.)</p>` },
      ],
      checklist: [
        'Journal kept in Word, updated as you learn',
        'Covers tips, tricks and general Unity usage',
        'A beginner could follow each documented feature',
        'Screenshots support the explanations',
      ],
      marking: [
        { criterion: 'ICT-C4', c: 'Documents real problem-solving in Unity — features used, help/tutorials consulted, issues fixed.', a: 'Journal evidences advanced engine features, not just the basics.' },
        { criterion: 'ICT-C5', c: 'Journal maintained consistently across the Unity weeks within the timeline.', a: 'Entries show planned, strategic skill-building rather than random exploration.' },
      ],
    },
  },

  {
    id: 'A3.3', unit_id: 'u3', code: '3.3', title: 'Game Skills Journal & Critical Reflection',
    type: 'submission', sort: 33, est_time: '10–15 min per lesson + 1 final lesson', tools: 'Your engine, Word', weeks: 'T2 Weeks 5–9 · due Fri 10 Jul',
    overview: "Across these 4–5 weeks of game-building, keep your journal ticking over every lesson — then close it out by turning the critical lens on your own game.",
    criteria: ['ICT-C2', 'ICT-C4', 'ICT-C5'],
    elements: ['ICT-C2-a', 'ICT-C4-b', 'ICT-C4-e', 'ICT-C5-c', 'ICT-C5-g'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>You are to keep a <strong>Skills Journal throughout these 4–5 weeks</strong>, updating it <strong>each lesson</strong> (10–15 minutes per lesson as a guide). Take screenshots to aid your explanation of each tool/feature you cover.</p>` },
        { title: 'Final Lesson — Critical Reflection', html: `
<p>In the last lesson, <strong>critically review your own game</strong>, including multiple screenshots of your environment and any programming/blueprinting you have done. Be honest: what works, what doesn't, and what you'd change.</p>` },
      ],
      checklist: [
        'Journal updated every lesson across the 4–5 weeks',
        'Screenshots support each tool/feature explanation',
        'Final critical review of your own game completed',
        'Review includes multiple screenshots of your environment and programming/blueprints',
      ],
      marking: [
        { criterion: 'ICT-C2', c: 'Reflection considers the game\'s audience and content responsibly.', a: 'Identifies social/ethical considerations specific to their own game and justifies design responses.' },
        { criterion: 'ICT-C4', c: 'Journal + reflection evidence sustained tool use and problem-solving in the engine.', a: 'Evidence of advanced engine features in the build.' },
        { criterion: 'ICT-C5', c: 'Regular lesson-by-lesson entries; reflection reviews progress against what was planned.', a: 'Reflection evaluates progress and sets out concrete future improvements.' },
      ],
    },
  },

  // ================= UNIT 4 — Design & Digital Citizenship =================
  {
    id: 'A4.1', unit_id: 'u4', code: '4.1', title: 'E-Waste',
    type: 'submission', sort: 41, est_time: '1–2 lessons', tools: 'Word, YouTube', weeks: 'T2 Week 8 · due Mon 22 Jun',
    overview: "Where does our technology go when we're done with it? Watch two documentaries — the e-waste dumps of Agbogbloshie, Ghana, and the engineered safety of Zipline's drone operations — and answer the ethics and OH&S questions they raise.",
    criteria: ['ESC-C2', 'ICT-C2', 'ICT-C3', 'ICT-C4'],
    elements: ['ESC-C2-a', 'ESC-C2-b', 'ICT-C2-a', 'ICT-C2-e', 'ICT-C2-f', 'ICT-C3-a', 'ICT-C3-c', 'ICT-C4-b', 'ICT-C4-d'],
    body: {
      sections: [
        { title: 'Background', html: `
<p>For thousands of years Aboriginal and Torres Strait Islander peoples have understood the interconnected relationship between people and the environment — practices and concepts of sustainability that kept the land healthy for generations. Facing today's environmental issues, that perspective of <em>responsibility to care for the world we live in</em> frames this task: the impact that producing (and dumping) technology has on the planet, and how we can minimise ours.</p>` },
        { title: 'Part 1 — The Global Life Cycle of Technology', html: `
<p>Watch: <a href="https://www.youtube.com/watch?v=eVnu0doouJI" target="_blank" rel="noopener">▶ First video (BBC/ENDEVR documentaries on Agbogbloshie, Ghana)</a></p>
<ol>
  <li><strong>Social responsibility and the "digital dump":</strong> the ENDEVR documentary notes that 35 OECD countries produce about half of the world's waste, while Africa produces only 5%. From an ethical standpoint, discuss whether the original manufacturers in Europe, Asia or America should be held responsible for the environmental impact in Ghana once their products become obsolete.</li>
  <li><strong>Environmental impacts:</strong> in Agbogbloshie, workers burn plastic and cables to extract valuable metals like copper. Identify the specific toxic metals released during this process and describe their impact on human health and the local environment (e.g. soil and water contamination).</li>
  <li><strong>Built-in obsolescence:</strong> define "compulsive consumerism" and "built-in obsolescence" based on the documentaries, and explain how they contribute to the ethical dilemma of "digital dumping" in developing nations.</li>
</ol>` },
        { title: 'Part 2 — Occupational Health & Safety', html: `
<p>Watch: <a href="https://www.youtube.com/watch?v=DOWDNBu9DkU" target="_blank" rel="noopener">▶ Second video (Mark Rober on Zipline's medical delivery drones)</a></p>
<ol>
  <li><strong>Specific OH&amp;S risks:</strong>
    <ul>
      <li><em>In Agbogbloshie:</em> identify three physical or chemical hazards faced by workers (such as Hanan or Peter) when dismantling or burning e-waste.</li>
      <li><em>In Zipline operations:</em> Mark Rober describes the "redundancy" built into the drones — backup propellers, automated parachutes. How do these engineering choices address OH&amp;S for the public and the operators?</li>
    </ul>
  </li>
  <li><strong>Methods to minimise impact:</strong> suggest two practical OH&amp;S improvements that could protect the workers in Agbogbloshie, and contrast these with the safety protocols at the Zipline launch sites. <em>(Describing methods to avoid, remove or minimise adverse impact is what earns an A rating in ICT Criterion 2.)</em></li>
</ol>` },
        { title: 'Submit', html: `
<p>Answer all questions in one document and upload it.</p>
<p><em>Reference: "Country and Sustainability" (2010), <a href="http://aries.mq.edu.au/projects/deewr_indigenous_concepts/index.php" target="_blank" rel="noopener">aries.mq.edu.au</a>.</em></p>` },
      ],
      checklist: [
        'Part 1: all 3 questions answered (responsibility, toxic metals, obsolescence)',
        'Part 2: hazards identified for both Agbogbloshie and Zipline',
        'Two practical OH&S improvements suggested and contrasted with Zipline protocols',
        'Answers in one document, uploaded',
      ],
      marking: [
        { criterion: 'ESC-C2', c: 'Interprets information from both documentaries accurately in the answers.', a: null },
        { criterion: 'ICT-C2', c: 'Describes the social and ethical issues of e-waste and the OH&S hazards shown.', a: 'Describes OH&S issues for the specific situations, their impact on health/safety, and methods to avoid, remove or minimise adverse impact.' },
        { criterion: 'ICT-C3', c: 'Collects information from the videos and communicates answers clearly.', a: 'Synthesises across both documentaries to build the compare/contrast answers.' },
        { criterion: 'ICT-C4', c: 'Uses video, web and document tools to complete the task.', a: null },
      ],
    },
  },

  {
    id: 'A4.2', unit_id: 'u4', code: '4.2', title: 'Game Design Brief',
    type: 'submission', sort: 43, est_time: '2–3 lessons', tools: 'Word', weeks: 'T2 Weeks 9–10 · due Wed 24 Jun',
    overview: "Before the major project, practise the paperwork: a design brief outlining what sort of game you're going to create. Keep it achievable — following a tutorial with your own adjustments is completely legitimate.",
    criteria: ['ESC-C4', 'ICT-C1', 'ICT-C5'],
    elements: ['ESC-C4-a', 'ICT-C1-b', 'ICT-C1-e', 'ICT-C5-b', 'ICT-C5-f'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>Complete a <strong>game design brief</strong> outlining what sort of game you are going to create.</p>
<ul>
  <li><a href="https://canvas.education.tas.gov.au/courses/94239/files/4963036" target="_blank" rel="noopener">Blank design brief</a> — start here.</li>
  <li><a href="https://canvas.education.tas.gov.au/courses/94239/files/4963037" target="_blank" rel="noopener">Sample design document</a> — if you're unsure what goes under any heading.</li>
</ul>
<p>(Both open in Canvas — sign in first.)</p>
<p><strong>Be realistic</strong> about what you can achieve — you'll probably need to spend some time working through one or more tutorials. For this task it is completely reasonable that your game follows a tutorial for the most part, with small adjustments to make it your own.</p>` },
      ],
      checklist: [
        'Every heading of the design brief template completed',
        'Scope is realistic for the time available (tutorial-based is fine)',
        'Engine/software choice named and suited to the game described',
      ],
      marking: [
        { criterion: 'ESC-C4', c: 'Works productively with the template and produces a usable brief.', a: null },
        { criterion: 'ICT-C1', c: 'Uses correct software/engine terminology throughout the brief.', a: 'Justifies the choice of engine and tools for this specific game.' },
        { criterion: 'ICT-C5', c: 'Brief sets achievable, realistic goals for the build ahead.', a: 'Goals are specific and measurable, with a plausible plan to reach them.' },
      ],
    },
  },

  // ================= UNIT 5 — Major Project (PRJ205118) =================
  {
    id: 'A5.1', unit_id: 'u5', code: '5.1', title: 'Project Brief + Game Design Document',
    type: 'submission', sort: 51, est_time: '2 weeks', tools: 'Word', weeks: 'T3 Weeks 1–2 · due Fri 31 Jul (BG2B class: Fri 7 Aug)',
    overview: "The major project starts on paper. Two documents: a project brief that pins down what you're making and how you'll manage it, and a game design document that specifies the game itself. There are 12 weeks all up — including planning and presentation — so your scope should reflect about 50 hours of work.",
    criteria: ['PRJ-C2'],
    elements: ['PRJ-C2-a', 'PRJ-C2-b', 'PRJ-C2-d'],
    body: {
      sections: [
        { title: 'The Project', html: `
<p>Come up with the main idea of your project. It should be <strong>gaming focused</strong>, using software covered in class this year — a game in <strong>Unreal, Unity3D or GameMaker Studio</strong> (other gaming-focused projects by negotiation).</p>
<p>There are <strong>12 weeks</strong> all up, including the planning and presentation stages, so your work should reflect the <strong>50 hours</strong>.</p>` },
        { title: 'Deliverable 1 — Project Brief', html: `
<p>A project brief communicates your project approach and how you'll manage the project according to scope. Handled with care, it acts as an agreement on:</p>
<ul>
  <li><strong>Project objectives</strong></li>
  <li><strong>Scope</strong> — how big or complex your game is. Keep it achievable</li>
  <li><strong>Major deliverables</strong></li>
  <li><strong>Milestones</strong></li>
  <li><strong>Timing</strong></li>
  <li><strong>Activities</strong></li>
  <li><strong>Process</strong></li>
  <li><strong>Resources</strong> needed to deliver your product</li>
</ul>
<p>Research what a project brief is and either create your own or use a template you find. Useful starting points:</p>
<ul>
  <li><a href="https://asana.com/resources/project-brief" target="_blank" rel="noopener">Asana — how to write a project brief</a></li>
  <li><a href="https://canvas.education.tas.gov.au/courses/94239/files/8111431" target="_blank" rel="noopener">Project Brief template</a> (Canvas — will need modification to suit your project)</li>
</ul>
<p>Or use this simple structure:</p>
<p><strong>Title of Game · Genre · Target Audience · Platform · Game Summary (elevator pitch) · Unique Selling Points · Key Features · Goals for the Project · Tools &amp; Software to be Used · Team Members and Roles (if applicable)</strong></p>
<p><em>Example (condensed): <strong>Pixel Runner</strong> — Platformer/Endless Runner · Teens 13–18 · PC (Windows), web-based · "A fast-paced 2D platformer racing through glitchy cyber-worlds, avoiding traps and collecting data fragments to repair a broken world." USPs: glitch art style, dynamic speed, custom level editor. Goals: playable demo with 3 levels; learn physics and animation in Unity. Tools: Unity, Photoshop, Audacity. Solo project.</em></p>` },
        { title: 'Deliverable 2 — Game Design Document', html: `
<p>For the GDD you may use the template from earlier in Term 2 — <a href="https://canvas.education.tas.gov.au/courses/94239/files/4963036" target="_blank" rel="noopener">template</a> / <a href="https://canvas.education.tas.gov.au/courses/94239/files/4963037" target="_blank" rel="noopener">example</a> (Canvas) — or structure it with these sections:</p>
<ol>
  <li><strong>Game Overview</strong> — name, genre, platform, target audience</li>
  <li><strong>Core Gameplay</strong> — objective, mechanics (movement, combat, puzzles…), controls</li>
  <li><strong>Story and Narrative</strong> — setting, characters, plot summary, progression</li>
  <li><strong>Art and Audio</strong> — art style, key visual elements (characters, UI, environments), sound design (music, SFX)</li>
  <li><strong>Levels/World Design</strong> — number of levels/areas, level design summary, progression system</li>
  <li><strong>Technical Details</strong> — engine, tools, assets (original, Creative Commons, purchased)</li>
  <li><strong>UI/UX</strong> — HUD, menus, feedback (health bars, animations…)</li>
  <li><strong>Monetisation/Distribution</strong> (if relevant) — free/paid, distribution platform</li>
</ol>
<p>A strong GDD also nails down <strong>MVP (minimum viable product) goals</strong> — the smallest version that counts as done (e.g. one playable level with win/lose states and working menus) — plus <strong>stretch goals</strong> for if time allows. The full worked "Pixel Runner" example GDD is on the Canvas assignment page if you want to see every section filled in.</p>` },
      ],
      checklist: [
        'Project is gaming-focused and uses class software (Unreal / Unity3D / GameMaker Studio)',
        'Scope reflects 12 weeks / ~50 hours including planning and presenting',
        'Project brief covers objectives, scope, deliverables, milestones, timing, activities, process, resources',
        'GDD covers all 8 sections (overview → distribution)',
        'MVP goals are defined and genuinely achievable',
        'Both documents submitted',
      ],
      marking: [
        { criterion: 'PRJ-C2', c: 'Clearly communicates the project\'s nature, scope, processes and goals in writing across both documents, using appropriate templates and tools.', a: null },
      ],
    },
  },

  {
    id: 'A5.2', unit_id: 'u5', code: '5.2', title: 'Project Plan + Gantt Chart',
    type: 'submission', sort: 53, est_time: '1 week', tools: 'Word, Excel (or your choice of planning tool)', weeks: 'T3 Week 3 · due Fri 7 Aug',
    overview: "The brief said what; the plan says when. Research project plans, focus hard on timing and scheduling, and build the Gantt chart you'll actually steer the project by — you'll refer back to it every week.",
    criteria: ['PRJ-C1', 'PRJ-C2'],
    elements: ['PRJ-C1-a', 'PRJ-C1-c', 'PRJ-C1-e', 'PRJ-C2-a', 'PRJ-C2-c', 'PRJ-C2-d'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>Create a <strong>project plan</strong> for the game creation project you'll be working on this term. Spend some time researching project plans — you may use a template, modified to suit your requirements.</p>
<p>Focus on the <strong>timing/scheduling</strong> of your project. The best way is a <strong>Gantt chart</strong> or similar. You will need to refer back to it regularly to ensure your project stays on track.</p>` },
        { title: 'Submit BOTH', html: `
<ul>
  <li><strong>A Project Plan</strong></li>
  <li><strong>A Gantt Chart</strong></li>
</ul>
<p>Templates and examples (open in Canvas — sign in first):</p>
<ul>
  <li><a href="https://canvas.education.tas.gov.au/courses/94239/files/11269333" target="_blank" rel="noopener">Project Plan template</a> · <a href="https://canvas.education.tas.gov.au/courses/94239/files/11269338" target="_blank" rel="noopener">example Project Plan</a></li>
  <li><a href="https://canvas.education.tas.gov.au/courses/94239/files/5125847" target="_blank" rel="noopener">Sample Gantt chart</a> · <a href="https://canvas.education.tas.gov.au/courses/94239/files/6631827" target="_blank" rel="noopener">another Gantt example</a></li>
</ul>
<p>Alternatively use a different template or create your own (recommended).</p>
<p><a href="https://www.youtube.com/watch?v=ORH37YP6ao0" target="_blank" rel="noopener">▶ Video: building a Gantt chart</a></p>` },
        { title: 'What\'s Assessed', html: `
<p>The two criteria assessed are:</p>
<ol>
  <li>Work productively to negotiate and complete tasks</li>
  <li>Communicate ideas and information</li>
</ol>` },
      ],
      checklist: [
        'Project plan complete (template modified to suit your project, or your own)',
        'Gantt chart schedules the whole build with realistic task durations',
        'Timing lines up with the 12-week / 50-hour project window',
        'BOTH documents submitted',
      ],
      marking: [
        { criterion: 'PRJ-C1', c: 'Plan is negotiated, realistic and prioritised so the project can be delivered in the timeframe.', a: null },
        { criterion: 'PRJ-C2', c: 'Plan and Gantt communicate the schedule clearly using appropriate digital tools.', a: null },
      ],
    },
  },

  {
    id: 'A5.3', unit_id: 'u5', code: '5.3', title: 'Major Project — Build, Journal & Write-Up',
    type: 'submission', sort: 55, est_time: 'Terms 3–4', tools: 'Your engine, Word, OneDrive', weeks: 'T3–T4 · due Fri 30 Oct',
    overview: "The culmination of months of work — and your journal, project and documentation should reflect this. Three parts: the game itself, the lesson-by-lesson development journal, and a final write-up of what you built and learned.",
    criteria: ['PRJ-C1', 'PRJ-C3', 'PRJ-C4', 'PRJ-C5'],
    elements: ['PRJ-C1-b', 'PRJ-C1-c', 'PRJ-C1-e', 'PRJ-C3-a', 'PRJ-C3-c', 'PRJ-C3-d', 'PRJ-C4-a', 'PRJ-C4-b', 'PRJ-C4-d', 'PRJ-C5-a', 'PRJ-C5-d', 'PRJ-C5-e'],
    body: {
      sections: [
        { title: 'The Journal', html: `
<p>A lesson-by-lesson entry, every lesson, each including the <strong>date</strong> and:</p>
<ul>
  <li>What was achieved?</li>
  <li>Is the plan still to schedule?</li>
  <li>Are there any changes required to the plan?</li>
  <li>What will be worked on next time?</li>
</ul>
<p><a href="https://canvas.education.tas.gov.au/courses/94239/files/8188722" target="_blank" rel="noopener">Journal template</a> (opens in Canvas — sign in first)</p>` },
        { title: 'The Write-Up', html: `
<p>Starting <strong>Week 1 of Term 4</strong>, write up an explanation of your project. Include:</p>
<ul>
  <li>a review of what your project was</li>
  <li>what you achieved</li>
  <li>what learning took place</li>
</ul>
<p>This is <em>not</em> a journal-style document — it's a number of pages detailing the points above, with images and screenshots. As a guide, <strong>1½ pages minimum</strong>, roughly half images and half text.</p>` },
        { title: 'Term 4 Weeks 1–2 Overview', html: `
<ul>
  <li>Finish project, including goal setting and reflection journal — <strong>Monday Week 2</strong></li>
  <li>Complete project write-up — start Wednesday Week 2, <strong>due Friday Week 2</strong></li>
  <li>Submit the journal, the project, and access to your game (a link to your OneDrive is probably best)</li>
  <li>See the Presentation task and prepare — presentations run Monday and Wednesday of Week 3</li>
</ul>` },
      ],
      checklist: [
        'Game finished to (at least) the MVP defined in your brief',
        'Journal has a dated entry for every lesson covering all 4 questions',
        'Write-up: review, achievements and learning across 1½+ pages, half images / half text',
        'Journal + write-up + game access (e.g. OneDrive link) all submitted',
      ],
      marking: [
        { criterion: 'PRJ-C1', c: 'Delivers the agreed project within the timeframe, adapting the plan where needed (documented in the journal).', a: null },
        { criterion: 'PRJ-C3', c: 'Journal documents roles, goals and consultation with stakeholders (teacher, testers, teammates).', a: null },
        { criterion: 'PRJ-C4', c: 'Journal and build evidence goal-setting, problem solving and adaptation to changing conditions.', a: null },
        { criterion: 'PRJ-C5', c: 'Write-up explains how the parts of the project came together, documents problems solved, and reflects on the learning.', a: null },
      ],
    },
  },

  {
    id: 'A5.4', unit_id: 'u5', code: '5.4', title: 'Presentation',
    type: 'submission', sort: 58, est_time: '3–6 minutes + prep', tools: 'Your game, the classroom TV', weeks: 'T4 Week 3 · date TBC in Canvas',
    overview: "Present your finished project to the class: what it was, what went wrong, how you fixed it, and whether you hit the goals in your plan — then prove it by playing the game on the TV.",
    criteria: ['PRJ-C3', 'PRJ-C4', 'PRJ-C5'],
    elements: ['PRJ-C3-d', 'PRJ-C3-e', 'PRJ-C4-b', 'PRJ-C4-d', 'PRJ-C5-b', 'PRJ-C5-e'],
    body: {
      sections: [
        { title: 'Requirements', html: `
<p>Present your finalised project to the class, at Rob's direction, in a lesson in <strong>Week 3 of Term 4</strong>. Presentation order is set randomly — <strong>be ready from Monday of Week 3</strong>.</p>
<ul>
  <li>Outline what your project was</li>
  <li>What challenges you faced, and how you overcame them</li>
  <li>Did you meet the objectives set in your project plan?</li>
  <li><strong>Demonstrate your project by playing it (on the TV)</strong></li>
</ul>
<p>Length: <strong>3–6 minutes</strong>.</p>` },
        { title: 'Before You Present', html: `
<p>Have the <strong>nominated tester</strong> of your project test it <em>prior</em> to your presentation — you don't want the demo to be the first time someone else has run your build.</p>` },
      ],
      checklist: [
        'Covers project outline, challenges + solutions, and objectives vs plan',
        'Live demo of the game on the TV',
        'Runs 3–6 minutes',
        'Nominated tester has tested the build before presentation day',
        'Ready to go from Monday of Week 3 (random order)',
      ],
      marking: [
        { criterion: 'PRJ-C3', c: 'Presentation documents the tester\'s involvement and communicates respectfully with the audience.', a: null },
        { criterion: 'PRJ-C4', c: 'Clearly explains the problems encountered and the strategies used to solve them.', a: null },
        { criterion: 'PRJ-C5', c: 'Honestly reflects on objectives met (or not) and what would be done differently.', a: null },
      ],
    },
  },
];

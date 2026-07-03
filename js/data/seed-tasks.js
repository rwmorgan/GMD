/* ============================================================
   Task seed: all 21 submission tasks ported from the original
   Level Up site (units 1–6), with criterion AND element-level
   assessment mappings.

   body.sections[].html is trusted teacher-authored HTML.
   criteria: criterion ids assessed. elements: element ids.
   marking: rubric rows shown to students and used in the
   teacher marking queue.
   ============================================================ */

export const tasks = [

  // ================= UNIT 1 =================
  {
    id: 'T1.1', unit_id: 'u1', code: '1.1', title: 'Tool Identification & Hardware Report',
    type: 'submission', sort: 11, est_time: '2–3 lessons', tools: 'Word, browser', weeks: 'Weeks 1–2',
    overview: "Game developers choose specific tools for specific jobs — the wrong tool wastes time and can ruin a project. In this task you'll demonstrate that you can identify the right digital technology for a given game development scenario, and that you understand the hardware that runs it all.",
    criteria: ['ESC-C1', 'ESC-C2', 'ICT-C1'],
    elements: ['ESC-C1-a', 'ESC-C1-b', 'ESC-C2-a', 'ESC-C2-b', 'ICT-C1-a', 'ICT-C1-b', 'ICT-C1-c', 'ICT-C1-e', 'ICT-C1-f'],
    body: {
      sections: [
        { title: 'Part A — Tool Identification (ESC C1, C2)', html: `
<p>For each of the 6 scenarios below, identify the <strong>most appropriate software</strong> and <strong>hardware</strong> for the task. For each answer, write one sentence justifying your choice using correct terminology.</p>
<ol>
  <li>You're designing the main character sprite for a 2D pixel art platformer.</li>
  <li>You want to record and edit background music for a horror game.</li>
  <li>You're building a 3D open-world game with photo-realistic graphics.</li>
  <li>You need to track your project tasks and deadlines across a 12-week build.</li>
  <li>You want to write up a Game Design Document to share with your team.</li>
  <li>You're building a simple top-down 2D game for the first time and need beginner-friendly scripting.</li>
</ol>
<p>Present Part A as a clearly formatted table in Microsoft Word: <strong>Scenario | Software Choice | Hardware Required | Justification</strong>.</p>` },
        { title: 'Part B — Hardware Comparison Report (ICT C1)', html: `
<p>Research and document the hardware specifications for each of the three game engines available in your course: <strong>Unity3D</strong>, <strong>Unreal Engine</strong>, and <strong>Game Maker Studio 2</strong>.</p>
<ul>
  <li>Minimum and recommended CPU, RAM, GPU, and storage for each engine</li>
  <li>Operating system requirements</li>
  <li>Whether your school lab computers meet these requirements (check against what's actually installed)</li>
  <li>Three common file types used in each engine (e.g. <code>.unity</code>, <code>.yyp</code>, <code>.uasset</code>) and what they contain</li>
</ul>
<p>Present Part B as a structured Word document with a heading, a comparison table, and a short paragraph conclusion (which engine is best suited to your school lab and why?). Include your sources in a bibliography at the end using APA format.</p>` },
      ],
      checklist: [
        'Part A table in Word: all 6 scenarios answered with justification using correct terminology',
        'Part B: comparison table covering CPU, RAM, GPU, storage, OS for all 3 engines',
        'Part B: file types listed and explained for each engine',
        'Part B: conclusion paragraph comparing lab hardware to requirements',
        'Document uses correct headings, formatting, and APA bibliography',
        'File saved as Task1.1_Firstname_Lastname.docx',
      ],
      marking: [
        { criterion: 'ESC-C1', c: 'Correctly identifies digital tools and hardware for all 6 scenarios using appropriate terminology.', a: null },
        { criterion: 'ESC-C2', c: 'Correctly interprets documentation/specs to identify hardware requirements. Uses terminology accurately.', a: null },
        { criterion: 'ICT-C1', c: 'Correctly identifies hardware components and describes usage. Identifies software types and file formats. Applies file management skills (correct file naming and saving).', a: 'Identifies hardware and software for specific purposes and justifies the choice. Applies knowledge to solve a real-world problem (lab suitability).' },
      ],
    },
  },

  {
    id: 'T1.2', unit_id: 'u1', code: '1.2', title: 'File Management & Project Setup',
    type: 'submission', sort: 12, est_time: '2 lessons', tools: 'File Explorer / Finder, OneDrive, Word', weeks: 'Weeks 2–3',
    overview: "Professional game developers use organised, consistent file structures. A disorganised project leads to lost assets, broken builds, and confusion in teams. In this task you'll set up a full project folder hierarchy, demonstrate key file management skills, and review your own setup against a specification.",
    criteria: ['ESC-C2', 'ESC-C3', 'ICT-C1'],
    elements: ['ESC-C2-a', 'ESC-C2-b', 'ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C1-b', 'ICT-C1-c', 'ICT-C1-d', 'ICT-C1-e', 'ICT-C1-f'],
    body: {
      sections: [
        { title: 'Specification — Folder Structure to Create', html: `
<p>Following the structure below exactly (including naming conventions), create the folder hierarchy on your school computer <strong>and</strong> mirrored in OneDrive:</p>
<pre>MyGame_[YourName]/
├── 01_Documentation/
│   ├── GDD/
│   └── Research/
├── 02_Assets/
│   ├── Art/
│   │   ├── Sprites/
│   │   ├── Tilesets/
│   │   └── UI/
│   ├── Audio/
│   │   ├── SFX/
│   │   └── Music/
│   └── Video/
├── 03_Project_Files/
│   ├── [Engine_Name]/
│   └── Builds/
└── 04_Portfolio/
    └── Screenshots/</pre>` },
        { title: 'Part A — Setup & Demonstrate (ESC C2, C3 · ICT C1)', html: `
<ol>
  <li>Create the complete folder structure above on your school drive. Screenshot the completed structure showing all folders open/visible.</li>
  <li>Create a sample file in each of the following folders using the correct file type: a <code>.docx</code> in Documentation, a <code>.png</code> in Sprites (a placeholder image), and a <code>.pdf</code> in GDD (export any Word doc as PDF).</li>
  <li>Set up OneDrive sync for this folder. Screenshot showing the folder synced (with the sync icon visible).</li>
  <li>Rename three files to demonstrate correct naming conventions (no spaces, use underscores, include version numbers: e.g. <code>player_sprite_v1.png</code>).</li>
  <li>Duplicate one file, then delete the duplicate. Screenshot showing the file in the Recycle Bin before permanent deletion.</li>
</ol>` },
        { title: 'Part B — File Types Reference Sheet (ICT C1)', html: `
<p>Create a Word document titled <strong>"Game Project File Types Reference"</strong> listing and explaining at least 10 file types used in game development. For each type, include: file extension, what it is, which software creates/opens it, and whether it is lossy or lossless (for media types). Format using a table with heading row.</p>
<p>Include at minimum: .png, .jpg, .wav, .mp3, .pdf, .docx, .xlsx, one engine-specific format (e.g. .yyp, .unity, .uasset), .zip, and one of your choice.</p>` },
        { title: 'Part C — Self-Review (ESC C3)', html: `
<p>Add a "Review" section to your Word document. Answer these questions in 3–5 sentences each:</p>
<ul>
  <li>Does your folder structure match the specification exactly? If not, what differs and why?</li>
  <li>What file management skills did you already know? What was new?</li>
  <li>Why is cloud backup (OneDrive) important for a game development project?</li>
</ul>` },
      ],
      checklist: [
        'Screenshots showing complete folder structure on school drive',
        'Screenshot showing OneDrive sync active',
        'Screenshot of Recycle Bin with deleted duplicate',
        'File types reference table (minimum 10 types, all fields completed)',
        'Self-review section: 3 questions answered in full sentences',
        'File saved as Task1.2_Firstname_Lastname.docx with screenshots embedded',
      ],
      marking: [
        { criterion: 'ESC-C2', c: 'Correctly interprets the folder specification and uses it to set up the structure. Terminology used accurately (cloud storage, file types, backup).', a: null },
        { criterion: 'ESC-C3', c: 'Follows all setup steps as specified. Uses digital technologies (OneDrive, file explorer, Word) to complete tasks. Undertakes self-review addressing all three prompts.', a: null },
        { criterion: 'ICT-C1', c: 'Applies file management skills (open, save, rename, duplicate, delete, transfer to cloud). Identifies 10+ file formats and describes their usage. Describes cloud storage and backup as data storage issues.', a: 'Applies knowledge to justify specific file choices (e.g. .png over .jpg for sprites). Identifies security/backup implications for a game project.' },
      ],
    },
  },

  {
    id: 'T1.3', unit_id: 'u1', code: '1.3', title: 'Digital Ethics & Safe Practice in Games',
    type: 'submission', sort: 13, est_time: '2–3 lessons', tools: 'Adobe Express or Word, browser', weeks: 'Weeks 3–4',
    overview: "As a game developer and digital creator, you'll encounter copyright, online communities, personal information, and screen-based health hazards every day. This task builds your awareness and compliance with the principles and guidelines that govern professional digital work.",
    criteria: ['ESC-C4', 'ICT-C2'],
    elements: ['ESC-C4-a', 'ESC-C4-b', 'ESC-C4-c', 'ESC-C4-d', 'ESC-C4-e', 'ICT-C2-a', 'ICT-C2-b', 'ICT-C2-c', 'ICT-C2-d', 'ICT-C2-e', 'ICT-C2-f'],
    body: {
      sections: [
        { title: 'Part A — Infographic: Safe Digital Practice for Game Devs (ESC C4)', html: `
<p>Create a <strong>single-page infographic</strong> using Adobe Express or Microsoft Publisher/Word that covers all five of the following areas. Each area must have a heading, at least 2 dot points, and a practical example relevant to game development.</p>
<ol>
  <li><strong>OHS for screen-based work</strong> — ergonomic setup (chair height, monitor distance, lighting), rest breaks, eye strain. Include the specific guidelines for your school lab.</li>
  <li><strong>Physical hazards in the lab</strong> — trip hazards (cables), spill hazards (drinks near equipment), electrical hazards (overloaded power boards). What do you do if you see one?</li>
  <li><strong>Internet and email etiquette (netiquette)</strong> — professional vs casual communication, acceptable use policy, the difference between personal and school/work use of the internet.</li>
  <li><strong>Social media safety for indie developers</strong> — safe vs unsafe practices when sharing WIP (work-in-progress) game content online. Risks: harassment, spoilers, unfinished screenshots, revealing personal information. Include at least one example of a real platform (e.g. Twitter/X, itch.io, Discord).</li>
  <li><strong>Using other people's work</strong> — copyright, Creative Commons licences (CC0, CC BY, CC BY-NC), and what "public domain" means. When can you use a free asset from the internet in your game? What do you have to do?</li>
</ol>
<p>Save the infographic as a PDF. It will be displayed/presented to the class.</p>` },
        { title: 'Part B — Written Response: Ethical Scenarios (ICT C2)', html: `
<p>In a Word document, respond to each of the following 4 scenarios in 3–5 sentences. Use correct terminology and reference relevant laws, principles, or guidelines where applicable.</p>
<ol>
  <li>You find a piece of background music on YouTube that perfectly fits your game. The video has no licence information. Can you use it? What should you do?</li>
  <li>A classmate posts a screenshot of your unfinished game on Instagram without asking you. Is this a problem? What are your options?</li>
  <li>You're using the school computers to research games during class, but you want to check your personal Instagram. What does the school's acceptable use policy say about this? What are the risks?</li>
  <li>You've been sitting at the computer for 3 hours straight working on your game. What should you do, and why does it matter?</li>
</ol>` },
      ],
      checklist: [
        'Infographic (PDF): covers all 5 areas with headings, dot points, and game dev examples',
        'Infographic is visually clear and legible (could be printed as A4 and read)',
        'Written response (Word): 4 scenarios answered in 3–5 sentences each',
        'Correct terminology used throughout (copyright, Creative Commons, ergonomics, netiquette, AUP)',
        'Submitted: Task1.3_Firstname_Lastname.pdf + Task1.3_Firstname_Lastname.docx',
      ],
      marking: [
        { criterion: 'ESC-C4', c: 'Follows lab OHS guidelines and identifies physical hazards. Describes internet/email etiquette and school AUP. Describes safe and unsafe social media practices. Correctly describes principles for using others\' work.', a: null },
        { criterion: 'ICT-C2', c: 'Describes social and ethical issues (privacy, cyber bullying, IP). Correctly describes copyright and Creative Commons. Describes and complies with OHS procedures.', a: 'Correctly identifies issues in specific scenarios and justifies the reasoning. Accurately describes OHS impact on individual health and methods to minimise adverse impact.' },
      ],
    },
  },

  // ================= UNIT 2 =================
  {
    id: 'T2.1', unit_id: 'u2', code: '2.1', title: 'Genre Research Report',
    type: 'submission', sort: 21, est_time: '2–3 lessons', tools: 'Word, browser', weeks: 'Weeks 5–6',
    overview: 'Before designing your game, you need to understand your genre deeply — its conventions, audience expectations, successful examples, and common pitfalls. This task trains you to research like a professional: from multiple sources, with critical evaluation, and with correct attribution.',
    criteria: ['ESC-C2', 'ESC-C3', 'ICT-C3'],
    elements: ['ESC-C2-a', 'ESC-C2-b', 'ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C3-a', 'ICT-C3-b', 'ICT-C3-c', 'ICT-C3-d', 'ICT-C3-e'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<ol>
  <li>Choose a game genre you're considering for your own game (e.g. platformer, puzzle, top-down shooter, RPG, horror, simulation, endless runner, tower defence). Get your choice approved by your teacher before proceeding.</li>
  <li>Research your chosen genre using <strong>at least 4 sources</strong>. At least one source must be a non-website source (e.g. a book, academic paper, published article, or industry report). Recommended: GDC talks (gdcvault.com), Game Developer Magazine, Wikipedia (as a starting point only — not a primary source).</li>
  <li>Collect and synthesise information on: the history of the genre, its defining mechanics, target audience, 3 successful examples (with release year, developer, platform, and what made each successful), and 2 common design challenges for this genre.</li>
  <li>Write a structured research report in Word using the template below. Format using heading styles (Heading 1, Heading 2), insert a comparison table of the 3 examples, and include a bibliography (APA format) at the end.</li>
  <li>Self-review: at the end of the document, add a "Review" section answering — Was your information consistent across sources? Did you find conflicting information? What would you research further?</li>
</ol>` },
        { title: 'Report Structure', html: `
<p><strong>1. Introduction</strong> — What is the genre? Why did you choose it?</p>
<p><strong>2. Genre History</strong> — When did it emerge? How has it evolved?</p>
<p><strong>3. Defining Mechanics</strong> — What gameplay elements define this genre? What does the player do?</p>
<p><strong>4. Target Audience</strong> — Who plays these games? Age, platform, preferences.</p>
<p><strong>5. Case Studies</strong> — Comparison table of 3 games (title, year, dev, platform, what made it successful)</p>
<p><strong>6. Design Challenges</strong> — What are 2 common problems developers face in this genre?</p>
<p><strong>7. Review</strong> — Source evaluation and what you'd research further</p>
<p><strong>8. Bibliography</strong> — APA format, minimum 4 sources</p>` },
      ],
      checklist: [
        'Genre choice approved by teacher before submission',
        'Minimum 4 sources (at least 1 non-website)',
        'All 7 report sections present with correct Word heading styles',
        'Comparison table of 3 games with all required fields',
        'Self-review section addresses source consistency and further research needs',
        'APA bibliography with at least 4 entries',
        'Saved as Task2.1_Firstname_Lastname.docx',
      ],
      marking: [
        { criterion: 'ESC-C2', c: 'Correctly interprets information and terminology from at least 4 sources. Demonstrates understanding of genre terminology and uses it accurately throughout the report.', a: null },
        { criterion: 'ESC-C3', c: 'Follows the report structure specification. Uses Word correctly (headings, table, bibliography). Completes self-review addressing all three prompts.', a: null },
        { criterion: 'ICT-C3', c: 'Collects relevant information from a range of sources including the internet. Re-synthesises information into a logical, structured presentation. Uses Word to clearly present ideas and information.', a: 'Assesses the relevance, accuracy and completeness of collected information (source evaluation section). Considers and effectively addresses the needs of the audience (clear structure, consistent formatting, reader-ready presentation).' },
      ],
    },
  },

  {
    id: 'T2.2', unit_id: 'u2', code: '2.2', title: 'Game Concept Pitch',
    type: 'submission', sort: 22, est_time: '2 lessons', tools: 'Word or Adobe Express, verbal', weeks: 'Weeks 6–7',
    overview: "Game developers pitch ideas constantly — to publishers, investors, teammates, and players. A good pitch is concise, specific, and hooks the audience in 2 minutes. In this task you'll develop a one-page concept document and deliver a verbal pitch to the class, then incorporate the feedback you receive.",
    criteria: ['ESC-C3', 'ICT-C3'],
    elements: ['ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C3-b', 'ICT-C3-c', 'ICT-C3-e'],
    body: {
      sections: [
        { title: 'Part A — Concept Document (1 page max)', html: `
<p>Using Word or Adobe Express, create a visually clear one-page game concept document containing:</p>
<ul>
  <li><strong>Working title</strong> of your game</li>
  <li><strong>Genre</strong> (from your Task 2.1 research)</li>
  <li><strong>Target audience</strong> — age range, platform, why this audience?</li>
  <li><strong>One-sentence concept</strong> ("It's like [known game] but [your twist]")</li>
  <li><strong>Core mechanic</strong> — the one main thing the player does repeatedly</li>
  <li><strong>Win/fail condition</strong> — how does the player succeed or fail?</li>
  <li><strong>Visual style reference</strong> — 1–2 images from existing games that show the style you're going for (label your sources)</li>
  <li><strong>Chosen engine</strong> — Unity, Unreal, or GMS2 — and why you chose it for this game</li>
</ul>` },
        { title: 'Part B — 2-Minute Verbal Pitch', html: `
<p>Present your concept document to the class. Cover all 8 points in under 2 minutes. Be specific — "a fun game" is not a description. Practice beforehand.</p>
<p>After your pitch, your classmates and teacher will provide written feedback using the peer feedback form (provided by teacher). You must collect at least 3 written feedback responses.</p>` },
        { title: 'Part C — Feedback Response (ESC C3)', html: `
<p>Add a "Feedback Received &amp; Response" section to your concept document. For each piece of feedback received:</p>
<ul>
  <li>Quote or summarise the feedback</li>
  <li>State whether you will incorporate it and why/why not</li>
  <li>If you will incorporate it, describe how it changes your concept</li>
</ul>` },
      ],
      checklist: [
        'Concept document: all 8 required fields present on one page',
        'Visual style references: images included and labelled with source',
        'Engine choice justified (not just named)',
        'Feedback Response section: minimum 3 feedback items addressed',
        'Document is legible and clear enough to read projected on a screen',
        'Saved as Task2.2_Firstname_Lastname.pdf',
      ],
      marking: [
        { criterion: 'ESC-C3', c: 'Follows the concept document specification (all 8 fields). Successfully pitches to the class. Completes feedback response section addressing all received feedback.', a: null },
        { criterion: 'ICT-C3', c: 'Selects and re-synthesises genre research into a clear concept. Uses digital tools (Word/Express) to present ideas. Communicates ideas verbally to the class audience.', a: "Effectively addresses the needs of the audience in the document design and pitch delivery. Feedback response demonstrates consideration of the audience's perspective." },
      ],
    },
  },

  {
    id: 'T2.3', unit_id: 'u2', code: '2.3', title: 'Game Design Document + Gantt Chart',
    type: 'submission', sort: 23, est_time: '3–4 lessons', tools: 'Word, Excel', weeks: 'Weeks 7–9',
    overview: 'A Game Design Document (GDD) is the definitive reference for your project. It keeps your own work focused and would allow another developer to understand and continue your game. Your Gantt chart is your project timeline — a measurable, realistic plan for building the game across Units 4 and 5.',
    criteria: ['ESC-C2', 'ESC-C3', 'ICT-C3', 'ICT-C5'],
    elements: ['ESC-C2-a', 'ESC-C2-b', 'ESC-C3-a', 'ESC-C3-b', 'ICT-C3-a', 'ICT-C3-b', 'ICT-C3-c', 'ICT-C3-d', 'ICT-C3-e', 'ICT-C5-b', 'ICT-C5-c', 'ICT-C5-f', 'ICT-C5-g'],
    body: {
      sections: [
        { title: 'Part A — Game Design Document (Word)', html: `
<p>Using the GDD template, produce a complete Game Design Document. All sections are required. Minimum total length: 600 words (not counting tables or lists).</p>
<p><strong>Section 1: Project Overview</strong> — Title, genre, target platform, target audience, one-paragraph concept summary, chosen engine and justification</p>
<p><strong>Section 2: Gameplay Mechanics</strong> — Core mechanic (detailed), secondary mechanics, controls layout (diagram or table), win condition, fail condition, difficulty progression</p>
<p><strong>Section 3: Characters &amp; World</strong> — Player character description, at least 1 enemy/NPC (behaviour, appearance), world/level setting, brief narrative (even for simple games)</p>
<p><strong>Section 4: Level Design</strong> — Level 1 sketch/map (hand-drawn and scanned, or digital), description of at least 2 distinct level types or areas</p>
<p><strong>Section 5: Art Direction</strong> — Visual style (pixel art, cartoon, realistic?), colour palette (show swatches), reference images (sourced and attributed), UI wireframe sketch</p>
<p><strong>Section 6: Audio Direction</strong> — Music style/tone, list of required SFX (at least 5), any voice acting?</p>
<p><strong>Section 7: Technical Scope</strong> — Engine, target platform, estimated number of scenes/rooms/levels, known technical constraints</p>
<p><strong>Section 8: Risk Register</strong> — Table: 4 potential risks to the project, likelihood (H/M/L), impact (H/M/L), mitigation strategy</p>
<p>Use Word Heading Styles throughout. Include a Table of Contents (Insert → Table of Contents → Automatic). Number all pages.</p>` },
        { title: 'Part B — Gantt Chart (Excel)', html: `
<p>Create a Gantt chart in Excel covering <strong>Weeks 15–22</strong> (Units 4 and 5) showing all planned development tasks. Requirements:</p>
<ul>
  <li>At least 12 individual tasks listed (rows)</li>
  <li>Weeks shown as columns (Week 15 through Week 22)</li>
  <li>Colour-coded by category (e.g. setup, art, coding, audio, testing)</li>
  <li>Task owner column — even if you're working alone, list which "hat" you're wearing (developer, artist, designer, tester)</li>
  <li>Each task has a clear name (e.g. "Implement player jump" not "Coding")</li>
</ul>` },
      ],
      checklist: [
        'GDD: all 8 sections present and completed',
        'GDD: Table of Contents, heading styles, page numbers',
        'GDD: minimum 600 words body text (not counting tables/lists)',
        'GDD: level map/sketch included (Section 4)',
        'GDD: risk register table with 4 risks, likelihood, impact, and mitigation',
        'Gantt: covers Weeks 15–22, minimum 12 tasks, colour-coded by category',
        'Gantt: uses Excel formulas or conditional formatting for colours',
        'Files: Task2.3_GDD_Firstname_Lastname.docx + Task2.3_Gantt_Firstname_Lastname.xlsx',
      ],
      marking: [
        { criterion: 'ESC-C2', c: 'Correctly interprets the GDD template specification and uses Word features (heading styles, TOC, page numbers) as directed.', a: null },
        { criterion: 'ESC-C3', c: 'Follows the GDD spec with all required sections. Uses Word and Excel to complete tasks. Gantt reflects realistic timeline and task breakdown.', a: null },
        { criterion: 'ICT-C3', c: 'Collects and re-synthesises genre research, concept, and planning into a logical GDD. Uses Word to clearly present a complete design document.', a: 'GDD demonstrates assessment of relevance and completeness of design decisions. Effectively addresses the needs of a reader who has never seen the game concept.' },
        { criterion: 'ICT-C5', c: 'Sets goals that are measurable (Gantt tasks), achievable, and time-referenced (weeks). Follows the GDD specification structure. Reflects on project scope in the Technical Scope section.', a: 'Goals are measurable, achievable, specific, time-referenced and realistic. Risk register demonstrates ability to evaluate and plan for change. Evidence of self-direction in planning decisions.' },
      ],
    },
  },

  // ================= UNIT 3 =================
  {
    id: 'T3.1', unit_id: 'u3', code: '3.1', title: 'Sprite & UI Asset Pack',
    type: 'submission', sort: 31, est_time: '3–4 lessons', tools: 'Photoshop or Illustrator', weeks: 'Weeks 10–11',
    overview: "The player character and UI are the first things a player sees. They define the visual identity of your game. In this task you'll create a complete sprite pack for your player character and the core UI elements your game needs, exported to the exact specifications your chosen engine requires.",
    criteria: ['ESC-C1', 'ESC-C3', 'ICT-C3', 'ICT-C4'],
    elements: ['ESC-C1-a', 'ESC-C1-b', 'ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C3-b', 'ICT-C3-c', 'ICT-C3-d', 'ICT-C3-e', 'ICT-C4-a', 'ICT-C4-b', 'ICT-C4-c', 'ICT-C4-e', 'ICT-C4-f'],
    body: {
      sections: [
        { title: 'Deliverables', html: `
<ul>
  <li><strong>Player character sprite</strong> — idle pose + at least 1 additional frame (walking, jumping, or attacking). Minimum size: 32×32px for pixel art, 256×256px for other styles.</li>
  <li><strong>At least 1 enemy or obstacle sprite</strong> — consistent visual style with the player</li>
  <li><strong>3 UI elements</strong> — for example: health bar, score counter background, button, coin/collectible icon, game over screen element. These should match your GDD's UI wireframe.</li>
</ul>` },
        { title: 'Instructions', html: `
<ol>
  <li><strong>Choose your tool and justify it:</strong> Are you using Photoshop or Illustrator? In your process document (see Step 6), write 2–3 sentences explaining why you chose this tool for your art style (e.g. "I chose Photoshop because pixel art is raster-based and Illustrator's vector format doesn't suit pixel-perfect work").</li>
  <li><strong>Look up export requirements</strong> for your engine using the official documentation. What pixel dimensions, file format (.png, .svg, .psd?), and colour mode does your engine require? Screenshot the documentation page and include it in your process document.</li>
  <li><strong>Create each sprite</strong> using layers. Keep each sprite element on a separate layer (outline, fill, shadow, highlights). Save the layered source file (.psd or .ai) in your <code>02_Assets/Art/Sprites/</code> folder.</li>
  <li><strong>Animate:</strong> For the player character, duplicate the idle frame layer group and modify it to create the second animation frame. They should be clearly distinct (different limb position, etc.).</li>
  <li><strong>Export</strong> all sprites as flat .png files (transparent background) at the correct dimensions for your engine. Name files using the convention: <code>player_idle.png</code>, <code>player_walk01.png</code>, etc.</li>
  <li><strong>Process document:</strong> In Word, document your creation process with at least 4 screenshots showing: original blank canvas, work in progress (mid-design), applying export settings, and the final exported file. Include your tool justification and the engine documentation screenshot.</li>
</ol>` },
      ],
      checklist: [
        'Player idle sprite exported as .png (correct dimensions for chosen engine)',
        'Player animation frame 2 exported as .png',
        'Enemy/obstacle sprite exported as .png',
        '3 UI elements exported as .png',
        'All source files (.psd or .ai) saved in correct project folder',
        'Process document: tool justification, engine spec screenshot, 4 process screenshots',
        'Files named correctly (no spaces, descriptive, version-numbered)',
        'Submitted: zip of all .png exports + process doc Task3.1_Firstname_Lastname.zip',
      ],
      marking: [
        { criterion: 'ESC-C1', c: 'Correctly identifies Photoshop or Illustrator as appropriate for the sprite creation task. Justification uses correct terminology.', a: null },
        { criterion: 'ESC-C3', c: 'Follows engine export specification. Exports files in correct format and dimensions. Reviews own work against spec in process document.', a: null },
        { criterion: 'ICT-C3', c: 'Creates and presents visual ideas using Adobe software. Process document clearly communicates creative decisions.', a: 'Assesses completeness of the asset pack against GDD requirements. Effectively addresses the visual needs of the target audience in design choices.' },
        { criterion: 'ICT-C4', c: 'Selects and uses Adobe software appropriate to the task. Uses help features (documentation, online support) to find engine export specifications. Uses basic features of the software (layers, export, colour).', a: 'Uses advanced features (layer groups, animation frames, colour modes). Uses advanced search to find engine-specific sprite requirements.' },
      ],
    },
  },

  {
    id: 'T3.2', unit_id: 'u3', code: '3.2', title: 'Tileset / Environment Design',
    type: 'submission', sort: 32, est_time: '2–3 lessons', tools: 'Photoshop or Illustrator', weeks: 'Weeks 11–12',
    overview: "For level-based or open-world games, tilesets are the building blocks of your environment. A tileset is a grid of tiles that can be arranged in infinite combinations to build levels. In this task you'll create a tileset appropriate to your game's world and export it as a spritesheet. Note: if your game concept doesn't use a tileset (e.g. it's a single-screen game), substitute this task with a background environment design — create 2 complete parallax background layers instead. Check with your teacher first.",
    criteria: ['ESC-C3', 'ICT-C4'],
    elements: ['ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C4-a', 'ICT-C4-b', 'ICT-C4-c', 'ICT-C4-e', 'ICT-C4-f'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<ol>
  <li>Research what a "spritesheet" and "tileset" are. Find your engine's documentation for the required tile size (GMS2: typically 16×16 or 32×32px; Unity: flexible). Screenshot the relevant documentation page.</li>
  <li>Plan your tileset: sketch on paper or in a new document which tiles you need (ground, wall, ceiling, corner pieces, decorative elements, animated tiles). Minimum 16 tile types.</li>
  <li>Create each tile at the correct size. Tiles that sit next to each other must tile seamlessly — test this by duplicating tiles and checking the edges match.</li>
  <li>Arrange all tiles into a <strong>single spritesheet</strong> — a grid layout where all tiles are the same size and evenly spaced. Export as a flat .png.</li>
  <li>Document your process: minimum 3 screenshots (planning sketch, mid-creation, final spritesheet). Write a short note on one problem you encountered and how you solved it. Use the help documentation or a tutorial and cite what you used.</li>
</ol>` },
      ],
      checklist: [
        'Spritesheet .png: minimum 16 tile types, correct tile size, seamless edges',
        'Source file (.psd or .ai) saved in correct project folder with layers intact',
        'Documentation screenshot of engine tile size requirements',
        'Process document: planning sketch, 3 progress screenshots, problem-solving note with source cited',
        "Tiles visually consistent with game's art style from Task 3.1",
        'Submitted as: Task3.2_Firstname_Lastname.zip',
      ],
      marking: [
        { criterion: 'ESC-C3', c: 'Follows the spritesheet/tileset specification. Files named and organised correctly. Process document shows review of own work (problem-solving note).', a: null },
        { criterion: 'ICT-C4', c: 'Selects and uses Photoshop/Illustrator for the task. Uses help features (documentation/tutorials) to solve the seamless tiling problem. Delivers a working spritesheet.', a: 'Uses advanced features (guides, grid snap, smart objects). Uses advanced search strategies to find tileset best practices and engine-specific requirements.' },
      ],
    },
  },

  {
    id: 'T3.3', unit_id: 'u3', code: '3.3', title: 'Audio Design & Sourcing',
    type: 'submission', sort: 33, est_time: '3 lessons', tools: 'Adobe Audition, BFXR / freesound.org', weeks: 'Weeks 12–13',
    overview: "Audio is half the experience of a game. In this task you'll create or source, edit, and properly attribute all the audio your game needs. The copyright documentation you produce here feeds directly into your Task 3.4 Asset Catalogue.",
    criteria: ['ESC-C2', 'ESC-C3', 'ESC-C4', 'ICT-C2', 'ICT-C3', 'ICT-C4'],
    elements: ['ESC-C2-a', 'ESC-C2-b', 'ESC-C3-a', 'ESC-C3-b', 'ESC-C4-e', 'ICT-C2-b', 'ICT-C2-c', 'ICT-C2-e', 'ICT-C3-a', 'ICT-C3-b', 'ICT-C4-a', 'ICT-C4-b', 'ICT-C4-c', 'ICT-C4-e', 'ICT-C4-f'],
    body: {
      sections: [
        { title: 'Part A — Sound Effects (4 required)', html: `
<p>Create or source 4 sound effects relevant to your game. At least 2 must be <strong>created or significantly edited by you</strong> (not just downloaded as-is). Options:</p>
<ul>
  <li><strong>Create from scratch:</strong> Use BFXR (free, browser-based) to generate 8-bit style SFX, then import and edit in Audition</li>
  <li><strong>Record and edit:</strong> Record sounds with a microphone or phone, import into Audition, and edit (trim, EQ, add effects)</li>
  <li><strong>Source and edit:</strong> Download from freesound.org (check the licence!), import into Audition, and meaningfully edit (pitch shift, layer, reverse, add reverb)</li>
</ul>
<p>For each SFX in Audition: normalise volume to -3dB, trim leading/trailing silence, export as .wav (44.1kHz, 16-bit).</p>` },
        { title: 'Part B — Background Music (1 required)', html: `
<p>Source 1 background music loop of at least 30 seconds. It must be <strong>licenced for use in games</strong> (CC0, CC BY, or royalty-free with clear game-use permission). Recommended sources: freesound.org, OpenGameArt.org, Kevin MacLeod (incompetech.com).</p>
<p>Import into Audition, set loop points (if needed), normalise to -6dB, export as .ogg (preferred for most engines) or .wav.</p>` },
        { title: 'Part C — Copyright Documentation', html: `
<p>For every piece of audio (whether created, recorded, or sourced), complete the following in a Word table:</p>
<p><code>File Name | Created/Sourced | Source URL (if sourced) | Original Author (if sourced) | Licence Type | Modifications Made | Attribution Required?</code></p>
<p>If attribution is required, write the exact attribution text you will include in your game's credits screen.</p>` },
        { title: 'Part D — Process Screenshots in Audition', html: `
<p>For at least 2 of your SFX, include screenshots from Adobe Audition showing: the waveform before editing, the normalise/trim settings applied, and the export settings used.</p>` },
      ],
      checklist: [
        '4 SFX exported as .wav: normalised, trimmed, correctly named',
        'At least 2 SFX are original or significantly edited (not just downloaded)',
        '1 background music loop exported as .ogg or .wav with correct loop points',
        'Copyright table: all 5 audio files documented with all required fields',
        'Attribution text written for all files that require it',
        'Audition process screenshots (min 2 SFX, showing waveform, settings, export)',
        'Submitted: Task3.3_Firstname_Lastname.zip (audio files + Word doc)',
      ],
      marking: [
        { criterion: 'ESC-C2', c: "Correctly interprets Audition's normalise, trim, and export settings. Follows freesound.org licence instructions correctly.", a: null },
        { criterion: 'ESC-C3', c: 'Follows all audio production and export procedures. Files exported in correct format/quality. Copyright table completed for all files.', a: null },
        { criterion: 'ESC-C4', c: 'Correctly describes and complies with copyright principles. Attribution written correctly for all required files. Demonstrates understanding of CC licence types.', a: null },
        { criterion: 'ICT-C2', c: 'Describes copyright and intellectual property correctly. Complies with given principles for using others\' work (licence compliance, attribution).', a: 'Correctly identifies specific copyright obligations in each situation (created, recorded, sourced) and justifies decisions.' },
        { criterion: 'ICT-C3', c: 'Collects audio from a range of sources (self-created, BFXR, freesound.org). Re-synthesises into a coherent audio pack appropriate for the game.', a: null },
        { criterion: 'ICT-C4', c: 'Selects and uses Audition for audio editing. Uses help/tutorials to solve export or quality problems. Demonstrates normalise, trim, and export.', a: 'Uses advanced Audition features (EQ, effects, loop points). Uses advanced search to resolve audio licence or format issues.' },
      ],
    },
  },

  {
    id: 'T3.4', unit_id: 'u3', code: '3.4', title: 'Asset Catalogue & Attribution Report',
    type: 'submission', sort: 34, est_time: '1–2 lessons', tools: 'Word', weeks: 'Weeks 13–14',
    overview: 'Every professional game studio maintains an asset database — for legal compliance, team communication, and quality control. Yours covers all assets produced in Unit 3. This document is also your ethical compliance record: proof that you understand and have followed copyright law for every single asset in your game.',
    criteria: ['ESC-C4', 'ICT-C2', 'ICT-C3'],
    elements: ['ESC-C4-e', 'ICT-C2-a', 'ICT-C2-b', 'ICT-C2-c', 'ICT-C2-e', 'ICT-C3-b', 'ICT-C3-c'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<ol>
  <li>Create a Word document titled <strong>"[YourGameTitle] Asset Catalogue"</strong> with three sections: Visual Assets, Audio Assets, and Other Assets.</li>
  <li>For every asset (visual and audio) produced in Tasks 3.1–3.3, add a row to the catalogue table. Required fields: File Name | File Type | Folder Location | Created By | Source (if not created by you) | Licence | Modifications Made | Attribution Text (if required).</li>
  <li>Add a <strong>Copyright &amp; Compliance Statement</strong> section (3–5 sentences) summarising: what Creative Commons licences you used, what modifications you made to sourced content, and how attribution will appear in your game.</li>
  <li>Add a <strong>Reflection</strong> section (3–5 sentences): What was the most challenging copyright decision you faced? What did you learn about using other people's work in a game context?</li>
</ol>` },
      ],
      checklist: [
        'All assets from Tasks 3.1, 3.2, and 3.3 included in catalogue (no omissions)',
        'Every row: all required fields completed',
        'Attribution text written correctly for every sourced asset that requires it',
        'Copyright & Compliance Statement: covers CC licences, modifications, and in-game attribution plan',
        'Reflection: 3–5 sentences addressing both prompts',
        'Saved as Task3.4_Firstname_Lastname.docx',
      ],
      marking: [
        { criterion: 'ESC-C4', c: "Describes and complies with principles for using others' work. Attribution written correctly. Demonstrates understanding of what licence types allow.", a: null },
        { criterion: 'ICT-C2', c: 'Correctly describes copyright and IP concepts in the compliance statement. Demonstrates compliance with given principles throughout the catalogue.', a: "Correctly identifies copyright obligations specific to each asset's situation. Reflection demonstrates nuanced understanding of IP in game development." },
        { criterion: 'ICT-C3', c: 'Organises all asset information into a logical, clearly structured Word document with table and sections. Information is re-synthesised (not just raw data — it tells a coherent compliance story).', a: null },
      ],
    },
  },

  // ================= UNIT 4 =================
  {
    id: 'T4.1', unit_id: 'u4', code: '4.1', title: 'Engine Setup & First Scene',
    type: 'submission', sort: 41, est_time: '2 lessons', tools: 'Unity / GMS2 / Unreal, Word', weeks: 'Weeks 15–16',
    overview: 'A correctly configured project is the foundation of a successful build. Sloppy setup — wrong settings, assets in random folders, wrong platform target — creates problems that compound for weeks. Do it right from the start.',
    criteria: ['ESC-C2', 'ESC-C3', 'ICT-C1', 'ICT-C4'],
    elements: ['ESC-C2-a', 'ESC-C2-b', 'ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C1-a', 'ICT-C1-b', 'ICT-C1-e', 'ICT-C1-f', 'ICT-C4-a', 'ICT-C4-b', 'ICT-C4-c', 'ICT-C4-e', 'ICT-C4-f'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<ol>
  <li><strong>Create a new project</strong> in your chosen engine. Settings should match your GDD: 2D or 3D, target platform (PC/Mac/Windows), resolution. Screenshot your project settings screen.</li>
  <li><strong>Configure your project folder</strong> to match your Unit 1 file structure. In Unity/Unreal, organise the Assets folder with subfolders matching your <code>02_Assets/</code> structure. In GMS2, organise Sprites, Sounds, Rooms accordingly. Screenshot the organised structure.</li>
  <li><strong>Import your Unit 3 assets:</strong> Import all your sprite .png files and audio .wav/.ogg files into the engine. Configure sprite settings (pixels-per-unit in Unity, sprite origin in GMS2). Screenshot the imported assets in the engine's asset browser.</li>
  <li><strong>Create your first scene/room:</strong> Place at least one background or floor tile using your Unit 3 tileset. Place your player character sprite. Press Play — the scene should open without errors. Screenshot the running scene.</li>
  <li><strong>Review document:</strong> In Word, paste all screenshots with captions. Add a short review section: Does your setup match your GDD's technical scope? What settings did you have to look up? What helped you find the answer?</li>
</ol>` },
      ],
      checklist: [
        'Screenshot: project settings screen (matching GDD technical scope)',
        'Screenshot: organised asset folder structure in engine',
        'Screenshot: imported sprites and audio visible in engine asset browser',
        'Screenshot: first scene/room running in Play mode without errors',
        'Review document: captions on all screenshots + review section answering all 3 prompts',
        'Saved as Task4.1_Firstname_Lastname.docx',
      ],
      marking: [
        { criterion: 'ESC-C2', c: 'Correctly interprets engine setup documentation and project settings. Correctly interprets asset import requirements (sprite settings, audio format).', a: null },
        { criterion: 'ESC-C3', c: 'Follows all setup steps in order. Successfully imports assets and creates first scene. Review compares setup to GDD spec.', a: null },
        { criterion: 'ICT-C1', c: 'Applies understanding of hardware/software to correctly configure the game engine. Demonstrates understanding of how OS, applications and files relate within the engine project.', a: 'Applies knowledge to solve real-world setup problems (e.g. texture compression, audio format conversion). Justifies configuration choices against hardware constraints.' },
        { criterion: 'ICT-C4', c: 'Selects and uses the engine software appropriately. Uses help features (documentation, forums, tutorials) to find sprite/audio import settings. Successfully completes all setup steps.', a: 'Uses advanced engine features (project templates, import presets). Uses advanced search (Boolean, site-specific) to solve engine-specific problems.' },
      ],
    },
  },

  {
    id: 'T4.2', unit_id: 'u4', code: '4.2', title: 'Core Mechanic Implementation',
    type: 'submission', sort: 42, est_time: '4–5 lessons', tools: 'Unity / GMS2 / Unreal', weeks: 'Weeks 16–18',
    overview: "The core mechanic is the one thing players do most. If it doesn't feel good, the game doesn't feel good. Your job here is to implement the mechanic you described in your GDD Section 2, test that it works as described, and document the code/logic clearly enough that someone else could read and understand it.",
    criteria: ['ESC-C3', 'ICT-C4', 'ICT-C5'],
    elements: ['ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C4-a', 'ICT-C4-b', 'ICT-C4-c', 'ICT-C4-e', 'ICT-C4-f', 'ICT-C5-a', 'ICT-C5-b', 'ICT-C5-c', 'ICT-C5-d', 'ICT-C5-e', 'ICT-C5-f', 'ICT-C5-g', 'ICT-C5-h'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<ol>
  <li>Open your GDD Section 2 (Gameplay Mechanics). This is your specification. Implement the core mechanic exactly as described. If you realise during implementation that the spec needs to change, document the change in your GDD (add a "Revision" note to the relevant section) and update your Gantt chart.</li>
  <li>Write your code/script/Blueprint so that it functions correctly. Test it: does the player do what the GDD says they should do? Check on at least one edge case (e.g. What happens if the player holds the key down? What happens at a wall?)</li>
  <li>Comment your code: every major block of code should have a comment explaining what it does. If using GML or C#, use single-line comments (<code>// This moves the player left when Left Arrow is held</code>). If using Blueprints, add Comment Boxes.</li>
  <li>Create a <strong>Code/Logic Documentation</strong> Word document with: annotated screenshots of your script (one screenshot per major function, with annotations pointing to key lines), a plain English explanation of how the mechanic works (3–5 sentences), and a note on one problem you encountered and how you resolved it (include what resource you used — documentation, tutorial, forum post).</li>
</ol>` },
        { title: 'What counts as a "core mechanic"?', html: `
<p>Examples by engine and genre:</p>
<p><strong>GMS2 Platformer:</strong> Left/right movement, variable jump height, gravity, wall collision detection</p>
<p><strong>Unity Top-Down:</strong> WASD movement with Rigidbody2D, camera follow, single-hit shooting with projectile pooling</p>
<p><strong>Unreal 3D:</strong> Character movement component configured, jump, basic character blueprint with input bindings</p>
<p><strong>Puzzle game:</strong> Click-to-select mechanic, drag to rearrange, win condition check on each move</p>` },
      ],
      checklist: [
        'Working game build/project file: core mechanic implemented and functional',
        'All code/scripts commented with plain English explanations',
        'Code documentation (Word): annotated screenshots, plain English explanation, problem-solving note with source cited',
        'GDD updated if any changes were made to the mechanic spec (revision notes added)',
        'Gantt chart updated to reflect actual progress vs plan',
        'Submitted: Task4.2_Firstname_Lastname.zip (project folder + Word doc) — or share project via OneDrive',
      ],
      marking: [
        { criterion: 'ESC-C3', c: 'Follows GDD specification for the core mechanic. Tests mechanic against GDD description. Documents any changes with revision notes.', a: null },
        { criterion: 'ICT-C4', c: 'Selects and uses engine software to implement the mechanic. Uses help/online support (documented) to resolve at least one problem. Uses basic scripting/blueprint features to achieve the mechanic.', a: 'Uses advanced engine features (physics layers, animation state machines, object pooling). Uses advanced search strategies to find solutions to complex mechanic problems.' },
        { criterion: 'ICT-C5', c: 'Maintains task focus over the implementation period. Follows GDD plan; updates Gantt when plan changes. Reflects on progress in documentation.', a: 'Sets and achieves sub-goals within the implementation. Proactively evaluates progress and plans future actions. Manages timeline changes effectively.' },
      ],
    },
  },

  {
    id: 'T4.3', unit_id: 'u4', code: '4.3', title: 'Prototype Self-Test & Iteration',
    type: 'submission', sort: 43, est_time: '2 lessons', tools: 'Engine + Word', weeks: 'Weeks 18–19',
    overview: "Every game studio runs internal playtests before any external tester sees the game. You are now your own QA tester. Using your GDD as the spec, you'll systematically test your prototype, identify what's working and what isn't, then fix at least two issues and re-test.",
    criteria: ['ESC-C3', 'ICT-C4', 'ICT-C5'],
    elements: ['ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C4-a', 'ICT-C4-c', 'ICT-C4-d', 'ICT-C4-f', 'ICT-C5-b', 'ICT-C5-c', 'ICT-C5-g'],
    body: {
      sections: [
        { title: 'Part A — Self-Playtest vs GDD Checklist (ESC C3)', html: `
<p>Open your GDD and play your prototype for at least 10 minutes. For each item in GDD Sections 2–4 (Mechanics, Characters, Level Design), note whether it is:</p>
<ul>
  <li>✅ Working as specified</li>
  <li>⚠️ Partially working (describe what's wrong)</li>
  <li>❌ Not yet implemented</li>
</ul>
<p>Produce this as a checklist table in Word (minimum 10 items from the GDD).</p>` },
        { title: 'Part B — Fix & Re-Test (ICT C4)', html: `
<p>Identify your top 3 priority issues (the ones most affecting the player experience). Fix at least 2 of them. For each fix:</p>
<ol>
  <li>Describe the problem in plain language</li>
  <li>Describe your solution (include what resource you used to find the fix — tutorial, documentation, forum)</li>
  <li>Screenshot evidence: before (showing the problem) and after (showing it resolved)</li>
</ol>` },
        { title: 'Part C — Progress Reflection (ICT C5)', html: `
<p>In 5–8 sentences, reflect on your prototype progress:</p>
<ul>
  <li>How close is your prototype to what you planned in your GDD?</li>
  <li>What's working better than expected? What's proving harder than expected?</li>
  <li>What will you focus on improving in Unit 5 and why?</li>
  <li>Update your Gantt chart to reflect Weeks 15–19 actual progress. Identify any tasks that slipped and add them to Unit 5.</li>
</ul>` },
      ],
      checklist: [
        'GDD checklist table: minimum 10 items with working/partial/not-implemented status',
        'Fix documentation: 2 fixes with before/after screenshots and source cited for each',
        'Progress reflection: 5–8 sentences addressing all prompts',
        'Updated Gantt chart (as a new version, not overwriting the original)',
        'Saved as Task4.3_Firstname_Lastname.docx',
      ],
      marking: [
        { criterion: 'ESC-C3', c: 'Reviews own performance against the GDD specification. GDD checklist accurately reflects prototype state. Re-tests after fixes.', a: null },
        { criterion: 'ICT-C4', c: 'Identifies and uses software/online support to resolve 2 problems. Fix documentation clearly shows before/after evidence.', a: 'Uses advanced search strategies to find and evaluate multiple solutions before implementing. Fix documentation shows evaluation of alternatives.' },
        { criterion: 'ICT-C5', c: 'Reflects meaningfully on progress. Articulates specific ways goals can be met in Unit 5. Updates Gantt chart as a planning action.', a: 'Reflection evaluates progress holistically. Future plans are specific, measurable, and realistic. Gantt update shows sophisticated replanning.' },
      ],
    },
  },

  // ================= UNIT 5 =================
  {
    id: 'T5.1', unit_id: 'u5', code: '5.1', title: 'Portfolio Compilation',
    type: 'submission', sort: 51, est_time: '3 lessons', tools: 'Word or OneNote', weeks: 'Weeks 20–21',
    overview: 'A portfolio is a curated collection of your best work, organised so that someone else can clearly understand your process and skills. Your Phase 1 portfolio documents the full journey from research to working prototype and serves as your primary evidence for ESC and ICT assessment.',
    criteria: ['ESC-C3', 'ESC-C4', 'ICT-C2', 'ICT-C3', 'ICT-C5'],
    elements: ['ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ESC-C4-a', 'ESC-C4-c', 'ESC-C4-d', 'ESC-C4-e', 'ICT-C2-a', 'ICT-C2-b', 'ICT-C2-c', 'ICT-C2-d', 'ICT-C2-e', 'ICT-C2-f', 'ICT-C3-a', 'ICT-C3-b', 'ICT-C3-c', 'ICT-C3-d', 'ICT-C3-e', 'ICT-C5-c', 'ICT-C5-f', 'ICT-C5-g'],
    body: {
      sections: [
        { title: 'Portfolio Structure (Word or OneNote)', html: `
<p>Your portfolio must follow this structure. Each section has a required minimum:</p>
<p><strong>Section 1: Introduction</strong> — Game title, genre, chosen engine, target platform. One paragraph describing your game concept as it stands now (it may have evolved from your original pitch — that's fine, note the changes).</p>
<p><strong>Section 2: Research &amp; Design (Unit 1–2 evidence)</strong> — Excerpts from your Genre Research Report (Task 2.1) and Game Design Document (Task 2.3). Not the full documents — select the most relevant 1–2 pages from each. Include your original Gantt chart and an annotated version showing actual vs planned progress.</p>
<p><strong>Section 3: Asset Production (Unit 3 evidence)</strong> — 4–6 asset samples (screenshots of your best sprites, tileset, and audio waveforms in Audition). Your Asset Catalogue table (Task 3.4) showing copyright compliance for all assets.</p>
<p><strong>Section 4: Game Development (Unit 4 evidence)</strong> — 3–4 screenshots of your prototype in action. One annotated code/script screenshot (from Task 4.2) explaining your core mechanic. Your self-test checklist (Task 4.3) showing the prototype vs GDD comparison.</p>
<p><strong>Section 5: Digital Ethics &amp; Safety (ESC C4 · ICT C2)</strong> — A dedicated section (300–400 words) summarising how you applied ethical and safe digital practice throughout Phase 1. Cover: OHS compliance, copyright decisions, social media safety (e.g. how you'd share your game safely), and any academic integrity decisions (how you cited sources, how you avoided plagiarism).</p>
<p><strong>Section 6: Reflection (ICT C5)</strong> — 400–500 words covering: (a) skills you're most proud of developing, (b) the biggest challenge of Phase 1 and how you overcame it, (c) where your prototype currently sits vs your original GDD vision, and (d) what you'd do differently if starting over.</p>` },
      ],
      checklist: [
        'All 6 sections present with correct structure and minimum content',
        'Section 5 (Ethics): covers OHS, copyright, social media safety, academic integrity',
        'Section 6 (Reflection): 400–500 words addressing all four prompts',
        'Asset samples: 4–6 images showing variety across sprites, tileset, audio',
        'Asset Catalogue table included with all required fields completed',
        'Annotated code screenshot included and explained in plain English',
        'Gantt chart: original + annotated actual-vs-planned version',
        'Saved as Task5.1_Portfolio_Firstname_Lastname.docx or exported as .pdf',
      ],
      marking: [
        { criterion: 'ESC-C3', c: 'Follows the portfolio structure specification. Uses Word/OneNote correctly to compile and present work. Includes self-review via the reflection section.', a: null },
        { criterion: 'ESC-C4', c: 'Section 5 describes compliance with safe/ethical principles across all four areas (OHS, copyright, social media, academic integrity). Compliance is described correctly and with specific examples from Phase 1 work.', a: null },
        { criterion: 'ICT-C2', c: 'Section 5 demonstrates understanding of social and ethical issues (copyright, academic integrity). Compliance with OHS procedures described and evidenced.', a: 'Section 5 identifies specific ethical issues from Phase 1 and justifies decisions made in each case. OHS impact on individual health described accurately with reference to specific work patterns.' },
        { criterion: 'ICT-C3', c: 'Selects and re-synthesises evidence from across Phase 1 into a coherent, logical portfolio. Presentation is clear and reader-ready.', a: 'Assesses completeness of the portfolio as evidence of learning. Effectively addresses the needs of the reader (teacher/assessor) throughout. Evidence selected deliberately and purposefully.' },
        { criterion: 'ICT-C5', c: 'Reflection addresses all four prompts. Articulates specific ways goals can be met in the future. Gantt comparison shows honest evaluation of progress.', a: 'Reflection evaluates progress rigorously and identifies specific, actionable future improvements. Evidence of self-direction in how evidence was curated and presented.' },
      ],
    },
  },

  {
    id: 'T5.2', unit_id: 'u5', code: '5.2', title: 'Final Presentation & Prototype Demo',
    type: 'submission', sort: 52, est_time: '1 lesson prep + presentation session', tools: 'PowerPoint or Adobe Express, engine', weeks: 'Weeks 21–22',
    overview: 'Game developers present their work constantly — to publishers, playtesters, teammates, and at events like PAX, GDC, and local game jams. This presentation is your first professional demo: live gameplay, explained design decisions, honest reflection on what worked and what didn\'t.',
    criteria: ['ESC-C3', 'ICT-C3', 'ICT-C5'],
    elements: ['ESC-C3-a', 'ESC-C3-b', 'ESC-C3-c', 'ICT-C3-b', 'ICT-C3-c', 'ICT-C3-e', 'ICT-C5-c', 'ICT-C5-g'],
    body: {
      sections: [
        { title: 'Presentation Requirements (5–7 minutes)', html: `
<ul>
  <li><strong>Slide 1:</strong> Game title, genre, engine, your name</li>
  <li><strong>Slides 2–3:</strong> Game concept — what is your game? Who is it for? (Reference your research)</li>
  <li><strong>Live demo:</strong> Play your prototype for 2–3 minutes. Narrate what the player is doing and what mechanics are in play. If something goes wrong, stay calm and explain what should have happened.</li>
  <li><strong>Slides 4–5:</strong> Design decisions — pick 2 decisions from your GDD and explain why you made them (e.g. "I chose pixel art because..." "I chose GMS2 instead of Unity because...")</li>
  <li><strong>Slide 6:</strong> What I'd do differently — be honest. One thing that didn't work and what you'd change.</li>
  <li><strong>Q&amp;A:</strong> Answer at least 2 questions from your audience. It's fine to say "I don't know yet — that's something I'd like to figure out in Unit 6."</li>
</ul>
<p>You may use <strong>PowerPoint</strong> (for structured slides) or <strong>Adobe Express</strong> (for a more visual, designed presentation). Maximum 8 slides.</p>` },
        { title: 'After the Presentation — Feedback Response Document', html: `
<p>Collect written feedback from at least 3 audience members using the peer feedback form. Then produce a short Word document (200–300 words) titled "Feedback Received &amp; My Response" covering:</p>
<ul>
  <li>Summarise the 3 main themes from the feedback you received</li>
  <li>For each theme: will you act on it in Unit 6? How?</li>
  <li>One piece of feedback that surprised you and why</li>
</ul>` },
      ],
      checklist: [
        'Slide deck (max 8 slides): all 6 required content areas covered',
        'Live demo delivered: prototype shown running (even if imperfect)',
        'Design decisions section: 2 decisions explained with reasoning (not just what — why)',
        'Q&A: at least 2 questions answered',
        'Feedback Response document: 200–300 words, 3 themes addressed, surprise feedback noted',
        'Submitted: Task5.2_Slides_Firstname_Lastname.pptx + Task5.2_FeedbackResponse_Firstname.docx',
      ],
      marking: [
        { criterion: 'ESC-C3', c: 'Follows presentation specification (6 content areas, time limit, Q&A). Feedback response shows review of own performance against audience reaction.', a: null },
        { criterion: 'ICT-C3', c: 'Selects and re-synthesises Phase 1 learning into a clear, structured presentation. Uses PowerPoint/Express to present ideas. Communicates clearly to a live audience.', a: 'Effectively addresses the needs of the audience throughout — language calibrated to peers, design decisions explained without jargon. Feedback response demonstrates genuine consideration of audience perspective.' },
        { criterion: 'ICT-C5', c: "Articulates what worked and what didn't. Feedback response identifies specific, actionable Unit 6 improvements. Reflects on progress authentically.", a: 'Reflection is genuinely evaluative — both positive and critical. Future actions are specific, measurable, and realistic. Evidence of strategic thinking about Unit 6 direction.' },
      ],
    },
  },

  // ================= UNIT 6 (PRJ205118) =================
  {
    id: 'T6.1', unit_id: 'u6', code: '6.1', title: 'Project Brief & Working Agreement',
    type: 'submission', sort: 61, est_time: '2 lessons', tools: 'Word', weeks: 'Weeks 23–24',
    overview: 'This document defines your game project before you write a single line of code. It must be agreed to by all team members (or your teacher for individual projects) before you proceed to Task 6.2. TASC work requirement — mandatory for SA eligibility.',
    criteria: ['PRJ-C1', 'PRJ-C2', 'PRJ-C3', 'PRJ-C4'],
    elements: ['PRJ-C1-a', 'PRJ-C1-b', 'PRJ-C1-c', 'PRJ-C2-a', 'PRJ-C2-d', 'PRJ-C3-a', 'PRJ-C3-b', 'PRJ-C3-c', 'PRJ-C3-d', 'PRJ-C4-a', 'PRJ-C4-b'],
    body: {
      sections: [
        { title: 'Part A — Project Brief', html: `
<p>Using the PRJ Project Brief template, complete all required sections:</p>
<p><strong>Objective:</strong> What is the project? What is the goal? (2–3 sentences)</p>
<p><strong>Target Outcomes:</strong> What are the benefits? What are the risks, downsides, and efforts? Is this project worth doing? (This must include honest assessment of scope.)</p>
<p><strong>Measuring Success:</strong> How will you know when the project is done? What baseline data can you measure? (e.g. "Game has a working win/lose loop that 3 testers could complete")</p>
<p><strong>Project Outputs:</strong> What will be delivered? (List every deliverable)</p>
<p><strong>Governance:</strong> Who manages the project? (Even if individual — you're the project manager.)</p>
<p><strong>Resources:</strong> What do you need? List software, hardware, online resources, teacher check-ins.</p>
<p><strong>Stakeholders:</strong> Who is affected by this project? (Teacher, classmates who playtest, the audience who plays the final game.)</p>
<p><strong>Constraints:</strong> 12-week timeframe, school lab access, software available, etc.</p>
<p><strong>Risk Management:</strong> Table of 5 risks: risk description | likelihood (H/M/L) | impact (H/M/L) | mitigation | contingency</p>
<p><strong>Quality Control:</strong> When will reviews take place? (Check-ins at Weeks 27, 30, 33.) Who reviews? (Teacher, peers, self.)</p>
<p><strong>Review Process:</strong> How will progress be measured? How will the end product be evaluated?</p>` },
        { title: 'Part B — Working Agreement (Individual or Pairs)', html: `
<p><strong>Individual pathway</strong> — complete a "Working Agreement with Yourself" covering:</p>
<ul>
  <li>Your strengths and where you need to push yourself in this project</li>
  <li>Your planned weekly work schedule (which lessons + any self-directed time?)</li>
  <li>What is your contingency if you fall behind? (e.g. "I will rescope the Level 2 design if I'm 2 weeks behind by Week 29")</li>
  <li>What does success look like for you personally, beyond just the grade?</li>
</ul>
<p><strong>Pairs pathway</strong> — complete a Team Work Agreement covering:</p>
<ul>
  <li>Each person's role and responsibilities (no role is "everything" — split clearly)</li>
  <li>Each person's strengths, expertise, and preferences</li>
  <li>Communication plan: how often, which channel, what format?</li>
  <li>Decision-making process: what happens when you disagree?</li>
  <li>Conflict resolution: what process is put in place if the project fails to deliver?</li>
  <li>How will outside experts (teacher, mentors) be used?</li>
</ul>` },
      ],
      checklist: [
        'Project Brief: all 10 required sections completed',
        'Risk Management table: 5 risks with all fields completed',
        'Working Agreement (individual) or Team Work Agreement (pairs): all required fields',
        'Teacher sign-off obtained before proceeding to Task 6.2',
        'Saved as Task6.1_ProjectBrief_[Names].docx',
      ],
      marking: [
        { criterion: 'PRJ-C1', c: 'Negotiates planning with teacher/partner. Documents constraints, risks, and governance. Delivers an achievable project brief within agreed parameters.', a: null },
        { criterion: 'PRJ-C2', c: 'Clearly communicates project scope, processes, and goals in writing. Project brief is readable and complete.', a: null },
        { criterion: 'PRJ-C3', c: 'Correctly identifies roles, responsibilities, and group goals. Working Agreement documents consultation and communication plan.', a: null },
        { criterion: 'PRJ-C4', c: 'Goals are measurable, achievable, specific, time-referenced and realistic. Risk management table identifies realistic risks with workable mitigation strategies.', a: null },
      ],
    },
  },

  {
    id: 'T6.2', unit_id: 'u6', code: '6.2', title: 'Project Gantt Chart & Planning Documents',
    type: 'submission', sort: 62, est_time: '1 lesson', tools: 'Excel', weeks: 'Weeks 24–25',
    overview: 'Your 12-week project timeline. TASC work requirement — mandatory for SA eligibility.',
    criteria: ['PRJ-C1', 'PRJ-C4'],
    elements: ['PRJ-C1-c', 'PRJ-C4-a'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>Build your project Gantt chart in Excel covering <strong>Weeks 23–34</strong>. Requirements:</p>
<ul>
  <li>At least 20 individual tasks (rows) — be specific ("Implement enemy patrol AI" not "Code enemy")</li>
  <li>Weeks 23–34 shown as columns</li>
  <li>Tasks assigned an owner (your name, or split between pair names)</li>
  <li>Milestones highlighted (Check-in 1 at Week 27, Check-in 2 at Week 30, Check-in 3 at Week 33, Final build due Week 34)</li>
  <li>Colour-coded by category (design, coding, art, audio, testing, documentation)</li>
  <li>Dependencies indicated where one task must follow another</li>
</ul>
<p>Also complete an <strong>Activity Tree</strong> (can be in the same Excel file, or a Word document) listing major activities with detailed sub-tasks under each.</p>` },
      ],
      checklist: [
        'Gantt: covers Weeks 23–34, minimum 20 tasks, all owners assigned',
        'Gantt: milestones marked (3 check-ins + final build)',
        'Gantt: colour-coded by category, dependencies shown',
        'Activity Tree: major activities broken into sub-tasks',
        'Saved as Task6.2_Gantt_[Names].xlsx',
      ],
      marking: [
        { criterion: 'PRJ-C1', c: 'Plans, prioritises and sequences own work across the full 12 weeks to achieve intended outcomes. Milestones and dependencies are realistic.', a: null },
        { criterion: 'PRJ-C4', c: 'Gantt tasks are measurable, achievable, specific, time-referenced and realistic. Activity tree breaks major goals into workable sub-tasks.', a: null },
      ],
    },
  },

  {
    id: 'T6.3', unit_id: 'u6', code: '6.3', title: 'Sprint Check-in Meetings × 3',
    type: 'submission', sort: 63, est_time: '~20 min per check-in + written report', tools: 'Word template', weeks: 'Weeks 27, 30, 33',
    overview: 'Three formal project check-ins with your teacher (and partner for pairs). Each check-in follows the same template and must be submitted within 24 hours of the meeting. These are not informal chats — they are documented progress reviews that are part of your TASC evidence. TASC work requirement — mandatory for SA eligibility.',
    criteria: ['PRJ-C1', 'PRJ-C2', 'PRJ-C3', 'PRJ-C5'],
    elements: ['PRJ-C1-a', 'PRJ-C1-b', 'PRJ-C1-e', 'PRJ-C2-a', 'PRJ-C2-d', 'PRJ-C2-e', 'PRJ-C3-c', 'PRJ-C3-d', 'PRJ-C3-e', 'PRJ-C5-b', 'PRJ-C5-e'],
    body: {
      sections: [
        { title: 'Check-in Template (complete for each of the 3 meetings)', html: `
<p><strong>Date &amp; Week Number</strong></p>
<p><strong>What was completed since the last check-in:</strong> (bullet list, be specific)</p>
<p><strong>What is currently being worked on</strong></p>
<p><strong>When will current tasks be completed:</strong> (reference your Gantt)</p>
<p><strong>What is needed to keep current work on track:</strong> (resources, decisions, help needed)</p>
<p><strong>Timeline adjustments made since last check-in:</strong> (which Gantt tasks moved, why)</p>
<p><strong>Upcoming tasks (next 2–3 weeks)</strong></p>
<p><strong>Blockers or risks identified</strong></p>
<p><strong>Feedback received in this check-in</strong></p>
<p><strong>How I/we will incorporate this feedback</strong></p>
<p><strong>Teacher sign-off:</strong> ________________</p>` },
      ],
      checklist: [
        'Check-in 1 (Week 27): completed template, teacher sign-off, submitted within 24h',
        'Check-in 2 (Week 30): completed template, timeline adjustments documented, submitted within 24h',
        'Check-in 3 (Week 33): completed template, final pre-submission review, submitted within 24h',
        'All 3 documents saved and submitted as Task6.3_Checkins_[Names].docx',
      ],
      marking: [
        { criterion: 'PRJ-C1', c: 'Negotiates adaptations with the teacher at each check-in. Delivers agreed goals between check-ins or documents renegotiation.', a: null },
        { criterion: 'PRJ-C2', c: 'Reports on progress clearly in writing and verbally. Uses the ICT template correctly. Documents feedback and how it is incorporated.', a: null },
        { criterion: 'PRJ-C3', c: 'Documents consultation with stakeholders (teacher/partner). Group goals reviewed each meeting. Respectful communication evident.', a: null },
        { criterion: 'PRJ-C5', c: 'Reflects on progress at each check-in and articulates how goals will be met. Poses questions that clarify next steps.', a: null },
      ],
    },
  },

  {
    id: 'T6.4', unit_id: 'u6', code: '6.4', title: 'Full Game Build',
    type: 'submission', sort: 64, est_time: 'Ongoing', tools: 'Unity / GMS2 / Unreal', weeks: 'Weeks 25–32',
    overview: 'The core deliverable of your project: a completed, functional game.',
    criteria: ['PRJ-C1', 'PRJ-C2', 'PRJ-C4'],
    elements: ['PRJ-C1-c', 'PRJ-C1-d', 'PRJ-C1-e', 'PRJ-C2-c', 'PRJ-C4-b', 'PRJ-C4-d'],
    body: {
      sections: [
        { title: 'What your completed game must include', html: `
<ul>
  <li>All mechanics from Project Brief working as specified (or documented changes with justification)</li>
  <li>Minimum 1 complete, playable level from start to a win or lose state</li>
  <li>Your Unit 3 assets (or new assets produced for Unit 6) correctly integrated</li>
  <li>Working audio (at least SFX on key interactions)</li>
  <li>A functional main menu or start screen</li>
  <li>A credits screen listing all asset attributions</li>
  <li>The game must run without crashing for a new player attempting to complete it normally</li>
</ul>` },
        { title: 'Submit', html: `
<p>Share your project via OneDrive link, or export a standalone build and upload. Include a README.txt with: engine/version used, controls, known issues, build instructions if needed.</p>` },
      ],
      checklist: [
        'All Project Brief mechanics working (or changes documented with justification)',
        'Minimum 1 complete playable level with win/lose state',
        'Assets correctly integrated; working audio on key interactions',
        'Main menu / start screen and credits screen with attributions',
        'Runs without crashing for a new player',
        'README.txt: engine/version, controls, known issues',
      ],
      marking: [
        { criterion: 'PRJ-C1', c: 'Delivers upon agreed, achievable project goals within the proposed timeframe. Follows established safety procedures for equipment/facilities throughout.', a: null },
        { criterion: 'PRJ-C2', c: 'Uses digital media and technology to complete the project. Build is presented so a new player can run and understand it (README, menu, credits).', a: null },
        { criterion: 'PRJ-C4', c: 'Exercises flexibility and adaptability where the build diverged from plan. Problem-solving strategies evident in documented changes.', a: null },
      ],
    },
  },

  {
    id: 'T6.5', unit_id: 'u6', code: '6.5', title: 'Playtesting & Iteration',
    type: 'submission', sort: 65, est_time: '2–3 lessons', tools: 'Excel, engine', weeks: 'Weeks 31–33',
    overview: 'Structured peer playtesting, bug tracking, and documented fixes — how real studios turn a build into a quality game.',
    criteria: ['PRJ-C4', 'PRJ-C5'],
    elements: ['PRJ-C4-b', 'PRJ-C4-c', 'PRJ-C4-d', 'PRJ-C5-b', 'PRJ-C5-c', 'PRJ-C5-d'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<ol>
  <li>Run a peer playtest session. Have at least 2 classmates play your game and complete the peer feedback form. Observe (don't help) — note where they get stuck or confused.</li>
  <li>Use the bug tracker spreadsheet (Excel) to log all issues found: description, steps to reproduce, severity (Critical / Major / Minor / Cosmetic), status (Open / Fixed / Won't Fix).</li>
  <li>Fix at least 3 bugs or UX issues from the playtest. Document each fix: problem description, solution, before/after screenshot evidence.</li>
  <li>Write a 300-word "Quality Report": Was the game fit for purpose? Did it meet the success measures from the Project Brief? What test(s) did you use to determine quality?</li>
</ol>` },
      ],
      checklist: [
        'Peer playtest session run with at least 2 classmates and completed feedback forms',
        'Bug tracker: all issues logged with description, reproduction steps, severity, status',
        '3 fixes documented with before/after screenshot evidence',
        'Quality Report: 300 words addressing fitness for purpose and success measures',
      ],
      marking: [
        { criterion: 'PRJ-C4', c: 'Identifies and utilises problem-solving strategies to triage and fix issues. Poses clarifying questions via the playtest process. Adapts the game in response.', a: null },
        { criterion: 'PRJ-C5', c: 'Identifies, utilises and documents problem-solving techniques for each fix. Quality Report assesses fitness for purpose against Project Brief success measures.', a: null },
      ],
    },
  },

  {
    id: 'T6.6', unit_id: 'u6', code: '6.6', title: 'Individual Development Journal',
    type: 'submission', sort: 66, est_time: 'Ongoing (min 6 entries)', tools: 'OneNote or Word', weeks: 'Weeks 23–34',
    overview: 'An ongoing individual journal throughout Unit 6 — 500–800 words total plus a summative reflection. Always individual, even in pairs. TASC work requirement — mandatory for SA eligibility.',
    criteria: ['PRJ-C5'],
    elements: ['PRJ-C5-a', 'PRJ-C5-b', 'PRJ-C5-d', 'PRJ-C5-e'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>Maintain an ongoing individual journal throughout Unit 6. Write at least one entry per sprint week (minimum 6 entries). Each entry should record your thoughts, progress, challenges, and observations in the moment — not retrospectively.</p>
<p><strong>Mandatory questions to address at least once across all entries:</strong></p>
<ul>
  <li>What new things have I learned?</li>
  <li>What was the most difficult thing about the project so far?</li>
  <li>What was the most enjoyable part?</li>
  <li>What would I change if I did this again?</li>
  <li>What could I have done better?</li>
</ul>
<p>Add a <strong>Summative Reflection</strong> at the end (Week 34) that addresses your overall role in the project and (if pairs) the role of your partner. This is in addition to the regular entries and does not count towards the 500–800 word total.</p>` },
      ],
      checklist: [
        'Minimum 6 entries, at least one per sprint week, written in the moment',
        'All 5 mandatory questions addressed at least once across entries',
        'Total 500–800 words for ongoing entries',
        'Summative Reflection added at Week 34',
      ],
      marking: [
        { criterion: 'PRJ-C5', c: 'Reflects on progress in the moment across the project. Explains how parts of the project interact. Documents problems and articulates how goals can be met in the future.', a: null },
      ],
    },
  },

  {
    id: 'T6.7', unit_id: 'u6', code: '6.7', title: 'Peer & Self Evaluation',
    type: 'submission', sort: 67, est_time: '1 lesson', tools: 'TASC evaluation form', weeks: 'Weeks 33–34',
    overview: 'Rate yourself (and your partner, if pairs) on participation, contribution, communication, and meeting responsibilities — with evidence. Always individual. TASC work requirement — mandatory for SA eligibility.',
    criteria: ['PRJ-C3', 'PRJ-C5'],
    elements: ['PRJ-C3-a', 'PRJ-C3-b', 'PRJ-C3-e', 'PRJ-C5-c', 'PRJ-C5-e'],
    body: {
      sections: [
        { title: 'Instructions', html: `
<p>Complete the TASC Peer &amp; Self Evaluation form (provided by teacher). Rate yourself and your partner (if pairs) on participation, contribution, communication, and meeting responsibilities. Your ratings must be justified with specific examples — a rating without evidence is not accepted.</p>
<p>Additionally, write a short <strong>Project Value Assessment</strong> (150–200 words): Was the effort of this project worth the outcome? Consider: skills gained, quality of final game, time invested, enjoyment, and what you would take from this into a future project.</p>` },
      ],
      checklist: [
        'Evaluation form completed with justified ratings (specific examples for every rating)',
        'Project Value Assessment: 150–200 words addressing all prompts',
      ],
      marking: [
        { criterion: 'PRJ-C3', c: "Correctly identifies own (and partner's) roles and responsibilities with evidence. Evaluation demonstrates respectful communication strategies.", a: null },
        { criterion: 'PRJ-C5', c: 'Assesses the benefits of the project against risks, costs and effort. Reflects on progress and articulates lessons for future projects.', a: null },
      ],
    },
  },

  {
    id: 'T6.8', unit_id: 'u6', code: '6.8', title: 'Game Page & Final Presentation',
    type: 'submission', sort: 68, est_time: '2 lessons prep + presentation day', tools: 'itch.io, slides', weeks: 'Week 34',
    overview: 'Publish your game to a real audience and present the whole journey.',
    criteria: ['PRJ-C2', 'PRJ-C5'],
    elements: ['PRJ-C2-a', 'PRJ-C2-b', 'PRJ-C2-c', 'PRJ-C2-d', 'PRJ-C5-a', 'PRJ-C5-e'],
    body: {
      sections: [
        { title: 'Part A — Game Page on itch.io', html: `
<p>Publish a public game page on itch.io (free account). Must include:</p>
<ul>
  <li>Game title and short description (2–3 sentences)</li>
  <li>Minimum 4 screenshots showing gameplay</li>
  <li>How-to-play instructions</li>
  <li>Credits section (all team members + all asset attributions)</li>
  <li>Playable web build OR downloadable build (if web export is available in your engine)</li>
</ul>
<p>Review your ESC C4 work from Unit 1 Task 1.3 before publishing — apply those safe social media/online publishing practices here.</p>` },
        { title: 'Part B — Final Presentation (5–8 minutes)', html: `
<p>Present to the class (and any invited audience). Cover: game demo, design decisions, how the project went vs your Project Brief, key lessons learned. Respond to questions. Slides are optional but recommended.</p>` },
      ],
      checklist: [
        'itch.io page: title, description, 4+ screenshots, how-to-play, credits with attributions',
        'Playable or downloadable build attached to the page',
        'Presentation delivered: demo, design decisions, plan vs actual, lessons learned',
        'Questions answered',
        'Submitted: itch.io link + slides',
      ],
      marking: [
        { criterion: 'PRJ-C2', c: 'Develops, presents and explains the project to different audiences (class + public itch.io page). Uses ICT tools to report on and publish the project.', a: null },
        { criterion: 'PRJ-C5', c: 'Explains how the parts of the project interacted to produce the outcome. Reflects on the journey and articulates lessons learned.', a: null },
      ],
    },
  },
];

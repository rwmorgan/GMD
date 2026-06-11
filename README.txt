LEVEL UP — Game Design & Digital Technology (Yr 11–12, Tasmania)
Site rebuilt 2026-06-11 — v2 "Neon" modern edition.

What's here:
- index.html ............ Homepage with interactive Three.js 3D hero (needs internet for the CDN script; degrades gracefully offline)
- units/ ................ Units 1–6 task pages (TASC ESC205114, ICT205114, PRJ205118)
- assessment/ ........... Course criteria pages + coverage matrix
- resources/ ............ Tool guides; tutorials.html is the curated Tutorials Hub
- css/style.css ......... Shared theme (glassmorphism, scroll reveal, 3D card tilt)
- js/main.js ............ Shared nav/footer injection + animations
- js/three-hero.js ...... Homepage 3D scene (Three.js r128 via cdnjs)

Local preview without Python/Node:
  powershell -NoProfile -ExecutionPolicy Bypass -File .claude/serve.ps1
  then open http://localhost:8765/

The site also works opened directly from the file system (no server needed);
the only feature that requires internet is the 3D hero and Google Fonts.

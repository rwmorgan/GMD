/* ============================================================
   LEVEL UP — 3D Hero Scene (Three.js)
   Floating low-poly game-dev objects + particle field.
   Requires the THREE global (loaded from CDN before this file)
   and a <div id="hero-3d"> inside the hero section.
   ============================================================ */

(function () {
  const mount = document.getElementById('hero-3d');
  if (!mount || typeof THREE === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Renderer / Scene / Camera ---------- */
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f1e, 0.035);

  const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 14);

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0x8899bb, 0.55));
  const keyLight = new THREE.PointLight(0x38bdf8, 1.4, 60);
  keyLight.position.set(8, 6, 10);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(0xa855f7, 1.1, 60);
  fillLight.position.set(-10, -4, 6);
  scene.add(fillLight);

  /* ---------- Materials ---------- */
  const wireTeal   = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.55 });
  const wirePurple = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.45 });
  const solidDark  = new THREE.MeshStandardMaterial({ color: 0x1b2742, roughness: 0.35, metalness: 0.7, flatShading: true });
  const solidTeal  = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3, metalness: 0.5, flatShading: true, emissive: 0x06354f });
  const solidAmber = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.4, flatShading: true, emissive: 0x4a2e02 });

  /* ---------- Floating objects ---------- */
  const floaters = [];

  function addFloater(mesh, opts) {
    mesh.position.set(opts.x, opts.y, opts.z);
    mesh.userData = {
      baseY: opts.y,
      bobSpeed: opts.bobSpeed || 0.5,
      bobAmp: opts.bobAmp || 0.4,
      rotX: opts.rotX || 0.002,
      rotY: opts.rotY || 0.003,
      phase: Math.random() * Math.PI * 2
    };
    scene.add(mesh);
    floaters.push(mesh);
    return mesh;
  }

  // Hero piece: big wireframe d20 (icosahedron), right of centre
  const d20 = new THREE.Group();
  d20.add(new THREE.Mesh(new THREE.IcosahedronGeometry(3.1, 0), wireTeal));
  const d20Core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.95, 0), solidDark);
  d20Core.material = d20Core.material.clone();
  d20Core.material.transparent = true;
  d20Core.material.opacity = 0.82;
  d20.add(d20Core);
  addFloater(d20, { x: 6.6, y: 0.4, z: -2, bobSpeed: 0.4, bobAmp: 0.5, rotX: 0.0016, rotY: 0.0024 });

  // Torus knot, left side
  addFloater(
    new THREE.Mesh(new THREE.TorusKnotGeometry(1.5, 0.42, 90, 12), wirePurple),
    { x: -7.2, y: 1.6, z: -3.5, bobSpeed: 0.55, bobAmp: 0.45, rotX: 0.003, rotY: 0.002 }
  );

  // Small solid shapes drifting around
  addFloater(new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), solidTeal),
    { x: -4.6, y: -2.6, z: -1, bobSpeed: 0.7, bobAmp: 0.55, rotX: 0.006, rotY: 0.004 });
  addFloater(new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), solidAmber),
    { x: 5.4, y: -4.4, z: 0.5, bobSpeed: 0.6, bobAmp: 0.4, rotX: 0.004, rotY: 0.006 });
  addFloater(new THREE.Mesh(new THREE.TetrahedronGeometry(0.9, 0), solidTeal.clone()),
    { x: 9.5, y: 3.4, z: -5, bobSpeed: 0.5, bobAmp: 0.6, rotX: 0.005, rotY: 0.003 });
  addFloater(new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), wireTeal.clone()),
    { x: -9.4, y: -1.4, z: -5.5, bobSpeed: 0.65, bobAmp: 0.5, rotX: 0.004, rotY: 0.005 });
  addFloater(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), solidDark.clone()),
    { x: 0.8, y: 3.6, z: -6, bobSpeed: 0.45, bobAmp: 0.5, rotX: 0.005, rotY: 0.004 });

  /* ---------- Particle starfield ---------- */
  const COUNT = 600;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 46;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 4;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0x7dd3fc, size: 0.05, transparent: true, opacity: 0.7, sizeAttenuation: true
  }));
  scene.add(stars);

  /* ---------- Mouse parallax ---------- */
  let targetX = 0, targetY = 0;
  window.addEventListener('pointermove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- Resize ---------- */
  function onResize() {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  /* ---------- Animation loop ---------- */
  const clock = new THREE.Clock();
  let running = true;

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reducedMotion) animate();
  });

  function renderFrame() {
    const t = clock.getElapsedTime();

    floaters.forEach((obj) => {
      const d = obj.userData;
      obj.position.y = d.baseY + Math.sin(t * d.bobSpeed + d.phase) * d.bobAmp;
      obj.rotation.x += d.rotX;
      obj.rotation.y += d.rotY;
    });

    stars.rotation.y = t * 0.012;

    // ease camera toward pointer
    camera.position.x += (targetX * 1.3 - camera.position.x) * 0.04;
    camera.position.y += (-targetY * 0.9 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function animate() {
    if (!running) return;
    renderFrame();
    requestAnimationFrame(animate);
  }

  if (reducedMotion) {
    renderFrame(); // single static frame, no motion
  } else {
    animate();
  }
})();

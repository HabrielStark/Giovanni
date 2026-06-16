// Scene 5 — Hella's return and the choice. Cold Paris daylight, blue-grey street corner.
import * as THREE from 'three';
import { mat, box, cyl, canvasTex, gradientTex, makeDust, taskTracker } from '../env.js';
import { createCharacter, PALETTES } from '../characters.js';

const DAVID = '#7da7c4';

// Cobblestone street with damp sheen.
function cobbleTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#4f565d'; g.fillRect(0, 0, w, h);
    const r = 26;
    for (let y = -r; y < h + r; y += r) {
      const off = (Math.floor(y / r) % 2) * r * 0.5;
      for (let x = -r; x < w + r; x += r) {
        const cx = x + off + (Math.random() - 0.5) * 4;
        const cy = y + (Math.random() - 0.5) * 4;
        const tone = 70 + Math.random() * 34;
        g.fillStyle = `rgb(${tone},${tone + 6},${tone + 12})`;
        g.beginPath();
        g.ellipse(cx, cy, r * 0.46, r * 0.42, Math.random() * 0.4, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(20,24,28,0.5)'; g.lineWidth = 2; g.stroke();
      }
    }
    for (let i = 0; i < 200; i++) {
      g.fillStyle = `rgba(180,195,210,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  });
}

// Lit-window emissive layer for a facade (black with warm glowing panes).
function litWindowsTexture(rows, cols) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const ww = w / cols, wh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.4) continue;
        const x = c * ww + ww * 0.24, y = r * wh + wh * 0.18;
        g.fillStyle = Math.random() > 0.3 ? '#ffcf86' : '#bcd2e8';
        g.fillRect(x, y, ww * 0.52, wh * 0.62);
      }
    }
  });
}

function facadeTexture(baseColor, rows, cols) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = baseColor;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.07)';
    for (let y = 0; y < h; y += 26) g.fillRect(0, y, w, 2);
    const ww = w / cols, wh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * ww + ww * 0.24, y = r * wh + wh * 0.18;
        const winW = ww * 0.52, winH = wh * 0.62;
        g.fillStyle = '#3c444e';
        g.fillRect(x, y, winW, winH);
        g.fillStyle = 'rgba(160,175,190,0.25)';
        g.fillRect(x + 2, y + 2, winW - 4, winH * 0.4);
        g.strokeStyle = '#7d828a';
        g.lineWidth = 3;
        g.strokeRect(x, y, winW, winH);
        g.beginPath();
        g.moveTo(x + winW / 2, y); g.lineTo(x + winW / 2, y + winH);
        g.stroke();
        // narrow balcony rail
        g.fillStyle = 'rgba(40,44,50,0.8)';
        g.fillRect(x - 4, y + winH, winW + 8, 3);
      }
    }
  });
}

export default function build(ctx) {
  const { scene, player, interactions, dialogue, quotes } = ctx;

  // ---- cold dawn sky + damp air ----
  scene.background = gradientTex([
    [0, '#202f42'], [0.4, '#566678'], [0.72, '#9aa7b5'], [1, '#cfd6dd'],
  ], 8, 256);
  scene.fog = new THREE.Fog(0x9aa7b5, 14, 60);

  // ---- wet cobblestone street ----
  const cob = cobbleTexture();
  cob.wrapS = cob.wrapT = THREE.RepeatWrapping;
  cob.repeat.set(10, 10);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(64, 64),
    new THREE.MeshStandardMaterial({ map: cob, roughness: 0.45, metalness: 0.2 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // reflective puddles
  for (const [px, pz, pr] of [[1.4, -1.0, 0.95], [-2.9, 1.6, 0.7], [3.6, 2.6, 1.05], [-0.6, 3.4, 0.6]]) {
    const pud = new THREE.Mesh(new THREE.CircleGeometry(pr, 28),
      new THREE.MeshStandardMaterial({ color: 0x2a323b, roughness: 0.06, metalness: 0.6 }));
    pud.rotation.x = -Math.PI / 2;
    pud.position.set(px, 0.013, pz);
    scene.add(pud);
  }

  // sidewalk slabs near the buildings
  const walkMat = mat(0x767d85, { roughness: 0.82 });
  scene.add(box(26, 0.1, 3.6, walkMat, 0, 0.05, -5.0));
  scene.add(box(3.6, 0.1, 18, walkMat, -7.2, 0.05, 1));
  // kerb edges
  const kerb = mat(0x5a6068, { roughness: 0.7 });
  scene.add(box(26, 0.16, 0.18, kerb, 0, 0.08, -3.25));
  scene.add(box(0.18, 0.16, 18, kerb, -5.45, 0.08, 1));

  // ---- light: cold dawn with a low warm sun ----
  scene.add(new THREE.HemisphereLight(0xb9c8da, 0x3a424b, 1.0));
  const sun = new THREE.DirectionalLight(0xf3e3c4, 1.35);
  sun.position.set(-13, 7, -5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -14; sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const skyFill = new THREE.DirectionalLight(0x9fb4cc, 0.55);
  skyFill.position.set(8, 10, 9);
  scene.add(skyFill);

  // ---- building facades forming a corner (with lit windows) ----
  const facadeMat = (color, rows, cols) => new THREE.MeshStandardMaterial({
    map: facadeTexture(color, rows, cols),
    emissiveMap: litWindowsTexture(rows, cols),
    emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.92,
  });
  const plain1 = mat(0x6f6c64);
  const f1 = new THREE.Mesh(new THREE.BoxGeometry(26, 13, 0.8),
    [plain1, plain1, plain1, plain1, facadeMat('#85827a', 5, 8), plain1]);
  f1.position.set(0, 6.5, -7.4);
  scene.add(f1);
  const plain2 = mat(0x73767b);
  const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 13, 20),
    [facadeMat('#888b91', 5, 6), plain2, plain2, plain2, plain2, plain2]);
  f2.position.set(-9.4, 6.5, 1);
  scene.add(f2);
  // far blocks for depth
  scene.add(box(20, 11, 0.8, mat(0x646a72), 5, 5.5, 13));
  scene.add(box(14, 9, 0.8, mat(0x565c64), -14, 4.5, 6));
  // mansard roofline accents
  scene.add(box(26, 0.5, 1.0, mat(0x3a3f46), 0, 13.0, -7.1));

  // ---- café awning + door on facade 1 (warm, lit) ----
  const door = box(1.3, 2.4, 0.12, mat(0x33414d, { roughness: 0.5 }), 3.4, 1.2, -6.9);
  scene.add(door);
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0),
    new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb870, emissiveIntensity: 0.7, roughness: 0.5 }));
  doorGlow.position.set(3.4, 1.25, -6.83);
  scene.add(doorGlow);
  const awning = box(4.4, 0.1, 1.4, mat(0x7a2f33, { roughness: 0.85 }), 3.4, 2.75, -6.15);
  awning.rotation.x = 0.16;
  scene.add(awning);
  // awning stripes
  for (let i = 0; i < 5; i++) {
    const s = box(0.5, 0.02, 1.4, mat(i % 2 ? 0xe9dccb : 0x7a2f33, { roughness: 0.85 }), 3.4 - 1.8 + i * 0.9, 2.78, -6.15);
    s.rotation.x = 0.16; scene.add(s);
  }

  // ---- glowing streetlamp ----
  const post = new THREE.Group();
  post.add(cyl(0.05, 0.08, 3.5, mat(0x23282e, { roughness: 0.45, metalness: 0.5 }), 0, 1.75, 0));
  post.add(box(0.55, 0.06, 0.06, mat(0x23282e), 0.24, 3.42, 0));
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff0cf, emissive: 0xffc266, emissiveIntensity: 1.6 }));
  lantern.position.set(0.48, 3.34, 0);
  post.add(lantern);
  const haloTex = canvasTex(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,210,140,0.85)'); gr.addColorStop(1, 'rgba(255,210,140,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(1.6, 1.6, 1); halo.position.set(0.48, 3.34, 0);
  post.add(halo);
  const lampLight = new THREE.PointLight(0xffc070, 6, 9, 1.6);
  lampLight.position.set(0.48, 3.3, 0);
  post.add(lampLight);
  post.position.set(2.4, 0, -2.2);
  scene.add(post);

  // ---- bench ----
  const bench = new THREE.Group();
  const bm = mat(0x4a3a2c, { roughness: 0.85 });
  const ironM = mat(0x23282e, { roughness: 0.5, metalness: 0.45 });
  for (const sz of [0.45, 0.62]) bench.add(box(1.7, 0.06, 0.16, bm, 0, sz, sz === 0.45 ? 0.12 : -0.04));
  bench.add(box(1.7, 0.06, 0.16, bm, 0, 0.45, -0.12));
  bench.add(box(1.7, 0.4, 0.06, bm, 0, 0.75, -0.2));
  bench.add(box(0.08, 0.45, 0.4, ironM, -0.78, 0.22, 0));
  bench.add(box(0.08, 0.45, 0.4, ironM, 0.78, 0.22, 0));
  bench.position.set(-5.6, 0, -3.4);
  bench.rotation.y = 0.3;
  scene.add(bench);

  // ---- bare winter tree ----
  const tree = new THREE.Group();
  const bark = mat(0x39312a, { roughness: 1 });
  tree.add(cyl(0.1, 0.16, 2.7, bark, 0, 1.35, 0));
  for (const [ry, rz, len, y] of [[0.6, 0.7, 1.3, 2.4], [2.6, 0.6, 1.1, 2.6], [4.2, 0.8, 1.2, 2.2], [1.6, 0.9, 0.9, 2.7], [3.4, 1.0, 0.8, 2.5]]) {
    const br = cyl(0.025, 0.06, len, bark, 0, y, 0);
    br.rotation.set(rz, ry, 0);
    br.position.x = Math.sin(ry) * 0.3;
    br.position.z = Math.cos(ry) * 0.3;
    tree.add(br);
    // twigs
    const tw = cyl(0.012, 0.025, len * 0.6, bark, 0, y + 0.4, 0);
    tw.rotation.set(rz * 0.6, ry + 0.5, 0);
    tw.position.x = Math.sin(ry) * 0.5; tw.position.z = Math.cos(ry) * 0.5;
    tree.add(tw);
  }
  tree.position.set(-4.8, 0, 2.6);
  scene.add(tree);

  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ---- atmosphere: drifting mist + slow snow ----
  ctx.addAnimated(makeDust(120, { w: 26, h: 7, d: 22 }, 0xc4cedd));
  const snow = makeDust(220, { w: 26, h: 12, d: 22 }, 0xffffff);
  snow.material.size = 0.05; snow.material.opacity = 0.7;
  snow.position.y = 0;
  ctx.addAnimated(snow);

  // ---- Hella ----
  const hella = createCharacter('Hella', 'hella');
  hella.position.set(0, 0, -3.6);
  hella.rotation.y = 0.05;
  ctx.addAnimated(hella);

  // ---- player ----
  player.setArea(
    { minX: -8.4, maxX: 8.4, minZ: -5.6, maxZ: 7.5 },
    [
      { minX: -6.6, maxX: -4.6, minZ: -4.1, maxZ: -2.7 }, // bench
      { minX: 2.15, maxX: 2.65, minZ: -2.45, maxZ: -1.95 }, // lamppost
      { minX: -5.2, maxX: -4.4, minZ: 2.2, maxZ: 3.0 },   // tree
    ]
  );
  player.setPose(0, 5.6, 0);

  // ---- objectives / tasks ----
  ctx.setObjective('Hella has returned. Collect the last quote card, then speak with her.');
  const tasks = taskTracker(['q6'],
    () => {},
    () => ctx.setObjective('Hella has returned. Decide what David says.'));
  const cardsDone = () => !tasks.has('q6');

  quotes.spawn(ctx, 'q6', new THREE.Vector3(-2.3, 1.4, -2.6), () => tasks.done('q6'));

  const H = { speaker: 'Hella', color: PALETTES.hella.accent };
  let choseTruth = false;

  const MONTAGE = [
    'David takes Hella and disappears from Giovanni\u2019s life \u2014 without a word, without money, without the one person Giovanni\u2019s whole world had narrowed down to.',
    'Adrift and desperate, Giovanni goes back to Guillaume\u2019s bar to beg for his job. After a final humiliation, in rage and despair, he kills Guillaume \u2014 and the court sentences him to death.',
    'David and Hella flee to a rented house in the south of France. But in Nice, Hella discovers the truth David never told her. It is the lying, more than anything, that breaks her \u2014 and she sails home to America.',
    'And so David stands alone at the window of the great empty house, on the night before Giovanni\u2019s execution \u2014 the night where this story began. He tears up the letter announcing the death, and the wind blows the pieces back against him.',
  ];

  interactions.add({
    object: hella, prompt: 'Speak with Hella',
    onInteract: () => {
      if (!cardsDone()) {
        dialogue.start([{ speaker: null, text: 'Not yet. One more memory is glowing in the cold \u2014 I must hold it first.' }]);
        return;
      }
      dialogue.start([
        { ...H, text: 'David! Three weeks in Spain, and you write like a prisoner counting days \u2014 and then you nearly miss my train.' },
        { ...H, text: 'I did a lot of thinking down there. I\u2019m tired of being clever and free. I want a life with a shape \u2014 a husband, a kitchen, children laughing in another room. Is that cowardly?' },
        { speaker: 'David', color: DAVID, text: 'No. It sounds\u2026 safe.' },
        {
          ...H, text: 'You look at me so strangely. David \u2014 where have you been living, all the time I was away? You never really said.',
          choices: [
            {
              label: 'Tell Hella the truth about Giovanni.',
              onPick: () => { choseTruth = true; },
              lines: [
                { speaker: 'David', color: DAVID, text: 'Hella \u2014 there is something I have to tell you. While you were gone, there was someone. His name is Giovanni.' },
                { speaker: null, text: 'For one moment the words exist, out loud, in the cold air between us. Honest. Possible.' },
              ],
            },
            {
              label: 'Say nothing. Choose the safe life.',
              lines: [
                { speaker: 'David', color: DAVID, text: 'Nowhere. A cheap room. It doesn\u2019t matter \u2014 you\u2019re back now. Let\u2019s be what everyone expects.' },
                { ...H, text: 'Then hold me. Paris is freezing.' },
              ],
            },
          ],
        },
      ], () => {
        const pivot = choseTruth
          ? 'What if David had said it? Honesty was possible, that cold morning \u2014 the words existed, and for a heartbeat he almost owned them. But that is not what David did. In the novel, David hides the truth. This silence is the moment the whole story pivots on.'
          : 'David says nothing. He chooses the appearance of safety \u2014 the life everyone expects. This silence is the moment the whole novel pivots on.';
        ctx.endGame([pivot, ...MONTAGE]);
      });
    },
  });
}

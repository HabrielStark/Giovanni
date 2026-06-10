// Scene 5 — Hella's return and the choice. Cold Paris daylight, blue-grey street corner.
import * as THREE from 'three';
import { mat, box, cyl, canvasTex, taskTracker } from '../env.js';
import { createCharacter, PALETTES } from '../characters.js';

const DAVID = '#7da7c4';

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

  scene.background = new THREE.Color(0x9aa7b5);
  scene.fog = new THREE.Fog(0x9aa7b5, 10, 46);

  // wet cold street
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(0x586068, { roughness: 0.55, metalness: 0.1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // sidewalk slabs near the buildings
  const walk1 = box(24, 0.09, 3.4, mat(0x767d85, { roughness: 0.8 }), 0, 0.045, -5.0);
  const walk2 = box(3.4, 0.09, 16, mat(0x767d85, { roughness: 0.8 }), -7.0, 0.045, 1);
  scene.add(walk1, walk2);

  scene.add(new THREE.HemisphereLight(0xcdd6e2, 0x4e555c, 1.25));
  const sun = new THREE.DirectionalLight(0xe8edf4, 2.0);
  sun.position.set(8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
  scene.add(sun);

  // building facades forming a corner
  const tex1 = facadeTexture('#8d8a82', 4, 7);
  const f1 = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 0.8),
    [mat(0x77746c), mat(0x77746c), mat(0x77746c), mat(0x77746c), new THREE.MeshStandardMaterial({ map: tex1, roughness: 0.9 }), mat(0x77746c)]);
  f1.position.set(0, 6, -7.2);
  scene.add(f1);
  const tex2 = facadeTexture('#8a8d93', 4, 5);
  const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 12, 18),
    [new THREE.MeshStandardMaterial({ map: tex2, roughness: 0.9 }), mat(0x787b80), mat(0x787b80), mat(0x787b80), mat(0x787b80), mat(0x787b80)]);
  f2.position.set(-9.2, 6, 1);
  scene.add(f2);
  // far block for depth
  const f3 = box(18, 10, 0.8, mat(0x6e747c), 4, 5, 12);
  scene.add(f3);

  // café awning + door on facade 1 (closed, out of season)
  const door = box(1.3, 2.4, 0.1, mat(0x37404a, { roughness: 0.6 }), 3.4, 1.2, -6.75);
  scene.add(door);
  const awning = box(4.2, 0.08, 1.3, mat(0x5b6b78, { roughness: 0.9 }), 3.4, 2.7, -6.1);
  awning.rotation.x = 0.18;
  scene.add(awning);

  // lamppost
  const post = new THREE.Group();
  post.add(cyl(0.05, 0.07, 3.4, mat(0x2c3138, { roughness: 0.5, metalness: 0.4 }), 0, 1.7, 0));
  post.add(box(0.5, 0.05, 0.05, mat(0x2c3138), 0.22, 3.32, 0));
  const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xdfe6ea, emissive: 0xaab8c2, emissiveIntensity: 0.25 }));
  lampHead.position.set(0.45, 3.26, 0);
  post.add(lampHead);
  post.position.set(2.4, 0, -2.2);
  scene.add(post);

  // bench
  const bench = new THREE.Group();
  const bm = mat(0x3f4a52, { roughness: 0.8 });
  bench.add(box(1.7, 0.07, 0.45, bm, 0, 0.45, 0));
  bench.add(box(1.7, 0.45, 0.07, bm, 0, 0.75, -0.2));
  bench.add(box(0.08, 0.45, 0.4, bm, -0.75, 0.22, 0));
  bench.add(box(0.08, 0.45, 0.4, bm, 0.75, 0.22, 0));
  bench.position.set(-5.6, 0, -3.4);
  bench.rotation.y = 0.3;
  scene.add(bench);

  // bare winter tree
  const tree = new THREE.Group();
  tree.add(cyl(0.09, 0.14, 2.6, mat(0x3a332c, { roughness: 1 }), 0, 1.3, 0));
  for (const [ry, rz, len, y] of [[0.6, 0.7, 1.2, 2.3], [2.6, 0.6, 1.0, 2.5], [4.2, 0.8, 1.1, 2.1]]) {
    const br = cyl(0.025, 0.05, len, mat(0x3a332c, { roughness: 1 }), 0, y, 0);
    br.rotation.set(rz, ry, 0);
    br.position.x = Math.sin(ry) * 0.3;
    br.position.z = Math.cos(ry) * 0.3;
    tree.add(br);
  }
  tree.position.set(-4.8, 0, 2.6);
  scene.add(tree);

  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

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
  ctx.setObjective('Hella has returned. Collect the last two quote cards, then speak with her.');
  const tasks = taskTracker(['q9', 'q10'],
    () => {},
    () => ctx.setObjective('Hella has returned. Decide what David says.'));
  const cardsDone = () => !tasks.has('q9') && !tasks.has('q10');

  quotes.spawn(ctx, 'q9', new THREE.Vector3(-2.3, 1.4, -2.6), () => tasks.done('q9'));
  quotes.spawn(ctx, 'q10', new THREE.Vector3(3.4, 1.4, -0.6), () => tasks.done('q10'));

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
        dialogue.start([{ speaker: null, text: 'Not yet. Two more memories are glowing in the cold \u2014 I must hold them first.' }]);
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

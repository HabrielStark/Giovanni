// Scene 4 — Giovanni's room. Small, warm, intimate, cluttered. The heart of the novel.
import * as THREE from 'three';
import { mat, box, cyl, buildRoom, makeMirror, taskTracker, makeDust } from '../env.js';
import { createCharacter, PALETTES } from '../characters.js';

const W = 5.4, D = 4.6, H = 2.45;
const DAVID = '#7da7c4';

export default function build(ctx) {
  const { scene, player, interactions, dialogue, quotes } = ctx;

  scene.background = new THREE.Color(0x150d06);
  scene.fog = new THREE.Fog(0x241509, 1.5, 11);

  buildRoom(scene, {
    w: W, d: D, h: H,
    floorMat: mat(0x4a3322, { roughness: 0.75 }),
    wallMat: mat(0x8f7a5c),
    ceilMat: mat(0x6e5c44),
  });

  scene.add(new THREE.AmbientLight(0x6b5436, 0.85));

  // the single lamp — the soul of the room
  const lampLight = new THREE.PointLight(0xffb066, 9, 11, 1.7);
  lampLight.position.set(1.55, 1.18, -1.45);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  scene.add(lampLight);

  const lamp = new THREE.Group();
  lamp.add(cyl(0.06, 0.11, 0.32, mat(0x3a2a18), 0, 0.16, 0));
  const lshade = cyl(0.12, 0.18, 0.18, mat(0xd9a45e, { emissive: 0xffa050, emissiveIntensity: 0.85, side: THREE.DoubleSide }), 0, 0.38, 0);
  lamp.add(lshade);
  lamp.position.set(1.55, 0.72, -1.45);
  scene.add(lamp);

  // small table under the lamp
  const table = new THREE.Group();
  table.add(box(0.7, 0.05, 0.55, mat(0x4a3522), 0, 0.7, 0));
  for (const [lx, lz] of [[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]])
    table.add(box(0.05, 0.7, 0.05, mat(0x4a3522), lx, 0.35, lz));
  table.position.set(1.55, 0, -1.45);
  scene.add(table);

  const bottle = new THREE.Group();
  bottle.add(cyl(0.05, 0.06, 0.3, mat(0x4f7a4a, { transparent: true, opacity: 0.88, roughness: 0.15, emissive: 0x2e4f2a, emissiveIntensity: 0.2 }), 0, 0.15, 0));
  bottle.add(cyl(0.016, 0.016, 0.1, mat(0x4f7a4a, { transparent: true, opacity: 0.88 }), 0, 0.34, 0));
  bottle.position.set(1.4, 0.725, -1.3);
  scene.add(bottle);

  // ---- bed ----
  const bed = new THREE.Group();
  bed.add(box(1.95, 0.22, 1.15, mat(0x3a2a18), 0, 0.18, 0));
  bed.add(box(1.9, 0.16, 1.1, mat(0x9c4a3a, { roughness: 0.95 }), 0, 0.37, 0));     // rumpled blanket
  bed.add(box(1.0, 0.1, 1.05, mat(0xd9c8a8, { roughness: 0.95 }), -0.4, 0.43, 0)); // folded-back sheet
  bed.add(box(0.42, 0.12, 0.55, mat(0xe6dcc2, { roughness: 0.95 }), -0.68, 0.47, -0.22)); // pillow
  bed.position.set(-1.6, 0, -1.15);
  scene.add(bed);

  // ---- chair with shirt ----
  const chair = new THREE.Group();
  const chm = mat(0x4a3522);
  chair.add(box(0.42, 0.05, 0.42, chm, 0, 0.46, 0));
  chair.add(box(0.42, 0.55, 0.05, chm, 0, 0.76, -0.19));
  for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]])
    chair.add(box(0.045, 0.46, 0.045, chm, lx, 0.23, lz));
  chair.position.set(1.3, 0, 0.9);
  chair.rotation.y = -0.7;
  scene.add(chair);

  const shirt = new THREE.Group();
  const shm = mat(0xb8c4cc, { roughness: 0.95 });
  shirt.add(box(0.4, 0.34, 0.06, shm, 0, 0, 0));
  shirt.add(box(0.4, 0.06, 0.3, shm, 0, 0.17, 0.12));
  shirt.position.set(1.3, 0.92, 0.83);
  shirt.rotation.y = -0.7;
  shirt.rotation.x = 0.12;
  scene.add(shirt);

  // ---- whitewashed window ----
  const winG = new THREE.Group();
  const wf = mat(0x5e4a32);
  winG.add(box(1.5, 0.08, 0.07, wf, 0, 0.65, 0));
  winG.add(box(1.5, 0.08, 0.07, wf, 0, -0.65, 0));
  winG.add(box(0.08, 1.38, 0.07, wf, -0.71, 0, 0));
  winG.add(box(0.08, 1.38, 0.07, wf, 0.71, 0, 0));
  winG.add(box(0.06, 1.3, 0.05, wf, 0, 0, 0));
  winG.add(box(1.4, 0.06, 0.05, wf, 0, 0, 0));
  // milky painted panes, faint glow of a hidden world outside
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.24),
    new THREE.MeshStandardMaterial({ color: 0xe8e0cc, emissive: 0xfff2d8, emissiveIntensity: 0.22, roughness: 0.9 }));
  pane.position.z = -0.02;
  winG.add(pane);
  winG.position.set(-0.4, 1.5, -D / 2 + 0.05);
  scene.add(winG);

  // ---- mirror, clutter ----
  const mirror = makeMirror(0.5, 0.7, 0x4a3727);
  mirror.position.set(W / 2 - 0.05, 1.5, 0.3);
  mirror.rotation.y = -Math.PI / 2;
  scene.add(mirror);

  const clutter = new THREE.Group();
  clutter.add(box(0.6, 0.4, 0.42, mat(0x6e4f33), 0, 0.2, 0));
  clutter.add(box(0.5, 0.3, 0.36, mat(0x55412c), 0.25, 0.55, 0.1));
  const c3 = box(0.45, 0.35, 0.3, mat(0x7a6248), -0.5, 0.175, 0.3);
  c3.rotation.y = 0.6;
  clutter.add(c3);
  clutter.position.set(-2.2, 0, 1.5);
  scene.add(clutter);

  ctx.addAnimated(makeDust(60, { w: W - 0.6, h: H - 0.3, d: D - 0.6 }, 0xffd9a8));

  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ---- Giovanni ----
  const giovanni = createCharacter('Giovanni', 'giovanni');
  giovanni.position.set(-0.35, 0, -1.5);
  giovanni.rotation.y = 0.15;
  ctx.addAnimated(giovanni);

  // ---- player ----
  player.setArea(
    { minX: -W / 2 + 0.2, maxX: W / 2 - 0.2, minZ: -D / 2 + 0.2, maxZ: D / 2 - 0.2 },
    [
      { minX: -2.7, maxX: -0.6, minZ: -1.8, maxZ: -0.5 }, // bed
      { minX: 1.15, maxX: 1.95, minZ: -1.8, maxZ: -1.1 }, // table
      { minX: -2.6, maxX: -1.7, minZ: 1.1, maxZ: 2.0 },   // clutter
    ]
  );
  player.setPose(1.6, 1.6, 30);

  // ---- objectives / tasks ----
  ctx.setObjective('Look around the room David and Giovanni shared, then talk to Giovanni.');
  const LOOK = ['bed', 'chair', 'shirt', 'bottle', 'window', 'mirror', 'q7', 'q8'];
  const tasks = taskTracker(
    [...LOOK, 'giovanni'],
    (k, remaining) => {
      const left = [...remaining];
      if (left.length === 1 && left[0] === 'giovanni') ctx.setObjective('Talk to Giovanni.');
    },
    () => ctx.complete('Then a letter came. Hella was sailing back from Spain. I left the room to meet her \u2014 and I did not say when I would return.')
  );
  const lookDone = () => LOOK.every((k) => !tasks.has(k));

  const monologue = (lines, key) => () =>
    dialogue.start(lines.map((text) => ({ speaker: null, text })), () => tasks.done(key));

  interactions.add({
    object: bed, prompt: 'Examine the bed',
    onInteract: monologue([
      'In this bed I was happier than I had ever been in my life. And more afraid.',
    ], 'bed'),
  });
  interactions.add({
    object: chair, prompt: 'Examine the chair',
    onInteract: monologue([
      'One chair, holding both our lives. We owned too little to quarrel over, so we quarrelled over everything else.',
    ], 'chair'),
  });
  interactions.add({
    object: shirt, prompt: 'Examine the shirt',
    onInteract: monologue([
      'His shirt, thrown over the chair. It smells of wine and work and something warm I have no word for.',
    ], 'shirt'),
  });
  interactions.add({
    object: bottle, prompt: 'Examine the bottle',
    onInteract: monologue([
      'We drank cheap wine out of the same two glasses and made plans we both knew I didn\u2019t believe.',
    ], 'bottle'),
  });
  interactions.add({
    object: winG, prompt: 'Examine the window',
    onInteract: monologue([
      'Giovanni painted the windowpanes white so no one could see in. He started, and stopped, and started again.',
      'The room hides from the street. The street pretends we do not exist. It suited us both, and it was killing us both.',
    ], 'window'),
  });
  interactions.add({
    object: mirror, prompt: 'Examine the small mirror',
    onInteract: monologue([
      'I keep catching my own eyes in this little mirror. Each morning the face in it belongs to me a little less \u2014 or a little more.',
      'I cannot tell which frightens me most.',
    ], 'mirror'),
  });

  interactions.add({
    object: giovanni, prompt: 'Talk to Giovanni',
    onInteract: () => {
      if (!lookDone()) {
        dialogue.start([
          { speaker: 'Giovanni', color: PALETTES.giovanni.accent, text: 'Look around you first, mon cher. This room is half of me \u2014 see it, and then we will talk.' },
        ]);
        return;
      }
      const G = { speaker: 'Giovanni', color: PALETTES.giovanni.accent };
      dialogue.start([
        { ...G, text: 'You are doing it again. Standing in the middle of our room as if you have somewhere else to be.' },
        { ...G, text: 'I know that look, mon cher. Americans get it before they leave \u2014 they begin to look at everything as if it were already a photograph.' },
        {
          ...G, text: 'Tell me. When the money comes, when the girl writes, when there is an excuse with clean fingernails \u2014 will you go?',
          choices: [
            {
              label: '(Say nothing)',
              lines: [
                { speaker: null, text: 'I said nothing. The lamp hummed.' },
                { ...G, text: 'Your silence is the loudest thing in this room. Even the walls hear it.' },
              ],
            },
            {
              label: '\u201CI\u2019m not going anywhere. I promise.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'I\u2019m not going anywhere. I promise.' },
                { ...G, text: 'You promise the way the sky promises \u2014 beautifully, and with no memory.' },
              ],
            },
            {
              label: '\u201CI\u2019m afraid, Giovanni. Of this room. Of all of it.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'I\u2019m afraid, Giovanni. Of this room. Of how much I \u2014 of all of it.' },
                { ...G, text: 'At last, a true sentence. Fear I can live with, David. It is the lying that kills.' },
              ],
            },
          ],
        },
        { ...G, text: 'Come. Sit. Whatever is coming will come \u2014 tonight, at least, the room is ours.' },
      ], () => tasks.done('giovanni'));
    },
  });

  quotes.spawn(ctx, 'q7', new THREE.Vector3(-1.5, 1.4, 0.5), () => tasks.done('q7'));
  quotes.spawn(ctx, 'q8', new THREE.Vector3(0.55, 1.35, -1.8), () => tasks.done('q8'));
}

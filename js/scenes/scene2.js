// Scene 2 — Childhood memory: Father. Faded sepia American living room, dreamlike fog.
import * as THREE from 'three';
import { mat, box, cyl, buildRoom, canvasTex, taskTracker } from '../env.js';
import { createCharacter, PALETTES } from '../characters.js';

const W = 9, D = 6.5, H = 3;
const DAVID = '#7da7c4';

export default function build(ctx) {
  const { scene, player, interactions, dialogue, quotes } = ctx;

  scene.background = new THREE.Color(0x4a3a28);
  scene.fog = new THREE.Fog(0x4a3a28, 2.5, 13);

  buildRoom(scene, {
    w: W, d: D, h: H,
    floorMat: mat(0x55412e, { roughness: 0.75 }),
    wallMat: mat(0x77624a),
    ceilMat: mat(0x5e4d3a),
  });

  scene.add(new THREE.AmbientLight(0xa08862, 3.2));
  const fill = new THREE.PointLight(0xd9b988, 9, 14, 1.6);
  fill.position.set(0, 2.5, 0.5);
  scene.add(fill);
  const sun = new THREE.DirectionalLight(0xd9b380, 2.8);
  sun.position.set(3, 4, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  // hazy curtained window on the right wall (light source feel)
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.9),
    new THREE.MeshBasicMaterial({ color: 0xe8cf9e, transparent: true, opacity: 0.85 })
  );
  haze.position.set(W / 2 - 0.05, 1.7, 1.2);
  haze.rotation.y = -Math.PI / 2;
  scene.add(haze);
  const hf = mat(0x4e3d2a);
  const hframe = new THREE.Group();
  for (const dy of [-1.0, 1.0]) hframe.add(box(0.08, 0.1, 2.0, hf, -0.02, dy, 0));
  for (const dz of [-0.95, 0, 0.95]) hframe.add(box(0.08, 2.1, 0.1, hf, -0.02, 0, dz));
  hframe.position.set(W / 2 - 0.04, 1.7, 1.2);
  scene.add(hframe);

  // ---- furniture ----
  const armchair = new THREE.Group();
  const am = mat(0x6e4a35, { roughness: 0.95 });
  armchair.add(box(0.95, 0.42, 0.9, am, 0, 0.21, 0));
  armchair.add(box(0.95, 0.85, 0.24, am, 0, 0.5, -0.36));
  armchair.add(box(0.2, 0.62, 0.85, am, -0.42, 0.4, 0));
  armchair.add(box(0.2, 0.62, 0.85, am, 0.42, 0.4, 0));
  armchair.position.set(-2.0, 0, -1.9);
  armchair.rotation.y = 0.45;
  scene.add(armchair);

  // rug
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 28), mat(0x7a5a3c, { roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, -0.4);
  scene.add(rug);

  // side table with framed photo
  const st = new THREE.Group();
  st.add(cyl(0.3, 0.34, 0.62, mat(0x4e3a26), 0, 0.31, 0));
  st.position.set(2.4, 0, -2.4);
  scene.add(st);

  const photo = new THREE.Group();
  const photoTex = canvasTex(96, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#cdb48c');
    grad.addColorStop(1, '#8a7152');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(70,52,34,0.7)';
    g.beginPath(); g.ellipse(w / 2, h * 0.38, w * 0.16, h * 0.14, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(w / 2, h * 0.78, w * 0.3, h * 0.3, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(60,44,28,0.8)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
  photo.add(box(0.26, 0.34, 0.03, mat(0x3c2c1a)));
  const photoFace = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29),
    new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.85 }));
  photoFace.position.z = 0.018;
  photo.add(photoFace);
  photo.position.set(2.4, 0.79, -2.4);
  photo.rotation.x = -0.12;
  photo.rotation.y = -0.3;
  scene.add(photo);

  // cabinet with whiskey glass
  const cab = box(1.1, 0.85, 0.45, mat(0x4e3a26), -3.6, 0.425, 1.4);
  cab.rotation.y = Math.PI / 2;
  scene.add(cab);
  const glassObj = new THREE.Group();
  glassObj.add(cyl(0.055, 0.05, 0.12, mat(0xc9a35a, { transparent: true, opacity: 0.85, roughness: 0.2, metalness: 0.1 }), 0, 0.06, 0));
  glassObj.add(cyl(0.2, 0.2, 0.015, mat(0x3a2c1a), 0, 0.008, 0.18)); // coaster
  glassObj.position.set(-3.6, 0.86, 1.4);
  scene.add(glassObj);

  // father's letter on a small desk
  const desk = box(0.9, 0.76, 0.5, mat(0x55412c), 3.4, 0.38, 1.9);
  scene.add(desk);
  const fletter = box(0.24, 0.012, 0.32, mat(0xe3d6ba, { roughness: 0.9 }), 3.35, 0.775, 1.85);
  fletter.rotation.y = -0.5;
  scene.add(fletter);

  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ---- father ----
  const father = createCharacter('Father', 'father');
  father.position.set(-0.9, 0, -2.1);
  father.rotation.y = 0.25;
  ctx.addAnimated(father);

  // ---- player ----
  player.setArea(
    { minX: -W / 2 + 0.2, maxX: W / 2 - 0.2, minZ: -D / 2 + 0.2, maxZ: D / 2 - 0.2 },
    [
      { minX: -2.8, maxX: -1.2, minZ: -2.7, maxZ: -1.2 }, // armchair
      { minX: 2.0, maxX: 2.8, minZ: -2.9, maxZ: -2.0 },   // side table
      { minX: -4.0, maxX: -3.2, minZ: 0.8, maxZ: 2.0 },   // cabinet
      { minX: 2.9, maxX: 3.9, minZ: 1.6, maxZ: 2.2 },     // desk
    ]
  );
  player.setPose(0, 2.4, 8);

  // ---- objectives / tasks ----
  ctx.setObjective('Talk to Father and understand where David\u2019s conflict began.');
  const tasks = taskTracker(
    ['photo', 'whiskey', 'letter', 'father', 'q3', 'q4'],
    (k, remaining) => {
      const left = [...remaining];
      if (left.every((x) => x.startsWith('q'))) ctx.setObjective('Collect the remaining glowing quote cards.');
    },
    () => ctx.complete('I ran from that house and kept running \u2014 across an ocean, all the way to Paris. One spring night, Jacques took me to Guillaume\u2019s bar.')
  );

  const monologue = (lines, key) => () =>
    dialogue.start(lines.map((text) => ({ speaker: null, text })), () => tasks.done(key));

  interactions.add({
    object: photo, prompt: 'Examine the family photo',
    onInteract: monologue([
      'My mother died when I was five. In the photograph she is already fading \u2014 I knew her face mostly from this frame.',
      'After her, the house was my father, his sister Ellen, and everything we never said.',
    ], 'photo'),
  });
  interactions.add({
    object: glassObj, prompt: 'Examine the whiskey glass',
    onInteract: monologue([
      'My father\u2019s glass. He drank, and laughed loudly, and called me his buddy.',
      'The house was full of unspoken things, and the whiskey kept them quiet.',
    ], 'whiskey'),
  });
  interactions.add({
    object: fletter, prompt: 'Read Father\u2019s letter',
    onInteract: monologue([
      '\u201CDear Butch,\u201D he writes to me in Paris, years from this room, \u201Cwhat are you doing over there? Come home.\u201D',
      'He asks everything except the one question he cannot bear to ask. I never know how to answer.',
    ], 'letter'),
  });

  interactions.add({
    object: father, prompt: 'Talk to Father',
    onInteract: () => {
      const F = { speaker: 'Father', color: PALETTES.father.accent };
      dialogue.start([
        { ...F, text: 'David. We never talk anymore, you and I. Come here, buddy.' },
        { ...F, text: 'All I want for you is to grow up to be a real man. And when I say a man \u2014 believe me \u2014 I don\u2019t mean a Sunday school teacher.' },
        {
          ...F, text: 'You know that, don\u2019t you?',
          choices: [
            {
              label: '\u201CMaybe I\u2019m not the man you imagine.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'Maybe I\u2019m not the man you imagine.' },
                { ...F, text: 'Don\u2019t talk nonsense. You\u2019re my son, aren\u2019t you? You\u2019ll be fine.' },
                { speaker: null, text: 'He looked straight through me. He always did.' },
              ],
            },
            {
              label: '\u201CSure, Dad. Whatever you say.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'Sure, Dad. Whatever you say.' },
                { ...F, text: 'That\u2019s my boy. We understand each other, you and I.' },
                { speaker: null, text: 'We understood nothing. That was our agreement.' },
              ],
            },
            {
              label: '(Say nothing)',
              lines: [
                { ...F, text: 'Well. You know I\u2019m not one for speeches.' },
                { speaker: null, text: 'The silence was the truest thing between us.' },
              ],
            },
          ],
        },
        { speaker: null, text: 'He wanted my manhood proven and my heart unexamined. So I learned to give people the David they asked for.' },
      ], () => tasks.done('father'));
    },
  });

  quotes.spawn(ctx, 'q3', new THREE.Vector3(-3.4, 1.35, -1.6), () => tasks.done('q3'));
  quotes.spawn(ctx, 'q4', new THREE.Vector3(1.3, 1.35, 0.9), () => tasks.done('q4'));
}

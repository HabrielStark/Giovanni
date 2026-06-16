// Scene 1 — House in the south of France. Night, cool blue moonlight. The frame story.
import * as THREE from 'three';
import { mat, box, cyl, buildRoom, makeMirror, canvasTex, taskTracker } from '../env.js';

const W = 12, D = 7, H = 3.4;

export default function build(ctx) {
  const { scene, player, interactions, dialogue, quotes } = ctx;

  scene.background = new THREE.Color(0x05070f);
  scene.fog = new THREE.Fog(0x0a0e1c, 6, 26);

  buildRoom(scene, {
    w: W, d: D, h: H,
    floorMat: mat(0x39322a, { roughness: 0.7 }),
    wallMat: mat(0x49545f),
    ceilMat: mat(0x303a45),
  });

  // lighting: cool moonlight through the window + one dim warm lamp
  scene.add(new THREE.AmbientLight(0x5a6e94, 4));
  const fill = new THREE.PointLight(0x8aa3cc, 8, 18, 1.6);
  fill.position.set(0, 2.7, 0.8);
  scene.add(fill);
  const moon = new THREE.SpotLight(0xa9c4ee, 70, 26, 0.8, 0.6, 1.4);
  moon.position.set(0.4, 2.9, -3.15);
  moon.target.position.set(0, 0.4, 2.5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  scene.add(moon, moon.target);
  const lamp = new THREE.PointLight(0xffd9a0, 6, 8, 1.8);
  lamp.position.set(4.6, 1.1, -2.2);
  scene.add(lamp);

  // ---- the great window on the back wall ----
  const win = new THREE.Group();
  const skyTex = canvasTex(256, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a1430');
    grad.addColorStop(0.65, '#13234e');
    grad.addColorStop(1, '#0a1226');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 26; i++) {
      g.globalAlpha = 0.25 + Math.random() * 0.6;
      g.fillRect(Math.random() * w, Math.random() * h * 0.7, 1.6, 1.6);
    }
    g.globalAlpha = 1;
    const mg = g.createRadialGradient(w * 0.7, h * 0.25, 4, w * 0.7, h * 0.25, 44);
    mg.addColorStop(0, 'rgba(235,242,255,1)');
    mg.addColorStop(0.32, 'rgba(220,232,255,0.95)');
    mg.addColorStop(0.4, 'rgba(170,195,240,0.25)');
    mg.addColorStop(1, 'rgba(170,195,240,0)');
    g.fillStyle = mg;
    g.beginPath(); g.arc(w * 0.7, h * 0.25, 44, 0, Math.PI * 2); g.fill();
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ map: skyTex }));
  win.add(sky);
  const frameM = mat(0x1f2630, { roughness: 0.5 });
  win.add(box(3.4, 0.1, 0.08, frameM, 0, 1.15, 0.02));
  win.add(box(3.4, 0.1, 0.08, frameM, 0, -1.15, 0.02));
  win.add(box(0.1, 2.4, 0.08, frameM, -1.7, 0, 0.02));
  win.add(box(0.1, 2.4, 0.08, frameM, 1.7, 0, 0.02));
  win.add(box(0.07, 2.3, 0.06, frameM, 0, 0, 0.02));
  win.add(box(3.3, 0.07, 0.06, frameM, 0, 0, 0.02));
  win.position.set(0, 1.75, -D / 2 + 0.04);
  scene.add(win);

  // ---- furniture ----
  const table = new THREE.Group();
  const tw = mat(0x4a3a28, { roughness: 0.6 });
  table.add(box(1.5, 0.07, 0.9, tw, 0, 0.74, 0));
  for (const [lx, lz] of [[-0.66, -0.36], [0.66, -0.36], [-0.66, 0.36], [0.66, 0.36]])
    table.add(box(0.07, 0.74, 0.07, tw, lx, 0.37, lz));
  table.position.set(-2.1, 0, 0.2);
  scene.add(table);

  const notice = box(0.26, 0.012, 0.36, mat(0xe9e2cf, { roughness: 0.9 }), -2.0, 0.785, 0.2);
  notice.rotation.y = 0.4;
  scene.add(notice);

  // sofa along the right wall
  const sofa = new THREE.Group();
  const sm = mat(0x2f3a4a, { roughness: 0.95 });
  sofa.add(box(0.9, 0.42, 2.4, sm, 0, 0.21, 0));
  sofa.add(box(0.28, 0.95, 2.4, sm, 0.38, 0.48, 0));
  sofa.add(box(0.85, 0.3, 0.3, sm, 0, 0.56, -1.3));
  sofa.add(box(0.85, 0.3, 0.3, sm, 0, 0.56, 1.3));
  sofa.position.set(5.3, 0, -1.6);
  scene.add(sofa);
  // small lamp table beside it
  scene.add(cyl(0.26, 0.3, 0.55, mat(0x3c3026), 4.7, 0.275, -2.9));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
  bulb.position.set(4.7, 0.72, -2.9);
  scene.add(bulb);

  const mirror = makeMirror(0.9, 1.5, 0x2a313c);
  mirror.position.set(-W / 2 + 0.06, 1.55, -0.6);
  mirror.rotation.y = Math.PI / 2;
  scene.add(mirror);

  const suitcase = new THREE.Group();
  const scm = mat(0x6e4f33, { roughness: 0.65 });
  suitcase.add(box(0.72, 0.5, 0.24, scm, 0, 0.25, 0));
  suitcase.add(box(0.2, 0.05, 0.05, mat(0x3a2c1c), 0, 0.53, 0));
  suitcase.position.set(2.6, 0, 2.9);
  suitcase.rotation.y = -0.5;
  scene.add(suitcase);

  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ---- player ----
  player.setArea(
    { minX: -W / 2 + 0.2, maxX: W / 2 - 0.2, minZ: -D / 2 + 0.2, maxZ: D / 2 - 0.2 },
    [
      { minX: -2.9, maxX: -1.3, minZ: -0.3, maxZ: 0.7 },   // table
      { minX: 4.5, maxX: 6, minZ: -3.3, maxZ: -0.2 },      // sofa + lamp
    ]
  );
  player.setPose(0, 2.5, 0);

  // ---- objectives / tasks ----
  ctx.setObjective('Explore the house and begin David’s memory.');
  const tasks = taskTracker(
    ['mirror', 'suitcase', 'notice', 'window', 'q1'],
    (k, remaining) => {
      const left = [...remaining];
      if (left.every((x) => x.startsWith('q'))) ctx.setObjective('Collect the remaining glowing evidence cards.');
    },
    () => ctx.complete('To understand this night, I must go back to the beginning — to my father’s house, years ago, in America.', {
      q: 'The whole story is told while David waits through one night. What is set to happen at dawn in Paris?',
      options: ['Giovanni will be executed', 'David will sail home to America', 'Hella will arrive by train'],
      correct: 0,
      why: 'Right. The memory is framed by Giovanni’s execution at dawn — the cost of David’s choices hangs over everything.',
      hint: 'Look again at the execution notice you read on the table.',
    })
  );

  const monologue = (lines, key) => () =>
    dialogue.start(lines.map((text) => ({ speaker: null, text })), () => tasks.done(key));

  interactions.add({
    object: mirror, prompt: 'Examine the mirror',
    onInteract: monologue([
      'My reflection in the dark glass. Tall, fair — people say I look like a man who has nothing to hide.',
      'They are wrong.',
    ], 'mirror'),
  });
  interactions.add({
    object: suitcase, prompt: 'Examine Hella’s suitcase',
    onInteract: monologue([
      'One of Hella’s cases, left behind. She has already sailed for America.',
      'The empty suitcase makes the room feel final: Hella is gone, and I am alone with what I refused to say.',
    ], 'suitcase'),
  });
  interactions.add({
    object: notice, prompt: 'Read the execution notice',
    onInteract: monologue([
      'The official notice is clear: Giovanni’s appeal was refused.',
      'At dawn in Paris, Giovanni will be executed. The paper says it calmly. I cannot read it calmly.',
    ], 'notice'),
  });
  interactions.add({
    object: win, prompt: 'Look out the window',
    onInteract: monologue([
      'Beyond the glass the night is moving, slowly, toward the most terrible morning of my life.',
      'I keep watching it come, the way you watch a wave you cannot outrun.',
    ], 'window'),
  });

  quotes.spawn(ctx, 'q1', new THREE.Vector3(1.5, 1.35, -2.5), () => tasks.done('q1'));

  // intro line
  dialogue.start([
    { speaker: null, text: 'The south of France. Night. Hella is gone, and somewhere in Paris a cell door is waiting for the morning.' },
    { speaker: null, text: 'I am David. This house is full of things I cannot stop looking at.' },
  ]);
}

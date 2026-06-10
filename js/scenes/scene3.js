// Scene 3 — Guillaume's bar in Paris. Warm amber light, lively but slightly seedy.
import * as THREE from 'three';
import { mat, box, cyl, buildRoom, taskTracker, makeDust } from '../env.js';
import { createCharacter, PALETTES } from '../characters.js';

const W = 14, D = 9, H = 3.6;
const DAVID = '#7da7c4';

export default function build(ctx) {
  const { scene, player, interactions, dialogue, quotes } = ctx;

  scene.background = new THREE.Color(0x140b06);
  scene.fog = new THREE.Fog(0x1c1008, 5, 26);

  buildRoom(scene, {
    w: W, d: D, h: H,
    floorMat: mat(0x3a2a1c, { roughness: 0.6 }),
    wallMat: mat(0x57301d),
    ceilMat: mat(0x2a190f),
  });

  scene.add(new THREE.AmbientLight(0x7a4f28, 0.85));

  // hanging lights (center one casts shadow)
  for (const [x, z, shadow] of [[-3.6, 0.4, false], [0, -0.6, true], [3.6, 0.4, false]]) {
    const cord = cyl(0.012, 0.012, 0.9, mat(0x1a120a), x, H - 0.45, z);
    const shade = cyl(0.16, 0.3, 0.22, mat(0x6e4424, { roughness: 0.5 }), x, H - 0.95, z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
    bulb.position.set(x, H - 1.05, z);
    const light = new THREE.PointLight(0xffb966, 16, 12, 1.8);
    light.position.set(x, H - 1.12, z);
    if (shadow) { light.castShadow = true; light.shadow.mapSize.set(1024, 1024); }
    scene.add(cord, shade, bulb, light);
  }

  // red-lit back corner (the seedy end of the room)
  const redWash = new THREE.PointLight(0xff3a26, 10, 9, 1.8);
  redWash.position.set(6.3, 2.1, 1.5);
  scene.add(redWash);

  // ---- bar counter ----
  const counter = new THREE.Group();
  const cm = mat(0x4e3018, { roughness: 0.45 });
  counter.add(box(7.4, 1.05, 0.74, cm, 0, 0.525, 0));
  counter.add(box(7.7, 0.06, 0.9, mat(0x6b4a26, { roughness: 0.3, metalness: 0.15 }), 0, 1.07, 0));
  counter.position.set(0, 0, -2.4);
  scene.add(counter);

  // bottle shelf on the back wall
  const shelf = new THREE.Group();
  shelf.add(box(6.4, 0.06, 0.3, mat(0x3a2412), 0, 1.45, 0));
  shelf.add(box(6.4, 0.06, 0.3, mat(0x3a2412), 0, 2.05, 0));
  const bottleColors = [0x7fb069, 0xc8842e, 0x9c2f2f, 0x4a7a8c, 0xc4a13c, 0x6a4a8c, 0x8c5a2f, 0x4f7a4a];
  for (let i = 0; i < 16; i++) {
    const cI = bottleColors[i % bottleColors.length];
    const b = cyl(0.05, 0.06, 0.34, mat(cI, { transparent: true, opacity: 0.88, roughness: 0.15, emissive: cI, emissiveIntensity: 0.12 }),
      -2.9 + (i % 8) * 0.83 + (Math.random() - 0.5) * 0.1, (i < 8 ? 1.45 : 2.05) + 0.2, 0);
    b.add(cyl(0.016, 0.016, 0.12, mat(cI, { transparent: true, opacity: 0.88 }), 0, 0.22, 0));
    shelf.add(b);
  }
  shelf.position.set(0, 0, -D / 2 + 0.2);
  scene.add(shelf);

  // stools
  for (const x of [-2.6, -1.1, 0.4, 1.9]) {
    const stool = new THREE.Group();
    stool.add(cyl(0.05, 0.07, 0.62, mat(0x2c1c0e), 0, 0.31, 0));
    stool.add(cyl(0.2, 0.2, 0.07, mat(0x7a3a2a, { roughness: 0.7 }), 0, 0.66, 0));
    stool.position.set(x, 0, -1.55);
    scene.add(stool);
  }

  // round tables with chairs
  const tablePos = [[-4.3, 1.6], [3.9, 2.0]];
  for (const [x, z] of tablePos) {
    const t = new THREE.Group();
    t.add(cyl(0.55, 0.55, 0.05, mat(0x4e3018, { roughness: 0.5 }), 0, 0.78, 0));
    t.add(cyl(0.05, 0.09, 0.78, mat(0x2c1c0e), 0, 0.39, 0));
    for (const a of [0.6, 2.4, 4.2]) {
      const ch = new THREE.Group();
      ch.add(box(0.36, 0.05, 0.36, mat(0x3a2412), 0, 0.45, 0));
      ch.add(box(0.36, 0.5, 0.05, mat(0x3a2412), 0, 0.72, -0.16));
      ch.position.set(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95);
      ch.rotation.y = -a + Math.PI / 2;
      t.add(ch);
    }
    t.position.set(x, 0, z);
    scene.add(t);
  }
  // glasses of wine on Jacques' table
  const wine = cyl(0.04, 0.03, 0.13, mat(0x7a1a22, { transparent: true, opacity: 0.9, emissive: 0x5a0d14, emissiveIntensity: 0.3 }), -4.15, 0.87, 1.5);
  scene.add(wine);

  ctx.addAnimated(makeDust(160, { w: W - 1, h: H - 0.4, d: D - 1 }));

  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ---- characters ----
  const jacques = createCharacter('Jacques', 'jacques');
  jacques.position.set(-3.4, 0, 1.0);
  jacques.rotation.y = 2.3;
  ctx.addAnimated(jacques);

  const guillaume = createCharacter('Guillaume', 'guillaume');
  guillaume.position.set(-1.6, 0, -3.2);
  guillaume.rotation.y = 0.15;
  ctx.addAnimated(guillaume);

  const giovanni = createCharacter('Giovanni', 'giovanni');
  giovanni.position.set(1.6, 0, -3.2);
  giovanni.rotation.y = -0.15;
  ctx.addAnimated(giovanni);

  // ---- player ----
  player.setArea(
    { minX: -W / 2 + 0.25, maxX: W / 2 - 0.25, minZ: -1.45, maxZ: D / 2 - 0.25 },
    [
      { minX: -5.3, maxX: -3.3, minZ: 0.6, maxZ: 2.6 },  // Jacques' table
      { minX: 2.9, maxX: 4.9, minZ: 1.0, maxZ: 3.0 },    // second table
    ]
  );
  player.setPose(0.4, 3.4, 4);

  // ---- objectives / tasks ----
  ctx.setObjective('Meet Jacques, hear out Guillaume \u2014 then talk to Giovanni at the bar.');
  const tasks = taskTracker(
    ['jacques', 'guillaume', 'giovanni', 'q5', 'q6'],
    (k, remaining) => {
      const left = [...remaining];
      if (left.every((x) => x.startsWith('q'))) ctx.setObjective('Collect the remaining glowing quote cards.');
      else if (!left.includes('jacques') && !left.includes('guillaume') && left.includes('giovanni'))
        ctx.setObjective('Talk to Giovanni at the bar.');
    },
    () => ctx.complete('We talked until the bar emptied and the sky went grey over Les Halles. And when Giovanni asked if I was coming with him \u2014 I went.')
  );

  const J = { speaker: 'Jacques', color: PALETTES.jacques.accent };
  const GU = { speaker: 'Guillaume', color: PALETTES.guillaume.accent };
  const G = { speaker: 'Giovanni', color: PALETTES.giovanni.accent };

  interactions.add({
    object: jacques, prompt: 'Talk to Jacques',
    onInteract: () => {
      dialogue.start([
        { ...J, text: 'Ah, David. Alone again? Come, stand me a drink \u2014 or I shall stand you one, which is more likely.' },
        { ...J, text: 'You watch that new barman, Giovanni, the way a man watches a fire in winter. Don\u2019t look alarmed \u2014 I am old, not blind.' },
        { ...J, text: 'Listen to me, just once. You can have something real, if you are not ashamed of it. Love him, and let him love you. Do you think anything else under heaven really matters?' },
        { ...J, text: 'But if you are ashamed \u2014 if you insist on playing it safe \u2014 you will end up locked away in your own dirty body, forever and forever, having loved no one.' },
        { speaker: null, text: 'I wanted to laugh at him. I could not quite manage it.' },
        { ...J, text: 'Go. Talk to him. The morning is still a long way off.' },
      ], () => tasks.done('jacques'));
    },
  });

  interactions.add({
    object: guillaume, prompt: 'Listen to Guillaume',
    onInteract: () => {
      dialogue.start([
        { speaker: null, text: 'The owner drifts along the counter, smiling at everyone and meaning none of it.' },
        { ...GU, text: 'Well, well. A new face, monopolising my new barman. Enjoy yourself, mon cher \u2014 in my bar everyone is watched, and everyone, sooner or later, is for sale.' },
        { speaker: null, text: 'There is something greasy in his smile. Giovanni despises him; I suspect everyone does.' },
      ], () => tasks.done('guillaume'));
    },
  });

  interactions.add({
    object: giovanni, prompt: 'Talk to Giovanni',
    onInteract: () => {
      if (tasks.has('jacques') || tasks.has('guillaume')) {
        dialogue.start([{ speaker: null, text: 'Not yet. Jacques is waving me over \u2014 and the owner is already watching me.' }]);
        return;
      }
      dialogue.start([
        { ...G, text: 'You are American? Don\u2019t look so surprised \u2014 only Americans order cognac as if it might explode.' },
        { speaker: 'David', color: DAVID, text: 'Is it that obvious?' },
        {
          ...G, text: 'Completely. So \u2014 how long have you been in Paris? Are you happy here?',
          choices: [
            {
              label: '\u201CI don\u2019t know. I came here to find myself \u2014 that\u2019s what I tell people.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'I don\u2019t know. I came here to find myself \u2014 that\u2019s what I tell people.' },
                { ...G, text: 'To find yourself! Then you admit you were lost. That is more honesty than most people manage by daylight. I like you better already.' },
              ],
            },
            {
              label: '\u201CHappy? Sure. It\u2019s a beautiful city.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'Happy? Sure. I mean \u2014 it\u2019s a beautiful city.' },
                { ...G, text: 'You say \u201cbeautiful city\u201D the way a schoolboy recites a lesson. Paris does not care if you flatter her, my friend.' },
              ],
            },
            {
              label: '\u201CThat\u2019s a strange question for a barman.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'That\u2019s a strange question for a barman.' },
                { ...G, text: 'A barman hears more truth than a priest. But forgive me \u2014 Americans do not like questions with insides.' },
              ],
            },
          ],
        },
        {
          ...G, text: 'You Americans are funny. You think time is a road you drive on \u2014 always forward, always faster. As if enough motion could outrun feeling.',
          choices: [
            {
              label: '\u201CMaybe we\u2019re afraid of what happens if we stop.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'Maybe we\u2019re afraid of what happens if we stop.' },
                { ...G, text: 'Ah! Now you sound like a man, and not a passport. Stay. Talk with me until the customers give up.' },
              ],
            },
            {
              label: '\u201CWe just like to be on time.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'We just like to be on time.' },
                { ...G, text: 'On time! For what? Listen \u2014 stay a while. The night is young, and you are already late for nothing.' },
              ],
            },
            {
              label: '\u201CAnd you Europeans think talking is living.\u201D',
              lines: [
                { speaker: 'David', color: DAVID, text: 'And you Europeans think talking is living.' },
                { ...G, text: 'But of course it is. What else would living be \u2014 banking? Stay, and argue with me properly.' },
              ],
            },
          ],
        },
        { speaker: null, text: 'Everyone in the bar seemed very far away, as if the two of us stood inside a lit window and the rest of the world was street.' },
      ], () => tasks.done('giovanni'));
    },
  });

  quotes.spawn(ctx, 'q5', new THREE.Vector3(-5.2, 1.4, 2.9), () => tasks.done('q5'));
  quotes.spawn(ctx, 'q6', new THREE.Vector3(3.1, 1.45, -1.1), () => tasks.done('q6'));
}

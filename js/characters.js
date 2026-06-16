// Character loading: real rigged 3D models (glTF / FBX / GLB) with idle
// animation, normalized scale, floating name label, and a gentle procedural
// "alive" pass for models that ship without animation clips.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { canvasTex } from './env.js';

// Accent colors are still used by the dialogue system, so keep this export.
export const PALETTES = {
  giovanni:  { accent: '#d96a4a' },
  hella:     { accent: '#e8d590' },
  father:    { accent: '#8fa3c8' },
  jacques:   { accent: '#a98bc4' },
  guillaume: { accent: '#9c6b94' },
};

// Source files the user provided in /3models, with a target standing height
// (metres) so every figure ends up consistent regardless of source units.
const MODELS = {
  giovanni:  { url: '3models/Giovanni.gltf', kind: 'gltf', height: 1.78 },
  hella:     { url: '3models/Hella.gltf',    kind: 'gltf', height: 1.68 },
  father:    { url: '3models/Father.fbx',    kind: 'fbx',  height: 1.80 },
  jacques:   { url: '3models/Jacques.fbx',   kind: 'fbx',  height: 1.74 },
  guillaume: { url: '3models/Guillaume.glb', kind: 'gltf', height: 1.77 },
  david:     { url: '3models/David.fbx',     kind: 'fbx',  height: 1.80 },
};

// ---- shared, cached loading ------------------------------------------------
const _gltf = new GLTFLoader();
const _fbx = new FBXLoader();
const _cache = new Map(); // url -> Promise<{ root, animations }>
const LOW_POWER =
  navigator.hardwareConcurrency <= 4 ||
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function loadSource(cfg) {
  if (_cache.has(cfg.url)) return _cache.get(cfg.url);
  const p = new Promise((resolve, reject) => {
    if (cfg.kind === 'fbx') {
      _fbx.load(cfg.url, (obj) => resolve({ root: obj, animations: obj.animations || [] }), undefined, reject);
    } else {
      _gltf.load(cfg.url, (g) => resolve({ root: g.scene, animations: g.animations || [] }), undefined, reject);
    }
  });
  _cache.set(cfg.url, p);
  return p;
}

function scheduleIdle(fn) {
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 1200 });
  else setTimeout(fn, 120);
}

// Warm the cache without parsing every rig at the same instant. Starting all
// six FBX/glTF loads together made the title screen and first interaction hitch
// badly on slower machines.
export function preloadCharacters() {
  const queue = ['david', 'giovanni', 'hella', 'father', 'jacques', 'guillaume']
    .map((key) => MODELS[key]);
  const pump = () => {
    const cfg = queue.shift();
    if (!cfg) return;
    loadSource(cfg)
      .catch((err) => console.warn('Preload failed:', cfg.url, err))
      .finally(() => scheduleIdle(pump));
  };
  scheduleIdle(pump);
}

// Soften imported materials so a figure reads as a person under any light.
// Raw exported materials are often shiny/metallic (or carry a stark white
// emissive), which makes the moonlit faces blow out into a "skull" look. We
// pull metalness down, roughness up, and clamp any specular/emissive highlight.
function humanizeMaterials(model) {
  model.traverse((o) => {
    if (!o.isMesh && !o.isSkinnedMesh) return;
    if (o.geometry) o.geometry.userData.shared = true;
    if (o.material) {
      o.material = Array.isArray(o.material)
        ? o.material.map((m) => (m ? m.clone() : m))
        : o.material.clone();
    }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m) continue;
      if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0, 0.05);
      if ('roughness' in m) m.roughness = Math.max(m.roughness ?? 0.5, 0.78);
      if ('envMapIntensity' in m) m.envMapIntensity = 0.25;
      // kill any baked-in glow that exaggerates highlights
      if (m.emissive && m.emissive.getHex && m.emissive.getHex() !== 0x000000 && !m.emissiveMap) {
        m.emissive.multiplyScalar(0.15);
      }
      // legacy Phong/Lambert specular
      if (m.specular && m.specular.setScalar) m.specular.setScalar(0.04);
      if ('shininess' in m) m.shininess = Math.min(m.shininess ?? 30, 12);
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap']) {
        if (m[key]) m[key].userData.shared = true;
      }
      m.needsUpdate = true;
    }
  });
}

// World-space AABB of a model's skeleton bones (null if it has no skinned mesh).
// For some exported rigs (e.g. Sketchfab models with cm-scale skeletons) the
// mesh is driven by bones that are far larger than the bind-pose geometry, so
// the geometry box badly underestimates the rendered size. The bone box is the
// reliable reference in that case.
function boneBox(model) {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  let found = false;
  model.traverse((o) => {
    if (o.isSkinnedMesh && o.skeleton) {
      for (const b of o.skeleton.bones) { b.getWorldPosition(v); box.expandByPoint(v); found = true; }
    }
  });
  return found ? box : null;
}

function normalize(model, targetHeight) {
  model.updateWorldMatrix(true, true);
  const geoBox = new THREE.Box3().setFromObject(model);
  const geoSize = geoBox.getSize(new THREE.Vector3());

  // Pick the trustworthy reference box: if the bones are wildly larger (or
  // smaller) than the geometry bind pose, the rendered figure follows the bones.
  const bBox = boneBox(model);
  let ref = geoBox;
  if (bBox) {
    const bs = bBox.getSize(new THREE.Vector3());
    if (bs.y > geoSize.y * 1.5 || geoSize.y > bs.y * 1.5) ref = bBox;
  }

  const s = targetHeight / (ref.getSize(new THREE.Vector3()).y || 1);
  model.scale.setScalar(s);
  model.updateWorldMatrix(true, true);

  // Re-measure with the same reference type for centering + floor placement.
  const placed = ref === bBox ? boneBox(model) : new THREE.Box3().setFromObject(model);
  const center = placed.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= placed.min.y; // feet on the floor
}

function makeLabel(name, accent) {
  const tex = canvasTex(512, 140, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = 'italic 52px Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.strokeStyle = accent;
    g.globalAlpha = 0.5; g.lineWidth = 2;
    g.beginPath(); g.moveTo(w * 0.32, h * 0.74); g.lineTo(w * 0.68, h * 0.74); g.stroke();
    g.globalAlpha = 1;
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16;
    g.fillStyle = accent;
    g.fillText(name, w / 2, h * 0.42);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(1.25, 0.34, 1);
  return sprite;
}

// ---- main entry ------------------------------------------------------------
// Returns a Group immediately; the model streams in and is parented when ready.
export function createCharacter(name, paletteKey) {
  const cfg = MODELS[paletteKey];
  const accent = (PALETTES[paletteKey] || {}).accent || '#d9a441';
  const root = new THREE.Group();
  root.name = name;

  const label = makeLabel(name, accent);
  label.position.y = (cfg ? cfg.height : 1.7) + 0.22;
  root.add(label);

  // soft contact shadow so the figure feels grounded before/while it loads
  const blobTex = canvasTex(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.02;
  root.add(blob);

  const holder = new THREE.Group(); // procedural "alive" motions live here
  root.add(holder);

  // Invisible interaction proxy: a body-sized box added up-front so the
  // raycast-based prompt works immediately and reliably, independent of when
  // (or how) the rigged/skinned model streams in. colorWrite:false keeps it
  // unseen while still being hit-testable.
  const targetH = cfg ? cfg.height : 1.7;
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, targetH, 0.55),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
  );
  proxy.position.y = targetH / 2;
  proxy.userData.isProxy = true;
  root.add(proxy);

  const phase = Math.random() * Math.PI * 2;
  let mixer = null;
  let model = null;
  let animated = false;
  let animAcc = 0;
  const animStep = LOW_POWER ? 1 / 24 : 1 / 40;

  if (cfg) {
    loadSource(cfg).then((src) => {
      model = cloneSkinned(src.root);
      normalize(model, cfg.height);
      humanizeMaterials(model);
      model.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) {
          o.castShadow = false;
          o.receiveShadow = true;
          o.frustumCulled = false; // skinned bounds can be wrong otherwise
        }
      });
      holder.add(model);

      if (src.animations && src.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        const idle = src.animations.find((a) => /idle/i.test(a.name)) || src.animations[0];
        const action = mixer.clipAction(idle);
        action.play();
        action.time = Math.random() * (idle.duration || 1); // desync crowds
        animated = true;
      }
    }).catch((err) => {
      console.error('Character model failed to load:', cfg.url, err);
    });
  }

  root.userData.update = (dt, t) => {
    animAcc += dt;
    if (mixer && animAcc >= animStep) {
      mixer.update(animAcc);
      animAcc = 0;
    }
    if (!model) return;
    const tt = t + phase;
    if (animated) {
      // a light additive layer on top of the skeletal idle: a slow weight
      // shift and the faintest sway, so rigged figures feel less "on rails"
      holder.position.y = Math.sin(tt * 1.1) * 0.006;
      holder.rotation.y = Math.sin(tt * 0.22) * 0.025;
      holder.rotation.z = Math.sin(tt * 0.32) * 0.006;
    } else {
      // fuller hand-tuned breath + weight shift for an unrigged figure
      holder.rotation.z = Math.sin(tt * 0.5) * 0.02;
      holder.position.y = (Math.sin(tt * 1.4) * 0.5 + 0.5) * 0.014;
      holder.rotation.y = Math.sin(tt * 0.3) * 0.07;
      holder.rotation.x = Math.sin(tt * 0.9) * 0.008;
    }
  };

  return root;
}

// David, the player's own body, used only in third-person camera views. No name
// label or interaction proxy; blends Idle/Walk based on whether the player moves.
export function createAvatar() {
  const cfg = MODELS.david;
  const root = new THREE.Group();
  root.userData.keep = true; // survive scene swaps (see SceneManager._dispose)

  let mixer = null, idleA = null, moveA = null, model = null, moving = false;
  let holder = null, hasClips = false, t = 0, bob = 0;
  loadSource(cfg).then((src) => {
    model = cloneSkinned(src.root);
    normalize(model, cfg.height);
    humanizeMaterials(model);
    model.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = false;
        o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    holder = new THREE.Group();
    holder.add(model);
    root.add(holder);
    if (src.animations && src.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      const idle = src.animations.find((a) => /idle/i.test(a.name)) || src.animations[0];
      const walk = src.animations.find((a) => /walk|run/i.test(a.name));
      idleA = mixer.clipAction(idle); idleA.play();
      if (walk) { moveA = mixer.clipAction(walk); moveA.play(); moveA.setEffectiveWeight(0); }
      hasClips = true;
    }
  }).catch((err) => console.error('Avatar model failed to load:', cfg.url, err));

  return {
    object: root,
    setMoving(m) { moving = m; },
    update(dt) {
      t += dt;
      if (mixer) mixer.update(dt);
      if (moveA && idleA) {
        const w = THREE.MathUtils.clamp(moveA.getEffectiveWeight() + (moving ? 1 : -1) * dt * 6, 0, 1);
        moveA.setEffectiveWeight(w);
        idleA.setEffectiveWeight(1 - w);
      }
      if (!holder) return;
      // procedural life so David moves even if his clip lacks a walk: a
      // breathing sway when still, a stride bob + slight lean when walking
      const target = moving ? 1 : 0;
      bob += (target - bob) * Math.min(1, dt * 6);
      if (!hasClips || !moveA) {
        const stride = Math.sin(t * 9) * 0.05 * bob;
        holder.position.y = stride + (1 - bob) * Math.sin(t * 1.2) * 0.006;
        holder.rotation.x = -0.05 * bob;            // forward lean while moving
        holder.rotation.z = Math.sin(t * 4.5) * 0.03 * bob + (1 - bob) * Math.sin(t * 0.6) * 0.01;
      } else {
        holder.position.y = (1 - bob) * Math.sin(t * 1.2) * 0.005;
      }
    },
  };
}

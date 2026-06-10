// Shared environment helpers: materials, primitives, rooms, canvas textures.
import * as THREE from 'three';

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.04, ...opts });
}

export function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

export function cyl(rTop, rBottom, h, material, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), material);
  m.position.set(x, y, z);
  return m;
}

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Vertical gradient texture from color stops [[offset, css], ...]
export function gradientTex(stops, w = 4, h = 256) {
  return canvasTex(w, h, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    for (const [o, c] of stops) grad.addColorStop(o, c);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

// Simple interior: floor, ceiling, 4 walls. Returns group (already added to scene).
export function buildRoom(scene, { w, d, h, floorMat, wallMat, ceilMat }) {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat || wallMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = h;
  g.add(ceil);

  const mk = (ww, x, z, ry) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(ww, h), wallMat);
    wall.position.set(x, h / 2, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    g.add(wall);
    return wall;
  };
  g.userData.walls = {
    back: mk(w, 0, -d / 2, 0),          // faces +z
    front: mk(w, 0, d / 2, Math.PI),    // faces -z
    left: mk(d, -w / 2, 0, Math.PI / 2),
    right: mk(d, w / 2, 0, -Math.PI / 2),
  };
  scene.add(g);
  return g;
}

// Mirror panel: dark glass with a faint silhouette (no real reflections).
export function makeMirror(w, h, frameColor = 0x3a2c1c) {
  const group = new THREE.Group();
  const frame = box(w + 0.12, h + 0.12, 0.05, mat(frameColor, { roughness: 0.6 }));
  group.add(frame);
  const tex = canvasTex(128, 192, (g, cw, ch) => {
    const grad = g.createLinearGradient(0, 0, cw, ch);
    grad.addColorStop(0, '#2b3340');
    grad.addColorStop(0.5, '#465261');
    grad.addColorStop(1, '#222831');
    g.fillStyle = grad;
    g.fillRect(0, 0, cw, ch);
    // faint silhouette: head + shoulders
    g.fillStyle = 'rgba(15,18,24,0.55)';
    g.beginPath();
    g.ellipse(cw / 2, ch * 0.42, cw * 0.13, ch * 0.11, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(cw / 2, ch * 0.78, cw * 0.27, ch * 0.24, 0, 0, Math.PI * 2);
    g.fill();
    // sheen
    g.strokeStyle = 'rgba(255,255,255,0.10)';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(cw * 0.2, ch * 0.95);
    g.lineTo(cw * 0.75, ch * 0.05);
    g.stroke();
  });
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, metalness: 0.65 })
  );
  glass.position.z = 0.03;
  group.add(glass);
  return group;
}

// Track a set of required tasks; calls onDone when all complete.
export function taskTracker(keys, onTask, onDone) {
  const remaining = new Set(keys);
  return {
    remaining,
    has: (k) => remaining.has(k),
    done(k) {
      if (!remaining.has(k)) return;
      remaining.delete(k);
      if (onTask) onTask(k, remaining);
      if (remaining.size === 0 && onDone) onDone();
    },
  };
}

// Drifting dust motes inside a volume.
export function makeDust(count, vol, color = 0xffe2b0) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * vol.w;
    pos[i * 3 + 1] = Math.random() * vol.h;
    pos[i * 3 + 2] = (Math.random() - 0.5) * vol.d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color, size: 0.018, transparent: true, opacity: 0.45, depthWrite: false,
  }));
  pts.userData.update = (dt, t) => {
    const a = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      a.array[i * 3 + 1] -= dt * 0.05;
      a.array[i * 3] += Math.sin(t * 0.6 + i) * dt * 0.01;
      if (a.array[i * 3 + 1] < 0) a.array[i * 3 + 1] = vol.h;
    }
    a.needsUpdate = true;
  };
  return pts;
}

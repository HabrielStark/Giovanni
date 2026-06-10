// Stylized characters built from primitives, with canvas name labels and idle bob.
import * as THREE from 'three';
import { mat, cyl, canvasTex } from './env.js';

export const PALETTES = {
  giovanni:  { shirt: 0xa53e2e, pants: 0x4a3326, skin: 0xd9a577, hair: 0x231a12, accent: '#d96a4a' },
  hella:     { shirt: 0xe7d9a8, pants: 0xcabb8e, skin: 0xe8c3a0, hair: 0xc9a35a, accent: '#e8d590' },
  father:    { shirt: 0x4d6080, pants: 0x4a5058, skin: 0xddb491, hair: 0x9e9e9e, accent: '#8fa3c8' },
  jacques:   { shirt: 0x5d4470, pants: 0x2e4034, skin: 0xdfb695, hair: 0xb9b3a8, accent: '#a98bc4' },
  guillaume: { shirt: 0x4a2b45, pants: 0x2a2030, skin: 0xd9b08c, hair: 0x55483c, accent: '#9c6b94' },
};

function makeLabel(name, accent) {
  const tex = canvasTex(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = 'italic 52px Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.85)';
    g.shadowBlur = 14;
    g.fillStyle = accent;
    g.fillText(name, w / 2, h / 2);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(1.15, 0.29, 1);
  return sprite;
}

export function createCharacter(name, paletteKey) {
  const p = PALETTES[paletteKey];
  const g = new THREE.Group();

  const pants = mat(p.pants);
  const shirt = mat(p.shirt, { roughness: 0.8 });
  const skin = mat(p.skin, { roughness: 0.7 });
  const hair = mat(p.hair, { roughness: 0.95 });

  const legL = cyl(0.075, 0.085, 0.78, pants, -0.11, 0.39, 0);
  const legR = cyl(0.075, 0.085, 0.78, pants, 0.11, 0.39, 0);
  g.add(legL, legR);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.42, 6, 14), shirt);
  body.position.y = 1.07;
  g.add(body);

  const armL = cyl(0.055, 0.06, 0.62, shirt, -0.285, 1.08, 0);
  armL.rotation.z = 0.14;
  const armR = cyl(0.055, 0.06, 0.62, shirt, 0.285, 1.08, 0);
  armR.rotation.z = -0.14;
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), skin);
  handL.position.set(-0.33, 0.76, 0);
  const handR = handL.clone();
  handR.position.x = 0.33;
  g.add(armL, armR, handL, handR);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 14), skin);
  head.position.y = 1.62;
  g.add(head);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.162, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  cap.position.y = 1.645;
  g.add(cap);

  const label = makeLabel(name, p.accent);
  label.position.y = 2.06;
  g.add(label);

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  const phase = Math.random() * Math.PI * 2;
  g.userData.update = (dt, t) => {
    g.position.y = Math.sin(t * 1.3 + phase) * 0.018;
    g.rotation.z = Math.sin(t * 0.7 + phase) * 0.012;
  };
  return g;
}

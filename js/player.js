// First-person player: pointer-lock look, WASD/arrow movement, bounds + obstacle clamping, head bob.
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const SPEED = 2.5;
const RADIUS = 0.35;
const EYE = 1.6;
const SIT_EYE = 0.95;

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    this.enabled = true;
    this.keys = {};
    this.vel = new THREE.Vector2();
    this.bounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
    this.obstacles = [];
    this.bobTime = 0;
    this.eyeHeight = EYE;
    this.sitting = false;
    this.speed = 0;

    addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
  }

  setArea(bounds, obstacles = []) {
    this.bounds = bounds;
    this.obstacles = obstacles;
  }

  toggleSit() {
    this.sitting = !this.sitting;
    this.eyeHeight = this.sitting ? SIT_EYE : EYE;
    return this.sitting;
  }

  setPose(x, z, yawDeg = 0) {
    this.camera.position.set(x, this.eyeHeight, z);
    this.camera.rotation.set(0, THREE.MathUtils.degToRad(yawDeg), 0, 'YXZ');
    this.vel.set(0, 0);
  }

  tryLock() {
    try { this.controls.lock(); } catch (e) { /* shown via resume hint */ }
  }

  update(dt) {
    const k = this.keys;
    let fwd = 0, right = 0;
    if (this.enabled && this.controls.isLocked) {
      fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      right = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    }
    const len = Math.hypot(fwd, right) || 1;
    const damp = 1 - Math.exp(-12 * dt);
    this.vel.x += ((right / len) * SPEED - this.vel.x) * damp;
    this.vel.y += ((fwd / len) * SPEED - this.vel.y) * damp;

    this.controls.moveRight(this.vel.x * dt);
    this.controls.moveForward(this.vel.y * dt);

    const p = this.camera.position;
    const b = this.bounds;
    p.x = THREE.MathUtils.clamp(p.x, b.minX + RADIUS, b.maxX - RADIUS);
    p.z = THREE.MathUtils.clamp(p.z, b.minZ + RADIUS, b.maxZ - RADIUS);

    for (const o of this.obstacles) {
      const minX = o.minX - RADIUS, maxX = o.maxX + RADIUS;
      const minZ = o.minZ - RADIUS, maxZ = o.maxZ + RADIUS;
      if (p.x > minX && p.x < maxX && p.z > minZ && p.z < maxZ) {
        const dxl = p.x - minX, dxr = maxX - p.x;
        const dzl = p.z - minZ, dzr = maxZ - p.z;
        const m = Math.min(dxl, dxr, dzl, dzr);
        if (m === dxl) p.x = minX;
        else if (m === dxr) p.x = maxX;
        else if (m === dzl) p.z = minZ;
        else p.z = maxZ;
      }
    }

    // subtle head bob
    const speed = this.vel.length();
    this.speed = speed;
    if (speed > 0.4) {
      this.bobTime += dt * (4 + speed * 2.2);
      p.y = this.eyeHeight + Math.sin(this.bobTime) * 0.026;
    } else {
      p.y += (this.eyeHeight - p.y) * Math.min(1, dt * 6);
    }
  }
}

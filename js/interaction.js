// Center-screen raycast interaction: prompt + emissive highlight + E to trigger.
import * as THREE from 'three';

const REACH = 4.2;

export class InteractionSystem {
  constructor(camera, promptEl) {
    this.camera = camera;
    this.promptEl = promptEl;
    this.items = [];
    this.targets = [];
    this.targetObjects = [];
    this.objectToItem = new WeakMap();
    this.current = null;
    this.ray = new THREE.Raycaster();
    this.ray.far = REACH;
    this.nextScan = 0;
    this.viewDir = new THREE.Vector3();
    this.toItem = new THREE.Vector3();
    this.center = new THREE.Vector3();
    this.box = new THREE.Box3();
  }

  // item: { object, prompt, onInteract }
  add(item) {
    // clone materials so highlight never leaks across shared materials
    item.object.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive) o.material = o.material.clone();
    });
    const proxies = [];
    item.object.traverse((o) => { if (o.userData.isProxy) proxies.push(o); });
    if (!proxies.length) {
      const box = new THREE.Box3().setFromObject(item.object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      if (Number.isFinite(size.x) && size.lengthSq() > 0) {
        const proxy = new THREE.Mesh(
          new THREE.BoxGeometry(
            Math.max(size.x, 0.7),
            Math.max(size.y, 0.7),
            Math.max(size.z, 0.7)
          ),
          new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
        );
        item.object.worldToLocal(center);
        proxy.position.copy(center);
        proxy.userData.isProxy = true;
        item.object.add(proxy);
        proxies.push(proxy);
      }
    }
    item.hitObjects = proxies.length ? proxies : [item.object];
    this.items.push(item);
    for (const object of item.hitObjects) {
      this.targets.push({ object, item });
      this.targetObjects.push(object);
      this.objectToItem.set(object, item);
    }
    return item;
  }

  remove(item) {
    const i = this.items.indexOf(item);
    if (i >= 0) this.items.splice(i, 1);
    this.targets = this.targets.filter((target) => target.item !== item);
    this.targetObjects = this.targets.map((target) => target.object);
    if (this.current === item) this._setCurrent(null);
  }

  clear() {
    this._setCurrent(null);
    this.items = [];
    this.targets = [];
    this.targetObjects = [];
    this.objectToItem = new WeakMap();
  }

  update(active) {
    if (!active) { this._setCurrent(null); return; }
    const now = performance.now();
    if (now < this.nextScan) return;
    this.nextScan = now + 50;
    let found = this._findInViewCone();
    if (!found) {
      this.ray.setFromCamera({ x: 0, y: 0 }, this.camera);
      const hits = this.ray.intersectObjects(this.targetObjects, true);
      if (hits.length) {
        let o = hits[0].object;
        while (o && !found) {
          found = this.objectToItem.get(o) || null;
          o = o.parent;
        }
      }
    }
    this._setCurrent(found);
  }

  interact() {
    if (this.current) this.current.onInteract(this.current);
  }

  _setCurrent(item) {
    if (item === this.current) return;
    if (this.current) this._highlight(this.current.object, false);
    this.current = item;
    if (item) {
      this._highlight(item.object, true);
      this.promptEl.innerHTML = `<b>[E]</b> ${item.prompt}`;
      this.promptEl.classList.remove('hidden');
    } else {
      this.promptEl.classList.add('hidden');
    }
  }

  _findInViewCone() {
    this.camera.getWorldDirection(this.viewDir);
    let best = null;
    let bestScore = -Infinity;
    for (const item of this.items) {
      this.box.setFromObject(item.object);
      if (this.box.isEmpty()) continue;
      this.box.getCenter(this.center);
      this.toItem.copy(this.center).sub(this.camera.position);
      const dist = this.toItem.length();
      if (dist > REACH || dist < 0.05) continue;
      const dot = this.toItem.normalize().dot(this.viewDir);
      if (dot < 0.82) continue;
      const score = dot - dist * 0.035;
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
    return best;
  }

  _highlight(obj, on) {
    obj.traverse((o) => {
      if (!(o.isMesh && o.material && o.material.emissive)) return;
      if (on) {
        o.userData._em = o.material.emissive.getHex();
        o.userData._emi = o.material.emissiveIntensity;
        o.material.emissive.setHex(0x8a6a30);
        o.material.emissiveIntensity = Math.max(o.material.emissiveIntensity, 0.45);
      } else if (o.userData._em !== undefined) {
        o.material.emissive.setHex(o.userData._em);
        o.material.emissiveIntensity = o.userData._emi;
      }
    });
  }
}

// Center-screen raycast interaction: prompt + emissive highlight + E to trigger.
import * as THREE from 'three';

const REACH = 3.0;

export class InteractionSystem {
  constructor(camera, promptEl) {
    this.camera = camera;
    this.promptEl = promptEl;
    this.items = [];
    this.current = null;
    this.ray = new THREE.Raycaster();
    this.ray.far = REACH;
  }

  // item: { object, prompt, onInteract }
  add(item) {
    // clone materials so highlight never leaks across shared materials
    item.object.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive) o.material = o.material.clone();
    });
    this.items.push(item);
    return item;
  }

  remove(item) {
    const i = this.items.indexOf(item);
    if (i >= 0) this.items.splice(i, 1);
    if (this.current === item) this._setCurrent(null);
  }

  clear() {
    this._setCurrent(null);
    this.items = [];
  }

  update(active) {
    if (!active) { this._setCurrent(null); return; }
    this.ray.setFromCamera({ x: 0, y: 0 }, this.camera);
    const hits = this.ray.intersectObjects(this.items.map((i) => i.object), true);
    let found = null;
    if (hits.length) {
      let o = hits[0].object;
      while (o && !found) {
        found = this.items.find((i) => i.object === o) || null;
        o = o.parent;
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

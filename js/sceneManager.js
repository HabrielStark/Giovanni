// Builds scenes by index, disposes old resources, runs per-scene updatables.
import * as THREE from 'three';
import scene1 from './scenes/scene1.js';
import scene2 from './scenes/scene2.js';
import scene3 from './scenes/scene3.js';
import scene4 from './scenes/scene4.js';
import scene5 from './scenes/scene5.js';

const BUILDERS = [scene1, scene2, scene3, scene4, scene5];
export const SCENE_COUNT = BUILDERS.length;

export class SceneManager {
  constructor({ camera, player, interactions, dialogue, quotes, hud, flow }) {
    this.deps = { camera, player, interactions, dialogue, quotes, hud, flow };
    this.scene = null;
    this.index = -1;
    this.updatables = [];
    this.t = 0;
  }

  load(i) {
    this._dispose();
    this.deps.interactions.clear();
    this.updatables = [];
    this.scene = new THREE.Scene();
    this.index = i;

    const ctx = {
      THREE,
      scene: this.scene,
      camera: this.deps.camera,
      player: this.deps.player,
      interactions: this.deps.interactions,
      dialogue: this.deps.dialogue,
      quotes: this.deps.quotes,
      setObjective: this.deps.hud.setObjective,
      addUpdatable: (fn) => this.updatables.push(fn),
      addAnimated: (obj) => { this.scene.add(obj); if (obj.userData.update) this.updatables.push(obj.userData.update); },
      complete: (narration, quizData) => this.deps.flow.nextScene(narration, quizData),
      endGame: (cards, quizData) => this.deps.flow.endGame(cards, quizData),
    };
    BUILDERS[i](ctx);
  }

  update(dt) {
    this.t += dt;
    for (const fn of this.updatables) fn(dt, this.t);
  }

  _dispose() {
    if (!this.scene) return;
    // Detach persistent objects (e.g. the player avatar) so their shared
    // resources aren't disposed when the scene is torn down.
    const kept = [];
    this.scene.traverse((o) => { if (o.userData.keep) kept.push(o); });
    for (const k of kept) this.scene.remove(k);

    const disposeTexture = (tex) => {
      if (tex && tex.dispose && !tex.userData?.shared) tex.dispose();
    };
    const disposeMaterial = (m) => {
      if (!m) return;
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap']) {
        disposeTexture(m[key]);
      }
      m.dispose();
    };

    this.scene.traverse((o) => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) disposeMaterial(m);
      }
    });
    disposeTexture(this.scene.background);
    this.scene = null;
  }
}

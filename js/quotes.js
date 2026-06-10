// Quote card data + collectible 3D cards + overlay + journal.
// Citation rule: page numbers are never invented — every card states the edition note.
import * as THREE from 'three';

const PAGE_NOTE = 'Page number depends on edition';

export const QUOTES = {
  q1: {
    kind: 'Paraphrase',
    text: 'Watching his reflection in the darkening windowpane, David thinks that people say he looks like a man with nothing to hide — and that they are wrong: his ordinary, trustworthy face conceals everything.',
    scene: 'Scene 1 — The House in the South of France',
    chapter: 'Part One, Chapter One',
    meaning: 'From the first page David\u2019s identity is split in two: an acceptable surface and a hidden self. The whole novel measures the cost of that concealment.',
  },
  q2: {
    kind: 'Paraphrase',
    text: 'The whole story is told in a single night: David waits alone in a rented house in the south of France, and at dawn, in Paris, Giovanni will be executed by the guillotine.',
    scene: 'Scene 1 — The House in the South of France',
    chapter: 'Part One, Chapter One',
    meaning: 'Baldwin frames the memory with its consequence. Before the story even \u201cbegins,\u201d David\u2019s refusal to express his true self has already cost a life.',
  },
  q3: {
    kind: 'Paraphrase',
    text: 'As a teenager in Brooklyn, David spends one tender night with his friend Joey — and wakes up ashamed, terrified of what such love would make him. He mocks Joey, drives him away, and begins a flight from himself that lasts for years.',
    scene: 'Scene 2 — Childhood Memory: Father',
    chapter: 'Part One, Chapter One',
    meaning: 'Shame teaches David his first lesson: that his real feelings must be punished and buried. It is the original wound of his hidden identity.',
  },
  q4: {
    kind: 'Paraphrase',
    text: 'David\u2019s father insists that all he wants is for his son to grow up to be a real man — and by \u201ca man\u201d he certainly does not mean a Sunday-school teacher. Yet he never once asks who David actually is.',
    scene: 'Scene 2 — Childhood Memory: Father',
    chapter: 'Part One, Chapter One',
    meaning: 'Manhood, in David\u2019s home, is a performance to be delivered, not an identity to be discovered. The pressure to act a part follows David across the ocean.',
  },
  q5: {
    kind: 'Paraphrase',
    text: 'Jacques tells David he can love Giovanni and let Giovanni love him — that nothing else under heaven really matters — but warns that if David is ashamed and insists on playing it safe, he will end up locked away in his own dirty body, forever, having loved no one.',
    scene: 'Scene 3 — Guillaume\u2019s Bar',
    chapter: 'Part One, Chapter Three',
    meaning: 'Jacques names the novel\u2019s central choice: love expressed without shame can ennoble, but love denied out of shame imprisons. David hears the warning — and ignores it.',
  },
  q6: {
    kind: 'Paraphrase',
    text: 'From the moment David sees Giovanni behind the bar — dark, confident, magnetic — the evening sharpens. Talking with him feels like a light switched on in a dim room, and David\u2019s careful, managed self begins to slip.',
    scene: 'Scene 3 — Guillaume\u2019s Bar',
    chapter: 'Part One, Chapter Two',
    meaning: 'Genuine feeling arrives like illumination: with Giovanni, David briefly stops performing. The meeting shows the self David could express — and will spend the novel running from.',
  },
  q7: {
    kind: 'Paraphrase',
    text: 'David remembers that life in Giovanni\u2019s room seemed to be happening beneath the sea: time flowed past indifferently above them, hours and days lost their meaning, and he felt a sea-change in himself — as if his very identity were being altered inside those four walls.',
    scene: 'Scene 4 — Giovanni\u2019s Room',
    chapter: 'Part Two, Chapter One',
    meaning: 'The room is the one place where David\u2019s true self surfaces — which is exactly why it terrifies him. Becoming himself feels to David like drowning.',
  },
  q8: {
    kind: 'Paraphrase',
    text: 'Giovanni has painted over the windowpanes, so the room admits only a milky, hidden light and no one can see in. The room keeps the world out — and keeps what happens inside it secret, like David\u2019s own heart.',
    scene: 'Scene 4 — Giovanni\u2019s Room',
    chapter: 'Part Two, Chapter Two',
    meaning: 'The whitened windows are the novel\u2019s image of the closet: love that must be hidden from the world slowly suffocates the people inside it.',
  },
  q9: {
    kind: 'Paraphrase',
    text: 'Hella comes back from Spain having decided she wants an ordinary, settled life — marriage, children, a place in the world defined by a husband — and David clings to her as proof that he can still be the man everyone expects.',
    scene: 'Scene 5 — Hella\u2019s Return',
    chapter: 'Part Two, Chapter Four',
    meaning: 'Hella stands for the safe, conventional future. David does not choose her out of love but out of fear — using her life as a shield against his own.',
  },
  q10: {
    kind: 'Paraphrase',
    text: 'On the morning of the execution, David tears up the blue envelope announcing Giovanni\u2019s death and steps out into the wind — and the wind blows some of the torn pieces back onto him.',
    scene: 'Scene 5 — The Choice',
    chapter: 'Part Two, Chapter Five',
    meaning: 'The novel\u2019s last image: guilt cannot be torn up and thrown away. The consequences of a denied identity return to David no matter how he tries to scatter them.',
  },
};

export const QUOTE_TOTAL = Object.keys(QUOTES).length;

export class QuoteSystem {
  constructor(els, hooks) {
    this.els = els;   // { overlay, kind, text, scene, chapter, page, meaning, close, count }
    this.hooks = hooks; // { onOpen, onClose }
    this.collected = [];
    this._onClose = null;
    els.close.addEventListener('click', () => this.closeOverlay());
  }

  get count() { return this.collected.length; }

  get overlayOpen() { return !this.els.overlay.classList.contains('hidden'); }

  // Spawn a floating golden card; ctx = scene context from sceneManager.
  spawn(ctx, id, pos, onCollected) {
    const group = new THREE.Group();
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0xd9a441, emissive: 0xb27322, emissiveIntensity: 0.85,
      metalness: 0.35, roughness: 0.35, side: THREE.DoubleSide,
    });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), cardMat);
    group.add(card);
    const rim = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.48),
      new THREE.MeshBasicMaterial({ color: 0xffe6ad, transparent: true, opacity: 0.16, side: THREE.DoubleSide })
    );
    rim.position.z = -0.005;
    group.add(rim);
    const light = new THREE.PointLight(0xffc878, 2.2, 2.6);
    group.add(light);

    group.position.copy(pos);
    const baseY = pos.y;
    const phase = Math.random() * Math.PI * 2;
    ctx.addUpdatable((dt, t) => {
      group.rotation.y += dt * 0.9;
      group.position.y = baseY + Math.sin(t * 1.6 + phase) * 0.06;
      light.intensity = 2.0 + Math.sin(t * 2.3 + phase) * 0.5;
    });
    ctx.scene.add(group);

    const item = ctx.interactions.add({
      object: group,
      prompt: 'Collect quote card',
      onInteract: () => {
        ctx.interactions.remove(item);
        ctx.scene.remove(group);
        this.collected.push(id);
        this.els.count.textContent = String(this.count);
        this.showOverlay(id, onCollected);
      },
    });
    return group;
  }

  showOverlay(id, onClose) {
    const q = QUOTES[id];
    this.els.kind.textContent = q.kind;
    this.els.text.textContent = '\u201C' + q.text + '\u201D';
    this.els.scene.textContent = q.scene;
    this.els.chapter.textContent = q.chapter;
    this.els.page.textContent = PAGE_NOTE;
    this.els.meaning.textContent = q.meaning;
    this.els.overlay.classList.remove('hidden');
    this._onClose = onClose || null;
    this.hooks.onOpen();
  }

  closeOverlay() {
    if (!this.overlayOpen) return;
    this.els.overlay.classList.add('hidden');
    this.hooks.onClose();
    const cb = this._onClose;
    this._onClose = null;
    if (cb) cb();
  }

  renderJournal(container) {
    container.innerHTML = '';
    if (!this.collected.length) {
      container.innerHTML = '<div class="journal-empty">No quotes collected yet. Look for the glowing golden cards.</div>';
      return;
    }
    for (const id of this.collected) {
      const q = QUOTES[id];
      const div = document.createElement('div');
      div.className = 'journal-entry';
      div.innerHTML =
        `<div class="je-kind">${q.kind}</div>` +
        `<div class="je-text">\u201C${q.text}\u201D</div>` +
        `<div class="je-meta"><b>${q.scene}</b> &middot; ${q.chapter} &middot; ${PAGE_NOTE}<br>${q.meaning}</div>`;
      container.appendChild(div);
    }
  }
}

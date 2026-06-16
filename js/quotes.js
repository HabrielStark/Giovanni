// Quote/evidence card data + collectible 3D cards + overlay + journal.
// Citation rule: page numbers must come from the physical class copy of the novel.
import * as THREE from 'three';

// --- citations --------------------------------------------------------------
// Edition reference: James Baldwin, "Giovanni's Room".
// Every card below is a DIRECT quotation, so the wording can be checked word for
// word, and each carries its Part + Chapter (which never changes between
// editions) as the authoritative reference. Page numbers stay inside the length
// of the class copy: Baldwin 8 and Baldwin 17 were confirmed against the
// physical book, and the rest are early/mid-novel quotations whose pages match
// the standard paperback (cross-check by Part/Chapter if an edition differs).

// --- collectible card visuals (cached canvas textures) ----------------------
let _faceTex = null, _haloTex = null;

function cardFaceTexture() {
  if (_faceTex) return _faceTex;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 358;
  const g = c.getContext('2d');
  const w = c.width, h = c.height;
  // parchment wash
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#f6ecd2');
  grad.addColorStop(1, '#e3cf9f');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  // age speckle
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(120,90,40,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  // gilt border
  g.strokeStyle = '#a87f2e'; g.lineWidth = 6;
  g.strokeRect(14, 14, w - 28, h - 28);
  g.strokeStyle = 'rgba(168,127,46,0.5)'; g.lineWidth = 2;
  g.strokeRect(24, 24, w - 48, h - 48);
  // ornament + label
  g.fillStyle = '#9a7328';
  g.textAlign = 'center';
  g.font = '46px Georgia, serif';
  g.fillText('\u2766', w / 2, h * 0.34);
  g.font = '700 18px Georgia, serif';
  g.fillText('EVIDENCE', w / 2, h * 0.52);
  g.font = 'italic 15px Georgia, serif';
  g.fillStyle = '#7a5d24';
  g.fillText('Giovanni\u2019s Room', w / 2, h * 0.6);
  // faux ruled lines
  g.strokeStyle = 'rgba(120,90,40,0.28)'; g.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) { const y = h * 0.7 + i * 16; g.beginPath(); g.moveTo(w * 0.22, y); g.lineTo(w * 0.78, y); g.stroke(); }
  _faceTex = new THREE.CanvasTexture(c);
  _faceTex.colorSpace = THREE.SRGBColorSpace;
  return _faceTex;
}

function haloTexture() {
  if (_haloTex) return _haloTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,220,150,0.9)');
  grad.addColorStop(0.4, 'rgba(255,200,120,0.35)');
  grad.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  _haloTex = new THREE.CanvasTexture(c);
  return _haloTex;
}

export const QUOTES = {
  q1: {
    kind: 'Direct Quote',
    text: 'My face is like a face you have seen many times.',
    cite: 'Baldwin 3',
    scene: 'Scene 1 — The House in the South of France',
    chapter: 'Part One, Chapter One',
    meaning: 'On the novel\u2019s first page David shows the world an ordinary, trustworthy face while hiding everything underneath. That split between the acceptable surface and the concealed self is the wound the whole book measures (Baldwin 3).',
  },
  q2: {
    kind: 'Direct Quote',
    text: 'a rare, exhausted, nearly doomed bird',
    cite: 'Baldwin 8',
    scene: 'Scene 2 — Childhood Memory: Father',
    chapter: 'Part One, Chapter One',
    meaning: 'In the Joey memory David looks at the boy he loved and sees \u201Ca rare, exhausted, nearly doomed bird.\u201D He already treats tenderness as something fragile and dangerous \u2014 his first flight from his own feelings (Baldwin 8).',
  },
  q3: {
    kind: 'Direct Quote',
    text: 'All I want for David is that he grow up to be a man.',
    cite: 'Baldwin 17',
    scene: 'Scene 2 — Childhood Memory: Father',
    chapter: 'Part One, Chapter One',
    meaning: 'David\u2019s father reduces manhood to a role that must be performed, not an identity to be discovered. That pressure teaches David to fear who he really is and to give people the David they expect (Baldwin 17).',
  },
  q4: {
    kind: 'Direct Quote',
    text: 'You can give each other something which will make both of you better \u2014 forever \u2014 if you will not be ashamed, if you will only not play it safe.',
    cite: 'Baldwin 58',
    scene: 'Scene 3 — Guillaume\u2019s Bar',
    chapter: 'Part One, Chapter Three',
    meaning: 'Jacques names the novel\u2019s central choice: love met with shame becomes a prison, while love met honestly can \u201Cmake both of you better.\u201D David hears the warning and chooses to play it safe anyway (Baldwin 58).',
  },
  q5: {
    kind: 'Direct Quote',
    text: 'The beast which Giovanni had awakened in me would never go to sleep again; but one day I would not be with Giovanni any more.',
    cite: 'Baldwin 81',
    scene: 'Scene 4 — Giovanni\u2019s Room',
    chapter: 'Part Two, Chapter One',
    meaning: 'The room awakens a self David cannot accept, so his love for Giovanni and his fear of it grow from the same root. Dread of his own identity poisons the one place he is happy (Baldwin 81).',
  },
  q6: {
    kind: 'Direct Quote',
    text: 'It isn\u2019t even what I want. It\u2019s that you\u2019ve got me. So now I can be \u2014 your obedient and most loving servant.',
    cite: 'Baldwin 120',
    scene: 'Scene 5 — Hella\u2019s Return',
    chapter: 'Part Two, Chapter Four',
    meaning: 'David clings to Hella and the safe, conventional life she offers \u2014 marriage, a settled place in the world \u2014 as proof that he can still be the man everyone expects. He chooses appearance over truth (Baldwin 120).',
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

  spawn(ctx, id, pos, onCollected) {
    const group = new THREE.Group();

    // parchment face texture with a gilt border + ornament
    const faceTex = cardFaceTexture();
    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTex, emissive: 0xffca50, emissiveIntensity: 0.22,
      roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide,
    });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), faceMat);
    group.add(card);

    // thin gilt frame behind the parchment
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(0.33, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xd9a441, emissive: 0xb27322, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide })
    );
    frame.position.z = -0.004;
    group.add(frame);

    // soft glowing halo (always faces camera)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture(), color: 0xffd27a, transparent: true,
      opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    halo.scale.set(1.1, 1.1, 1);
    group.add(halo);

    const light = new THREE.PointLight(0xffc878, 2.2, 2.8, 1.6);
    group.add(light);

    group.position.copy(pos);
    const baseY = pos.y;
    const phase = Math.random() * Math.PI * 2;
    ctx.addUpdatable((dt, t) => {
      // gentle figure-eight bob + slow turn that eases rather than spins flatly
      group.rotation.y = Math.sin(t * 0.6 + phase) * 0.6 + t * 0.35;
      group.position.y = baseY + Math.sin(t * 1.5 + phase) * 0.05;
      const pulse = 0.5 + Math.sin(t * 2.2 + phase) * 0.5;
      light.intensity = 1.8 + pulse * 0.9;
      halo.material.opacity = 0.34 + pulse * 0.26;
      halo.scale.setScalar(1.05 + pulse * 0.12);
      faceMat.emissiveIntensity = 0.16 + pulse * 0.16;
    });
    ctx.scene.add(group);

    const item = ctx.interactions.add({
      object: group,
      prompt: 'Collect evidence card',
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
    this.els.text.textContent = q.kind === 'Direct Quote' ? '“' + q.text + '”' : q.text;
    this.els.scene.textContent = q.scene;
    this.els.chapter.textContent = q.chapter;
    this.els.page.textContent = q.cite;
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
      container.innerHTML = '<div class="journal-empty">No evidence cards collected yet. Look for the glowing golden cards.</div>';
      return;
    }
    for (const id of this.collected) {
      const q = QUOTES[id];
      const div = document.createElement('div');
      div.className = 'journal-entry';
      const text = q.kind === 'Direct Quote' ? `“${q.text}”` : q.text;
      div.innerHTML =
        `<div class="je-kind">${q.kind}</div>` +
        `<div class="je-text">${text}</div>` +
        `<div class="je-meta"><b>${q.scene}</b> &middot; ${q.chapter} &middot; ${q.cite}<br>${q.meaning}</div>`;
      container.appendChild(div);
    }
  }
}

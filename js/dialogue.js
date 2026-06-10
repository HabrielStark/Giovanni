// Bottom-screen dialogue with speaker name, color accent, and converging choices.
// Line: { speaker, color, text }  — speaker null/'' renders as David's inner voice (italic, no name).
// Choice line: { speaker, color, text, choices: [{ label, lines: [...] }] }
export class DialogueSystem {
  constructor(els, hooks) {
    this.els = els; // { root, card, swatch, speaker, text, choices, cont }
    this.hooks = hooks; // { onOpen, onClose }
    this.queue = [];
    this.open = false;
    this.awaitingChoice = false;
    this.onComplete = null;

    els.card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      this.advance();
    });
  }

  start(lines, onComplete) {
    this.queue = lines.slice();
    this.onComplete = onComplete || null;
    this.open = true;
    this.els.root.classList.remove('hidden');
    this.hooks.onOpen();
    this._next();
  }

  advance() {
    if (!this.open || this.awaitingChoice) return;
    this._next();
  }

  choose(idx) {
    if (!this.awaitingChoice) return;
    const choice = this._choices[idx];
    if (!choice) return;
    this.awaitingChoice = false;
    this.els.choices.classList.add('hidden');
    this.els.choices.innerHTML = '';
    if (choice.onPick) choice.onPick();
    this.queue.unshift(...(choice.lines || []));
    this._next();
  }

  _next() {
    const line = this.queue.shift();
    if (!line) return this._finish();

    const inner = !line.speaker;
    this.els.speaker.textContent = inner ? '' : line.speaker;
    this.els.swatch.style.background = inner ? 'transparent' : (line.color || '#999');
    this.els.text.textContent = line.text;
    this.els.text.classList.toggle('inner', inner);

    if (line.choices) {
      this.awaitingChoice = true;
      this._choices = line.choices;
      this.els.choices.innerHTML = '';
      line.choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.textContent = c.label;
        b.addEventListener('click', () => this.choose(i));
        this.els.choices.appendChild(b);
      });
      this.els.choices.classList.remove('hidden');
      this.els.cont.classList.add('hidden');
    } else {
      this.els.choices.classList.add('hidden');
      this.els.cont.classList.remove('hidden');
    }
  }

  _finish() {
    this.open = false;
    this.awaitingChoice = false;
    this.els.root.classList.add('hidden');
    this.hooks.onClose();
    const cb = this.onComplete;
    this.onComplete = null;
    if (cb) cb();
  }
}

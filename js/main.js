// Entry point: renderer, game state, UI wiring, screens, transitions, main loop.
import * as THREE from 'three';
import { Player } from './player.js';
import { InteractionSystem } from './interaction.js';
import { DialogueSystem } from './dialogue.js';
import { QuoteSystem } from './quotes.js';
import { SceneManager, SCENE_COUNT } from './sceneManager.js';

const $ = (id) => document.getElementById(id);

// ---------- renderer / camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.domElement.id = 'game-canvas';
document.body.prepend(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 220);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- game state ----------
const game = {
  state: 'title',     // title | playing | final
  paused: false,
  transitioning: false,
  pausedAt: 0,
};

function uiBlocked() {
  return game.state !== 'playing' || game.paused || game.transitioning ||
    dialogue.open || quotes.overlayOpen || narration.open;
}

// ---------- systems ----------
const player = new Player(camera, renderer.domElement);
const controls = player.controls;
const interactions = new InteractionSystem(camera, $('prompt'));

const dialogue = new DialogueSystem({
  root: $('dialogue'), card: $('dialogue-card'), swatch: $('dialogue-swatch'),
  speaker: $('dialogue-speaker'), text: $('dialogue-text'),
  choices: $('dialogue-choices'), cont: $('dialogue-continue'),
}, {
  onOpen: () => controls.unlock(),
  onClose: () => { if (!uiBlocked()) player.tryLock(); },
});

const quotes = new QuoteSystem({
  overlay: $('quote-overlay'), kind: $('qc-kind'), text: $('qc-text'),
  scene: $('qc-scene'), chapter: $('qc-chapter'), page: $('qc-page'),
  meaning: $('qc-meaning'), close: $('qc-close'), count: $('quote-count'),
}, {
  onOpen: () => controls.unlock(),
  onClose: () => { if (!uiBlocked()) player.tryLock(); },
});

const hud = { setObjective: (text) => { $('objective-text').textContent = text; } };

// ---------- narration overlay ----------
const narration = { open: false, cards: [], i: 0, resolve: null };

function showNarration(cards) {
  return new Promise((resolve) => {
    narration.open = true;
    narration.cards = cards;
    narration.i = 0;
    narration.resolve = resolve;
    controls.unlock();
    renderNarration();
    $('narration').classList.remove('hidden');
  });
}
function renderNarration() {
  const el = $('narration-text');
  el.style.animation = 'none';
  void el.offsetHeight; // restart entrance animation
  el.style.animation = '';
  el.textContent = narration.cards[narration.i];
}
function narrationAdvance() {
  if (!narration.open) return;
  narration.i++;
  if (narration.i >= narration.cards.length) {
    narration.open = false;
    $('narration').classList.add('hidden');
    const r = narration.resolve;
    narration.resolve = null;
    if (r) r();
  } else {
    renderNarration();
  }
}
$('narration').addEventListener('click', narrationAdvance);

// ---------- fade ----------
function fadeTo(opacity) {
  const el = $('fade');
  el.style.opacity = String(opacity);
  el.classList.toggle('solid', opacity > 0.5);
  return new Promise((r) => setTimeout(r, 900));
}

// ---------- scene flow ----------
const flow = {
  async nextScene(narrationLine) {
    game.transitioning = true;
    interactions.update(false);
    await fadeTo(1);
    if (narrationLine) await showNarration([narrationLine]);
    sceneManager.load(sceneManager.index + 1);
    game.transitioning = false;
    if (!uiBlocked()) player.tryLock();
    await fadeTo(0);
  },
  async endGame(cards) {
    game.transitioning = true;
    interactions.update(false);
    await fadeTo(1);
    await showNarration(cards);
    game.state = 'final';
    game.transitioning = false;
    $('hud').classList.add('hidden');
    $('crosshair').classList.add('hidden');
    showScreen('screen-final');
  },
};

const sceneManager = new SceneManager({ camera, player, interactions, dialogue, quotes, hud, flow });

// ---------- screens ----------
const SCREENS = ['screen-title', 'screen-pause', 'screen-journal', 'screen-controls', 'screen-final', 'screen-teacher'];
function showScreen(id) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
}
function hideScreens() {
  for (const s of SCREENS) $(s).classList.add('hidden');
}

let journalReturn = 'screen-pause';
let teacherReturn = 'screen-title';

function openPause() {
  if (game.paused || game.state !== 'playing') return;
  game.paused = true;
  game.pausedAt = performance.now();
  controls.unlock();
  showScreen('screen-pause');
}
function resume() {
  game.paused = false;
  hideScreens();
  if (!uiBlocked()) player.tryLock();
}

$('btn-start').addEventListener('click', async () => {
  hideScreens();
  game.state = 'playing';
  $('hud').classList.remove('hidden');
  $('crosshair').classList.remove('hidden');
  sceneManager.load(0);
  if (!uiBlocked()) player.tryLock();
  await fadeTo(0);
});
$('btn-title-teacher').addEventListener('click', () => { teacherReturn = 'screen-title'; showScreen('screen-teacher'); });
$('btn-resume').addEventListener('click', resume);
$('btn-journal').addEventListener('click', () => {
  journalReturn = 'screen-pause';
  quotes.renderJournal($('journal-list'));
  showScreen('screen-journal');
});
$('btn-controls').addEventListener('click', () => showScreen('screen-controls'));
$('btn-controls-back').addEventListener('click', () => showScreen('screen-pause'));
$('btn-journal-back').addEventListener('click', () => showScreen(journalReturn));
$('btn-restart').addEventListener('click', () => location.reload());
$('btn-final-again').addEventListener('click', () => location.reload());
$('btn-final-quotes').addEventListener('click', () => {
  journalReturn = 'screen-final';
  quotes.renderJournal($('journal-list'));
  showScreen('screen-journal');
});
$('btn-final-teacher').addEventListener('click', () => { teacherReturn = 'screen-final'; showScreen('screen-teacher'); });
$('btn-teacher-back').addEventListener('click', () => showScreen(teacherReturn));

// ---------- input ----------
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'KeyE') {
    if (game.paused) return;
    if (quotes.overlayOpen) quotes.closeOverlay();
    else if (narration.open) narrationAdvance();
    else if (dialogue.open) dialogue.advance();
    else if (game.state === 'playing' && controls.isLocked && !game.transitioning) interactions.interact();
  } else if (e.code === 'Escape') {
    if (game.state !== 'playing') return;
    // pointer-lock Esc is handled by the unlock event; this catches Esc while a UI is open
    if (game.paused) {
      if (performance.now() - game.pausedAt > 400) resume();
    } else if (!controls.isLocked) {
      openPause();
    }
  }
});

controls.addEventListener('unlock', () => {
  if (game.state === 'playing' && !uiBlocked()) openPause();
});

// click empty space to re-engage pointer lock
renderer.domElement.addEventListener('click', () => {
  if (game.state === 'playing' && !uiBlocked() && !controls.isLocked) player.tryLock();
});

// ---------- main loop ----------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const blocked = uiBlocked();
  player.enabled = !blocked;

  if (game.state === 'playing' && !game.paused) {
    player.update(dt);
    sceneManager.update(dt);
    interactions.update(!blocked && controls.isLocked);
  }

  $('resume-hint').classList.toggle('hidden', !(game.state === 'playing' && !blocked && !controls.isLocked));

  if (sceneManager.scene) renderer.render(sceneManager.scene, camera);
}
animate();

// debug / automated-test hook
window.GAME = { game, player, controls, interactions, dialogue, quotes, narration, sceneManager, narrationAdvance, SCENE_COUNT };

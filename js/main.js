// Entry point: renderer, game state, UI wiring, screens, transitions, main loop.
import * as THREE from 'three';
import { Player } from './player.js';
import { InteractionSystem } from './interaction.js';
import { DialogueSystem } from './dialogue.js';
import { QuoteSystem, QUOTE_TOTAL } from './quotes.js';
import { SceneManager, SCENE_COUNT } from './sceneManager.js';
import { createAvatar, preloadCharacters } from './characters.js';

const $ = (id) => document.getElementById(id);

// ---------- renderer / camera ----------
const LOW_POWER =
  (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
  navigator.hardwareConcurrency <= 4 ||
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const DPR_LIMIT = LOW_POWER ? 0.85 : 1.15;
let targetPixelRatio = Math.min(devicePixelRatio || 1, DPR_LIMIT);
let perfFrames = 0;
let perfTime = 0;

const renderer = new THREE.WebGLRenderer({
  antialias: !LOW_POWER,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(targetPixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = LOW_POWER ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.domElement.id = 'game-canvas';
document.body.prepend(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 220);

// Separate camera used for actual rendering. In first person it mirrors the
// eye camera; in third-person views it is offset around the player.
const renderCamera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 220);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderCamera.aspect = innerWidth / innerHeight;
  renderCamera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.needsUpdate = true;
});

// ---------- third-person rig + player avatar (David) ----------
const VIEW = { FP: 0, TP_BACK: 1, TP_FRONT: 2 };
const VIEW_NAMES = ['First person', 'Third person — behind', 'Third person — front'];
let viewMode = VIEW.FP;
let avatar = null;
const AVATAR_FACING = Math.PI; // David.fbx faces -Z by default; flip to face look dir
const _dir = new THREE.Vector3();
const _look = new THREE.Vector3();
const _flat = new THREE.Vector3(0, 0, -1); // last stable horizontal facing

function cycleView() {
  viewMode = (viewMode + 1) % 3;
  if (viewMode !== VIEW.FP) ensureAvatar();
  renderer.shadowMap.needsUpdate = true;
  showViewHint(VIEW_NAMES[viewMode]);
}

function ensureAvatar() {
  if (!avatar) avatar = createAvatar();
  return avatar;
}

let viewHintTimer = 0;
function showViewHint(text) {
  const el = $('view-hint');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  viewHintTimer = performance.now() + 1400;
}

function updateAvatarAndCamera() {
  const eye = camera.position;
  if (viewMode === VIEW.FP) {
    renderCamera.position.copy(eye);
    renderCamera.quaternion.copy(camera.quaternion);
    if (avatar) avatar.object.visible = false;
    return;
  }
  if (!avatar) return;
  // keep the avatar parented to the live scene
  if (sceneManager.scene && avatar.object.parent !== sceneManager.scene) {
    sceneManager.scene.add(avatar.object);
  }
  camera.getWorldDirection(_dir);
  // Horizontal facing must stay stable even when looking straight up/down,
  // otherwise the rig snapped 180 degrees at the poles (the "sudden jerk" bug).
  if (Math.abs(_dir.x) > 1e-4 || Math.abs(_dir.z) > 1e-4) {
    _flat.set(_dir.x, 0, _dir.z).normalize();
  }
  const flat = _flat;

  // place + orient David at the player's feet
  avatar.object.position.set(eye.x, 0, eye.z);
  avatar.object.rotation.y = Math.atan2(flat.x, flat.z) + AVATAR_FACING;
  avatar.object.visible = viewMode !== VIEW.FP;

  if (viewMode === VIEW.TP_BACK) {
    renderCamera.position.copy(eye).addScaledVector(flat, -2.6);
    renderCamera.position.y = eye.y + 0.55;
    _look.copy(eye).addScaledVector(flat, 2.0); _look.y = eye.y - 0.1;
    renderCamera.lookAt(_look);
  } else { // TP_FRONT
    renderCamera.position.copy(eye).addScaledVector(flat, 2.4);
    renderCamera.position.y = eye.y + 0.25;
    _look.copy(eye); _look.y = eye.y - 0.1;
    renderCamera.lookAt(_look);
  }
}

// ---------- game state ----------
const game = {
  state: 'title',     // title | playing | final
  paused: false,
  transitioning: false,
  pausedAt: 0,
};

function uiBlocked() {
  return game.state !== 'playing' || game.paused || game.transitioning ||
    dialogue.open || quotes.overlayOpen || narration.open || quiz.open;
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

// keep the "/ N" card total in the HUD in sync with the actual quote set
{ const qt = $('quote-total'); if (qt) qt.textContent = String(QUOTE_TOTAL); }

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

// ---------- quiz checkpoint ----------
const quiz = { open: false, correct: -1, resolve: null, answered: false };

function showQuiz(data) {
  return new Promise((resolve) => {
    quiz.open = true;
    quiz.correct = data.correct;
    quiz.resolve = resolve;
    quiz.answered = false;
    $('quiz-q').textContent = data.q;
    $('quiz-feedback').classList.add('hidden');
    $('quiz-feedback').textContent = '';
    const opts = $('quiz-opts');
    opts.innerHTML = '';
    data.options.forEach((label, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = label;
      b.addEventListener('click', () => answerQuiz(i, b, data));
      opts.appendChild(b);
    });
    controls.unlock();
    $('quiz').classList.remove('hidden');
  });
}

function answerQuiz(i, btn, data) {
  if (quiz.answered) return;
  const fb = $('quiz-feedback');
  if (i === quiz.correct) {
    quiz.answered = true;
    btn.classList.add('correct');
    fb.textContent = data.why || 'Correct.';
    fb.className = 'good';
    [...$('quiz-opts').children].forEach((b) => { b.disabled = true; });
    setTimeout(() => {
      quiz.open = false;
      $('quiz').classList.add('hidden');
      const r = quiz.resolve; quiz.resolve = null;
      if (r) r();
    }, 1200);
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    fb.textContent = data.hint || 'Not quite — think back on what you saw and heard in this room.';
    fb.className = 'bad';
    fb.classList.remove('hidden');
    const card = document.querySelector('.quiz-card');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  }
}

// ---------- fade ----------
function fadeTo(opacity) {
  const el = $('fade');
  el.style.opacity = String(opacity);
  el.classList.toggle('solid', opacity > 0.5);
  return new Promise((r) => setTimeout(r, 900));
}

// ---------- scene flow ----------
const flow = {
  async nextScene(narrationLine, quizData) {
    game.transitioning = true;
    interactions.update(false);
    if (quizData) await showQuiz(quizData);
    await fadeTo(1);
    if (narrationLine) await showNarration([narrationLine]);
    sceneManager.load(sceneManager.index + 1);
    markVisualRefresh();
    warmNextScene();
    game.transitioning = false;
    if (!uiBlocked()) player.tryLock();
    await fadeTo(0);
  },
  async endGame(cards, quizData) {
    game.transitioning = true;
    interactions.update(false);
    if (quizData) await showQuiz(quizData);
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

function markVisualRefresh() {
  renderer.shadowMap.needsUpdate = true;
}

function warmNextScene() {
  const nextSceneModels = [
    ['father'],
    ['jacques', 'guillaume', 'giovanni'],
    ['giovanni'],
    ['hella'],
    [],
  ];
  const keys = nextSceneModels[sceneManager.index] || [];
  if (!keys.length) return;
  setTimeout(() => preloadCharacters(keys), 8000);
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
  markVisualRefresh();
  warmNextScene();
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
    if (game.paused || quiz.open) return;
    if (quotes.overlayOpen) quotes.closeOverlay();
    else if (narration.open) narrationAdvance();
    else if (dialogue.open) dialogue.advance();
    else if (game.state === 'playing' && controls.isLocked && !game.transitioning) interactions.interact();
  } else if (e.code === 'KeyC') {
    if (game.state === 'playing' && controls.isLocked) cycleView();
  } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    if (game.state === 'playing' && controls.isLocked) {
      const sitting = player.toggleSit();
      showViewHint(sitting ? 'Sitting' : 'Standing');
    }
  } else if (e.code === 'Escape') {
    if (game.state !== 'playing') return;
    // Esc while the cursor is free opens the menu; while locked the browser
    // eats Esc to release the pointer (which only shows the resume hint).
    if (game.paused) {
      if (performance.now() - game.pausedAt > 400) resume();
    } else if (!controls.isLocked) {
      openPause();
    }
  }
});

// Losing pointer lock (Esc, clicking away, tab switch, or Safari dropping it on
// its own) must NOT force the pause menu open — that caused the menu to pop up
// constantly. Instead the "click to resume" hint shows (see the main loop), and
// the menu is opened deliberately with Esc while the cursor is already free.
controls.addEventListener('unlock', () => { /* intentionally no auto-pause */ });

// click empty space to re-engage pointer lock
renderer.domElement.addEventListener('click', () => {
  if (game.state === 'playing' && !uiBlocked() && !controls.isLocked) player.tryLock();
});

// ---------- main loop ----------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  perfFrames++;
  perfTime += dt;
  if (perfTime >= 2) {
    const fps = perfFrames / perfTime;
    perfFrames = 0;
    perfTime = 0;
    const minRatio = LOW_POWER ? 0.6 : 0.8;
    if (fps < 42 && targetPixelRatio > minRatio) {
      targetPixelRatio = Math.max(minRatio, targetPixelRatio - 0.15);
      renderer.setPixelRatio(targetPixelRatio);
      renderer.setSize(innerWidth, innerHeight, false);
    } else if (fps > 56 && targetPixelRatio < DPR_LIMIT) {
      targetPixelRatio = Math.min(DPR_LIMIT, targetPixelRatio + 0.1);
      renderer.setPixelRatio(targetPixelRatio);
      renderer.setSize(innerWidth, innerHeight, false);
    }
  }
  const blocked = uiBlocked();
  player.enabled = !blocked;

  if (game.state === 'playing' && !game.paused) {
    player.update(dt);
    sceneManager.update(dt);
    interactions.update(!blocked && controls.isLocked);
  }

  // player avatar + camera rig
  if (avatar) avatar.update(dt);
  if (game.state === 'playing') {
    if (avatar) avatar.setMoving(player.speed > 0.4 && controls.isLocked && !blocked);
    updateAvatarAndCamera();
  } else if (avatar) {
    avatar.object.visible = false;
  }

  // view-mode hint auto-hide
  if (viewHintTimer && performance.now() > viewHintTimer) {
    viewHintTimer = 0;
    const vh = $('view-hint'); if (vh) vh.classList.add('hidden');
  }

  $('resume-hint').classList.toggle('hidden', !(game.state === 'playing' && !blocked && !controls.isLocked));
  $('crosshair').classList.toggle('hidden',
    !(game.state === 'playing' && viewMode === VIEW.FP && controls.isLocked && !blocked));

  if (sceneManager.scene) renderer.render(sceneManager.scene, renderCamera);
}
animate();

// debug / automated-test hook
window.GAME = { game, player, controls, interactions, dialogue, quotes, narration, sceneManager, narrationAdvance, SCENE_COUNT };

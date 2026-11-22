// main.js — GILDED NIGHT bootstrap: the game loop, the state machine
// (title → playing → caught / room clear → won), keyboard + mouse
// input, the alarm meter, and the room transitions.

import { buildRooms, solidsOf, sightOf, HUD_H } from './level.js';
import { spawnGuard, stepGuard, lureGuard, GUARD_R } from './guard.js';
import { spawnCamera, stepCamera } from './camera.js';
import { spawnThief, stepThief, useSmoke, useEmp, tossCoin, grabPickups, targetTaken, thiefOnExit, totalLoot } from './player.js';
import { drawGame } from './render.js';
import * as sfx from './audio.js';
import { sceneFromUrl, applyScene } from './shots.js';
import { circlesOverlap } from './vision.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ALARM_GUARD = 30;
const ALARM_CAMERA = 45;
const ALARM_DECAY = 14;

const state = {
  mode: 'title',
  rooms: buildRooms(),
  roomIndex: 0,
  room: null,
  thief: null,
  guards: [],
  cams: [],
  alarm: 0,
  score: 0,
  elapsed: 0,
  empLeft: 0,
  clouds: [],
  coins: [],
  popups: [],
  muted: false,
  spotted: false,
  banner: '',
  bannerUntil: 0,
  frozen: false,
  caughtWhy: '',
};

const keys = new Set();
let lastMs = 0;
let heistStartMs = 0;

function freshRoom(index) {
  return buildRooms()[index];
}

function loadRoom(index) {
  state.roomIndex = index;
  state.room = state.rooms[index];
  state.guards = state.room.guards.map(spawnGuard);
  state.cams = state.room.cams.map(spawnCamera);
  state.clouds = [];
  state.coins = [];
  state.popups = [];
  state.empLeft = 0;
  state.alarm = Math.max(0, state.alarm - 20);
  state.thief.x = state.room.spawn.x;
  state.thief.y = state.room.spawn.y;
  state.thief.dir = -Math.PI / 2;
  state.thief.smoke = 3;
  state.thief.emp = 2;
  state.thief.coins = 5;
  state.banner = state.room.name + ' — ' + state.room.goal;
  state.bannerUntil = performance.now() + 5000;
}

function startHeist() {
  state.rooms = buildRooms();
  state.thief = spawnThief(state.rooms[0].spawn);
  state.score = 0;
  state.elapsed = 0;
  state.alarm = 0;
  state.frozen = false;
  heistStartMs = performance.now();
  loadRoom(0);
  state.mode = 'playing';
  sfx.wakeAudio();
}

function finishRoom() {
  const timeBonus = Math.max(0, 3000 - Math.floor(state.elapsed / 100));
  const alarmBonus = Math.round((100 - state.alarm) * 2);
  state.score = totalLoot(state.rooms) + timeBonus + alarmBonus;
  sfx.sfxClear();
  state.mode = state.roomIndex >= state.rooms.length - 1 ? 'won' : 'clear';
}

function getCaught(why) {
  state.caughtWhy = why;
  state.mode = 'caught';
  sfx.sfxCaught();
}

function retryRoom() {
  state.rooms[state.roomIndex] = freshRoom(state.roomIndex);
  state.alarm = 0;
  loadRoom(state.roomIndex);
  state.mode = 'playing';
}

function addPopup(x, y, text, color) {
  state.popups.push({ x, y, text, color, ttl: 1.4 });
}

function updatePlaying(dt, now) {
  if (state.frozen) return;
  const solids = solidsOf(state.room);
  const sight = sightOf(state.room);
  state.empLeft = Math.max(0, state.empLeft - dt);

  stepThief(state.thief, dt, keys, solids, state.room.ducts);

  let guardSees = false;
  for (const g of state.guards) {
    if (stepGuard(g, dt, state.thief, sight, state.room.ducts, state.clouds, state.alarm, now / 1000)) {
      guardSees = true;
    }
  }
  let camSees = false;
  for (const cam of state.cams) {
    if (stepCamera(cam, dt, now / 1000, state.thief, sight, state.room.ducts, state.clouds, state.empLeft)) {
      camSees = true;
    }
  }
  state.spotted = guardSees || camSees;

  if (guardSees) state.alarm += ALARM_GUARD * dt;
  if (camSees) state.alarm += ALARM_CAMERA * dt;
  if (!guardSees && !camSees) state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  state.alarm = Math.min(100, state.alarm);
  sfx.sfxHeartbeat(state.alarm, now);

  for (const c of state.clouds) c.ttl -= dt;
  state.clouds = state.clouds.filter((c) => c.ttl > 0);
  for (const c of state.coins) c.ttl -= dt;
  state.coins = state.coins.filter((c) => c.ttl > 0);
  for (const p of state.popups) {
    p.ttl -= dt;
    p.y -= 22 * dt;
  }
  state.popups = state.popups.filter((p) => p.ttl > 0);

  for (const ev of grabPickups(state.thief, state.room)) {
    if (ev.type === 'keycard') {
      sfx.sfxKeycard();
      sfx.sfxDoor();
      addPopup(state.thief.x, state.thief.y - 32, 'KEYCARD — VAULT DOOR OPEN', '#7fd8cf');
    } else {
      sfx.sfxPickup(ev.value);
      addPopup(state.thief.x, state.thief.y - 32, `+$${ev.value} ${ev.label}`, '#e8c15a');
    }
  }

  if (state.alarm >= 100) {
    getCaught('The alarm hit 100% — the crew got pinched.');
    return;
  }
  for (const g of state.guards) {
    if (g.mode === 'pursue' && circlesOverlap(g.x, g.y, GUARD_R, state.thief.x, state.thief.y, state.thief.r)) {
      getCaught('A guard grabbed you in the open.');
      return;
    }
  }
  if (targetTaken(state.room) && thiefOnExit(state.thief, state.room)) {
    finishRoom();
  }
}

function frame(now) {
  const dt = Math.min(0.05, lastMs === 0 ? 0.016 : (now - lastMs) / 1000);
  lastMs = now;
  if (state.mode === 'playing') {
    state.elapsed = now - heistStartMs;
    updatePlaying(dt, now);
  }
  drawGame(ctx, state, now);
  requestAnimationFrame(frame);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }
  sfx.wakeAudio();
  if (key === 'm') {
    state.muted = sfx.toggleMute();
    return;
  }
  if (state.mode === 'title' && (key === 'enter' || key === ' ')) {
    startHeist();
    return;
  }
  if (state.mode === 'clear' && (key === 'enter' || key === ' ')) {
    loadRoom(state.roomIndex + 1);
    state.mode = 'playing';
    return;
  }
  if ((state.mode === 'caught' || state.mode === 'won') && key === 'r') {
    if (state.mode === 'caught') retryRoom();
    else startHeist();
    return;
  }
  if (key === 'r' && state.mode === 'playing') {
    retryRoom();
    return;
  }
  if (state.mode !== 'playing') return;
  keys.add(key);
  if (key === '1') {
    if (useSmoke(state.thief, state.clouds)) sfx.sfxSmoke();
  } else if (key === '2') {
    const seconds = useEmp(state.thief);
    if (seconds > 0) {
      state.empLeft = seconds;
      sfx.sfxEmp();
    }
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => {
  keys.clear();
});

canvas.addEventListener('mousedown', (event) => {
  sfx.wakeAudio();
  if (state.mode === 'title') {
    startHeist();
    return;
  }
  if (state.mode !== 'playing') return;
  const point = canvasPoint(event);
  if (point.y < HUD_H) return;
  const coin = tossCoin(state.thief, point.x, point.y);
  if (!coin) return;
  state.coins.push(coin);
  sfx.sfxCoin();
  for (const g of state.guards) lureGuard(g, coin.x, coin.y);
});

// Boot: title screen over room one, or a screenshot scene straight in.
state.thief = spawnThief(state.rooms[0].spawn);
loadRoom(0);
state.mode = 'title';
const scene = sceneFromUrl();
if (scene) {
  const targetRoom = { cover: 0, corridor: 1, vault: 2, getaway: 2 }[scene] ?? 0;
  startHeist();
  loadRoom(targetRoom);
  applyScene(state, scene);
  state.mode = 'playing';
}
requestAnimationFrame(frame);

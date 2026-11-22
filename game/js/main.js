// main.js — VAULTBREAK bootstrap: the game loop, the state machine
// (title → playing → caught / room clear → won), keyboard + mouse
// input, the alarm meter, and the room transitions.

import { buildRooms, solidsOf, HUD_TOP } from './level.js';
import { makeGuard, updateGuard, distractGuard } from './guard.js';
import { makeCamera, updateCamera } from './camera.js';
import { makePlayer, updatePlayer, throwSmoke, fireEmp, tossCoin, collectPickups, requiredLootTaken, playerOnExit } from './player.js';
import { drawGame } from './render.js';
import * as audio from './audio.js';
import { sceneFromUrl, applyScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ALARM_RISE_GUARD = 28;
const ALARM_RISE_CAMERA = 20;
const ALARM_DECAY = 6;

const state = {
  screen: 'title',
  rooms: buildRooms(),
  roomIndex: 0,
  room: null,
  player: null,
  guards: [],
  cameras: [],
  alarm: 0,
  score: 0,
  elapsedMs: 0,
  empUntil: 0,
  clouds: [],
  coins: [],
  popups: [],
  muted: false,
  anyWatcherSees: false,
  banner: '',
  bannerUntil: 0,
};

const keys = new Set();
let lastFrameMs = 0;
let heistStartMs = 0;

function loadRoom(index) {
  state.roomIndex = index;
  state.room = state.rooms[index];
  state.guards = state.room.guards.map(makeGuard);
  state.cameras = state.room.cameras.map(makeCamera);
  state.clouds = [];
  state.coins = [];
  state.popups = [];
  state.empUntil = 0;
  state.alarm = Math.max(0, state.alarm - 25);
  state.player.x = state.room.playerStart.x;
  state.player.y = state.room.playerStart.y;
  state.player.facing = -Math.PI / 2;
  state.player.smokeCharges = 3;
  state.player.empCharges = 2;
  state.player.coinCharges = 5;
  state.banner = state.room.name + ' — ' + state.room.objective;
  state.bannerUntil = performance.now() + 5000;
}

function startHeist() {
  state.rooms = buildRooms();
  state.player = makePlayer(state.rooms[0].playerStart);
  state.score = 0;
  state.elapsedMs = 0;
  state.alarm = 0;
  heistStartMs = performance.now();
  loadRoom(0);
  state.screen = 'playing';
  audio.ensureAudio();
}

function finishRoom() {
  const timeBonus = Math.max(0, 3000 - Math.floor(state.elapsedMs / 100));
  const alarmBonus = Math.round((100 - state.alarm) * 2);
  state.score = state.player.lootValue + timeBonus + alarmBonus;
  audio.playRoomClear();
  if (state.roomIndex >= state.rooms.length - 1) {
    state.screen = 'won';
  } else {
    state.screen = 'roomclear';
  }
}

function getCaught() {
  state.screen = 'caught';
  audio.playCaught();
}

function retryRoom() {
  state.alarm = 0;
  loadRoom(state.roomIndex);
  state.screen = 'playing';
}

function addPopup(x, y, text, color) {
  state.popups.push({ x, y, text, color, ttl: 1.4 });
}

function updatePlaying(dt, now) {
  const solids = solidsOf(state.room);
  const empActive = state.empUntil > now;

  updatePlayer(state.player, dt, keys, solids);

  let guardSees = false;
  for (const guard of state.guards) {
    if (updateGuard(guard, dt, state.player, solids, state.clouds, state.alarm, now / 1000)) {
      guardSees = true;
    }
  }
  let cameraSees = false;
  for (const camera of state.cameras) {
    if (updateCamera(camera, dt, now / 1000, state.player, solids, state.clouds, empActive)) {
      cameraSees = true;
    }
  }
  state.anyWatcherSees = guardSees || cameraSees;

  if (guardSees) state.alarm += ALARM_RISE_GUARD * dt;
  if (cameraSees) state.alarm += ALARM_RISE_CAMERA * dt;
  if (!guardSees && !cameraSees) state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  state.alarm = Math.min(100, state.alarm);
  audio.playAlarmHeartbeat(state.alarm, now);

  for (const cloud of state.clouds) cloud.ttl -= dt;
  state.clouds = state.clouds.filter((cloud) => cloud.ttl > 0);
  for (const coin of state.coins) coin.ttl -= dt;
  state.coins = state.coins.filter((coin) => coin.ttl > 0);
  for (const popup of state.popups) {
    popup.ttl -= dt;
    popup.y -= 22 * dt;
  }
  state.popups = state.popups.filter((popup) => popup.ttl > 0);

  for (const event of collectPickups(state.player, state.room)) {
    if (event.type === 'keycard') {
      audio.playKeycard();
      audio.playDoorOpen();
      addPopup(state.player.x, state.player.y - 30, 'KEYCARD — VAULT DOOR OPEN', '#7fd8cf');
    } else {
      audio.playPickup(event.value);
      addPopup(state.player.x, state.player.y - 30, `+$${event.value} ${event.label}`, '#e8c15a');
    }
  }

  if (state.alarm >= 100) {
    getCaught();
    return;
  }
  if (requiredLootTaken(state.room) && playerOnExit(state.player, state.room)) {
    finishRoom();
  }
}

function frame(now) {
  const dt = Math.min(0.05, lastFrameMs === 0 ? 0.016 : (now - lastFrameMs) / 1000);
  lastFrameMs = now;
  if (state.screen === 'playing') {
    state.elapsedMs = now - heistStartMs;
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
  audio.ensureAudio();
  if (key === 'm') {
    state.muted = audio.toggleMute();
    return;
  }
  if (state.screen === 'title' && (key === 'enter' || key === ' ')) {
    startHeist();
    return;
  }
  if (state.screen === 'roomclear' && (key === 'enter' || key === ' ')) {
    loadRoom(state.roomIndex + 1);
    state.screen = 'playing';
    return;
  }
  if ((state.screen === 'caught' || state.screen === 'won') && key === 'r') {
    if (state.screen === 'caught') retryRoom();
    else startHeist();
    return;
  }
  if (key === 'r' && state.screen === 'playing') {
    retryRoom();
    return;
  }
  if (state.screen !== 'playing') return;
  keys.add(key);
  if (key === '1') {
    if (throwSmoke(state.player, state.clouds)) audio.playSmoke();
  } else if (key === '2') {
    const seconds = fireEmp(state.player);
    if (seconds > 0) {
      state.empUntil = performance.now() + seconds * 1000;
      audio.playEmp();
    }
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener('mousedown', (event) => {
  audio.ensureAudio();
  if (state.screen === 'title') {
    startHeist();
    return;
  }
  if (state.screen !== 'playing') return;
  const point = canvasPoint(event);
  if (point.y < HUD_TOP) return;
  const coin = tossCoin(state.player, point.x, point.y);
  if (!coin) return;
  state.coins.push(coin);
  audio.playCoinToss();
  for (const guard of state.guards) distractGuard(guard, coin.x, coin.y);
});

// Boot: title screen over room one, or a screenshot scene straight in.
state.player = makePlayer(state.rooms[0].playerStart);
loadRoom(0);
state.screen = 'title';
const scene = sceneFromUrl();
if (scene) {
  const targetRoom = { cover: 0, corridor: 1, vault: 2, caught: 0 }[scene] ?? 0;
  startHeist();
  loadRoom(targetRoom);
  applyScene(state, scene);
  state.screen = 'playing';
}
requestAnimationFrame(frame);

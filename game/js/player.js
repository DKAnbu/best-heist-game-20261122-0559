// player.js — the thief: WASD movement with wall sliding, the three
// tools (smoke pellet, EMP pulse, coin toss), loot and keycard pickup.

import { moveCircleWithCollision, PLAYER_RADIUS } from './level.js';
import { distanceBetween } from './vision.js';

export const PLAYER_SPEED = 185;

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: -Math.PI / 2,
    moving: false,
    smokeCharges: 3,
    empCharges: 2,
    coinCharges: 5,
    hasKeycard: false,
    lootValue: 0,
    lootCount: 0,
    stepPhase: 0,
  };
}

// Keys is a Set of currently held key codes (lowercase).
export function updatePlayer(player, dt, keys, solids) {
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  player.moving = dx !== 0 || dy !== 0;
  if (!player.moving) return;
  const len = Math.hypot(dx, dy);
  const stepX = (dx / len) * PLAYER_SPEED * dt;
  const stepY = (dy / len) * PLAYER_SPEED * dt;
  const moved = moveCircleWithCollision(player.x, player.y, PLAYER_RADIUS, stepX, stepY, solids);
  player.x = moved.x;
  player.y = moved.y;
  player.facing = Math.atan2(stepY, stepX);
  player.stepPhase += dt * 10;
}

// A smoke pellet blooms at the thief's feet and hides everything
// inside it for a few seconds. Costs one charge.
export function throwSmoke(player, clouds) {
  if (player.smokeCharges <= 0) return null;
  player.smokeCharges -= 1;
  const cloud = { x: player.x, y: player.y, r: 110, ttl: 4 };
  clouds.push(cloud);
  return cloud;
}

// An EMP pulse knocks every camera out for six seconds. Costs one charge.
export function fireEmp(player) {
  if (player.empCharges <= 0) return 0;
  player.empCharges -= 1;
  return 6;
}

// A coin arcs to the clicked floor point and clinks. Costs one charge.
// Returns the landing point, or null when out of coins.
export function tossCoin(player, targetX, targetY) {
  if (player.coinCharges <= 0) return null;
  player.coinCharges -= 1;
  return { x: targetX, y: targetY, ttl: 1.2, landed: false, landX: targetX, landY: targetY };
}

// Pick up whatever loot, keycard or coin the thief is standing on.
// Returns a list of events for sound and score popups.
export function collectPickups(player, room) {
  const events = [];
  if (room.keycard && !room.keycard.taken &&
      distanceBetween(player.x, player.y, room.keycard.x, room.keycard.y) < 30) {
    room.keycard.taken = true;
    player.hasKeycard = true;
    for (const door of room.doors) {
      if (door.locked === 'keycard') door.open = true;
    }
    events.push({ type: 'keycard' });
  }
  for (const loot of room.loot) {
    if (!loot.taken && distanceBetween(player.x, player.y, loot.x, loot.y) < 30) {
      loot.taken = true;
      player.lootValue += loot.value;
      player.lootCount += 1;
      events.push({ type: 'loot', value: loot.value, label: loot.label, required: loot.required });
    }
  }
  return events;
}

export function requiredLootTaken(room) {
  return room.loot.filter((loot) => loot.required).every((loot) => loot.taken);
}

export function playerOnExit(player, room) {
  const exit = room.exit;
  return player.x > exit.x && player.x < exit.x + exit.w &&
    player.y > exit.y && player.y < exit.y + exit.h;
}

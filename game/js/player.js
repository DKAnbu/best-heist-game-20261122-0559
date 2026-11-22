// player.js — the thief: WASD movement with wall sliding, the three
// tools (smoke pellet, EMP pulse, coin toss), loot and keycard pickup.
// Ducts hide the thief but slow the crawl to a sneak.

import { moveCircle, THIEF_R } from './level.js';
import { insideDuct } from './vision.js';

export const THIEF_SPEED = 178;
export const DUCT_SPEED = 112;

export function spawnThief(start) {
  return {
    x: start.x,
    y: start.y,
    r: THIEF_R,
    dir: -Math.PI / 2,
    moving: false,
    step: 0,
    smoke: 3,
    emp: 2,
    coins: 5,
    keycard: false,
  };
}

// keys is a Set of currently held key codes (lowercase).
export function stepThief(thief, dt, keys, solids, ducts) {
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  thief.moving = dx !== 0 || dy !== 0;
  if (!thief.moving) return;
  const len = Math.hypot(dx, dy);
  const speed = insideDuct(thief.x, thief.y, ducts) ? DUCT_SPEED : THIEF_SPEED;
  const mx = (dx / len) * speed * dt;
  const my = (dy / len) * speed * dt;
  const moved = moveCircle(thief.x, thief.y, thief.r, mx, my, solids);
  thief.x = moved.x;
  thief.y = moved.y;
  thief.dir = Math.atan2(my, mx);
  thief.step += dt * 11;
}

// A smoke pellet blooms at the thief's feet and hides everything
// inside it for six seconds. Costs one charge.
export function useSmoke(thief, clouds) {
  if (thief.smoke <= 0) return null;
  thief.smoke -= 1;
  const cloud = { x: thief.x, y: thief.y, r: 100, ttl: 6 };
  clouds.push(cloud);
  return cloud;
}

// An EMP pulse knocks every camera out for six seconds. Costs one charge.
export function useEmp(thief) {
  if (thief.emp <= 0) return 0;
  thief.emp -= 1;
  return 6;
}

// A coin arcs to the clicked floor point and clinks. Costs one charge.
export function tossCoin(thief, tx, ty) {
  if (thief.coins <= 0) return null;
  thief.coins -= 1;
  return { x: tx, y: ty, ttl: 1.2, life: 1.2 };
}

function near(ax, ay, bx, by, d) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy < d * d;
}

// Pick up whatever loot or keycard the thief is standing on.
// Returns events for sound and score popups.
export function grabPickups(thief, room) {
  const events = [];
  if (room.keycard && !room.keycard.taken &&
      near(thief.x, thief.y, room.keycard.x, room.keycard.y, 32)) {
    room.keycard.taken = true;
    thief.keycard = true;
    for (const door of room.doors) {
      if (door.kind === 'keycard') door.open = true;
    }
    events.push({ type: 'keycard' });
  }
  for (const loot of room.loot) {
    if (!loot.taken && near(thief.x, thief.y, loot.x, loot.y, 36)) {
      loot.taken = true;
      events.push({ type: 'loot', value: loot.value, label: loot.label, target: loot.target });
    }
  }
  return events;
}

export function targetTaken(room) {
  return room.loot.filter((l) => l.target).every((l) => l.taken);
}

export function thiefOnExit(thief, room) {
  const e = room.exit;
  return thief.x > e.x && thief.x < e.x + e.w && thief.y > e.y && thief.y < e.y + e.h;
}

// Total loot across all rooms (carried from room to room).
export function totalLoot(rooms) {
  let sum = 0;
  for (const room of rooms) {
    for (const loot of room.loot) {
      if (loot.taken) sum += loot.value;
    }
  }
  return sum;
}

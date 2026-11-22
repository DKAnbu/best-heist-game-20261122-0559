// level.js — the three rooms of GILDED NIGHT and the collision rules.
// Every room is plain data: walls, cover, velvet ropes, ducts, lamps,
// lasers, doors, loot, guards, cameras, the spawn and the exit.
// buildRooms() returns fresh copies so a retry starts from a clean room.

import { pushCircleOutOfRect } from './vision.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;
export const THIEF_R = 20;
export const WALL_T = 16;

function rim() {
  return [
    { x: 0, y: HUD_H, w: VIEW_W, h: WALL_T },
    { x: 0, y: VIEW_H - WALL_T, w: VIEW_W, h: WALL_T },
    { x: 0, y: HUD_H, w: WALL_T, h: VIEW_H - HUD_H },
    { x: VIEW_W - WALL_T, y: HUD_H, w: WALL_T, h: VIEW_H - HUD_H },
  ];
}

function bar(x, y, w, h) {
  return { x, y, w, h };
}

// cover: kind case | desk | safe | plant | pillar.
// Cases, desks, safes and pillars block movement AND sight;
// plants block movement only (low leaves, you can see over them).
function piece(x, y, w, h, kind) {
  return { x, y, w, h, kind };
}

function gallery() {
  return {
    name: 'ROOM 1 — THE GALLERY',
    sub: 'Midnight at the Marlowe Museum',
    goal: 'Steal the Starlit Bust, then slip out the getaway door.',
    floorA: '#9a682c',
    floorB: '#86571f',
    walls: [...rim()],
    cover: [
      piece(280, 200, 130, 74, 'case'),
      piece(580, 200, 130, 74, 'case'),
      piece(880, 200, 130, 74, 'case'),
      piece(280, 480, 130, 74, 'case'),
      piece(880, 480, 130, 74, 'case'),
      piece(1080, 180, 110, 60, 'desk'),
      piece(596, 296, 40, 40, 'pillar'),
      piece(596, 500, 40, 40, 'pillar'),
      piece(120, 600, 54, 54, 'plant'),
      piece(1160, 600, 54, 54, 'plant'),
    ],
    // Velvet ropes flanking the bust: low barriers, see over them.
    ropes: [
      { x: 860, y: 330, w: 220, h: 12 },
      { x: 860, y: 470, w: 220, h: 12 },
    ],
    ducts: [{ x: 40, y: 648, w: 1060, h: 40 }],
    lamps: [{ x: 320, y: 140 }, { x: 960, y: 140 }, { x: 640, y: 640 }],
    lasers: [],
    doors: [],
    keycard: null,
    loot: [
      { x: 970, y: 400, kind: 'bust', value: 1200, target: true, taken: false, label: 'STARLIT BUST' },
      { x: 345, y: 237, kind: 'mini', value: 150, target: false, taken: false, label: 'MINIATURE' },
      { x: 645, y: 237, kind: 'mini', value: 150, target: false, taken: false, label: 'MINIATURE' },
      { x: 945, y: 237, kind: 'mini', value: 150, target: false, taken: false, label: 'MINIATURE' },
      { x: 345, y: 517, kind: 'vase', value: 150, target: false, taken: false, label: 'JADE VASE' },
      { x: 945, y: 517, kind: 'vase', value: 150, target: false, taken: false, label: 'JADE VASE' },
    ],
    guards: [
      { x: 300, y: 360, route: [[300, 360], [980, 360]], speed: 58 },
      { x: 220, y: 140, route: [[220, 140], [1060, 140]], speed: 58 },
    ],
    cams: [
      { x: 640, y: 84, base: Math.PI / 2, sweep: 0.7, speed: 0.55, range: 280, phase: 0 },
    ],
    spawn: { x: 90, y: 400 },
    exit: { x: 1150, y: 620, w: 110, h: 70 },
  };
}

function corridor() {
  return {
    name: 'ROOM 2 — THE VAULT CORRIDOR',
    sub: 'Past the guards, through the keycard door',
    goal: 'Find the keycard, open the vault door, take the gold bars.',
    floorA: '#8a5f2a',
    floorB: '#77521f',
    walls: [
      ...rim(),
      bar(16, 230, 700, 18),   // top lane wall, left of the keycard door
      bar(860, 230, 404, 18),  // top lane wall, right of the keycard door
      bar(300, 460, 964, 18),  // middle lane wall: gap on the left
    ],
    cover: [
      piece(950, 120, 130, 74, 'case'),
      piece(1080, 520, 100, 80, 'safe'),
      piece(200, 520, 110, 60, 'desk'),
      piece(500, 540, 130, 74, 'case'),
      piece(120, 150, 54, 54, 'plant'),
      piece(640, 330, 40, 40, 'pillar'),
    ],
    ropes: [],
    ducts: [{ x: 340, y: 410, w: 600, h: 34 }],
    lamps: [{ x: 300, y: 140 }, { x: 900, y: 140 }, { x: 640, y: 620 }],
    lasers: [],
    doors: [
      { x: 716, y: 230, w: 144, h: 18, kind: 'keycard', open: false, label: 'KEYCARD DOOR' },
    ],
    keycard: { x: 555, y: 175, taken: false },
    loot: [
      { x: 990, y: 630, kind: 'bars', value: 1500, target: true, taken: false, label: 'GOLD BARS' },
      { x: 1015, y: 157, kind: 'canvas', value: 200, target: false, taken: false, label: 'MOONLIT CANVAS' },
      { x: 255, y: 550, kind: 'gem', value: 200, target: false, taken: false, label: 'RUBY' },
      { x: 565, y: 577, kind: 'bars', value: 250, target: false, taken: false, label: 'GOLD BARS' },
    ],
    guards: [
      { x: 150, y: 150, route: [[150, 150], [900, 150]], speed: 60 },
      { x: 900, y: 350, route: [[900, 350], [300, 350]], speed: 55 },
      { x: 300, y: 600, route: [[300, 600], [1000, 600]], speed: 60 },
    ],
    cams: [
      { x: 340, y: 84, base: Math.PI / 2, sweep: 0.6, speed: 0.6, range: 280, phase: 0 },
      { x: 940, y: 700, base: -Math.PI / 2, sweep: 0.6, speed: 0.6, range: 280, phase: 1.5 },
    ],
    spawn: { x: 90, y: 150 },
    exit: { x: 1150, y: 620, w: 110, h: 70 },
  };
}

function vault() {
  return {
    name: 'ROOM 3 — THE VAULT',
    sub: 'The Aurora Diamond waits behind the vault door',
    goal: 'Take the Aurora Diamond, then get out through the getaway door.',
    floorA: '#6e6a66',
    floorB: '#5d5a56',
    walls: [
      ...rim(),
      bar(480, 80, 16, 180),   // vault alcove, left cheek
      bar(784, 80, 16, 180),   // vault alcove, right cheek
      bar(496, 244, 104, 16),  // vault front, left of the door gap
      bar(680, 244, 104, 16),  // vault front, right of the door gap
    ],
    cover: [
      piece(240, 300, 90, 80, 'safe'),
      piece(950, 300, 90, 80, 'safe'),
      piece(240, 480, 90, 80, 'safe'),
      piece(950, 480, 90, 80, 'safe'),
      piece(120, 620, 54, 54, 'plant'),
      piece(1100, 120, 54, 54, 'plant'),
    ],
    ropes: [],
    ducts: [
      { x: 120, y: 648, w: 220, h: 40 },
      { x: 920, y: 648, w: 200, h: 40 },
    ],
    lamps: [{ x: 300, y: 140 }, { x: 980, y: 140 }, { x: 640, y: 620 }],
    lasers: [
      { x1: 400, y1: 300, x2: 880, y2: 300 },
      { x1: 400, y1: 460, x2: 880, y2: 460 },
    ],
    doors: [],
    keycard: null,
    loot: [
      { x: 640, y: 160, kind: 'diamond', value: 2000, target: true, taken: false, label: 'AURORA DIAMOND' },
      { x: 300, y: 200, kind: 'pile', value: 300, target: false, taken: false, label: 'GOLD PILE' },
      { x: 980, y: 200, kind: 'pile', value: 300, target: false, taken: false, label: 'GOLD PILE' },
      { x: 300, y: 560, kind: 'pile', value: 300, target: false, taken: false, label: 'GOLD PILE' },
      { x: 980, y: 560, kind: 'pile', value: 300, target: false, taken: false, label: 'GOLD PILE' },
      { x: 420, y: 380, kind: 'bars', value: 250, target: false, taken: false, label: 'GOLD BARS' },
      { x: 860, y: 380, kind: 'bars', value: 250, target: false, taken: false, label: 'GOLD BARS' },
    ],
    guards: [
      { x: 250, y: 330, route: [[250, 330], [1030, 330]], speed: 62 },
      { x: 250, y: 580, route: [[250, 580], [1030, 580]], speed: 62 },
    ],
    cams: [
      { x: 200, y: 84, base: Math.PI / 2, sweep: 0.55, speed: 0.7, range: 280, phase: 0 },
      { x: 640, y: 84, base: Math.PI / 2, sweep: 0.55, speed: 0.7, range: 280, phase: 1.2 },
      { x: 1080, y: 84, base: Math.PI / 2, sweep: 0.55, speed: 0.7, range: 280, phase: 2.4 },
    ],
    spawn: { x: 640, y: 650 },
    exit: { x: 1150, y: 620, w: 110, h: 70 },
  };
}

export function buildRooms() {
  return [gallery(), corridor(), vault()];
}

function blocksSight(kind) {
  return kind === 'case' || kind === 'desk' || kind === 'safe' || kind === 'pillar';
}

// Every rectangle that stops movement: walls, all cover, ropes,
// and doors that are still closed.
export function solidsOf(room) {
  const out = [...room.walls, ...room.cover, ...room.ropes];
  for (const d of room.doors) {
    if (!d.open) out.push(d);
  }
  return out;
}

// Rectangles that block a sight line: walls, tall cover, closed doors.
export function sightOf(room) {
  const out = [...room.walls];
  for (const c of room.cover) {
    if (blocksSight(c.kind)) out.push(c);
  }
  for (const d of room.doors) {
    if (!d.open) out.push(d);
  }
  return out;
}

// Slide a circle through the solids, one axis at a time.
export function moveCircle(x, y, r, dx, dy, solids) {
  let nx = x;
  let ny = y;
  let hit = false;
  for (const s of solids) {
    const [px] = pushCircleOutOfRect(x + dx, y, r, s);
    if (px !== x + dx) { hit = true; break; }
  }
  if (!hit) nx = x + dx;
  hit = false;
  for (const s of solids) {
    const [, py] = pushCircleOutOfRect(nx, y + dy, r, s);
    if (py !== y + dy) { hit = true; break; }
  }
  if (!hit) ny = y + dy;
  return { x: nx, y: ny };
}

// True when the circle overlaps any solid.
export function circleBlocked(x, y, r, solids) {
  for (const s of solids) {
    const [px, py] = pushCircleOutOfRect(x, y, r, s);
    if (px !== x || py !== y) return true;
  }
  return false;
}

// level.js — the three rooms of the heist and the collision helpers.
// Every room is plain data: walls, cover, loot, guards, cameras, the
// keycard door, the player's start and the getaway exit. buildRooms()
// returns fresh copies so a retry starts from a clean room.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const HUD_TOP = 72;
export const PLAYER_RADIUS = 14;
export const WALL = 14;

function borderWalls() {
  return [
    { x: 0, y: HUD_TOP, w: VIEW_WIDTH, h: WALL, blocksSight: true, blocksMove: true },
    { x: 0, y: VIEW_HEIGHT - WALL, w: VIEW_WIDTH, h: WALL, blocksSight: true, blocksMove: true },
    { x: 0, y: HUD_TOP, w: WALL, h: VIEW_HEIGHT - HUD_TOP, blocksSight: true, blocksMove: true },
    { x: VIEW_WIDTH - WALL, y: HUD_TOP, w: WALL, h: VIEW_HEIGHT - HUD_TOP, blocksSight: true, blocksMove: true },
  ];
}

function wall(x, y, w, h) {
  return { x, y, w, h, blocksSight: true, blocksMove: true };
}

function crate(x, y, w, h) {
  return { x, y, w, h, kind: 'crate', blocksSight: true, blocksMove: true };
}

function desk(x, y, w, h) {
  return { x, y, w, h, kind: 'desk', blocksSight: true, blocksMove: true };
}

function plant(x, y, w, h) {
  return { x, y, w, h, kind: 'plant', blocksSight: false, blocksMove: true };
}

function galleryRoom() {
  return {
    name: 'ROOM 1 — THE GALLERY',
    subtitle: 'Midnight at the Marlowe Museum',
    objective: 'Steal the Starlit Bust, then reach the getaway door.',
    floorTint: '#1b2133',
    floorTintAlt: '#171d2d',
    walls: [
      ...borderWalls(),
      wall(380, HUD_TOP, 16, 228),      // top stub: left lane opens below it
      wall(884, 420, 16, VIEW_HEIGHT - WALL - 420), // bottom stub: right lane opens above it
      wall(560, 430, 200, 16),          // mid block: splits the middle lane
    ],
    cover: [
      crate(200, 180, 70, 50),
      crate(1000, 180, 70, 50),
      desk(560, 560, 80, 50),
      crate(180, 480, 60, 60),
      crate(1060, 520, 60, 60),
      plant(640, 240, 44, 44),
    ],
    vents: [
      { x: 420, y: 640, w: 120, h: 26 },
      { x: 900, y: 120, w: 120, h: 26 },
    ],
    doors: [],
    keycard: null,
    loot: [
      { x: 640, y: 150, kind: 'painting', value: 800, required: true, taken: false, label: 'STARLIT BUST' },
      { x: 150, y: 640, kind: 'vase', value: 300, required: false, taken: false, label: 'JADE VASE' },
      { x: 1150, y: 120, kind: 'gem', value: 350, required: false, taken: false, label: 'OPAL' },
    ],
    guards: [
      { x: 300, y: 180, waypoints: [[300, 180], [980, 180]], speed: 55 },
      { x: 980, y: 600, waypoints: [[980, 600], [300, 600]], speed: 55 },
    ],
    cameras: [
      { x: 640, y: HUD_TOP + 8, baseFacing: Math.PI / 2, sweep: 0.6, speed: 0.5, range: 260 },
    ],
    playerStart: { x: 120, y: 650 },
    exit: { x: 1140, y: 628, w: 110, h: 62, label: 'GETAWAY' },
  };
}

function corridorRoom() {
  return {
    name: 'ROOM 2 — THE VAULT CORRIDOR',
    subtitle: 'Past the guards, through the keycard door',
    objective: 'Find the keycard, open the vault door, take the gold bars.',
    floorTint: '#221d2e',
    floorTintAlt: '#1d1929',
    walls: [
      ...borderWalls(),
      wall(60, 260, 640, 16),            // upper corridor wall: gap on the right
      wall(580, 460, 640, 16),           // lower corridor wall: gap on the left
      wall(60, 260, 16, 200),            // alcove wall for the keycard nook
    ],
    cover: [
      crate(300, 340, 70, 50),
      crate(950, 340, 70, 50),
      desk(500, 560, 80, 50),
      crate(900, 560, 60, 60),
      plant(1100, 200, 44, 44),
    ],
    vents: [
      { x: 760, y: 640, w: 120, h: 26 },
      { x: 180, y: 120, w: 120, h: 26 },
    ],
    doors: [
      { x: 640, y: 276, w: 16, h: 184, locked: 'keycard', open: false, label: 'KEYCARD DOOR' },
    ],
    keycard: { x: 200, y: 560, taken: false },
    loot: [
      { x: 1100, y: 150, kind: 'gold', value: 1200, required: true, taken: false, label: 'GOLD BARS' },
      { x: 150, y: 150, kind: 'painting', value: 400, required: false, taken: false, label: 'MOONLIT CANVAS' },
      { x: 640, y: 640, kind: 'gem', value: 350, required: false, taken: false, label: 'RUBY' },
    ],
    guards: [
      { x: 250, y: 170, waypoints: [[250, 170], [1000, 170]], speed: 58 },
      { x: 700, y: 330, waypoints: [[700, 330], [700, 420]], speed: 50 },
      { x: 1000, y: 620, waypoints: [[1000, 620], [250, 620]], speed: 58 },
    ],
    cameras: [
      { x: 340, y: HUD_TOP + 8, baseFacing: Math.PI / 2, sweep: 0.55, speed: 0.6, range: 260 },
      { x: 940, y: HUD_TOP + 8, baseFacing: Math.PI / 2, sweep: 0.55, speed: 0.6, range: 260 },
    ],
    playerStart: { x: 120, y: 650 },
    exit: { x: 1140, y: 628, w: 110, h: 62, label: 'GETAWAY' },
  };
}

function vaultRoom() {
  return {
    name: 'ROOM 3 — THE VAULT',
    subtitle: 'The Aurora Diamond is behind the vault door',
    objective: 'Take the Aurora Diamond, then get out through the getaway door.',
    floorTint: '#1d2b26',
    floorTintAlt: '#192620',
    walls: [
      ...borderWalls(),
      wall(480, HUD_TOP, 16, 188),      // vault alcove, left cheek
      wall(784, HUD_TOP, 16, 188),      // vault alcove, right cheek
      wall(496, 244, 104, 16),          // vault front, left of the door gap
      wall(680, 244, 104, 16),          // vault front, right of the door gap
    ],
    cover: [
      crate(250, 500, 70, 50),
      crate(1000, 500, 70, 50),
      desk(420, 560, 80, 50),
      desk(820, 560, 80, 50),
      plant(640, 420, 44, 44),
    ],
    vents: [
      { x: 180, y: 640, w: 120, h: 26 },
      { x: 980, y: 640, w: 120, h: 26 },
    ],
    doors: [],
    keycard: null,
    loot: [
      { x: 640, y: 145, kind: 'diamond', value: 2500, required: true, taken: false, label: 'AURORA DIAMOND' },
      { x: 545, y: 178, kind: 'gold', value: 600, required: false, taken: false, label: 'GOLD BARS' },
      { x: 735, y: 178, kind: 'gold', value: 600, required: false, taken: false, label: 'GOLD BARS' },
    ],
    guards: [
      { x: 300, y: 380, waypoints: [[300, 380], [980, 380]], speed: 62 },
      { x: 640, y: 620, waypoints: [[640, 620], [640, 430]], speed: 55 },
    ],
    cameras: [
      { x: 200, y: HUD_TOP + 8, baseFacing: Math.PI / 2, sweep: 0.5, speed: 0.7, range: 260 },
      { x: 640, y: HUD_TOP + 8, baseFacing: Math.PI / 2, sweep: 0.5, speed: 0.7, range: 260 },
      { x: 1080, y: HUD_TOP + 8, baseFacing: Math.PI / 2, sweep: 0.5, speed: 0.7, range: 260 },
    ],
    playerStart: { x: 120, y: 650 },
    exit: { x: 1140, y: 628, w: 110, h: 62, label: 'GETAWAY' },
  };
}

export function buildRooms() {
  return [galleryRoom(), corridorRoom(), vaultRoom()];
}

// Every rectangle that stops movement: walls, tall cover and doors
// that are still closed.
export function solidsOf(room) {
  const solids = [...room.walls, ...room.cover];
  for (const door of room.doors) {
    if (!door.open) solids.push({ ...door, blocksSight: true, blocksMove: true });
  }
  return solids;
}

// Circle (the thief) against a list of solid rectangles.
export function circleHitsSolids(x, y, r, solids) {
  for (const s of solids) {
    const nearestX = Math.max(s.x, Math.min(x, s.x + s.w));
    const nearestY = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

// Move the circle one axis at a time so it slides along walls instead
// of sticking to them.
export function moveCircleWithCollision(x, y, r, dx, dy, solids) {
  let nx = x;
  let ny = y;
  if (!circleHitsSolids(x + dx, y, r, solids)) nx = x + dx;
  if (!circleHitsSolids(nx, y + dy, r, solids)) ny = y + dy;
  return { x: nx, y: ny };
}

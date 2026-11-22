// shots.js — deterministic scene presets for the entry screenshots.
// Each preset puts the live game into a real, playable state (a room,
// a thief position, guards mid-patrol, an alarm level) and freezes
// the patrols, so a screenshot is a genuine render of the game's own
// code with a staged, readable composition.
// ?scene=cover | corridor | vault | getaway

export function sceneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('scene') || '';
}

// Mark loot taken by index inside a room (carried loot from earlier
// rooms counts toward the HUD total).
function takeLoot(state, roomIdx, indexes) {
  for (const i of indexes) {
    state.rooms[roomIdx].loot[i].taken = true;
  }
}

// Arrange one screenshot scene on a freshly started game state.
export function applyScene(state, scene) {
  state.frozen = true;
  if (scene === 'cover') {
    // Room 1, the deciding moment: the thief mid-room by the Starlit
    // Bust, two guard cones almost touching him, one camera sweeping
    // in, alarm at 35%, loot glowing, getaway door visible.
    state.roomIndex = 0;
    takeLoot(state, 0, [1, 3]);
    state.thief.x = 830;
    state.thief.y = 400;
    state.thief.dir = 0;
    state.alarm = 35;
    state.guards[0].x = 700;
    state.guards[0].y = 360;
    state.guards[0].dir = 0.3;
    state.guards[0].alert = 0.6;
    state.guards[1].x = 990;
    state.guards[1].y = 350;
    state.guards[1].dir = 2.84;
    state.cams[0].dir = Math.PI / 2 + 0.35;
    state.banner = 'Two cones nearly on you — the Starlit Bust is right there.';
    state.bannerUntil = Infinity;
  } else if (scene === 'corridor') {
    // Room 2: the thief in a smoke cloud by the keycard door, the
    // camera knocked out by EMP, a guard walking to a tossed coin,
    // gold bars glowing in the nook.
    state.roomIndex = 1;
    takeLoot(state, 0, [1, 2, 3, 4, 5]);
    takeLoot(state, 1, [1]);
    state.thief.x = 790;
    state.thief.y = 310;
    state.thief.dir = Math.PI / 2;
    state.thief.keycard = true;
    state.rooms[1].keycard.taken = true;
    state.rooms[1].doors[0].open = true;
    state.alarm = 55;
    state.empLeft = 999;
    state.clouds.push({ x: 790, y: 310, r: 100, ttl: 999 });
    state.coins.push({ x: 900, y: 350, ttl: 1.2, life: 1.2 });
    state.guards[0].x = 500;
    state.guards[0].y = 150;
    state.guards[0].dir = Math.PI / 2;
    state.guards[1].x = 855;
    state.guards[1].y = 350;
    state.guards[1].dir = 0;
    state.guards[1].mode = 'investigate';
    state.guards[2].x = 850;
    state.guards[2].y = 600;
    state.guards[2].dir = Math.PI;
    state.banner = 'Keycard in hand — EMP down, smoke up, through the vault door.';
    state.bannerUntil = Infinity;
  } else if (scene === 'vault') {
    // Room 3: the thief at the Aurora Diamond, two guard cones
    // crossing behind him, loot over $2,400, alarm at 70%.
    state.roomIndex = 2;
    takeLoot(state, 0, [1, 2, 3, 4, 5]);
    takeLoot(state, 1, [1, 2, 3]);
    takeLoot(state, 2, [1, 2, 3, 4, 5, 6]);
    state.thief.x = 640;
    state.thief.y = 255;
    state.thief.dir = -Math.PI / 2;
    state.alarm = 70;
    state.guards[0].x = 500;
    state.guards[0].y = 330;
    state.guards[0].dir = -0.9;
    state.guards[0].alert = 0.8;
    state.guards[1].x = 780;
    state.guards[1].y = 330;
    state.guards[1].dir = Math.PI + 0.9;
    state.guards[1].alert = 0.8;
    state.cams[1].dir = Math.PI / 2 - 0.4;
    state.banner = 'The Aurora Diamond is in reach — grab it and run.';
    state.bannerUntil = Infinity;
  } else if (scene === 'getaway') {
    // Room 3, the payoff: the diamond taken, the thief slipping out
    // the glowing getaway door through smoke as a guard closes in.
    state.roomIndex = 2;
    takeLoot(state, 0, [1, 2, 3, 4, 5]);
    takeLoot(state, 1, [1, 2, 3]);
    takeLoot(state, 2, [0, 1, 2, 3, 4, 5, 6]);
    state.thief.x = 1195;
    state.thief.y = 655;
    state.thief.dir = 0;
    state.alarm = 82;
    state.clouds.push({ x: 1080, y: 620, r: 100, ttl: 999 });
    state.guards[0].x = 900;
    state.guards[0].y = 330;
    state.guards[0].dir = 0.4;
    state.guards[1].x = 980;
    state.guards[1].y = 600;
    state.guards[1].dir = 0.15;
    state.guards[1].mode = 'pursue';
    state.cams[0].dir = Math.PI / 2 + 0.5;
    state.cams[2].dir = Math.PI / 2 - 0.5;
    state.banner = 'Diamond in the bag — out the getaway door before the alarm blows.';
    state.bannerUntil = Infinity;
  }
}

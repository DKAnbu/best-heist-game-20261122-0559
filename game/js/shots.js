// shots.js — deterministic scene presets for the entry screenshots.
// Each preset puts the live game into a real, playable state (a room,
// a thief position, guards mid-patrol, an alarm level) and starts it,
// so a screenshot is a genuine render of the game's own code.
// ?scene=cover | corridor | vault | caught

export function sceneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('scene') || '';
}

// Arrange one screenshot scene on a freshly started game state.
export function applyScene(state, scene) {
  if (scene === 'cover') {
    state.roomIndex = 0;
    state.player.x = 560;
    state.player.y = 480;
    state.player.facing = -Math.PI / 2;
    state.alarm = 34;
    state.guards[0].x = 420;
    state.guards[0].y = 180;
    state.guards[0].facing = 0.5;
    state.guards[1].x = 900;
    state.guards[1].y = 600;
    state.guards[1].facing = Math.PI;
    state.cameras[0].facing = Math.PI / 2 + 0.4;
    state.banner = 'Sneak past the patrols — the Starlit Bust is upstairs.';
    state.bannerUntil = Infinity;
  } else if (scene === 'corridor') {
    state.roomIndex = 1;
    state.player.x = 620;
    state.player.y = 380;
    state.player.facing = Math.PI;
    state.player.hasKeycard = true;
    state.room.doors[0].open = true;
    state.room.keycard.taken = true;
    state.alarm = 52;
    state.empUntil = Infinity;
    state.clouds.push({ x: 560, y: 300, r: 110, ttl: 999 });
    state.guards[0].x = 500;
    state.guards[0].y = 170;
    state.guards[0].facing = Math.PI / 2;
    state.guards[1].x = 700;
    state.guards[1].y = 420;
    state.guards[1].facing = Math.PI / 2; // facing away from the thief above
    state.guards[2].x = 850;
    state.guards[2].y = 620;
    state.guards[2].facing = Math.PI;
    state.banner = 'Keycard in hand — EMP down, smoke up, through the vault door.';
    state.bannerUntil = Infinity;
  } else if (scene === 'vault') {
    state.roomIndex = 2;
    state.player.x = 640;
    state.player.y = 300;
    state.player.facing = -Math.PI / 2;
    state.player.lootValue = 2400;
    state.alarm = 12;
    state.guards[0].x = 420;
    state.guards[0].y = 380;
    state.guards[0].facing = 0.3;
    state.guards[1].x = 640;
    state.guards[1].y = 520;
    state.guards[1].facing = Math.PI;
    state.cameras[1].facing = Math.PI / 2 - 0.4;
    state.banner = 'The Aurora Diamond is in the vault — grab it and run.';
    state.bannerUntil = Infinity;
  } else if (scene === 'caught') {
    state.roomIndex = 0;
    state.player.x = 640;
    state.player.y = 300;
    state.player.facing = Math.PI / 2;
    state.alarm = 96;
    state.guards[0].x = 640;
    state.guards[0].y = 210;
    state.guards[0].facing = Math.PI / 2;
    state.guards[0].state = 'chase';
    state.guards[1].x = 760;
    state.guards[1].y = 420;
    state.guards[1].facing = -Math.PI / 2;
    state.guards[1].state = 'suspicious';
    state.cameras[0].facing = Math.PI / 2;
    state.cameras[0].seesThief = true;
    state.banner = 'The camera saw you — the alarm is about to blow.';
    state.bannerUntil = Infinity;
  }
}

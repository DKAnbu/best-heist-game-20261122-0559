// camera.js — a wall-mounted security camera: sweeps its amber cone
// back and forth, spots the thief, and goes dark while an EMP lasts.
// Drawn as a real wall unit (mount + body + blinking red lens + CAM
// tag) so it reads at thumbnail size.

import { inCone, hiddenBySmoke, insideDuct } from './vision.js';

export const CAM_HALF = 0.42;

export function spawnCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    phase: def.phase,
    range: def.range,
    half: CAM_HALF,
    dir: def.base,
    seen: false,
    flash: 0,
  };
}

// empLeft > 0 means every camera is knocked out right now.
// Returns true while this camera has eyes on the thief.
export function stepCamera(cam, dt, t, thief, sight, ducts, clouds, empLeft) {
  if (empLeft > 0) {
    cam.seen = false;
    cam.flash = Math.max(0, cam.flash - dt);
    return false;
  }
  cam.dir = cam.base + Math.sin(t * cam.speed + cam.phase) * cam.sweep;
  const concealed = hiddenBySmoke(thief.x, thief.y, clouds) || insideDuct(thief.x, thief.y, ducts);
  cam.seen = !concealed && inCone(thief.x, thief.y, cam.x, cam.y, cam.dir, cam.range, cam.half, sight);
  cam.flash = cam.seen ? 0.4 : Math.max(0, cam.flash - dt);
  return cam.seen;
}

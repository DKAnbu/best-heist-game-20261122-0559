// camera.js — a wall-mounted security camera: sweeps its cone back and
// forth, spots the thief, and goes dark while an EMP pulse lasts.

import { watcherSeesThief } from './vision.js';

export const CAMERA_HALF_ANGLE = 0.45;

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseFacing: def.baseFacing,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    halfAngle: CAMERA_HALF_ANGLE,
    facing: def.baseFacing,
    disabledUntil: 0,
    seesThief: false,
    spottedFlash: 0,
  };
}

export function updateCamera(camera, dt, time, thief, solids, clouds, empActive) {
  if (empActive) {
    camera.seesThief = false;
    camera.spottedFlash = Math.max(0, camera.spottedFlash - dt);
    return false;
  }
  camera.facing = camera.baseFacing + Math.sin(time * camera.speed) * camera.sweep;
  camera.seesThief = watcherSeesThief(camera, thief.x, thief.y, solids, clouds);
  if (camera.seesThief) camera.spottedFlash = 0.35;
  else camera.spottedFlash = Math.max(0, camera.spottedFlash - dt);
  return camera.seesThief;
}

export function cameraIsDisabled(camera) {
  return camera.disabledUntil > 0;
}

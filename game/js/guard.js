// guard.js — one patrolling guard: walks a waypoint loop, gets
// suspicious when he catches a glimpse of the thief, chases when the
// alarm is high, and walks over to investigate a thrown coin.

import { distanceBetween, watcherSeesThief } from './vision.js';

export const GUARD_RANGE = 230;
export const GUARD_HALF_ANGLE = 0.6;

export function makeGuard(def) {
  return {
    x: def.x,
    y: def.y,
    waypoints: def.waypoints.map(([wx, wy]) => ({ x: wx, y: wy })),
    waypointIndex: 1,
    speed: def.speed,
    facing: Math.PI / 2,
    range: GUARD_RANGE,
    halfAngle: GUARD_HALF_ANGLE,
    state: 'patrol',        // patrol | suspicious | chase | investigate
    stateTime: 0,
    lastSeenX: def.x,
    lastSeenY: def.y,
    investigateX: 0,
    investigateY: 0,
    seesThief: false,
    bobPhase: Math.random() * Math.PI * 2,
  };
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  return dist - step < 2;
}

// One simulation step. Returns 'spotted' while the guard has eyes on
// the thief this frame, so the alarm can rise.
export function updateGuard(guard, dt, thief, solids, clouds, alarm, time) {
  guard.stateTime += dt;
  guard.seesThief = watcherSeesThief(guard, thief.x, thief.y, solids, clouds);

  if (guard.seesThief) {
    guard.lastSeenX = thief.x;
    guard.lastSeenY = thief.y;
    if (alarm >= 70) {
      guard.state = 'chase';
      guard.stateTime = 0;
    } else if (guard.state === 'patrol') {
      guard.state = 'suspicious';
      guard.stateTime = 0;
    }
  }

  if (guard.state === 'chase') {
    moveToward(guard, thief.x, thief.y, 150, dt);
    if (!guard.seesThief && guard.stateTime > 2.5) {
      guard.state = 'suspicious';
      guard.stateTime = 0;
    }
    return guard.seesThief;
  }

  if (guard.state === 'suspicious') {
    const arrived = moveToward(guard, guard.lastSeenX, guard.lastSeenY, 110, dt);
    if (arrived || guard.stateTime > 4) {
      guard.state = 'patrol';
      guard.stateTime = 0;
    }
    return guard.seesThief;
  }

  if (guard.state === 'investigate') {
    const arrived = moveToward(guard, guard.investigateX, guard.investigateY, 95, dt);
    if (arrived) {
      guard.facing += dt * 1.6; // looks around, puzzled
      if (guard.stateTime > 3.5) {
        guard.state = 'patrol';
        guard.stateTime = 0;
      }
    }
    return guard.seesThief;
  }

  // Patrol: walk the waypoint loop.
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = moveToward(guard, target.x, target.y, guard.speed, dt);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  }
  guard.bobPhase += dt * 6;
  return guard.seesThief;
}

// A coin just landed: the nearest guard in earshot walks over to look.
export function distractGuard(guard, x, y) {
  if (distanceBetween(guard.x, guard.y, x, y) > 340) return false;
  if (guard.state === 'chase') return false;
  guard.state = 'investigate';
  guard.stateTime = 0;
  guard.investigateX = x;
  guard.investigateY = y;
  return true;
}

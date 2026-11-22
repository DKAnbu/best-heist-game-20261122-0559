// guard.js — one patrolling guard: walks a route loop, grows wary
// when he glimpses the thief, gives chase once the alarm is high,
// and walks over to look at a thrown coin.
// The guard is drawn BIG (radius 24) so he reads as a person, not a dot.

import { inCone, hiddenBySmoke, insideDuct, angleLerp } from './vision.js';

export const GUARD_R = 24;
export const GUARD_RANGE = 210;
export const GUARD_HALF = 0.55;
export const CHASE_ALARM = 60;

export function spawnGuard(def) {
  return {
    x: def.x,
    y: def.y,
    route: def.route.map(([rx, ry]) => ({ x: rx, y: ry })),
    routeIdx: 1,
    pauseLeft: 0,
    speed: def.speed,
    dir: Math.PI / 2,
    range: GUARD_RANGE,
    half: GUARD_HALF,
    // patrol | prowl (going to look) | investigate (coin) | pursue
    mode: 'patrol',
    modeT: 0,
    alert: 0, // 0 calm .. 1 certain; drives the "?" badge
    seen: false,
    lastX: def.x,
    lastY: def.y,
    invX: 0,
    invY: 0,
    phase: Math.random() * Math.PI * 2,
  };
}

function stepToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return true;
  const step = Math.min(dist, speed * dt);
  g.x += (dx / dist) * step;
  g.y += (dy / dist) * step;
  g.dir = Math.atan2(dy, dx);
  return dist - step < 3;
}

// One simulation step. Returns true while the guard has eyes on the
// thief this frame, so the alarm can rise.
export function stepGuard(g, dt, thief, sight, ducts, clouds, alarm, t) {
  g.modeT += dt;
  g.phase += dt * 5;
  const concealed = hiddenBySmoke(thief.x, thief.y, clouds) || insideDuct(thief.x, thief.y, ducts);
  g.seen = !concealed && inCone(thief.x, thief.y, g.x, g.y, g.dir, g.range, g.half, sight);

  if (g.seen) {
    g.lastX = thief.x;
    g.lastY = thief.y;
    g.alert = Math.min(1, g.alert + dt * 2.5);
    if (alarm >= CHASE_ALARM) {
      if (g.mode !== 'pursue') { g.mode = 'pursue'; g.modeT = 0; }
    } else if (g.mode === 'patrol') {
      g.mode = 'prowl';
      g.modeT = 0;
    }
  } else {
    g.alert = Math.max(0, g.alert - dt * 0.4);
  }

  if (g.mode === 'pursue') {
    stepToward(g, thief.x, thief.y, 138, dt);
    if (!g.seen && g.modeT > 2.5) { g.mode = 'prowl'; g.modeT = 0; }
    return g.seen;
  }

  if (g.mode === 'prowl') {
    const arrived = stepToward(g, g.lastX, g.lastY, 108, dt);
    if (arrived) {
      // Stand and scan the spot before giving up.
      g.dir += Math.sin(t * 2 + g.phase) * dt * 1.4;
      if (g.modeT > 4) { g.mode = 'patrol'; g.modeT = 0; }
    }
    return g.seen;
  }

  if (g.mode === 'investigate') {
    const arrived = stepToward(g, g.invX, g.invY, 96, dt);
    if (arrived) {
      g.dir += dt * 1.8; // looks around, puzzled
      if (g.modeT > 3.5) { g.mode = 'patrol'; g.modeT = 0; }
    }
    return g.seen;
  }

  // Patrol: walk the route loop, pausing and scanning at each stop.
  if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    g.dir += Math.sin(t * 1.5 + g.phase) * dt * 0.9;
    return g.seen;
  }
  const target = g.route[g.routeIdx];
  const arrived = stepToward(g, target.x, target.y, g.speed, dt);
  if (arrived) {
    g.routeIdx = (g.routeIdx + 1) % g.route.length;
    g.pauseLeft = 0.7;
  }
  return g.seen;
}

// A coin just landed: the nearest guard in earshot walks over to look.
export function lureGuard(g, x, y) {
  const dx = g.x - x;
  const dy = g.y - y;
  if (dx * dx + dy * dy > 340 * 340) return false;
  if (g.mode === 'pursue') return false;
  g.mode = 'investigate';
  g.modeT = 0;
  g.invX = x;
  g.invY = y;
  return true;
}

export function guardBadge(g) {
  if (g.mode === 'pursue') return '!';
  if (g.mode === 'prowl' || g.mode === 'investigate') return '?';
  if (g.alert > 0.35) return '?';
  return '';
}

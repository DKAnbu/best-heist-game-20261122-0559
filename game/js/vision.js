// vision.js — pure geometry for sight lines and vision cones.
// Nothing here touches the canvas or the game state; guard.js and
// camera.js ask these helpers whether an eye can see the thief.

export function distanceBetween(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
}

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the point (px, py) sits inside a vision cone whose tip is
// (ex, ey), facing `facing` radians, reaching `range` pixels wide and
// opening `halfAngle` radians to each side.
export function pointInsideCone(ex, ey, facing, range, halfAngle, px, py) {
  const dist = distanceBetween(ex, ey, px, py);
  if (dist > range) return false;
  if (dist < 12) return true;
  const toTarget = Math.atan2(py - ey, px - ex);
  return Math.abs(angleDifference(toTarget, facing)) <= halfAngle;
}

// Segment (x1,y1)-(x2,y2) against one axis-aligned rectangle.
// Uses the slab method: true when the segment crosses the rect.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

// True when any solid in `solids` blocks the sight line from the eye
// to the target. Walls and tall cover block sight; low cover does not.
export function sightLineBlocked(ex, ey, tx, ty, solids) {
  for (const solid of solids) {
    if (solid.blocksSight && segmentHitsRect(ex, ey, tx, ty, solid)) return true;
  }
  return false;
}

// True when the segment from eye to target passes through a smoke
// cloud, or the target is standing inside one.
export function sightLineSmoked(ex, ey, tx, ty, clouds) {
  for (const cloud of clouds) {
    if (distanceBetween(tx, ty, cloud.x, cloud.y) < cloud.r) return true;
    if (segmentHitsCircle(ex, ey, tx, ty, cloud.x, cloud.y, cloud.r)) return true;
  }
  return false;
}

export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return distanceBetween(x1, y1, cx, cy) < r;
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return distanceBetween(closestX, closestY, cx, cy) < r;
}

// Full visibility test for one watcher: cone + range + clear sight
// line + no smoke in the way. Returns true only when the watcher
// can actually see the thief right now.
export function watcherSeesThief(watcher, thiefX, thiefY, solids, clouds) {
  if (!pointInsideCone(watcher.x, watcher.y, watcher.facing, watcher.range,
      watcher.halfAngle, thiefX, thiefY)) return false;
  if (sightLineBlocked(watcher.x, watcher.y, thiefX, thiefY, solids)) return false;
  if (sightLineSmoked(watcher.x, watcher.y, thiefX, thiefY, clouds)) return false;
  return true;
}

// vision.js — line-of-sight and cone geometry for GILDED NIGHT.
// Pure geometry: no game state, no drawing. Every sight test in the
// game (guards, cameras) goes through inCone() here.

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// True when the segment (x0,y0)-(x1,y1) crosses any rect in blockers.
// Sampled in small steps: cheap, and exact enough for cone edges.
export function losBlocked(x0, y0, x1, y1, blockers) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    for (let j = 0; j < blockers.length; j++) {
      if (pointInRect(px, py, blockers[j])) return true;
    }
  }
  return false;
}

// True when (px,py) lies inside the watcher's cone and the line of
// sight is clear. angle = watcher facing, halfAngle = cone half-width.
export function inCone(px, py, wx, wy, angle, range, halfAngle, blockers) {
  const dx = px - wx;
  const dy = py - wy;
  const d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (d < 12) return true;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  return !losBlocked(wx, wy, px, py, blockers);
}

// True when the point sits inside any smoke cloud.
export function hiddenBySmoke(x, y, clouds) {
  for (const c of clouds) {
    const dx = x - c.x;
    const dy = y - c.y;
    if (dx * dx + dy * dy < c.r * c.r) return true;
  }
  return false;
}

// True when the point sits inside a service duct (crawling low).
export function insideDuct(x, y, ducts) {
  for (const d of ducts) {
    if (pointInRect(x, y, d)) return true;
  }
  return false;
}

// Push a circle (cx,cy,r) out of a rect; returns corrected [x, y].
export function pushCircleOutOfRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return [cx, cy];
  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    return [nx + (dx / d) * r, ny + (dy / d) * r];
  }
  // Centre inside the rect: push out along the smallest penetration.
  const left = cx - rect.x;
  const right = rect.x + rect.w - cx;
  const top = cy - rect.y;
  const bottom = rect.y + rect.h - cy;
  const m = Math.min(left, right, top, bottom);
  if (m === left) return [rect.x - r, cy];
  if (m === right) return [rect.x + rect.w + r, cy];
  if (m === top) return [cx, rect.y - r];
  return [cx, rect.y + rect.h + r];
}

export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy < rr * rr;
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function angleLerp(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

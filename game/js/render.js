// render.js — everything the player sees, drawn on one canvas.
// GILDED NIGHT: a warm midnight museum — honey parquet, teal-navy
// walls with gold trim, tungsten light pools against cool blue
// shadow. People are drawn BIG (guards r24, thief r20) with cones,
// badges and labels, so the whole heist reads at thumbnail size.
// The HUD lives on the canvas so a screenshot always carries it.

import { VIEW_W, VIEW_H, HUD_H } from './level.js';
import { targetTaken, totalLoot } from './player.js';
import { guardBadge } from './guard.js';

const GOLD = '#e8c15a';
const GOLD_DEEP = '#c9973a';
const CREAM = '#f2e6c8';
const DANGER = '#e5484d';
const SAFE = '#3fae5a';
const AMBER = '#e8a13a';
const CYAN = '#4dd8e6';

function drawCone(ctx, x, y, facing, range, half, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - half, facing + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, room) {
  ctx.fillStyle = room.floorA;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  // Honey parquet: staggered planks with visible seams.
  const pw = 76;
  const ph = 38;
  let row = 0;
  for (let y = HUD_H; y < VIEW_H; y += ph, row++) {
    const off = (row % 2) * (pw / 2);
    for (let x = -pw; x < VIEW_W + pw; x += pw) {
      const px = x + off;
      ctx.fillStyle = ((Math.floor(px / pw) + row) % 2 === 0) ? room.floorA : room.floorB;
      ctx.fillRect(px, y, pw, ph);
      ctx.strokeStyle = 'rgba(40, 20, 5, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, y + 0.5, pw - 1, ph - 1);
    }
  }
  if (room.lasers.length > 0) {
    // Vault steel plates: big panels + rivets.
    ctx.strokeStyle = 'rgba(20, 20, 22, 0.5)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= VIEW_W; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, HUD_H); ctx.lineTo(x, VIEW_H); ctx.stroke();
    }
    for (let y = HUD_H; y <= VIEW_H; y += 128) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(20, 20, 22, 0.55)';
    for (let x = 64; x < VIEW_W; x += 128) {
      for (let y = HUD_H + 64; y < VIEW_H; y += 128) {
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // Warm tungsten pools around lamps and target loot, cool blue shade
  // everywhere else: the room is never a flat dark void.
  const pools = [...room.lamps];
  for (const loot of room.loot) {
    if (loot.target && !loot.taken) pools.push({ x: loot.x, y: loot.y });
  }
  for (const p of pools) {
    const g = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 240);
    g.addColorStop(0, 'rgba(255, 190, 90, 0.20)');
    g.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x - 240, p.y - 240, 480, 480);
  }
  // Cool vignette at the edges.
  const v = ctx.createRadialGradient(640, 390, 260, 640, 390, 900);
  v.addColorStop(0, 'rgba(8, 18, 38, 0)');
  v.addColorStop(1, 'rgba(8, 18, 38, 0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
}

function drawDucts(ctx, room) {
  for (const d of room.ducts) {
    ctx.fillStyle = '#0b0e17';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = '#454e63';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
    ctx.strokeStyle = '#2a3145';
    ctx.lineWidth = 1;
    for (let sx = d.x + 14; sx < d.x + d.w; sx += 16) {
      ctx.beginPath();
      ctx.moveTo(sx, d.y + 4);
      ctx.lineTo(sx, d.y + d.h - 4);
      ctx.stroke();
    }
    ctx.fillStyle = '#7d8aa5';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SERVICE DUCT — CRAWL HERE, UNSEEN', d.x + d.w / 2, d.y + d.h / 2 + 3);
  }
}

function drawWalls(ctx, room) {
  for (const w of room.walls) {
    ctx.fillStyle = '#16323c';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(w.x, w.y, w.w, 3);
    ctx.strokeStyle = GOLD_DEEP;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x + 0.75, w.y + 0.75, w.w - 1.5, w.h - 1.5);
  }
}

function drawCover(ctx, room) {
  for (const c of room.cover) {
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    if (c.kind === 'case') {
      // Display case: dark wood base, glass top, glint, tiny treasure.
      ctx.fillStyle = '#4a2f1a';
      ctx.fillRect(c.x, c.y + c.h - 16, c.w, 16);
      ctx.fillStyle = '#5d3d22';
      ctx.fillRect(c.x, c.y, c.w, c.h - 16);
      ctx.fillStyle = 'rgba(191, 232, 255, 0.28)';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 24);
      ctx.strokeStyle = GOLD_DEEP;
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x + 14, c.y + c.h - 20);
      ctx.lineTo(c.x + c.w - 30, c.y + 8);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'desk') {
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#7d5230';
      ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10);
      ctx.strokeStyle = GOLD_DEEP;
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.fillStyle = '#f2e6c8';
      ctx.fillRect(c.x + 14, c.y + 12, 26, 18);
      ctx.fillRect(c.x + c.w - 44, c.y + c.h - 30, 26, 18);
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(cx, cy + 8, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'safe') {
      ctx.fillStyle = '#7a8290';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#5d6572';
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
      ctx.strokeStyle = '#2e333d';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.fillStyle = '#d8dde6';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2e333d';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GOLD;
      ctx.fillRect(cx + 16, cy - 3, 14, 6);
    } else if (c.kind === 'plant') {
      ctx.fillStyle = '#a34d28';
      ctx.beginPath();
      ctx.arc(cx, cy + 8, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c6e35';
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 8, 13, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 10, 14, 0, Math.PI * 2);
      ctx.arc(cx, cy - 18, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f8a48';
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 12, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'pillar') {
      ctx.fillStyle = '#cfc8b8';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = GOLD_DEEP;
      ctx.fillRect(c.x, c.y, c.w, 5);
      ctx.fillRect(c.x, c.y + c.h - 5, c.w, 5);
      ctx.strokeStyle = '#8f8878';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(c.x + 0.75, c.y + 0.75, c.w - 1.5, c.h - 1.5);
    }
  }
}

function drawRopes(ctx, room) {
  for (const r of room.ropes) {
    // Brass posts at both ends.
    for (const px of [r.x, r.x + r.w]) {
      ctx.fillStyle = '#8a6d2f';
      ctx.fillRect(px - 2, r.y - 14, 4, 26);
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(px, r.y - 14, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Red velvet sag between the posts.
    ctx.strokeStyle = '#a41220';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y - 10);
    ctx.quadraticCurveTo(r.x + r.w / 2, r.y + 16, r.x + r.w, r.y - 10);
    ctx.stroke();
    ctx.strokeStyle = '#d43a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y - 12);
    ctx.quadraticCurveTo(r.x + r.w / 2, r.y + 13, r.x + r.w, r.y - 12);
    ctx.stroke();
  }
}

function drawLasers(ctx, room, now) {
  ctx.save();
  ctx.setLineDash([16, 12]);
  ctx.lineDashOffset = -(now / 40);
  for (const l of room.lasers) {
    ctx.strokeStyle = 'rgba(255, 40, 50, 0.25)';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 60, 70, 0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.fillStyle = '#3a0d10';
    ctx.fillRect(l.x1 - 6, l.y1 - 8, 12, 16);
    ctx.fillRect(l.x2 - 6, l.y2 - 8, 12, 16);
  }
  ctx.restore();
}

function drawDoors(ctx, room) {
  for (const d of room.doors) {
    if (d.open) {
      ctx.fillStyle = '#0b0e17';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = SAFE;
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
      ctx.fillStyle = '#b8f0c4';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OPEN', d.x + d.w / 2, d.y + d.h / 2 + 3);
      continue;
    }
    ctx.fillStyle = '#7d8698';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = '#3a4152';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
    ctx.strokeStyle = '#5d6572';
    ctx.lineWidth = 1;
    for (let sx = d.x + 18; sx < d.x + d.w; sx += 18) {
      ctx.beginPath(); ctx.moveTo(sx, d.y + 3); ctx.lineTo(sx, d.y + d.h - 3); ctx.stroke();
    }
    // Keycard reader: glowing red while locked.
    ctx.fillStyle = '#ff5a5a';
    ctx.beginPath(); ctx.arc(d.x + d.w - 12, d.y + d.h / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd9a0';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, d.x + d.w / 2, d.y + d.h / 2 + 3);
  }
}

function drawExit(ctx, room, now) {
  const e = room.exit;
  const ready = targetTaken(room);
  const pulse = ready ? 0.45 + Math.sin(now * 0.006) * 0.25 : 0.14;
  ctx.fillStyle = `rgba(63, 174, 90, ${pulse})`;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = ready ? SAFE : '#2c7a44';
  ctx.lineWidth = ready ? 3 : 2;
  ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
  ctx.fillStyle = ready ? '#d8ffd8' : '#8fc79f';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY  →', e.x + e.w / 2, e.y + e.h / 2 - 4);
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(ready ? 'GO! GO! GO!' : 'STEAL THE TARGET FIRST', e.x + e.w / 2, e.y + e.h / 2 + 14);
  // Green EXIT sign on the wall above the zone.
  ctx.fillStyle = ready ? '#37d67a' : '#2c7a44';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y - 10);
}

function drawArtifact(ctx, loot, now) {
  const pulse = 1 + Math.sin(now * 0.004 + loot.x * 0.7) * 0.07;
  ctx.save();
  ctx.translate(loot.x, loot.y);
  ctx.scale(pulse, pulse);
  const haloR = loot.target ? 58 : 36;
  const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, haloR);
  halo.addColorStop(0, loot.kind === 'diamond' ? 'rgba(150, 220, 255, 0.6)' : 'rgba(232, 193, 90, 0.55)');
  halo.addColorStop(1, 'rgba(232, 193, 90, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fill();
  if (loot.kind === 'bust') {
    ctx.fillStyle = '#f2e6c8';
    ctx.fillRect(-19, 12, 38, 26);
    ctx.fillStyle = GOLD_DEEP;
    ctx.fillRect(-21, 10, 42, 5);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(0, -6, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-13, 10); ctx.lineTo(13, 10); ctx.lineTo(8, -2); ctx.lineTo(-8, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(-4, -9, 3, 0, Math.PI * 2); ctx.fill();
  } else if (loot.kind === 'diamond') {
    ctx.fillStyle = '#bfe8ff';
    ctx.beginPath();
    ctx.moveTo(0, -20); ctx.lineTo(17, -5); ctx.lineTo(0, 20); ctx.lineTo(-17, -5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(8, -5); ctx.lineTo(-8, -5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.moveTo(-17, -5); ctx.lineTo(17, -5); ctx.stroke();
  } else if (loot.kind === 'bars' || loot.kind === 'pile') {
    ctx.fillStyle = GOLD;
    ctx.fillRect(-16, -2, 14, 9);
    ctx.fillRect(-1, -2, 14, 9);
    ctx.fillRect(-9, -11, 14, 9);
    if (loot.kind === 'pile') {
      ctx.fillRect(-24, 7, 14, 9);
      ctx.fillRect(10, 7, 14, 9);
    }
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1;
    ctx.strokeRect(-16, -2, 14, 9);
    ctx.strokeRect(-1, -2, 14, 9);
    ctx.strokeRect(-9, -11, 14, 9);
  } else if (loot.kind === 'gem') {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(6, -2); ctx.lineTo(-6, -2); ctx.closePath(); ctx.fill();
  } else if (loot.kind === 'vase') {
    ctx.fillStyle = '#3f9e7a';
    ctx.beginPath();
    ctx.ellipse(0, 2, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-5, -15, 10, 7);
  } else if (loot.kind === 'canvas') {
    ctx.fillStyle = '#8a6d2f';
    ctx.fillRect(-17, -13, 34, 26);
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = '#7a4a8a';
    ctx.beginPath(); ctx.arc(0, -1, 7, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
  // Pedestal under pedestal loot, label + value under everything.
  if (loot.kind === 'bust' || loot.kind === 'diamond' || loot.kind === 'gem' ||
      loot.kind === 'vase' || loot.kind === 'canvas' || loot.kind === 'mini') {
    ctx.fillStyle = '#f2e6c8';
    ctx.fillRect(loot.x - 19, loot.y + 12, 38, 26);
    ctx.fillStyle = GOLD_DEEP;
    ctx.fillRect(loot.x - 21, loot.y + 10, 42, 5);
    ctx.fillRect(loot.x - 21, loot.y + 36, 42, 4);
  }
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(loot.label, loot.x, loot.y + 56);
  ctx.fillStyle = '#e8d9a8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('$' + loot.value, loot.x, loot.y + 70);
}

function drawKeycard(ctx, keycard, now) {
  const bob = Math.sin(now * 0.005) * 3;
  ctx.save();
  ctx.translate(keycard.x, keycard.y + bob);
  ctx.fillStyle = '#2fa8a0';
  ctx.fillRect(-13, -9, 26, 18);
  ctx.fillStyle = '#e8f6f4';
  ctx.fillRect(-10, -6, 11, 3);
  ctx.fillRect(-10, -1, 15, 3);
  ctx.restore();
  ctx.fillStyle = '#7fd8cf';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KEYCARD', keycard.x, keycard.y + 30);
}

function drawGuardCone(ctx, g) {
  drawCone(ctx, g.x, g.y, g.dir, g.range, g.half,
    g.seen ? 'rgba(255, 120, 90, 0.20)' : 'rgba(255, 214, 106, 0.15)',
    g.seen ? 'rgba(255, 120, 90, 0.55)' : 'rgba(255, 214, 106, 0.45)');
}

function drawGuard(ctx, g, now) {
  const bob = Math.sin(g.phase) * 1.5;
  const y = g.y + bob;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(g.x, g.y + 20, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Uniformed body: big navy disc, gold buttons down the front.
  ctx.fillStyle = '#22344d';
  ctx.beginPath(); ctx.arc(g.x, y, 24, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0d1520';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.dir) * 7, y + Math.sin(g.dir) * 7, 2.5, 0, Math.PI * 2);
  ctx.arc(g.x + Math.cos(g.dir) * 15, y + Math.sin(g.dir) * 15, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD_DEEP;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(g.x, y, 17, g.dir - 1.1, g.dir + 1.1);
  ctx.stroke();
  // Head + cap, turned toward the facing.
  const hx = g.x + Math.cos(g.dir) * 5;
  const hy = y + Math.sin(g.dir) * 5 - 4;
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(hx, hy, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#16233a';
  ctx.beginPath(); ctx.arc(hx, hy - 2, 11, Math.PI, 0); ctx.fill();
  ctx.fillRect(hx - 11, hy - 3, 22, 3);
  ctx.fillStyle = GOLD;
  ctx.fillRect(hx - 11, hy - 1, 22, 2);
  ctx.fillStyle = '#0d1320';
  ctx.beginPath();
  ctx.arc(hx + Math.cos(g.dir) * 4 - 3, hy + Math.sin(g.dir) * 4, 1.8, 0, Math.PI * 2);
  ctx.arc(hx + Math.cos(g.dir) * 4 + 3, hy + Math.sin(g.dir) * 4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Flashlight dot at the facing edge.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.dir) * 26, y + Math.sin(g.dir) * 26, 4, 0, Math.PI * 2);
  ctx.fill();
  // "?" while wary, "!" while chasing — big, above the head.
  const badge = guardBadge(g);
  if (badge) {
    const hot = badge === '!';
    ctx.fillStyle = hot ? DANGER : AMBER;
    ctx.beginPath(); ctx.arc(g.x, g.y - 38, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badge, g.x, g.y - 32);
  }
}

function drawCameraUnit(ctx, cam, empLeft, now) {
  const disabled = empLeft > 0;
  if (!disabled) {
    drawCone(ctx, cam.x, cam.y, cam.dir, cam.range, cam.half,
      cam.seen ? 'rgba(229, 72, 77, 0.30)' : 'rgba(229, 72, 77, 0.15)',
      cam.seen ? 'rgba(229, 72, 77, 0.85)' : 'rgba(229, 72, 77, 0.45)');
  }
  // Mount arm up to the wall, then the unit body + blinking lens.
  ctx.strokeStyle = '#2b3247';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cam.x, cam.y - 8); ctx.lineTo(cam.x, cam.y - 16); ctx.stroke();
  ctx.fillStyle = disabled ? '#3a3f4a' : '#232a38';
  ctx.beginPath(); ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = disabled ? '#6a707c' : DANGER;
  ctx.lineWidth = 2;
  ctx.stroke();
  const blink = disabled ? 0 : (Math.sin(now * 0.008) > 0 ? 1 : 0.25);
  ctx.fillStyle = disabled ? '#8a8f9c' : `rgba(255, 90, 90, ${blink})`;
  ctx.beginPath(); ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = disabled ? '#9aa1b2' : '#ffb3b3';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(disabled ? 'EMP' : 'CAM', cam.x, cam.y + 26);
}

function drawThief(ctx, t, now) {
  const bob = t.moving ? Math.sin(t.step) * 1.5 : 0;
  const y = t.y + bob;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(t.x, t.y + 16, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded cloak, white-cyan outline so the thief pops off the floor.
  ctx.fillStyle = '#241a2e';
  ctx.beginPath(); ctx.arc(t.x, y, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Hood point + shadowed face, turned toward the facing.
  ctx.fillStyle = '#120d18';
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.dir) * 6, y + Math.sin(t.dir) * 6 - 2, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CYAN;
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.dir) * 14, y + Math.sin(t.dir) * 14 - 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Loot satchel on the hip.
  const sx = t.x - Math.sin(t.dir) * 14;
  const sy = y + Math.cos(t.dir) * 14;
  ctx.fillStyle = '#a9803e';
  ctx.fillRect(sx - 6, sy - 5, 12, 10);
  ctx.strokeStyle = '#5d3d22';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx - 6, sy - 5, 12, 10);
}

function drawClouds(ctx, clouds) {
  for (const c of clouds) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + c.x * 0.01;
      ctx.fillStyle = 'rgba(205, 210, 220, 0.30)';
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(a) * c.r * 0.45, c.y + Math.sin(a) * c.r * 0.45, c.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(225, 230, 240, 0.22)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dfe6f2';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SMOKE', c.x, c.y - c.r - 6);
  }
}

function drawCoins(ctx, coins) {
  for (const coin of coins) {
    const p = 1 - coin.ttl / coin.life;
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(232, 193, 90, ${1 - p})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 6 + p * 30, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawPopups(ctx, popups) {
  ctx.textAlign = 'center';
  for (const p of popups) {
    ctx.globalAlpha = Math.max(0, p.ttl / 1.4);
    ctx.fillStyle = p.color;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}

function alarmColor(a) {
  if (a < 35) return SAFE;
  if (a < 70) return AMBER;
  return DANGER;
}

function drawHud(ctx, state, now) {
  ctx.fillStyle = '#0d1120';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = GOLD_DEEP;
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  // Left: title + room name.
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('GILDED NIGHT', 16, 28);
  ctx.fillStyle = '#9aa5bb';
  ctx.font = '12px sans-serif';
  ctx.fillText(state.room.name, 16, 50);

  // Centre: thick alarm meter.
  const mx = 460;
  const mw = 360;
  ctx.fillStyle = '#c7cede';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', mx, 22);
  ctx.fillStyle = '#1a2032';
  ctx.fillRect(mx, 28, mw, 20);
  const fillW = (state.alarm / 100) * mw;
  const pulse = state.alarm >= 70 ? 0.65 + Math.sin(now * 0.012) * 0.35 : 1;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(mx, 28, fillW, 20);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#3a4358';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx + 0.5, 28.5, mw, 20);
  ctx.fillStyle = '#c7cede';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(Math.round(state.alarm) + '%', mx + mw + 10, 44);
  ctx.fillStyle = '#9aa5bb';
  ctx.font = '11px sans-serif';
  ctx.fillText(state.room.goal, mx, 60);

  // Right: loot, tools, keycard, timer.
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('LOOT $' + totalLoot(state.rooms), VIEW_W - 16, 24);
  ctx.fillStyle = '#c7cede';
  ctx.font = 'bold 12px sans-serif';
  const tools = `SMOKE x${state.thief.smoke} [1]    EMP x${state.thief.emp} [2]    COIN x${state.thief.coins}    ` +
    (state.thief.keycard ? 'KEYCARD ✓' : 'KEYCARD —');
  ctx.fillText(tools, VIEW_W - 16, 44);
  ctx.fillStyle = state.muted ? DANGER : '#9aa5bb';
  ctx.font = '11px sans-serif';
  ctx.fillText(formatTime(state.elapsed) + (state.muted ? '    MUTED' : ''), VIEW_W - 16, 60);

  if (state.spotted) {
    ctx.textAlign = 'center';
    ctx.fillStyle = DANGER;
    ctx.font = 'bold 22px sans-serif';
    ctx.globalAlpha = 0.6 + Math.sin(now * 0.02) * 0.4;
    ctx.fillText('! SPOTTED !', VIEW_W / 2, HUD_H + 32);
    ctx.globalAlpha = 1;
  }
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function drawPanel(ctx, title, lines, color) {
  ctx.fillStyle = 'rgba(6, 8, 15, 0.78)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  const pw = 660;
  const ph = 120 + lines.length * 30;
  const px = (VIEW_W - pw) / 2;
  const py = 200;
  ctx.fillStyle = 'rgba(13, 17, 32, 0.95)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(title, VIEW_W / 2, py + 62);
  ctx.fillStyle = '#dfe6f2';
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, py + 100 + i * 30);
  });
}

export function drawGame(ctx, state, now) {
  const room = state.room;
  drawFloor(ctx, room);
  drawDucts(ctx, room);
  drawWalls(ctx, room);
  drawCover(ctx, room);
  drawRopes(ctx, room);
  drawLasers(ctx, room, now);
  drawDoors(ctx, room);
  drawExit(ctx, room, now);

  for (const cam of state.cams) drawCameraUnit(ctx, cam, state.empLeft, now);
  for (const g of state.guards) drawGuardCone(ctx, g);
  if (room.keycard && !room.keycard.taken) drawKeycard(ctx, room.keycard, now);
  for (const loot of room.loot) {
    if (!loot.taken) drawArtifact(ctx, loot, now);
  }
  for (const g of state.guards) drawGuard(ctx, g, now);
  drawClouds(ctx, state.clouds);
  drawCoins(ctx, state.coins);
  drawThief(ctx, state.thief, now);
  drawPopups(ctx, state.popups);
  drawHud(ctx, state, now);

  if (state.banner && now < state.bannerUntil) {
    ctx.fillStyle = 'rgba(13, 17, 32, 0.88)';
    ctx.font = '14px sans-serif';
    const tw = ctx.measureText(state.banner).width;
    const bx = (VIEW_W - tw) / 2 - 14;
    ctx.fillRect(bx, HUD_H + 8, tw + 28, 26);
    ctx.strokeStyle = GOLD_DEEP;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, HUD_H + 8.5, tw + 28, 26);
    ctx.fillStyle = CREAM;
    ctx.textAlign = 'center';
    ctx.fillText(state.banner, VIEW_W / 2, HUD_H + 26);
  }

  if (state.mode === 'title') {
    ctx.fillStyle = 'rgba(6, 8, 15, 0.72)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 68px sans-serif';
    ctx.fillText('GILDED NIGHT', VIEW_W / 2, 250);
    ctx.fillStyle = CREAM;
    ctx.font = '20px sans-serif';
    ctx.fillText('A museum heist in three dense rooms. Read the cones. Mind the cameras.', VIEW_W / 2, 298);
    ctx.fillText('Grab the target loot, then slip out the getaway door.', VIEW_W / 2, 328);
    ctx.fillStyle = '#9aa5bb';
    ctx.font = '16px sans-serif';
    ctx.fillText('WASD move  •  click tosses a coin  •  1 smoke  •  2 EMP  •  R retry room  •  M mute', VIEW_W / 2, 396);
    ctx.fillText('Crawl the service ducts to pass unseen. A guard only chases once the alarm runs high.', VIEW_W / 2, 424);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 22px sans-serif';
    ctx.globalAlpha = 0.6 + Math.sin(now * 0.006) * 0.4;
    ctx.fillText('Press ENTER or click to start the heist', VIEW_W / 2, 478);
    ctx.globalAlpha = 1;
  } else if (state.mode === 'caught') {
    drawPanel(ctx, 'CAUGHT!', [
      state.caughtWhy,
      'Watch the cones, use smoke and coins, and move when a guard looks away.',
      'Press R to retry this room.',
    ], DANGER);
  } else if (state.mode === 'clear') {
    drawPanel(ctx, 'ROOM CLEAR', [
      `${room.name} — loot so far $${totalLoot(state.rooms)}.`,
      'Press ENTER for the next room.',
    ], SAFE);
  } else if (state.mode === 'won') {
    drawPanel(ctx, 'CLEAN GETAWAY!', [
      `Total loot $${totalLoot(state.rooms)}  •  time ${formatTime(state.elapsed)}`,
      `Final score ${state.score} — the getaway van is already gone.`,
      'Press R to run the heist again.',
    ], GOLD);
  }
}

// render.js — everything the player sees, drawn on one canvas: the
// room, the vision cones, the cameras, the loot, the thief, and the
// HUD with the alarm meter. The HUD lives on the canvas so a
// screenshot always carries it.

import { VIEW_WIDTH, VIEW_HEIGHT, HUD_TOP } from './level.js';
import { requiredLootTaken } from './player.js';

const GOLD = '#e8c15a';
const DANGER = '#e5484d';
const SAFE = '#3fae5a';
const AMBER = '#e8a13a';

export function drawVisionCone(ctx, x, y, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawCheckerFloor(ctx, room) {
  ctx.fillStyle = room.floorTint;
  ctx.fillRect(0, HUD_TOP, VIEW_WIDTH, VIEW_HEIGHT - HUD_TOP);
  ctx.fillStyle = room.floorTintAlt;
  const tile = 64;
  for (let ty = HUD_TOP; ty < VIEW_HEIGHT; ty += tile) {
    for (let tx = 0; tx < VIEW_WIDTH; tx += tile) {
      if (((tx / tile) + (ty / tile)) % 2 === 0) {
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
  }
}

function drawVents(ctx, room) {
  for (const vent of room.vents) {
    ctx.fillStyle = '#0c0f18';
    ctx.fillRect(vent.x, vent.y, vent.w, vent.h);
    ctx.strokeStyle = '#3a4358';
    ctx.lineWidth = 2;
    ctx.strokeRect(vent.x, vent.y, vent.w, vent.h);
    ctx.strokeStyle = '#2c3448';
    ctx.lineWidth = 1;
    for (let sx = vent.x + 14; sx < vent.x + vent.w; sx += 16) {
      ctx.beginPath();
      ctx.moveTo(sx, vent.y + 4);
      ctx.lineTo(sx, vent.y + vent.h - 4);
      ctx.stroke();
    }
    ctx.fillStyle = '#5d6a86';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SERVICE DUCT', vent.x + vent.w / 2, vent.y + vent.h / 2 + 3);
  }
}

function drawWalls(ctx, room) {
  for (const wall of room.walls) {
    ctx.fillStyle = '#2b3247';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = '#3d4763';
    ctx.fillRect(wall.x, wall.y, wall.w, 3);
    ctx.strokeStyle = '#171c2a';
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }
}

function drawCover(ctx, room) {
  for (const piece of room.cover) {
    if (piece.kind === 'crate') {
      ctx.fillStyle = '#6b4a2f';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.strokeStyle = '#4a3018';
      ctx.lineWidth = 2;
      ctx.strokeRect(piece.x + 1, piece.y + 1, piece.w - 2, piece.h - 2);
      ctx.beginPath();
      ctx.moveTo(piece.x, piece.y);
      ctx.lineTo(piece.x + piece.w, piece.y + piece.h);
      ctx.moveTo(piece.x + piece.w, piece.y);
      ctx.lineTo(piece.x, piece.y + piece.h);
      ctx.stroke();
    } else if (piece.kind === 'desk') {
      ctx.fillStyle = '#4a3b2c';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#5d4a38';
      ctx.fillRect(piece.x + 4, piece.y + 4, piece.w - 8, piece.h - 8);
      ctx.strokeStyle = '#2e2115';
      ctx.lineWidth = 2;
      ctx.strokeRect(piece.x + 1, piece.y + 1, piece.w - 2, piece.h - 2);
    } else {
      ctx.fillStyle = '#2c5a34';
      ctx.beginPath();
      ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, piece.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7a48';
      ctx.beginPath();
      ctx.arc(piece.x + piece.w / 2 - 6, piece.y + piece.h / 2 - 6, piece.w / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawDoors(ctx, room) {
  for (const door of room.doors) {
    if (door.open) {
      ctx.fillStyle = '#0c0f18';
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.strokeStyle = SAFE;
      ctx.lineWidth = 2;
      ctx.strokeRect(door.x, door.y, door.w, door.h);
      continue;
    }
    ctx.fillStyle = '#7a2e35';
    ctx.fillRect(door.x, door.y, door.w, door.h);
    ctx.strokeStyle = '#e8a13a';
    ctx.lineWidth = 2;
    ctx.strokeRect(door.x + 1, door.y + 1, door.w - 2, door.h - 2);
    ctx.save();
    ctx.translate(door.x + door.w / 2, door.y + door.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#ffd9a0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(door.label, 0, 4);
    ctx.restore();
  }
}

function drawLootIcon(ctx, loot, time) {
  const pulse = 1 + Math.sin(time * 0.004 + loot.x) * 0.08;
  ctx.save();
  ctx.translate(loot.x, loot.y);
  ctx.scale(pulse, pulse);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  glow.addColorStop(0, 'rgba(232, 193, 90, 0.55)');
  glow.addColorStop(1, 'rgba(232, 193, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  if (loot.kind === 'painting') {
    ctx.fillStyle = '#8a6d2f';
    ctx.fillRect(-16, -12, 32, 24);
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(-13, -9, 26, 18);
    ctx.fillStyle = '#7a4a8a';
    ctx.beginPath();
    ctx.arc(0, -1, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (loot.kind === 'vase') {
    ctx.fillStyle = '#3f9e7a';
    ctx.beginPath();
    ctx.ellipse(0, 2, 9, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-4, -14, 8, 6);
  } else if (loot.kind === 'gem') {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(5, -2);
    ctx.lineTo(-5, -2);
    ctx.closePath();
    ctx.fill();
  } else if (loot.kind === 'diamond') {
    ctx.fillStyle = '#bfe8ff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(14, -4);
    ctx.lineTo(0, 16);
    ctx.lineTo(-14, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(7, -4);
    ctx.lineTo(-7, -4);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#e8c15a';
    ctx.fillRect(-14, -4, 12, 8);
    ctx.fillRect(-2, -4, 12, 8);
    ctx.fillRect(-8, -12, 12, 8);
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1;
    ctx.strokeRect(-14, -4, 12, 8);
    ctx.strokeRect(-2, -4, 12, 8);
    ctx.strokeRect(-8, -12, 12, 8);
  }
  ctx.restore();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(loot.label, loot.x, loot.y + 32);
  ctx.fillStyle = '#c9a94f';
  ctx.font = '10px sans-serif';
  ctx.fillText('$' + loot.value, loot.x, loot.y + 45);
}

function drawKeycard(ctx, keycard, time) {
  const bob = Math.sin(time * 0.005) * 3;
  ctx.save();
  ctx.translate(keycard.x, keycard.y + bob);
  ctx.fillStyle = '#2fa8a0';
  ctx.fillRect(-12, -8, 24, 16);
  ctx.fillStyle = '#e8f6f4';
  ctx.fillRect(-9, -5, 10, 3);
  ctx.fillRect(-9, 0, 14, 3);
  ctx.restore();
  ctx.fillStyle = '#7fd8cf';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KEYCARD', keycard.x, keycard.y + 30);
}

function drawExit(ctx, room, time) {
  const exit = room.exit;
  const ready = requiredLootTaken(room);
  const glowPulse = ready ? 0.5 + Math.sin(time * 0.006) * 0.25 : 0.18;
  ctx.fillStyle = ready ? `rgba(63, 174, 90, ${glowPulse})` : 'rgba(63, 174, 90, 0.12)';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = ready ? SAFE : '#2c7a44';
  ctx.lineWidth = ready ? 3 : 2;
  ctx.strokeRect(exit.x + 1, exit.y + 1, exit.w - 2, exit.h - 2);
  ctx.fillStyle = ready ? '#b8f0c4' : '#7fb892';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exit.label + '  →', exit.x + exit.w / 2, exit.y + exit.h / 2 - 2);
  ctx.font = '10px sans-serif';
  ctx.fillText(ready ? 'GO! GO! GO!' : 'GRAB THE TARGET LOOT FIRST', exit.x + exit.w / 2, exit.y + exit.h / 2 + 14);
}

function drawGuard(ctx, guard, time) {
  const bob = Math.sin(guard.bobPhase) * 1.5;
  ctx.fillStyle = '#1c2733';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + 2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#31435e';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8fa8c8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, 13, 0, Math.PI * 2);
  ctx.stroke();
  // facing tick + flashlight dot
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y + bob);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * 20, guard.y + bob + Math.sin(guard.facing) * 20);
  ctx.stroke();
  ctx.fillStyle = '#0d1320';
  ctx.beginPath();
  ctx.arc(guard.x - 4, guard.y + bob - 3, 2.2, 0, Math.PI * 2);
  ctx.arc(guard.x + 4, guard.y + bob - 3, 2.2, 0, Math.PI * 2);
  ctx.fill();
  if (guard.state === 'chase' || guard.state === 'suspicious') {
    ctx.fillStyle = DANGER;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 24);
  } else if (guard.state === 'investigate') {
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 24);
  }
}

function drawCamera(ctx, camera, empActive) {
  const disabled = empActive;
  ctx.fillStyle = disabled ? '#3a3f4a' : '#5a1f24';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = disabled ? '#6a707c' : DANGER;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = disabled ? '#8a8f9c' : '#ff5a5a';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // mount arm to the wall above
  ctx.strokeStyle = '#2b3247';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(camera.x, camera.y - 8);
  ctx.lineTo(camera.x, camera.y - 16);
  ctx.stroke();
  if (disabled) {
    ctx.fillStyle = '#9aa1b2';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMP', camera.x, camera.y + 24);
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0e1420';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4dd8e6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 14, 0, Math.PI * 2);
  ctx.stroke();
  // hood point + mask band
  ctx.fillStyle = '#4dd8e6';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 10, player.y + bob + Math.sin(player.facing) * 10, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1c2b3a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(player.x - 8, player.y + bob - 2);
  ctx.lineTo(player.x + 8, player.y + bob - 2);
  ctx.stroke();
}

function drawSmokeClouds(ctx, clouds) {
  for (const cloud of clouds) {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + cloud.x * 0.01;
      const cx = cloud.x + Math.cos(angle) * cloud.r * 0.45;
      const cy = cloud.y + Math.sin(angle) * cloud.r * 0.45;
      ctx.fillStyle = 'rgba(200, 205, 215, 0.28)';
      ctx.beginPath();
      ctx.arc(cx, cy, cloud.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(220, 225, 235, 0.2)';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoins(ctx, coins) {
  for (const coin of coins) {
    const progress = 1 - coin.ttl / 1.2;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(232, 193, 90, ${1 - progress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5 + progress * 26, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPopups(ctx, popups) {
  ctx.textAlign = 'center';
  for (const popup of popups) {
    ctx.globalAlpha = Math.max(0, popup.ttl / 1.4);
    ctx.fillStyle = popup.color;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(popup.text, popup.x, popup.y);
    ctx.globalAlpha = 1;
  }
}

function alarmColor(alarm) {
  if (alarm < 35) return SAFE;
  if (alarm < 70) return AMBER;
  return DANGER;
}

function drawHud(ctx, state, time) {
  ctx.fillStyle = '#0d1120';
  ctx.fillRect(0, 0, VIEW_WIDTH, HUD_TOP);
  ctx.fillStyle = '#232a3d';
  ctx.fillRect(0, HUD_TOP - 2, VIEW_WIDTH, 2);

  // Left: title + room name.
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('VAULTBREAK', 16, 30);
  ctx.fillStyle = '#8b96ad';
  ctx.font = '12px sans-serif';
  ctx.fillText(state.room.name, 16, 52);

  // Center: alarm meter.
  const meterX = 470;
  const meterW = 340;
  ctx.fillStyle = '#c7cede';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, 30);
  ctx.fillStyle = '#1a2032';
  ctx.fillRect(meterX, 38, meterW, 16);
  const fillW = (state.alarm / 100) * meterW;
  const pulse = state.alarm >= 70 ? 0.7 + Math.sin(time * 0.012) * 0.3 : 1;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(meterX, 38, fillW, 16);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#3a4358';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 0.5, 38.5, meterW, 16);
  ctx.fillStyle = '#c7cede';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(Math.round(state.alarm) + '%', meterX + meterW + 10, 51);
  ctx.fillStyle = '#8b96ad';
  ctx.font = '11px sans-serif';
  ctx.fillText(state.room.objective, meterX, 66 - 6);

  // Right: loot, tools, timer — one row each so nothing collides.
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('LOOT $' + state.player.lootValue, VIEW_WIDTH - 16, 24);
  ctx.fillStyle = '#c7cede';
  ctx.font = '12px sans-serif';
  const tools = `SMOKE x${state.player.smokeCharges} [1]   EMP x${state.player.empCharges} [2]   COIN x${state.player.coinCharges}`;
  ctx.fillText(tools, VIEW_WIDTH - 16, 44);
  ctx.fillStyle = state.muted ? DANGER : '#8b96ad';
  ctx.font = '11px sans-serif';
  ctx.fillText(formatTime(state.elapsedMs) + (state.muted ? '   MUTED' : ''), VIEW_WIDTH - 16, 62);

  // SPOTTED warning.
  if (state.anyWatcherSees) {
    ctx.textAlign = 'center';
    ctx.fillStyle = DANGER;
    ctx.font = 'bold 20px sans-serif';
    const blink = 0.6 + Math.sin(time * 0.02) * 0.4;
    ctx.globalAlpha = blink;
    ctx.fillText('! SPOTTED !', VIEW_WIDTH / 2, HUD_TOP + 30);
    ctx.globalAlpha = 1;
  }
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function drawCenterPanel(ctx, title, lines, titleColor) {
  ctx.fillStyle = 'rgba(6, 8, 15, 0.78)';
  ctx.fillRect(0, HUD_TOP, VIEW_WIDTH, VIEW_HEIGHT - HUD_TOP);
  ctx.fillStyle = 'rgba(13, 17, 32, 0.95)';
  const panelW = 640;
  const panelH = 110 + lines.length * 30;
  const px = (VIEW_WIDTH - panelW) / 2;
  const py = 200;
  ctx.fillRect(px, py, panelW, panelH);
  ctx.strokeStyle = titleColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, panelW - 2, panelH - 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(title, VIEW_WIDTH / 2, py + 62);
  ctx.fillStyle = '#dfe6f2';
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_WIDTH / 2, py + 100 + i * 30);
  });
}

export function drawGame(ctx, state, time) {
  const room = state.room;
  drawCheckerFloor(ctx, room);
  drawVents(ctx, room);
  drawWalls(ctx, room);
  drawCover(ctx, room);
  drawDoors(ctx, room);
  drawExit(ctx, room, time);

  // Vision cones first (under the people), then the watchers.
  for (const guard of state.guards) {
    drawVisionCone(ctx, guard.x, guard.y, guard.facing, guard.range, guard.halfAngle,
      'rgba(255, 214, 106, 0.16)', 'rgba(255, 214, 106, 0.45)');
  }
  for (const camera of state.cameras) {
    if (state.empUntil > time) continue;
    drawVisionCone(ctx, camera.x, camera.y, camera.facing, camera.range, camera.halfAngle,
      camera.seesThief ? 'rgba(229, 72, 77, 0.30)' : 'rgba(229, 72, 77, 0.14)',
      camera.seesThief ? 'rgba(229, 72, 77, 0.8)' : 'rgba(229, 72, 77, 0.4)');
  }

  if (room.keycard && !room.keycard.taken) drawKeycard(ctx, room.keycard, time);
  for (const loot of room.loot) {
    if (!loot.taken) drawLootIcon(ctx, loot, time);
  }
  for (const guard of state.guards) drawGuard(ctx, guard, time);
  for (const camera of state.cameras) drawCamera(ctx, camera, state.empUntil > time);
  drawSmokeClouds(ctx, state.clouds);
  drawCoins(ctx, state.coins);
  drawPlayer(ctx, state.player, time);
  drawPopups(ctx, state.popups);
  drawHud(ctx, state, time);

  // Objective banner: a translucent strip under the HUD while a room
  // is fresh, or for the whole screenshot scene.
  if (state.banner && time < state.bannerUntil) {
    ctx.fillStyle = 'rgba(13, 17, 32, 0.85)';
    const bannerText = state.banner;
    ctx.font = '14px sans-serif';
    const textW = ctx.measureText(bannerText).width;
    const bx = (VIEW_WIDTH - textW) / 2 - 14;
    ctx.fillRect(bx, HUD_TOP + 8, textW + 28, 26);
    ctx.strokeStyle = '#3a4358';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, HUD_TOP + 8.5, textW + 28, 26);
    ctx.fillStyle = '#dfe6f2';
    ctx.textAlign = 'center';
    ctx.fillText(bannerText, VIEW_WIDTH / 2, HUD_TOP + 26);
  }

  if (state.screen === 'title') {
    ctx.fillStyle = 'rgba(6, 8, 15, 0.72)';
    ctx.fillRect(0, HUD_TOP, VIEW_WIDTH, VIEW_HEIGHT - HUD_TOP);
    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('VAULTBREAK', VIEW_WIDTH / 2, 260);
    ctx.fillStyle = '#dfe6f2';
    ctx.font = '20px sans-serif';
    ctx.fillText('A top-down heist in three rooms. Read the cones. Mind the cameras.', VIEW_WIDTH / 2, 305);
    ctx.fillText('Grab the target loot, then slip out the getaway door.', VIEW_WIDTH / 2, 335);
    ctx.fillStyle = '#8b96ad';
    ctx.font = '16px sans-serif';
    ctx.fillText('WASD move  •  click tosses a coin  •  1 smoke  •  2 EMP  •  R retry room', VIEW_WIDTH / 2, 400);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 22px sans-serif';
    const blink = 0.6 + Math.sin(time * 0.006) * 0.4;
    ctx.globalAlpha = blink;
    ctx.fillText('Press ENTER or click to start the heist', VIEW_WIDTH / 2, 460);
    ctx.globalAlpha = 1;
  } else if (state.screen === 'caught') {
    ctx.fillStyle = 'rgba(90, 10, 15, 0.35)';
    ctx.fillRect(0, HUD_TOP, VIEW_WIDTH, VIEW_HEIGHT - HUD_TOP);
    drawCenterPanel(ctx, 'CAUGHT!', [
      'The alarm hit 100% — the crew got pinched.',
      'Watch the cones, use smoke and coins, and move when a guard looks away.',
      'Press R to retry this room.',
    ], DANGER);
  } else if (state.screen === 'roomclear') {
    drawCenterPanel(ctx, 'ROOM CLEAR', [
      `${room.name} — loot so far $${state.player.lootValue}.`,
      'Press ENTER for the next room.',
    ], SAFE);
  } else if (state.screen === 'won') {
    drawCenterPanel(ctx, 'THE CREW GOT AWAY CLEAN', [
      `Total loot $${state.player.lootValue}  •  time ${formatTime(state.elapsedMs)}`,
      `Final score ${state.score} — the getaway van is already gone.`,
      'Press R to run the heist again.',
    ], GOLD);
  }
}

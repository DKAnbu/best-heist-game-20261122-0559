// audio.js — every sound is synthesized with WebAudio: no audio files,
// no network. The context is created on the first key press or click,
// so the browser's autoplay rules are satisfied.

let audioContext = null;
let muted = false;
let alarmBeepAt = 0;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function ensureAudio() {
  if (!audioContext) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      audioContext = new Ctor();
    } catch (err) {
      audioContext = null;
    }
  }
  if (audioContext && audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(freq, duration, type, volume, when = 0, slideTo = 0) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export function playPickup(value) {
  tone(660, 0.12, 'sine', 0.18);
  tone(880, 0.14, 'sine', 0.18, 0.07);
  if (value >= 1000) tone(1320, 0.2, 'sine', 0.16, 0.14);
}

export function playKeycard() {
  tone(520, 0.1, 'square', 0.08);
  tone(780, 0.16, 'square', 0.08, 0.09);
}

export function playDoorOpen() {
  tone(180, 0.35, 'sawtooth', 0.07, 0, 320);
}

export function playCoinToss() {
  tone(2400, 0.08, 'triangle', 0.12, 0, 1800);
  tone(1900, 0.1, 'triangle', 0.1, 0.12);
}

export function playSmoke() {
  tone(300, 0.4, 'sine', 0.1, 0, 90);
}

export function playEmp() {
  tone(1200, 0.3, 'sawtooth', 0.08, 0, 120);
  tone(900, 0.25, 'square', 0.05, 0.1, 200);
}

export function playRoomClear() {
  tone(523, 0.15, 'sine', 0.18);
  tone(659, 0.15, 'sine', 0.18, 0.12);
  tone(784, 0.25, 'sine', 0.18, 0.24);
}

export function playCaught() {
  tone(392, 0.25, 'sawtooth', 0.16, 0, 196);
  tone(311, 0.3, 'sawtooth', 0.16, 0.22, 155);
  tone(233, 0.55, 'sawtooth', 0.16, 0.5, 110);
}

// A soft heartbeat beep while the alarm is high; called every frame
// with the current alarm level and the clock, it paces itself.
export function playAlarmHeartbeat(alarm, nowMs) {
  if (muted || alarm < 45) return;
  const interval = alarm >= 80 ? 350 : 700;
  if (nowMs - alarmBeepAt < interval) return;
  alarmBeepAt = nowMs;
  tone(alarm >= 80 ? 980 : 740, 0.09, 'square', 0.06);
}

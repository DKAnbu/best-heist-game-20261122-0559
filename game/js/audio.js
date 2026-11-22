// audio.js — every sound is synthesized with WebAudio: no audio files,
// no network. The context is created on the first key press or click,
// so the browser's autoplay rules are satisfied.

let ctx = null;
let silent = false;
let lastBeep = 0;

export function isMuted() {
  return silent;
}

export function toggleMute() {
  silent = !silent;
  return silent;
}

export function wakeAudio() {
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctor();
    } catch (err) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function note(freq, dur, type, vol, delay = 0, glide = 0) {
  if (silent) return;
  const ac = wakeAudio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glide > 0) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function sfxPickup(value) {
  note(587, 0.12, 'sine', 0.18);
  note(880, 0.14, 'sine', 0.18, 0.07);
  if (value >= 1000) note(1175, 0.22, 'sine', 0.16, 0.14);
}

export function sfxKeycard() {
  note(440, 0.1, 'square', 0.08);
  note(660, 0.18, 'square', 0.08, 0.09);
}

export function sfxDoor() {
  note(160, 0.4, 'sawtooth', 0.07, 0, 300);
}

export function sfxCoin() {
  note(2200, 0.08, 'triangle', 0.12, 0, 1700);
  note(1750, 0.1, 'triangle', 0.1, 0.12);
}

export function sfxSmoke() {
  note(280, 0.45, 'sine', 0.1, 0, 85);
}

export function sfxEmp() {
  note(1100, 0.3, 'sawtooth', 0.08, 0, 110);
  note(820, 0.25, 'square', 0.05, 0.1, 180);
}

export function sfxClear() {
  note(523, 0.15, 'sine', 0.18);
  note(659, 0.15, 'sine', 0.18, 0.12);
  note(784, 0.28, 'sine', 0.18, 0.24);
}

export function sfxCaught() {
  note(370, 0.25, 'sawtooth', 0.16, 0, 185);
  note(294, 0.3, 'sawtooth', 0.16, 0.22, 147);
  note(220, 0.55, 'sawtooth', 0.16, 0.5, 104);
}

// A soft heartbeat beep while the alarm is high; called every frame
// with the current alarm level and the clock, it paces itself.
export function sfxHeartbeat(alarm, nowMs) {
  if (silent || alarm < 45) return;
  const gap = alarm >= 80 ? 350 : 700;
  if (nowMs - lastBeep < gap) return;
  lastBeep = nowMs;
  note(alarm >= 80 ? 920 : 700, 0.09, 'square', 0.06);
}

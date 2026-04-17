let ctx = null;
let soundOn = true;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function resumeCtx() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

export function setSoundOn(on) { soundOn = on; }
export function isSoundOn() { return soundOn; }

function play(fn) {
  if (!soundOn) return;
  resumeCtx();
  try { fn(getCtx()); } catch (e) { /* ignore audio errors */ }
}

export function playPop() {
  play(ctx => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(600, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.08);
  });
}

export function playSnap() {
  play(ctx => {
    const t = ctx.currentTime;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = 'sine'; o1.frequency.value = 500;
    o2.type = 'sine'; o2.frequency.value = 420;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o1.connect(g); o2.connect(g); g.connect(ctx.destination);
    o1.start(t); o1.stop(t + 0.05);
    o2.start(t + 0.03); o2.stop(t + 0.1);
  });
}

export function playCorrect() {
  play(ctx => {
    const t = ctx.currentTime;
    [400, 500, 600].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.12, t + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.2);
    });
  });
}

export function playWrong() {
  play(ctx => {
    const t = ctx.currentTime;
    [350, 280].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.15);
      o.connect(g).connect(ctx.destination);
      o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.15);
    });
  });
}

export function playUnlock() {
  play(ctx => {
    const t = ctx.currentTime;
    [400, 500, 600, 700, 800].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.25);
    });
  });
}

export function playClick() {
  play(ctx => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 800;
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.04);
  });
}

export function playCountBlip(index) {
  play(ctx => {
    const freq = 350 + index * 30;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.12);
  });
}

/* eslint-disable max-params, complexity, max-lines -- DSP voice functions take many positional synthesis parameters */
// Pure-JS sound design for the Thoth launch videos. Everything is synthesized here (sines, filtered noise,
// a small Schroeder reverb); no samples, no downloads. Deterministic: same cues -> same samples.
// Exports render(id, durationSeconds) -> { L, R } Float32Arrays at 48 kHz (pre-loudness-normalisation).
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export const SR = 48000;
const TAU = Math.PI * 2;
const here = dirname(fileURLToPath(import.meta.url));
const cuesOf = (id) =>
  JSON.parse(readFileSync(resolve(here, 'cues', id + '.json'), 'utf8'));

const rng = (seed) => () => {
  // mulberry32
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const sstep = (k) => k * k * (3 - 2 * k);
// the shared end-card motif: A4 D5 F5 A5 (D minor arpeggio, last note long)
export const MOTIF = [
  [0.45, 440.0, 1.0],
  [0.95, 587.33, 0.9],
  [1.45, 698.46, 0.85],
  [2.05, 880.0, 1.0],
];

function mixer(dur) {
  const n = Math.round(dur * SR);
  const m = {
    n,
    dur,
    L: new Float32Array(n),
    R: new Float32Array(n),
    sL: new Float32Array(n),
    sR: new Float32Array(n),
    r: rng(7),
  };
  // voice: fn(t_local) -> mono sample. gain linear, pan -1..1, send = reverb send level
  m.add = (t0, len, fn, gain = 1, pan = 0, send = 0.15) => {
    const i0 = Math.max(0, Math.round(t0 * SR)),
      i1 = Math.min(n, Math.round((t0 + len) * SR));
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4),
      gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = i0; i < i1; i++) {
      const tl = i / SR - t0,
        s = fn(tl);
      m.L[i] += s * gl;
      m.R[i] += s * gr;
      m.sL[i] += s * gl * send;
      m.sR[i] += s * gr * send;
    }
  };
  return m;
}
// one-pole low/high pass with time-varying cutoff
const lp = () => {
  let y = 0;
  return (x, fc) => (y += (1 - Math.exp((-TAU * fc) / SR)) * (x - y));
};
const hp = () => {
  const l = lp();
  return (x, fc) => x - l(x, fc);
};
const brown = (r) => {
  let y = 0;
  return () => (y = (y + (r() * 2 - 1) * 0.04) / 1.002);
};

// ---------- instruments ----------
function tick(m, t, gain, f = 1900, pan = 0) {
  // tiny wooden/UI tick
  m.add(
    t,
    0.05,
    (x) =>
      (Math.sin(TAU * f * x) * Math.exp(-x / 0.0035) +
        0.5 * Math.sin(TAU * f * 2.41 * x) * Math.exp(-x / 0.0022) +
        0.25 * (m.r() * 2 - 1) * Math.exp(-x / 0.0008)) *
      sstep(seg(x, 0, 0.0004)),
    gain,
    pan,
    0.08,
  );
}
function thud(m, t, gain, f = 62, len = 0.35) {
  m.add(
    t,
    len,
    (x) => {
      const fr = f * (1 + 0.9 * Math.exp(-x / 0.03));
      return (
        Math.sin(TAU * fr * x) * Math.exp(-x / 0.09) * sstep(seg(x, 0, 0.004))
      );
    },
    gain,
    0,
    0.12,
  );
  const l = lp();
  m.add(
    t,
    0.08,
    (x) => l(m.r() * 2 - 1, 380) * Math.exp(-x / 0.015),
    gain * 1.4,
    0,
    0.1,
  );
}
function bell(m, t, f, gain, tau = 1.1, pan = 0, send = 0.45) {
  // soft inharmonic bell/chime
  const P = [
    [1, 1, 1],
    [2.0, 0.32, 0.7],
    [2.76, 0.22, 0.5],
    [4.07, 0.1, 0.35],
    [5.4, 0.05, 0.25],
  ];
  const len = tau * 7;
  m.add(
    t,
    len,
    (x) => {
      let s = 0;
      for (const [r, a, d] of P)
        s += a * Math.sin(TAU * f * r * x) * Math.exp(-x / (tau * d));
      return s * sstep(seg(x, 0, 0.006));
    },
    gain,
    pan,
    send,
  );
}
function endcard(m, EC, scale = 0.45) {
  // shared motif + ring-draw glide + ray sparkle
  m.add(
    EC + 0.15,
    1.2,
    (x) =>
      Math.sin(TAU * (500 + 700 * sstep(x / 1.1)) * x) *
      Math.sin(Math.PI * clamp(x / 1.2)) ** 2,
    0.03 * scale,
    0,
    0.5,
  );
  for (const [dt, f, v] of MOTIF) {
    bell(
      m,
      EC + dt,
      f,
      0.34 * v * scale,
      f > 800 ? 1.5 : 1.0,
      (f - 640) / 1500,
    );
  }
  bell(m, EC + 0.45, 220, 0.2 * scale, 2.2, 0, 0.5); // low octave under the first note for body
  bell(m, EC + 2.05, 293.66, 0.12 * scale, 2.0, 0, 0.5); // D4 under the last note: resolves to D
}
function swell(m, t0, t1, gain, notes = [293.66, 440, 587.33], tail = 1.4) {
  // rising chord + filtered-noise swell
  const len = t1 - t0 + tail;
  const env = (x) => {
    const up = Math.pow(seg(x, 0, t1 - t0), 2);
    return up * Math.pow(1 - seg(x, t1 - t0, len), 1.6);
  };
  notes.forEach((f, i) =>
    m.add(
      t0,
      len,
      (x) =>
        (Math.sin(TAU * f * x) + Math.sin(TAU * f * 1.003 * x + i)) *
        0.5 *
        env(x),
      (gain / notes.length) * 2,
      (i - 1) * 0.5,
      0.4,
    ),
  );
  const l = lp(),
    l2 = lp();
  m.add(
    t0,
    len,
    (x) =>
      l2(l(m.r() * 2 - 1, 300 + 3500 * Math.pow(seg(x, 0, t1 - t0), 2)), 4000) *
      env(x),
    gain * 0.9,
    0,
    0.3,
  );
}
// ---------- ambient bed ----------
const CH = [
  // chord voicings: [Hz, level]; all in/around D minor so the end-card motif always fits
  [
    [73.42, 1],
    [110.0, 0.8],
    [146.83, 0.6],
    [164.81, 0.4],
    [220.0, 0.35],
    [329.63, 0.18],
  ], // Dm(add9)
  [
    [58.27, 1],
    [116.54, 0.7],
    [146.83, 0.55],
    [174.61, 0.4],
    [220.0, 0.3],
    [293.66, 0.2],
  ], // Bb maj7 ish
  [
    [98.0, 1],
    [146.83, 0.7],
    [196.0, 0.5],
    [233.08, 0.4],
    [293.66, 0.3],
    [440.0, 0.12],
  ], // Gm
  [
    [73.42, 1],
    [110.0, 0.8],
    [146.83, 0.6],
    [174.61, 0.45],
    [220.0, 0.35],
    [261.63, 0.15],
  ], // Dm
];
function bed(
  m,
  EC,
  { start = 0, level = 1, lowFrom = null, airFrom = null } = {},
) {
  const dur = m.dur,
    nCh = CH.length,
    span = EC / (nCh - 1) / 1; // chords spread over the body; last one holds under the end card
  const bound = (c) =>
    c === 0 ? -1e6 : c === nCh - 1 ? EC - 2 : (c * EC) / (nCh - 1) - span * 0.5;
  const xf = 3.0;
  // pad gain envelope: fade in 2.5s, sits, dips under the end card chimes, fades out at the very end
  const padEnv = (t) => {
    let g = sstep(seg(t, start, start + 2.5));
    if (lowFrom != null)
      g *=
        1 -
        0.55 *
          sstep(seg(t, lowFrom, lowFrom + 2.0)) *
          (1 - sstep(seg(t, EC - 0.5, EC + 1.0)));
    g *= 1 - 0.3 * sstep(seg(t, EC, EC + 1.2));
    return g;
  };
  const stages = CH.map((_, c) => [
    bound(c),
    c === nCh - 1 ? 1e6 : bound(c + 1),
  ]);
  CH.forEach((chord, c) => {
    chord.forEach(([f, lv], vi) => {
      const lfoR = 0.04 + 0.027 * vi + 0.011 * c,
        ph = vi * 1.7 + c;
      const det = [
          [1.0004, 1],
          [0.9983, 0.4],
        ],
        pan = ((vi % 5) - 2) * 0.3;
      const wt = (t) => {
        const [a, b] = stages[c];
        return (
          sstep(seg(t, a - xf / 2, a + xf / 2)) *
          (1 - sstep(seg(t, b - xf / 2, b + xf / 2)))
        );
      };
      const t0 = Math.max(0, stages[c][0] - xf),
        t1 = Math.min(dur, stages[c][1] + xf);
      if (t1 <= t0) return;
      m.add(
        t0,
        t1 - t0,
        (x) => {
          const t = t0 + x,
            w = wt(t);
          if (w <= 0) return 0;
          const lfo = 0.65 + 0.35 * Math.sin(TAU * lfoR * t + ph);
          let s = 0;
          for (const [d, a] of det) {
            const p = TAU * f * d * t;
            s +=
              a *
              (Math.sin(p) +
                0.22 * Math.sin(2 * p + ph) +
                0.06 * Math.sin(3 * p));
          }
          return s * 0.5 * lv * lfo * w * padEnv(t);
        },
        0.22 * level,
        pan,
        0.35,
      );
    });
  });
  // air: slow-breathing band-limited noise; louder where airFrom is set (quiet stretch before the end card)
  const l1 = lp(),
    l2 = lp(),
    h1 = hp(),
    b = brown(m.r);
  m.add(
    0,
    dur,
    (t) => {
      const a =
        0.45 +
        0.35 * Math.sin(TAU * 0.11 * t) +
        (airFrom != null
          ? 0.7 *
            sstep(seg(t, airFrom, airFrom + 2)) *
            (1 - sstep(seg(t, EC - 0.3, EC + 0.6)))
          : 0);
      const nz = m.r() * 2 - 1;
      return (
        (h1(l2(l1(nz, 1500 + 700 * Math.sin(TAU * 0.07 * t)), 2200), 180) *
          0.7 +
          b() * 0.6) *
        a *
        sstep(seg(t, start, start + 3))
      );
    },
    0.05 * level,
    0,
    0.3,
  );
}

// ---------- reverb (stereo Schroeder: 4 damped combs + 2 allpass per side), applied to the send bus ----------
function reverb(m, wet = 0.32) {
  const sc = SR / 44100,
    mk = (ds) =>
      ds.map((d) => ({ b: new Float32Array(Math.round(d * sc)), i: 0, y: 0 }));
  const combsL = mk([1687, 1601, 2053, 2251]),
    combsR = mk([1737, 1663, 2111, 2311]),
    apL = mk([556, 441]),
    apR = mk([579, 464]);
  const proc = (inp, combs, ap) => {
    let s = 0;
    for (const c of combs) {
      const o = c.b[c.i];
      c.y = o * 0.55 + c.y * 0.45;
      c.b[c.i] = inp + c.y * 0.86;
      c.i = (c.i + 1) % c.b.length;
      s += o;
    }
    s *= 0.25;
    for (const a of ap) {
      const o = a.b[a.i];
      const y = -s + o;
      a.b[a.i] = s + o * 0.5;
      a.i = (a.i + 1) % a.b.length;
      s = y;
    }
    return s;
  };
  for (let i = 0; i < m.n; i++) {
    m.L[i] += proc(m.sL[i], combsL, apL) * wet;
    m.R[i] += proc(m.sR[i], combsR, apR) * wet;
  }
}
function master(m, fadeIn = 0.5, fadeOut = 1.8) {
  // gentle low cut at 28 Hz (no DC / sub rumble), fade in/out so there is never a pop
  for (const ch of [m.L, m.R]) {
    let x1 = 0,
      y1 = 0;
    const a = Math.exp((-TAU * 28) / SR);
    for (let i = 0; i < m.n; i++) {
      const x = ch[i];
      const y = a * (y1 + x - x1);
      x1 = x;
      y1 = y;
      const t = i / SR;
      ch[i] =
        y *
        sstep(seg(t, 0, fadeIn)) *
        Math.pow(Math.cos((Math.PI / 2) * seg(t, m.dur - fadeOut, m.dur)), 2);
    }
  }
}

// ---------- scores ----------
const score = {
  '01'(m, c) {
    bed(m, c.EC, { level: 1 });
    const N = c.N;
    tick(m, 0.35, 0.05, 1100);
    tick(m, 0.75, 0.05, 1300); // the two gold guides growing in
    for (let i = 0; i < N; i++) {
      // word flip ticks accelerate with the pace
      const p = clamp((0.55 - c.iv[i]) / (0.55 - 0.12));
      tick(m, c.st[i], 0.05 + 0.07 * p, 1500 + 900 * p, ((i % 2) - 0.5) * 0.06);
    }
    swell(m, c.TR0 - 0.1, c.TR1 + 0.1, 0.15); // camera pull-back
    thud(m, c.TR1 + 0.15, 0.1, 82); // the book settles
    for (let k = 0; k < N && c.P2 + k * c.P2IV < c.P2END; k++)
      tick(m, c.P2 + k * c.P2IV, 0.07, 2350, ((k % 2) - 0.5) * 0.06); // pill at 500 wpm
    endcard(m, c.EC);
  },
};
score['01v'] = score['01'];

export function render(id, dur) {
  const c = cuesOf(id),
    m = mixer(dur);
  score[id](m, c);
  reverb(m);
  master(m);
  return { L: m.L, R: m.R, cues: c };
}
export function wav(L, R) {
  // 24-bit-safe float32 WAV (format 3)
  const n = L.length,
    b = Buffer.alloc(44 + n * 8);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 8, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(3, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 8, 28);
  b.writeUInt16LE(8, 32);
  b.writeUInt16LE(32, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) {
    b.writeFloatLE(L[i], 44 + i * 8);
    b.writeFloatLE(R[i], 48 + i * 8);
  }
  return b;
}

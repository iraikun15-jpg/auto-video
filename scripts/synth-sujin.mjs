// もしも日本史ラボ 第3本「崇神」の BGM と効果音をすべて自前で合成して public/sujin/audio.wav に書き出す。
// 崇神回は宮中・祭祀の場面が中心なので、笙（しょう）風の和音＋律旋法の箏で雅楽寄りの静けさにする。
// 既存の音源ファイルは一切使わない（サイン波・ノイズ・カルプラス＝ストロング法の弦＋フィルタのみ）。
// ナレーションは依頼者側で後付けするので、全体は小さめ（目安 -27 LUFS 前後・ピーク -6 dB 以下）に作る。
// 場面の切り替わり・判子・クリックのタイミングは映像と同じ src/sujin/events.ts から読む。
import { build } from "esbuild";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const tmp = path.resolve("node_modules/.cache/sujin-events.mjs");
mkdirSync(path.dirname(tmp), { recursive: true });
await build({ entryPoints: ["src/sujin/events.ts"], bundle: true, platform: "node", format: "esm", outfile: tmp, logLevel: "error" });
const EV = await import(pathToFileURL(tmp).href);
rmSync(tmp);
const { FPS, TOTAL_FRAMES, SEGMENTS, STAMPS, STAMP_LAND, CLICK_AT, PEEL_SEGMENTS, segStart } = EV;

const SR = 48000;
const DUR = TOTAL_FRAMES / FPS;
const N = Math.round(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const revInL = new Float32Array(N);
const revInR = new Float32Array(N);
const secOf = (frame) => frame / FPS;

// ---- 乱数（毎回同じ音になるよう固定） ----
let seed = 20261127;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

// ---- 部品 ----
const lp1 = (x, fc) => {
  const a = Math.exp((-2 * Math.PI * fc) / SR);
  const y = new Float32Array(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) y[i] = s = (1 - a) * x[i] + a * s;
  return y;
};
/** RBJ のバンドパス（fc は時間で変わる関数も可） */
const bandpass = (x, fc, q) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b2, a1, a2;
  const coef = (f) => {
    const w = (2 * Math.PI * f) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al;
    b0 = al / a0; b2 = -al / a0; a1 = (-2 * Math.cos(w)) / a0; a2 = (1 - al) / a0;
  };
  for (let i = 0; i < x.length; i++) {
    if (i % 32 === 0) coef(typeof fc === "function" ? fc(i / SR) : fc);
    const v = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
};
/** at（秒）から buf を足す。pan: -1（左）〜1（右）、rev: リバーブへの送り量 */
const add = (buf, at, gain = 1, pan = 0, rev = 0) => {
  const s0 = Math.round(at * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  for (let i = 0; i < buf.length; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    L[k] += buf[i] * gl;
    R[k] += buf[i] * gr;
    revInL[k] += buf[i] * gl * rev;
    revInR[k] += buf[i] * gr * rev;
  }
};

/** 箏（こと）風の撥弦：カルプラス＝ストロング法 */
const pluck = (freq, dur = 3.2, bright = 0.5) => {
  const n = Math.round(dur * SR);
  const p = Math.max(2, Math.round(SR / freq));
  const line = new Float32Array(p);
  for (let i = 0; i < p; i++) line[i] = rnd() * 2 - 1;
  // 弾いた瞬間の明るさ（ノイズを少しなまらせる）
  for (let k = 0; k < Math.round((1 - bright) * 4); k++) for (let i = 1; i < p; i++) line[i] = 0.5 * (line[i] + line[i - 1]);
  const out = new Float32Array(n);
  const decay = 0.9965;
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const a = line[idx];
    const b = line[(idx + 1) % p];
    out[i] = a;
    line[idx] = decay * 0.5 * (a + b);
    idx = (idx + 1) % p;
  }
  // 胴鳴り（同じ高さのサイン波を薄く）とアタックのやわらげ
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = out[i] * 0.8 + 0.25 * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.9);
    if (i < 96) out[i] *= i / 96;
  }
  return lp1(out, 4200);
};

// ---- BGM：笙（しょう）風の和音（合竹）＋律旋法 D・E・G・A・B の箏 ----
/** 笙風の持続和音：サイン波を少しずつ揺らして重ね、ゆっくり膨らんで消える */
const sho = (freqs, dur) => {
  const n = Math.round(dur * SR);
  const y = new Float32Array(n);
  const ph = freqs.map(() => rnd() * Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const env = Math.min(1, s / 1.6) * Math.min(1, (dur - s) / 1.6);
    let v = 0;
    freqs.forEach((f0, k) => {
      const vib = 1 + 0.0025 * Math.sin(2 * Math.PI * (4.2 + k * 0.3) * s + ph[k]);
      v += Math.sin(2 * Math.PI * f0 * vib * s + ph[k]) + 0.18 * Math.sin(4 * Math.PI * f0 * s + ph[k]);
    });
    y[i] = (v / freqs.length) * env * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.2 * s));
  }
  return lp1(y, 2400);
};
const NOTE = { D3: 146.83, E3: 164.81, G3: 196.0, A3: 220.0, B3: 246.94, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, B4: 493.88, D5: 587.33, E5: 659.26 };
// 和音の進み（約6秒ごとに重なりながら入れ替わる）
const CHORDS = [
  ["A4", "B4", "E5", "D5"],
  ["G4", "A4", "D5", "E5"],
  ["E4", "A4", "B4", "D5"],
  ["G4", "B4", "D5", "E5"],
];
{
  let t = 0.2;
  let k = 0;
  while (t < DUR - 2) {
    const ch = CHORDS[k % CHORDS.length].map((n) => NOTE[n]);
    add(sho(ch, 7.2), t, 0.05, (k % 2 ? 0.25 : -0.25), 0.5);
    t += 6.0;
    k++;
  }
}
// 箏（律旋法）をまばらに
const BPM = 60;
const beat = 60 / BPM;
const PHRASES = [
  ["D4", null, null, "E4", "G4", null, null, null],
  ["A4", null, "G4", null, "E4", null, null, null],
  ["D4", null, "B3", null, "A3", null, null, null],
  ["G3", null, "A3", "B3", "D4", null, null, null],
];
{
  let t = 1.5;
  let ph = 0;
  while (t < DUR - 3.5) {
    PHRASES[ph % PHRASES.length].forEach((nm, i) => {
      if (!nm) return;
      const at = t + i * (beat / 2) + (rnd() - 0.5) * 0.02;
      if (at > DUR - 3) return;
      add(pluck(NOTE[nm], 3.2, 0.35 + rnd() * 0.25), at, 0.075, (rnd() - 0.5) * 0.6, 0.5);
    });
    t += beat * 4 * 1.5; // 間を多めに
    ph++;
  }
}
// 低い持続音（D）
{
  const pad = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const s = i / SR;
    const fade = Math.min(1, s / 3) * Math.min(1, (DUR - s) / 2.5);
    pad[i] = fade * (0.6 * Math.sin(2 * Math.PI * 73.42 * s) + 0.25 * Math.sin(2 * Math.PI * 110.0 * s));
  }
  add(lp1(pad, 500), 0, 0.04, 0, 0.2);
}

// ---- 効果音 ----
/** 竹の御簾が巻き上がる音：細かい木の当たり音が速くなりながら続き、最後に軽い「トン」 */
const peel = () => {
  const n = Math.round(0.5 * SR);
  const y = new Float32Array(n);
  let t = 0;
  let gap = 0.045;
  while (t < 0.42) {
    const s0 = Math.round(t * SR);
    const fq = 1400 + rnd() * 900;
    for (let i = 0; i < Math.round(0.02 * SR) && s0 + i < n; i++) {
      const s = i / SR;
      y[s0 + i] += Math.sin(2 * Math.PI * fq * s) * Math.exp(-s / 0.004) * (0.5 + 0.5 * rnd()) + (rnd() * 2 - 1) * Math.exp(-s / 0.0015) * 0.3;
    }
    t += gap;
    gap = Math.max(0.018, gap * 0.9);
  }
  const s1 = Math.round(0.44 * SR);
  for (let i = 0; i < Math.round(0.05 * SR) && s1 + i < n; i++) {
    const s = i / SR;
    y[s1 + i] += Math.sin(2 * Math.PI * 420 * s) * Math.exp(-s / 0.02) * 0.6;
  }
  return y;
};
/** 判子を押す音：低いトンッ＋紙を押さえる短いノイズ */
const stamp = () => {
  const n = Math.round(0.22 * SR);
  const y = new Float32Array(n);
  let phs = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    phs += (2 * Math.PI * (150 * Math.exp(-s / 0.03) + 70)) / SR;
    y[i] = Math.sin(phs) * Math.exp(-s / 0.045) * 0.9 + (rnd() * 2 - 1) * Math.exp(-s / 0.012) * 0.35;
  }
  return lp1(y, 2500);
};
/** ボタンのクリック音：カチッ（短い高音＋ごく短いノイズ） */
const click = () => {
  const n = Math.round(0.08 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = Math.sin(2 * Math.PI * 2100 * s) * Math.exp(-s / 0.012) * 0.6 + (rnd() * 2 - 1) * Math.exp(-s / 0.003) * 0.7;
  }
  // 戻りの小さなカチッ
  const back = Math.round(0.05 * SR);
  for (let i = back; i < n; i++) {
    const s = (i - back) / SR;
    y[i] += Math.sin(2 * Math.PI * 1500 * s) * Math.exp(-s / 0.008) * 0.3;
  }
  return y;
};

const cues = [];
for (const id of PEEL_SEGMENTS) {
  add(peel(), secOf(segStart(id)), 0.13, -0.2, 0.15);
  cues.push(`御簾 ${id} ${secOf(segStart(id)).toFixed(2)}秒`);
}
for (const s of SEGMENTS) {
  for (const at of STAMPS[s.id]) {
    const fr = segStart(s.id) + at + STAMP_LAND;
    add(stamp(), secOf(fr), 0.3, 0, 0.1);
    cues.push(`判子 ${s.id} ${secOf(fr).toFixed(2)}秒`);
  }
}
{
  const fr = segStart("seg9") + CLICK_AT;
  add(click(), secOf(fr), 0.32, 0.1, 0.08);
  cues.push(`クリック seg9 ${secOf(fr).toFixed(2)}秒`);
}

// ---- 簡単なリバーブ（くし形4本＋オールパス2本） ----
const reverb = (x, seedOffset) => {
  const y = new Float32Array(x.length);
  const combs = [1557, 1617, 1491, 1422].map((d) => Math.round((d + seedOffset) * (SR / 44100)));
  for (const d of combs) {
    const buf = new Float32Array(d);
    let k = 0, filt = 0;
    for (let i = 0; i < x.length; i++) {
      const out = buf[k];
      filt = out * 0.7 + filt * 0.3;
      buf[k] = x[i] + filt * 0.82;
      y[i] += out * 0.25;
      k = (k + 1) % d;
    }
  }
  for (const d of [556, 441].map((v) => Math.round(v * (SR / 44100)))) {
    const buf = new Float32Array(d);
    let k = 0;
    for (let i = 0; i < y.length; i++) {
      const bo = buf[k];
      const v = y[i] + bo * -0.5;
      buf[k] = v;
      y[i] = bo + v * 0.5;
      k = (k + 1) % d;
    }
  }
  return y;
};
const wl = reverb(revInL, 0);
const wr = reverb(revInR, 23);
for (let i = 0; i < N; i++) {
  L[i] += wl[i] * 0.35;
  R[i] += wr[i] * 0.35;
}

// ---- 最後の2秒でフェードアウト ----
for (let i = 0; i < N; i++) {
  const s = i / SR;
  const g = Math.min(1, (DUR - s) / 2);
  L[i] *= g;
  R[i] *= g;
}

// ---- 全体の音量（第2本と同じ -28.5 LUFS 前後にそろえる） ----
for (let i = 0; i < N; i++) {
  L[i] *= 1.13;
  R[i] *= 1.13;
}

// ---- 16bit ステレオ WAV ----
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const limit = Math.pow(10, -6 / 20); // ピークは -6 dB 以下に抑える（ナレーションの余白）
const g = peak > limit ? limit / peak : 1;
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);
mkdirSync("public/sujin", { recursive: true });
writeFileSync("public/sujin/audio.wav", Buffer.concat([header, data]));
console.log(`public/sujin/audio.wav ${DUR.toFixed(2)}秒 ピーク補正 ${(20 * Math.log10(g)).toFixed(1)} dB`);
console.log(cues.join("\n"));

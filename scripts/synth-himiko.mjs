// もしも日本史ラボ 第6本「卑弥呼」の BGM と効果音をすべて自前で合成して public/himiko/audio.wav に書き出す。
// 舞台は「中国の史書の中の日本」なので、古琴（七弦琴）風の撥弦＋簫（しょう）風の笛で静かにする。
// 冒頭0秒に拍子木＋太鼓の一打（フック）を入れる。
// 既存の音源ファイルは一切使わない（サイン波・ノイズ・カルプラス＝ストロング法の弦＋フィルタのみ）。
// ナレーションは依頼者側で後付けするので、全体は小さめ（目安 -27 LUFS 前後・ピーク -6 dB 以下）に作る。
// 場面の切り替わり・判子・クリックのタイミングは映像と同じ src/himiko/events.ts から読む。
import { build } from "esbuild";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const tmp = path.resolve("node_modules/.cache/himiko-events.mjs");
mkdirSync(path.dirname(tmp), { recursive: true });
await build({ entryPoints: ["src/himiko/events.ts"], bundle: true, platform: "node", format: "esm", outfile: tmp, logLevel: "error" });
const EV = await import(pathToFileURL(tmp).href);
rmSync(tmp);
const { FPS, TOTAL_FRAMES, SEGMENTS, STAMPS, STAMP_LAND, CLICK_AT, PEEL_SEGMENTS, HOOK_AT, MIRRORS_FROM, MIRRORS_TO, segStart } = EV;

const SR = 48000;
const DUR = TOTAL_FRAMES / FPS;
const N = Math.round(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const revInL = new Float32Array(N);
const revInR = new Float32Array(N);
const secOf = (frame) => frame / FPS;

// ---- 乱数（毎回同じ音になるよう固定） ----
let seed = 20261201;
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

// ---- BGM：古琴風の撥弦（D の宮調 D・E・F#・A・B）＋簫風の笛 ----
const HZ = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** 古琴風：低めの撥弦。弾いたあと少し音程が沈む（揉弦のような揺れ） */
const qin = (freq, dur = 4) => {
  const n = Math.round(dur * SR);
  const p0 = SR / freq;
  const len = Math.ceil(p0 * 1.05) + 2;
  const line = new Float32Array(len);
  for (let i = 0; i < len; i++) line[i] = rnd() * 2 - 1;
  for (let k = 0; k < 3; k++) for (let i = 1; i < len; i++) line[i] = 0.5 * (line[i] + line[i - 1]);
  const out = new Float32Array(n);
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const p = Math.round(p0 * (1 + 0.012 * (1 - Math.exp(-s / 0.5)) + 0.003 * Math.sin(2 * Math.PI * 5 * s) * Math.min(1, s)));
    const a = line[idx % len];
    const bb = line[(idx + 1) % len];
    out[i] = a;
    line[idx % len] = 0.998 * 0.5 * (a + bb);
    idx = (idx + 1) % Math.min(p, len);
  }
  for (let i = 0; i < 120 && i < n; i++) out[i] *= i / 120;
  return lp1(out, 2600);
};
/** 簫風の笛：サイン波に息のノイズを少し混ぜ、ゆっくり出入りする */
const xiao = (freq, dur) => {
  const n = Math.round(dur * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const env = Math.min(1, s / 0.5) * Math.min(1, (dur - s) / 0.8);
    const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 4.8 * s) * Math.min(1, s / 0.8);
    y[i] = (Math.sin(2 * Math.PI * freq * vib * s) * 0.9 + Math.sin(4 * Math.PI * freq * vib * s) * 0.12) * env + (rnd() * 2 - 1) * 0.05 * env;
  }
  return lp1(y, 2800);
};
const GONG = [50, 52, 54, 57, 59, 62, 64, 66, 69];
// 古琴のゆったりした旋律
{
  const PH = [
    [5, null, 3, null, 4, null, null, null],
    [3, null, 2, 1, 0, null, null, null],
    [4, null, 5, null, 7, 6, null, null],
    [5, null, 4, null, 3, null, null, null],
  ];
  const beat = 60 / 66;
  let t = 1.4;
  let p = 0;
  while (t < DUR - 3) {
    PH[p % PH.length].forEach((idx, i) => {
      if (idx === null) return;
      const at = t + i * (beat / 2);
      if (at > DUR - 3) return;
      add(qin(HZ(GONG[idx])), at, 0.12, (rnd() - 0.5) * 0.5, 0.45);
    });
    // 低い開放弦（支え）
    add(qin(HZ(38), 5), t, 0.08, -0.2, 0.4);
    t += beat * 4 * 1.35;
    p++;
  }
}
// 簫の長い音（間をあけて）
{
  const notes = [74, 71, 69, 66, 69, 71];
  let t = 5.0;
  let k = 0;
  while (t < DUR - 5) {
    add(xiao(HZ(notes[k % notes.length]), 3.6), t, 0.05, 0.25, 0.6);
    t += 8.5;
    k++;
  }
}
// 低い持続音
{
  const pad = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const s = i / SR;
    const fade = Math.min(1, s / 3) * Math.min(1, (DUR - s) / 2.5);
    pad[i] = fade * (0.6 * Math.sin(2 * Math.PI * 73.42 * s) + 0.3 * Math.sin(2 * Math.PI * 110.0 * s));
  }
  add(lp1(pad, 450), 0, 0.035, 0, 0.2);
}

// ---- 効果音 ----
/** 書物のページをめくる音：紙がすれる短いノイズ＋ぱたん */
const peel = () => {
  const n = Math.round(0.45 * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = rnd() * 2 - 1;
  const y = bandpass(x, (s) => 1800 + 1400 * Math.sin(Math.min(1, s / 0.3) * Math.PI), 0.9);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] *= Math.min(1, s / 0.04) * Math.exp(-Math.max(0, s - 0.08) / 0.09) * 0.8;
  }
  const s1 = Math.round(0.3 * SR);
  for (let i = 0; i < Math.round(0.08 * SR) && s1 + i < n; i++) {
    const s = i / SR;
    y[s1 + i] += (rnd() * 2 - 1) * Math.exp(-s / 0.01) * 0.5;
  }
  return lp1(y, 6000);
};
/** 冒頭フック：拍子木の「カンッ」＋低い太鼓の一打 */
const hook = () => {
  const n = Math.round(1.2 * SR);
  const y = new Float32Array(n);
  // 拍子木（硬い木の打音 2 発）
  [0, 0.11].forEach((st, k) => {
    const s0 = Math.round(st * SR);
    for (let i = 0; s0 + i < n && i < 0.12 * SR; i++) {
      const s = i / SR;
      y[s0 + i] += (Math.sin(2 * Math.PI * 1850 * s) * 0.6 + Math.sin(2 * Math.PI * 2780 * s) * 0.35 + (rnd() * 2 - 1) * Math.exp(-s / 0.002) * 0.6) * Math.exp(-s / 0.025) * (k ? 0.8 : 1);
    }
  });
  // 太鼓（低い一打）
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    ph += (2 * Math.PI * (70 * Math.exp(-s / 0.12) + 52)) / SR;
    y[i] += Math.sin(ph) * Math.exp(-s / 0.32) * 0.9 + (rnd() * 2 - 1) * Math.exp(-s / 0.015) * 0.2;
  }
  return y;
};
/** 銅鏡が並ぶときの小さな鈴 */
const ting = (freq) => {
  const n = Math.round(0.5 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = Math.sin(2 * Math.PI * freq * s + 1.5 * Math.sin(2 * Math.PI * freq * 2.7 * s) * Math.exp(-s / 0.05)) * Math.exp(-s / 0.18);
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
  add(peel(), secOf(segStart(id)), 0.16, -0.2, 0.15);
  cues.push(`ページめくり ${id} ${secOf(segStart(id)).toFixed(2)}秒`);
}
for (const s of SEGMENTS) {
  for (const at of STAMPS[s.id]) {
    const fr = segStart(s.id) + at + STAMP_LAND;
    add(stamp(), secOf(fr), 0.3, 0, 0.1);
    cues.push(`判子 ${s.id} ${secOf(fr).toFixed(2)}秒`);
  }
}
{
  const fr = segStart("seg1") + HOOK_AT;
  add(hook(), secOf(fr), 0.2, 0, 0.25);
  cues.push(`冒頭フック（拍子木＋太鼓） seg1 ${secOf(fr).toFixed(2)}秒`);
}
{
  // 銅鏡が並ぶ間、10枚ごとに小さな鈴（音程を少しずつ上げる）
  for (let k = 0; k < 10; k++) {
    const fr = segStart("seg3") + MIRRORS_FROM + ((MIRRORS_TO - MIRRORS_FROM) * k) / 10;
    add(ting(1568 * Math.pow(2, (k % 5) / 12 * 2)), secOf(fr), 0.05, (k % 2 ? 0.3 : -0.3), 0.4);
  }
  cues.push(`銅鏡の鈴 seg3 ${secOf(segStart("seg3") + MIRRORS_FROM).toFixed(2)}〜${secOf(segStart("seg3") + MIRRORS_TO).toFixed(2)}秒`);
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

// ---- 全体の音量（これまでの回と同じ -28.5 LUFS 前後にそろえる） ----
for (let i = 0; i < N; i++) {
  L[i] *= 0.97;
  R[i] *= 0.97;
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
mkdirSync("public/himiko", { recursive: true });
writeFileSync("public/himiko/audio.wav", Buffer.concat([header, data]));
console.log(`public/himiko/audio.wav ${DUR.toFixed(2)}秒 ピーク補正 ${(20 * Math.log10(g)).toFixed(1)} dB`);
console.log(cues.join("\n"));

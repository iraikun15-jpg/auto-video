// もしも日本史ラボ 第4本「草薙剣」の BGM と効果音をすべて自前で合成して public/kusanagi/audio.wav に書き出す。
// 神話ファンタジー寄りの回なので、浮遊感のある持続和音＋ガラスの鈴のような音で、幻想的で静かにする（戦闘系にしない）。
// 既存の音源ファイルは一切使わない（サイン波・ノイズ・カルプラス＝ストロング法の弦＋フィルタのみ）。
// ナレーションは依頼者側で後付けするので、全体は小さめ（目安 -27 LUFS 前後・ピーク -6 dB 以下）に作る。
// 場面の切り替わり・判子・クリックのタイミングは映像と同じ src/kusanagi/events.ts から読む。
import { build } from "esbuild";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const tmp = path.resolve("node_modules/.cache/kusanagi-events.mjs");
mkdirSync(path.dirname(tmp), { recursive: true });
await build({ entryPoints: ["src/kusanagi/events.ts"], bundle: true, platform: "node", format: "esm", outfile: tmp, logLevel: "error" });
const EV = await import(pathToFileURL(tmp).href);
rmSync(tmp);
const { FPS, TOTAL_FRAMES, SEGMENTS, STAMPS, STAMP_LAND, CLICK_AT, PEEL_SEGMENTS, SLASHES, GATE_CLOSE, segStart } = EV;

const SR = 48000;
const DUR = TOTAL_FRAMES / FPS;
const N = Math.round(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const revInL = new Float32Array(N);
const revInR = new Float32Array(N);
const secOf = (frame) => frame / FPS;

// ---- 乱数（毎回同じ音になるよう固定） ----
let seed = 20261128;
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

// ---- BGM：浮遊感のある持続和音（D のリディア風）＋ガラスの鈴 ----
/** やわらかい持続和音：少しずつ揺れるサイン波を重ね、ゆっくり膨らんで消える */
const pad = (freqs, dur) => {
  const n = Math.round(dur * SR);
  const y = new Float32Array(n);
  const ph = freqs.map(() => rnd() * Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const env = Math.min(1, s / 2.2) * Math.min(1, (dur - s) / 2.2);
    let v = 0;
    freqs.forEach((f0, k) => {
      const det = 1 + 0.003 * Math.sin(2 * Math.PI * (0.13 + k * 0.05) * s + ph[k]);
      v += Math.sin(2 * Math.PI * f0 * det * s + ph[k]) + 0.5 * Math.sin(2 * Math.PI * f0 * 1.004 * s + ph[k] * 1.7);
    });
    y[i] = (v / freqs.length) * env;
  }
  return lp1(y, 1800);
};
/** ガラスの鈴（FM 合成：澄んだ倍音が長く尾を引く） */
const bell = (freq, dur = 3.5) => {
  const n = Math.round(dur * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const mod = Math.sin(2 * Math.PI * freq * 3.5 * s) * 2.2 * Math.exp(-s / 0.4);
    y[i] = Math.sin(2 * Math.PI * freq * s + mod) * Math.exp(-s / 1.1) * Math.min(1, i / 60);
  }
  return y;
};
const HZ = (m) => 440 * Math.pow(2, (m - 69) / 12);
// 和音（MIDI 番号）：D・E/D・Bm・G を、重なりながら約7.5秒ごとに入れ替える
const CHORDS = [
  [50, 57, 62, 66, 69, 76],
  [50, 56, 59, 64, 68, 71],
  [47, 54, 62, 66, 69, 73],
  [43, 55, 62, 66, 71, 74],
];
{
  let t = 0;
  let k = 0;
  while (t < DUR - 2) {
    add(pad(CHORDS[k % CHORDS.length].map(HZ), 9.5), t, 0.06, k % 2 ? 0.2 : -0.2, 0.6);
    t += 7.5;
    k++;
  }
}
// 鈴のアルペジオ（まばらに、和音の音から選ぶ）
{
  let t = 1.2;
  let k = 0;
  while (t < DUR - 3) {
    const ch = CHORDS[Math.floor(t / 7.5) % CHORDS.length];
    const note = ch[2 + Math.floor(rnd() * 4)] + 12;
    add(bell(HZ(note)), t, 0.035, (rnd() - 0.5) * 1.2, 0.7);
    t += 0.9 + rnd() * 1.4;
    k++;
  }
}
// 深い低音（ゆっくり息をする）
{
  const low = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const s = i / SR;
    const fade = Math.min(1, s / 3) * Math.min(1, (DUR - s) / 2.5);
    low[i] = fade * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.08 * s)) * Math.sin(2 * Math.PI * 36.71 * s);
  }
  add(lp1(low, 300), 0, 0.09, 0, 0.1);
}

// ---- 効果音 ----
/** 剣閃：風を切る音（高い帯域へ一気に動くノイズ）＋金属の澄んだ響き。big で大きな一閃 */
const swish = (big = false) => {
  const n = Math.round((big ? 1.4 : 0.9) * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = rnd() * 2 - 1;
  const y = bandpass(x, (s) => 600 + 5200 * Math.min(1, s / (big ? 0.18 : 0.14)), 0.9);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const e = Math.min(1, s / 0.03) * Math.exp(-Math.max(0, s - 0.05) / (big ? 0.09 : 0.06));
    y[i] *= e * 0.8;
    // 金属の響き（少し遅れて立ち上がる）
    const r = Math.max(0, s - 0.06);
    y[i] += (Math.sin(2 * Math.PI * 2650 * r) * 0.5 + Math.sin(2 * Math.PI * 3970 * r) * 0.3 + Math.sin(2 * Math.PI * 5310 * r) * 0.15) * Math.exp(-r / (big ? 0.5 : 0.3)) * (s > 0.06 ? 0.35 : 0);
  }
  return y;
};
const peel = () => swish(false);
/** 門が閉まる音：低いドン＋木の当たる音 */
const gateThud = () => {
  const n = Math.round(0.8 * SR);
  const y = new Float32Array(n);
  let phs = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    phs += (2 * Math.PI * (90 * Math.exp(-s / 0.08) + 48)) / SR;
    y[i] = Math.sin(phs) * Math.exp(-s / 0.18) * 0.9 + (rnd() * 2 - 1) * Math.exp(-s / 0.02) * 0.25;
  }
  return lp1(y, 1200);
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
  add(peel(), secOf(segStart(id)), 0.12, -0.2, 0.25);
  cues.push(`剣閃 ${id} ${secOf(segStart(id)).toFixed(2)}秒`);
}
for (const s of SEGMENTS) {
  for (const at of STAMPS[s.id]) {
    const fr = segStart(s.id) + at + STAMP_LAND;
    add(stamp(), secOf(fr), 0.3, 0, 0.1);
    cues.push(`判子 ${s.id} ${secOf(fr).toFixed(2)}秒`);
  }
}
for (const s of SEGMENTS) {
  for (const at of SLASHES[s.id]) {
    const fr = segStart(s.id) + at - 3;
    add(swish(true), secOf(fr), 0.2, 0.1, 0.3);
    cues.push(`一閃 ${s.id} ${secOf(fr).toFixed(2)}秒`);
  }
}
{
  const fr = segStart("seg5") + GATE_CLOSE;
  add(gateThud(), secOf(fr), 0.32, -0.3, 0.2);
  cues.push(`不開門が閉まる seg5 ${secOf(fr).toFixed(2)}秒`);
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

// ---- 全体の音量（第2・3本と同じ -28.5 LUFS 前後にそろえる） ----
for (let i = 0; i < N; i++) {
  L[i] *= 0.9;
  R[i] *= 0.9;
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
mkdirSync("public/kusanagi", { recursive: true });
writeFileSync("public/kusanagi/audio.wav", Buffer.concat([header, data]));
console.log(`public/kusanagi/audio.wav ${DUR.toFixed(2)}秒 ピーク補正 ${(20 * Math.log10(g)).toFixed(1)} dB`);
console.log(cues.join("\n"));

// あった？なかった？古代史 第10本「聖徳太子」の BGM と効果音をすべて自前で合成して public/shotoku/audio.wav に書き出す。
// 飛鳥の寺（法隆寺）の回なので、箏風の撥弦（律旋法）をゆったり＋温かい低い持続和音＋遠くの磬（けい）の澄んだ響き。
// 伝説（夢物語）の場面だけ、高いガラスの鈴のきらめきを重ねて質感を変える。戦闘系にはしない。
// 冒頭0秒に拍子木＋太鼓の一打（フック）を入れる。
// 既存の音源ファイルは一切使わない（サイン波・ノイズ・カルプラス＝ストロング法の弦＋フィルタのみ）。
// ナレーションは依頼者側で後付けするので、全体は小さめ（目安 -28 LUFS 前後・ピーク -6 dB 以下）に作る。
// 場面の切り替わり・判子・クリックのタイミングは映像と同じ src/shotoku/events.ts から読む。
import { build } from "esbuild";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const tmp = path.resolve("node_modules/.cache/shotoku-events.mjs");
mkdirSync(path.dirname(tmp), { recursive: true });
await build({ entryPoints: ["src/shotoku/events.ts"], bundle: true, platform: "node", format: "esm", outfile: tmp, logLevel: "error" });
const EV = await import(pathToFileURL(tmp).href);
rmSync(tmp);
const { FPS, TOTAL_FRAMES, SEGMENTS, STAMPS, STAMP_LAND, CLICK_AT, PEEL_SEGMENTS, HOOK_AT, BUBBLES_SEG5, DREAM_FADE, CAPS_AT, SCROLL_AT, SHIP_AT, BUILD_AT, LINK_AT, segStart } = EV;

const SR = 48000;
const DUR = TOTAL_FRAMES / FPS;
const N = Math.round(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const revInL = new Float32Array(N);
const revInR = new Float32Array(N);
const secOf = (frame) => frame / FPS;

// ---- 乱数（毎回同じ音になるよう固定） ----
let seed = 20261205;
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

// ---- BGM：箏風の撥弦（律旋法 D・E・G・A・B）＋低い持続和音＋遠くの磬 ----
const HZ = (m) => 440 * Math.pow(2, (m - 69) / 12);
const RITSU = [62, 64, 67, 69, 71, 74, 76, 79]; // 律旋法
const segSec = (id) => secOf(segStart(id));
const seg5a = segSec("seg5");
const seg5b = seg5a + secOf(DREAM_FADE);
// 箏のゆったりした旋律（4小節で1周、間を多めに）
{
  const PH = [
    [4, null, 3, null, 2, null, null, null],
    [1, null, 2, 3, 2, null, null, null],
    [5, null, 4, null, 3, 4, null, null],
    [2, null, 1, null, 0, null, null, null],
  ];
  const beat = 60 / 62;
  let t = 1.2;
  let p = 0;
  while (t < DUR - 3) {
    PH[p % PH.length].forEach((idx, i) => {
      if (idx === null) return;
      const at = t + i * (beat / 2);
      if (at > DUR - 3) return;
      add(pluck(HZ(RITSU[idx]), 3.2, 0.35), at, 0.1, (rnd() - 0.5) * 0.6, 0.45);
    });
    // 低い開放弦（支え）
    add(pluck(HZ(38), 4, 0.2), t, 0.08, -0.2, 0.4);
    t += beat * 4 * 1.3;
    p++;
  }
}
// 温かい持続和音（D・A・E の5度重ね。ゆっくり揺れる）
{
  const pad = new Float32Array(N);
  const fr = [73.42, 110.0, 146.83, 164.81];
  for (let i = 0; i < N; i++) {
    const s = i / SR;
    const fade = Math.min(1, s / 3) * Math.min(1, (DUR - s) / 2.5);
    let v = 0;
    fr.forEach((q, k) => (v += Math.sin(2 * Math.PI * q * s * (1 + 0.0015 * Math.sin(2 * Math.PI * (0.1 + k * 0.03) * s))) * (k ? 0.3 : 0.6)));
    pad[i] = fade * v * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.07 * s));
  }
  add(lp1(pad, 600), 0, 0.04, 0, 0.25);
}
// 磬（寺の澄んだ金属の響き）を時々
const kei = (base = 523) => {
  const n = Math.round(5 * SR);
  const y = new Float32Array(n);
  [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.9, 0.12]].forEach(([m, a]) => {
    for (let i = 0; i < n; i++) {
      const s = i / SR;
      y[i] += Math.sin(2 * Math.PI * base * m * s) * Math.exp(-s / (2.2 / m ** 0.6)) * a * 0.4 * Math.min(1, i / 60);
    }
  });
  return lp1(y, 5000);
};
for (const t of [2.4, 20.5, 47.5]) add(kei(), t, 0.07, 0.3, 0.6);
// 伝説（夢）の場面：高いガラスの鈴のきらめき（seg5 前半と seg1 に薄く）
const glass = (freq) => {
  const n = Math.round(1.6 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = Math.sin(2 * Math.PI * freq * s + 0.8 * Math.sin(2 * Math.PI * freq * 3.5 * s) * Math.exp(-s / 0.2)) * Math.exp(-s / 0.6) * Math.min(1, i / 40);
  }
  return y;
};
{
  const scale = [86, 88, 91, 93, 95, 98];
  for (let t = seg5a + 0.2; t < seg5b; t += 0.42) add(glass(HZ(scale[Math.floor(rnd() * scale.length)])), t, 0.035, (rnd() - 0.5) * 1.2, 0.7);
  for (let t = 0.3; t < 2.8; t += 0.5) add(glass(HZ(scale[Math.floor(rnd() * scale.length)])), t, 0.025, (rnd() - 0.5) * 1.2, 0.7);
  // seg7 の右半分（夢の側）にもごく薄く
  const s7 = segSec("seg7");
  for (let t = s7 + 0.6; t < s7 + 3.5; t += 0.7) add(glass(HZ(scale[Math.floor(rnd() * scale.length)])), t, 0.02, 0.6, 0.7);
}

// ---- 効果音 ----
/** 色帯が流れ去る音：布がすべるようなやわらかいノイズ */
const peel = () => {
  const n = Math.round(0.6 * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = rnd() * 2 - 1;
  const y = bandpass(x, (s) => 1200 + 1800 * Math.min(1, s / 0.5), 0.8);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] *= Math.sin(Math.min(1, s / 0.6) * Math.PI) * 0.8;
  }
  return lp1(y, 5000);
};
/** 糸が切れる音：ぷつん */
const snapSound = () => {
  const n = Math.round(0.3 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = (Math.sin(2 * Math.PI * 1300 * s * Math.exp(-s / 0.05)) * 0.6 + (rnd() * 2 - 1) * Math.exp(-s / 0.004)) * Math.exp(-s / 0.06);
  }
  return y;
};
/** 札を置く音：コトッ */
const placeSound = () => {
  const n = Math.round(0.2 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = (Math.sin(2 * Math.PI * 520 * s) * 0.7 + Math.sin(2 * Math.PI * 1310 * s) * 0.3) * Math.exp(-s / 0.03);
  }
  return y;
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

/** 光背の窓が開く音：やわらかい息のふくらみ＋小さな磬 */
const haloSwell = () => {
  const n = Math.round(0.7 * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = rnd() * 2 - 1;
  const y = bandpass(x, (s) => 700 + 2200 * Math.min(1, s / 0.5), 1.2);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] *= Math.sin(Math.min(1, s / 0.7) * Math.PI) * 0.7;
  }
  return lp1(y, 4500);
};
/** 紙の巻物が開く・旗が倒れる：さらさら */
const rustle = (dur = 0.9) => {
  const n = Math.round(dur * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = (rnd() * 2 - 1) * (0.5 + 0.5 * Math.abs(Math.sin(i / SR * 37)));
  const y = bandpass(x, 2600, 0.7);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] *= Math.sin((s / dur) * Math.PI);
  }
  return y;
};
/** 船の水音：ゆっくりした波のさざめき */
const water = (dur = 3.5) => {
  const n = Math.round(dur * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = rnd() * 2 - 1;
  const y = bandpass(x, (s) => 500 + 300 * Math.sin(2 * Math.PI * 0.6 * s), 0.9);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] *= (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.6 * s)) * Math.min(1, s / 0.5) * Math.min(1, (dur - s) / 0.8);
  }
  return lp1(y, 1800);
};
/** 木の部材を置く音：コトン（低め） */
const wood = (f0 = 320) => {
  const n = Math.round(0.25 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = (Math.sin(2 * Math.PI * f0 * s) * 0.7 + Math.sin(2 * Math.PI * f0 * 2.3 * s) * 0.25 + (rnd() * 2 - 1) * Math.exp(-s / 0.003) * 0.4) * Math.exp(-s / 0.045);
  }
  return y;
};
/** 夢がしぼむ：下がっていくガラスの音 */
const dreamFade = () => {
  const n = Math.round(1.2 * SR);
  const y = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    ph += (2 * Math.PI * (1800 * Math.exp(-s / 0.5) + 400)) / SR;
    y[i] = Math.sin(ph) * Math.exp(-s / 0.5) * 0.6;
  }
  return y;
};

const cues = [];
for (const id of PEEL_SEGMENTS) {
  add(haloSwell(), secOf(segStart(id)), 0.15, -0.1, 0.25);
  cues.push(`光背の窓 ${id} ${secOf(segStart(id)).toFixed(2)}秒`);
}
for (const s of SEGMENTS) {
  for (const at of STAMPS[s.id]) {
    const fr = Math.max(0, segStart(s.id) + at + STAMP_LAND);
    add(stamp(), secOf(fr), fr === 0 ? 0.1 : 0.3, 0, 0.1); // 0秒はフックの太鼓と重なるので小さく
    cues.push(`判子 ${s.id} ${secOf(fr).toFixed(2)}秒`);
  }
}
{
  const fr = segStart("seg1") + HOOK_AT;
  add(hook(), secOf(fr), 0.2, 0, 0.25);
  cues.push(`冒頭フック（拍子木＋太鼓） seg1 ${secOf(fr).toFixed(2)}秒`);
}
{
  // 前回の札から太子が出てくる（小さな鈴）
  add(ting(1568), secOf(segStart("seg2") + LINK_AT), 0.08, 0.2, 0.4);
  // 冠が並ぶ（木の小さな音を12回、ごく小さく）
  for (let i = 0; i < 12; i++) add(wood(600 + (i % 6) * 40), secOf(segStart("seg3") + CAPS_AT + i * 4 + 6), 0.06, (i / 11 - 0.5) * 0.8, 0.15);
  add(rustle(1.3), secOf(segStart("seg3") + SCROLL_AT), 0.18, 0, 0.2);
  cues.push(`巻物が開く seg3 ${secOf(segStart("seg3") + SCROLL_AT).toFixed(2)}秒`);
  add(water(3.6), secOf(segStart("seg4") + SHIP_AT), 0.12, 0.2, 0.3);
  BUILD_AT.forEach((b, k) => add(wood(260 - k * 10), secOf(segStart("seg4") + b + 8), 0.18, (k % 2 ? 0.25 : -0.25), 0.25));
  cues.push(`法隆寺の部材 seg4 ${secOf(segStart("seg4") + BUILD_AT[0] + 8).toFixed(2)}〜${secOf(segStart("seg4") + BUILD_AT[BUILD_AT.length - 1] + 8).toFixed(2)}秒`);
  BUBBLES_SEG5.forEach((b, k) => add(ting(1200 + (k % 5) * 160), secOf(segStart("seg5") + b), 0.035, (k / 9 - 0.5) * 1.4, 0.4));
  add(dreamFade(), secOf(segStart("seg5") + DREAM_FADE), 0.08, 0, 0.5);
  cues.push(`夢がしぼむ seg5 ${secOf(segStart("seg5") + DREAM_FADE).toFixed(2)}秒`);
  add(rustle(0.7), secOf(segStart("seg6") + 50), 0.12, 0.3, 0.2);
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

// ---- 全体の音量（これまでの回と同じ -28 LUFS 前後にそろえる） ----
for (let i = 0; i < N; i++) {
  L[i] *= 1.1;
  R[i] *= 1.1;
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
mkdirSync("public/shotoku", { recursive: true });
writeFileSync("public/shotoku/audio.wav", Buffer.concat([header, data]));
console.log(`public/shotoku/audio.wav ${DUR.toFixed(2)}秒 ピーク補正 ${(20 * Math.log10(g)).toFixed(1)} dB`);
console.log(cues.join("\n"));

// 日本史キット：台本（src/history/generated.json）から BGM と効果音を自前で合成し、
// public/history/<id>/audio.wav に書き出す。
//   node scripts/synth-history.mjs <id>
//
// これまでの回（synth-shotoku.mjs など）と同じ作り方：既存の音源ファイルは使わず、
// サイン波・ノイズ・カルプラス＝ストロング法の弦＋フィルタだけで作る。
// 効果音の位置は映像と同じデータ（events）から決めるので、映像とずれない。
// ナレーションは依頼者側で後付けするので、全体は小さめ（既定 -28 LUFS・ピーク -6 dB 以下）。
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const id = process.argv[2];
const ep = JSON.parse(readFileSync("src/history/generated.json", "utf8")).find((e) => e.id === id);
if (!ep) {
  console.error(`history/${id}.yaml が見つかりません（先に node scripts/build-history.mjs）`);
  process.exit(1);
}
const { fps: FPS, totalFrames, audio: A, style, scenes, events } = ep;

const SR = 48000;
const DUR = totalFrames / FPS;
const N = Math.round(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const revInL = new Float32Array(N);
const revInR = new Float32Array(N);
const secOf = (frame) => frame / FPS;

// ---- 乱数（台本の名前から種を作り、毎回同じ音になるようにする） ----
let seed = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 20261127);
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
const bandpass = (x, fc, q) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b2, a1, a2;
  const coef = (fr) => {
    const w = (2 * Math.PI * fr) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al;
    b0 = al / a0; b2 = -al / a0; a1 = (-2 * Math.cos(w)) / a0; a2 = (1 - al) / a0;
  };
  for (let i = 0; i < x.length; i++) {
    if (i % 32 === 0) coef(typeof fc === "function" ? fc(i / SR) : fc);
    const v = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
};
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
const HZ = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** 撥弦（カルプラス＝ストロング法）。bright で弾いた瞬間の明るさ、decay で余韻 */
const pluck = (freq, dur = 3.2, bright = 0.5, decay = 0.9965, body = 0.25) => {
  const n = Math.round(dur * SR);
  const p = Math.max(2, Math.round(SR / freq));
  const line = new Float32Array(p);
  for (let i = 0; i < p; i++) line[i] = rnd() * 2 - 1;
  for (let k = 0; k < Math.round((1 - bright) * 4); k++) for (let i = 1; i < p; i++) line[i] = 0.5 * (line[i] + line[i - 1]);
  const out = new Float32Array(n);
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const a = line[idx];
    const b = line[(idx + 1) % p];
    out[i] = a;
    line[idx] = decay * 0.5 * (a + b);
    idx = (idx + 1) % p;
  }
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = out[i] * 0.8 + body * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.9);
    if (i < 96) out[i] *= i / 96;
  }
  return lp1(out, 4200);
};
/** 木琴風の撥音（陽気な回向け） */
const mallet = (freq) => {
  const n = Math.round(1.2 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = (Math.sin(2 * Math.PI * freq * s) * Math.exp(-s / 0.35) + 0.3 * Math.sin(2 * Math.PI * freq * 3.9 * s) * Math.exp(-s / 0.08)) * Math.min(1, i / 30);
  }
  return y;
};
/** 楽器ごとの1音 */
const note = (freq) => {
  switch (A.instrument) {
    case "biwa": // 琵琶：低めで明るく、余韻は短め（さわりの雑味）
      return pluck(freq / 2, 2.2, 0.85, 0.993, 0.15);
    case "guqin": // 古琴：やわらかく長い余韻
      return pluck(freq / 2, 4.5, 0.15, 0.9975, 0.35);
    case "mallet":
      return mallet(freq);
    default: // 箏
      return pluck(freq, 3.2, 0.35);
  }
};

// ---- BGM：選んだ音階でゆったりした旋律（4小節で1周、間を多めに） ----
{
  const PH = [
    [4, null, 3, null, 2, null, null, null],
    [1, null, 2, 3, 2, null, null, null],
    [5, null, 4, null, 3, 4, null, null],
    [2, null, 1, null, 0, null, null, null],
  ];
  const beat = 60 / A.tempo;
  let t = 1.2;
  let p = 0;
  while (t < DUR - 3) {
    PH[p % PH.length].forEach((idx, i) => {
      if (idx === null) return;
      const at = t + i * (beat / 2);
      if (at > DUR - 3) return;
      add(note(HZ(A.scale[idx])), at, A.instrument === "mallet" ? 0.07 : 0.1, (rnd() - 0.5) * 0.6, 0.45);
    });
    add(pluck(HZ(38), 4, 0.2), t, 0.08, -0.2, 0.4); // 低い開放弦（支え）
    t += beat * 4 * 1.3;
    p++;
  }
}
// 温かい持続和音（音階の主音と5度。ゆっくり揺れる）
if (A.pad) {
  const pad = new Float32Array(N);
  const root = HZ(A.scale[0] - 24);
  const fr = [root, root * 1.5, root * 2, root * 3];
  for (let i = 0; i < N; i++) {
    const s = i / SR;
    const fade = Math.min(1, s / 3) * Math.min(1, (DUR - s) / 2.5);
    let v = 0;
    fr.forEach((q, k) => (v += Math.sin(2 * Math.PI * q * s * (1 + 0.0015 * Math.sin(2 * Math.PI * (0.1 + k * 0.03) * s))) * (k ? 0.3 : 0.6)));
    pad[i] = fade * v * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.07 * s));
  }
  add(lp1(pad, 600), 0, 0.04, 0, 0.25);
}
// 遠くの鐘（磬）を、2場面目・中ほど・判定の前に
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
if (A.gong) {
  const verdict = scenes.find((s) => s.type === "verdict");
  const times = [scenes[1] ? secOf(scenes[1].start) + 0.6 : 2.4, DUR * 0.45, verdict ? secOf(verdict.start) - 0.4 : DUR * 0.8];
  for (const t of times) add(kei(), t, 0.07, 0.3, 0.6);
}
// ガラスの鈴のきらめき（フックと「夢」の対比の場面）
const glass = (freq) => {
  const n = Math.round(1.6 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = Math.sin(2 * Math.PI * freq * s + 0.8 * Math.sin(2 * Math.PI * freq * 3.5 * s) * Math.exp(-s / 0.2)) * Math.exp(-s / 0.6) * Math.min(1, i / 40);
  }
  return y;
};
if (A.bells) {
  const hi = [86, 88, 91, 93, 95, 98];
  for (const s of scenes) {
    const dream = s.type === "compare" && (s.left?.texture === "dream" || s.right?.texture === "dream");
    if (s.type !== "hook" && !dream) continue;
    const a = secOf(s.start) + 0.3;
    const b = secOf(s.start + s.frames) - 0.5;
    for (let t = a; t < b; t += 0.5) add(glass(HZ(hi[Math.floor(rnd() * hi.length)])), t, 0.028, (rnd() - 0.5) * 1.2, 0.7);
  }
}

// ---- 効果音 ----
const noise = (n) => {
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = rnd() * 2 - 1;
  return x;
};
/** 紙・布がすべる（紙めくり・巻物・ページめくり・色帯） */
const rustle = (dur = 0.7) => {
  const n = Math.round(dur * SR);
  const y = bandpass(noise(n).map((v, i) => v * (0.5 + 0.5 * Math.abs(Math.sin((i / SR) * 37)))), 2600, 0.7);
  for (let i = 0; i < n; i++) y[i] *= Math.sin((i / SR / dur) * Math.PI);
  return y;
};
/** 息のふくらみ（光背・雲・剣閃・X線） */
const swell = () => {
  const n = Math.round(0.7 * SR);
  const y = bandpass(noise(n), (s) => 700 + 2200 * Math.min(1, s / 0.5), 1.2);
  for (let i = 0; i < n; i++) y[i] *= Math.sin(Math.min(1, i / SR / 0.7) * Math.PI) * 0.7;
  return lp1(y, 4500);
};
/** 木の音（御簾・襖の木枠） */
const wood = (f0 = 320) => {
  const n = Math.round(0.25 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = (Math.sin(2 * Math.PI * f0 * s) * 0.7 + Math.sin(2 * Math.PI * f0 * 2.3 * s) * 0.25 + (rnd() * 2 - 1) * Math.exp(-s / 0.003) * 0.4) * Math.exp(-s / 0.045);
  }
  return y;
};
/** 札を置く：コトッ */
const place = () => {
  const n = Math.round(0.2 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = (Math.sin(2 * Math.PI * 520 * s) * 0.7 + Math.sin(2 * Math.PI * 1310 * s) * 0.3) * Math.exp(-s / 0.03);
  }
  return y;
};
/** 冒頭フック：拍子木の「カンッ」2発＋低い太鼓の一打 */
const hook = () => {
  const n = Math.round(1.2 * SR);
  const y = new Float32Array(n);
  [0, 0.11].forEach((st, k) => {
    const s0 = Math.round(st * SR);
    for (let i = 0; s0 + i < n && i < 0.12 * SR; i++) {
      const s = i / SR;
      y[s0 + i] += (Math.sin(2 * Math.PI * 1850 * s) * 0.6 + Math.sin(2 * Math.PI * 2780 * s) * 0.35 + (rnd() * 2 - 1) * Math.exp(-s / 0.002) * 0.6) * Math.exp(-s / 0.025) * (k ? 0.8 : 1);
    }
  });
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    ph += (2 * Math.PI * (70 * Math.exp(-s / 0.12) + 52)) / SR;
    y[i] += Math.sin(ph) * Math.exp(-s / 0.32) * 0.9 + (rnd() * 2 - 1) * Math.exp(-s / 0.015) * 0.2;
  }
  return y;
};
/** 判子：低いトンッ＋紙を押さえる短いノイズ */
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
/** 小さな鈴（金の判子） */
const ting = (freq) => {
  const n = Math.round(0.5 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = Math.sin(2 * Math.PI * freq * s + 1.5 * Math.sin(2 * Math.PI * freq * 2.7 * s) * Math.exp(-s / 0.05)) * Math.exp(-s / 0.18);
  }
  return y;
};
/** 登録ボタンのクリック：カチッ */
const click = () => {
  const n = Math.round(0.08 * SR);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    y[i] = Math.sin(2 * Math.PI * 2100 * s) * Math.exp(-s / 0.012) * 0.6 + (rnd() * 2 - 1) * Math.exp(-s / 0.003) * 0.7;
  }
  const back = Math.round(0.05 * SR);
  for (let i = back; i < n; i++) {
    const s = (i - back) / SR;
    y[i] += Math.sin(2 * Math.PI * 1500 * s) * Math.exp(-s / 0.008) * 0.3;
  }
  return y;
};

/** 場面転換の音（転換の種類に合わせる） */
const transitionAt = (t) => {
  const k = style.transition;
  if (k === "sujin" || k === "keitai") {
    add(wood(420), t, 0.12, -0.2, 0.2);
    add(rustle(0.5), t + 0.05, 0.1, 0.2, 0.2);
  } else if (k === "shotoku" || k === "izumo" || k === "kusanagi" || k === "yuryaku") add(swell(), t, 0.15, -0.1, 0.25);
  else add(rustle(0.6), t, 0.13, 0, 0.2);
};

for (const e of events) {
  const t = secOf(e.frame);
  if (e.kind === "hook") add(hook(), t, 0.2, 0, 0.25);
  else if (e.kind === "stamp") add(stamp(), t, e.frame === 0 ? 0.1 : 0.3, 0, 0.1); // 0秒はフックの太鼓と重なるので小さく
  else if (e.kind === "place") add(place(), t, 0.05, (rnd() - 0.5) * 0.6, 0.15);
  else if (e.kind === "transition") transitionAt(t);
  else if (e.kind === "click") add(click(), t, 0.32, 0.1, 0.08);
  else if (e.kind === "ting") add(ting(1568), t, 0.08, 0.3, 0.4);
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
  const g = Math.min(1, (DUR - i / SR) / 2); // 最後の2秒でフェードアウト
  L[i] = (L[i] + wl[i] * 0.35) * g;
  R[i] = (R[i] + wr[i] * 0.35) * g;
}

// ---- 書き出し（ラウドネスを測って目標にそろえ、ピークは -6 dB 以下） ----
const writeWav = (file, gain) => {
  const data = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
};
const measure = (file) => {
  const r = execFileSync("sh", ["-c", `ffmpeg -nostats -i "${file}" -af ebur128=peak=true -f null - 2>&1`], { encoding: "utf8" });
  const sum = r.slice(r.lastIndexOf("Summary:"));
  return { I: Number(/I:\s+(-?[0-9.]+) LUFS/.exec(sum)[1]), peak: Number(/Peak:\s+(-?[0-9.]+) dBFS/.exec(sum)[1]) };
};
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const dir = `public/history/${id}`;
mkdirSync(dir, { recursive: true });
const file = `${dir}/audio.wav`;
let gain = 0.5 / peak;
writeWav(file, gain);
const m = measure(file);
gain *= Math.pow(10, (A.lufs - m.I) / 20);
const limit = Math.pow(10, -6.6 / 20); // 測定はトゥルーピークなので少し余裕を持たせる
if (peak * gain > limit) gain = limit / peak;
writeWav(file, gain);
const m2 = measure(file);
console.log(`${file} ${DUR.toFixed(2)}秒 / ${m2.I} LUFS / ピーク ${m2.peak} dBFS`);

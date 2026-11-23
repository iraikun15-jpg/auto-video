// v4「東京破壊」の音をすべて自前で合成して public/kaiju_v4.wav に書き出す。
// 既存の音源ファイルは一切使わない（サイン波・ノコギリ波・ノイズ＋フィルタのみ）。
// 映像と同じイベント情報（src/kaiju/v4/events.ts）を esbuild で読み込んで、タイミングを同期する。
import { build } from "esbuild";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const tmp = path.resolve("node_modules/.cache/kaiju-v4-events.mjs");
mkdirSync(path.dirname(tmp), { recursive: true });
await build({ entryPoints: ["src/kaiju/v4/events.ts"], bundle: true, platform: "node", format: "esm", outfile: tmp, logLevel: "error" });
const EV = await import(pathToFileURL(tmp).href);
rmSync(tmp);
const { TL, LANDINGS, COLLAPSES, EXPLOSIONS, rootAt } = EV;

const SR = 48000;
const FPS = TL.fps;
const N = Math.round((TL.frames / FPS) * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const sendL = new Float32Array(N); // リバーブへの送り
const sendR = new Float32Array(N);
const fr = (f) => Math.round((f / FPS) * SR);

// ---- 基本部品 ----
let seed = 12345;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = (n) => {
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = rnd() * 2 - 1;
  return a;
};
/** RBJ のバイquad。type: lp/hp/bp。fc は数値または時間で変わる関数 */
const biquad = (x, type, fc, q = 0.707) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let b0, b1, b2, a1, a2;
  const coef = (f) => {
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const cs = Math.cos(w), al = Math.sin(w) / (2 * q);
    let n0, n1, n2;
    if (type === "lp") [n0, n1, n2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
    else if (type === "hp") [n0, n1, n2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    else [n0, n1, n2] = [al, 0, -al];
    const a0 = 1 + al;
    b0 = n0 / a0; b1 = n1 / a0; b2 = n2 / a0; a1 = (-2 * cs) / a0; a2 = (1 - al) / a0;
  };
  const dyn = typeof fc === "function";
  if (!dyn) coef(fc);
  for (let i = 0; i < x.length; i++) {
    if (dyn && i % 32 === 0) coef(fc(i / SR));
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
};
const env = (n, attack, tau, hold = 0) => {
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    e[i] = t < attack ? t / attack : t < attack + hold ? 1 : Math.exp(-(t - attack - hold) / tau);
  }
  return e;
};
const mul = (a, b) => a.map((v, i) => v * (typeof b === "number" ? b : b[i]));
const mix = (...arrs) => {
  const n = Math.max(...arrs.map((a) => a.length));
  const o = new Float32Array(n);
  for (const a of arrs) for (let i = 0; i < a.length; i++) o[i] += a[i];
  return o;
};
/** 周波数が時間で変わる発振器。shape: sin/saw/sq */
const osc = (n, freqFn, shape = "sin", ph0 = 0) => {
  const o = new Float32Array(n);
  let ph = ph0;
  for (let i = 0; i < n; i++) {
    ph += freqFn(i / SR) / SR;
    const p = ph - Math.floor(ph);
    o[i] = shape === "sin" ? Math.sin(2 * Math.PI * p) : shape === "saw" ? 2 * p - 1 : p < 0.5 ? 1 : -1;
  }
  return o;
};
const sat = (x, drive) => x.map((v) => Math.tanh(v * drive) / Math.tanh(drive));

/** バスに置く。pan: -1(左)〜1(右)、send: リバーブ量 */
const place = (sig, startSample, gain, pan = 0, send = 0.2) => {
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  for (let i = 0; i < sig.length; i++) {
    const j = startSample + i;
    if (j < 0 || j >= N) continue;
    L[j] += sig[i] * gl;
    R[j] += sig[i] * gr;
    sendL[j] += sig[i] * gl * send;
    sendR[j] += sig[i] * gr * send;
  }
};

// ---- 効果音 ----

/** 足音：重い低音（周波数が下がるサイン）＋地面を叩くノイズ＋地鳴り */
const footstep = (water) => {
  const n = Math.round(1.6 * SR);
  const sub = mul(osc(n, (t) => 30 + 34 * Math.exp(-t / 0.09)), env(n, 0.004, 0.38));
  const body = mul(biquad(noise(n), "lp", 220), env(n, 0.002, 0.11));
  const crunch = mul(biquad(noise(n), "bp", 1100, 1.2), env(n, 0.001, 0.045));
  const rumble = mul(biquad(noise(n), "lp", 70), env(n, 0.05, 0.55));
  let s = mix(mul(sub, 1.0), mul(body, 1.4), mul(crunch, 0.35), mul(rumble, 1.6));
  if (water) {
    const splash = mul(biquad(noise(n), "bp", (t) => 1800 - t * 900, 0.8), env(n, 0.01, 0.35));
    s = mix(mul(s, 0.7), mul(splash, 0.9));
  }
  return sat(s, 1.6);
};

/** 倒壊：低く崩れる轟音＋砕ける粒＋余韻 */
const collapse = (size, kind) => {
  const dur = 2.2 + size * 0.15;
  const n = Math.round(dur * SR);
  const roar = mul(biquad(noise(n), "lp", (t) => 1400 * Math.exp(-t / 0.7) + 180, 0.9), env(n, 0.03, 0.75));
  const low = mul(osc(n, (t) => 38 + 10 * Math.exp(-t / 0.3)), env(n, 0.02, 0.9));
  const grains = new Float32Array(n);
  const count = 26 + Math.round(size * 6);
  for (let g = 0; g < count; g++) {
    const t0 = Math.pow(rnd(), 1.8) * dur * 0.75;
    const len = Math.round((0.02 + rnd() * 0.06) * SR);
    const fc = 350 + rnd() * 2600;
    const burst = mul(biquad(noise(len), "bp", fc, 2), env(len, 0.002, 0.02));
    const st = Math.round(t0 * SR);
    const amp = (0.4 + rnd() * 0.6) * Math.exp(-t0 / 1.2);
    for (let i = 0; i < len && st + i < n; i++) grains[st + i] += burst[i] * amp;
  }
  const k = kind === "crush" ? 1.1 : 1;
  return sat(mix(mul(roar, 1.1 * k), mul(low, 0.7), mul(grains, 0.9)), 1.4);
};

/** 爆発：衝撃の低音＋閉じていくノイズ＋パチパチ */
const explosion = () => {
  const n = Math.round(2.4 * SR);
  const boom = mul(osc(n, (t) => 24 + 50 * Math.exp(-t / 0.12)), env(n, 0.003, 0.5));
  const blast = mul(biquad(noise(n), "lp", (t) => 2600 * Math.exp(-t / 0.25) + 140), env(n, 0.002, 0.6));
  const crackle = new Float32Array(n);
  for (let c = 0; c < 40; c++) {
    const st = Math.round(rnd() * 1.6 * SR);
    if (st < n) crackle[st] += (rnd() - 0.5) * 2 * Math.exp(-st / SR / 0.8);
  }
  return sat(mix(mul(boom, 1.3), mul(blast, 1.3), biquad(crackle, "hp", 1500)), 2);
};

/** チャージ：上昇する唸り＋電気のはぜる音 */
const charge = (dur) => {
  const n = Math.round(dur * SR);
  const f = (t) => 70 * Math.pow(9, t / dur);
  const tone = mix(osc(n, f, "saw"), osc(n, (t) => f(t) * 1.505, "saw"), mul(osc(n, (t) => f(t) * 2, "sin"), 0.5));
  const trem = osc(n, (t) => 6 + 26 * (t / dur));
  const e = env(n, dur * 0.9, 0.08);
  const shaped = biquad(mul(tone, trem.map((v) => 0.65 + 0.35 * v)), "lp", (t) => 400 + 3200 * (t / dur), 1.4);
  const hiss = biquad(noise(n), "bp", (t) => 800 + 4000 * (t / dur), 1.5);
  const zaps = new Float32Array(n);
  for (let z = 0; z < dur * 26; z++) {
    const t0 = Math.pow(rnd(), 0.6) * dur;
    const len = Math.round(0.012 * SR);
    const st = Math.round(t0 * SR);
    for (let i = 0; i < len && st + i < n; i++) zaps[st + i] += (rnd() * 2 - 1) * (1 - i / len);
  }
  return mul(mix(mul(shaped, 0.6), mul(hiss, 0.4), mul(biquad(zaps, "hp", 2500), 0.5)), e);
};

/** 熱線：放射の轟音（帯域ノイズ）＋低いうなり＋揺らぐ倍音 */
const beam = (dur) => {
  const n = Math.round((dur + 0.6) * SR);
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    e[i] = Math.min(1, t / 0.06) * (t > dur ? Math.exp(-(t - dur) / 0.18) : 1);
  }
  const wob = (t) => 1 + 0.08 * Math.sin(2 * Math.PI * 5.5 * t) + 0.04 * Math.sin(2 * Math.PI * 13 * t);
  const roar = biquad(noise(n), "bp", (t) => 900 * wob(t), 0.6);
  const air = biquad(noise(n), "hp", 3500);
  const hum = mix(osc(n, (t) => 55 * wob(t), "saw"), mul(osc(n, (t) => 110.5 * wob(t), "saw"), 0.6));
  const humF = biquad(hum, "lp", 700);
  const shimmer = osc(n, (t) => 880 + 90 * Math.sin(2 * Math.PI * 7 * t));
  return sat(mul(mix(mul(roar, 1.4), mul(air, 0.25), mul(humF, 0.9), mul(shimmer, 0.06)), e), 1.8);
};

/** 咆哮：ノコギリ波の束を声道フィルタ（フォルマント）に通し、うなりと歪みを加えたオリジナル合成 */
const roar = (dur, long) => {
  const n = Math.round((dur + 0.3) * SR);
  const f0 = long
    ? (t) => (t < 0.7 ? 120 + 150 * (t / 0.7) : t < dur * 0.7 ? 270 - 20 * ((t - 0.7) / (dur * 0.7 - 0.7)) : 250 - 160 * ((t - dur * 0.7) / (dur * 0.3)))
    : (t) => (t < 0.25 ? 140 + 110 * (t / 0.25) : 250 - 110 * ((t - 0.25) / (dur - 0.25)));
  // ピッチの揺らぎ（ランダムウォーク）
  const jit = new Float32Array(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i % 480 === 0) j = j * 0.9 + (rnd() - 0.5) * 0.02;
    jit[i] = j;
  }
  const F = (t) => Math.max(60, f0(Math.min(t, dur)) * (1 + jit[Math.min(n - 1, Math.round(t * SR))] + 0.015 * Math.sin(2 * Math.PI * 6 * t)));
  let src = new Float32Array(n);
  for (const d of [-0.008, -0.003, 0, 0.004, 0.009]) src = mix(src, mul(osc(n, (t) => F(t) * (1 + d), "saw", rnd()), 0.22));
  src = mix(src, mul(osc(n, (t) => F(t) * 0.5, "sq"), 0.18)); // 喉のうなり（下の倍音）
  const breath = mul(noise(n), osc(n, F).map((v) => 0.25 + 0.2 * v));
  src = mix(src, mul(breath, 0.5));
  // 30〜45Hz の振幅のうなり（ガラガラした質感）
  const growl = osc(n, (t) => 32 + 12 * Math.sin(t * 2));
  src = mul(src, growl.map((v) => 0.7 + 0.3 * v));
  // フォルマント（「アー」→「オー」に移る）
  const v = (t) => Math.min(1, t / dur);
  const f1 = biquad(src, "bp", (t) => 650 - 150 * v(t), 4);
  const f2 = biquad(src, "bp", (t) => 1150 - 300 * v(t), 5);
  const f3 = biquad(src, "bp", 2600, 6);
  const body = biquad(src, "lp", 380);
  let voice = mix(mul(f1, 1.5), mul(f2, 1.1), mul(f3, 0.6), mul(body, 0.7));
  // 金属的な高い成分（オリジナルのキャラクター付け）
  const edge = biquad(osc(n, (t) => F(t) * 4.5, "saw"), "bp", 2100, 3);
  voice = mix(voice, mul(edge, 0.12));
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    e[i] = Math.min(1, t / 0.09) * (t > dur - 0.35 ? Math.max(0, (dur + 0.3 - t) / 0.65) : 1);
  }
  return sat(mul(voice, e), 2.6);
};

/** 環境音：風、遠くの街のざわめき、炎のパチパチ（炎上に合わせて増える） */
const ambience = () => {
  const wind = biquad(noise(N), "lp", (t) => 300 + 120 * Math.sin(t * 0.4), 0.7);
  const fireBed = biquad(noise(N), "bp", 500, 0.5);
  const crackle = new Float32Array(N);
  for (let i = 0; i < N; i += 1) {
    const t = i / SR;
    const fire = Math.min(1, Math.max(0, (t - 18.5) / 14));
    if (rnd() < fire * 0.0018) crackle[i] = (rnd() * 2 - 1) * (0.5 + rnd());
  }
  const cr = biquad(crackle, "hp", 1200);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const fire = Math.min(1, Math.max(0, (t - 18.5) / 14));
    out[i] = wind[i] * 0.5 + fireBed[i] * 0.35 * fire + cr[i] * 0.6;
  }
  return out;
};

// ---- 配置 ----
const camNear = (f) => (f < 150 ? 0.55 : f >= 1050 ? 0.7 : 1); // 引きの画では少し遠く

place(ambience(), 0, 0.12, 0, 0.1);

for (const l of LANDINGS) {
  const water = rootAt(l.frame).x < TL.shoreX + 1;
  place(footstep(water), fr(l.frame), 0.62 * camNear(l.frame), l.left ? -0.15 : 0.15, 0.25);
}

// 同じフレーム付近の倒壊はまとめる
let lastF = -99;
for (const c of COLLAPSES) {
  if (c.f - lastF < 3) continue;
  lastF = c.f;
  place(collapse(c.size, c.kind), fr(c.f), 0.34 * camNear(c.f), Math.max(-0.6, Math.min(0.6, (c.x - rootAt(c.f).x) / 30)), 0.3);
}

let lastEx = -99;
for (const e of EXPLOSIONS) {
  if (e.f - lastEx < 10) continue; // 熱線中の爆発は間引いて重ねすぎない
  lastEx = e.f;
  place(explosion(), fr(e.f + 2), 0.42, 0.25, 0.3);
}

for (const c of TL.charges) place(charge((c.end - c.start) / FPS + 0.08), fr(c.start), 0.42, 0, 0.25);
for (const b of TL.beams) place(beam((b.end - b.start) / FPS), fr(b.start), 0.62, 0.1, 0.22);
for (const r of TL.roars) place(roar(r.dur / FPS, r.kind === "long"), fr(r.start), r.kind === "long" ? 0.95 : 0.8, 0, 0.4);

// ---- リバーブ（Schroeder 型：コム4本＋オールパス2本） ----
const reverb = (x, offs) => {
  const out = new Float32Array(N);
  for (const [d, g] of [[1557, 0.84], [1617, 0.83], [1491, 0.85], [1422, 0.86]].map(([d, g]) => [Math.round((d + offs) * 2.2), g])) {
    const buf = new Float32Array(d);
    let k = 0, lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[k];
      lp = y * 0.7 + lp * 0.3; // 高域を少し落とす
      buf[k] = x[i] + lp * g;
      out[i] += y;
      k = (k + 1) % d;
    }
  }
  let y = out;
  for (const d of [556 + offs, 225 + offs]) {
    const buf = new Float32Array(d);
    let k = 0;
    const o = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const b = buf[k];
      o[i] = -y[i] + b;
      buf[k] = y[i] + b * 0.5;
      k = (k + 1) % d;
    }
    y = o;
  }
  return y.map((v) => v * 0.18);
};
const revL = reverb(sendL, 0);
const revR = reverb(sendR, 23);
for (let i = 0; i < N; i++) {
  L[i] += revL[i];
  R[i] += revR[i];
}
// 超低域のゴミを除去
const Lh = biquad(L, "hp", 25);
const Rh = biquad(R, "hp", 25);

// ---- ラウドネス（ITU-R BS.1770）と リミッター ----
const kweight = (x) => {
  const st = (x, b, a) => {
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  };
  return st(
    st(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]),
    [1, -2, 1],
    [1, -1.99004745483398, 0.99007225036621],
  );
};
const lufs = (l, r) => {
  const kl = kweight(l), kr = kweight(r);
  const B = Math.round(0.4 * SR), H = Math.round(0.1 * SR);
  const z = [];
  for (let s = 0; s + B <= N; s += H) {
    let a = 0;
    for (let i = s; i < s + B; i++) a += kl[i] * kl[i] + kr[i] * kr[i];
    z.push(a / B);
  }
  const ld = (v) => -0.691 + 10 * Math.log10(v);
  const abs = z.filter((v) => ld(v) > -70);
  const mean = abs.reduce((a, b) => a + b, 0) / abs.length;
  const rel = abs.filter((v) => ld(v) > ld(mean) - 10);
  return ld(rel.reduce((a, b) => a + b, 0) / rel.length);
};
/** 先読みリミッター（サンプルピークを ceiling 以下に） */
const limit = (l, r, ceiling) => {
  const look = Math.round(0.003 * SR);
  const rel = Math.exp(-1 / (0.12 * SR));
  const need = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const p = Math.max(Math.abs(l[i]), Math.abs(r[i]));
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  // 先読み区間の最小値
  const g = new Float32Array(N);
  let cur = 1;
  for (let i = N - 1; i >= 0; i--) {
    let m = 1;
    for (let k = 0; k <= look && i + k < N; k++) m = Math.min(m, need[i + k]);
    g[i] = m;
  }
  const out = [new Float32Array(N), new Float32Array(N)];
  for (let i = 0; i < N; i++) {
    cur = g[i] < cur ? g[i] : cur * rel + (1 - rel) * g[i];
    cur = Math.min(cur, g[i]);
    out[0][i] = l[i] * cur;
    out[1][i] = r[i] * cur;
  }
  return out;
};

const TARGET = -15;
const CEIL = Math.pow(10, -2 / 20); // -2 dBFS（AAC変換後もピーク -1 dB 以下に収める余裕）
let outL = Lh, outR = Rh;
for (let pass = 0; pass < 3; pass++) {
  const now = lufs(outL, outR);
  const g = Math.pow(10, (TARGET - now) / 20);
  [outL, outR] = limit(outL.map((v) => v * g), outR.map((v) => v * g), CEIL);
}
const finalL = lufs(outL, outR);
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));

// ---- WAV 書き出し（16bit ステレオ） ----
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outL[i])) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outR[i])) * 32767), i * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write("WAVE", 8);
hdr.write("fmt ", 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
hdr.write("data", 36); hdr.writeUInt32LE(data.length, 40);
mkdirSync("public", { recursive: true });
writeFileSync("public/kaiju_v4.wav", Buffer.concat([hdr, data]));
console.log(`kaiju_v4.wav: ${(N / SR).toFixed(2)}s, ${finalL.toFixed(2)} LUFS, peak ${(20 * Math.log10(peak)).toFixed(2)} dBFS`);
console.log(`足音 ${LANDINGS.length} / 倒壊 ${COLLAPSES.length} / 爆発 ${EXPLOSIONS.length} / 咆哮 ${TL.roars.length} / 熱線 ${TL.beams.length}`);

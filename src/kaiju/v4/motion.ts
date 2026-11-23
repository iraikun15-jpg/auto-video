import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import { KaijuPose, REST } from "../Model";
import TL from "./timeline.json";

/**
 * v4 の動きの計算（すべてフレーム番号だけから決まる純粋関数）。
 * 怪獣は +x 方向を向いて歩く。ワールド座標の単位は v2 モデルと同じ。
 */

export const FRAMES = TL.frames;
const { step: STEP, land: LAND, stride: STRIDE } = TL;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.inOut(Easing.cubic);

const keys = (u: number, k: [number, number, ((t: number) => number)?][]): number => {
  if (u <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [u0, v0] = k[i];
    const [u1, v1, e] = k[i + 1];
    if (u <= u1) return v0 + (v1 - v0) * (e ?? io)((u - u0) / (u1 - u0));
  }
  return k[k.length - 1][1];
};

const sinkPulse = (dt: number) => (dt < 0 ? 0 : (dt / 4) * Math.exp(1 - dt / 4));

// ---- 歩行 ----
type StepInfo = { walk: number; k: number; u: number; globalStep: number } | null;

/** 歩行区間の何歩目か。歩いていなければ null */
const stepInfo = (f: number): StepInfo => {
  let g = 0;
  for (let w = 0; w < TL.walks.length; w++) {
    const { start, steps } = TL.walks[w];
    const end = start + steps * STEP;
    if (f >= start && f < end) {
      const k = Math.floor((f - start) / STEP);
      return { walk: w, k, u: (f - start - k * STEP) / STEP, globalStep: g + k };
    }
    g += steps;
  }
  return null;
};

/** これまでに完了した歩数（歩行中は進行度を小数で） */
const stepsDone = (f: number): number => {
  let n = 0;
  for (const { start, steps } of TL.walks) {
    const end = start + steps * STEP;
    if (f >= end) n += steps;
    else if (f > start) {
      const t = (f - start) / STEP;
      const k = Math.floor(t);
      const u = t - k;
      // 体が前に出るのは主に脚を振り出している間
      n += k + keys(u, [
        [0, 0],
        [LAND, 0.85, Easing.inOut(Easing.sin)],
        [1, 1, Easing.out(Easing.quad)],
      ]);
    }
  }
  return n;
};

/** 着地フレームの一覧（足音・沈み込み・踏み潰しに使う） */
export const LANDINGS: { frame: number; step: number; left: boolean }[] = (() => {
  const out: { frame: number; step: number; left: boolean }[] = [];
  let g = 0;
  for (const { start, steps } of TL.walks) {
    for (let k = 0; k < steps; k++) {
      out.push({ frame: Math.round(start + k * STEP + LAND * STEP), step: g + k, left: (g + k) % 2 === 0 });
    }
    g += steps;
  }
  return out;
})();

/** 怪獣の足元（ルート）位置と向き */
export const rootAt = (f: number): { x: number; y: number; yaw: number } => {
  const x = TL.startX + stepsDone(f) * STRIDE;
  // 海から上がってくる
  const y = interpolate(x, [TL.startX, TL.shoreX - 1], [-5.5, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  let yaw = 0;
  for (const t of TL.tailSweeps) {
    yaw += t.dir * 0.95 * tailSweepCurve(f, t.start, t.dur);
  }
  for (const b of TL.beams) {
    yaw += beamYaw(f, b);
  }
  return { x, y, yaw };
};

/** 尾の一振り：素早く振って、ゆっくり戻す（0→1→0） */
const tailSweepCurve = (f: number, start: number, dur: number) =>
  keys((f - start) / dur, [
    [0, 0],
    [0.12, -0.12, Easing.out(Easing.quad)], // 反動をためる
    [0.45, 1, Easing.inOut(Easing.cubic)],
    [1, 0, Easing.inOut(Easing.sin)],
  ]);

const beamYaw = (f: number, b: (typeof TL.beams)[number]) => {
  const pre = 18; // 狙いを付ける時間
  if (f < b.start - pre - 12 || f > b.end + 24) return 0;
  const aim = interpolate(f, [b.start - pre - 12, b.start - 6], [0, b.yawFrom], { ...clamp, easing: io });
  const sweep = interpolate(f, [b.start, b.end], [0, b.yawTo - b.yawFrom], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const back = interpolate(f, [b.end, b.end + 24], [1, 0], { ...clamp, easing: io });
  return (aim + sweep) * back;
};

// ---- 各イベントの強さ（0〜1） ----
export const roarAmount = (f: number) => {
  let v = 0;
  for (const r of TL.roars) {
    const a = interpolate(f, [r.start, r.start + 10, r.start + r.dur - 6, r.start + r.dur + 14], [0, 1, 1, 0], clamp);
    v = Math.max(v, r.kind === "long" && f > r.start + r.dur ? interpolate(f, [r.start + r.dur, r.start + r.dur + 14], [1, 0.35], clamp) : a);
  }
  return v;
};

export const chargeAmount = (f: number) => {
  let v = 0;
  for (const c of TL.charges) {
    v = Math.max(v, interpolate(f, [c.start, c.end], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) * (f <= c.end + 4 ? 1 : 0));
  }
  return v;
};

/** 熱線の出力（0〜1）。放射中は 1、入りと終わりは短く */
export const beamAmount = (f: number) => {
  let v = 0;
  for (const b of TL.beams) {
    v = Math.max(v, interpolate(f, [b.start, b.start + 5, b.end - 8, b.end], [0, 1, 1, 0], clamp));
  }
  return v;
};

/** 背びれの発光（チャージ中は尾→頭へ、放射中は全体が脈打つ） */
export const finGlow = (f: number) => {
  const beam = beamAmount(f);
  const pulse = 0.85 + 0.15 * Math.sin(f * 1.3);
  const after = TL.beams.reduce((v, b) => Math.max(v, interpolate(f, [b.end, b.end + 30], [1, 0], clamp) * (f >= b.end ? 1 : 0)), 0);
  return Math.max(chargeAmount(f), beam * pulse, after);
};

// ---- ポーズ ----
export const poseAt = (f: number): KaijuPose => {
  const si = stepInfo(f);
  const walking = si !== null;
  let swingHip = 0,
    swingKnee = 0,
    stanceHip = 0,
    lean = 0,
    swingIsLeft = true;
  if (si) {
    const { u, globalStep, k, walk } = si;
    const steps = TL.walks[walk].steps;
    const first = k === 0;
    const last = k === steps - 1;
    swingIsLeft = globalStep % 2 === 0;
    const back = first ? 0 : -0.24;
    const front = last ? 0.08 : 0.3;
    swingHip = keys(u, [
      [0, back],
      [0.22, back + 0.06, Easing.out(Easing.quad)],
      [0.58, front + 0.04, Easing.inOut(Easing.sin)],
      [LAND, front, Easing.in(Easing.quad)],
      [1, front],
    ]);
    swingKnee = keys(u, [
      [0, 0],
      [0.2, -0.95, Easing.out(Easing.cubic)],
      [0.5, -0.75, Easing.inOut(Easing.sin)],
      [LAND, 0, Easing.in(Easing.cubic)],
      [1, 0],
    ]);
    stanceHip = keys(u, [
      [0, first ? 0 : 0.3],
      [LAND, last ? -0.08 : -0.18],
      [1, last ? -0.08 : -0.24],
    ]);
    const leanMag = keys(u, [
      [0, first ? 0 : 0.2],
      [0.35, 1, Easing.out(Easing.quad)],
      [LAND, 0.6],
      [0.8, -0.15, Easing.out(Easing.quad)],
      [1, last ? 0 : -0.2],
    ]);
    lean = (swingIsLeft ? -1 : 1) * leanMag;
  }
  // 着地の沈み込み（歩行区間外でも余韻は残す）
  let sink = 0;
  for (const l of LANDINGS) sink += sinkPulse(f - l.frame);
  if (si) sink -= si.u < LAND ? Math.sin((si.u / LAND) * Math.PI) * 0.25 : 0;

  const roar = roarAmount(f);
  const charge = chargeAmount(f);
  const beam = beamAmount(f);
  const aiming = Math.max(charge, beam);

  // 尾：体の傾きと向きの変化に遅れて付いていく
  const tail = [0, 1, 2, 3, 4].map((i) => {
    const d = 4 * (i + 1);
    const delayedLean = poseLean(f - d);
    const yawNow = rootAt(f).yaw;
    const yawPast = rootAt(f - d).yaw;
    const whip = (yawPast - yawNow) * (0.55 + i * 0.12); // 向きを変えると尾が遅れてしなる
    const idle = 0.05 * Math.sin(f * 0.087 - i * 0.7) * (0.6 + i * 0.25);
    return -0.16 * delayedLean * (0.7 + i * 0.35) + whip + idle;
  });

  const stanceKnee = -0.32 * Math.max(0, sink);
  const sHip = stanceHip + 0.16 * Math.max(0, sink);
  return {
    ...REST,
    hipL: swingIsLeft ? swingHip : sHip,
    hipR: swingIsLeft ? sHip : swingHip,
    kneeL: swingIsLeft ? swingKnee : stanceKnee,
    kneeR: swingIsLeft ? stanceKnee : swingKnee,
    bob: -0.32 * sink - roar * 0.1 - aiming * 0.25,
    bodyRoll: 0.075 * lean * (walking ? 1 : 0),
    // 熱線は前かがみで地面を狙う
    bodyPitch: -0.035 * sink + roar * 0.14 - aiming * 0.14,
    shoulderL: (walking ? (swingIsLeft ? -0.1 : 0.12) : 0) + roar * 0.75 + aiming * 0.35,
    shoulderR: (walking ? (swingIsLeft ? 0.12 : -0.1) : 0) + roar * 0.75 + aiming * 0.35,
    elbow: 0.08 * sink + roar * 0.55 + aiming * 0.4,
    headPitch: 0.06 * sink + roar * 0.48 - aiming * 0.28 + beam * 0.02 * Math.sin(f * 0.9),
    jaw: Math.max(roar, beam * 0.85, charge * 0.25),
    tail,
    tailLift: roar * 0.06 - 0.04 * sink,
  };
};

const poseLean = (f: number) => {
  const si = stepInfo(f);
  if (!si) return 0;
  const { u, globalStep, k, walk } = si;
  const steps = TL.walks[walk].steps;
  const m = keys(u, [
    [0, k === 0 ? 0 : 0.2],
    [0.35, 1, Easing.out(Easing.quad)],
    [LAND, 0.6],
    [0.8, -0.15, Easing.out(Easing.quad)],
    [1, k === steps - 1 ? 0 : -0.2],
  ]);
  return (globalStep % 2 === 0 ? -1 : 1) * m;
};

// ---- 口の位置と熱線の着弾点（モデルの関節と同じ変換をたどる） ----
export const MOUTH_LOCAL = new THREE.Vector3(3.75, 10.5, 0);
const _root = new THREE.Object3D();
const _bob = new THREE.Object3D();
const _bodyP = new THREE.Object3D();
const _bodyI = new THREE.Object3D();
const _headP = new THREE.Object3D();
const _headI = new THREE.Object3D();
_root.add(_bob);
_bob.add(_bodyP);
_bodyP.add(_bodyI);
_bodyI.add(_headP);
_headP.add(_headI);

export const headFrame = (f: number) => {
  const r = rootAt(f);
  const p = poseAt(f);
  _root.position.set(r.x, r.y, 0);
  _root.rotation.set(0, r.yaw, 0);
  _bob.position.set(0, p.bob, 0);
  _bodyP.position.set(-0.25, 6.0, 0);
  _bodyP.rotation.set(p.bodyRoll, 0, p.bodyPitch);
  _bodyI.position.set(0.25, -6.0, 0);
  _headP.position.set(0.55, 10.0, 0);
  _headP.rotation.set(0, 0, p.headPitch);
  _headI.position.set(-0.55, -10.0, 0);
  _root.updateMatrixWorld(true);
  const mouth = MOUTH_LOCAL.clone().applyMatrix4(_headI.matrixWorld);
  const dir = new THREE.Vector3(1, 0, 0).transformDirection(_headI.matrixWorld);
  return { mouth, dir };
};

/** 熱線の着弾点（地面 y=0 との交点）と長さ */
export const beamHit = (f: number) => {
  const { mouth, dir } = headFrame(f);
  const t = dir.y < -0.05 ? -mouth.y / dir.y : 40;
  const len = Math.min(t, 40);
  return { mouth, dir, len, point: mouth.clone().addScaledVector(dir, len) };
};

/** 尾の向き（ワールドの xz 平面上の単位ベクトル）。尾払いの当たり判定用 */
export const tailDir = (f: number): [number, number] => {
  const r = rootAt(f);
  const p = poseAt(f);
  const a = r.yaw + p.tail.reduce((x, y) => x + y, 0) * 0.8;
  // ローカルの -x を y 軸まわりに a 回したもの
  return [-Math.cos(a), Math.sin(a)];
};

export const shakeAt = (f: number): number => {
  let s = 0;
  for (const l of LANDINGS) {
    const dt = f - l.frame;
    if (dt >= 0 && dt < 14) s += 0.32 * Math.exp(-dt / 4);
  }
  s += beamAmount(f) * 0.38;
  s += chargeAmount(f) * 0.08;
  s += roarAmount(f) * 0.12;
  return s;
};

export { TL, STEP, LAND };

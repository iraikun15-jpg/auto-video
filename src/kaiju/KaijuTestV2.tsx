import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { KaijuPose, REST } from "./Model";
import { KaijuModelV2 } from "./ModelV2";
import { KaijuStage } from "./KaijuTest";

/**
 * ローポリ3Dテスト v2（9秒・無音）。構成・尺・カメラ・背景は v1 と同じ。
 *  0〜4秒   : ターンテーブル1回転
 *  4〜7.8秒 : その場で3歩。足を上げる→前に出す→着地で沈む、の緩急と体重移動。尾は遅れてしなる
 *  7.7〜9秒 : 顎を開けて咆哮ポーズで静止
 */
export const KAIJU_V2_FRAMES = 270;
const TURN_END = 120;
const STEP = 38; // 1歩のフレーム数
const STEPS = 3;
const WALK_END = TURN_END + STEP * STEPS; // 234
const ROAR_START = WALK_END - 4;
const ROAR_END = ROAR_START + 22;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.inOut(Easing.cubic);

/** キーフレーム補間（区間ごとにイージング指定） */
const keys = (u: number, k: [number, number, ((t: number) => number)?][]): number => {
  if (u <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [u0, v0] = k[i];
    const [u1, v1, e] = k[i + 1];
    if (u <= u1) return v0 + (v1 - v0) * (e ?? io)((u - u0) / (u1 - u0));
  }
  return k[k.length - 1][1];
};

const LAND = 0.66; // 1歩の中で着地するタイミング

/** 着地の沈み込み（着地直後に一気に沈み、ゆっくり戻る）。dt は着地からのフレーム数 */
const sinkPulse = (dt: number) => (dt < 0 ? 0 : (dt / 4) * Math.exp(1 - dt / 4));

type Walk = {
  swingHip: number;
  swingKnee: number;
  stanceHip: number;
  sink: number; // 0〜1（大きいほど沈む）
  lean: number; // 支持脚側への傾き（-1〜1）
  swingIsLeft: boolean;
  amp: number;
};

const walkAt = (f: number): Walk => {
  const t = f - TURN_END;
  const amp = interpolate(f, [TURN_END, TURN_END + 6, WALK_END - 6, WALK_END + 8], [0, 1, 1, 0], clamp);
  const k = Math.max(0, Math.min(STEPS - 1, Math.floor(t / STEP)));
  const u = Math.max(0, Math.min(1, (t - k * STEP) / STEP));
  const swingIsLeft = k % 2 === 0;
  const first = k === 0;
  const last = k === STEPS - 1;

  // 振り出す脚：素早く上げ→ゆっくり前へ→ストンと着地
  const back = first ? 0 : -0.24;
  const front = last ? 0.08 : 0.3;
  const swingHip = keys(u, [
    [0, back],
    [0.22, back + 0.06, Easing.out(Easing.quad)],
    [0.58, front + 0.04, Easing.inOut(Easing.sin)],
    [LAND, front, Easing.in(Easing.quad)],
    [1, front],
  ]);
  const swingKnee = keys(u, [
    [0, 0],
    [0.2, -0.95, Easing.out(Easing.cubic)],
    [0.5, -0.75, Easing.inOut(Easing.sin)],
    [LAND, 0, Easing.in(Easing.cubic)],
    [1, 0],
  ]);
  // 支えている脚は後ろへ送られる
  const stanceHip = keys(u, [
    [0, first ? 0 : 0.3],
    [LAND, last ? -0.08 : -0.18],
    [1, last ? -0.08 : -0.24],
  ]);

  // 沈み込み：今の歩の着地と、前の歩の着地の余韻
  const landF = k * STEP + LAND * STEP;
  let sink = sinkPulse(t - landF);
  if (k > 0) sink += sinkPulse(t - ((k - 1) * STEP + LAND * STEP));
  // 片足立ちの間は少し伸び上がる
  const rise = u < LAND ? Math.sin((u / LAND) * Math.PI) * 0.25 : 0;

  // 体重移動：脚を上げている間、支持脚側へ傾く（着地で反対へ切り替わる）
  const leanMag = keys(u, [
    [0, 0.2],
    [0.35, 1, Easing.out(Easing.quad)],
    [LAND, 0.6],
    [0.8, -0.15, Easing.out(Easing.quad)],
    [1, -0.2],
  ]);
  const lean = (swingIsLeft ? -1 : 1) * leanMag;
  return { swingHip, swingKnee, stanceHip, sink: sink - rise, lean, swingIsLeft, amp };
};

const poseAt = (f: number): { pose: KaijuPose; turn: number } => {
  const turn = interpolate(f, [0, TURN_END], [0, Math.PI * 2], { ...clamp, easing: io });
  const roar = interpolate(f, [ROAR_START, ROAR_END], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });

  const w = walkAt(f);
  const a = w.amp;
  const sink = w.sink * a;
  const roll = 0.075 * w.lean * a; // rad
  // 尾：体の傾きを、先端ほど遅れて受け取る＋常に少しの揺れ
  const tail = [0, 1, 2, 3, 4].map((i) => {
    const delayed = walkAt(f - 4 * (i + 1));
    const follow = -0.16 * delayed.lean * delayed.amp * (0.7 + i * 0.35);
    const idle = 0.05 * Math.sin(f * 0.087 - i * 0.7) * (0.6 + i * 0.25);
    return (follow + idle) * (1 - roar) + roar * 0.04 * i;
  });
  const tailLag = walkAt(f - 6);

  // 沈んだぶん支持脚の膝を曲げ、腰を下げる
  const stanceKnee = -0.32 * Math.max(0, sink);
  const stanceHip = w.stanceHip * a + 0.16 * Math.max(0, sink);
  const swingHip = w.swingHip * a;
  const swingKnee = w.swingKnee * a;

  const pose: KaijuPose = {
    ...REST,
    hipL: w.swingIsLeft ? swingHip : stanceHip,
    hipR: w.swingIsLeft ? stanceHip : swingHip,
    kneeL: w.swingIsLeft ? swingKnee : stanceKnee,
    kneeR: w.swingIsLeft ? stanceKnee : swingKnee,
    bob: -0.32 * sink - roar * 0.1,
    bodyRoll: roll,
    bodyPitch: -0.035 * sink + roar * 0.12,
    shoulderL: (w.swingIsLeft ? -0.1 : 0.12) * a + roar * 0.75 + 0.05 * sink,
    shoulderR: (w.swingIsLeft ? 0.12 : -0.1) * a + roar * 0.75 + 0.05 * sink,
    elbow: 0.08 * sink + roar * 0.55,
    headPitch: 0.06 * sink + roar * 0.42,
    jaw: roar,
    tail,
    tailLift: -0.06 * tailLag.sink * tailLag.amp + roar * 0.05,
  };
  return { pose, turn };
};

export const KaijuTestV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { pose, turn } = poseAt(frame);
  return (
    <KaijuStage turn={turn}>
      <KaijuModelV2 pose={pose} />
    </KaijuStage>
  );
};

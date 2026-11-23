import { Easing, interpolate } from "remotion";

/**
 * 棒人間のポーズ。角度はすべて度数。
 * 腕・脚の「上側」は絶対角度（0=真下、90=向いている方向、180=真上、-90=背中側）。
 * 前腕・すねは上腕・ももからの相対角度。
 * x, y は腰（股関節）の位置。
 */
export type Pose = {
  x: number;
  y: number;
  torso: number; // 0=直立、+で前のめり
  head: number; // 首の傾き（胴体からの相対）
  backArm: number;
  backFore: number;
  frontArm: number;
  frontFore: number;
  backThigh: number;
  backShin: number;
  frontThigh: number;
  frontShin: number;
};

export const POSE_KEYS: (keyof Pose)[] = [
  "x",
  "y",
  "torso",
  "head",
  "backArm",
  "backFore",
  "frontArm",
  "frontFore",
  "backThigh",
  "backShin",
  "frontThigh",
  "frontShin",
];

export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const out = { ...a };
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
};

export const shiftPose = (p: Pose, d: Partial<Pose>): Pose => {
  const out = { ...p };
  for (const k of POSE_KEYS) out[k] = p[k] + (d[k] ?? 0);
  return out;
};

const ease = Easing.inOut(Easing.cubic);

/** キーフレーム [フレーム, ポーズ] の列から、そのフレームのポーズを求める */
export const poseAt = (
  frame: number,
  keys: [number, Pose][],
  easing: (t: number) => number = ease,
): Pose => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, p0] = keys[i];
    const [f1, p1] = keys[i + 1];
    if (frame <= f1) {
      const t = interpolate(frame, [f0, f1], [0, 1], { easing });
      return mixPose(p0, p1, t);
    }
  }
  return keys[keys.length - 1][1];
};

/** 数値のキーフレーム補間（範囲外はクランプ） */
export const track = (
  frame: number,
  keys: [number, number][],
  easing: (t: number) => number = ease,
): number =>
  interpolate(
    frame,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

/** 決定的な揺れ（震え）。seed違いで別の揺れになる */
export const jitter = (frame: number, amp: number, seed = 0): number =>
  amp *
  (Math.sin(frame * 2.7 + seed * 12.9) * 0.6 +
    Math.sin(frame * 5.3 + seed * 4.1) * 0.4);

// ---- 基本ポーズ（右向き。x, y は場面ごとに上書きする） ----
const base = { x: 0, y: 0, torso: 0, head: 0 };

export const STAND: Pose = {
  ...base,
  backArm: -12,
  backFore: 4,
  frontArm: 14,
  frontFore: -4,
  backThigh: -7,
  backShin: 0,
  frontThigh: 7,
  frontShin: 0,
};

export const SIT_TYPING: Pose = {
  ...base,
  torso: 6,
  backArm: 55,
  backFore: 45,
  frontArm: 62,
  frontFore: 40,
  backThigh: 86,
  backShin: -84,
  frontThigh: 92,
  frontShin: -90,
};

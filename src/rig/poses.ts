/**
 * 棒人間のポーズ集と、よく使う動き（歩く・お辞儀・うなずき等）。
 *
 * 使い方の例：
 *   import { POSES, ground, walk, bow } from "../rig/poses";
 *   const p = ground({ ...POSES.POINT, x: 300 });       // 床に立たせる
 *   const w = walk(frame, { startX: 100, speed: 6 });   // 歩かせる
 *   const b = bow(frame, { start: 30 });                // お辞儀させる
 *
 * 角度の決まりは pose.ts と同じ：
 *   腕・ももは絶対角度（0=真下、90=向いている方向、180=真上、-90=背中側）
 *   前腕・すねは上腕・ももからの相対角度（前腕は＋で肘が前に曲がる、すねは−で膝が後ろに曲がる）
 * ポーズの x, y は 0 にしてあるので、場面ごとに ground() か直接指定で置く。
 */
import { Easing } from "remotion";
import { mixPose, Pose, poseAt, SIT_TYPING, shiftPose, STAND, track } from "./pose";
import { solve } from "./StickFigure";
import { FLOOR_Y, LINE } from "./theme";

const base = { x: 0, y: 0 };

// ---------------------------------------------------------------------------
// 立ちポーズ
// ---------------------------------------------------------------------------

/** 気をつけ（腕をまっすぐ下ろす） */
const ATTENTION: Pose = {
  ...STAND,
  backArm: -3,
  backFore: 0,
  frontArm: 3,
  frontFore: 0,
  backThigh: -2,
  frontThigh: 2,
};

/** 指さし（前を指す） */
const POINT: Pose = { ...STAND, torso: -3, frontArm: 92, frontFore: -4, backArm: -18, backFore: 10 };

/** 上を指さす（ひらめき・「それだ！」） */
const POINT_UP: Pose = { ...STAND, torso: -4, head: -8, frontArm: 160, frontFore: 8, backArm: -15, backFore: 8 };

/** 挙手（はい！） */
const RAISE_HAND: Pose = { ...STAND, torso: -3, head: -4, frontArm: 172, frontFore: 4 };

/** 手を振る（基本形。動かすときは wave() を使う） */
const WAVE: Pose = { ...STAND, frontArm: 140, frontFore: 30, backArm: -10 };

/** バンザイ（喜び・降参） */
const BANZAI: Pose = {
  ...STAND,
  torso: -6,
  head: -10,
  backArm: 160,
  backFore: 10,
  frontArm: 168,
  frontFore: 8,
  backThigh: -10,
  frontThigh: 10,
};

/** ガッツポーズ */
const GUTS: Pose = {
  ...STAND,
  torso: -5,
  head: -6,
  frontArm: 65,
  frontFore: 110,
  backArm: -25,
  backFore: 40,
  backThigh: -12,
  frontThigh: 12,
};

/** 腰に手（えっへん・怒り気味） */
const HANDS_ON_HIPS: Pose = {
  ...STAND,
  torso: -6,
  head: -6,
  backArm: -48,
  backFore: 105,
  frontArm: 36,
  frontFore: -90,
  backThigh: -12,
  frontThigh: 12,
};

/** 腕組み */
const ARMS_CROSSED: Pose = {
  ...STAND,
  torso: -3,
  head: 4,
  backArm: 14,
  backFore: 108,
  frontArm: 20,
  frontFore: 100,
};

/** 考える（あごに手） */
const THINK: Pose = {
  ...STAND,
  head: 8,
  frontArm: 62,
  frontFore: 140,
  backArm: 18,
  backFore: 92,
};

/** 驚く（のけぞって両手を上げる） */
const SURPRISED: Pose = {
  ...STAND,
  torso: -12,
  head: -12,
  backArm: 150,
  backFore: 20,
  frontArm: 105,
  frontFore: 45,
  backThigh: -16,
  backShin: -6,
  frontThigh: 14,
};

/** 頭を抱える */
const HEAD_IN_HANDS: Pose = {
  ...STAND,
  torso: 14,
  head: 18,
  backArm: 85,
  backFore: 115,
  frontArm: 98,
  frontFore: 112,
  backThigh: -10,
  frontThigh: 8,
  frontShin: -6,
};

/** 落ち込む（肩を落としてうなだれる） */
const SLUMP: Pose = {
  ...STAND,
  torso: 22,
  head: 32,
  backArm: 6,
  backFore: 2,
  frontArm: 14,
  frontFore: 2,
  backThigh: -4,
  backShin: -8,
  frontThigh: 10,
  frontShin: -10,
};

/** お辞儀（会釈〜普通のお辞儀） */
const BOW: Pose = {
  ...ATTENTION,
  torso: 50,
  head: 8,
  backArm: 8,
  frontArm: 14,
};

/** 深いお辞儀（謝罪） */
const DEEP_BOW: Pose = {
  ...ATTENTION,
  torso: 70,
  head: 8,
  backArm: -4,
  frontArm: 2,
  backThigh: -6,
  frontThigh: -2,
};

/** スマホを見る（立ち） */
const PHONE: Pose = {
  ...STAND,
  head: 28,
  frontArm: 28,
  frontFore: 98,
  backArm: -8,
  backFore: 6,
};

/** 電話をかける（耳に当てる） */
const PHONE_CALL: Pose = {
  ...STAND,
  head: 4,
  frontArm: 38,
  frontFore: 150,
  backArm: -12,
  backFore: 10,
};

/** ものを持って運ぶ（両手を前に） */
const CARRY: Pose = {
  ...STAND,
  torso: -4,
  backArm: 30,
  backFore: 62,
  frontArm: 36,
  frontFore: 58,
};

/** 走り出し・急ぐ（前のめり。動かすときは run() を使う） */
const HURRY: Pose = {
  ...STAND,
  torso: 18,
  head: -6,
  backArm: -55,
  backFore: 85,
  frontArm: 55,
  frontFore: 85,
  backThigh: -30,
  backShin: -55,
  frontThigh: 40,
  frontShin: -30,
};

/** しゃがむ */
const CROUCH: Pose = {
  ...STAND,
  torso: 34,
  head: -12,
  backArm: 55,
  backFore: 30,
  frontArm: 65,
  frontFore: 25,
  backThigh: 112,
  backShin: -138,
  frontThigh: 124,
  frontShin: -146,
};

/** 膝から崩れ落ちる（四つんばいでうなだれる） */
const ORZ: Pose = {
  ...STAND,
  torso: 68,
  head: 34,
  backArm: 0,
  backFore: 2,
  frontArm: 6,
  frontFore: 0,
  backThigh: 0,
  backShin: -90,
  frontThigh: 4,
  frontShin: -94,
};

// ---------------------------------------------------------------------------
// 座りポーズ（椅子に座っている前提。ground() で足が床につく高さになる）
// ---------------------------------------------------------------------------

const sitLegs = { backThigh: 86, backShin: -84, frontThigh: 92, frontShin: -90 };

/** 座る（手はひざ） */
const SIT: Pose = {
  ...base,
  torso: 0,
  head: 0,
  backArm: 22,
  backFore: 62,
  frontArm: 28,
  frontFore: 60,
  ...sitLegs,
};

/** 座ってタイピング（pose.ts の SIT_TYPING と同じ） */
const SIT_TYPE: Pose = SIT_TYPING;

/** 座ってスマホ */
const SIT_PHONE: Pose = { ...SIT, torso: 10, head: 26, frontArm: 34, frontFore: 92, backArm: 30, backFore: 80 };

/** 座って伸び（ふう〜） */
const SIT_STRETCH: Pose = {
  ...SIT,
  torso: -10,
  head: -14,
  backArm: 165,
  backFore: 15,
  frontArm: 172,
  frontFore: 10,
  frontThigh: 80,
  frontShin: -60,
};

/** 座って机に突っ伏す */
const SIT_FACEPLANT: Pose = {
  ...SIT,
  torso: 62,
  head: 20,
  backArm: 70,
  backFore: 60,
  frontArm: 80,
  frontFore: 55,
};

/** 座って考える（あごに手） */
const SIT_THINK: Pose = { ...SIT, torso: 6, head: 10, frontArm: 64, frontFore: 140, backArm: 24, backFore: 70 };

/** 座ってのけぞる（椅子の背にもたれる） */
const SIT_LEAN_BACK: Pose = {
  ...SIT,
  torso: -18,
  head: -6,
  backArm: -20,
  backFore: 20,
  frontArm: -10,
  frontFore: 25,
  frontThigh: 75,
  frontShin: -50,
};

/** 名前付きポーズの一覧（向きは右。左向きは StickFigure の facing={-1}） */
export const POSES = {
  STAND,
  ATTENTION,
  POINT,
  POINT_UP,
  RAISE_HAND,
  WAVE,
  BANZAI,
  GUTS,
  HANDS_ON_HIPS,
  ARMS_CROSSED,
  THINK,
  SURPRISED,
  HEAD_IN_HANDS,
  SLUMP,
  BOW,
  DEEP_BOW,
  PHONE,
  PHONE_CALL,
  CARRY,
  HURRY,
  CROUCH,
  ORZ,
  SIT,
  SIT_TYPE,
  SIT_PHONE,
  SIT_STRETCH,
  SIT_FACEPLANT,
  SIT_THINK,
  SIT_LEAN_BACK,
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

/** 一覧表・指示ファイル用の日本語名 */
export const POSE_LABELS: Record<PoseName, string> = {
  STAND: "立つ",
  ATTENTION: "気をつけ",
  POINT: "指さし",
  POINT_UP: "上を指す",
  RAISE_HAND: "挙手",
  WAVE: "手を振る",
  BANZAI: "バンザイ",
  GUTS: "ガッツポーズ",
  HANDS_ON_HIPS: "腰に手",
  ARMS_CROSSED: "腕組み",
  THINK: "考える",
  SURPRISED: "驚く",
  HEAD_IN_HANDS: "頭を抱える",
  SLUMP: "落ち込む",
  BOW: "お辞儀",
  DEEP_BOW: "深いお辞儀",
  PHONE: "スマホを見る",
  PHONE_CALL: "電話する",
  CARRY: "運ぶ",
  HURRY: "急ぐ",
  CROUCH: "しゃがむ",
  ORZ: "崩れ落ちる",
  SIT: "座る",
  SIT_TYPE: "座ってタイピング",
  SIT_PHONE: "座ってスマホ",
  SIT_STRETCH: "座って伸び",
  SIT_FACEPLANT: "机に突っ伏す",
  SIT_THINK: "座って考える",
  SIT_LEAN_BACK: "もたれる",
};

// ---------------------------------------------------------------------------
// 置き方
// ---------------------------------------------------------------------------

/**
 * 体のいちばん低い点（足・ひざ・手）が床に触れる高さに y を合わせる。
 * x はそのまま。歩き・しゃがみ・四つんばいでも床に接地する。
 */
export const ground = (p: Pose, floorY: number = FLOOR_Y): Pose => {
  const j = solve({ ...p, x: 0, y: 0 });
  const low = Math.max(j.backFoot[1], j.frontFoot[1], j.backKnee[1], j.frontKnee[1], j.backHand[1], j.frontHand[1]);
  return { ...p, y: floorY - LINE / 2 - low };
};

/** 名前でポーズを取り出して x に置き、床に接地させる */
export const place = (name: PoseName, x: number, floorY: number = FLOOR_Y): Pose =>
  ground({ ...POSES[name], x }, floorY);

/**
 * ポーズ A から B へ、start〜start+dur フレームで移り変わる。
 * 変化が終わったあとは B のまま。床への接地も保つ。
 */
export const change = (
  frame: number,
  from: Pose,
  to: Pose,
  start: number,
  dur = 8,
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
): Pose => ground(mixPose(from, to, track(frame, [[start, 0], [start + dur, 1]], easing)));

// ---------------------------------------------------------------------------
// 動き（フレームを渡すとポーズを返す）
// ---------------------------------------------------------------------------

/**
 * 歩く。x は startX から speed（px/フレーム、マイナスで左へ）で進む。
 * 左へ歩くときは StickFigure に facing={-1} を渡す。
 */
export const walk = (
  frame: number,
  { startX = 0, speed = 5, period = 22, stride = 26, floorY = FLOOR_Y }: {
    startX?: number;
    speed?: number;
    period?: number;
    stride?: number;
    floorY?: number;
  } = {},
): Pose => {
  const ph = (frame / period) * Math.PI * 2;
  const s = Math.sin(ph);
  // 前に振り出している脚のひざを曲げる
  const bendF = Math.max(0, Math.cos(ph)) * 34;
  const bendB = Math.max(0, -Math.cos(ph)) * 34;
  const p: Pose = {
    ...STAND,
    x: startX + speed * frame,
    torso: 3,
    head: Math.sin(ph * 2) * 1.5,
    frontThigh: stride * s,
    frontShin: -bendF,
    backThigh: -stride * s,
    backShin: -bendB,
    frontArm: -stride * 0.8 * s,
    frontFore: 12,
    backArm: stride * 0.8 * s,
    backFore: 12,
  };
  return ground(p, floorY);
};

/** 走る。walk より歩幅が大きく、前のめりで腕を曲げる */
export const run = (
  frame: number,
  { startX = 0, speed = 12, period = 14, stride = 42, floorY = FLOOR_Y }: {
    startX?: number;
    speed?: number;
    period?: number;
    stride?: number;
    floorY?: number;
  } = {},
): Pose => {
  const ph = (frame / period) * Math.PI * 2;
  const s = Math.sin(ph);
  const bendF = (Math.max(0, Math.cos(ph)) * 0.7 + 0.3) * 70;
  const bendB = (Math.max(0, -Math.cos(ph)) * 0.7 + 0.3) * 70;
  const p: Pose = {
    ...STAND,
    x: startX + speed * frame,
    torso: 16,
    head: -8,
    frontThigh: stride * s + 8,
    frontShin: -bendF,
    backThigh: -stride * s + 8,
    backShin: -bendB,
    frontArm: -stride * 1.2 * s,
    frontFore: 85,
    backArm: stride * 1.2 * s,
    backFore: 85,
  };
  // 着地の合間に少し浮く
  const hop = Math.abs(Math.cos(ph)) * 14;
  const g = ground(p, floorY);
  return { ...g, y: g.y - hop };
};

/** タイピング（座りポーズに前腕の小刻みな上下を足す） */
export const typing = (frame: number, basePose: Pose = POSES.SIT_TYPE, amp = 7): Pose =>
  shiftPose(basePose, {
    frontFore: Math.sin(frame * 1.3) * amp,
    backFore: -Math.sin(frame * 1.3 + 0.8) * amp,
    head: Math.sin(frame * 0.2) * 2,
  });

/** 待機中の小さな揺れ（呼吸）。止まって見えないようにどの場面でも重ねられる */
export const breathe = (frame: number, basePose: Pose, amp = 1): Pose =>
  shiftPose(basePose, {
    torso: Math.sin(frame * 0.12) * 1.2 * amp,
    head: Math.sin(frame * 0.12 + 0.6) * 1.5 * amp,
    backArm: Math.sin(frame * 0.12 + 1) * 2 * amp,
    frontArm: Math.sin(frame * 0.12 + 1.3) * 2 * amp,
  });

/** うなずき（start から times 回） */
export const nod = (frame: number, basePose: Pose, { start = 0, times = 2, period = 10, depth = 16 } = {}): Pose => {
  const t = frame - start;
  if (t < 0 || t > times * period) return basePose;
  return shiftPose(basePose, { head: Math.sin((t / period) * Math.PI) ** 2 * depth });
};

/** 首を振る（いやいや）。横向きなので前後にかしげる動きで表す */
export const shakeHead = (frame: number, basePose: Pose, { start = 0, times = 3, period = 8, depth = 12 } = {}): Pose => {
  const t = frame - start;
  if (t < 0 || t > times * period) return basePose;
  return shiftPose(basePose, { head: Math.sin((t / period) * Math.PI * 2) * depth });
};

/** 手を振る */
export const wave = (frame: number, basePose: Pose = POSES.WAVE, amp = 22): Pose =>
  shiftPose(basePose, { frontFore: Math.sin(frame * 0.5) * amp, frontArm: Math.sin(frame * 0.5) * 6 });

/**
 * お辞儀：start で下げはじめ、down フレームで下げ切って hold フレーム止まり、up フレームで戻る。
 * deep=true で謝罪の深いお辞儀。
 */
export const bow = (
  frame: number,
  { start = 0, down = 10, hold = 14, up = 10, deep = false, from = POSES.ATTENTION } = {},
): Pose => {
  const target = deep ? POSES.DEEP_BOW : POSES.BOW;
  return ground(
    poseAt(frame, [
      [start, from],
      [start + down, target],
      [start + down + hold, target],
      [start + down + hold + up, from],
    ]),
  );
};

/** ジャンプ（その場で）。start でしゃがんで踏み切り、air フレーム浮いて着地 */
export const jump = (frame: number, { start = 0, height = 160, air = 16, from = POSES.STAND } = {}): Pose => {
  const crouch: Pose = { ...from, torso: 18, backThigh: 40, backShin: -70, frontThigh: 50, frontShin: -75, backArm: -40, frontArm: -30 };
  const inAir: Pose = { ...POSES.BANZAI, backThigh: 10, backShin: -30, frontThigh: 30, frontShin: -40 };
  const t0 = start, t1 = start + 6, t2 = t1 + air, t3 = t2 + 6;
  const p = poseAt(frame, [[t0, from], [t1, crouch], [t1 + 3, inAir], [t2 - 3, inAir], [t2, crouch], [t3, from]]);
  const g = ground(p);
  const k = frame > t1 && frame < t2 ? (frame - t1) / (t2 - t1) : -1;
  const lift = k >= 0 ? 4 * height * k * (1 - k) : 0;
  return { ...g, y: g.y - lift };
};

/** 震える（恐怖・寒さ・怒り） */
export const tremble = (frame: number, basePose: Pose, amp = 3): Pose =>
  shiftPose(basePose, {
    x: Math.sin(frame * 2.7) * amp,
    torso: Math.sin(frame * 3.1 + 1) * amp * 0.5,
    head: Math.sin(frame * 3.7 + 2) * amp * 0.6,
  });

/**
 * 台本の「動き」から、あるフレームでの各登場人物の姿勢を求める。
 *
 * 動きは3種類：
 *   ポーズ（指さし等）… 姿勢そのものが切り替わる。次のポーズや移動まで続く
 *   移動（歩く・走る）… 到着地点まで進み、着いたら「のち」のポーズ（既定は立つ）
 *   重ねる動き（うなずく・震える等）… いまの姿勢に一時的に重ねる
 */
import { Easing } from "remotion";
import { mixPose, Pose, poseAt, shiftPose } from "../rig/pose";
import { breathe, ground, nod, POSES, PoseName, run, shakeHead, tremble, typing, walk, wave } from "../rig/poses";
import type { Action, CastMember, Episode } from "./types";

export type CharState = { pose: Pose; facing: 1 | -1; poseName: PoseName | null; visible: boolean };

/** 動き方（台本の「動き方:」） */
export const EASINGS: Record<string, (t: number) => number> = {
  ふつう: Easing.inOut(Easing.cubic),
  すばやく: Easing.out(Easing.cubic),
  ゆっくり: Easing.inOut(Easing.sin),
  // ため：いったん逆に引いてから動く
  ため: Easing.inOut(Easing.back(2.2)),
  // はずむ：行き過ぎてから戻る
  はずむ: Easing.out(Easing.back(2.4)),
};
const DEFAULT_POSE_DUR = 9; // 0.3秒
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const WALK_SPEED = 6;
const RUN_SPEED = 13;

const isBase = (a: Action) => a.kind === "pose" || (a.kind === "motion" && (a.code === "walk" || a.code === "run"));

/** 登場人物ごとの動きを前もって振り分けておく */
export const prepare = (ep: Episode) => {
  const by: Record<string, { base: Action[]; overlay: Action[]; first: number; exits: Action[]; enters: Action[] }> = {};
  for (const name of Object.keys(ep.cast)) by[name] = { base: [], overlay: [], first: Infinity, exits: [], enters: [] };
  for (const a of ep.actions) {
    const c = by[a.who];
    if (!c || a.kind === "effect") continue;
    c.first = Math.min(c.first, a.start);
    if (isBase(a)) c.base.push(a);
    else if (a.code === "exit") c.exits.push(a);
    else if (a.code === "enter") c.enters.push(a);
    else if (a.kind === "motion") c.overlay.push(a);
  }
  return by;
};
export type Prepared = ReturnType<typeof prepare>;

const initialState = (c: CastMember): CharState => ({
  pose: ground({ ...POSES[c.pose], x: c.x }),
  facing: c.facing,
  poseName: c.pose,
  visible: true,
});

const moveFn = (a: Action) => (a.code === "run" ? run : walk);
const moveSpeed = (a: Action) => (a.code === "run" ? RUN_SPEED : WALK_SPEED) * (a.opts.speed ?? 1);

/** base[i] までの動きを当てはめた、フレーム f の姿勢 */
const baseAt = (acts: Action[], i: number, f: number, init: CharState): CharState => {
  if (i < 0) return init;
  const a = acts[i];
  if (f < a.start) return baseAt(acts, i - 1, f, init);
  const from = baseAt(acts, i - 1, a.start, init);
  const t = f - a.start;

  if (a.kind === "pose") {
    const name = a.code as PoseName;
    const target = ground({ ...POSES[name], x: a.opts.x ?? from.pose.x });
    const dur = a.opts.dur ?? DEFAULT_POSE_DUR;
    const ease = EASINGS[a.opts.ease ?? "ふつう"] ?? EASINGS.ふつう;
    const k = ease(clamp01(t / Math.max(1, dur)));
    return { ...from, pose: ground(mixPose(from.pose, target, k)), facing: a.opts.facing ?? from.facing, poseName: name };
  }

  // 歩く・走る
  const x0 = from.pose.x;
  const x1 = a.opts.to!;
  const dir: 1 | -1 = x1 >= x0 ? 1 : -1;
  const speed = moveSpeed(a);
  const frames = Math.max(1, Math.round(Math.abs(x1 - x0) / speed));
  const at = (tt: number) => {
    const p = moveFn(a)(tt, { startX: x0, speed: (dir * Math.abs(x1 - x0)) / frames });
    return p;
  };
  if (t <= frames) {
    const p = at(t);
    // 歩き出しは前の姿勢から5フレームでなじませる
    const k = clamp01(t / 5);
    return { ...from, pose: k < 1 ? ground({ ...mixPose(from.pose, p, k), x: p.x }) : p, facing: dir, poseName: null };
  }
  const last = { ...at(frames), x: x1 };
  const endName = a.opts.then ?? "STAND";
  const endPose = ground({ ...POSES[endName], x: x1 });
  const k = Easing.out(Easing.cubic)(clamp01((t - frames) / 7));
  return { ...from, pose: ground(mixPose(last, endPose, k)), facing: a.opts.facing ?? dir, poseName: endName };
};

/** 重ねる動きの終わり（「時間」の指定がなければ、次のポーズ・移動まで） */
const overlayEnd = (a: Action, base: Action[]): number => {
  if (a.opts.dur !== undefined) return a.start + a.opts.dur;
  const fixed: Record<string, number> = {
    nod: (a.opts.times ?? 2) * 10,
    shake: (a.opts.times ?? 3) * 8,
    jump: 28,
    bow: 34,
    apologize: 50,
  };
  if (a.code in fixed) return a.start + fixed[a.code];
  const next = base.find((b) => b.start > a.start);
  return next ? next.start : Infinity;
};

/** お辞儀・謝る：下げる→止める→戻す */
const bowOverlay = (p: Pose, t: number, deep: boolean, total: number): Pose => {
  const target: Pose = { ...p, torso: deep ? 70 : 48, head: 8, backArm: deep ? -4 : 6, backFore: 0, frontArm: deep ? 2 : 12, frontFore: 0 };
  const down = 10;
  const up = 10;
  const k = poseAt(t, [
    [0, { ...p, torso: 0 }],
    [down, { ...p, torso: 1 }],
    [total - up, { ...p, torso: 1 }],
    [total, { ...p, torso: 0 }],
  ]).torso;
  return ground(mixPose(p, target, k));
};

/** ジャンプ：しゃがむ→浮く→着地。浮いている高さも返す */
const jumpOverlay = (p: Pose, t: number, height: number): { pose: Pose; lift: number } => {
  const crouch = shiftPose(p, { torso: 16, backThigh: 40, backShin: -70, frontThigh: 48, frontShin: -75, backArm: -30, frontArm: -25 });
  const air: Pose = { ...POSES.BANZAI, x: p.x, y: p.y, backThigh: 10, backShin: -30, frontThigh: 30, frontShin: -40 };
  const k = poseAt(t, [
    [0, p],
    [6, crouch],
    [9, air],
    [19, air],
    [22, crouch],
    [28, p],
  ]);
  const airT = (t - 6) / 16;
  const lift = airT > 0 && airT < 1 ? 4 * height * airT * (1 - airT) : 0;
  return { pose: ground(k), lift };
};

/** フレーム f の登場人物の状態 */
export const characterAt = (ep: Episode, prep: Prepared, name: string, f: number): CharState => {
  const c = ep.cast[name];
  const pr = prep[name];
  const init = initialState(c);
  const s = baseAt(pr.base, pr.base.length - 1, f, init);

  // 出ている・いない（最初の動きから。登場/退場で切り替え）
  let visible = c.always || f >= pr.first;
  for (const a of [...pr.enters, ...pr.exits].sort((x, y) => x.start - y.start)) {
    if (a.start <= f) visible = a.code === "enter";
  }

  let pose = s.pose;
  let lift = 0;
  for (const a of pr.overlay) {
    const end = overlayEnd(a, pr.base);
    if (f < a.start || f >= end) continue;
    const t = f - a.start;
    switch (a.code) {
      case "nod":
        pose = nod(t, pose, { times: a.opts.times ?? 2 });
        break;
      case "shake":
        pose = shakeHead(t, pose, { times: a.opts.times ?? 3 });
        break;
      case "tremble":
        pose = tremble(f, pose, 3 * (a.opts.power ?? 1));
        break;
      case "bow":
      case "apologize":
        pose = bowOverlay(pose, t, a.code === "apologize", end - a.start);
        break;
      case "jump": {
        const j = jumpOverlay(pose, t, a.opts.height ?? 150);
        pose = j.pose;
        lift = j.lift;
        break;
      }
    }
  }

  // ポーズ自体に動きがあるもの（手を振る・タイピング）
  if (s.poseName === "WAVE") pose = wave(f, pose);
  if (s.poseName === "SIT_TYPE") pose = typing(f, pose);
  // 止まって見えないよう、いつも小さく呼吸させる
  pose = breathe(f, pose, s.poseName === null ? 0.3 : 1);

  return { ...s, pose: { ...pose, y: pose.y - lift }, visible };
};

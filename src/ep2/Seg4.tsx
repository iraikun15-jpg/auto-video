import React from "react";
import { Easing } from "remotion";
import { jitter, mixPose, Pose, poseAt, shiftPose, track } from "../rig/pose";
import { Heart, PaperReam } from "../rig/props";
import { Boss, solve, StickFigure } from "../rig/StickFigure";
import { INK } from "../rig/theme";
import {
  BOSS_STAND,
  Canvas,
  HERO_HALF,
  Office,
  PRINTER_X,
  heartbeat,
  makeBeats,
  useSegFrame,
} from "./common";
import timing from "./timing.json";

// ---- タイムライン（seg4内のフレーム） ----
const LEAN_END = timing.pause.fromFrame; // 上司が少し身を乗り出す
const PAUSE_END = timing.pause.toFrame; // ここまで「間」（14フレーム≒0.47秒）。全員ピタッと止まる
const POINT = 36; // プリンターを指さし完了（用件を言う）
const COLLAPSE = 92; // 主人公へたり込み開始
const LANDED = 104;
const TURN = 128; // 上司がプリンターのほうへ向き直る
const CROUCH = 150;
const GRAB = 182;
const STANDUP = 198;
const LEAVE_END = 300;

const BEATS = makeBeats(0, PAUSE_END - 14, 11, 11);

// 主人公：床にへたり込んだ姿勢（脚を前に投げ出し、上体ぐったり）
const HERO_FLOOR: Pose = {
  ...HERO_HALF,
  x: 520,
  y: 1478,
  torso: 30,
  head: 34,
  backArm: 50,
  backFore: 25,
  frontArm: 40,
  frontFore: 30,
  backThigh: 84,
  backShin: 2,
  frontThigh: 88,
  frontShin: -4,
};

/** 歩きの脚・腕の振り */
const walk = (p: Pose, phase: number, amp = 1): Pose =>
  shiftPose(p, {
    frontThigh: Math.sin(phase) * 26 * amp,
    backThigh: -Math.sin(phase) * 26 * amp,
    frontShin: -Math.max(0, Math.cos(phase)) * 25 * amp,
    backShin: -Math.max(0, -Math.cos(phase)) * 25 * amp,
    frontArm: -Math.sin(phase) * 18 * amp,
    backArm: Math.sin(phase) * 18 * amp,
    y: -Math.abs(Math.sin(phase)) * 8 * amp,
  });

/** seg4 24〜35秒：「間」→プリンターを指さす→紙の話だった→へたり込む→上司は紙を持って去る */
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");

  // ===== 主人公 =====
  const still = f >= LEAN_END && f < PAUSE_END; // 「間」は震えも止める
  const heroKeys: [number, Pose][] = [
    [0, HERO_HALF],
    [POINT + 10, HERO_HALF],
    // プリンターのほうへ上体を反らして確認
    [POINT + 30, { ...HERO_HALF, torso: -4, head: -22 }],
    [COLLAPSE, { ...HERO_HALF, torso: -4, head: -22 }],
    // ストンと落ちてバウンド（大げさに）
    [LANDED - 4, { ...HERO_FLOOR, y: HERO_FLOOR.y + 10, torso: 45, head: 40 }],
    [LANDED + 2, { ...HERO_FLOOR, y: HERO_FLOOR.y - 26, torso: 18 }],
    [LANDED + 10, HERO_FLOOR],
    // 力なく棚を指さす
    [LANDED + 24, HERO_FLOOR],
    [LANDED + 36, { ...HERO_FLOOR, torso: 14, head: 10, frontArm: -78, frontFore: -6 }],
    [LANDED + 62, { ...HERO_FLOOR, torso: 14, head: 10, frontArm: -78, frontFore: -6 }],
    [LANDED + 78, HERO_FLOOR],
  ];
  let hero = poseAt(f, heroKeys, f >= COLLAPSE && f < LANDED ? Easing.in(Easing.quad) : undefined);
  const scared = f < COLLAPSE;
  const pulse = f < LEAN_END ? heartbeat(f, BEATS) * 0.6 : 0;
  if (scared && !still) hero = shiftPose(hero, { x: jitter(f, 5, 3), y: -pulse * 5 });
  // 安堵のあとは大きく呼吸
  if (f > LANDED + 78) {
    const breath = Math.sin((f - LANDED - 78) * 0.12);
    hero = shiftPose(hero, { torso: breath * 4, head: breath * 3, y: -breath * 2 });
  }
  const hj = solve(hero);

  // ===== 上司 =====
  const LEAN: Pose = { ...BOSS_STAND, torso: 10, head: 6, frontArm: 20 };
  const POINTING: Pose = { ...LEAN, torso: 2, head: -14, backArm: -100, backFore: -4 };
  let boss: Pose = poseAt(f, [
    [0, BOSS_STAND],
    [LEAN_END, LEAN],
    [PAUSE_END, LEAN],
    [POINT, POINTING],
    [POINT + 70, POINTING],
    [TURN - 6, LEAN],
  ]);
  let bossFacing: 1 | -1 = 1;
  let carrying = false;
  const AT_PRINTER_X = 300;
  if (f >= TURN) {
    bossFacing = -1;
    // 左向き：プリンターの棚へ歩いて、しゃがんで紙を取る
    const CROUCHED: Pose = {
      ...BOSS_STAND,
      x: AT_PRINTER_X,
      y: BOSS_STAND.y + 52,
      torso: 55,
      head: 10,
      frontArm: 22,
      frontFore: 8,
      backArm: 12,
      backFore: 12,
      frontThigh: 40,
      frontShin: -75,
      backThigh: 20,
      backShin: -45,
    };
    const CARRY: Pose = {
      ...BOSS_STAND,
      x: AT_PRINTER_X,
      frontArm: 30,
      frontFore: 75,
      backArm: 22,
      backFore: 80,
    };
    if (f < CROUCH) {
      const t = track(f, [[TURN, 0], [CROUCH - 8, 1]]);
      boss = walk({ ...BOSS_STAND, x: BOSS_X_LERP(t) }, (f - TURN) * 0.45, 1 - t * 0.6);
      boss = mixPose(boss, CROUCHED, track(f, [[CROUCH - 10, 0], [CROUCH, 1]]));
    } else if (f < STANDUP) {
      boss = poseAt(f, [
        [CROUCH, CROUCHED],
        [GRAB, { ...CROUCHED, frontArm: 32, backArm: 24 }],
        [STANDUP, CARRY],
      ]);
      carrying = f >= GRAB;
    } else {
      carrying = true;
      const t = track(f, [[STANDUP + 6, 0], [LEAVE_END, 1]], Easing.in(Easing.quad));
      boss = walk({ ...CARRY, x: AT_PRINTER_X - t * 560 }, (f - STANDUP) * 0.42);
      // 歩くときも紙は胸の前で抱える
      boss = { ...boss, frontArm: 30, frontFore: 75, backArm: 22, backFore: 80 };
    }
  }
  const bj = solve(boss, bossFacing);
  const shelfOpen = track(f, [[CROUCH, 0], [CROUCH + 14, 1]]);

  // 指さしの強調線（プリンターの周り）
  const emph = track(f, [[POINT - 2, 0], [POINT + 4, 1], [POINT + 50, 1], [POINT + 60, 0]]);
  // ぷしゅー（安堵の脱力線）
  const relief = track(f, [[LANDED, 0], [LANDED + 6, 1], [LANDED + 70, 1], [LANDED + 90, 0]]);

  return (
    <Canvas>
      <Office
        shelfOpen={shelfOpen}
        paperInShelf={!carrying}
        blink={f > POINT && f < POINT + 80 && Math.floor(f / 8) % 2 === 0}
      />
      {/* プリンターの強調線 */}
      <g opacity={emph} stroke={INK} strokeWidth={8} strokeLinecap="round">
        {[-60, -30, 0, 30, 60].map((a) => {
          const r = (a - 90) * (Math.PI / 180);
          const cx = PRINTER_X + 105;
          const cy = 1150;
          return (
            <line
              key={a}
              x1={cx + Math.cos(r) * 110}
              y1={cy + Math.sin(r) * 110}
              x2={cx + Math.cos(r) * 150}
              y2={cy + Math.sin(r) * 150}
            />
          );
        })}
      </g>
      <Boss pose={boss} facing={bossFacing} />
      {carrying ? (
        <PaperReam x={(bj.frontHand[0] + bj.backHand[0]) / 2} y={(bj.frontHand[1] + bj.backHand[1]) / 2 + 10} />
      ) : null}
      <StickFigure pose={hero} />
      {f < COLLAPSE ? (
        <Heart
          x={hj.chest[0] + 8}
          y={hj.chest[1] + 4}
          size={62 * (1 + pulse) * track(f, [[COLLAPSE - 12, 1], [COLLAPSE, 0]])}
        />
      ) : null}
      {/* 安堵：頭から抜ける湯気のような線と、大きなため息 */}
      <g opacity={relief} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round">
        {[-40, 0, 40].map((dx, i) => {
          const rise = ((f - LANDED) * 2.2 + i * 18) % 70;
          return (
            <path
              key={dx}
              d={`M ${hj.head[0] + dx} ${hj.head[1] - 60 - rise} q 14 -16 0 -32 q -14 -16 0 -32`}
            />
          );
        })}
        <path
          d={`M ${hj.head[0] + 55} ${hj.head[1] + 5} q 40 -30 80 0 q 35 30 70 0`}
          strokeWidth={6}
          opacity={track(f, [[LANDED + 4, 0], [LANDED + 10, 1], [LANDED + 40, 1], [LANDED + 55, 0]])}
        />
      </g>
    </Canvas>
  );
};

const BOSS_X_LERP = (t: number) => BOSS_STAND.x + (300 - BOSS_STAND.x) * t;

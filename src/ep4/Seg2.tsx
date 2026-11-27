import React from "react";
import { Easing } from "remotion";
import { COUNTER_TOP, KonbiniShelf, Onigiri, RegisterCounter } from "../rig/konbini";
import { jitter, Pose, poseAt, shiftPose, track, walkPose } from "../rig/pose";
import { Drop, Floor } from "../rig/props";
import { Friend, solve, StickFigure } from "../rig/StickFigure";
import { FRIEND_BLUE, INK } from "../rig/theme";
import { Canvas, HERO_STAND, markOf, useSegFrame } from "./common";

const SHELF_X = 30;
const SHELF_W = 400;
const COUNTER_X = 700;
const TIERS = [
  { price: "108", count: 3 }, // いちばん安い（目の高さの段）
  { price: "168", count: 4 },
  { price: "198", count: 4 },
];

const LOOK = [markOf("seg2", 0), markOf("seg2", 1), markOf("seg2", 2)];
const PLACE = markOf("seg2", 3);
const PICK = 166; // いちばん安いおにぎりを取る
const WALK = [184, 218]; // レジへ
const PONDER = [218, PLACE - 10]; // レジ前で悩む

// 棚の前（左向き）
const AT_SHELF: Pose = { ...HERO_STAND, x: 560 };
/** 値段札をのぞき込む（level: 1〜3。3回目はさらに顔を近づけて大げさに） */
const peek = (level: number): Pose => ({
  ...AT_SHELF,
  x: AT_SHELF.x - (level === 3 ? 40 : 15),
  torso: level === 3 ? 22 : 12,
  head: level === 3 ? 6 : 8,
  backArm: -30,
  backFore: 20,
  frontArm: level === 3 ? 70 : 40,
  frontFore: level === 3 ? 60 : 40,
  backThigh: -16,
  frontThigh: level === 3 ? 22 : 10,
  frontShin: level === 3 ? -20 : -6,
});

const AT_REG: Pose = { ...HERO_STAND, x: 620 };
const PONDER_POSE: Pose = { ...AT_REG, head: -14, frontArm: 30, frontFore: 140, backArm: 20, backFore: 100 };

/** seg2 3〜13秒：コンビニ。値段札を3回見る→レジ前で悩む→いちばん安いおにぎり1個→後ろの人の視線 */
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");

  // ===== 主人公 =====
  let hero: Pose;
  let facing: 1 | -1 = -1;
  if (f < WALK[0]) {
    const keys: [number, Pose][] = [[0, AT_SHELF]];
    LOOK.forEach((s, i) => {
      const lv = i + 1;
      const hold = lv === 3 ? 34 : 12;
      keys.push([s - 2, AT_SHELF], [s + 8, peek(lv)], [s + 8 + hold, peek(lv)], [s + 8 + hold + 10, AT_SHELF]);
    });
    // 下の段のおにぎりを取る
    keys.push([PICK - 6, AT_SHELF], [PICK + 4, { ...AT_SHELF, torso: 8, head: 4, frontArm: 92, frontFore: 6 }], [WALK[0], { ...AT_SHELF, frontArm: 40, frontFore: 60 }]);
    hero = poseAt(f, keys);
    // 3回目は顔を寄せたままプルプル
    if (f > LOOK[2] + 8 && f < LOOK[2] + 42) hero = shiftPose(hero, { head: jitter(f, 3, 2), torso: jitter(f, 1.5, 5) });
  } else if (f < WALK[1]) {
    facing = 1;
    const x = track(f, [[WALK[0], AT_SHELF.x], [WALK[1], AT_REG.x]], Easing.inOut(Easing.sin));
    hero = walkPose({ ...AT_REG, x, frontArm: 40, frontFore: 60 }, f * 0.45);
    hero = { ...hero, frontArm: 40, frontFore: 60 };
  } else {
    facing = 1;
    const sway = f < PONDER[1] ? Math.sin((f - PONDER[0]) * 0.18) : 0;
    hero = poseAt(f, [
      [WALK[1], { ...AT_REG, frontArm: 40, frontFore: 60 }],
      [PONDER[0] + 8, PONDER_POSE],
      [PONDER[1], PONDER_POSE],
      // おにぎりをそっと置く
      [PLACE, { ...AT_REG, torso: 12, head: 14, frontArm: 62, frontFore: 18, backArm: -10, backFore: 20 }],
      [PLACE + 18, { ...AT_REG, torso: 6, head: 18, frontArm: 30, frontFore: 20, backArm: -10, backFore: 20 }],
    ]);
    hero = shiftPose(hero, { head: sway * 14, torso: sway * 3 });
  }
  const hj = solve(hero, facing);
  const holding = f >= PICK + 2 && f < PLACE;

  // ===== 後ろに並ぶ人（青） =====
  const queueX = track(f, [[WALK[0] + 6, -120], [WALK[1] + 14, 380]], Easing.out(Easing.sin));
  const friendBase: Pose = { ...HERO_STAND, x: queueX, frontArm: 20, frontFore: 40 };
  const queueWalking = f > WALK[0] + 6 && f < WALK[1] + 14;
  const gaze = track(f, [[PLACE + 2, 0], [PLACE + 12, 1]]);
  let friend = queueWalking ? walkPose(friendBase, f * 0.45) : friendBase;
  // 視線：首をのばしてのぞき込む
  friend = shiftPose(friend, { torso: gaze * 14, head: gaze * 16, x: gaze * 24 });
  const fj = solve(friend, 1);

  const onigiriOnCounter: [number, number] = [COUNTER_X + 90, COUNTER_TOP - 18];

  return (
    <Canvas>
      <Floor />
      <KonbiniShelf
        x={SHELF_X}
        width={SHELF_W}
        tiers={TIERS}
        taken={[f >= PICK + 2 ? 1 : 0, 0, 0]}
        tagGlow={[LOOK.reduce((a, s, i) => Math.max(a, track(f, [[s + 4, 0], [s + 8, 1], [s + 20 + (i === 2 ? 22 : 0), 1], [s + 30 + (i === 2 ? 22 : 0), 0]])), 0), 0, 0]}
      />
      <RegisterCounter x={COUNTER_X} />
      {f > WALK[0] ? <Friend pose={friend} facing={1} /> : null}
      <StickFigure pose={hero} facing={facing} />
      {holding ? <Onigiri x={hj.frontHand[0] + facing * 6} y={hj.frontHand[1] + 24} scale={0.8} /> : null}
      {f >= PLACE ? <Onigiri x={onigiriOnCounter[0]} y={onigiriOnCounter[1] + 18} scale={0.8} /> : null}

      {/* 3回目：目を凝らす線 */}
      {f > LOOK[2] + 8 && f < LOOK[2] + 42
        ? [-20, 0, 20].map((a) => {
            const t = ((a + 200) * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={hj.head[0] + Math.cos(t) * 62}
                y1={hj.head[1] + Math.sin(t) * 62}
                x2={hj.head[0] + Math.cos(t) * 96}
                y2={hj.head[1] + Math.sin(t) * 96}
                stroke={INK}
                strokeWidth={7}
                strokeLinecap="round"
              />
            );
          })
        : null}

      {/* 後ろの人の視線（青の点線）と、主人公の冷や汗 */}
      {gaze > 0 ? (
        <>
          <line
            x1={fj.head[0] + 40}
            y1={fj.head[1]}
            x2={onigiriOnCounter[0] - 30}
            y2={onigiriOnCounter[1] - 20}
            stroke={FRIEND_BLUE}
            strokeWidth={6}
            strokeDasharray={`2 16`}
            strokeLinecap="round"
            opacity={gaze}
            pathLength={1000}
          />
          <Drop x={hj.head[0] - 58} y={hj.head[1] - 30 + (f - PLACE) * 0.6} size={1.4} angle={-20} opacity={gaze} />
        </>
      ) : null}
    </Canvas>
  );
};

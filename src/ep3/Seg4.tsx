import React from "react";
import { Easing } from "remotion";
import { Pose, poseAt, shiftPose, track, walkPose } from "../rig/pose";
import { Mug, MenuStand, SHOP, ShopScene, ShopStaff, ShopTable, SmallPlate } from "../rig/shop";
import { Friend, solve, StickFigure } from "../rig/StickFigure";
import { BG, INK } from "../rig/theme";
import { Canvas, useSegFrame } from "./common";

// ---- タイムライン（seg4内のフレーム） ----
const IN1 = [14, 70]; // 店員がのれんから出て卓へ
const ORDER = 74; // 主人公が手を挙げて「いつもの」
const NOD = 100; // 店員がうなずく（2回）
const OUT1 = [128, 182]; // 店員が厨房へ戻る
const IN2 = [222, 268]; // ジョッキを持って戻る
const SERVE = 272; // 卓に置く
const TOAST = 292; // 乾杯

const OFF_X = 1160; // 画面外（厨房）

/** 店員の位置と姿勢 */
const staffAt = (f: number): { pose: Pose; facing: 1 | -1; carry: boolean } => {
  const S = SHOP.staffStand;
  const walkX = (a: number, b: number, from: number, to: number) =>
    track(f, [[a, from], [b, to]], Easing.inOut(Easing.sin));
  if (f < IN1[1]) {
    return { pose: walkPose({ ...S, x: walkX(IN1[0], IN1[1], OFF_X, SHOP.staffSpot) }, f * 0.42, f < IN1[1] - 4 ? 1 : 0.3), facing: -1, carry: false };
  }
  if (f < OUT1[0]) {
    // 注文を聞く：伝票を持つように手を前に→2回うなずく
    const nod = f >= NOD && f < NOD + 22 ? Math.max(0, Math.sin(((f - NOD) / 11) * Math.PI)) * 18 : 0;
    const listen = poseAt(f, [
      [IN1[1], S],
      [IN1[1] + 10, { ...S, frontArm: 60, frontFore: 70, head: 6 }],
      [NOD + 24, { ...S, frontArm: 60, frontFore: 70, head: 6 }],
      [OUT1[0], S],
    ]);
    return { pose: shiftPose(listen, { head: nod, torso: nod * 0.3 }), facing: -1, carry: false };
  }
  if (f < IN2[0]) {
    return { pose: walkPose({ ...S, x: walkX(OUT1[0], OUT1[1], SHOP.staffSpot, OFF_X) }, f * 0.42), facing: 1, carry: false };
  }
  const CARRY: Pose = { ...S, frontArm: 62, frontFore: 28, backArm: 58, backFore: 34 };
  if (f < IN2[1]) {
    const p = walkPose({ ...CARRY, x: walkX(IN2[0], IN2[1], OFF_X, SHOP.staffSpot) }, f * 0.42, 0.7);
    return { pose: { ...p, frontArm: CARRY.frontArm, frontFore: CARRY.frontFore, backArm: CARRY.backArm, backFore: CARRY.backFore }, facing: -1, carry: true };
  }
  // 置く→少し下がって満足げに手を腰に
  const p = poseAt(f, [
    [IN2[1], CARRY],
    [SERVE - 2, { ...CARRY, torso: 22, frontArm: 40, frontFore: 20, backArm: 40, backFore: 24 }],
    [SERVE + 10, { ...CARRY, torso: 22, frontArm: 40, frontFore: 20, backArm: 40, backFore: 24 }],
    [SERVE + 26, { ...S, backArm: -30, backFore: 110, frontArm: 30, frontFore: -110, head: -4 }],
  ]);
  return { pose: shiftPose(p, { head: f > SERVE + 26 ? Math.sin(f * 0.3) * 4 : 0 }), facing: -1, carry: f < SERVE + 4 };
};

/** 座っている2人：会話のうなずき／注文の手／乾杯 */
const seated = (f: number, seat: Pose, who: "hero" | "friend"): Pose => {
  const ORDER_UP: Pose = { ...seat, frontArm: 150, frontFore: 10, torso: 0, head: -10 };
  const RAISE: Pose = { ...seat, frontArm: 120, frontFore: -40, torso: -2, head: -8 }; // ジョッキを掲げる
  const lookStaff: Pose = { ...seat, head: who === "friend" ? -16 : -8 };
  const keys: [number, Pose][] =
    who === "hero"
      ? [
          [0, seat],
          [ORDER - 6, lookStaff],
          [ORDER + 4, ORDER_UP],
          [ORDER + 30, ORDER_UP],
          [ORDER + 42, seat],
          [TOAST - 8, seat],
          [TOAST, RAISE],
        ]
      : [
          [0, seat],
          [ORDER - 6, lookStaff],
          [ORDER + 34, lookStaff],
          [ORDER + 44, seat],
          [TOAST - 8, seat],
          [TOAST, RAISE],
        ];
  let p = poseAt(f, keys);
  // 会話：交互に軽くうなずく
  const talk = who === "hero" ? Math.sin(f * 0.22) : Math.sin(f * 0.22 + Math.PI);
  const chatting = f < ORDER - 10 || (f > OUT1[0] && f < TOAST - 10);
  if (chatting) p = shiftPose(p, { head: Math.max(0, talk) * 10, torso: Math.max(0, talk) * 2, frontFore: Math.max(0, talk) * 10 });
  // 「いつもの」で手をひらひら
  if (who === "hero" && f > ORDER + 4 && f < ORDER + 30) p = shiftPose(p, { frontFore: Math.sin((f - ORDER) * 0.6) * 14 });
  // 友達は注文のときに大きくうなずく（いつものね）
  if (who === "friend" && f > ORDER + 6 && f < ORDER + 30) p = shiftPose(p, { head: Math.max(0, Math.sin((f - ORDER - 6) * 0.26)) * 18 });
  // 乾杯：小さく揺らす
  if (f > TOAST) p = shiftPose(p, { frontArm: Math.sin((f - TOAST) * 0.5) * 4 * Math.exp(-(f - TOAST) / 20) });
  return p;
};

/** お盆（ジョッキ2つと小皿） */
const Tray: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <Mug x={x - 40} y={y - 6} />
    <Mug x={x + 40} y={y - 6} flip />
    <rect x={x - 90} y={y - 8} width={180} height={12} rx={5} fill={BG} stroke={INK} strokeWidth={6} />
  </g>
);

/** seg4 24〜35秒：場面転換。いつもの店のいつもの席、顔なじみの店員にメニューも見ずに注文 */
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const staff = staffAt(f);
  const sj = solve(staff.pose, staff.facing);
  const norenPart =
    track(f, [[IN1[0] - 4, 0], [IN1[0] + 6, 1], [IN1[0] + 26, 0]]) +
    track(f, [[OUT1[1] - 20, 0], [OUT1[1] - 8, 1], [OUT1[1] + 8, 0]]) +
    track(f, [[IN2[0] - 4, 0], [IN2[0] + 6, 1], [IN2[0] + 26, 0]]);

  const hero = seated(f, SHOP.heroSeat, "hero");
  const friend = seated(f, SHOP.friendSeat, "friend");
  const hj = solve(hero);
  const fj = solve(friend, -1);
  const served = f >= SERVE;
  const lifted = f >= TOAST - 4;

  return (
    <Canvas>
      <ShopScene frame={f} norenPart={Math.min(1, norenPart)} />
      {/* 店員は卓の奥（人物・卓より先に描く） */}
      <ShopStaff pose={staff.pose} facing={staff.facing} />
      {staff.carry ? <Tray x={sj.frontHand[0] - 30} y={sj.frontHand[1] - 4} /> : null}

      <StickFigure pose={hero} />
      <Friend pose={friend} facing={-1} />
      <ShopTable />
      {/* 卓の上：閉じたままのメニュー、小皿、ジョッキ */}
      <MenuStand x={(SHOP.tableX1 + SHOP.tableX2) / 2} y={SHOP.tableTop} />
      {served ? <SmallPlate x={(SHOP.tableX1 + SHOP.tableX2) / 2 + 90} y={SHOP.tableTop} /> : null}
      {served && !lifted ? (
        <>
          <Mug x={SHOP.heroMug} y={SHOP.tableTop} />
          <Mug x={SHOP.friendMug} y={SHOP.tableTop} flip />
        </>
      ) : null}
      {lifted ? (
        <>
          <Mug x={hj.frontHand[0] + 10} y={hj.frontHand[1] + 34} rotate={12} />
          <Mug x={fj.frontHand[0] - 10} y={fj.frontHand[1] + 34} rotate={-12} flip />
          {/* 乾杯の線 */}
          {f > TOAST
            ? [-30, 0, 30].map((a) => {
                const cx = (hj.frontHand[0] + fj.frontHand[0]) / 2;
                const cy = Math.min(hj.frontHand[1], fj.frontHand[1]) - 70;
                const t = ((a - 90) * Math.PI) / 180;
                const k = track(f, [[TOAST, 0], [TOAST + 6, 1]], Easing.out(Easing.cubic));
                return (
                  <line
                    key={a}
                    x1={cx + Math.cos(t) * 30}
                    y1={cy + Math.sin(t) * 30}
                    x2={cx + Math.cos(t) * (30 + 40 * k)}
                    y2={cy + Math.sin(t) * (30 + 40 * k)}
                    stroke={INK}
                    strokeWidth={7}
                    strokeLinecap="round"
                  />
                );
              })
            : null}
        </>
      ) : null}
    </Canvas>
  );
};

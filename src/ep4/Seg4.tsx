import React from "react";
import { Easing } from "remotion";
import { CalendarPage } from "../rig/calendar";
import { jitter, Pose, poseAt, shiftPose, track } from "../rig/pose";
import { Floor } from "../rig/props";
import { Sparkle } from "../rig/station";
import { Face, HEAD_R, solve, StickFigure } from "../rig/StickFigure";
import { Burst, CafeCup, Confetti, ShoppingBag, SushiPlate } from "../rig/treats";
import { Wallet } from "../rig/wallet";
import { BG, FRIEND_BLUE, INK } from "../rig/theme";
import { Canvas, HERO_STAND, markOf, useSegFrame } from "./common";

const PAYDAY = markOf("seg4", 0);
const WEEK = markOf("seg4", 1);
const PALE = markOf("seg4", 2);
// 豪遊の3場面
const SUSHI = [40, 92];
const CAFE = [92, 144];
const CLOTHES = [144, 200];
const PAY = [SUSHI[1] - 6, CAFE[1] - 6, CLOTHES[1] - 6]; // 支払いの瞬間（財布がしぼむ）

const BASE: Pose = { ...HERO_STAND, x: 430 };
// 奥の手で財布を胸の前に持つ
const W = { backArm: 40, backFore: 80 };
const JOY: Pose = { ...BASE, ...W, torso: -6, head: -16, frontArm: 160, frontFore: 10 };
const EAT_PLATE: Pose = { ...BASE, ...W, head: 6, frontArm: 55, frontFore: 40 };
const EAT_BITE: Pose = { ...BASE, ...W, head: 2, frontArm: 30, frontFore: 128 };
const SIP: Pose = { ...BASE, ...W, torso: -4, head: -18, frontArm: 40, frontFore: 120 };
const BAGS: Pose = { ...BASE, ...W, torso: -4, head: -10, frontArm: 120, frontFore: 20 };
const STILL: Pose = { ...BASE, ...W, frontArm: 14, frontFore: -4 };
const OPEN: Pose = { ...BASE, torso: 6, head: 26, backArm: 30, backFore: 92, frontArm: 36, frontFore: 84 };
// 脱力：膝が少し折れて腕がだらり
const LIMP: Pose = {
  ...BASE,
  y: BASE.y + 26,
  torso: 16,
  head: 34,
  backArm: 12,
  backFore: 30,
  frontArm: 22,
  frontFore: 34,
  backThigh: 8,
  backShin: -20,
  frontThigh: 18,
  frontShin: -26,
};

/** 真っ青な顔（頭を青く塗り、縦線を入れる） */
const PaleHead: React.FC<{ pose: Pose; amt: number }> = ({ pose, amt }) => {
  if (amt <= 0) return null;
  const [hx, hy] = solve(pose).head;
  return (
    <g opacity={amt}>
      <circle cx={hx} cy={hy} r={HEAD_R} fill={FRIEND_BLUE} opacity={0.45} />
      {[-18, -4, 10, 24].map((dx) => (
        <line key={dx} x1={hx + dx} x2={hx + dx} y1={hy - HEAD_R + 8} y2={hy - 6} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      ))}
      <path d={`M ${hx + 2} ${hy + 18} q 10 -8 20 0`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** 財布から飛んでいくお札 */
const FlyingBills: React.FC<{ f: number; at: number; x: number; y: number }> = ({ f, at, x, y }) => {
  const d = f - at;
  if (d < 0 || d > 24) return null;
  return (
    <g opacity={1 - d / 24}>
      {[-1, 1].map((s) => (
        <rect
          key={s}
          x={x + s * d * 7 - 30}
          y={y - d * 9 + d * d * 0.25 - 18}
          width={60}
          height={36}
          rx={4}
          fill={BG}
          stroke={INK}
          strokeWidth={5}
          transform={`rotate(${s * d * 9} ${x + s * d * 7} ${y - d * 9})`}
        />
      ))}
    </g>
  );
};

/** seg4 24〜35秒：給料日に財布がパンパン→寿司・カフェ・服で豪遊→1週間後、財布を開けて真っ青、また小銭3枚 */
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const party = f < WEEK; // 豪遊中（明るく派手に）

  // ===== 主人公 =====
  const keys: [number, Pose][] = [
    [0, STILL],
    [PAYDAY + 4, JOY],
    [SUSHI[0] - 6, JOY],
    [SUSHI[0] + 4, EAT_PLATE],
    [SUSHI[0] + 14, EAT_BITE],
    [SUSHI[0] + 24, EAT_PLATE],
    [SUSHI[0] + 34, EAT_BITE],
    [SUSHI[1] - 4, EAT_PLATE],
    [CAFE[0] + 6, { ...SIP, frontFore: 80, head: 0 }],
    [CAFE[0] + 18, SIP],
    [CAFE[1] - 14, SIP],
    [CAFE[1] - 4, { ...SIP, frontFore: 80, head: 0 }],
    [CLOTHES[0] + 8, BAGS],
    [CLOTHES[1], BAGS],
    [WEEK, STILL],
    [PALE - 6, STILL],
    [PALE + 4, OPEN],
    [PALE + 14, OPEN],
    // 一気に脱力
    [PALE + 22, { ...OPEN, ...LIMP, backArm: 30, backFore: 80, frontArm: 30, frontFore: 70 }],
  ];
  let hero = poseAt(f, keys);
  if (party) {
    // ノリノリで弾む
    const bounce = Math.abs(Math.sin(f * 0.32));
    hero = shiftPose(hero, { y: -bounce * (f < SUSHI[0] ? 30 : 12), torso: Math.sin(f * 0.16) * 3 });
  }
  // 服の場面はくるっと回る（向きを切り替える）
  const facing: 1 | -1 = f >= CLOTHES[0] + 14 && f < CLOTHES[0] + 34 ? -1 : 1;
  if (f > PALE + 22) hero = shiftPose(hero, { y: Math.sin((f - PALE - 22) * 0.12) * 3, x: jitter(f, 1.2, 6) });
  const hj = solve(hero, facing);

  // ===== 財布：パンパン→支払うたびにしぼむ→翌週ぺしゃんこ =====
  const bulge = party
    ? track(f, [
        [PAYDAY - 2, -0.4],
        [PAYDAY + 6, 1.25],
        [PAYDAY + 12, 0.95],
        [PAYDAY + 16, 1],
        [PAY[0], 1],
        [PAY[0] + 6, 0.66],
        [PAY[1], 0.66],
        [PAY[1] + 6, 0.33],
        [PAY[2], 0.33],
        [PAY[2] + 6, 0.05],
      ])
    : track(f, [[WEEK, 0.05], [PALE, -1]], Easing.in(Easing.cubic));
  const walletOpen = track(f, [[PALE, 0], [PALE + 10, 1]], Easing.out(Easing.cubic));
  const wx = (f >= PALE - 6 ? hj.frontHand[0] + 14 : hj.backHand[0] + facing * 30);
  const wy = (f >= PALE - 6 ? hj.frontHand[1] + 8 : hj.backHand[1] - 10);

  // ===== カレンダー（日めくり）：給料日25日 → 1週間で7枚めくって「1」 =====
  const DAYS = [25, 26, 27, 28, 29, 30, 31, 1];
  const calIdx = Math.min(7, Math.max(0, Math.floor((f - WEEK) / 3) + 1));
  const CAL = { x: 720, y: 470, w: 300, h: 300 };
  const calShake = f >= WEEK && f < WEEK + 24 ? jitter(f, 3, 1) : 0;

  const burst = party ? track(f, [[PAYDAY, 0], [PAYDAY + 6, 1]]) : 0;
  const smile = party && f > PAYDAY;
  const pale = track(f, [[PALE + 6, 0], [PALE + 12, 1]]);

  return (
    <Canvas>
      <Burst x={hj.chest[0]} y={hj.chest[1] - 60} frame={f} power={burst} />
      <Confetti frame={f} power={burst} />
      <Floor />

      {/* 日めくりカレンダー */}
      <g transform={`translate(${calShake} 0)`}>
        <CalendarPage {...CAL} big={`${DAYS[calIdx]}`} bigColor={party ? FRIEND_BLUE : INK} />
        <rect x={CAL.x} y={CAL.y - 30} width={CAL.w} height={44} rx={10} fill={INK} />
      </g>

      {/* 豪遊の小物 */}
      {f >= SUSHI[0] && f < SUSHI[1] ? (
        <SushiPlate x={hj.frontHand[0] + 20} y={hj.frontHand[1] + 12} scale={0.9} eaten={f > SUSHI[0] + 34 ? 2 : f > SUSHI[0] + 14 ? 1 : 0} />
      ) : null}
      {f >= CAFE[0] && f < CAFE[1] ? <CafeCup x={hj.frontHand[0] + 10} y={hj.frontHand[1] + 50} scale={0.95} frame={f} /> : null}
      {f >= CLOTHES[0] && f < CLOTHES[1] ? (
        <>
          <ShoppingBag x={hj.frontHand[0] - 30} y={hj.frontHand[1] - 6} scale={0.9} rotate={Math.sin(f * 0.3) * 10} />
          <ShoppingBag x={hj.frontHand[0] + 30} y={hj.frontHand[1] - 6} scale={0.9} rotate={Math.sin(f * 0.3 + 1) * 10} />
        </>
      ) : null}

      <StickFigure pose={hero} facing={facing} />
      {smile ? <Face pose={hero} facing={facing} /> : null}
      <PaleHead pose={hero} amt={pale} />

      <Wallet x={wx} y={wy} open={walletOpen} bulge={bulge} scale={f >= PALE - 6 ? 1.2 : 1.15} coins={3} />
      {PAY.map((p) => (
        <FlyingBills key={p} f={f} at={p} x={wx + 60} y={wy - 40} />
      ))}

      {/* キラキラ（豪遊中だけ） */}
      {party
        ? [0, 1, 2, 3].map((i) => {
            const a = Math.max(0, Math.sin(f * 0.15 + i * 1.7));
            return (
              <Sparkle key={i} x={hj.head[0] + [-150, 140, -110, 170][i]} y={hj.head[1] + [-90, -60, 120, 140][i]} size={16 + a * 18} color={i % 2 ? FRIEND_BLUE : INK} opacity={a} />
            );
          })
        : null}
    </Canvas>
  );
};

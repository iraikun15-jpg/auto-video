import React from "react";
import { Easing, interpolate } from "remotion";
import { CalendarPage, CalendarRings, FlippingPage, seasonOf } from "../rig/calendar";
import { Pose, poseAt, shiftPose, track } from "../rig/pose";
import { Floor } from "../rig/props";
import { solve, StickFigure } from "../rig/StickFigure";
import { Wallet } from "../rig/wallet";
import { BG, FONT, INK } from "../rig/theme";
import { Canvas, HERO_STAND, markOf, useSegFrame } from "./common";

const CAL = { x: 480, y: 600, w: 420, h: 480 };
const FIRST = markOf("seg3", 0);
const STEP = 46;
const FLIPS = [0, 1, 2, 3, 4].map((k) => FIRST + k * STEP);
const FLIP_DUR = 10;
const WALLET_AT = markOf("seg3", 1);
const MONTHS = [4, 5, 6, 7, 8, 9];

const BASE: Pose = { ...HERO_STAND, x: 290 };
const REACH: Pose = { ...BASE, torso: -4, head: -16, frontArm: 112, frontFore: 10 };
const FLICK: Pose = { ...BASE, torso: -6, head: -22, frontArm: 150, frontFore: -6 };
// 拳を握って決意（毎回まったく同じ）
const RESOLVE: Pose = { ...BASE, torso: 2, head: 4, frontArm: 50, frontFore: 118, backArm: -20, backFore: 60 };
const OPEN_WALLET: Pose = { ...BASE, torso: 8, head: 26, backArm: 30, backFore: 92, frontArm: 36, frontFore: 84 };

/** 「来月から節約する」の吹き出し（毎回まったく同じ文言・形・位置） */
const Bubble: React.FC<{ pop: number; tail: [number, number] }> = ({ pop, tail }) => {
  if (pop <= 0) return null;
  const cx = 540;
  const cy = 380;
  const s = interpolate(pop, [0, 1], [0.85, 1]);
  return (
    <g opacity={Math.min(1, pop * 2)} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <path d={`M ${cx - 220} ${cy + 70} L ${tail[0]} ${tail[1]} L ${cx - 120} ${cy + 80} Z`} fill={BG} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <rect x={cx - 450} y={cy - 95} width={900} height={190} rx={95} fill={BG} stroke={INK} strokeWidth={8} />
      <rect x={cx - 230} y={cy + 60} width={140} height={30} fill={BG} />
      <text x={cx} y={cy + 36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} fill={INK}>
        来月から節約する
      </text>
    </g>
  );
};

/** seg3 13〜24秒：カレンダーをめくるたびに同じ吹き出し「来月から節約する」→ 財布を開けるとやっぱり小銭3枚 */
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");

  // 何枚めくったか・めくり途中か
  let done = 0;
  let flipT = 0;
  FLIPS.forEach((s) => {
    if (f >= s + FLIP_DUR) done++;
    else if (f >= s) flipT = (f - s) / FLIP_DUR;
  });

  // 主人公：手を伸ばす→めくる→拳を握って決意、を毎回同じ動きで繰り返す
  const keys: [number, Pose][] = [[0, RESOLVE]];
  FLIPS.forEach((s) => {
    keys.push([s - 10, REACH], [s + 4, FLICK], [s + 14, RESOLVE], [s + 30, RESOLVE]);
  });
  keys.push([WALLET_AT - 6, BASE], [WALLET_AT + 8, OPEN_WALLET], [WALLET_AT + 30, OPEN_WALLET], [WALLET_AT + 50, { ...OPEN_WALLET, torso: 16, head: 38, y: OPEN_WALLET.y + 8 }]);
  let hero = poseAt(f, keys);
  // 決意のうなずき（2回）
  FLIPS.forEach((s) => {
    const d = f - (s + 16);
    if (d >= 0 && d < 20) hero = shiftPose(hero, { head: Math.max(0, Math.sin((d / 10) * Math.PI)) * 12 });
  });
  if (f > WALLET_AT + 50) hero = shiftPose(hero, { y: Math.sin((f - WALLET_AT - 50) * 0.15) * 3 });
  const hj = solve(hero);

  // 吹き出し：めくり終わってすぐ出て、次にめくる直前に消える
  let pop = 0;
  FLIPS.forEach((s, i) => {
    const end = i < FLIPS.length - 1 ? FLIPS[i + 1] - 10 : WALLET_AT - 6;
    pop = Math.max(pop, track(f, [[s + 12, 0], [s + 18, 1], [end - 4, 1], [end, 0]], Easing.out(Easing.back(2))));
  });

  const walletOpen = track(f, [[WALLET_AT + 6, 0], [WALLET_AT + 16, 1]], Easing.out(Easing.cubic));
  const showWallet = f >= WALLET_AT - 2;

  const page = (idx: number) => ({ ...CAL, label: `${MONTHS[idx]}月`, season: seasonOf(MONTHS[idx]), busy: 0.15 });

  return (
    <Canvas>
      <Floor />
      {/* 壁のカレンダー（釘とひも） */}
      <circle cx={CAL.x + CAL.w / 2} cy={CAL.y - 60} r={8} fill={INK} />
      <path d={`M ${CAL.x + 60} ${CAL.y} L ${CAL.x + CAL.w / 2} ${CAL.y - 60} L ${CAL.x + CAL.w - 60} ${CAL.y}`} fill="none" stroke={INK} strokeWidth={5} />
      {flipT > 0 ? <CalendarPage {...page(done + 1)} /> : null}
      {flipT > 0 ? <FlippingPage {...page(done)} t={flipT} /> : <CalendarPage {...page(done)} />}
      <CalendarRings x={CAL.x} y={CAL.y} w={CAL.w} count={5} />

      <StickFigure pose={hero} />
      {showWallet ? <Wallet x={hj.frontHand[0] + 14} y={hj.frontHand[1] + 10} open={walletOpen} scale={1.1} coins={3} /> : null}
      <Bubble pop={pop} tail={[hj.head[0] + 10, hj.head[1] - 70]} />
    </Canvas>
  );
};

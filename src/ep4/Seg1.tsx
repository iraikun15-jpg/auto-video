import React from "react";
import { Easing } from "remotion";
import { jitter, Pose, poseAt, shiftPose, track } from "../rig/pose";
import { Floor } from "../rig/props";
import { solve, StickFigure } from "../rig/StickFigure";
import { Wallet } from "../rig/wallet";
import { BG, FONT, INK } from "../rig/theme";
import { Canvas, HERO_STAND, markOf, useSegFrame } from "./common";

/** 財布を両手で胸の前に持ち、中をのぞき込む姿勢 */
export const HOLD_WALLET: Pose = {
  ...HERO_STAND,
  x: 400,
  torso: 6,
  head: 26,
  backArm: 30,
  backFore: 92,
  frontArm: 36,
  frontFore: 84,
};

/** 片手で財布を高く上げて逆さに振る姿勢 */
const SHAKE: Pose = {
  ...HERO_STAND,
  x: 400,
  torso: -4,
  head: -18,
  backArm: -20,
  backFore: 20,
  frontArm: 128,
  frontFore: 30,
};

const FLIP = markOf("seg1", 0);

/** 「3ケタ」の大きな文字（画面の上半分以上）。サムネイルでも使う */
export const SanKeta: React.FC<{ dx?: number; dy?: number }> = ({ dx = 0, dy = 0 }) => (
  <g transform={`translate(${dx} ${dy})`} fontFamily={FONT} fontWeight={900} fill={INK} stroke={BG} strokeWidth={18} paintOrder="stroke">
    <text x={330} y={960} textAnchor="middle" fontSize={1000}>
      3
    </text>
    <text x={835} y={540} textAnchor="middle" fontSize={410}>
      ケ
    </text>
    <text x={835} y={960} textAnchor="middle" fontSize={410}>
      タ
    </text>
  </g>
);

/** seg1 0〜3秒：1フレーム目から財布を開けた主人公と「3ケタ」。逆さに振っても何も出てこない */
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");

  const base = poseAt(f, [
    [0, HOLD_WALLET],
    [FLIP - 4, HOLD_WALLET],
    [FLIP + 6, SHAKE],
    [66, SHAKE],
    // あきらめて腕を下ろし、うなだれる
    [76, { ...HOLD_WALLET, torso: 14, head: 34, frontArm: 10, frontFore: 20, backArm: -4, backFore: 10 }],
  ]);
  const shaking = f > FLIP + 4 && f < 66;
  const shakeAmt = shaking ? Math.sin(f * 1.7) : 0;
  const hero = shiftPose(base, {
    frontFore: shakeAmt * 28,
    frontArm: shakeAmt * 8,
    x: f < FLIP ? jitter(f, 1.5, 3) : 0,
    y: shaking ? -Math.abs(shakeAmt) * 6 : 0,
  });
  const hj = solve(hero);

  // 財布：開いたまま（中に小銭3枚）→ 逆さにして振る → 力なく下ろす
  const upside = track(f, [[FLIP - 2, 0], [FLIP + 6, 1], [66, 1], [74, 0]], Easing.inOut(Easing.cubic));
  const wRot = upside * 180 + shakeAmt * 14;
  const hold = 1 - upside;
  const wx = hj.frontHand[0] + hold * 14;
  const wy = hj.frontHand[1] + (hold * 10 - upside * 40);

  // 何も出てこない：ちりがひとつ落ちるだけ
  const dust = f > FLIP + 14 && f < 70 ? (f - FLIP - 14) : -1;
  // 文字はほんの少しだけ震える（大きさは変えない）
  const tShake = jitter(f, 2, 9);

  return (
    <Canvas>
      <SanKeta dx={tShake} dy={0} />
      <Floor />
      <StickFigure pose={hero} />
      <Wallet x={wx} y={wy} open={1} rotate={wRot} scale={1.25} coins={3} />
      {dust >= 0 ? (
        <circle cx={wx + 30 + Math.sin(dust * 0.3) * 8} cy={wy + 70 + dust * 4} r={4} fill={INK} opacity={Math.max(0, 1 - dust / 40)} />
      ) : null}
    </Canvas>
  );
};

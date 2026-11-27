import React from "react";
import { Pose, shiftPose, STAND } from "../rig/pose";
import { Floor } from "../rig/props";
import { solve, StickFigure, STAND_HIP_Y_OFFSET } from "../rig/StickFigure";
import { Coin, Wallet } from "../rig/wallet";
import { FONT, INK } from "../rig/theme";
import { useSegFrame, Canvas } from "./common";

const PANEL_FLOOR = 1450;
const HIP_Y = PANEL_FLOOR - STAND_HIP_Y_OFFSET;
const CYCLE = 60; // 左→右で交互にアピール

// 左：財布を胸に抱えてうなずく
const CLUTCH: Pose = { ...STAND, x: 250, y: HIP_Y, head: 6, backArm: 40, backFore: 110, frontArm: 30, frontFore: 120 };
// 右：財布を逆さに振りながら、手のひらの小銭を数える
const COUNT: Pose = { ...STAND, x: 790, y: HIP_Y, head: 22, torso: 4, backArm: 34, backFore: 70, frontArm: 120, frontFore: 30 };

const Label: React.FC<{ x: number; lines: string[]; active: number }> = ({ x, lines, active }) => {
  const s = 1 + active * 0.06;
  const top = lines.length === 1 ? 640 : 585;
  return (
    <g transform={`translate(${x} 610) scale(${s}) translate(${-x} -610)`}>
      {lines.map((l, i) => (
        <text key={l} x={x} y={top + i * 104} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill={INK}>
          {l}
        </text>
      ))}
    </g>
  );
};

/** seg5 35〜43秒：二択画面「節約できてる派？ できない派？」 */
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const phase = f % CYCLE;
  const leftOn = phase < CYCLE / 2;
  const t = Math.sin(((phase % (CYCLE / 2)) / (CYCLE / 2)) * Math.PI);
  const leftAct = leftOn ? t : 0;
  const rightAct = leftOn ? 0 : t;

  // 左：しっかりうなずく（アピール中は大きく）
  const nod = Math.max(0, Math.sin(f * 0.28)) * (8 + leftAct * 14);
  const left = shiftPose(CLUTCH, { head: nod, torso: nod * 0.2, y: -leftAct * 24 });
  const lj = solve(left);

  // 右：逆さの財布を振る＋小銭を数えるたびに首がこくっ
  const shake = Math.sin(f * (1.1 + rightAct * 0.8));
  const right = shiftPose(COUNT, { frontFore: shake * (14 + rightAct * 16), head: Math.max(0, Math.sin(f * 0.22)) * 10, y: -rightAct * 18 });
  const rj = solve(right);
  const coins = 1 + (Math.floor(f / 20) % 3); // 1枚→2枚→3枚と数える

  return (
    <Canvas>
      <line x1={540} x2={540} y1={380} y2={1640} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <Label x={270} lines={["節約", "できてる派？"]} active={leftAct} />
      <Label x={810} lines={["できない派？"]} active={rightAct} />
      <Floor x1={30} x2={510} y={PANEL_FLOOR} />
      <Floor x1={570} x2={1050} y={PANEL_FLOOR} />

      <StickFigure pose={left} />
      <Wallet x={lj.chest[0] + 10} y={lj.chest[1] + 20} scale={0.85} rotate={-8} />

      <StickFigure pose={right} />
      <Wallet x={rj.frontHand[0] - 10} y={rj.frontHand[1] - 40} scale={0.85} rotate={180 + shake * 12} open={0.7} />
      {Array.from({ length: coins }).map((_, i) => (
        <Coin key={i} x={rj.backHand[0] + 14 + i * 22} y={rj.backHand[1] - 14} r={13} />
      ))}
    </Canvas>
  );
};

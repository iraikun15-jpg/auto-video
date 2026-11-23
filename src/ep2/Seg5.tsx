import React from "react";
import { jitter, mixPose, Pose, shiftPose, STAND } from "../rig/pose";
import { Floor, Heart, SweatSpray } from "../rig/props";
import { solve, StickFigure, STAND_HIP_Y_OFFSET } from "../rig/StickFigure";
import { FONT, INK } from "../rig/theme";
import { Canvas, heartbeat, makeBeats, useSegFrame } from "./common";
import { BeatRings } from "./Seg2";

const PANEL_FLOOR = 1450;
const HIP_Y = PANEL_FLOOR - STAND_HIP_Y_OFFSET;
const CYCLE = 60; // 左→右で交互にアピール
const BEATS = makeBeats(0, 240, 10, 10);

// 左：胸を押さえてビクビク
const SCARED: Pose = {
  ...STAND,
  x: 270,
  y: HIP_Y + 12,
  torso: 6,
  head: 14,
  backArm: 18,
  backFore: 145,
  frontArm: 8,
  frontFore: 152,
  backThigh: 4,
  backShin: -12,
  frontThigh: 10,
  frontShin: -20,
};

// 右：平然と肩をすくめる
const CALM: Pose = { ...STAND, x: 810, y: HIP_Y };
const SHRUG: Pose = {
  ...CALM,
  head: -14,
  backArm: -48,
  backFore: -85,
  frontArm: 48,
  frontFore: 85,
};

const Label: React.FC<{ x: number; lines: string[]; active: number }> = ({ x, lines, active }) => {
  const s = 1 + active * 0.06;
  const top = lines.length === 1 ? 640 : 585;
  return (
    <g transform={`translate(${x} 610) scale(${s}) translate(${-x} -610)`}>
      {lines.map((l, i) => (
        <text
          key={l}
          x={x}
          y={top + i * 112}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={100}
          fill={INK}
        >
          {l}
        </text>
      ))}
    </g>
  );
};

/** seg5 35〜43秒：二択画面「ドキッとする派？ 平気な派？」 */
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const phase = f % CYCLE;
  const leftOn = phase < CYCLE / 2;
  const t = Math.sin(((phase % (CYCLE / 2)) / (CYCLE / 2)) * Math.PI); // 0→1→0
  const leftAct = leftOn ? t : 0;
  const rightAct = leftOn ? 0 : t;

  // 左：ビクビク（アピール中は大きく跳ねる）
  const pulse = heartbeat(f, BEATS);
  const left = shiftPose(SCARED, {
    x: jitter(f, 3 + leftAct * 5, 4),
    y: -leftAct * 40 - pulse * 4,
    torso: pulse * 3,
  });
  const lj = solve(left);

  // 右：肩をすくめる（アピール中に大きく、普段は小さく）
  const shrugAmt = 0.35 + rightAct * 0.65;
  const right = shiftPose(mixPose(CALM, SHRUG, shrugAmt), {
    y: -rightAct * 18,
    torso: Math.sin(f * 0.08) * 2,
  });

  return (
    <Canvas>
      <line x1={540} x2={540} y1={380} y2={1640} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <Label x={270} lines={["ドキッと", "する派？"]} active={leftAct} />
      <Label x={810} lines={["平気な派？"]} active={rightAct} />
      <Floor x1={30} x2={510} y={PANEL_FLOOR} />
      <Floor x1={570} x2={1050} y={PANEL_FLOOR} />

      <BeatRings frame={f} beats={BEATS} x={lj.chest[0] + 10} y={lj.chest[1]} power={0.7} />
      <Heart x={lj.chest[0] + 10} y={lj.chest[1] + 4} size={46 * (1 + pulse * 0.8)} />
      <StickFigure pose={left} />
      <SweatSpray frame={f} x={lj.head[0]} y={lj.head[1]} every={leftOn ? 4 : 9} power={0.8} seed="seg5" />

      <StickFigure pose={right} />
    </Canvas>
  );
};

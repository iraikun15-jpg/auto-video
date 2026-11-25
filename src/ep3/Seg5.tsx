import React from "react";
import { CalendarPage, CalendarRings, FlippingPage, seasonOf } from "../rig/calendar";
import { mixPose, Pose, shiftPose, STAND } from "../rig/pose";
import { Floor } from "../rig/props";
import { StickFigure, STAND_HIP_Y_OFFSET } from "../rig/StickFigure";
import { FONT, INK } from "../rig/theme";
import { Canvas, useSegFrame } from "./common";

const PANEL_FLOOR = 1450;
const HIP_Y = PANEL_FLOOR - STAND_HIP_Y_OFFSET;
const CYCLE = 60; // 左→右で交互にアピール

// 左：壁のカレンダーをめくり続ける
const CAL = { x: 300, y: 930, w: 190, h: 230 };
const FLIPPER: Pose = { ...STAND, x: 190, y: HIP_Y, torso: 4, head: -8, frontArm: 120, frontFore: 20 };

// 右：肩をすくめる
const CALM: Pose = { ...STAND, x: 810, y: HIP_Y };
const SHRUG: Pose = { ...CALM, head: -14, backArm: -48, backFore: -85, frontArm: 48, frontFore: 85 };

const Label: React.FC<{ x: number; lines: string[]; active: number }> = ({ x, lines, active }) => {
  const s = 1 + active * 0.06;
  const top = lines.length === 1 ? 640 : 585;
  return (
    <g transform={`translate(${x} 610) scale(${s}) translate(${-x} -610)`}>
      {lines.map((l, i) => (
        <text key={l} x={x} y={top + i * 112} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={100} fill={INK}>
          {l}
        </text>
      ))}
    </g>
  );
};

const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

/** seg5 35〜43秒：二択画面「実現する派？ しない派？」 */
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const phase = f % CYCLE;
  const leftOn = phase < CYCLE / 2;
  const t = Math.sin(((phase % (CYCLE / 2)) / (CYCLE / 2)) * Math.PI); // 0→1→0
  const leftAct = leftOn ? t : 0;
  const rightAct = leftOn ? 0 : t;

  // 左：一定間隔でめくり続ける（12フレームに1枚）
  const PER = 12;
  const n = Math.floor(f / PER);
  const ft = (f % PER) / 8; // 8フレームでめくる
  const flipT = Math.min(1, ft);
  const flick = Math.sin(Math.min(1, ft) * Math.PI);
  const left = shiftPose(FLIPPER, {
    frontArm: flick * 22,
    frontFore: -flick * 30,
    torso: flick * 2,
    y: -leftAct * 30,
    head: -leftAct * 6,
  });
  const month = (k: number) => MONTHS[k % MONTHS.length];

  // 右：肩をすくめる（アピール中に大きく）
  const shrugAmt = 0.35 + rightAct * 0.65;
  const right = shiftPose(mixPose(CALM, SHRUG, shrugAmt), {
    y: -rightAct * 18,
    torso: Math.sin(f * 0.08) * 2,
  });

  const pageProps = (k: number) => ({ ...CAL, label: `${month(k)}月`, season: seasonOf(month(k)), busy: 0.9 });

  return (
    <Canvas>
      <line x1={540} x2={540} y1={380} y2={1640} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <Label x={270} lines={["実現", "する派？"]} active={leftAct} />
      <Label x={810} lines={["しない派？"]} active={rightAct} />
      <Floor x1={30} x2={510} y={PANEL_FLOOR} />
      <Floor x1={570} x2={1050} y={PANEL_FLOOR} />

      {/* 壁掛けカレンダー */}
      <circle cx={CAL.x + CAL.w / 2} cy={CAL.y - 40} r={7} fill={INK} />
      <path d={`M ${CAL.x + 30} ${CAL.y} L ${CAL.x + CAL.w / 2} ${CAL.y - 40} L ${CAL.x + CAL.w - 30} ${CAL.y}`} fill="none" stroke={INK} strokeWidth={4} />
      <CalendarPage {...pageProps(n + 1)} />
      <FlippingPage {...pageProps(n)} t={flipT >= 1 ? 1 : flipT} />
      <CalendarRings x={CAL.x} y={CAL.y} w={CAL.w} count={4} />
      <StickFigure pose={left} />

      <StickFigure pose={right} />
    </Canvas>
  );
};

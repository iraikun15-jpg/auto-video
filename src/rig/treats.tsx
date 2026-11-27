import React from "react";
import { random } from "remotion";
import { BG, FRIEND_BLUE, INK } from "./theme";

// 第4話で追加：豪遊の小物（寿司・カフェ・服の紙袋）と、にぎやかな演出部品

const st = { stroke: INK, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** 寿司2貫をのせた皿（中心 x、y は皿の底） */
export const SushiPlate: React.FC<{ x: number; y: number; scale?: number; eaten?: number }> = ({ x, y, scale = 1, eaten = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M -90 -14 L 90 -14 L 76 0 L -76 0 Z" fill={BG} {...st} />
    {[-40, 40].map((dx, i) =>
      i < 2 - eaten ? (
        <g key={dx} transform={`translate(${dx} -14)`}>
          <rect x={-34} y={-30} width={68} height={30} rx={14} fill={BG} {...st} />
          <path d="M -38 -26 Q -36 -46 0 -48 Q 36 -46 40 -24 Q 0 -32 -38 -26 Z" fill={BG} {...st} />
          {[-16, 0, 16].map((s) => (
            <line key={s} x1={s - 4} x2={s + 6} y1={-42} y2={-32} stroke={INK} strokeWidth={3} />
          ))}
        </g>
      ) : null,
    )}
  </g>
);

/** カフェのカップ（ふた・スリーブ・湯気） */
export const CafeCup: React.FC<{ x: number; y: number; scale?: number; rotate?: number; frame?: number }> = ({
  x,
  y,
  scale = 1,
  rotate = 0,
  frame = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <path d="M -26 -80 L 26 -80 L 20 0 L -20 0 Z" fill={BG} {...st} />
    <rect x={-32} y={-92} width={64} height={14} rx={5} fill={BG} {...st} />
    <path d="M -24 -56 L 24 -56 L 22 -30 L -22 -30 Z" fill={BG} {...st} strokeWidth={5} />
    {[-10, 8].map((dx, i) => (
      <path
        key={dx}
        d={`M ${dx} -104 q ${8 * Math.sin(frame * 0.2 + i)} -12 0 -24 q ${-8 * Math.sin(frame * 0.2 + i)} -12 0 -24`}
        fill="none"
        stroke={INK}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.6}
      />
    ))}
  </g>
);

/** 服の紙袋（取っ手つき。中から服の襟がのぞく） */
export const ShoppingBag: React.FC<{ x: number; y: number; scale?: number; rotate?: number }> = ({ x, y, scale = 1, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    {/* 取っ手（y=0 が持ち手の上端） */}
    <path d="M -22 30 Q -22 0 0 0 Q 22 0 22 30" fill="none" {...st} />
    <path d="M -30 44 L -40 30 L 0 20 L 40 30 L 30 44" fill={BG} {...st} strokeWidth={5} />
    <rect x={-50} y={30} width={100} height={110} rx={4} fill={BG} {...st} />
    <path d="M -18 70 L 0 86 L 18 70" fill="none" {...st} strokeWidth={5} />
  </g>
);

/** 放射状の集中線（豪遊の明るい背景）。power 0〜1 */
export const Burst: React.FC<{ x: number; y: number; frame: number; power: number }> = ({ x, y, frame, power }) =>
  power > 0 ? (
    <g opacity={power} stroke={INK} strokeLinecap="round">
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2 + frame * 0.01;
        const r0 = 330 + (i % 2) * 60 + Math.sin(frame * 0.3 + i) * 20;
        const r1 = r0 + 160 + (i % 3) * 60;
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r0}
            y1={y + Math.sin(a) * r0}
            x2={x + Math.cos(a) * r1}
            y2={y + Math.sin(a) * r1}
            strokeWidth={i % 2 ? 6 : 10}
            opacity={0.35}
          />
        );
      })}
    </g>
  ) : null;

/** 紙吹雪（黒と青の小さな四角）。power 0〜1 */
export const Confetti: React.FC<{ frame: number; power: number; seed?: string }> = ({ frame, power, seed = "cf" }) =>
  power > 0 ? (
    <g opacity={power}>
      {Array.from({ length: 26 }).map((_, i) => {
        const x = random(`${seed}-x-${i}`) * 1080;
        const v = 4 + random(`${seed}-v-${i}`) * 4;
        const y = ((frame * v + random(`${seed}-y-${i}`) * 1900) % 1950) - 30;
        const r = frame * (3 + i) + i * 40;
        return (
          <rect
            key={i}
            x={x + Math.sin(frame * 0.1 + i) * 20 - 9}
            y={y - 5}
            width={18}
            height={10}
            fill={i % 2 ? FRIEND_BLUE : INK}
            transform={`rotate(${r} ${x} ${y})`}
          />
        );
      })}
    </g>
  ) : null;

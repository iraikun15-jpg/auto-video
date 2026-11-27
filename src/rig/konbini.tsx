import React from "react";
import { BG, FLOOR_Y, FONT, INK, PROP_LINE } from "./theme";

// 第4話で追加：コンビニの棚（おにぎり＋値段札）とレジ台

const stroke = {
  fill: BG,
  stroke: INK,
  strokeWidth: PROP_LINE,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

/** おにぎり（x は中心、y は底） */
export const Onigiri: React.FC<{ x: number; y: number; scale?: number; rotate?: number }> = ({ x, y, scale = 1, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <path d="M -34 0 Q -40 0 -36 -8 L -6 -58 Q 0 -66 6 -58 L 36 -8 Q 40 0 34 0 Z" fill={BG} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-14} y={-24} width={28} height={24} fill={INK} />
  </g>
);

export type ShelfTier = { price: string; count: number };

/**
 * おにぎりの棚（3段）。x は棚の左端。tiers は上の段から順に値段と個数。
 * 値段札は各段の縁に付く（数字だけ。文字のテロップではなく棚の一部）
 */
export const KonbiniShelf: React.FC<{
  x: number;
  width?: number;
  tiers: ShelfTier[];
  /** 取られて減った個数（段ごと） */
  taken?: number[];
  tagGlow?: number[]; // 0〜1 値段札の強調（見られている札）
}> = ({ x, width = 400, tiers, taken = [], tagGlow = [] }) => {
  const top = FLOOR_Y - 760;
  const tierH = 230;
  return (
    <g>
      {/* 棚の枠 */}
      <rect x={x} y={top} width={width} height={FLOOR_Y - top} {...stroke} />
      <rect x={x} y={top - 60} width={width} height={60} {...stroke} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={x + 50} x2={x + width - 50} y1={top - 30} y2={top - 30} stroke={INK} strokeWidth={4} opacity={i === 0 ? 0.5 : 0} />
      ))}
      {tiers.map((t, i) => {
        const shelfY = top + tierH * (i + 1);
        const n = Math.max(0, t.count - (taken[i] ?? 0));
        const glow = tagGlow[i] ?? 0;
        const tagX = x + width - 150;
        return (
          <g key={i}>
            {Array.from({ length: n }).map((_, k) => (
              <Onigiri key={k} x={x + 60 + k * 72} y={shelfY - 6} />
            ))}
            {/* 棚板 */}
            <rect x={x} y={shelfY} width={width} height={20} {...stroke} strokeWidth={6} />
            {/* 値段札 */}
            <g transform={`translate(${tagX + 60} ${shelfY + 36}) rotate(${glow * 3}) translate(${-(tagX + 60)} ${-(shelfY + 36)})`}>
              <rect x={tagX} y={shelfY + 12} width={120} height={50} rx={4} fill={BG} stroke={INK} strokeWidth={glow > 0.3 ? 7 : 5} />
              <text x={tagX + 60} y={shelfY + 50} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={INK}>
                {t.price}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** レジ台（x は台の左端）。台の上の高さは COUNTER_TOP */
export const COUNTER_TOP = FLOOR_Y - 280;
export const RegisterCounter: React.FC<{ x: number; width?: number }> = ({ x, width = 360 }) => (
  <g>
    <rect x={x} y={COUNTER_TOP} width={width} height={FLOOR_Y - COUNTER_TOP} {...stroke} />
    <rect x={x - 14} y={COUNTER_TOP - 18} width={width + 28} height={22} rx={5} {...stroke} />
    {/* レジ本体と画面 */}
    <rect x={x + width - 170} y={COUNTER_TOP - 110} width={140} height={92} rx={10} {...stroke} />
    <rect x={x + width - 150} y={COUNTER_TOP - 190} width={100} height={64} rx={6} {...stroke} />
    <line x1={x + width - 100} x2={x + width - 100} y1={COUNTER_TOP - 126} y2={COUNTER_TOP - 110} stroke={INK} strokeWidth={PROP_LINE} />
    {[0, 1, 2].map((i) => (
      <line key={i} x1={x + width - 150} x2={x + width - 50} y1={COUNTER_TOP - 82 + i * 20} y2={COUNTER_TOP - 82 + i * 20} stroke={INK} strokeWidth={4} strokeDasharray="10 10" />
    ))}
    {/* 前面の横線 */}
    <line x1={x + 30} x2={x + width - 30} y1={COUNTER_TOP + 90} y2={COUNTER_TOP + 90} stroke={INK} strokeWidth={4} opacity={0.5} />
  </g>
);

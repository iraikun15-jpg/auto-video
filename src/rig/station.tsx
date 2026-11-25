import React from "react";
import { BG, FLOOR_Y, INK, PROP_LINE } from "./theme";

// 第3話で追加：駅前の背景部品（線画のみ・色は使わない）

const stroke = {
  fill: BG,
  stroke: INK,
  strokeWidth: PROP_LINE,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

/** 駅舎（正面）。x は建物の左端。時計・ひさし・改札つき */
export const Station: React.FC<{ x: number; width?: number; clockAngle?: number }> = ({
  x,
  width = 520,
  clockAngle = 0,
}) => {
  const r = x + width;
  const roofY = FLOOR_Y - 560;
  const eaveY = FLOOR_Y - 360;
  const cx = x + width / 2;
  return (
    <g>
      {/* 時計塔 */}
      <rect x={cx - 85} y={roofY - 190} width={170} height={190} {...stroke} />
      <path d={`M ${cx - 105} ${roofY - 190} L ${cx} ${roofY - 260} L ${cx + 105} ${roofY - 190} Z`} {...stroke} />
      <circle cx={cx} cy={roofY - 95} r={55} {...stroke} />
      <line
        x1={cx}
        y1={roofY - 95}
        x2={cx + Math.sin(clockAngle) * 38}
        y2={roofY - 95 - Math.cos(clockAngle) * 38}
        stroke={INK}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <line x1={cx} y1={roofY - 95} x2={cx - 24} y2={roofY - 95} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      {/* 本体 */}
      <rect x={x} y={roofY} width={width} height={FLOOR_Y - roofY} {...stroke} />
      <rect x={x - 30} y={roofY - 26} width={width + 60} height={30} rx={6} {...stroke} />
      {/* 2階の窓 */}
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={x + 40 + i * ((width - 80) / 4) + 10}
          y={roofY + 50}
          width={(width - 80) / 4 - 20}
          height={90}
          rx={6}
          {...stroke}
          strokeWidth={5}
        />
      ))}
      {/* ひさし */}
      <path
        d={`M ${x - 40} ${eaveY} L ${r + 40} ${eaveY} L ${r + 10} ${eaveY - 40} L ${x - 10} ${eaveY - 40} Z`}
        {...stroke}
      />
      {/* 入口と改札 */}
      <rect x={x + 60} y={eaveY + 40} width={width - 120} height={FLOOR_Y - eaveY - 40} {...stroke} strokeWidth={5} />
      {[0, 1, 2, 3].map((i) => {
        const gx = x + 100 + i * ((width - 200) / 3);
        return (
          <g key={i}>
            <rect x={gx - 16} y={FLOOR_Y - 120} width={32} height={120} rx={5} {...stroke} strokeWidth={5} />
            <line x1={gx - 8} x2={gx + 8} y1={FLOOR_Y - 95} y2={FLOOR_Y - 95} stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
};

/** 街灯。x は柱の位置 */
export const StreetLamp: React.FC<{ x: number; glow?: number }> = ({ x, glow = 0 }) => {
  const top = FLOOR_Y - 640;
  return (
    <g>
      <line x1={x} y1={FLOOR_Y} x2={x} y2={top} stroke={INK} strokeWidth={PROP_LINE + 2} strokeLinecap="round" />
      <path d={`M ${x} ${top} Q ${x} ${top - 40} ${x + 60} ${top - 40}`} fill="none" stroke={INK} strokeWidth={PROP_LINE} strokeLinecap="round" />
      <path d={`M ${x + 30} ${top - 40} L ${x + 90} ${top - 40} L ${x + 76} ${top - 4} L ${x + 44} ${top - 4} Z`} {...stroke} />
      {[-40, 0, 40].map((a) => {
        const t = ((a + 90) * Math.PI) / 180;
        const r0 = 30;
        const r1 = 30 + 26 * glow;
        return glow > 0.05 ? (
          <line
            key={a}
            x1={x + 60 + Math.cos(t) * r0}
            y1={top + Math.sin(t) * r0}
            x2={x + 60 + Math.cos(t) * r1}
            y2={top + Math.sin(t) * r1}
            stroke={INK}
            strokeWidth={5}
            strokeLinecap="round"
          />
        ) : null;
      })}
      <line x1={x - 40} y1={FLOOR_Y} x2={x + 40} y2={FLOOR_Y} stroke={INK} strokeWidth={PROP_LINE + 4} strokeLinecap="round" />
    </g>
  );
};

/** キラッとした光（4方向の短い線）。明るさの演出用 */
export const Sparkle: React.FC<{ x: number; y: number; size?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  size = 30,
  color = INK,
  opacity = 1,
}) => (
  <path
    d={`M ${x} ${y - size} Q ${x} ${y} ${x + size} ${y} Q ${x} ${y} ${x} ${y + size} Q ${x} ${y} ${x - size} ${y} Q ${x} ${y} ${x} ${y - size} Z`}
    fill={color}
    opacity={opacity}
  />
);

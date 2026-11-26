import React from "react";
import { clamp01 } from "../jimmu/paper";
import { KIN, MINCHO, PAPER, SEIDO, SHU, SUMI } from "../jimmu/theme";

// 出雲回の部品
export const BRONZE_NEW = "#B8894A"; // 出土したての青銅
export const SOIL = ["#8A6A48", "#7A5A3C", "#6A4C32", "#5A3F2A"]; // 土の層

/** 銅剣（中細形、上向き。原点は茎の下端） */
export const BronzeSword: React.FC<{ x: number; y: number; s?: number; rot?: number; t?: number; patina?: number }> = ({ x, y, s = 1, rot = 0, t = 1, patina = 0.6 }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={clamp01(t * 2)}>
      <rect x={-5} y={-30} width={10} height={30} rx={3} fill="#5A4A30" />
      <path d="M-10,-30 Q-22,-110 -12,-200 L0,-240 L12,-200 Q22,-110 10,-30Z" fill={BRONZE_NEW} />
      <path d="M-10,-30 Q-22,-110 -12,-200 L0,-240 L12,-200 Q22,-110 10,-30Z" fill={SEIDO} opacity={patina} />
      <path d="M0,-34 L0,-230" stroke="#2F5E58" strokeWidth={3} />
    </g>
  );

/** 銅鐸（つり鐘形、上に鈕） */
export const Dotaku: React.FC<{ x: number; y: number; s?: number; rot?: number; t?: number; glow?: number }> = ({ x, y, s = 1, rot = 0, t = 1, glow = 0 }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s * (0.5 + 0.5 * clamp01(t))})`} opacity={clamp01(t * 2)}>
      {glow > 0 ? <ellipse cx={0} cy={-10} rx={90} ry={110} fill={KIN} opacity={0.3 * glow} /> : null}
      <g filter="url(#paperLow)">
        <path d="M-26,-92 Q0,-130 26,-92 L22,-82 Q0,-112 -22,-82Z" fill={SEIDO} />
        <path d="M-34,-80 L34,-80 L52,60 L-52,60Z" fill={SEIDO} />
      </g>
      {[-50, -20, 10, 40].map((yy) => (
        <path key={yy} d={`M${-34 - (yy + 80) * 0.13},${yy} L${34 + (yy + 80) * 0.13},${yy}`} stroke="#7FB2A8" strokeWidth={3} />
      ))}
      <path d="M-14,-74 L-14,54 M14,-74 L14,54" stroke="#7FB2A8" strokeWidth={2} opacity={0.6} />
    </g>
  );

/** 古代の出雲大社（高い柱の上の社と長い階段）。rise 0〜1 で立ち上がる */
export const TallShrine: React.FC<{ x: number; y: number; s?: number; rise?: number }> = ({ x, y, s = 1, rise = 1 }) => {
  const h = 620 * clamp01(rise);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <g filter="url(#paper)">
        {/* 柱 */}
        {[-90, -30, 30, 90].map((cx) => (
          <rect key={cx} x={cx - 12} y={-h} width={24} height={h} fill="#6B4A2A" />
        ))}
        {/* 長い階段 */}
        <path d={`M110,${-h + 30} L520,0 L470,0 L80,${-h + 60}Z`} fill="#8C6A44" />
        {Array.from({ length: 16 }, (_, i) => {
          const k = (i + 1) / 17;
          const sx = 80 + (500 - 80) * k;
          const sy = -h + 45 + (h - 45) * k;
          return <rect key={i} x={sx - 4} y={sy - 3} width={46} height={6} fill="#5A4030" />;
        })}
        {/* 社殿 */}
        <rect x={-130} y={-h - 120} width={260} height={120} fill="#7A5634" />
        <path d={`M-180,${-h - 110} L0,${-h - 230} L180,${-h - 110} L160,${-h - 96} L0,${-h - 200} L-160,${-h - 96}Z`} fill="#2B2216" />
        <path d={`M-40,${-h - 228} L-90,${-h - 300} M40,${-h - 228} L90,${-h - 300}`} stroke="#2B2216" strokeWidth={14} strokeLinecap="round" />
      </g>
      {/* 大きな注連縄 */}
      <path d={`M-140,${-h - 104} Q0,${-h - 60} 140,${-h - 104}`} fill="none" stroke="#C9AC6A" strokeWidth={22} strokeLinecap="round" />
    </g>
  );
};

/** 天秤（tilt 0 で水平。正で右が下がる） */
export const Balance: React.FC<{ x: number; y: number; tilt: number; left: React.ReactNode; right: React.ReactNode; s?: number }> = ({ x, y, tilt, left, right, s = 1 }) => {
  const a = (tilt * Math.PI) / 180;
  const L = 300;
  const lx = -Math.cos(a) * L;
  const ly = -Math.sin(a) * L;
  const rx = Math.cos(a) * L;
  const ry = Math.sin(a) * L;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <g filter="url(#paperLow)">
        <rect x={-10} y={0} width={20} height={300} fill="#5A4030" />
        <rect x={-90} y={290} width={180} height={24} rx={6} fill="#5A4030" />
        <path d={`M${lx},${ly} L${rx},${ry}`} stroke="#5A4030" strokeWidth={14} strokeLinecap="round" />
        <circle r={18} fill={KIN} />
      </g>
      {[
        [lx, ly, left],
        [rx, ry, right],
      ].map(([px, py, node], i) => (
        <g key={i} transform={`translate(${px as number},${py as number})`}>
          <path d="M0,0 L-70,120 M0,0 L70,120" stroke="#5A4030" strokeWidth={4} />
          <path d="M-90,120 Q0,170 90,120Z" fill="#7A5634" />
          <g transform="translate(0,110)">{node as React.ReactNode}</g>
        </g>
      ))}
    </g>
  );
};

/** 勢力の円（地図の上に重ねる半透明の大きな円＋名札） */
export const PowerCircle: React.FC<{ x: number; y: number; r: number; color: string; name: string; t: number }> = ({ x, y, r, color, name, t }) =>
  t <= 0 ? null : (
    <g opacity={clamp01(t * 2)}>
      <circle cx={x} cy={y} r={r * clamp01(t)} fill={color} opacity={0.35} />
      <circle cx={x} cy={y} r={r * clamp01(t)} fill="none" stroke={color} strokeWidth={8} strokeDasharray="20 12" />
      <g transform={`translate(${x},${y})`}>
        <rect x={-110} y={-48} width={220} height={96} rx={10} fill={color} filter="url(#paperLow)" />
        <text y={24} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={66} fill={PAPER}>
          {name}
        </text>
      </g>
    </g>
  );

export { SEIDO, SHU, SUMI, KIN, PAPER };

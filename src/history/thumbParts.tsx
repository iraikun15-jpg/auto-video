/**
 * サムネイル用の装飾（「AIっぽさ」「平坦さ」を消すための部品）
 *  - PunchText: 袋文字（中の色＋太い墨フチ＋外側の白フチ＋濃い影）、少し傾けて末尾の「？」「！」を大きく
 *  - FocusLines: うすい集中線（緊張感）
 *  - Vignette: 四隅を暗くする（奥行き）
 *  - Shadowed / Glow: 図形部品に濃い影・発光をつける
 * 静止画だけで使う（動画の本編には使わない）。
 */
import React from "react";
import { random } from "remotion";
import { MINCHO } from "../jimmu/theme";

const PUNCT = /[？！?!]+$/;

/** 袋文字の1行。fill はグラデーションの id か色 */
const PunchLine: React.FC<{ text: string; x: number; y: number; size: number; fill: string; id: string }> = ({ text, x, y, size, fill, id }) => {
  const m = PUNCT.exec(text);
  const body = m ? text.slice(0, m.index) : text;
  const tail = m ? m[0] : "";
  const spans = (
    <>
      {body}
      {tail ? <tspan fontSize={size * 1.2}>{tail}</tspan> : null}
    </>
  );
  const common = { x, y, textAnchor: "middle" as const, fontFamily: MINCHO, fontWeight: 800, fontSize: size, strokeLinejoin: "round" as const };
  return (
    <g>
      {/* 濃い影（右下にずらした墨） */}
      <text {...common} x={x + size * 0.07} y={y + size * 0.09} fill="#1a120a" stroke="#1a120a" strokeWidth={size * 0.34} opacity={0.55} filter={`url(#${id}-blur)`}>
        {spans}
      </text>
      {/* 外側の白フチ */}
      <text {...common} fill="#FFF8E6" stroke="#FFF8E6" strokeWidth={size * 0.3}>
        {spans}
      </text>
      {/* 太い墨フチ＋中の色 */}
      <text {...common} fill={fill} stroke="#1E1712" strokeWidth={size * 0.16} paintOrder="stroke">
        {spans}
      </text>
    </g>
  );
};

/** 袋文字（1〜2行）。全体を -2度傾ける。1行目は金、2行目は朱（強調）が既定 */
export const PunchText: React.FC<{
  lines: string[];
  x: number;
  y: number; // 1行目のベースライン
  sizes: number[];
  gap?: number;
  id?: string;
  colors?: [string, string][]; // 行ごとのグラデーション（上, 下）
  tilt?: number;
}> = ({ lines, x, y, sizes, gap = 1.22, id = "pt", colors = [["#FFE9A8", "#E0A93A"], ["#FFD3C2", "#D2452D"]], tilt = -2 }) => {
  let yy = y;
  return (
    <g transform={`rotate(${tilt},${x},${y})`}>
      <defs>
        <filter id={`${id}-blur`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        {lines.map((_, i) => {
          const [a, b] = colors[i % colors.length];
          return (
            <linearGradient key={i} id={`${id}-g${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0.15" stopColor={a} />
              <stop offset="0.9" stopColor={b} />
            </linearGradient>
          );
        })}
      </defs>
      {lines.map((l, i) => {
        const size = sizes[i] ?? sizes[sizes.length - 1];
        if (i > 0) yy += size * gap;
        return <PunchLine key={i} text={l} x={x} y={yy} size={size} fill={`url(#${id}-g${i})`} id={id} />;
      })}
    </g>
  );
};

/** うすい集中線（cx, cy に向かって） */
export const FocusLines: React.FC<{ cx: number; cy: number; W: number; H: number; color?: string; opacity?: number; inner?: number }> = ({
  cx,
  cy,
  W,
  H,
  color = "#3a2410",
  opacity = 0.12,
  inner = 0.38,
}) => {
  const R = Math.hypot(W, H);
  const r0 = Math.min(W, H) * inner;
  return (
    <g opacity={opacity} fill={color}>
      {Array.from({ length: 72 }, (_, i) => {
        const a = ((i + random(`fl${i}`) * 0.7) / 72) * Math.PI * 2;
        const w = (0.004 + random(`flw${i}`) * 0.01) * Math.PI;
        const r = r0 + random(`flr${i}`) * r0 * 0.6;
        const p = (rr: number, d: number) => `${cx + Math.cos(a + d) * rr},${cy + Math.sin(a + d) * rr}`;
        return <polygon key={i} points={`${p(r, 0)} ${p(R, w)} ${p(R, -w)}`} />;
      })}
    </g>
  );
};

/** 四隅を暗くする（周辺減光） */
export const Vignette: React.FC<{ W: number; H: number; id?: string; strength?: number }> = ({ W, H, id = "thv", strength = 0.5 }) => (
  <>
    <radialGradient id={id} cx="50%" cy="45%" r="72%">
      <stop offset="55%" stopColor="#000" stopOpacity={0} />
      <stop offset="100%" stopColor="#2a1708" stopOpacity={strength} />
    </radialGradient>
    <rect width={W} height={H} fill={`url(#${id})`} />
  </>
);

/** 図形部品に濃い影をつける */
export const Shadowed: React.FC<{ children: React.ReactNode; dx?: number; dy?: number; blur?: number }> = ({ children, dx = 10, dy = 16, blur = 6 }) => (
  <g style={{ filter: `drop-shadow(${dx}px ${dy}px ${blur}px rgba(30,18,8,0.55))` }}>{children}</g>
);

/** 発光（日輪・光る剣など） */
export const Glow: React.FC<{ children: React.ReactNode; color?: string; r?: number }> = ({ children, color = "#F5C86A", r = 28 }) => (
  <g style={{ filter: `drop-shadow(0 0 ${r}px ${color})` }}>{children}</g>
);

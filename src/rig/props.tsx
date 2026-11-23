import React from "react";
import { random } from "remotion";
import { BG, FLOOR_Y, INK, PROP_LINE } from "./theme";

const stroke = {
  fill: BG,
  stroke: INK,
  strokeWidth: PROP_LINE,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

export const Floor: React.FC<{ x1?: number; x2?: number; y?: number }> = ({
  x1 = -20,
  x2 = 1100,
  y = FLOOR_Y,
}) => <line x1={x1} y1={y} x2={x2} y2={y} stroke={INK} strokeWidth={PROP_LINE} />;

/** デスク＋モニター（第1話と同じ構成）。x は天板の左端 */
export const Desk: React.FC<{ x: number; width?: number }> = ({ x, width = 440 }) => {
  const top = FLOOR_Y - 190;
  const r = x + width;
  return (
    <g>
      {/* モニター */}
      <rect x={r - 245} y={top - 190} width={200} height={140} rx={10} {...stroke} />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={r - 222}
          x2={r - (i % 2 ? 110 : 75)}
          y1={top - 160 + i * 26}
          y2={top - 160 + i * 26}
          stroke={INK}
          strokeWidth={4}
        />
      ))}
      <line x1={r - 145} y1={top - 50} x2={r - 145} y2={top - 10} stroke={INK} strokeWidth={PROP_LINE} />
      <line x1={r - 185} y1={top - 8} x2={r - 105} y2={top - 8} stroke={INK} strokeWidth={PROP_LINE} />
      {/* キーボード */}
      <rect x={x + 40} y={top - 14} width={120} height={10} rx={3} {...stroke} strokeWidth={5} />
      {/* 天板と脚 */}
      <rect x={x} y={top} width={width} height={22} rx={5} {...stroke} />
      <line x1={x + 25} y1={top + 22} x2={x + 25} y2={FLOOR_Y} stroke={INK} strokeWidth={PROP_LINE} />
      <line x1={r - 25} y1={top + 22} x2={r - 25} y2={FLOOR_Y} stroke={INK} strokeWidth={PROP_LINE} />
      {/* 引き出し */}
      <rect x={r - 150} y={top + 22} width={125} height={80} {...stroke} />
      <line x1={r - 102} y1={top + 62} x2={r - 72} y2={top + 62} stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** 椅子（右向きに座る用）。x は座面の左端 */
export const Chair: React.FC<{ x: number; tilt?: number }> = ({ x, tilt = 0 }) => {
  const seat = FLOOR_Y - 128;
  return (
    <g transform={`rotate(${tilt} ${x + 55} ${FLOOR_Y})`}>
      <line x1={x + 4} y1={seat} x2={x - 6} y2={seat - 170} stroke={INK} strokeWidth={PROP_LINE} strokeLinecap="round" />
      <line x1={x} y1={seat} x2={x + 110} y2={seat} stroke={INK} strokeWidth={PROP_LINE + 2} strokeLinecap="round" />
      <line x1={x + 8} y1={seat} x2={x + 4} y2={FLOOR_Y} stroke={INK} strokeWidth={PROP_LINE} />
      <line x1={x + 100} y1={seat} x2={x + 104} y2={FLOOR_Y} stroke={INK} strokeWidth={PROP_LINE} />
    </g>
  );
};

/** プリンター（第2話で追加）。下段に用紙のストック棚 */
export const Printer: React.FC<{
  x: number;
  shelfOpen?: number; // 0〜1 棚の扉の開き具合
  paperInShelf?: boolean;
  blink?: boolean; // ランプ点灯
}> = ({ x, shelfOpen = 0, paperInShelf = true, blink = false }) => {
  const w = 210;
  const baseTop = FLOOR_Y - 150; // 棚の天板
  const pTop = baseTop - 150; // プリンター本体の上
  return (
    <g>
      {/* 棚 */}
      <rect x={x} y={baseTop} width={w} height={150} {...stroke} />
      {paperInShelf ? (
        <g>
          <rect x={x + 40} y={FLOOR_Y - 60} width={130} height={46} {...stroke} strokeWidth={5} />
          <line x1={x + 40} x2={x + 170} y1={FLOOR_Y - 45} y2={FLOOR_Y - 45} stroke={INK} strokeWidth={3} />
          <line x1={x + 40} x2={x + 170} y1={FLOOR_Y - 30} y2={FLOOR_Y - 30} stroke={INK} strokeWidth={3} />
        </g>
      ) : null}
      {/* 棚の扉（開くと細くなる） */}
      <rect
        x={x}
        y={baseTop}
        width={w * (1 - shelfOpen * 0.88)}
        height={150}
        {...stroke}
      />
      <line
        x1={x + w * (1 - shelfOpen * 0.88) - 22}
        x2={x + w * (1 - shelfOpen * 0.88) - 22}
        y1={baseTop + 55}
        y2={baseTop + 95}
        stroke={INK}
        strokeWidth={5}
        opacity={shelfOpen > 0.7 ? 0 : 1}
      />
      {/* 本体 */}
      <rect x={x + 5} y={pTop} width={w - 10} height={150} rx={14} {...stroke} />
      {/* 給紙トレイ（空） */}
      <path
        d={`M ${x + 30} ${pTop} L ${x + 50} ${pTop - 55} L ${x + w - 50} ${pTop - 55} L ${x + w - 30} ${pTop}`}
        {...stroke}
      />
      {/* 排紙口 */}
      <line x1={x + 40} x2={x + w - 40} y1={pTop + 70} y2={pTop + 70} stroke={INK} strokeWidth={PROP_LINE} strokeLinecap="round" />
      {/* 操作パネル */}
      <rect x={x + w - 75} y={pTop + 22} width={45} height={24} rx={4} {...stroke} strokeWidth={4} />
      <circle cx={x + 32} cy={pTop + 34} r={9} fill={blink ? INK : BG} stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** コピー用紙の束（上司が持ち去る） */
export const PaperReam: React.FC<{ x: number; y: number; rotate?: number }> = ({
  x,
  y,
  rotate = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <rect x={-65} y={-23} width={130} height={46} {...stroke} strokeWidth={5} />
    <line x1={-65} x2={65} y1={-8} y2={-8} stroke={INK} strokeWidth={3} />
    <line x1={-65} x2={65} y1={7} y2={7} stroke={INK} strokeWidth={3} />
  </g>
);

/** ハート（鼓動） */
export const Heart: React.FC<{ x: number; y: number; size: number; fill?: string }> = ({
  x,
  y,
  size,
  fill = BG,
}) => {
  const s = size / 100;
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M 0 35 C -60 -5 -55 -55 -25 -55 C -10 -55 0 -42 0 -30 C 0 -42 10 -55 25 -55 C 55 -55 60 -5 0 35 Z"
      fill={fill}
      stroke={INK}
      strokeWidth={9 / s}
      strokeLinejoin="round"
    />
  );
};

/** 汗のしずく（向き付き） */
export const Drop: React.FC<{ x: number; y: number; angle?: number; size?: number; opacity?: number }> = ({
  x,
  y,
  angle = 0,
  size = 1,
  opacity = 1,
}) => (
  <path
    transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}
    d="M 0 -16 C 6 -6 11 1 11 7 A 11 11 0 0 1 -11 7 C -11 1 -6 -6 0 -16 Z"
    fill={BG}
    stroke={INK}
    strokeWidth={4 / size}
    opacity={opacity}
  />
);

/** 頭から汗が飛び散るパーティクル（決定的） */
export const SweatSpray: React.FC<{
  frame: number;
  x: number;
  y: number;
  every?: number; // 何フレームごとに出すか
  power?: number;
  seed?: string;
}> = ({ frame, x, y, every = 5, power = 1, seed = "sweat" }) => {
  const LIFE = 26;
  const drops: React.ReactNode[] = [];
  for (let born = Math.max(0, frame - LIFE); born <= frame; born++) {
    if (born % every !== 0) continue;
    const age = frame - born;
    const side = random(`${seed}-s-${born}`) > 0.5 ? 1 : -1;
    const vx = side * (5 + random(`${seed}-x-${born}`) * 7) * power;
    const vy = -(9 + random(`${seed}-y-${born}`) * 7) * power;
    const g = 1.1;
    const px = x + side * 30 + vx * age;
    const py = y - 25 + vy * age + 0.5 * g * age * age;
    const ang = (Math.atan2(vy + g * age, vx) * 180) / Math.PI + 90 + 180;
    drops.push(
      <Drop
        key={born}
        x={px}
        y={py}
        angle={ang}
        size={1.3 + random(`${seed}-z-${born}`) * 0.7}
        opacity={1 - age / LIFE}
      />,
    );
  }
  return <g>{drops}</g>;
};

/** 驚きの効果線（頭の周り） */
export const ShockLines: React.FC<{ x: number; y: number; r?: number; opacity?: number }> = ({
  x,
  y,
  r = 70,
  opacity = 1,
}) => (
  <g opacity={opacity} stroke={INK} strokeWidth={8} strokeLinecap="round">
    {[-150, -115, -80, -45, -10].map((a) => {
      const t = (a * Math.PI) / 180;
      return (
        <line
          key={a}
          x1={x + Math.cos(t) * r}
          y1={y + Math.sin(t) * r}
          x2={x + Math.cos(t) * (r + 40)}
          y2={y + Math.sin(t) * (r + 40)}
        />
      );
    })}
  </g>
);

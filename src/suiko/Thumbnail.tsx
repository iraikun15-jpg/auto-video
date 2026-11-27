import React from "react";
import { Stage, Stamp } from "../jimmu/paper";
import { Person, Sun } from "../jimmu/figures";
import { KIN, MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";

/** サムネイル：上に赤判子「お飾り？」、中央に操り糸のついた玉座の女帝、下に大きなタイトル＋推古の影 */
export const SuikoThumbnail: React.FC = () => {
  const big = (s: string, y: number, size: number, x = 450) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="suiko">
      <Sun x={540} y={760} r={230} color="#E7B9C1" />
      <g filter="url(#paperLow)">
        <rect x={330} y={1150} width={420} height={60} fill="#5A3B20" />
        <rect x={360} y={1120} width={360} height={40} fill={KIN} />
        <rect x={340} y={640} width={14} height={500} fill={SHU} />
        <rect x={726} y={640} width={14} height={500} fill={SHU} />
        <path d="M320,650 L540,560 L760,650Z" fill="#2B2216" />
      </g>
      <Person kind="suiko" x={540} y={1130} scale={0.68} arm={40} outline outlineColor={KIN} />
      {[
        [380, 380, 470, 960],
        [470, 380, 510, 830],
        [610, 380, 570, 830],
        [700, 380, 610, 960],
      ].map(([a, b, c, d], i) => (
        <path key={i} d={`M${a},${b} L${c},${d}`} stroke="#8C7A5A" strokeWidth={4} />
      ))}
      <rect x={340} y={360} width={400} height={26} rx={10} fill="#5A3B20" />
      <Sun x={950} y={1400} r={100} color="#E7B9C1" />
      <Person kind="suiko" x={950} y={1850} scale={0.72} flip arm={60} outline outlineColor={KIN} />
      {big("推古天皇は", 1420, 130)}
      {big("お飾りだったのか", 1600, 100)}
      <Stamp x={540} y={205} text="お飾り？" size={140} t={1} rot={-5} />
    </Stage>
  );
};

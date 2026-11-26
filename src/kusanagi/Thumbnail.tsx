import React from "react";
import { Stage, Stamp } from "../jimmu/paper";
import { KIN, MINCHO, PAPER } from "../jimmu/theme";
import { GlowSword, NIGHT, Orochi } from "./parts";

/** サムネイル：上に赤判子「実在？」、中央に八岐大蛇と光る剣、下に大きなタイトル */
export const KusanagiThumbnail: React.FC = () => {
  const big = (s: string, y: number, size: number, fill: string) => (
    <text x={540} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={fill} stroke={NIGHT} strokeWidth={24} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="kusanagi">
      <Orochi x={540} y={1060} s={0.92} f={40} />
      <GlowSword x={540} y={1330} s={1.25} glow={1} />
      {big("草薙剣は", 1520, 150, KIN)}
      {big("本当にあったのか", 1700, 112, PAPER)}
      <Stamp x={540} y={230} text="実在？" size={150} t={1} rot={-5} />
    </Stage>
  );
};

import React from "react";
import { Stage, Stamp, Token } from "../jimmu/paper";
import { Person, Sun } from "../jimmu/figures";
import { KIN, MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";

/** サムネイル：上に赤判子（提案「反乱者？」）、中央に瀬田橋の対陣、下に大きなタイトル＋天武の影 */
export const TenmuThumbnail: React.FC = () => {
  const big = (s: string, y: number, size: number, x = 450) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="tenmu">
      {/* 瀬田川と橋、両軍の駒 */}
      <g filter="url(#paperLow)">
        <rect x={470} y={360} width={150} height={820} fill="#3E6688" />
        <rect x={400} y={720} width={290} height={64} fill="#7A5634" />
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Token key={`a${i}`} x={760 + (i % 2) * 120} y={460 + Math.floor(i / 2) * 230} kind="jimmu" r={48} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Token key={`o${i}`} x={330 - (i % 2) * 120} y={500 + Math.floor(i / 2) * 230} kind="enemy" r={46} />
      ))}
      <Sun x={950} y={1390} r={100} />
      <Person kind="tenmu" x={950} y={1850} scale={0.74} flip arm={60} outline outlineColor={KIN} />
      {big("天武天皇は", 1370, 120)}
      {big("壬申の乱に", 1520, 110)}
      {big("負けていたら？", 1670, 104)}
      <Stamp x={540} y={205} text="反乱者？" size={140} t={1} rot={-5} color={SHU} />
    </Stage>
  );
};

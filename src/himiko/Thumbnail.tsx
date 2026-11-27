import React from "react";
import { Stage, Stamp } from "../jimmu/paper";
import { Person, Sun } from "../jimmu/figures";
import { KIN, MINCHO, PAPER, SUMI } from "../jimmu/theme";
import { Book } from "./parts";

/** サムネイル：上に赤判子「実在？」、中央に『魏志倭人伝』、下に大きなタイトル＋卑弥呼の影 */
export const HimikoThumbnail: React.FC = () => {
  const big = (s: string, y: number, size: number, x = 450) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="himiko">
      <Book x={470} y={800} s={1.0} glow={1} />
      <Sun x={940} y={1380} r={110} color="#C9A86A" />
      <Person kind="himiko" x={940} y={1860} scale={0.78} arm={120} flip outline outlineColor={KIN} />
      {big("卑弥呼は", 1420, 150)}
      {big("実在したのか", 1600, 120)}
      <Stamp x={540} y={205} text="実在？" size={150} t={1} rot={-5} />
    </Stage>
  );
};

import React from "react";
import { Stage, Stamp } from "../jimmu/paper";
import { Person, Sun } from "../jimmu/figures";
import { MINCHO, PAPER, SUMI } from "../jimmu/theme";
import { ANDON, Label, MIWA, YamatoMap } from "./yamato";

/** サムネイル：上に赤判子「初代？」、中央に大和（三輪山・行燈山古墳）、下に大きなタイトル＋崇神の影 */
export const SujinThumbnail: React.FC = () => {
  const big = (s: string, y: number, size: number, x = 470) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="sujin">
      <YamatoMap f={0} />
      <Label x={MIWA[0] + 120} y={MIWA[1] + 160} text="三輪山" size={44} />
      <Label x={ANDON[0] - 150} y={ANDON[1] + 40} text="行燈山古墳" size={40} />
      <Sun x={950} y={1380} r={100} color="#B79AC9" />
      <Person kind="jimmu" x={110} y={1840} scale={0.46} opacity={0.4} />
      <Person kind="sujin" x={950} y={1850} scale={0.76} flip arm={60} />
      {big("本当の初代天皇は", 1370, 90, 450)}
      {big("崇神？", 1580, 180, 450)}
      <Stamp x={540} y={205} text="初代？" size={150} t={1} rot={-5} />
    </Stage>
  );
};

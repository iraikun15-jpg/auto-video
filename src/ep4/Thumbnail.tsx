import React from "react";
import { Floor } from "../rig/props";
import { solve, StickFigure } from "../rig/StickFigure";
import { Wallet } from "../rig/wallet";
import { BG, FONT, INK } from "../rig/theme";
import { Canvas } from "./common";
import { HOLD_WALLET } from "./Seg1";

/** サムネイル：台本のフック「給料日前、財布の中身が3ケタ」 */
export const Ep4Thumbnail: React.FC = () => {
  const hero = { ...HOLD_WALLET, x: 440 };
  const j = solve(hero);
  const text = (s: string, y: number, size: number) => (
    <text x={540} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={INK} stroke={BG} strokeWidth={16} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Canvas>
      {text("給料日前、", 230, 150)}
      {text("財布の中身が", 410, 140)}
      {text("3ケタ", 860, 420)}
      <Floor />
      <StickFigure pose={hero} />
      <Wallet x={j.frontHand[0] + 14} y={j.frontHand[1] + 10} open={1} scale={1.4} coins={3} />
    </Canvas>
  );
};

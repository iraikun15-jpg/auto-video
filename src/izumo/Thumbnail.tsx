import React from "react";
import { Stage, Stamp } from "../jimmu/paper";
import { Person, Sun } from "../jimmu/figures";
import { MINCHO, PAPER, SUMI } from "../jimmu/theme";
import { BronzeSword, SOIL } from "./parts";

/** サムネイル：上に赤判子「神話？」、中央にずらりと並ぶ銅剣、下に大きなタイトル＋大国主の影 */
export const IzumoThumbnail: React.FC = () => {
  const big = (s: string, y: number, size: number, x = 450) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="izumo">
      <g filter="url(#paper)">
        <rect x={60} y={360} width={960} height={840} rx={10} fill={SOIL[3]} />
      </g>
      <rect x={80} y={380} width={920} height={800} fill={SOIL[2]} />
      {[0, 1, 2].map((r) =>
        Array.from({ length: 22 }, (_, i) => (
          <BronzeSword key={`${r}-${i}`} x={110 + i * 41} y={520 + r * 260 + (i % 2 ? -110 : 110)} s={0.48} rot={i % 2 ? 180 : 0} t={1} />
        )),
      )}
      <text x={540} y={1150} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={86} fill="#7FC2B6" stroke={SUMI} strokeWidth={14} paintOrder="stroke">
        銅剣358本
      </text>
      <Sun x={950} y={1390} r={100} />
      <Person kind="okuninushi" x={950} y={1850} scale={0.74} flip arm={60} outline outlineColor={SUMI} />
      {big("出雲の国譲りは", 1400, 104)}
      {big("本当にあったのか", 1560, 100)}
      <Stamp x={540} y={205} text="神話？" size={150} t={1} rot={-5} />
    </Stage>
  );
};

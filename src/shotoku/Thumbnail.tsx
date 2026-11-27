import React from "react";
import { Stage, Stamp } from "../jimmu/paper";
import { Sun } from "../jimmu/figures";
import { KIN, MINCHO, PAPER, SUMI } from "../jimmu/theme";
import { Horyuji, Taishi } from "./parts";

/** サムネイル：上に赤判子「実在？」、中央に法隆寺（五重塔と金堂）、下に大きなタイトル＋太子の影 */
export const ShotokuThumbnail: React.FC = () => {
  const big = (s: string, y: number, size: number, x = 420) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="shotoku">
      <Sun x={540} y={760} r={230} color="#E8C77A" />
      <Horyuji x={540} y={1240} s={0.98} />
      <rect x={0} y={1240} width={1080} height={680} fill="#CBBE9F" opacity={0.45} />
      <Sun x={985} y={1440} r={100} color="#E8C77A" />
      <Taishi x={985} y={1880} s={0.64} flip arm={20} outlineColor={KIN} />
      {big("聖徳太子は", 1450, 130)}
      {big("実在したのか", 1630, 112)}
      <Stamp x={540} y={205} text="実在？" size={150} t={1} rot={-5} />
    </Stage>
  );
};

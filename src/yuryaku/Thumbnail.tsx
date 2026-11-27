import React from "react";
import { Stage, Stamp } from "../jimmu/paper";
import { Person, Sun } from "../jimmu/figures";
import { MINCHO, PAPER, SUMI } from "../jimmu/theme";
import { IronSword, MEI_BACK, OKIMI_AT, XRAY, XRAY_DARK } from "./parts";

/** サムネイル：上に赤判子「実在！」、中央に X線で銘文が浮かぶ鉄剣、下に大きなタイトル＋雄略の影 */
export const YuryakuThumbnail: React.FC = () => {
  const big = (s: string, y: number, size: number, x = 450) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  const chars = MEI_BACK.slice(OKIMI_AT - 1, OKIMI_AT + 8);
  return (
    <Stage peel={false} look="yuryaku">
      <g filter="url(#paper)">
        <rect x={290} y={330} width={500} height={900} rx={10} fill={XRAY_DARK} />
      </g>
      <rect x={298} y={338} width={484} height={884} rx={8} fill="none" stroke={XRAY} strokeWidth={3} opacity={0.6} />
      <IronSword x={540} y={1215} len={860} xray={1} chars={chars} highlight={[1, 2, 3, 4, 5, 6, 7]} reveal={1} glow={1} />
      <Sun x={950} y={1380} r={100} />
      <Person kind="yuryaku" x={950} y={1850} scale={0.76} flip arm={60} />
      {big("雄略天皇は", 1400, 130)}
      {big("実在したのか", 1580, 120)}
      <Stamp x={540} y={205} text="実在！" size={150} t={1} rot={-5} />
    </Stage>
  );
};

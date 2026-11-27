import React from "react";
import { project } from "../jimmu/geo";
import { MapLayer, PlaceLabel, Route, Stage, Stamp, Tag } from "../jimmu/paper";
import { Person, Sun, Swan } from "../jimmu/figures";
import { MINCHO, PAPER, SUMI } from "../jimmu/theme";
import { CAM_ALL, LANDS_ALL, PL, ROUTE_EAST2, ROUTE_WEST } from "./geo";
import { Kasumi } from "./Segs";

/** サムネイル：上に「実在？」、中央に西征・東征ルート地図、下に大きなタイトル＋ヤマトタケルの影 */
export const TakeruThumbnail: React.FC = () => {
  const cam = CAM_ALL;
  const ku = project(cam, PL.kumaso);
  const to = project(cam, PL.togoku);
  const big = (s: string, y: number, size: number) => (
    <text x={470} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="takeru">
      <MapLayer cam={cam} lands={LANDS_ALL} />
      <Kasumi f={0} />
      <Route cam={cam} route={ROUTE_WEST} t={1} color={SUMI} dashed width={10} />
      <Route cam={cam} route={ROUTE_EAST2} t={1} dashed width={10} />
      <PlaceLabel x={ku[0]} y={ku[1]} text="西征" dy={-110} size={40} />
      <PlaceLabel x={to[0]} y={to[1]} text="東征" dx={-10} dy={120} size={40} />
      <Sun x={930} y={1360} r={100} />
      <Swan x={210} y={1260} scale={0.62} flap={0.6} flip />
      <Person kind="takeru" x={930} y={1830} scale={0.78} arm={100} flip />
      {big("ヤマトタケルは", 1350, 104)}
      {big("実在したのか", 1490, 104)}
      <Stamp x={540} y={205} text="実在？" size={150} t={1} rot={-5} />
      <Tag x={440} y={1660} text="西征・東征を検証" size={56} t={1} rot={-1} />
    </Stage>
  );
};

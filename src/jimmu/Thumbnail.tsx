import React from "react";
import { CAM_WEST, PLACES, project, ROUTE_EAST } from "./geo";
import { MapLayer, PlaceLabel, Route, Stage, Stamp, Tag, Token } from "./paper";
import { Person, Sun } from "./figures";
import { MINCHO, PAPER, SUMI } from "./theme";

/** サムネイル：タイトル「神武天皇は実在したのか」 */
export const JimmuThumbnail: React.FC = () => {
  const cam = CAM_WEST;
  const hy = project(cam, PLACES.hyuga);
  const ya = project(cam, PLACES.yamato);
  const big = (s: string, y: number, size: number) => (
    <text x={540} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage>
      <MapLayer cam={cam} />
      <Route cam={cam} route={ROUTE_EAST} t={1} dashed />
      <PlaceLabel x={hy[0]} y={hy[1]} text="日向" dx={-62} dy={-10} />
      <PlaceLabel x={ya[0]} y={ya[1]} text="大和" dx={66} dy={20} />
      <Token x={hy[0]} y={hy[1]} kind="jimmu" r={30} />
      <Token x={ya[0]} y={ya[1]} kind="enemy" r={30} />
      <Sun x={250} y={1340} r={95} />
      <Person kind="jimmu" x={250} y={1800} scale={0.82} arm={50} />
      <Person kind="nagasune" x={840} y={1800} scale={0.82} flip arm={60} />
      {big("神武天皇は", 1330, 120)}
      {big("実在したのか", 1480, 120)}
      <Stamp x={540} y={205} text="実在？" size={150} t={1} rot={-5} />
      <Tag x={540} y={1650} text="記紀の東征を検証" size={56} t={1} rot={-1} />
    </Stage>
  );
};

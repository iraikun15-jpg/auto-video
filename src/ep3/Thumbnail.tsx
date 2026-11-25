import React from "react";
import { shiftPose } from "../rig/pose";
import { Floor } from "../rig/props";
import { Station, StreetLamp } from "../rig/station";
import { Face, Friend, StickFigure } from "../rig/StickFigure";
import { BG, FONT, FRIEND_BLUE, INK } from "../rig/theme";
import { Canvas, HERO_STAND } from "./common";
import { STATION_X, wave } from "./Seg1";

/** サムネイル：台本のフック「大人の『今度ご飯行こう』は、ほぼ実現しません」 */
export const Ep3Thumbnail: React.FC = () => {
  const friend = wave({ ...HERO_STAND, x: 810 }, 1.2);
  const hero = shiftPose(wave({ ...HERO_STAND, x: 290 }, 0.4), {});
  const text = (s: string, y: number, size: number, color: string) => (
    <text x={540} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={color} stroke={BG} strokeWidth={16} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Canvas>
      <Station x={STATION_X} width={500} clockAngle={2.3} />
      <StreetLamp x={70} />
      <Floor />
      <Friend pose={friend} facing={-1} />
      <Face pose={friend} facing={-1} color={FRIEND_BLUE} />
      <StickFigure pose={hero} />
      <Face pose={hero} />
      {text("大人の", 190, 140, INK)}
      {text("『今度ご飯行こう』", 350, 112, FRIEND_BLUE)}
      {text("は、ほぼ", 500, 140, INK)}
      {text("実現しません", 650, 140, INK)}
    </Canvas>
  );
};

import React from "react";
import { shiftPose } from "../rig/pose";
import { Drop, Heart, ShockLines } from "../rig/props";
import { Boss, solve, StickFigure } from "../rig/StickFigure";
import { BG, BOSS_RED, FONT, INK } from "../rig/theme";
import { BOSS_STAND, Canvas, HERO_FROZEN, Office } from "./common";

/** サムネイル：台本のフック「上司の『ちょっといい？』が一番怖い」 */
export const Ep2Thumbnail: React.FC = () => {
  const hero = HERO_FROZEN;
  const j = solve(hero);
  const boss = shiftPose(BOSS_STAND, { torso: 12, head: 8, frontArm: 70, frontFore: 8 });
  const text = (s: string, y: number, size: number, color: string) => (
    <text
      x={540}
      y={y}
      textAnchor="middle"
      fontFamily={FONT}
      fontWeight={900}
      fontSize={size}
      fill={color}
      stroke={BG}
      strokeWidth={16}
      paintOrder="stroke"
    >
      {s}
    </text>
  );
  return (
    <Canvas>
      <Office />
      <StickFigure
        pose={{ ...BOSS_STAND, x: 160, y: 1500 - 256 * 1.75, torso: 10, frontArm: 75, frontFore: 10 }}
        scale={1.75}
        tie
        silhouette
        opacity={0.2}
        lineWidth={17}
      />
      <Boss pose={boss} />
      <StickFigure pose={hero} />
      <Heart x={j.chest[0] + 8} y={j.chest[1] + 4} size={110} />
      <ShockLines x={j.head[0]} y={j.head[1]} />
      <Drop x={j.head[0] + 70} y={j.head[1] - 30} size={1.6} angle={20} />
      <Drop x={j.head[0] - 75} y={j.head[1] - 10} size={1.4} angle={-25} />
      {text("上司の", 330, 170, INK)}
      {text("『ちょっといい？』", 560, 118, BOSS_RED)}
      {text("が一番怖い", 790, 175, INK)}
    </Canvas>
  );
};

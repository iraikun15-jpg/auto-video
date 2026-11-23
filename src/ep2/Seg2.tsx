import React from "react";
import { Easing } from "remotion";
import { jitter, poseAt, shiftPose, track } from "../rig/pose";
import { Heart, SweatSpray } from "../rig/props";
import { StickFigure, solve } from "../rig/StickFigure";
import { FONT, INK } from "../rig/theme";
import {
  Canvas,
  HERO_FROZEN,
  HERO_HALF,
  Office,
  heartbeat,
  makeBeats,
  useSegFrame,
} from "./common";

const BEATS = makeBeats(4, 300, 17, 9);

/** 鼓動の波紋（胸から左右に広がる弧） */
export const BeatRings: React.FC<{ frame: number; beats: number[]; x: number; y: number; power?: number }> = ({
  frame,
  beats,
  x,
  y,
  power = 1,
}) => (
  <g fill="none" stroke={INK} strokeLinecap="round">
    {beats
      .filter((b) => frame >= b && frame < b + 12)
      .map((b) => {
        const t = (frame - b) / 12;
        const r = (70 + t * 120) * power;
        return [-1, 1].map((side) => (
          <path
            key={`${b}-${side}`}
            d={`M ${x + side * r * 0.5} ${y - r * 0.85} Q ${x + side * r} ${y} ${x + side * r * 0.5} ${y + r * 0.85}`}
            strokeWidth={9 * (1 - t) + 2}
            opacity={1 - t}
          />
        ));
      })}
  </g>
);

/** 頭の上のどんより線 */
export const GloomLines: React.FC<{ x: number; y: number; frame: number; opacity: number }> = ({
  x,
  y,
  frame,
  opacity,
}) => (
  <g opacity={opacity} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round">
    {[-50, 0, 50].map((dx, i) => {
      const o = Math.sin(frame * 0.25 + i) * 6;
      return (
        <path
          key={dx}
          d={`M ${x + dx} ${y - 110} q ${10 + o} 18 0 36 q ${-10 - o} 18 0 36 q ${10 + o} 18 0 36`}
        />
      );
    })}
  </g>
);

/** seg2 3〜13秒：心臓バクバク・汗・半分立ちかけ・頭上に「終わった」 */
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const pulse = heartbeat(f, BEATS);

  // 座ったまま固まる→椅子から半分立ちかける（ガタッ）
  const base = poseAt(f, [
    [0, HERO_FROZEN],
    [70, HERO_FROZEN],
    [86, { ...HERO_HALF, y: HERO_HALF.y - 30, torso: 4 }],
    [96, { ...HERO_HALF, y: HERO_HALF.y + 6 }],
    [104, HERO_HALF],
  ]);
  const tremble = track(f, [[0, 3.5], [200, 6]]);
  const hero = shiftPose(base, {
    x: jitter(f, tremble, 2),
    y: -pulse * 8,
    torso: pulse * 3,
  });
  const j = solve(hero);

  // 「終わった」の文字
  const owata = track(f, [[150, 0], [162, 1]], Easing.out(Easing.back(1.6)));
  const heartSize = 62 * (1 + pulse * 1.1);

  return (
    <Canvas>
      <Office />
      <StickFigure pose={hero} />
      <BeatRings frame={f} beats={BEATS} x={j.chest[0] + 8} y={j.chest[1]} />
      <Heart x={j.chest[0] + 8} y={j.chest[1] + 4} size={heartSize} />
      {f > 12 ? (
        <SweatSpray frame={f} x={j.head[0]} y={j.head[1]} every={f > 100 ? 3 : 5} power={1.2} seed="seg2" />
      ) : null}
      <GloomLines x={j.head[0]} y={j.head[1] - 40} frame={f} opacity={track(f, [[175, 0], [190, 1]])} />
      {owata > 0 ? (
        <text
          x={j.head[0] + jitter(f, 2, 9)}
          y={j.head[1] - 200 - (1 - owata) * 60}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={130}
          fill={INK}
          opacity={Math.min(1, owata)}
        >
          終わった
        </text>
      ) : null}
    </Canvas>
  );
};

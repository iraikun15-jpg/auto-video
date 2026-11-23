import React from "react";
import { Easing, interpolate } from "remotion";
import { jitter, poseAt, shiftPose, track } from "../rig/pose";
import { ShockLines } from "../rig/props";
import { StickFigure, solve } from "../rig/StickFigure";
import { BG, BOSS_RED, FONT, INK } from "../rig/theme";

/** 背後の影の大きさ */
const STAND_SHADOW_SCALE = 1.75;
import {
  BOSS_STAND,
  Canvas,
  HERO_FROZEN,
  HERO_SIT,
  Office,
  useSegFrame,
} from "./common";

/** seg1 0〜3秒：作業中→背後に上司の影→「ちょっといい？」→ビクッと固まる */
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");

  // タイピング（前腕を小刻みに上下）
  const typing = f < 34 ? Math.sin(f * 1.3) * 7 : 0;
  const typingPose = shiftPose(HERO_SIT, {
    frontFore: typing,
    backFore: -typing,
    head: Math.sin(f * 0.2) * 2,
  });

  // ビクッ（36フレーム目）：跳ね上がって腕がバンザイ→固まる
  const JUMP = { ...HERO_FROZEN, y: HERO_FROZEN.y - 55, backArm: 150, backFore: 20, frontArm: 160, frontFore: 15, head: -14, torso: -10 };
  const heroBase = poseAt(f, [
    [35, typingPose],
    [39, JUMP],
    [44, JUMP],
    [50, { ...HERO_FROZEN, y: HERO_FROZEN.y + 6 }],
    [54, HERO_FROZEN],
  ]);
  const shake = f > 50 ? jitter(f, 3.5, 1) : 0;
  const hero = shiftPose(heroBase, { x: shake, torso: shake * 0.4 });
  const heroJ = solve(hero);

  // 背後の影（大きく、ヌッと現れる）
  const shadowIn = track(f, [[4, 0], [28, 1]], Easing.out(Easing.cubic));
  const sScale = STAND_SHADOW_SCALE;
  const shadowPose = {
    ...BOSS_STAND,
    x: interpolate(shadowIn, [0, 1], [-420, 175]),
    y: 1500 - 256 * sScale,
    torso: 10,
    frontArm: 75,
    frontFore: 10,
  };

  // 「ちょっといい？」の文字（画面いっぱい）
  const textIn = track(f, [[28, 0], [36, 1]], Easing.out(Easing.back(2.2)));
  const textShake = f > 36 ? jitter(f, 2, 7) : 0;

  return (
    <Canvas>
      {/* 影は背景の上・人物の後ろ */}
      <Office />
      <g style={{ mixBlendMode: "multiply" }}>
        <StickFigure
          pose={shadowPose}
          scale={sScale}
          color={INK}
          tie
          silhouette
          opacity={0.26 * shadowIn}
          lineWidth={17}
        />
      </g>
      <StickFigure pose={hero} />
      <ShockLines
        x={heroJ.head[0]}
        y={heroJ.head[1]}
        opacity={track(f, [[37, 0], [40, 1], [62, 1], [72, 0]])}
      />
      {textIn > 0 ? (
        <g
          opacity={Math.min(1, textIn * 2)}
          transform={`translate(${540 + textShake} 560) scale(${interpolate(textIn, [0, 1], [1.6, 1])})`}
        >
          {["ちょっと", "いい？"].map((line, i) => (
            <text
              key={line}
              x={0}
              y={-60 + i * 235}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={900}
              fontSize={210}
              fill={BOSS_RED}
              stroke={BG}
              strokeWidth={14}
              paintOrder="stroke"
            >
              {line}
            </text>
          ))}
        </g>
      ) : null}
    </Canvas>
  );
};

import React from "react";
import { Easing, interpolate } from "remotion";
import { Pose, poseAt, shiftPose, track } from "../rig/pose";
import { Floor } from "../rig/props";
import { Sparkle, Station, StreetLamp } from "../rig/station";
import { Face, Friend, solve, StickFigure } from "../rig/StickFigure";
import { BG, FONT, FRIEND_BLUE } from "../rig/theme";
import { Canvas, HERO_STAND, useSegFrame } from "./common";

// 駅前の配置（以後の回で駅前を使うときもこの位置）
export const STATION_X = 540;
const HERO_X = 290;
const FRIEND_X = 800;

/** 手を振るポーズ（腕を高く上げ、前腕を左右に振る） */
export const wave = (p: Pose, phase: number, amt = 1): Pose =>
  shiftPose(p, {
    frontArm: 150 * amt - (p.frontArm * amt),
    frontFore: (Math.sin(phase) * 32 + 8) * amt - p.frontFore * amt,
    head: -6 * amt,
    torso: -3 * amt,
  });

/** seg1 0〜3秒：駅前の別れ際。友達が笑顔で手を振り「今度ご飯行こう！」、主人公も笑顔で振り返す */
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");

  // 友達：最初から大きく手を振り、駅のほうへ少しずつ下がる
  const bounceF = Math.abs(Math.sin(f * 0.32)) * 10;
  const friendBase: Pose = { ...HERO_STAND, x: FRIEND_X + track(f, [[0, 0], [80, 40]]) };
  const friend = shiftPose(wave(friendBase, f * 0.55), { y: -bounceF });

  // 主人公：ふり向いて（20f〜）笑顔で振り返す
  const heroWaveAmt = track(f, [[14, 0], [26, 1]], Easing.out(Easing.back(1.6)));
  const bounceH = Math.abs(Math.sin((f - 14) * 0.3)) * 9 * heroWaveAmt;
  const heroBase = poseAt(f, [
    [0, { ...HERO_STAND, x: HERO_X - 20, torso: 4 }],
    [16, { ...HERO_STAND, x: HERO_X }],
  ]);
  const hero = shiftPose(wave(heroBase, f * 0.6 + 1.5, heroWaveAmt), { y: -bounceH });

  // 「今度ご飯行こう！」：画面いっぱいに弾んで出る
  const textIn = track(f, [[4, 0], [14, 1]], Easing.out(Easing.back(2.2)));
  const textBob = Math.sin(f * 0.25) * 6;
  const fj = solve(friend, -1);

  return (
    <Canvas>
      <Station x={STATION_X} width={500} clockAngle={2.2 + f * 0.004} />
      <StreetLamp x={70} />
      <Floor />

      <Friend pose={friend} facing={-1} />
      <Face pose={friend} facing={-1} color={FRIEND_BLUE} />
      <StickFigure pose={hero} />
      <Face pose={hero} opacity={heroWaveAmt} />

      {/* 明るさの演出：頭の周りのキラキラ */}
      {[0, 1, 2].map((i) => {
        const ph = (f * 0.12 + i * 2.1) % (Math.PI * 2);
        const a = Math.max(0, Math.sin(ph));
        return (
          <Sparkle
            key={i}
            x={fj.head[0] + [-90, 80, 10][i]}
            y={fj.head[1] + [-60, -40, -120][i]}
            size={16 + a * 14}
            color={FRIEND_BLUE}
            opacity={a}
          />
        );
      })}

      {textIn > 0 ? (
        <g
          opacity={Math.min(1, textIn * 2)}
          transform={`translate(540 ${430 + textBob}) scale(${interpolate(textIn, [0, 1], [1.5, 1])})`}
        >
          {["今度ご飯", "行こう！"].map((line, i) => (
            <text
              key={line}
              x={0}
              y={-60 + i * 235}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={900}
              fontSize={210}
              fill={FRIEND_BLUE}
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

import React from "react";
import { Easing } from "remotion";
import { GroupCreatedScreen, HandPhone, PhoneCallout, PhoneFrame } from "../rig/phone";
import { Pose, poseAt, shiftPose, track } from "../rig/pose";
import { Floor } from "../rig/props";
import { solve, StickFigure } from "../rig/StickFigure";
import { INK } from "../rig/theme";
import { Canvas, markOf, useSegFrame } from "./common";
import { HERO_PHONE, PANEL } from "./Seg2";

const READY = markOf("seg3", 0); // 表示が出そろう
const SILENCE = markOf("seg3", 1); // 沈黙の始まり
const DIM = markOf("seg3", 2); // 画面が暗くなり始める
const DIM_END = 312;

/** seg3 13〜24秒：グループ作成→期待して見守る→誰も送らない沈黙→画面が暗くなる */
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");

  // ===== スマホ画面 =====
  const pop = (at: number) => track(f, [[at, 0], [at + 8, 1]], Easing.out(Easing.back(2)));
  const icons: [number, number, number] = [pop(4), pop(11), pop(18)];
  const notice = track(f, [[26, 0], [READY, 1]], Easing.out(Easing.cubic));
  const cursor = Math.floor(f / 15) % 2 === 0 && f < DIM_END;
  const dim = track(f, [[DIM, 0], [DIM_END, 0.9]], Easing.inOut(Easing.quad));

  // ===== 主人公 =====
  // 期待：身を乗り出してソワソワ（小さく弾む）→ 沈黙：だんだん動きが小さくなり、うなだれる
  const eager: Pose = shiftPose(HERO_PHONE, { torso: 14, head: 14 });
  const droop: Pose = shiftPose(HERO_PHONE, { torso: 18, head: 34, frontArm: -14, backArm: -14, frontFore: -18, y: 6 });
  const base = poseAt(f, [
    [0, HERO_PHONE],
    [READY + 6, eager],
    [SILENCE, eager],
    [SILENCE + 30, shiftPose(eager, { torso: -6, head: -6 })], // 首をかしげて待つ
    [DIM, shiftPose(eager, { torso: -4, head: 6 })],
    [DIM_END, droop],
  ]);
  const fidget = track(f, [[READY, 0], [READY + 8, 1], [SILENCE, 1], [SILENCE + 60, 0.15], [DIM, 0.1], [DIM_END, 0]]);
  const hero = shiftPose(base, {
    y: -Math.abs(Math.sin(f * 0.35)) * 12 * fidget + Math.sin(f * 0.08) * 2, // 弾み＋呼吸
    head: Math.sin(f * 0.21) * 6 * fidget,
    frontFore: Math.sin(f * 0.5) * 6 * fidget,
  });
  const hj = solve(hero);
  const phoneAt: [number, number] = [hj.frontHand[0] + 6, hj.frontHand[1] - 18];

  // 沈黙中、ときどき「…」が主人公の頭の横に浮かぶ（文字ではなく点）
  const dots = track(f, [[SILENCE + 20, 0], [SILENCE + 34, 1], [DIM + 10, 1], [DIM + 30, 0]]);

  return (
    <Canvas>
      {/* 部屋も少しずつ暗く */}
      <Floor />
      <PhoneCallout
        from={[phoneAt[0], phoneAt[1] - 44]}
        toL={[PANEL.x + 200, PANEL.y + PANEL.h - 4]}
        toR={[PANEL.x + PANEL.w - 200, PANEL.y + PANEL.h - 4]}
        opacity={1 - dim * 0.6}
      />
      <PhoneFrame id="ep3-seg3-phone" {...PANEL} dim={dim}>
        {(s) => <GroupCreatedScreen s={s} icons={icons} notice={notice} cursor={cursor} />}
      </PhoneFrame>
      <StickFigure pose={hero} />
      <HandPhone x={phoneAt[0]} y={phoneAt[1]} rotate={-18 + hero.torso} dim={dim} />
      {dots > 0
        ? [0, 1, 2].map((i) => {
            const on = track((f - SILENCE) % 45, [[i * 8, 0], [i * 8 + 6, 1]]);
            return (
              <circle
                key={i}
                cx={hj.head[0] - 120 + i * 34}
                cy={hj.head[1] - 90}
                r={9}
                fill={INK}
                opacity={dots * on}
              />
            );
          })
        : null}
      <rect x={0} y={0} width={1080} height={1920} fill={INK} opacity={dim * 0.22} />
    </Canvas>
  );
};

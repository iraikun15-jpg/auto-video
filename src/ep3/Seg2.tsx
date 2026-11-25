import React from "react";
import { Easing, random } from "remotion";
import { CalendarPage, CalendarRings, FlippingPage, Season, SeasonIcon, seasonOf } from "../rig/calendar";
import { HandPhone, PhoneCallout, PhoneFrame } from "../rig/phone";
import { jitter, Pose, poseAt, shiftPose, track } from "../rig/pose";
import { Floor } from "../rig/props";
import { solve, StickFigure } from "../rig/StickFigure";
import { FRIEND_BLUE } from "../rig/theme";
import { Canvas, HERO_STAND, markOf, useSegFrame } from "./common";

// 大きなスマホ画面パネル（seg2・seg3 共通の位置）
export const PANEL = { x: 245, y: 110, w: 590, h: 810 };

/** スマホを両手で持って画面を見下ろす姿勢 */
export const HERO_PHONE: Pose = {
  ...HERO_STAND,
  x: 520,
  torso: 5,
  head: 24,
  backArm: 28,
  backFore: 92,
  frontArm: 34,
  frontFore: 86,
};

// 4月→翌3月の12ページ＋「来年」
const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const STOP = markOf("seg2"); // 「来年」でピタッと止まるフレーム

// めくる開始フレーム：間隔を 26f → 4f にだんだん詰める（加速）
const FLIPS: { start: number; dur: number }[] = (() => {
  const out: { start: number; dur: number }[] = [];
  const n = MONTHS.length;
  let t = 0;
  const raw: number[] = [];
  for (let k = 0; k < n; k++) {
    raw.push(t);
    t += 26 - (22 * k) / (n - 1);
  }
  // 最後のめくり（3月→来年）が STOP の少し前に終わるように並べる
  const lastDur = 7;
  const offset = STOP - lastDur - raw[n - 1];
  for (let k = 0; k < n; k++) {
    const interval = k < n - 1 ? raw[k + 1] - raw[k] : 8;
    out.push({ start: Math.round(raw[k] + offset), dur: Math.max(lastDur, Math.round(Math.min(16, interval * 0.85))) });
  }
  out[n - 1].dur = lastDur;
  return out;
})();

/** フレーム f で一番上にあるページ番号と、めくれ途中の進み具合 */
const pageState = (f: number): { top: number; t: number } => {
  let top = 0;
  for (let k = 0; k < FLIPS.length; k++) {
    const { start, dur } = FLIPS[k];
    if (f >= start + dur) top = k + 1;
    else if (f >= start) return { top: k, t: (f - start) / dur };
  }
  return { top, t: 0 };
};

/** 背景に舞う季節のもの（花びら・太陽・葉・雪）。止まるときは一緒に止まる */
const SeasonParticles: React.FC<{ season: Season; frame: number; opacity: number }> = ({ season, frame, opacity }) => (
  <g opacity={opacity}>
    {Array.from({ length: 9 }).map((_, i) => {
      const x = 60 + random(`px-${i}`) * 960;
      const speed = 3 + random(`pv-${i}`) * 2.5;
      const y = ((frame * speed + random(`py-${i}`) * 2000) % 2100) - 100;
      const sway = Math.sin(frame * 0.05 + i) * 30;
      if (season === "summer" && i > 2) return null; // 夏は太陽だけ少なめ
      return (
        <SeasonIcon
          key={i}
          season={season}
          x={x + sway}
          y={season === "summer" ? 200 + i * 70 : y}
          size={season === "summer" ? 70 : 42}
          rotate={frame * 2 + i * 40}
        />
      );
    })}
  </g>
);

/** seg2 3〜13秒：スマホのカレンダーをどんどん速くめくって季節が一周→「来年」で急停止 */
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const { top, t } = pageState(f);
  const stopped = f >= STOP;

  // ===== 主人公 =====
  // めくるたびに親指（前腕）でスワイプ
  let swipe = 0;
  for (const fl of FLIPS) {
    const d = f - fl.start;
    if (d >= -2 && d < 8) swipe = Math.max(swipe, Math.sin(((d + 2) / 10) * Math.PI));
  }
  const speedUp = track(f, [[FLIPS[0].start, 0], [STOP, 1]], Easing.in(Easing.quad)); // 加速につれて前のめり
  const heroKeys: [number, Pose][] = [
    [0, { ...HERO_PHONE, head: 10, frontArm: 20, frontFore: 40 }],
    [20, HERO_PHONE],
    [STOP - 1, shiftPose(HERO_PHONE, { torso: 10, head: 8 })],
    // 急停止：ピタッと固まる
    [STOP + 2, shiftPose(HERO_PHONE, { torso: 3, head: 4, y: -10 })],
    [STOP + 22, shiftPose(HERO_PHONE, { torso: 3, head: 4 })],
    // がっくり肩を落とす
    [STOP + 40, shiftPose(HERO_PHONE, { torso: 16, head: 30, backArm: -10, frontArm: -10, frontFore: -10, y: 8 })],
  ];
  let hero = poseAt(f, heroKeys);
  if (!stopped) {
    hero = shiftPose(hero, {
      frontFore: swipe * 22,
      frontArm: swipe * 6,
      x: jitter(f, speedUp * 3, 2),
    });
  } else if (f > STOP + 40) {
    // ため息の上下
    hero = shiftPose(hero, { y: Math.sin((f - STOP - 40) * 0.12) * 4, head: Math.sin((f - STOP - 40) * 0.12) * 2 });
  }
  const hj = solve(hero);
  const phoneAt: [number, number] = [hj.frontHand[0] + 6, hj.frontHand[1] - 18];

  // ===== カレンダー =====
  const settle = stopped ? track(f, [[STOP, -16], [STOP + 3, 6], [STOP + 7, 0]]) : 0;
  const circleDraw = track(f, [[STOP + 10, 0], [STOP + 26, 1]], Easing.out(Easing.cubic));
  const season = top < MONTHS.length ? seasonOf(MONTHS[top]) : "winter";
  const particleFrame = Math.min(f, STOP);
  const particleOpacity = 0.32 * track(f, [[0, 0], [20, 1], [STOP + 20, 1], [STOP + 50, 0]]);

  const renderPage = (idx: number, x: number, y: number, w: number, h: number, flipT?: number) => {
    const props =
      idx < MONTHS.length
        ? { label: `${MONTHS[idx]}月`, season: seasonOf(MONTHS[idx]), busy: 0.9, markColor: idx % 2 ? FRIEND_BLUE : undefined }
        : { big: "来年" };
    return flipT !== undefined ? (
      <FlippingPage key={`p${idx}`} x={x} y={y} w={w} h={h} t={flipT} {...props} />
    ) : (
      <CalendarPage key={`p${idx}`} x={x} y={y} w={w} h={h} {...props} />
    );
  };

  return (
    <Canvas>
      <SeasonParticles season={season} frame={particleFrame} opacity={particleOpacity} />
      <Floor />
      <PhoneCallout from={[phoneAt[0], phoneAt[1] - 44]} toL={[PANEL.x + 200, PANEL.y + PANEL.h - 4]} toR={[PANEL.x + PANEL.w - 200, PANEL.y + PANEL.h - 4]} />
      <PhoneFrame id="ep3-seg2-phone" {...PANEL}>
        {(s) => {
          const px = s.x + 40;
          const py = s.y + 110 + settle;
          const pw = s.w - 80;
          const ph = s.h - 170;
          const cx = px + pw / 2;
          const cy = py + ph / 2 - 10;
          return (
            <g>
              {/* 下のページ（次の月）→ 上でめくれているページ */}
              {top + 1 <= MONTHS.length && t > 0 ? renderPage(top + 1, px, py, pw, ph) : null}
              {renderPage(top, px, py, pw, ph, t > 0 ? t : undefined)}
              <CalendarRings x={px} y={py} w={pw} />
              {/* 「来年」を青い丸で囲む（全員そろう日） */}
              {top >= MONTHS.length && circleDraw > 0 ? (
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={pw * 0.42}
                  ry={ph * 0.26}
                  fill="none"
                  stroke={FRIEND_BLUE}
                  strokeWidth={12}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={`${circleDraw} 1`}
                  transform={`rotate(-8 ${cx} ${cy})`}
                />
              ) : null}
            </g>
          );
        }}
      </PhoneFrame>
      <StickFigure pose={hero} />
      <HandPhone x={phoneAt[0]} y={phoneAt[1]} rotate={-18 + hero.torso} />
    </Canvas>
  );
};

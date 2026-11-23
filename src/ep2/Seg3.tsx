import React from "react";
import { Easing, random } from "remotion";
import { jitter, shiftPose, track } from "../rig/pose";
import { Drop, Heart, SweatSpray } from "../rig/props";
import { solve, StickFigure } from "../rig/StickFigure";
import { BG, FONT, INK } from "../rig/theme";
import { Canvas, HERO_HALF, Office, heartbeat, makeBeats, useSegFrame } from "./common";

const BEATS = makeBeats(0, 330, 11, 11);

// 想像の吹き出し（もくもく雲形）
const BUBBLE = { cx: 540, cy: 470, rx: 470, ry: 330 };
const cloudPath = (() => {
  const n = 22;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([BUBBLE.cx + Math.cos(a) * BUBBLE.rx, BUBBLE.cy + Math.sin(a) * BUBBLE.ry]);
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % n];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    // 外側にふくらませる
    const ox = mx - BUBBLE.cx;
    const oy = my - BUBBLE.cy;
    const len = Math.hypot(ox, oy);
    const k = 52;
    d += ` Q ${mx + (ox / len) * k} ${my + (oy / len) * k} ${p1[0]} ${p1[1]}`;
  }
  return d + " Z";
})();

/** 吹き出しの中：謝罪会見（長机・マイク・カメラのフラッシュ）で深々と頭を下げる主人公 */
const PressConference: React.FC<{ f: number }> = ({ f }) => {
  // お辞儀の深さ 0〜1
  const bow = track(f, [
    [40, 0],
    [56, 1],
    [140, 1],
    [154, 0.35],
    [172, 0.35],
    [186, 1.05],
    [330, 1.05],
  ]);
  const bob = bow > 0.9 ? Math.sin(f * 0.18) * 0.04 : 0;
  const b = Math.min(1.08, bow + bob);
  const cx = 540;
  const tableTop = 590;
  const hipY = 650;
  const torsoLen = 165 * (1 - 0.72 * b);
  const headR = 40 * (1 + 0.12 * b);
  const neckY = hipY - torsoLen;
  const headY = neckY - headR * (1 - 0.6 * b) - 2;
  const handY = tableTop + 6;

  // カメラ（左右に3台ずつ）とフラッシュ
  const cams: [number, number, 1 | -1][] = [
    [190, 610, 1],
    [270, 700, 1],
    [175, 760, 1],
    [890, 610, -1],
    [810, 700, -1],
    [905, 760, -1],
  ];
  const flashOn = (i: number) =>
    f > 30 && random(`flash-${i}-${Math.floor(f / 3)}`) > (bow > 0.5 ? 0.55 : 0.8);

  return (
    <g>
      {/* 背面のパネル */}
      <rect x={300} y={215} width={480} height={70} rx={8} fill={BG} stroke={INK} strokeWidth={6} />
      <line x1={340} x2={740} y1={250} y2={250} stroke={INK} strokeWidth={5} />
      {/* 主人公（正面向き・ミニサイズ） */}
      <g stroke={INK} strokeWidth={11} strokeLinecap="round" fill="none">
        <line x1={cx} y1={hipY} x2={cx} y2={neckY} />
        <polyline points={`${cx - 85},${handY} ${cx - 46},${neckY + 30 * (1 - b)} ${cx},${neckY + 6}`} />
        <polyline points={`${cx + 85},${handY} ${cx + 46},${neckY + 30 * (1 - b)} ${cx},${neckY + 6}`} />
      </g>
      <circle cx={cx} cy={headY} r={headR} fill={BG} stroke={INK} strokeWidth={10} />
      {/* 汗（想像の中でも） */}
      {b > 0.8 ? <Drop x={cx + 48} y={headY - 20 + ((f * 3) % 40)} size={0.9} /> : null}
      {/* 長机（テーブルクロス） */}
      <rect x={290} y={tableTop} width={500} height={130} fill={BG} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {[350, 420, 490, 560, 630, 700].map((x) => (
        <line key={x} x1={x + 20} y1={tableTop + 30} x2={x + 20} y2={tableTop + 125} stroke={INK} strokeWidth={3} />
      ))}
      {/* マイク */}
      {[455, 540, 625].map((x, i) => (
        <g key={x} stroke={INK} strokeLinecap="round">
          <line x1={x} y1={tableTop} x2={x + (i - 1) * 4} y2={tableTop - 40} strokeWidth={5} />
          <line x1={x - 16} y1={tableTop} x2={x + 16} y2={tableTop} strokeWidth={6} />
          <rect
            x={x + (i - 1) * 4 - 9}
            y={tableTop - 66}
            width={18}
            height={30}
            rx={9}
            fill={INK}
            strokeWidth={2}
          />
        </g>
      ))}
      {/* カメラとフラッシュ */}
      {cams.map(([x, y, dir], i) => (
        <g key={i}>
          {flashOn(i) ? (
            <g stroke={INK} strokeWidth={5} strokeLinecap="round">
              {Array.from({ length: 8 }).map((_, k) => {
                const a = (k / 8) * Math.PI * 2;
                return (
                  <line
                    key={k}
                    x1={x + dir * 30 + Math.cos(a) * 30}
                    y1={y - 40 + Math.sin(a) * 30}
                    x2={x + dir * 30 + Math.cos(a) * 62}
                    y2={y - 40 + Math.sin(a) * 62}
                  />
                );
              })}
              <circle cx={x + dir * 30} cy={y - 40} r={20} fill={BG} strokeWidth={5} />
            </g>
          ) : null}
          <rect x={x - 38} y={y - 26} width={76} height={52} rx={8} fill={BG} stroke={INK} strokeWidth={6} />
          <circle cx={x + dir * 38} cy={y} r={17} fill={BG} stroke={INK} strokeWidth={6} />
          <rect x={x + dir * 12 - 12} y={y - 42} width={24} height={16} fill={BG} stroke={INK} strokeWidth={5} />
        </g>
      ))}
    </g>
  );
};

/** seg3 13〜24秒：頭上の想像の吹き出しで謝罪会見。本体は汗だくで固まったまま */
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const pulse = heartbeat(f, BEATS) * 0.6;
  const hero = shiftPose(HERO_HALF, { x: jitter(f, 5, 3), y: -pulse * 5 });
  const j = solve(hero);

  const pop = track(f, [[12, 0], [26, 1]], Easing.out(Easing.back(1.8)));
  const dots: [number, number, number][] = [
    [j.head[0] + 15, j.head[1] - 85, 4],
    [j.head[0] + 35, j.head[1] - 130, 8],
    [j.head[0] + 60, j.head[1] - 185, 12],
  ];

  // 前のセグメントの「終わった」をフェードアウト
  const prevText = track(f, [[0, 1], [10, 0]]);

  return (
    <Canvas>
      <defs>
        <clipPath id="bubble">
          <path d={cloudPath} />
        </clipPath>
      </defs>
      <Office />
      <StickFigure pose={hero} />
      <Heart x={j.chest[0] + 8} y={j.chest[1] + 4} size={62 * (1 + pulse)} />
      {/* 汗だく：飛ぶ汗＋顔に張り付いた汗 */}
      <SweatSpray frame={f} x={j.head[0]} y={j.head[1]} every={6} power={0.8} seed="seg3" />
      {[0, 1, 2].map((i) => (
        <Drop
          key={i}
          x={j.head[0] + (i - 1) * 40}
          y={j.head[1] + 10 + ((f * 2 + i * 23) % 70)}
          size={1.2}
          opacity={1 - ((f * 2 + i * 23) % 70) / 70}
        />
      ))}
      {prevText > 0 ? (
        <text x={j.head[0]} y={j.head[1] - 200} textAnchor="middle" fontFamily={FONT} fontSize={130} fontWeight={900} fill={INK} opacity={prevText}>
          終わった
        </text>
      ) : null}
      {/* 想像の吹き出し */}
      {dots.map(([x, y, at], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={[14, 22, 30][i]}
          fill={BG}
          stroke={INK}
          strokeWidth={6}
          opacity={f >= at ? 1 : 0}
        />
      ))}
      {pop > 0 ? (
        <g transform={`translate(${BUBBLE.cx} ${BUBBLE.cy + BUBBLE.ry}) scale(${pop}) translate(${-BUBBLE.cx} ${-(BUBBLE.cy + BUBBLE.ry)})`}>
          <path d={cloudPath} fill={BG} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <g clipPath="url(#bubble)">
            <PressConference f={f} />
          </g>
        </g>
      ) : null}
    </Canvas>
  );
};

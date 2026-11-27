import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Pose } from "./pose";
import { bow, breathe, ground, jump, nod, POSE_LABELS, POSES, PoseName, run, shakeHead, tremble, typing, walk, wave } from "./poses";
import { Chair } from "./props";
import { StickFigure } from "./StickFigure";
import { BG, FONT, INK } from "./theme";

const W = 1080;
const H = 1920;

/** マス目の1つ分：床の線＋棒人間＋名前 */
const Cell: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  pose: Pose;
  label: string;
  code?: string;
  sit?: boolean;
  facing?: 1 | -1;
}> = ({ x, y, w, h, scale, pose, label, code, sit, facing = 1 }) => {
  // 床は文字の上。棒人間はマスの中央、座りポーズは椅子を添える
  const floor = 1500;
  const p = ground(pose, floor);
  const labelH = code ? 74 : 50;
  const floorInCell = h - labelH;
  const k = scale;
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={14} x2={w - 14} y1={floorInCell} y2={floorInCell} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.35} />
      <g transform={`translate(${w / 2} ${floorInCell}) scale(${k}) translate(0 ${-floor})`}>
        {sit ? (
          // 椅子は腰の少し後ろ（第2話の配置と同じ位置関係）
          <Chair x={p.x - 60} />
        ) : null}
        <StickFigure pose={p} facing={facing} />
      </g>
      <text x={w / 2} y={h - (code ? 40 : 14)} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={INK}>
        {label}
      </text>
      {code ? (
        <text x={w / 2} y={h - 10} textAnchor="middle" fontFamily="monospace" fontSize={20} fill={INK} opacity={0.55}>
          {code}
        </text>
      ) : null}
    </g>
  );
};

const NAMES = Object.keys(POSES) as PoseName[];

/** ポーズ一覧（静止画）。名前と、コードで使う英字の名前を並べる */
export const PoseCatalog: React.FC = () => {
  const cols = 5;
  const top = 110;
  const rows = Math.ceil(NAMES.length / cols);
  const cw = W / cols;
  const ch = (H - top - 10) / rows;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={W / 2} y={74} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={50} fill={INK}>
          棒人間ポーズ集（{NAMES.length}種）
        </text>
        {NAMES.map((n, i) => (
          <Cell
            key={n}
            x={(i % cols) * cw}
            y={top + Math.floor(i / cols) * ch}
            w={cw}
            h={ch}
            scale={0.32}
            pose={POSES[n]}
            label={POSE_LABELS[n]}
            code={n}
            sit={n.startsWith("SIT")}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 動きの見本（動画）
// ---------------------------------------------------------------------------

export const MOTION_DEMO_FRAMES = 150;

type Lane = { label: string; code: string; sit?: boolean; at: (f: number) => { pose: Pose; facing?: 1 | -1 } };

// 歩く・走るはマスの中を行き来させる（往復）
const pingpong = (f: number, len: number, speed: number) => {
  const span = len / Math.abs(speed);
  const cycle = Math.floor(f / span);
  const t = f - cycle * span;
  const right = cycle % 2 === 0;
  return { offset: right ? t * speed : len - t * speed, facing: (right ? 1 : -1) as 1 | -1 };
};

const LANES: Lane[] = [
  {
    label: "歩く",
    code: "walk()",
    at: (f) => {
      const m = pingpong(f, 600, 5);
      return { pose: { ...walk(f), x: m.offset - 300 }, facing: m.facing };
    },
  },
  {
    label: "走る",
    code: "run()",
    at: (f) => {
      const m = pingpong(f, 600, 12);
      return { pose: { ...run(f), x: m.offset - 300 }, facing: m.facing };
    },
  },
  { label: "お辞儀", code: "bow()", at: (f) => ({ pose: bow(f % 75, { start: 10 }) }) },
  { label: "謝罪（深いお辞儀）", code: "bow({deep:true})", at: (f) => ({ pose: bow(f % 75, { start: 10, deep: true, hold: 24 }) }) },
  { label: "うなずく", code: "nod()", at: (f) => ({ pose: ground(nod(f % 50, POSES.STAND, { start: 8 })) }) },
  { label: "首を振る", code: "shakeHead()", at: (f) => ({ pose: ground(shakeHead(f % 50, POSES.STAND, { start: 8 })) }) },
  { label: "手を振る", code: "wave()", at: (f) => ({ pose: ground(wave(f)) }) },
  { label: "ジャンプ", code: "jump()", at: (f) => ({ pose: jump(f % 50, { start: 6 }) }) },
  { label: "タイピング", code: "typing()", sit: true, at: (f) => ({ pose: ground(typing(f)) }) },
  { label: "震える", code: "tremble()", at: (f) => ({ pose: ground(tremble(f, POSES.HEAD_IN_HANDS)) }) },
  { label: "待機の揺れ", code: "breathe()", at: (f) => ({ pose: ground(breathe(f, POSES.ARMS_CROSSED)) }) },
];

/** 動きの見本：上2段は横いっぱいに歩く・走る、残りは3列で並べる */
export const MotionDemo: React.FC = () => {
  const f = useCurrentFrame();
  const top = 100;
  const wideH = 330;
  const rest = LANES.slice(2);
  const cols = 3;
  const rows = Math.ceil(rest.length / cols);
  const h = (H - top - wideH * 2 - 10) / rows;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={W / 2} y={70} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={48} fill={INK}>
          棒人間の動き見本
        </text>
        {LANES.slice(0, 2).map((l, i) => {
          const s = l.at(f);
          return (
            <Cell key={l.code} x={0} y={top + i * wideH} w={W} h={wideH} scale={0.42} pose={s.pose} facing={s.facing} label={l.label} code={l.code} />
          );
        })}
        {rest.map((l, i) => {
          const s = l.at(f);
          return (
            <Cell
              key={l.code}
              x={(i % cols) * (W / cols)}
              y={top + wideH * 2 + Math.floor(i / cols) * h}
              w={W / cols}
              h={h}
              scale={0.46}
              pose={s.pose}
              facing={s.facing}
              label={l.label}
              code={l.code}
              sit={l.sit}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

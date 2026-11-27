/**
 * 演出（漫画的な記号・画面効果）。台本では「動き」に [秒, 誰, 汗] のように書く。
 * 人物に付けるもの（汗・びっくり等）は頭や胸の位置に出る。
 * 「画面」に付けるもの（揺れ・フラッシュ・暗くなる）は画面全体にかかる。
 * 集中線は人物に付けるとその人の頭を中心に、画面に付けると画面の中央を中心にする。
 */
import React from "react";
import { Easing, random } from "remotion";
import { jitter, track } from "../rig/pose";
import { Drop, Heart, ShockLines } from "../rig/props";
import { HEAD_R, Joints } from "../rig/StickFigure";
import { BG, BOSS_RED, FONT, INK } from "../rig/theme";
import type { Action } from "./types";

export type Anchor = { j: Joints; facing: 1 | -1 } | null;
type Ctx = { t: number; dur: number; a: Action; at: Anchor };

/** 既定の長さ（フレーム）。台本の「時間:」で変えられる */
export const EFFECT_DUR: Record<string, number> = {
  sweat: 30,
  coldsweat: 36,
  surprise: 24,
  question: 36,
  anger: 36,
  shock: 20,
  heart: 45,
  sparkle: 36,
  gloom: 60,
  focus: 24,
  shake: 12,
  flash: 8,
  dim: 45,
};

/** 画面全体にかける演出（人物の上下ではなく、画面の層として扱う） */
export const SCREEN_EFFECTS = new Set(["shake", "flash", "dim"]);

const pop = (t: number) => track(t, [[0, 0], [7, 1]], Easing.out(Easing.back(2.6)));
const fadeOut = (t: number, dur: number, len = 6) => track(t, [[dur - len, 1], [dur, 0]]);

/** 頭の上の記号（！・？） */
const Mark: React.FC<Ctx & { ch: string; color?: string; tilt?: number }> = ({ t, dur, at, ch, color = INK, tilt = 0, a }) => {
  if (!at) return null;
  const [hx, hy] = at.j.head;
  const x = a.opts.x ?? hx + at.facing * 105;
  const y = a.opts.y ?? hy - HEAD_R - 80;
  const k = pop(t);
  const bob = Math.sin(t * 0.35) * 4;
  return (
    <g opacity={fadeOut(t, dur)} transform={`translate(${x} ${y + bob}) rotate(${tilt * at.facing}) scale(${k})`}>
      <text x={0} y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={120} fill={color} stroke={BG} strokeWidth={12} paintOrder="stroke">
        {ch}
      </text>
    </g>
  );
};

/** 怒りマーク（四隅のカギ形） */
const Anger: React.FC<Ctx> = ({ t, dur, at, a }) => {
  if (!at) return null;
  const [hx, hy] = at.j.head;
  const x = a.opts.x ?? hx + at.facing * 50;
  const y = a.opts.y ?? hy - 50;
  const pulse = 1 + 0.12 * Math.max(0, Math.sin(t * 0.6));
  const k = pop(t) * pulse;
  const arm = "M 8 -26 Q 8 -8 26 -8";
  return (
    <g opacity={fadeOut(t, dur)} transform={`translate(${x} ${y}) scale(${k})`} fill="none" stroke={BOSS_RED} strokeWidth={9} strokeLinecap="round">
      {[0, 90, 180, 270].map((r) => (
        <path key={r} d={arm} transform={`rotate(${r})`} />
      ))}
    </g>
  );
};

/** 冷や汗：頭の横にしずくが1つ、ゆっくり垂れる */
const ColdSweat: React.FC<Ctx> = ({ t, dur, at }) => {
  if (!at) return null;
  const [hx, hy] = at.j.head;
  const slide = track(t, [[0, 0], [dur, 26]], Easing.in(Easing.quad));
  return (
    <g opacity={Math.min(track(t, [[0, 0], [5, 1]]), fadeOut(t, dur))}>
      <Drop x={hx - at.facing * 58} y={hy - 18 + slide} size={1.7} angle={at.facing * -10} />
    </g>
  );
};

/** 汗が飛び散る */
const Sweat: React.FC<Ctx> = ({ t, dur, at }) => {
  if (!at) return null;
  const [hx, hy] = at.j.head;
  const LIFE = 18;
  const drops: React.ReactNode[] = [];
  for (let born = Math.max(0, t - LIFE); born <= Math.min(t, dur - 6); born++) {
    if (born % 4 !== 0) continue;
    const age = t - born;
    const side = random(`sw-s-${born}`) > 0.5 ? 1 : -1;
    const vx = side * (5 + random(`sw-x-${born}`) * 6);
    const vy = -(8 + random(`sw-y-${born}`) * 6);
    const px = hx + side * 36 + vx * age;
    const py = hy - 20 + vy * age + 0.55 * age * age;
    const ang = (Math.atan2(vy + 1.1 * age, vx) * 180) / Math.PI + 270;
    drops.push(<Drop key={born} x={px} y={py} angle={ang} size={1.4} opacity={1 - age / LIFE} />);
  }
  return <g>{drops}</g>;
};

/** 衝撃線（頭の周りのギザ線） */
const Shock: React.FC<Ctx> = ({ t, dur, at }) => {
  if (!at) return null;
  const [hx, hy] = at.j.head;
  return <ShockLines x={hx} y={hy} r={64 + track(t, [[0, -10], [5, 0]])} opacity={Math.min(track(t, [[0, 0], [3, 1]]), fadeOut(t, dur))} />;
};

/** ドキドキ：胸のハートが脈打つ */
const HeartBeat: React.FC<Ctx> = ({ t, dur, at }) => {
  if (!at) return null;
  const [cx, cy] = at.j.chest;
  let v = 0;
  for (let b = 0; b <= t; b += 14) {
    const d1 = t - b;
    v = Math.max(v, Math.exp(-d1 / 3));
    const d2 = t - (b + 5);
    if (d2 >= 0) v = Math.max(v, 0.6 * Math.exp(-d2 / 3));
  }
  return (
    <g opacity={Math.min(track(t, [[0, 0], [4, 1]]), fadeOut(t, dur))}>
      <Heart x={cx + at.facing * 6} y={cy + 4} size={70 + 40 * v} />
    </g>
  );
};

/** キラキラ：頭の周りに星がまたたく */
const Sparkle: React.FC<Ctx> = ({ t, dur, at }) => {
  if (!at) return null;
  const [hx, hy] = at.j.head;
  const spots = [
    [-95, -60, 0],
    [90, -85, 7],
    [110, 10, 13],
    [-110, 30, 19],
    [10, -125, 4],
  ];
  return (
    <g opacity={fadeOut(t, dur)} fill={BG} stroke={INK} strokeWidth={5} strokeLinejoin="round">
      {spots.map(([dx, dy, d], i) => {
        const s = Math.max(0, Math.sin(((t - d) / 14) * Math.PI)) * (t >= d ? 1 : 0);
        if (s <= 0.01) return null;
        const r = 26 * s;
        const q = r * 0.28;
        return (
          <path
            key={i}
            transform={`translate(${hx + dx} ${hy + dy})`}
            d={`M 0 ${-r} L ${q} ${-q} L ${r} 0 L ${q} ${q} L 0 ${r} L ${-q} ${q} L ${-r} 0 L ${-q} ${-q} Z`}
          />
        );
      })}
    </g>
  );
};

/** どんより：頭の上に縦線がゆらゆら */
const Gloom: React.FC<Ctx> = ({ t, dur, at }) => {
  if (!at) return null;
  const [hx, hy] = at.j.head;
  const op = Math.min(track(t, [[0, 0], [10, 1]]), fadeOut(t, dur, 10)) * 0.75;
  return (
    <g opacity={op} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none">
      {[-48, -16, 16, 48].map((dx, i) => {
        const top = hy - HEAD_R - 120 + ((t * 0.8 + i * 9) % 18);
        const x = hx + dx;
        const w = 5;
        return <path key={i} d={`M ${x} ${top} q ${w} 18 0 36 q ${-w} 18 0 36`} />;
      })}
    </g>
  );
};

/** 集中線：画面の外側から中心へ向かう線。2フレームごとにちらつく */
const Focus: React.FC<Ctx> = ({ t, dur, at, a }) => {
  const cx = a.opts.x ?? (at ? at.j.head[0] : 540);
  const cy = a.opts.y ?? (at ? at.j.head[1] : 900);
  const seed = Math.floor(t / 2);
  const op = Math.min(track(t, [[0, 0], [3, 1]]), fadeOut(t, dur, 5));
  const N = 64;
  const rays: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const ang = ((i + random(`fa-${i}-${seed}`) * 0.8) / N) * Math.PI * 2;
    const r0 = 300 + random(`fr-${i}-${seed}`) * 220;
    const r1 = 1500;
    const w = (0.006 + random(`fw-${i}-${seed}`) * 0.012) * Math.PI;
    const p = (r: number, d: number) => `${cx + Math.cos(ang + d) * r},${cy + Math.sin(ang + d) * r}`;
    rays.push(<polygon key={i} points={`${p(r0, 0)} ${p(r1, w)} ${p(r1, -w)}`} />);
  }
  return (
    <g opacity={op * 0.9} fill={INK}>
      {rays}
    </g>
  );
};

/** 人物に付く演出（人物より手前に描く） */
export const CharacterEffect: React.FC<Ctx> = (c) => {
  switch (c.a.code) {
    case "sweat":
      return <Sweat {...c} />;
    case "coldsweat":
      return <ColdSweat {...c} />;
    case "surprise":
      return <Mark {...c} ch="！" tilt={8} />;
    case "question":
      return <Mark {...c} ch="？" tilt={-8} />;
    case "anger":
      return <Anger {...c} />;
    case "shock":
      return <Shock {...c} />;
    case "heart":
      return <HeartBeat {...c} />;
    case "sparkle":
      return <Sparkle {...c} />;
    case "gloom":
      return <Gloom {...c} />;
    default:
      return null;
  }
};

/** 集中線（人物の後ろ・背景の手前に描く） */
export const FocusLines = Focus;

/** 画面の揺れ（x, y のずれ）。ズームはしない */
export const screenShake = (list: { t: number; dur: number; a: Action }[]): [number, number] => {
  let dx = 0;
  let dy = 0;
  for (const { t, dur, a } of list) {
    const amp = 14 * (a.opts.power ?? 1) * (1 - t / dur);
    dx += jitter(t, amp, 3);
    dy += jitter(t, amp * 0.7, 9);
  }
  return [dx, dy];
};

/** フラッシュ（白く光る） */
export const Flash: React.FC<{ t: number; dur: number }> = ({ t, dur }) => (
  <rect x={-100} y={-100} width={1280} height={2120} fill="#FFFFFF" opacity={track(t, [[0, 0.95], [dur, 0]], Easing.out(Easing.quad))} />
);

/** 暗くなる（背景だけ暗くして人物を浮かせる） */
export const Dim: React.FC<{ t: number; dur: number; power?: number }> = ({ t, dur, power = 1 }) => (
  <rect x={-100} y={-100} width={1280} height={2120} fill={INK} opacity={0.32 * power * Math.min(track(t, [[0, 0], [8, 1]]), fadeOut(t, dur, 8))} />
);

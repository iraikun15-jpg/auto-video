import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Pose, STAND, SIT_TYPING } from "../rig/pose";
import { Chair, Desk, Floor, Printer } from "../rig/props";
import { STAND_HIP_Y_OFFSET } from "../rig/StickFigure";
import { BG, FLOOR_Y } from "../rig/theme";
import timing from "./timing.json";

export const FPS = timing.fps;
export const HOLD = timing.holdFrames;
export const segFrames = (id: string): number =>
  timing.segments.find((s) => s.id === id)!.frames;

/**
 * セグメント内のフレーム。末尾 HOLD フレームは動きを止める（後付けナレーション用の間）。
 */
export const useSegFrame = (id: string): number => {
  const frame = useCurrentFrame();
  return Math.min(frame, segFrames(id) - HOLD - 1);
};

// ---- 第2話の配置 ----
export const PRINTER_X = 20;
export const CHAIR_X = 420;
export const DESK_X = 620;
export const BOSS_X = 315;
export const STAND_Y = FLOOR_Y - STAND_HIP_Y_OFFSET;

export const HERO_SIT: Pose = { ...SIT_TYPING, x: 480, y: 1361 };

/** ビクッとした直後、座ったまま固まった姿勢 */
export const HERO_FROZEN: Pose = {
  ...HERO_SIT,
  torso: -6,
  head: -6,
  backArm: 35,
  backFore: 115,
  frontArm: 48,
  frontFore: 105,
};

/** 椅子から半分立ちかけて固まった姿勢 */
export const HERO_HALF: Pose = {
  ...HERO_SIT,
  x: 500,
  y: 1296,
  torso: 14,
  head: -10,
  backArm: -35,
  backFore: 70,
  frontArm: 30,
  frontFore: 75,
  backThigh: 48,
  backShin: -44,
  frontThigh: 58,
  frontShin: -60,
};

export const BOSS_STAND: Pose = { ...STAND, x: BOSS_X, y: STAND_Y };

export const Office: React.FC<{
  shelfOpen?: number;
  paperInShelf?: boolean;
  blink?: boolean;
  children?: React.ReactNode;
}> = ({ shelfOpen, paperInShelf, blink, children }) => (
  <>
    <Floor />
    <Printer x={PRINTER_X} shelfOpen={shelfOpen} paperInShelf={paperInShelf} blink={blink} />
    <Chair x={CHAIR_X} />
    <Desk x={DESK_X} />
    {children}
  </>
);

export const Canvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {children}
    </svg>
  </AbsoluteFill>
);

/** 鼓動の強さ（0〜1）。beats は拍のフレーム列。ドクン（強）→ドクン（弱）の2拍 */
export const heartbeat = (frame: number, beats: number[]): number => {
  let v = 0;
  for (const b of beats) {
    const d1 = frame - b;
    if (d1 >= 0) v = Math.max(v, Math.exp(-d1 / 3));
    const d2 = frame - (b + 5);
    if (d2 >= 0) v = Math.max(v, 0.6 * Math.exp(-d2 / 3));
  }
  return v;
};

/** start〜end の間で、間隔 from→to に早まっていく拍のフレーム列 */
export const makeBeats = (start: number, end: number, from: number, to: number): number[] => {
  const out: number[] = [];
  let f = start;
  while (f < end) {
    out.push(Math.round(f));
    const t = (f - start) / Math.max(1, end - start);
    f += from + (to - from) * t;
  }
  return out;
};

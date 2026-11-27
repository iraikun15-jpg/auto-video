import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { STAND } from "../rig/pose";
import { STAND_HIP_Y_OFFSET } from "../rig/StickFigure";
import { BG, FLOOR_Y } from "../rig/theme";
import timing from "./timing.json";

export const FPS = timing.fps;
export const HOLD = timing.holdFrames;
export const segFrames = (id: string): number =>
  timing.segments.find((s) => s.id === id)!.frames;
export const markOf = (seg: string, idx = 0): number =>
  timing.marks.filter((m) => m.segment === seg)[idx].frame;

/** セグメント内のフレーム。末尾 HOLD フレームは動きを止める（後付けナレーション用の間） */
export const useSegFrame = (id: string): number => {
  const frame = useCurrentFrame();
  return Math.min(frame, segFrames(id) - HOLD - 1);
};

export const STAND_Y = FLOOR_Y - STAND_HIP_Y_OFFSET;
export const HERO_STAND = { ...STAND, y: STAND_Y };

export const Canvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {children}
    </svg>
  </AbsoluteFill>
);

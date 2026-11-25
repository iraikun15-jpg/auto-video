import React from "react";
import { Series } from "remotion";
import timing from "./timing.json";
import { SEGMENTS } from "./Segs";

export const JimmuSegments = timing.segments.map((s) => ({ ...s, component: SEGMENTS[s.id] }));
export const JIMMU_TOTAL_FRAMES = timing.segments.reduce((a, s) => a + s.frames, 0);

/** 神武東征 Short 結合版：seg1〜seg8 を順番につなぐ（無音） */
export const Jimmu: React.FC = () => (
  <Series>
    {JimmuSegments.map((s) => (
      <Series.Sequence key={s.id} durationInFrames={s.frames}>
        <s.component />
      </Series.Sequence>
    ))}
  </Series>
);

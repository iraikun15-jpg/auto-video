import React from "react";
import { Series } from "remotion";
import timing from "./timing.json";
import { Seg1 } from "./Seg1";
import { Seg2 } from "./Seg2";
import { Seg3 } from "./Seg3";
import { Seg4 } from "./Seg4";
import { Seg5 } from "./Seg5";

const components: Record<string, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5 };

export const Ep3Segments = timing.segments.map((s) => ({ ...s, component: components[s.id] }));

export const EP3_TOTAL_FRAMES = timing.segments.reduce((a, s) => a + s.frames, 0);

/** 第3話 結合版：seg1〜seg5を順番につなぐ */
export const Ep3: React.FC = () => (
  <Series>
    {Ep3Segments.map((s) => (
      <Series.Sequence key={s.id} durationInFrames={s.frames}>
        <s.component />
      </Series.Sequence>
    ))}
  </Series>
);

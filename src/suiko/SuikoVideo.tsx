import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_SUIKO } from "./Segs";

/** あった？なかった？古代史 第9本「推古天皇はお飾りだったのか」結合版（BGM・効果音入り、ナレーションなし） */
export const Suiko: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_SUIKO[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("suiko/audio.wav")} /> : null}
  </>
);

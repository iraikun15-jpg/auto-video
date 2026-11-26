import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_HIMIKO } from "./Segs";

/** もしも日本史ラボ 第6本「卑弥呼は実在したのか」結合版（BGM・効果音入り、ナレーションなし） */
export const Himiko: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_HIMIKO[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("himiko/audio.wav")} /> : null}
  </>
);

import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_TAKERU } from "./Segs";

/** もしも日本史ラボ 第2本「ヤマトタケルは実在したのか」結合版（BGM・効果音入り、ナレーションなし） */
export const Takeru: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_TAKERU[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("takeru/audio.wav")} /> : null}
  </>
);

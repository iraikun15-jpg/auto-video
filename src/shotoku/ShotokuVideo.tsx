import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_SHOTOKU } from "./Segs";

/** あった？なかった？古代史 第10本「聖徳太子は実在したのか」結合版（BGM・効果音入り、ナレーションなし） */
export const Shotoku: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_SHOTOKU[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("shotoku/audio.wav")} /> : null}
  </>
);

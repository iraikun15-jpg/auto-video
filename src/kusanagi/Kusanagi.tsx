import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_KUSANAGI } from "./Segs";

/** もしも日本史ラボ 第4本「草薙剣は本当にあったのか」結合版（BGM・効果音入り、ナレーションなし） */
export const Kusanagi: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_KUSANAGI[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("kusanagi/audio.wav")} /> : null}
  </>
);

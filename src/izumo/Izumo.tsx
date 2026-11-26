import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_IZUMO } from "./Segs";

/** もしも日本史ラボ 第8本「出雲の国譲りは本当にあったのか」結合版（BGM・効果音入り、ナレーションなし） */
export const Izumo: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_IZUMO[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("izumo/audio.wav")} /> : null}
  </>
);

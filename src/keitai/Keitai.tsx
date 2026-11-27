import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_KEITAI } from "./Segs";

/** もしも日本史ラボ 第7本「継体天皇は実在したのか」結合版（BGM・効果音入り、ナレーションなし） */
export const Keitai: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_KEITAI[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("keitai/audio.wav")} /> : null}
  </>
);

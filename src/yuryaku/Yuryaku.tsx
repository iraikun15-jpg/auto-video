import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_YURYAKU } from "./Segs";

/** もしも日本史ラボ 第5本「雄略天皇は実在したのか」結合版（BGM・効果音入り、ナレーションなし） */
export const Yuryaku: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_YURYAKU[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("yuryaku/audio.wav")} /> : null}
  </>
);

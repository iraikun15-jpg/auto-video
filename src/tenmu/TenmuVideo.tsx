import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_TENMU } from "./Segs";

/** あった？なかった？古代史 Ep11「天武天皇は壬申の乱に負けていたら？」結合版（BGM・効果音入り、ナレーションなし） */
export const Tenmu: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_TENMU[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("tenmu/audio.wav")} /> : null}
  </>
);

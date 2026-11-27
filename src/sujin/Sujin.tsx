import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SEGMENTS } from "./events";
import { SEGMENTS_SUJIN } from "./Segs";

/** もしも日本史ラボ 第3本「本当の初代天皇は崇神？」結合版（BGM・効果音入り、ナレーションなし） */
export const Sujin: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <>
    <Series>
      {SEGMENTS.map((s) => {
        const C = SEGMENTS_SUJIN[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <C />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile("sujin/audio.wav")} /> : null}
  </>
);

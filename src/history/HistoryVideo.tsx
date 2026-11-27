/**
 * 日本史キット：台本データから結合版（BGM・効果音入り）とサムネイルを組み立てる
 */
import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { Person, Sun } from "../jimmu/figures";
import { Stage, Stamp } from "../jimmu/paper";
import { KIN, MINCHO, PAPER, SUMI } from "../jimmu/theme";
import { PartView, SCENE_TYPES } from "./scenes";
import type { HEpisode } from "./types";

export const HistoryVideo: React.FC<{ ep: HEpisode; withAudio?: boolean }> = ({ ep, withAudio = true }) => (
  <>
    <Series>
      {ep.scenes.map((sc, i) => {
        const C = SCENE_TYPES[sc.type];
        return (
          <Series.Sequence key={sc.id} durationInFrames={sc.frames}>
            <C ep={ep} sc={sc} index={i} />
          </Series.Sequence>
        );
      })}
    </Series>
    {withAudio ? <Audio src={staticFile(`history/${ep.id}/audio.wav`)} /> : null}
  </>
);

/** サムネイル：上に朱の判子、中央に部品、下に大きなタイトル＋主役の影（これまでの回と同じ構図） */
export const HistoryThumbnail: React.FC<{ ep: HEpisode }> = ({ ep }) => {
  const lines = ep.thumb.lines;
  const size = (s: string, max: number) => Math.min(max, 820 / ([...s].length * 1.0));
  const big = (s: string, y: number, sz: number) => (
    <text x={420} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={sz} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  const hero = ep.style.hero;
  return (
    <Stage peel={false} look={ep.style.particles} night={ep.style.night ? 1 : 0}>
      <Sun x={540} y={760} r={230} color="#E8C77A" />
      {ep.thumb.parts.map((p, i) => (
        <PartView key={i} p={p} f={0} />
      ))}
      <rect x={0} y={1240} width={1080} height={680} fill="#CBBE9F" opacity={0.45} />
      {ep.thumb.person ? (
        <>
          <Sun x={985} y={1440} r={100} color="#E8C77A" />
          <Person kind={hero.kind} color={hero.color} x={985} y={1880} scale={0.64} flip arm={20} outline outlineColor={hero.outline ?? KIN} />
        </>
      ) : null}
      {lines[0] ? big(lines[0], 1450, size(lines[0], 130)) : null}
      {lines[1] ? big(lines[1], 1630, size(lines[1], 112)) : null}
      {ep.thumb.stamp ? <Stamp x={540} y={205} text={ep.thumb.stamp} size={Math.min(150, 700 / [...ep.thumb.stamp].length)} t={1} rot={-5} /> : null}
    </Stage>
  );
};

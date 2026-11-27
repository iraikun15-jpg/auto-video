/**
 * 日本史キット：台本データから結合版（BGM・効果音入り）とサムネイルを組み立てる
 */
import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { Person, Sun } from "../jimmu/figures";
import { Stage, Stamp } from "../jimmu/paper";
import { KIN } from "../jimmu/theme";
import { PartView, SCENE_TYPES } from "./scenes";
import { WIDE_SCENE_TYPES } from "./scenesWide";
import type { HEpisode } from "./types";
import { FocusLines, Glow, PunchText, Shadowed, Vignette } from "./thumbParts";

export const HistoryVideo: React.FC<{ ep: HEpisode; withAudio?: boolean }> = ({ ep, withAudio = true }) => (
  <>
    <Series>
      {ep.scenes.map((sc, i) => {
        const C = (ep.wide ? WIDE_SCENE_TYPES : SCENE_TYPES)[sc.type];
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

/** 文字数から、横幅 maxW に収まる袋文字の大きさ（フチの分の余白を見込む） */
const punchSize = (s: string, maxW: number, max: number) => Math.min(max, maxW / ([...s].length * 1.0 + 0.6));

/**
 * 横（長尺）のサムネイル：左に袋文字のキャッチ、右に主役と日輪、左上に朱の判子。
 * 右下（幅300×高さ120）は YouTube の再生時間の表示と重なるので何も置かない。
 */
const WideThumbnail: React.FC<{ ep: HEpisode }> = ({ ep }) => {
  const lines = ep.thumb.lines;
  const hero = ep.style.hero;
  const sizes = lines.map((l, i) => punchSize(l, 1080, i === 0 ? 190 : 170));
  return (
    <Stage peel={false} look={ep.style.particles} night={ep.style.night ? 1 : 0} size={{ W: 1920, H: 1080 }}>
      <FocusLines cx={1360} cy={470} W={1920} H={1080} />
      <Glow>
        <Sun x={1360} y={450} r={250} color="#E8C77A" />
      </Glow>
      <Shadowed>
        {ep.thumb.parts.map((p, i) => (
          <PartView key={i} p={p} f={0} />
        ))}
        {ep.thumb.person ? <Person kind={hero.kind} color={hero.color} x={1360} y={1075} scale={1.0} flip arm={20} outline outlineColor={hero.outline ?? KIN} /> : null}
      </Shadowed>
      <Vignette W={1920} H={1080} />
      <PunchText lines={lines} x={620} y={lines.length > 1 ? 470 : 590} sizes={sizes} id="wt" />
      {ep.thumb.stamp ? (
        <Shadowed dx={6} dy={8} blur={4}>
          <Stamp x={330} y={190} text={ep.thumb.stamp} size={Math.min(130, 520 / [...ep.thumb.stamp].length)} t={1} rot={-8} />
        </Shadowed>
      ) : null}
    </Stage>
  );
};

/** 縦（Short）のサムネイル：上に朱の判子、中央に部品と主役、下寄りに袋文字（いちばん下の帯は空ける） */
export const HistoryThumbnail: React.FC<{ ep: HEpisode }> = ({ ep }) => {
  if (ep.wide) return <WideThumbnail ep={ep} />;
  const lines = ep.thumb.lines;
  const hero = ep.style.hero;
  const sizes = lines.map((l, i) => punchSize(l, 980, i === 0 ? 150 : 135));
  return (
    <Stage peel={false} look={ep.style.particles} night={ep.style.night ? 1 : 0}>
      <FocusLines cx={540} cy={780} W={1080} H={1920} />
      <Glow>
        <Sun x={540} y={760} r={230} color="#E8C77A" />
      </Glow>
      <Shadowed>
        {ep.thumb.parts.map((p, i) => (
          <PartView key={i} p={p} f={0} />
        ))}
        {ep.thumb.person ? <Person kind={hero.kind} color={hero.color} x={540} y={1300} scale={0.78} arm={30} outline outlineColor={hero.outline ?? KIN} /> : null}
      </Shadowed>
      <Vignette W={1080} H={1920} />
      <PunchText lines={lines} x={540} y={1440} sizes={sizes} id="vt" />
      {ep.thumb.stamp ? (
        <Shadowed dx={6} dy={8} blur={4}>
          <Stamp x={540} y={240} text={ep.thumb.stamp} size={Math.min(150, 700 / [...ep.thumb.stamp].length)} t={1} rot={-6} />
        </Shadowed>
      ) : null}
    </Stage>
  );
};

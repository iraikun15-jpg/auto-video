/**
 * 台本データ（episodes.generated.json）から動画を組み立てる。
 * 結合版・セグメント別・サムネイルの3種類のコンポーネントを出す。
 */
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Series, useCurrentFrame } from "remotion";
import { jitter, track } from "../rig/pose";
import { StickFigure } from "../rig/StickFigure";
import { BG, BOSS_RED, FONT, INK } from "../rig/theme";
import { Backgrounds, PropView } from "./scenery";
import { characterAt, prepare } from "./timeline";
import type { Episode, TextItem } from "./types";

const W = 1080;
const H = 1920;
const COLORS: Record<string, string> = { ink: INK, red: BOSS_RED };

/** 大きな文字（第2話の「ちょっといい？」と同じ見せ方）。「／」か改行で行を分ける */
const BigText: React.FC<{ item: TextItem; f: number; animate: boolean }> = ({ item, f, animate }) => {
  const lines = item.text.split(/\n|／/);
  const longest = Math.max(...lines.map((l) => [...l].length));
  // 横幅に収まる大きさに自動で縮める
  const size = Math.min(item.size ?? 170, 980 / Math.max(1, longest));
  const lineH = size * 1.12;
  const baseY = item.y ?? { 上: 430, 中: 900, 下: 1720 }[item.place ?? "上"] ?? 430;
  const top = baseY - ((lines.length - 1) * lineH) / 2;
  const t = f - item.start;
  const k = animate ? track(t, [[0, 0], [8, 1]], Easing.out(Easing.back(2.2))) : 1;
  const shake = animate && t > 8 && t < 30 ? jitter(t, 2, 7) : 0;
  if (animate && (t < 0 || (item.end !== undefined && f >= item.end))) return null;
  return (
    <g opacity={Math.min(1, k * 2)} transform={`translate(${540 + shake} ${top}) scale(${1.6 - 0.6 * k})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={i * lineH + size * 0.35}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={size}
          fill={COLORS[item.color] ?? INK}
          stroke={BG}
          strokeWidth={size * 0.07}
          paintOrder="stroke"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

/** 結合版でのフレーム f の画面（文字は texts で渡す） */
const Scene: React.FC<{ ep: Episode; f: number; texts: TextItem[]; animateText: boolean }> = ({ ep, f, texts, animateText }) => {
  const prep = useMemo(() => prepare(ep), [ep]);
  const Bg = Backgrounds[ep.background] ?? Backgrounds.floor;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Bg />
        {ep.props.filter((p) => !p.front).map((p, i) => (
          <PropView key={`b${i}`} item={p} f={f} />
        ))}
        {Object.keys(ep.cast).map((name) => {
          const c = ep.cast[name];
          const s = characterAt(ep, prep, name, f);
          if (!s.visible) return null;
          return <StickFigure key={name} pose={s.pose} facing={s.facing} color={COLORS[c.color]} tie={c.tie} />;
        })}
        {ep.props.filter((p) => p.front).map((p, i) => (
          <PropView key={`f${i}`} item={p} f={f} />
        ))}
        {texts.map((t, i) => (
          <BigText key={i} item={t} f={f} animate={animateText} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** セグメント1つ分。末尾の「静止」フレームは動きを止める */
export const EpisodeSegment: React.FC<{ ep: Episode; index: number }> = ({ ep, index }) => {
  const frame = useCurrentFrame();
  const seg = ep.segments[index];
  const local = Math.min(frame, seg.frames - ep.hold - 1);
  return <Scene ep={ep} f={seg.start + local} texts={seg.texts} animateText />;
};

/** 結合版：セグメントを順につなぐ */
export const EpisodeFull: React.FC<{ ep: Episode }> = ({ ep }) => (
  <Series>
    {ep.segments.map((s, i) => (
      <Series.Sequence key={s.id} durationInFrames={s.frames}>
        <EpisodeSegment ep={ep} index={i} />
      </Series.Sequence>
    ))}
  </Series>
);

/** サムネイル：指定した時刻の画面に、サムネイル用の文字を重ねる */
export const EpisodeThumbnail: React.FC<{ ep: Episode }> = ({ ep }) => (
  <Scene ep={ep} f={ep.thumbnail.frame} texts={ep.thumbnail.texts.map((t) => ({ ...t, start: 0 }))} animateText={false} />
);

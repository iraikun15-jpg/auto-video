/**
 * 日本史キット：横（長尺・1920×1080）の場面の型。
 * 中身（台本の文言・タイミング）は縦と同じデータを使い、配置だけ横長に組み直している。
 * 共通の台紙・判子・札・部品・人物は scenes.tsx の Frame / Figure を使う。
 */
import React from "react";
import { Easing, interpolate } from "remotion";
import { Crow, Sun } from "../jimmu/figures";
import { clamp01, MapLayer, PlaceLabel, pop, ramp, Route, Stamp, sway, Tag } from "../jimmu/paper";
import { Cam, LL } from "../jimmu/geo";
import { CHANNEL, KIN, MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";
import { DreamVeil, RecordGrid, VerdictStamp } from "../shotoku/parts";
import { LANDS_ALL } from "../takeru/geo";
import { Figure, fit, Frame, KANJI_NUM, KIN_LIGHT, P, useSceneFrame } from "./scenes";
import type { HScene } from "./types";

/** 大きな板に1〜2行の見出し（フック・タイトル） */
const Board: React.FC<{ lines: string[]; x: number; y: number; w: number; h: number; bg: string; color: string; size: number }> = ({ lines, x, y, w, h, bg, color, size }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={bg} opacity={0.94} />
    <rect x={-w / 2 + 16} y={-h / 2 + 16} width={w - 32} height={h - 32} rx={10} fill="none" stroke={KIN} strokeWidth={6} />
    {lines.map((l, i) => (
      <text key={i} x={0} y={lines.length === 1 ? size * 0.36 : -size * 0.32 + i * size * 1.32} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={i === 1 ? KIN_LIGHT : color}>
        {l}
      </text>
    ))}
  </g>
);

const Hook: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const slam = interpolate(f, [0, 4, 7], [1.08, 0.97, 1], { extrapolateRight: "clamp" });
  const shake = f < 12 ? Math.sin(f * 2.7) * (12 - f) * 1.2 : 0;
  const big = sc.big ?? [];
  const size = Math.min(...big.map((l) => fit(l, 1300, 120)));
  return (
    <Frame ep={ep} sc={{ ...sc, note: undefined }} f={f} index={index} stampPos={[700, 820, 120]}>
      <Figure ep={ep} sc={sc} f={f} x={1560} y={1070} s={0.85} flip />
      <g transform={`translate(${shake},0) translate(820,330) scale(${slam}) translate(-820,-330)`}>
        <Board lines={big} x={820} y={330} w={1440} h={big.length > 1 ? 380 : 260} bg={ep.style.tagBg} color={ep.style.tagColor} size={size} />
      </g>
      {sc.note ? <Tag x={700} y={620} text={sc.note.text} size={fit(sc.note.text, 1100, 56)} t={pop(f, -6, 8)} rot={-1.5} bg={sc.note.bg} color={PAPER} /> : null}
    </Frame>
  );
};

const Title: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const big = sc.big ?? [];
  const size = Math.min(...big.map((l) => fit(l, 1100, 140)));
  const t = pop(f, 4, 14);
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[1100, 880, 100]} noteX={1100} noteY={760}>
      <Sun x={330} y={560} r={210} rot={f * 0.2} opacity={0.7} color={KIN_LIGHT} />
      <Figure ep={ep} sc={sc} f={f} x={330} y={1070} s={0.85} />
      <g opacity={clamp01(t * 2)} transform={`translate(1100,420) scale(${interpolate(t, [0, 1], [0.85, 1])}) translate(-1100,-420)`}>
        <Board lines={big} x={1100} y={420} w={1240} h={big.length > 1 ? 440 : 280} bg={ep.style.tagBg} color={ep.style.tagColor} size={size} />
      </g>
    </Frame>
  );
};

const Chapter: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const title = sc.chapterTitle ?? "";
  const line = ramp(f, 14, 34);
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[1500, 820, 90]}>
      <Tag x={960} y={330} text={`第${KANJI_NUM[sc.chapterNo ?? 1] ?? sc.chapterNo}章`} size={70} t={pop(f, 2, 10)} rot={-2} bg={ep.style.tagBg} color={ep.style.tagColor} />
      <Tag x={960} y={540} text={title} size={fit(title, 1500, 130)} t={pop(f, 10, 14)} rot={1} bg={PAPER} color={SUMI} />
      <rect x={960 - 560 * line} y={680} width={1120 * line} height={8} fill={KIN} />
      <Figure ep={ep} sc={sc} f={f} x={1700} y={1070} s={0.55} opacity={0.9} flip />
    </Frame>
  );
};

const Intro: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const n = sc.name!;
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[1560, 860, 96]} noteX={1180} noteY={1000}>
      <Figure ep={ep} sc={sc} f={f} x={420} y={1070} s={0.85} />
      {n.note ? <Tag x={1180} y={330} text={n.note} size={fit(n.note, 900, 54)} t={pop(f, n.at[0], 10)} rot={2} bg={PAPER} color={SUMI} /> : null}
      <Tag x={1180} y={520} text={n.big} size={fit(n.big, 1100, 150)} t={pop(f, n.at[1], 12)} rot={-1} bg={ep.style.tagBg} color={ep.style.tagColor} />
      {n.reading ? <Tag x={1180} y={700} text={n.reading} size={fit(n.reading, 800, 48)} t={pop(f, n.at[2], 10)} rot={1} bg={PAPER} color={SUMI} /> : null}
    </Frame>
  );
};

/** 年表：横の軸。年の札が上、出来事の札が下 */
const Timeline: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const items = sc.items ?? [];
  const n = Math.max(1, items.length);
  const x0 = 260;
  const step = n > 1 ? 1400 / (n - 1) : 0;
  const lineT = ramp(f, 4, items.length ? items[items.length - 1].at + 10 : 20);
  const cardW = n > 1 ? Math.min(560, step * 0.95) : 900;
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[1640, 880, 90]} noteX={820}>
      <rect x={x0 - 60} y={516} width={(1400 + 120) * lineT} height={10} fill={SUMI} opacity={0.75} />
      {items.map((it, i) => {
        const x = n > 1 ? x0 + i * step : 960;
        const t = pop(f, it.at, 12);
        return (
          <g key={i}>
            <circle cx={x} cy={521} r={18 * t} fill={SHU} />
            {it.year ? <Tag x={x} y={420} text={it.year} size={fit(it.year, cardW, 60)} t={t} rot={-2} bg={ep.style.tagBg} color={ep.style.tagColor} /> : null}
            <Tag x={x} y={640 + (i % 2) * 120} text={it.text} size={fit(it.text, cardW, 54)} t={pop(f, it.at + 4, 12)} rot={i % 2 ? 1.2 : -1.2} bg={PAPER} color={SUMI} />
          </g>
        );
      })}
      <Figure ep={ep} sc={sc} f={f} x={140} y={1070} s={0.42} />
    </Frame>
  );
};

/** 箇条・語り・まとめ：左に人物、右に札の列 */
const ListLike: React.FC<P & { kind: "points" | "narration" | "summary" }> = ({ ep, sc, index, kind }) => {
  const f = useSceneFrame(sc, ep.hold);
  const items = sc.items ?? [];
  const step = Math.min(150, 760 / Math.max(1, items.length));
  const top = sc.heading || kind === "summary" ? 280 : 200;
  const s2 = kind === "summary" ? { ...sc, heading: sc.heading ?? "まとめ" } : sc;
  return (
    <Frame ep={ep} sc={s2} f={f} index={index} stampPos={[1620, 880, 96]} noteX={1150}>
      <Figure ep={ep} sc={sc} f={f} x={kind === "narration" ? 400 : 300} y={1070} s={kind === "narration" ? 0.95 : 0.75} />
      {items.map((it, i) => {
        const y = top + i * step;
        const t = pop(f, it.at, 12);
        const last = kind === "points" && i === items.length - 1;
        return (
          <g key={i}>
            {kind === "summary" ? <circle cx={760} cy={y} r={26 * t} fill={SHU} /> : null}
            <Tag
              x={kind === "summary" ? 1260 : 1180 + (i % 2 ? 30 : -30)}
              y={y}
              text={it.text}
              size={fit(it.text, 900, 62)}
              t={t}
              rot={i % 2 ? 1.2 : -1.2}
              bg={last ? ep.style.tagBg : PAPER}
              color={last ? ep.style.tagColor : SUMI}
            />
          </g>
        );
      })}
    </Frame>
  );
};

/** 地図：右に地図の紙、左に人物 */
const MapScene: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const places = sc.places ?? [];
  const rect: [number, number, number, number] = [560, 190, 1300, 820];
  const cx = rect[0] + rect[2] / 2;
  const cy = rect[1] + rect[3] / 2;
  const lons = places.map((p) => p.lon);
  const lats = places.map((p) => p.lat);
  const dLon = Math.max(0.6, Math.max(...lons) - Math.min(...lons));
  const dLat = Math.max(0.5, Math.max(...lats) - Math.min(...lats));
  const zoom = Math.max(0.5, Math.min(7, 1000 / (dLon * 138), 600 / ((dLat * 138) / 0.82)));
  const cam: Cam = { lon: (Math.max(...lons) + Math.min(...lons)) / 2, lat: (Math.max(...lats) + Math.min(...lats)) / 2, zoom, cx, cy };
  const proj = (p: { lon: number; lat: number }): [number, number] => [cx + (p.lon - cam.lon) * 138 * zoom, cy - (p.lat - cam.lat) * (138 / 0.82) * zoom];
  const route: LL[] = places.map((p) => [p.lon, p.lat]);
  const first = places[0]?.at ?? 0;
  const lastAt = places[places.length - 1]?.at ?? 0;
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[290, 380, 80]} noteX={290} noteY={260}>
      <MapLayer cam={cam} lands={LANDS_ALL} seaRect={rect} />
      {sc.route && places.length > 1 ? <Route cam={cam} route={route} t={ramp(f, first + 6, lastAt + 6, Easing.inOut(Easing.cubic))} /> : null}
      {places.map((p, i) => {
        const [x, y] = proj(p);
        return <PlaceLabel key={i} x={x} y={y} text={p.name} t={pop(f, p.at, 10)} dx={x > 1700 ? -46 : 46} dy={-30} />;
      })}
      <Figure ep={ep} sc={sc} f={f} x={290} y={1070} s={0.72} />
    </Frame>
  );
};

const Compare: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const panel = (side: NonNullable<HScene["left"]>, x0: number, cid: string) => {
    const t = pop(f, side.at, 12);
    if (t <= 0) return null;
    const w = 820;
    const cx = x0 + w / 2;
    return (
      <g opacity={clamp01(t * 2)} transform={`translate(${cx},540) scale(${interpolate(t, [0, 1], [0.7, 1])}) translate(${-cx},-540)`}>
        <g filter="url(#paper)">
          <rect x={x0} y={200} width={w} height={660} fill={side.texture === "dream" ? "#E6DDF5" : PAPER} />
        </g>
        <clipPath id={cid}>
          <rect x={x0} y={200} width={w} height={660} />
        </clipPath>
        <g clipPath={`url(#${cid})`}>
          {side.texture === "dream" ? (
            <g transform={`translate(${x0},0) scale(0.76,0.56)`}>
              <DreamVeil f={f} t={0.9} id={`${cid}dv`} />
            </g>
          ) : side.texture === "record" ? (
            <g transform={`translate(${x0},200)`}>
              <RecordGrid t={1} />
            </g>
          ) : null}
        </g>
        <Tag x={cx} y={270} text={side.heading} size={fit(side.heading, 700, 54)} bg={side.color} color={PAPER} />
        {side.items.map((it, i) => (
          <Tag key={i} x={cx} y={430 + i * 130} text={it} size={fit(it, 720, 54)} t={pop(f, side.at + 10 + i * 8, 10)} rot={i % 2 ? 1.5 : -1.5} bg={PAPER} color={SUMI} />
        ))}
      </g>
    );
  };
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[960, 940, 80]} noteX={960} noteY={1010}>
      {panel(sc.left!, 110, `${sc.id}l`)}
      {panel(sc.right!, 990, `${sc.id}r`)}
    </Frame>
  );
};

const IfCase: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const col = (items: string[], times: number[], x: number, solid: boolean) => {
    const step = Math.min(170, 640 / Math.max(1, items.length));
    return items.map((it, i) => {
      const y = 330 + i * step;
      const t = pop(f, times[i], 12);
      return (
        <g key={i}>
          {i > 0 ? <path d={`M${x},${y - step + 50} L${x},${y - 50}`} stroke={solid ? SUMI : SHU} strokeWidth={8} strokeDasharray={solid ? undefined : "14 12"} opacity={clamp01(t * 2)} /> : null}
          {solid ? (
            <Tag x={x} y={y} text={it} size={fit(it, 640, 54)} t={t} rot={i % 2 ? 1 : -1} bg={PAPER} color={SUMI} />
          ) : (
            <g opacity={clamp01(t * 2)}>
              <rect x={x - 330} y={y - 48} width={660} height={96} rx={8} fill="none" stroke={SHU} strokeWidth={6} strokeDasharray="16 12" />
              <text x={x} y={y + 18} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={fit(it, 620, 54)} fill={SHU}>
                {it}
              </text>
            </g>
          )}
        </g>
      );
    });
  };
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[1640, 900, 90]} noteX={900}>
      <Tag x={620} y={220} text="史実" size={56} t={pop(f, 4, 10)} bg={SUMI} color={PAPER} />
      <Tag x={1340} y={220} text="もしも" size={56} t={pop(f, (sc.whatAt ?? [40])[0] - 6, 10)} bg={SHU} color={PAPER} />
      {col(sc.fact ?? [], sc.factAt ?? [], 620, true)}
      {col(sc.what ?? [], sc.whatAt ?? [], 1340, false)}
      <Figure ep={ep} sc={sc} f={f} x={140} y={1070} s={0.45} opacity={0.9} />
    </Frame>
  );
};

const Verdict: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const v = sc.verdict ?? [];
  const vt = ramp(f, sc.verdictAt ?? 2, (sc.verdictAt ?? 2) + 10);
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[1200, 960, 80]} noteX={1200} noteY={820}>
      <Sun x={400} y={560} r={190} rot={f * 0.3} opacity={0.8} color={KIN_LIGHT} />
      <Figure ep={ep} sc={sc} f={f} x={400} y={1070} s={0.72} />
      <VerdictStamp x={1200} y={500} t={vt} l1={v[0] ?? ""} l2={v[1] ?? ""} c1={SHU} c2={v.length > 1 ? SUMI : SHU} />
      {sc.gold ? <Stamp x={1700} y={720} text={sc.gold} size={fit(sc.gold, 260, 84)} t={ramp(f, sc.goldAt!, sc.goldAt! + 10)} rot={12} round color={KIN} /> : null}
    </Frame>
  );
};

const Choice: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const card = (x: number, letter: string, lines: string[], color: string, at: number, seed: number) => {
    const t = pop(f, at, 12);
    if (t <= 0) return null;
    const wob = f > at + 12 ? sway(f, seed, 2.2, 0.12) : 0;
    const size = Math.min(...lines.map((l) => fit(l, 560, 66)));
    return (
      <g transform={`translate(${x},560) rotate(${(seed === 1 ? -3 : 3) + wob}) scale(${interpolate(t, [0, 1], [0.3, 1])})`} opacity={clamp01(t * 2)}>
        <g filter="url(#paper)">
          <rect x={-310} y={-300} width={620} height={600} rx={10} fill={color} />
        </g>
        <rect x={-286} y={-276} width={572} height={552} rx={6} fill="none" stroke={PAPER} strokeWidth={5} opacity={0.75} />
        <text x={0} y={-80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={190} fill={PAPER}>
          {letter}
        </text>
        {lines.map((l, i) => (
          <text key={i} x={0} y={80 + i * size * 1.45} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={PAPER}>
            {l}
          </text>
        ))}
      </g>
    );
  };
  const s2 = { ...sc, heading: sc.heading ?? "君はどっち派？", note: sc.note ?? { text: "コメントで教えてね", at: 40, bg: SUMI } };
  return (
    <Frame ep={ep} sc={s2} f={f} index={index} stampPos={[960, 960, 70]} noteY={980}>
      <Figure ep={ep} sc={sc} f={f} x={200} y={1070} s={0.55} />
      {card(640, "A", sc.a ?? [], ep.style.tagBg, 12, 1)}
      {card(1280, "B", sc.b ?? [], SHU, 22, 2)}
    </Frame>
  );
};

const Subscribe: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const PRESS = sc.clickAt ?? 46;
  const btnIn = pop(f, 6, 12);
  const pressed = ramp(f, PRESS, PRESS + 3) - ramp(f, PRESS + 5, PRESS + 12) * 0.6;
  const bx = 960;
  const by = 500;
  const fly = ramp(f, 12, PRESS - 4, Easing.out(Easing.cubic));
  const peck = Math.max(0, Math.sin(clamp01((f - (PRESS - 6)) / 10) * Math.PI));
  const crowX = interpolate(fly, [0, 1], [2200, bx + 300]);
  const crowY = interpolate(fly, [0, 1], [150, by - 190]) + peck * 75 - ramp(f, PRESS + 8, PRESS + 30) * 40;
  const s2 = { ...sc, heading: sc.heading ?? "この動画がよかったら" };
  return (
    <Frame ep={ep} sc={s2} f={f} index={index} stampPos={[960, 790, 84]}>
      <Sun x={400} y={560} r={150} rot={f * 0.4} opacity={0.75 * ramp(f, 0, 14)} />
      {btnIn > 0 ? (
        <g transform={`translate(${bx},${by + pressed * 10}) scale(${interpolate(btnIn, [0, 1], [0.3, 1]) * (1 - pressed * 0.05)})`} opacity={clamp01(btnIn * 2)}>
          <g filter={pressed > 0.5 ? "url(#paperLow)" : "url(#paper)"}>
            <rect x={-380} y={-120} width={760} height={240} rx={120} fill={SHU} />
          </g>
          <rect x={-356} y={-96} width={712} height={192} rx={96} fill="none" stroke={PAPER} strokeWidth={5} opacity={0.6} />
          <path d="M-305,-42 L-232,0 L-305,42Z" fill={PAPER} />
          <text x={72} y={30} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={84} fill={PAPER}>
            チャンネル登録
          </text>
        </g>
      ) : null}
      {f >= PRESS && f < PRESS + 16 ? (
        <g opacity={1 - ramp(f, PRESS, PRESS + 16)}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r0 = 260 + ramp(f, PRESS, PRESS + 16) * 160;
            return <rect key={i} x={-8} y={-40} width={16} height={60} fill={KIN} transform={`translate(${bx + Math.cos(a) * r0 * 1.4},${by + Math.sin(a) * r0 * 0.6}) rotate(${(a * 180) / Math.PI + 90})`} />;
          })}
        </g>
      ) : null}
      {f >= 10 ? <Crow x={crowX} y={crowY} scale={1.05} flap={f < PRESS - 4 ? Math.sin(f * 0.8) : Math.sin(f * 0.25) * 0.3} flip /> : null}
      <Tag x={960} y={960} text={CHANNEL} size={60} t={pop(f, Math.min(86, sc.frames - ep.hold - 20), 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Frame>
  );
};

export const WIDE_SCENE_TYPES: Record<HScene["type"], React.FC<P>> = {
  hook: Hook,
  title: Title,
  chapter: Chapter,
  intro: Intro,
  timeline: Timeline,
  map: MapScene,
  points: (p) => <ListLike {...p} kind="points" />,
  narration: (p) => <ListLike {...p} kind="narration" />,
  summary: (p) => <ListLike {...p} kind="summary" />,
  compare: Compare,
  ifcase: IfCase,
  verdict: Verdict,
  choice: Choice,
  subscribe: Subscribe,
};

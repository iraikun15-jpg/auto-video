/**
 * 日本史キットの場面の型（フック・紹介・年表・地図・箇条・対比・IF・判定・二択・登録）。
 * 台本（history/*.yaml → generated.json）の文言とタイミングを、これまでの回と同じ切り絵の部品で描く。
 * 回ごとの見せ場（特別な部品）は「部品」で足すか、必要なら src/<回>/ に専用の場面を作って組み合わせる。
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Boar, Crow, Person, Sun, Swan, Sword } from "../jimmu/figures";
import { clamp01, CloudShape, Heading, MapLayer, Mountains, PlaceLabel, pop, ramp, Route, Stage, Stamp, sway, Tag } from "../jimmu/paper";
import { Cam, LL } from "../jimmu/geo";
import { CHANNEL, KIN, KUSA, MINCHO, PAPER, PAPER_DARK, SHU, SUMI } from "../jimmu/theme";
import { Mirror, GoldSeal, WeiPalace, Mound, Magnifier } from "../himiko/parts";
import { BronzeSword, Dotaku, TallShrine } from "../izumo/parts";
import { Boat, GlowSword, SakeJar, Shrine } from "../kusanagi/parts";
import { Cap, DreamVeil, Horyuji, Letter, RecordGrid, Scroll, VerdictStamp } from "../shotoku/parts";
import { Kofun, Palace, Torii } from "../sujin/yamato";
import { LANDS_ALL } from "../takeru/geo";
import { IronSword } from "../yuryaku/parts";
import type { HEpisode, HPart, HPerson, HScene } from "./types";

const KIN_LIGHT = "#E8C77A";

/** 文字数から、横幅 maxW に収まる札の文字の大きさ */
const fit = (text: string, maxW: number, max: number) => Math.min(max, maxW / ([...text].length * 0.98 + 0.9));

/** 場面内のフレーム。末尾の静止フレームは止める */
const useSceneFrame = (sc: HScene, hold: number) => Math.min(useCurrentFrame(), sc.frames - hold - 1);

/** 部品（日輪・法隆寺など）。at から紙がペタッと貼られるように出る */
export const PartView: React.FC<{ p: HPart; f: number }> = ({ p, f }) => {
  const t = p.at <= 0 ? 1 : pop(f, p.at, 12);
  if (t <= 0) return null;
  const { x, y, s } = p;
  let el: React.ReactNode = null;
  switch (p.name) {
    case "sun":
      el = <Sun x={x} y={y} r={150 * s} rot={f * 0.3} color={p.color ?? KIN_LIGHT} opacity={0.85} />;
      break;
    case "crow":
      el = <Crow x={x} y={y} scale={s} flap={Math.sin(f * 0.3) * 0.6} />;
      break;
    case "swan":
      el = <Swan x={x} y={y} scale={s} flap={Math.sin(f * 0.25)} />;
      break;
    case "boar":
      el = <Boar x={x} y={y} scale={s} step={f * 0.3} />;
      break;
    case "sword":
      el = <Sword x={x} y={y} scale={s} color={p.color} />;
      break;
    case "glowSword":
      el = <GlowSword x={x} y={y} s={s} glow={0.7 + 0.3 * Math.sin(f * 0.15)} />;
      break;
    case "ironSword":
      el = <IronSword x={x} y={y} s={s} len={900} />;
      break;
    case "bronzeSword":
      el = <BronzeSword x={x} y={y} s={s} />;
      break;
    case "dotaku":
      el = <Dotaku x={x} y={y} s={s} />;
      break;
    case "mirror":
      el = <Mirror x={x} y={y} r={120 * s} shine={0.5 + 0.5 * Math.sin(f * 0.1)} />;
      break;
    case "goldSeal":
      el = <GoldSeal x={x} y={y} s={s} />;
      break;
    case "scroll":
      el = <Scroll x={x} y={y} open={t} w={700 * s} h={360 * s} />;
      break;
    case "letter":
      el = <Letter x={x} y={y} t={t} s={s} />;
      break;
    case "horyuji":
      el = <Horyuji x={x} y={y} s={s} />;
      break;
    case "shrine":
      el = <Shrine x={x} y={y} s={s} />;
      break;
    case "tallShrine":
      el = <TallShrine x={x} y={y} s={s} />;
      break;
    case "palace":
      el = <Palace x={x} y={y} s={s} />;
      break;
    case "weiPalace":
      el = <WeiPalace x={x} y={y} s={s} />;
      break;
    case "torii":
      el = <Torii x={x} y={y} s={s} />;
      break;
    case "kofun":
      el = <Kofun x={x} y={y} s={s} />;
      break;
    case "mound":
      el = <Mound x={x} y={y} t={t} people={6} />;
      break;
    case "boat":
      el = <Boat x={x} y={y} s={s} tilt={Math.sin(f * 0.08) * 3} />;
      break;
    case "sakeJar":
      el = <SakeJar x={x} y={y} s={s} />;
      break;
    case "magnifier":
      el = <Magnifier x={x} y={y} s={s} />;
      break;
    case "cloud":
      el = <CloudShape x={x - 150 * s + Math.sin(f * 0.02) * 20} y={y} w={300 * s} />;
      break;
    case "mountains":
      el = <Mountains x={x - 450 * s} baseY={y} w={900 * s} h={320 * s} colors={[PAPER_DARK, KUSA]} />;
      break;
    case "cap":
      el = <Cap x={x} y={y} s={s} color={p.color ?? SHU} />;
      break;
  }
  // 自前で出方を持つ部品（巻物・国書・塚）以外は、紙が貼られるように少し拡大して出す
  const self = p.name === "scroll" || p.name === "letter" || p.name === "mound";
  return self ? <>{el}</> : (
    <g opacity={clamp01(t * 2)} transform={`translate(${x},${y}) scale(${interpolate(t, [0, 1], [0.6, 1])}) translate(${-x},${-y})`}>
      {el}
    </g>
  );
};

/** 人物（影絵）。型ごとの既定の位置に、台本の指定を重ねる */
const Figure: React.FC<{ ep: HEpisode; sc: HScene; f: number; x: number; y: number; s: number; flip?: boolean; opacity?: number }> = ({ ep, sc, f, x, y, s, flip, opacity = 1 }) => {
  if (sc.person === null) return null;
  const p: HPerson = sc.person ?? ep.style.hero;
  const outlineColor = p.outline ?? (ep.style.night ? KIN : undefined);
  return (
    <Person
      kind={p.kind}
      color={p.color}
      x={p.x ?? x}
      y={p.y ?? y}
      scale={p.s ?? s}
      flip={p.flip || flip}
      arm={50 + sway(f, 1, 6)}
      outline={outlineColor ? true : undefined}
      outlineColor={outlineColor}
      opacity={opacity}
    />
  );
};

/** 台紙＋共通の重ね物（部品・判子・下の札）。型ごとの中身は children */
const Frame: React.FC<{
  ep: HEpisode;
  sc: HScene;
  f: number;
  index: number;
  stampPos: [number, number, number];
  noteY?: number;
  noteX?: number;
  children: React.ReactNode;
  under?: React.ReactNode;
}> = ({ ep, sc, f, index, stampPos, noteY = 1790, noteX = 540, children, under }) => {
  const head = { bg: ep.style.tagBg, color: ep.style.tagColor };
  return (
    <Stage f={f} look={ep.style.particles} fx={ep.style.particles} trans={ep.style.transition} peel={index > 0} night={ep.style.night ? 1 : 0}>
      {under}
      {children}
      {/* 部品は型の中身より手前（地図の上の舟など） */}
      {sc.parts.map((p, i) => (
        <PartView key={`p${i}`} p={p} f={f} />
      ))}
      {sc.heading ? <Heading text={sc.heading} t={pop(f, 0, 10)} y={200} size={fit(sc.heading, 960, 84)} {...head} /> : null}
      {sc.stamps.map((st, i) => (
        <Stamp
          key={`s${i}`}
          x={st.x ?? stampPos[0]}
          y={st.y ?? stampPos[1] - i * 190}
          text={st.text}
          size={st.size ?? fit(st.text, 520, stampPos[2])}
          t={ramp(f, st.at, st.at + 10)}
          rot={i % 2 ? 6 : -6}
          round={st.round}
          color={st.color}
        />
      ))}
      {sc.note ? <Tag x={noteX} y={noteY} text={sc.note.text} size={fit(sc.note.text, 1040 - 2 * Math.abs(noteX - 540), 52)} t={pop(f, sc.note.at, 12)} rot={-1.5} bg={sc.note.bg} color={PAPER} /> : null}
    </Stage>
  );
};

// =====================================================================
// 型ごとの画面
// =====================================================================
type P = { ep: HEpisode; sc: HScene; index: number };

/** フック：0フレーム目から大見出しを叩きつける（拍子木＋太鼓）。判子は0フレーム目に着く */
const Hook: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const slam = interpolate(f, [0, 4, 7], [1.08, 0.97, 1], { extrapolateRight: "clamp" });
  const shake = f < 12 ? Math.sin(f * 2.7) * (12 - f) * 1.2 : 0;
  const big = sc.big ?? [];
  const size = Math.min(...big.map((l) => fit(l, 900, 110)));
  return (
    <Frame ep={ep} sc={{ ...sc, note: undefined }} f={f} index={index} stampPos={[540, 800, 130]}>
      <Figure ep={ep} sc={sc} f={f} x={540} y={1880} s={0.95} />
      <g transform={`translate(${540 + shake},330) scale(${slam})`}>
        <rect x={-500} y={-190} width={1000} height={370} rx={14} fill={ep.style.tagBg} opacity={0.94} />
        <rect x={-484} y={-174} width={968} height={338} rx={10} fill="none" stroke={KIN} strokeWidth={6} />
        {big.map((l, i) => (
          <text key={i} x={0} y={big.length === 1 ? 36 : -36 + i * 146} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={i === 1 ? KIN_LIGHT : ep.style.tagColor}>
            {l}
          </text>
        ))}
      </g>
      {sc.note ? <Tag x={540} y={600} text={sc.note.text} size={fit(sc.note.text, 900, 56)} t={pop(f, -6, 8)} rot={-1.5} bg={sc.note.bg} color={PAPER} /> : null}
    </Frame>
  );
};

/** 紹介：縦書きの大きな名前＋読み＋注、人物は左に */
const Intro: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const n = sc.name!;
  const len = [...n.big].length;
  const size = Math.min(124, 760 / (len * 1.02));
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[830, 1560, 100]}>
      <Figure ep={ep} sc={sc} f={f} x={300} y={1640} s={0.9} />
      {n.note ? <Tag x={720} y={400} text={n.note} size={fit(n.note, 600, 50)} t={pop(f, n.at[0], 10)} rot={2} bg={PAPER} color={SUMI} /> : null}
      <Tag x={720} y={490 + (len * size * 1.02) / 2 + 30} text={n.big} size={size} t={pop(f, n.at[1], 12)} rot={-1} bg={ep.style.tagBg} color={ep.style.tagColor} vertical />
      {n.reading ? <Tag x={720} y={560 + len * size * 1.02 + 80} text={n.reading} size={fit(n.reading, 560, 40)} t={pop(f, n.at[2], 10)} rot={1} bg={PAPER} color={SUMI} /> : null}
    </Frame>
  );
};

/** 年表：左に縦の軸、年の丸札と出来事の札が順に貼られる */
const Timeline: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const items = sc.items ?? [];
  const top = 420;
  const step = Math.min(320, 1030 / Math.max(1, items.length));
  const lineT = ramp(f, 4, items.length ? items[items.length - 1].at + 10 : 20);
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[300, 1620, 96]} noteX={440}>
      <Figure ep={ep} sc={sc} f={f} x={920} y={1890} s={0.52} flip />
      <rect x={196} y={top - 40} width={10} height={(items.length - 0.4) * step * lineT + 40} fill={SUMI} opacity={0.75} />
      {items.map((it, i) => {
        const y = top + i * step;
        const t = pop(f, it.at, 12);
        return (
          <g key={i}>
            {it.year ? <Tag x={200} y={y} text={it.year} size={fit(it.year, 250, 54)} t={t} rot={-2} bg={ep.style.tagBg} color={ep.style.tagColor} font={MINCHO} /> : <circle cx={201} cy={y} r={16 * t} fill={SHU} />}
            <Tag x={640} y={y} text={it.text} size={fit(it.text, 700, 60)} t={pop(f, it.at + 4, 12)} rot={i % 2 ? 1.2 : -1.2} bg={PAPER} color={SUMI} />
          </g>
        );
      })}
    </Frame>
  );
};

/** 箇条：札が上から順に貼られていく */
const Points: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const items = sc.items ?? [];
  const step = Math.min(210, 1000 / Math.max(1, items.length));
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[760, 1600, 100]} noteX={620}>
      <Figure ep={ep} sc={sc} f={f} x={170} y={1890} s={0.55} />
      {items.map((it, i) => (
        <Tag
          key={i}
          x={540 + (i % 2 ? 40 : -40)}
          y={440 + i * step}
          text={it.text}
          size={fit(it.text, 900, 70)}
          t={pop(f, it.at, 12)}
          rot={i % 2 ? 1.5 : -1.5}
          bg={i === items.length - 1 ? ep.style.tagBg : PAPER}
          color={i === items.length - 1 ? ep.style.tagColor : SUMI}
        />
      ))}
    </Frame>
  );
};

/** 地図：地点が順に立ち、朱の線でつながる（九州〜東北の南部まで） */
const MapScene: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const places = sc.places ?? [];
  // 地点がすべて入るようにカメラを決める（地図の紙は y=330〜1230）
  const lons = places.map((p) => p.lon);
  const lats = places.map((p) => p.lat);
  const dLon = Math.max(0.6, Math.max(...lons) - Math.min(...lons));
  const dLat = Math.max(0.5, Math.max(...lats) - Math.min(...lats));
  const zoom = Math.max(0.6, Math.min(7, 760 / (dLon * 138), 620 / ((dLat * 138) / 0.82)));
  const cam: Cam = { lon: (Math.max(...lons) + Math.min(...lons)) / 2, lat: (Math.max(...lats) + Math.min(...lats)) / 2, zoom, cy: 790 };
  const proj = (p: { lon: number; lat: number }): [number, number] => {
    const PX = 138;
    return [540 + (p.lon - cam.lon) * PX * zoom, 790 - (p.lat - cam.lat) * (PX / 0.82) * zoom];
  };
  const route: LL[] = places.map((p) => [p.lon, p.lat]);
  const first = places[0]?.at ?? 0;
  const lastAt = places[places.length - 1]?.at ?? 0;
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[760, 1560, 96]} noteX={620}>
      <MapLayer cam={cam} lands={LANDS_ALL} />
      {sc.route && places.length > 1 ? <Route cam={cam} route={route} t={ramp(f, first + 6, lastAt + 6, Easing.inOut(Easing.cubic))} /> : null}
      {places.map((p, i) => {
        const [x, y] = proj(p);
        return <PlaceLabel key={i} x={x} y={y} text={p.name} t={pop(f, p.at, 10)} dx={x > 820 ? -46 : 46} dy={-30} />;
      })}
      <Figure ep={ep} sc={sc} f={f} x={160} y={1890} s={0.55} />
    </Frame>
  );
};

/** 対比：左右に2枚の紙。夢（藤色のもや）と記録（方眼）の質感を選べる */
const Compare: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const panel = (side: NonNullable<HScene["left"]>, x0: number, cid: string) => {
    const t = pop(f, side.at, 12);
    if (t <= 0) return null;
    const cx = x0 + 245;
    return (
      <g opacity={clamp01(t * 2)} transform={`translate(${cx},730) scale(${interpolate(t, [0, 1], [0.7, 1])}) translate(${-cx},-730)`}>
        <g filter="url(#paper)">
          <rect x={x0} y={340} width={490} height={780} fill={side.texture === "dream" ? "#E6DDF5" : PAPER} />
        </g>
        <clipPath id={cid}>
          <rect x={x0} y={340} width={490} height={780} />
        </clipPath>
        <g clipPath={`url(#${cid})`}>
          {side.texture === "dream" ? <DreamVeil f={f} t={0.9} id={`${cid}dv`} /> : side.texture === "record" ? <RecordGrid t={1} /> : null}
        </g>
        <Tag x={cx} y={400} text={side.heading} size={fit(side.heading, 440, 46)} bg={side.color} color={PAPER} />
        {side.items.map((it, i) => (
          <Tag key={i} x={cx} y={560 + i * 150} text={it} size={fit(it, 420, 48)} t={pop(f, side.at + 10 + i * 8, 10)} rot={i % 2 ? 1.5 : -1.5} bg={PAPER} color={SUMI} />
        ))}
      </g>
    );
  };
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[540, 1330, 100]} noteY={1620}>
      {panel(sc.left!, 40, `${sc.id}l`)}
      {panel(sc.right!, 550, `${sc.id}r`)}
      {sc.person ? <Figure ep={ep} sc={sc} f={f} x={540} y={1890} s={0.45} /> : null}
    </Frame>
  );
};

/** IF：左に史実（実線）、右に「もしも」（点線の紙・？） */
const IfCase: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const col = (items: string[], times: number[], x: number, solid: boolean) => {
    const step = Math.min(240, 900 / Math.max(1, items.length));
    return items.map((it, i) => {
      const y = 520 + i * step;
      const t = pop(f, times[i], 12);
      return (
        <g key={i}>
          {i > 0 ? <path d={`M${x},${y - step + 60} L${x},${y - 60}`} stroke={solid ? SUMI : SHU} strokeWidth={8} strokeDasharray={solid ? undefined : "14 12"} opacity={clamp01(t * 2)} /> : null}
          {solid ? (
            <Tag x={x} y={y} text={it} size={fit(it, 440, 52)} t={t} rot={i % 2 ? 1 : -1} bg={PAPER} color={SUMI} />
          ) : (
            <g opacity={clamp01(t * 2)}>
              <rect x={x - 230} y={y - 50} width={460} height={100} rx={8} fill="none" stroke={SHU} strokeWidth={6} strokeDasharray="16 12" />
              <text x={x} y={y + 18} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={fit(it, 420, 52)} fill={SHU}>
                {it}
              </text>
            </g>
          )}
        </g>
      );
    });
  };
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[540, 1560, 100]} noteX={620}>
      <Tag x={285} y={380} text="史実" size={52} t={pop(f, 4, 10)} bg={SUMI} color={PAPER} />
      <Tag x={795} y={380} text="もしも" size={52} t={pop(f, (sc.whatAt ?? [40])[0] - 6, 10)} bg={SHU} color={PAPER} />
      {col(sc.fact ?? [], sc.factAt ?? [], 285, true)}
      {col(sc.what ?? [], sc.whatAt ?? [], 795, false)}
      <Figure ep={ep} sc={sc} f={f} x={160} y={1890} s={0.5} opacity={0.9} />
    </Frame>
  );
};

/** 判定：2行の大きな判子＋金の丸判子 */
const Verdict: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const v = sc.verdict ?? [];
  const vt = ramp(f, sc.verdictAt ?? 2, (sc.verdictAt ?? 2) + 10);
  return (
    <Frame ep={ep} sc={sc} f={f} index={index} stampPos={[540, 1600, 90]} noteY={1500}>
      <Sun x={540} y={480} r={150} rot={f * 0.3} opacity={0.8} color={KIN_LIGHT} />
      <Figure ep={ep} sc={sc} f={f} x={540} y={800} s={0.55} />
      <VerdictStamp x={540} y={1060} t={vt} l1={v[0] ?? ""} l2={v[1] ?? ""} c1={SHU} c2={v.length > 1 ? SUMI : SHU} />
      {sc.gold ? <Stamp x={900} y={1330} text={sc.gold} size={fit(sc.gold, 260, 84)} t={ramp(f, sc.goldAt!, sc.goldAt! + 10)} rot={12} round color={KIN} /> : null}
    </Frame>
  );
};

/** 二択：A・B の2枚の札（コメントへの誘導） */
const Choice: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const card = (x: number, letter: string, lines: string[], color: string, at: number, seed: number) => {
    const t = pop(f, at, 12);
    if (t <= 0) return null;
    const wob = f > at + 12 ? sway(f, seed, 2.2, 0.12) : 0;
    const size = Math.min(...lines.map((l) => fit(l, 420, 66)));
    return (
      <g transform={`translate(${x},1220) rotate(${(seed === 1 ? -4 : 4) + wob}) scale(${interpolate(t, [0, 1], [0.3, 1])})`} opacity={clamp01(t * 2)}>
        <g filter="url(#paper)">
          <rect x={-235} y={-330} width={470} height={660} rx={10} fill={color} />
        </g>
        <rect x={-210} y={-305} width={420} height={610} rx={6} fill="none" stroke={PAPER} strokeWidth={5} opacity={0.75} />
        <text x={0} y={-110} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={210} fill={PAPER}>
          {letter}
        </text>
        {lines.map((l, i) => (
          <text key={i} x={0} y={60 + i * size * 1.5} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={PAPER}>
            {l}
          </text>
        ))}
      </g>
    );
  };
  const s2 = { ...sc, heading: sc.heading ?? "君はどっち派？", note: sc.note ?? { text: "コメントで教えてね", at: 40, bg: SUMI } };
  return (
    <Frame ep={ep} sc={s2} f={f} index={index} stampPos={[540, 1700, 80]} noteY={1700}>
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} color={KIN_LIGHT} />
      <Figure ep={ep} sc={sc} f={f} x={540} y={830} s={0.52} />
      {card(285, "A", sc.a ?? [], ep.style.tagBg, 12, 1)}
      {card(795, "B", sc.b ?? [], SHU, 22, 2)}
    </Frame>
  );
};

/** 登録：八咫烏が朱の登録ボタンをつつく（これまでの回と同じ型） */
const Subscribe: React.FC<P> = ({ ep, sc, index }) => {
  const f = useSceneFrame(sc, ep.hold);
  const PRESS = sc.clickAt ?? 46;
  const btnIn = pop(f, 6, 12);
  const pressed = ramp(f, PRESS, PRESS + 3) - ramp(f, PRESS + 5, PRESS + 12) * 0.6;
  const bx = 540;
  const by = 1000;
  const fly = ramp(f, 12, PRESS - 4, Easing.out(Easing.cubic));
  const peck = Math.max(0, Math.sin(clamp01((f - (PRESS - 6)) / 10) * Math.PI));
  const crowX = interpolate(fly, [0, 1], [1300, bx + 300]);
  const crowY = interpolate(fly, [0, 1], [380, by - 190]) + peck * 75 - ramp(f, PRESS + 8, PRESS + 30) * 40;
  const s2 = { ...sc, heading: sc.heading ?? "この動画がよかったら" };
  return (
    <Frame ep={ep} sc={s2} f={f} index={index} stampPos={[540, 1330, 96]}>
      <Sun x={540} y={560} r={130} rot={f * 0.4} opacity={0.75 * ramp(f, 0, 14)} />
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
      <Tag x={540} y={1560} text={CHANNEL} size={60} t={pop(f, Math.min(86, sc.frames - ep.hold - 20), 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Frame>
  );
};

export const SCENE_TYPES: Record<HScene["type"], React.FC<P>> = {
  hook: Hook,
  intro: Intro,
  timeline: Timeline,
  map: MapScene,
  points: Points,
  compare: Compare,
  ifcase: IfCase,
  verdict: Verdict,
  choice: Choice,
  subscribe: Subscribe,
};

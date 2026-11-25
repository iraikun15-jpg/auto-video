import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import timing from "./timing.json";
import {
  CAM_IKOMA,
  CAM_KII,
  CAM_WEST,
  Cam,
  LL,
  lerpCam,
  PLACES,
  pointAt,
  project,
  ROUTE_DETOUR,
  ROUTE_EAST,
  ROUTE_IF,
} from "./geo";
import {
  Arrow,
  clamp01,
  FlyingArrow,
  Heading,
  MapLayer,
  Mountains,
  PlaceLabel,
  pop,
  ramp,
  Route,
  Stage,
  Stamp,
  sway,
  Tag,
  Token,
} from "./paper";
import { Crow, Person, Sun } from "./figures";
import { AI, H, KIN, KUSA, MINCHO, PAPER, PAPER_DARK, SHU, SUMI } from "./theme";

export const FPS = timing.fps;
export const HOLD = timing.holdFrames;
export const segFrames = (id: string): number => timing.segments.find((s) => s.id === id)!.frames;

/** セグメント内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: string): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);

const P = (cam: Cam, ll: LL) => project(cam, ll);
const mix = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** 近畿の山並み（切り絵の峰）。ikoma=生駒山地（敵の陣）、ほかは大和盆地を囲む山 */
const RIDGES: { ll: LL; ikoma?: boolean }[] = [
  // 金剛・葛城（盆地の西南）
  ...([[135.68, 34.5], [135.66, 34.44], [135.69, 34.38]] as LL[]).map((ll) => ({ ll })),
  // 東の山（宇陀へ）
  ...([[135.95, 34.76], [135.93, 34.68], [136.0, 34.6], [136.05, 34.48]] as LL[]).map((ll) => ({ ll })),
  // 吉野・紀伊山地
  ...([[135.8, 34.3], [135.95, 34.25], [135.7, 34.18], [135.85, 34.08], [136.02, 34.05], [135.6, 34.0], [135.75, 33.9], [135.9, 33.85], [135.5, 33.8], [135.65, 33.68]] as LL[]).map((ll) => ({ ll })),
];

const IkomaRidge: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => {
  if (t <= 0) return null;
  const k = cam.zoom / CAM_IKOMA.zoom;
  // 生駒山地：南北に長い1枚の切り絵（西側がけわしく、東へなだらか）
  const ridge: LL[] = [
    [135.655, 34.83], [135.69, 34.85], [135.73, 34.81], [135.76, 34.74], [135.75, 34.66], [135.74, 34.58], [135.7, 34.54],
    [135.665, 34.57], [135.655, 34.62], [135.645, 34.67], [135.66, 34.72], [135.645, 34.77],
  ];
  const cx = 135.7;
  const rp = ridge.map(([lo, la]) => P(cam, [cx + (lo - cx) * clamp01(t * 1.5), la]));
  const crest = ([[135.69, 34.84], [135.7, 34.77], [135.69, 34.7], [135.7, 34.63], [135.69, 34.56]] as LL[]).map((ll) => P(cam, ll));
  return (
    <g>
      <g filter="url(#paper)" opacity={clamp01(t * 3)}>
        <path d={rp.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join("") + "Z"} fill={KUSA} />
      </g>
      <path d={crest.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join("")} fill="none" stroke="#56603F" strokeWidth={8 * k} strokeLinecap="round" strokeLinejoin="round" opacity={clamp01(t * 3)} />
      {RIDGES.map(({ ll, ikoma }, i) => {
        const [x, y] = P(cam, ll);
        const tt = clamp01(t * 1.6 - (i % 6) * 0.1);
        const h = (ikoma ? 75 : 60) * k * tt;
        const w = (ikoma ? 230 : 170) * k;
        return (
          <g key={i} filter="url(#paperLow)" opacity={clamp01(tt * 3) * (ikoma ? 1 : 0.75)}>
            <path d={`M${x - w / 2},${y + 20 * k} L${x - w * 0.08},${y + 20 * k - h} L${x + w * 0.05},${y + 20 * k - h * 0.9} L${x + w / 2},${y + 20 * k}Z`} fill={ikoma ? (i % 2 ? KUSA : "#66704A") : PAPER_DARK} />
          </g>
        );
      })}
    </g>
  );
};

/** 大和盆地のラベル */
const YamatoLabel: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => {
  const [x, y] = P(cam, [135.9, 34.44]);
  return <Tag x={x} y={y} text="大和" size={50} t={t} rot={-2} bg={PAPER_DARK} />;
};

// =====================================================================
// seg1 0〜3秒 フック：地図＋神武 vs 長髄彦＋「実在？」
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  const cam = { ...CAM_WEST, lon: CAM_WEST.lon + f * 0.0012 };
  const hy = P(cam, PLACES.hyuga);
  const ya = P(cam, PLACES.yamato);
  return (
    <Stage f={f} peel={false}>
      <MapLayer cam={cam} />
      <Route cam={cam} route={ROUTE_EAST} t={interpolate(f, [0, 45], [0.25, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) })} dashed />
      <PlaceLabel x={hy[0]} y={hy[1]} text="日向" dx={-62} dy={-10} />
      <PlaceLabel x={ya[0]} y={ya[1]} text="大和" dx={66} dy={20} />
      <Token x={hy[0]} y={hy[1]} kind="jimmu" r={30} rot={sway(f, 1, 4)} />
      <Token x={ya[0]} y={ya[1]} kind="enemy" r={30} rot={sway(f, 2, 4)} />
      {/* 対立の構図：左に神武、右に長髄彦 */}
      <Sun x={250} y={1340} r={95} rot={f * 0.4} opacity={0.9} />
      <Person kind="jimmu" x={250} y={1800} scale={0.82} arm={50 + sway(f, 3, 4)} lean={sway(f, 4, 1.5) - 4 * ramp(f, 16, 40)} draw={ramp(f, 16, 40)} />
      <Person
        kind="nagasune"
        x={840 - 30 * ramp(f, 20, 34)}
        y={1800}
        scale={0.82}
        flip
        arm={60 + 55 * ramp(f, 20, 34, Easing.out(Easing.back(2))) + sway(f, 5, 4)}
        spearTilt={-25 * ramp(f, 20, 34)}
        lean={sway(f, 6, 1.5) + 6 * ramp(f, 20, 34)}
      />
      <Stamp x={540} y={1520} text="対" size={90} t={ramp(f, 18, 28)} rot={6} round />
      <Stamp x={540} y={205} text="実在？" size={150} t={ramp(f, 4, 14)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜10秒 通説：記紀の初代天皇／日向→大和／紀元前660年 橿原で即位／127歳
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const cam = { ...CAM_WEST, lon: CAM_WEST.lon + f * 0.0008 };
  const route: LL[] = [...ROUTE_EAST, [135.7, 34.6], PLACES.kashihara];
  const tRoute = ramp(f, 18, 110, Easing.inOut(Easing.cubic));
  const pts = route.map((p) => P(cam, p));
  const tok = pointAt(pts, tRoute);
  const hy = P(cam, PLACES.hyuga);
  const ka = P(cam, PLACES.kashihara);
  const walking = f >= 18 && f < 110;
  return (
    <Stage f={f}>
      <MapLayer cam={cam} />
      <Route cam={cam} route={route} t={tRoute} />
      <PlaceLabel x={hy[0]} y={hy[1]} text="日向" dx={-62} dy={-10} />
      <PlaceLabel x={ka[0]} y={ka[1]} text="橿原" dx={70} dy={30} t={ramp(f, 100, 112)} />
      <Token x={tok.p[0]} y={tok.p[1]} kind="jimmu" r={30} rot={walking ? sway(f, 1, 10, 0.5) : 0} />
      <Heading text="古事記・日本書紀" t={pop(f, 0, 12)} y={200} size={78} />
      <Stamp x={880} y={300} text="初代天皇" size={52} t={ramp(f, 10, 20)} rot={8} />
      {/* 下段：神武が歩き、即位で日輪が昇る */}
      <Sun x={250} y={interpolate(ramp(f, 108, 140), [0, 1], [1700, 1330])} r={95} rot={f * 0.4} opacity={ramp(f, 108, 125)} />
      <Person
        kind="jimmu"
        x={interpolate(f, [0, 110], [120, 250], { extrapolateRight: "clamp" })}
        y={1800}
        scale={0.82}
        walk={walking ? f * 0.32 : undefined}
        arm={walking ? 30 : 50 + 40 * ramp(f, 150, 166)}
        turn={interpolate(ramp(f, 112, 124, Easing.inOut(Easing.cubic)) - ramp(f, 150, 162, Easing.inOut(Easing.cubic)), [0, 1], [1, -1])}
      />
      <Tag x={720} y={1390} text="紀元前660年" size={78} t={pop(f, 112, 12)} rot={-2} />
      <Stamp x={720} y={1560} text="即位" size={80} t={ramp(f, 124, 134)} rot={-6} />
      <Tag x={790} y={1740} text="127歳" size={84} t={pop(f, 158, 12)} rot={3} />
    </Stage>
  );
};

// =====================================================================
// seg3 10〜18秒 でも実は：紀元前660年は後から作られた計算
// =====================================================================
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  // 札が下から焦げていき（140〜168）、168フレームで燃え尽きて紙片と火の粉になって舞い上がる
  const char = ramp(f, 140, 168, Easing.in(Easing.quad));
  const split = ramp(f, 168, 200);
  const burnTag = (x: number, y: number, text: string, size: number, seed: number) => {
    const w = [...text].length * size * 0.98 + size * 0.9;
    const h = size * 1.6;
    if (f < 168) {
      const shake = char > 0 ? Math.sin(f * 2.1 + seed) * 4 * char : 0;
      const top = y + h / 2 - h * 1.1 * char;
      return (
        <g transform={`translate(${shake},0)`}>
          <Tag x={x} y={y} text={text} size={size} t={pop(f, 0, 10)} rot={-2} />
          {char > 0 ? (
            <g transform={`rotate(-2,${x},${y})`}>
              <clipPath id={`burn-${seed}`}>
                <rect x={x - w / 2 - 10} y={top} width={w + 20} height={h} />
              </clipPath>
              <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#2a1a10" opacity={0.85} clipPath={`url(#burn-${seed})`} />
              <path
                d={Array.from({ length: 16 }, (_, i) => `${i ? "L" : "M"}${x - w / 2 + (w * i) / 15},${top + Math.sin(i * 1.7 + f * 0.6) * 8}`).join("")}
                stroke="#E8762E"
                strokeWidth={8}
                fill="none"
                opacity={0.9}
              />
            </g>
          ) : null}
        </g>
      );
    }
    // 紙片と火の粉
    return (
      <g opacity={1 - split}>
        {Array.from({ length: 22 }, (_, i) => {
          const rx = random(`bx${seed}-${i}`) - 0.5;
          const ry = random(`by${seed}-${i}`);
          const px = x + rx * w + rx * 260 * split;
          const py = y + (ry - 0.5) * h - (120 + ry * 380) * split;
          const sz = 14 + random(`bs${seed}-${i}`) * 26;
          return i % 3 === 0 ? (
            <circle key={i} cx={px} cy={py - 40 * split} r={sz * 0.25} fill={i % 2 ? "#E8762E" : KIN} />
          ) : (
            <rect key={i} x={px - sz / 2} y={py - sz / 2} width={sz} height={sz * 0.7} fill={i % 2 ? "#2a1a10" : PAPER} transform={`rotate(${(rx * 720 + 30) * split},${px},${py})`} />
          );
        })}
      </g>
    );
  };
  // 「後の時代」から「紀元前660年」へ逆向きに伸びる朱の線
  const back = ramp(f, 40, 95, Easing.inOut(Easing.cubic));
  const a: [number, number] = [860, 290];
  const b: [number, number] = [640, 560];
  const curve = [a, mix(a, [940, 430], 1), b] as [number, number][];
  return (
    <Stage f={f}>
      <Heading text="でも実は" t={pop(f, 0, 10)} y={170} size={70} />
      <Tag x={860} y={300} text="後の時代" size={56} t={pop(f, 28, 10)} rot={4} bg={PAPER_DARK} />
      {back > 0 ? (
        <path
          d={`M${a[0]},${a[1] + 50} Q${curve[1][0]},${curve[1][1]} ${b[0] + (1 - back) * 200},${b[1] - (1 - back) * 150}`}
          fill="none"
          stroke={SHU}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray="26 18"
          opacity={1 - split}
        />
      ) : null}
      <Tag x={760} y={460} text="逆算" size={48} t={pop(f, 80, 10)} rot={-6} bg={SHU} color={PAPER} />
      {burnTag(540, 680, "紀元前660年", 110, 1)}
      {burnTag(540, 960, "127歳", 120, 2)}
      <Stamp x={540} y={820} text="後付け" size={120} t={ramp(f, 108, 118)} rot={-9} />
      <Stamp x={540} y={1240} text="史実とは考えにくい" size={66} t={ramp(f, 196, 206)} rot={3} />
      {/* 神武の影が薄れていく */}
      <Person
        kind="jimmu"
        x={540}
        y={1830}
        scale={0.62}
        arm={50}
        opacity={interpolate(f, [150, 220], [1, 0.28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (f > 150 ? 0.85 + 0.15 * Math.sin(f * 0.9) : 1)}
      />
    </Stage>
  );
};

// =====================================================================
// seg4 18〜27秒 それでも残る核：祖先が西から大和へ入った記憶（という説）
// =====================================================================
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const cam = { ...CAM_WEST, lon: CAM_WEST.lon - 0.15 + f * 0.0011 };
  const west = P(cam, [130.6, 32.6]);
  const east = P(cam, [136.4, 34.3]);
  return (
    <Stage f={f}>
      <MapLayer cam={cam} opacity={ramp(f, 0, 14)} />
      <Heading text="全部ウソ？" t={pop(f, 4, 10)} y={200} size={78} />
      <Stamp x={800} y={315} text="とは限らない" size={46} t={ramp(f, 40, 50)} rot={8} />
      {/* 大きな金の流れ（西→東） */}
      <Route cam={cam} route={[[130.9, 32.4], [131.6, 33.3], [132.6, 34.05], [134.0, 34.4], [135.1, 34.55], [135.8, 34.55]]} t={ramp(f, 60, 150, Easing.inOut(Easing.cubic))} color={KIN} width={46} opacity={0.85} />
      <Tag x={west[0]} y={west[1] - 40} text="西" size={74} t={pop(f, 55, 10)} rot={-4} />
      <Tag x={east[0]} y={east[1] + 90} text="東" size={74} t={pop(f, 140, 10)} rot={4} />
      <Tag x={540} y={1300} text="祖先の記憶" size={84} t={pop(f, 158, 12)} rot={-2} bg={PAPER} />
      <Stamp x={820} y={1395} text="説" size={70} t={ramp(f, 200, 210)} rot={-10} round />
      {/* 行列（西から東へ歩く人々の影） */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = ((f * 2.4 + i * 190) % 1300) - 120;
        return (
          <Person
            key={i}
            kind={i === 2 ? "jimmu" : "folk"}
            color={i === 2 ? SHU : "#3a332c"}
            x={x}
            y={1820}
            scale={0.42 + (i % 3) * 0.03}
            walk={f * 0.3 + i * 1.7}
            arm={25}
            opacity={0.9}
            filter="url(#paperLow)"
          />
        );
      })}
      <Mountains x={-40} baseY={1940} w={1160} h={130} colors={[PAPER_DARK]} seed={4} />
    </Stage>
  );
};

// =====================================================================
// seg5 27〜36秒 最大の敗北：生駒越えで長髄彦に大敗、兄・五瀬命を失う
// =====================================================================
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const zoomT = ramp(f, 4, 50, Easing.inOut(Easing.cubic));
  const cam = lerpCam(CAM_WEST, CAM_IKOMA, zoomT);
  const naniwa = P(cam, PLACES.naniwa);
  const kusaka = P(cam, PLACES.kusaka);
  const kusae = P(cam, PLACES.kusae);
  const ik = P(cam, [135.7, 34.74]);
  // 神武方の駒：難波→白肩津へ進み、矢を受けて押し戻される
  const adv = ramp(f, 58, 100, Easing.inOut(Easing.quad));
  const back = ramp(f, 150, 190, Easing.out(Easing.cubic));
  const jPos = (dy: number, lag: number): [number, number] => {
    const t = clamp01(adv - lag) - back * 0.9;
    const p = mix(naniwa, kusaka, Math.max(0, t));
    return [p[0] - 30 + lag * 120, p[1] + dy];
  };
  const enemy: [number, number][] = [
    [kusae[0] + 110, kusae[1] - 100],
    [kusae[0] + 150, kusae[1] + 10],
    [kusae[0] + 100, kusae[1] + 120],
  ];
  const itsuse = jPos(-80, 0);
  const hit = f >= 132;
  const itsuseFade = ramp(f, 205, 240);
  return (
    <Stage f={f}>
      <MapLayer cam={cam} seaRect={[interpolate(zoomT, [0, 1], [40, 0]), interpolate(zoomT, [0, 1], [330, 0]), interpolate(zoomT, [0, 1], [1000, 1080]), interpolate(zoomT, [0, 1], [900, 1920])]} />
      <Route cam={cam} route={ROUTE_EAST} t={1} width={interpolate(zoomT, [0, 1], [10, 14])} head={false} opacity={0.8} />
      <IkomaRidge cam={cam} t={ramp(f, 30, 70)} />
      <YamatoLabel cam={cam} t={ramp(f, 66, 76)} />
      <PlaceLabel x={naniwa[0]} y={naniwa[1]} text="難波" dx={-58} dy={70} t={ramp(f, 50, 60)} />
      <Tag x={ik[0] + 150} y={ik[1] - 90} text="生駒山" size={50} t={pop(f, 62, 10)} rot={3} />
      <Tag x={enemy[1][0] + 150} y={enemy[1][1]} text="長髄彦" size={52} t={pop(f, 104, 10)} rot={-4} bg={SUMI} color={PAPER} />
      <Tag x={kusae[0] - 150} y={kusae[1] + 200} text="孔舎衛坂" size={58} t={pop(f, 100, 10)} rot={-3} bg={SUMI} color={PAPER} />
      {/* 敵（長髄彦） */}
      {enemy.map((p, i) => (
        <Token key={i} x={p[0]} y={p[1]} kind="enemy" r={44} t={pop(f, 92 + i * 5, 10)} rot={sway(f, i, 5)}  />
      ))}
      {/* 神武方 */}
      <Token x={jPos(40, 0.12)[0]} y={jPos(40, 0.12)[1]} kind="jimmu" r={44} t={ramp(f, 50, 58)} />
      <Token x={jPos(150, 0.22)[0]} y={jPos(150, 0.22)[1]} kind="jimmu" r={44} t={ramp(f, 52, 60)} />
      <g opacity={1 - itsuseFade * 0.75}>
        <Token x={itsuse[0]} y={itsuse[1]} kind="itsuse" r={44} t={ramp(f, 48, 56)} rot={hit ? interpolate(ramp(f, 132, 150), [0, 1], [0, -28]) : 0} />
        {hit ? <Arrow x={itsuse[0] - 10} y={itsuse[1] - 10} angle={200} scale={0.9} /> : null}
      </g>
      {/* 矢の雨 */}
      {[0, 1, 2, 3, 4].map((i) => {
        const st = 108 + i * 6;
        const from = enemy[i % 3];
        const to: [number, number] = i === 2 ? [itsuse[0] - 10, itsuse[1] - 10] : [kusaka[0] - 40 - i * 25, kusaka[1] + (i - 2) * 60];
        const t = ramp(f, st, st + 24, Easing.linear);
        return t > 0 && t < 1 ? <FlyingArrow key={i} a={from} b={to} t={t} scale={0.9} /> : null;
      })}
      <Stamp x={330} y={1180} text="大敗" size={150} t={ramp(f, 150, 160)} rot={-8} />
      <Tag x={330} y={1420} text="兄・五瀬命" size={64} t={pop(f, 185, 10)} rot={2} bg={SHU} color={PAPER} />
      {/* 下段：山の上の長髄彦と、押し戻される神武 */}
      <Mountains x={480} baseY={1960} w={700} h={330} colors={["#56603F", KUSA]} seed={7} t={ramp(f, 60, 90)} />
      <Person
        kind="nagasune"
        x={900 - 40 * (ramp(f, 116, 124) - ramp(f, 132, 146))}
        y={interpolate(ramp(f, 80, 105), [0, 1], [2400, 1700])}
        scale={0.78}
        flip
        arm={40 + 60 * ramp(f, 104, 114, Easing.out(Easing.back(2)))}
        spearTilt={-55 * (ramp(f, 116, 124, Easing.out(Easing.cubic)) - ramp(f, 132, 146))}
        lean={10 * (ramp(f, 116, 124) - ramp(f, 132, 146))}
      />
      {/* 兄・五瀬命（神武のうしろ）：矢を受けてひざをつき、倒れる */}
      <g opacity={1 - ramp(f, 200, 235) * 0.7}>
        <Person
          kind="itsuse"
          color="#9E3A2A"
          x={interpolate(back, [0, 1], [470, 380])}
          y={1880}
          scale={0.58}
          arm={40}
          kneel={ramp(f, 134, 150)}
          fall={ramp(f, 152, 186, Easing.in(Easing.quad))}
          opacity={ramp(f, 60, 75)}
        />
        {f >= 132 ? <Arrow x={interpolate(back, [0, 1], [470, 380]) + 10 - 60 * ramp(f, 152, 186)} y={1630 + 160 * ramp(f, 134, 150) + 150 * ramp(f, 152, 186)} angle={150} scale={1.1} /> : null}
      </g>
      <Person
        kind="jimmu"
        x={interpolate(back, [0, 1], [300, 170])}
        y={1880}
        scale={0.62}
        lean={interpolate(back, [0, 1], [0, -12]) - 5 * ramp(f, 62, 84)}
        arm={60}
        draw={ramp(f, 62, 82) - ramp(f, 86, 90)}
        opacity={ramp(f, 60, 75)}
      />
      {/* 神武の矢（放つが、届かない） */}
      {f >= 86 && f < 104 ? (
        <FlyingArrow a={[440, 1640]} b={[820, 1500]} t={ramp(f, 86, 104, Easing.linear)} scale={1.2} />
      ) : null}
    </Stage>
  );
};

// =====================================================================
// seg6 36〜44秒 IF：強行突破していたら？ 地の利・豪族との連戦・余力なし
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const cam = CAM_IKOMA;
  const tIf = ramp(f, 22, 70, Easing.inOut(Easing.cubic));
  const pts = ROUTE_IF.map((p) => P(cam, p));
  const head = pointAt(pts, tIf).p;
  const clans: LL[] = [[135.86, 34.58], [135.98, 34.6], [136.0, 34.47], [135.86, 34.38], [135.72, 34.44], [135.8, 34.5]];
  const clanPts = clans.map((c) => P(cam, c));
  // 突破後、豪族の駒を次々に回る（連戦）
  const hopIdx = Math.min(clanPts.length - 1, Math.floor(Math.max(0, f - 100) / 16));
  const hopT = clamp01(((f - 100) % 16) / 10);
  const prev = hopIdx === 0 ? head : clanPts[hopIdx - 1];
  const jTok: [number, number] = f < 100 ? head : mix(prev, clanPts[hopIdx], Easing.inOut(Easing.quad)(hopT));
  const power = interpolate(f, [60, 200], [1, 0.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kusae = P(cam, PLACES.kusae);
  return (
    <Stage f={f} tint="#7f93a8" tintOpacity={0.28}>
      <MapLayer cam={cam} seaRect={[0, 0, 1080, 1920]} />
      <Route cam={cam} route={ROUTE_EAST} t={1} width={14} head={false} opacity={0.6} />
      <IkomaRidge cam={cam} t={1} />
      {[0, 1, 2].map((i) => (
        <Token key={i} x={kusae[0] + [110, 150, 100][i]} y={kusae[1] + [-100, 10, 120][i]} kind="enemy" r={44} rot={sway(f, i, 5)} />
      ))}
      <Route cam={cam} route={ROUTE_IF} t={tIf} dashed width={14} />
      <Tag x={kusae[0] + 280} y={kusae[1] - 120} text="地の利" size={54} t={pop(f, 72, 10)} rot={5} bg={SUMI} color={PAPER} />
      {clanPts.map((p, i) => (
        <Token key={i} x={p[0]} y={p[1]} kind="clan" r={40} t={pop(f, 92 + i * 6, 10)} rot={sway(f, i + 4, 6)} />
      ))}
      {clanPts.map((p, i) =>
        f >= 106 + i * 16 && f < 120 + i * 16 ? (
          <Stamp key={`x${i}`} x={p[0]} y={p[1]} text="戦" size={44} t={ramp(f, 106 + i * 16, 112 + i * 16)} round />
        ) : null,
      )}
      <Token x={jTok[0]} y={jTok[1]} kind="jimmu" r={46} t={ramp(f, 20, 28)} rot={sway(f, 9, 8, 0.4)} />
      <Tag x={600} y={1210} text="豪族と連戦" size={62} t={pop(f, 112, 10)} rot={-3} />
      <Stamp x={540} y={230} text="IF" size={150} t={ramp(f, 0, 10)} rot={-6} round />
      <Tag x={540} y={420} text="もし強行突破していたら" size={60} t={pop(f, 8, 10)} rot={1} />
      {/* 兵力ゲージ */}
      <g transform="translate(140,1420)">
        <Tag x={90} y={0} text="余力" size={56} t={ramp(f, 56, 64)} rot={-3} />
        <g filter="url(#paperLow)" opacity={ramp(f, 56, 64)}>
          <rect x={200} y={-40} width={620} height={80} fill={PAPER} rx={6} />
          <rect x={212} y={-28} width={596 * power} height={56} fill={SHU} rx={4} />
        </g>
      </g>
      {/* 余力が減るほど足取りが重くなる神武 */}
      <Person
        kind="jimmu"
        x={900}
        y={1890}
        scale={0.4}
        walk={0.3 * (f < 60 ? f : 60 + (f - 60) * (1 + power) * 0.5)}
        stride={26 * (0.4 + 0.6 * power)}
        lean={18 * (1 - power)}
        arm={30}
        opacity={ramp(f, 56, 66)}
      />
      <Stamp x={480} y={1640} text="都を置く余力なし" size={66} t={ramp(f, 196, 206)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg7 44〜50秒 判定：人物は神話／東から入った動きは歴史の核
// =====================================================================
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  const zoomT = ramp(f, 0, 26, Easing.inOut(Easing.cubic));
  const cam = lerpCam(CAM_IKOMA, CAM_KII, zoomT);
  const tRoute = ramp(f, 10, 100, Easing.inOut(Easing.quad));
  const pts = ROUTE_DETOUR.map((p) => P(cam, p));
  const tip = pointAt(pts, tRoute);
  const crowOn = tRoute > 0.55;
  const crowT = clamp01(tRoute + 0.06);
  const crow = pointAt(pts, crowT);
  const ka = P(cam, PLACES.kashihara);
  const ku = P(cam, PLACES.kumano);
  return (
    <Stage f={f}>
      <MapLayer cam={cam} seaRect={[0, 0, 1080, 1920]} />
      <Route cam={cam} route={ROUTE_EAST} t={1} width={12} head={false} opacity={0.5} />
      <IkomaRidge cam={cam} t={1} />
      <Route cam={cam} route={ROUTE_DETOUR} t={tRoute} width={14} />
      <PlaceLabel x={ku[0]} y={ku[1]} text="熊野" dx={70} dy={0} t={ramp(f, 50, 58)} size={40} />
      <PlaceLabel x={ka[0]} y={ka[1]} text="橿原" dx={-64} dy={30} t={ramp(f, 96, 104)} size={40} />
      <Token x={tip.p[0]} y={tip.p[1]} kind="jimmu" r={38} rot={sway(f, 2, 8, 0.5)} />
      {crowOn ? (
        <g opacity={ramp(f, 55, 62)}>
          <Crow x={crow.p[0] + 40} y={crow.p[1] - 80} scale={0.55} flap={Math.sin(f * 0.7)} flip={crow.angle > 90 || crow.angle < -90} />
          <Tag x={crow.p[0] + 200} y={crow.p[1] - 90} text="八咫烏" size={46} t={ramp(f, 58, 66)} rot={4} />
        </g>
      ) : null}
      {f >= 100 ? <Sun x={ka[0]} y={ka[1]} r={36} rot={f} opacity={ramp(f, 100, 110)} /> : null}
      <Stamp x={540} y={200} text="判定" size={130} t={ramp(f, 2, 12)} rot={-5} />
      {/* 判定カード2枚 */}
      <g transform={`translate(0,${interpolate(pop(f, 34, 12), [0, 1], [200, 0])})`}>
        <Tag x={300} y={1520} text="人物" size={64} t={pop(f, 34, 12)} rot={-3} />
        <Stamp x={300} y={1690} text="神話" size={92} t={ramp(f, 48, 58)} rot={-6} color={SUMI} />
      </g>
      <g transform={`translate(0,${interpolate(pop(f, 100, 12), [0, 1], [200, 0])})`}>
        <Tag x={780} y={1520} text="東から入った動き" size={46} t={pop(f, 100, 12)} rot={3} />
        <Stamp x={780} y={1690} text="歴史の核" size={76} t={ramp(f, 116, 126)} rot={5} />
      </g>
    </Stage>
  );
};

// =====================================================================
// seg8 締め：二択 A 実在した派 / B 作られた派
// =====================================================================
export const Seg8: React.FC = () => {
  const f = useSegFrame("seg8");
  const card = (x: number, letter: string, line1: string, line2: string, color: string, at: number, seed: number) => {
    const t = pop(f, at, 12);
    if (t <= 0) return null;
    const wob = f > at + 12 ? sway(f, seed, 2.2, 0.12) : 0;
    return (
      <g transform={`translate(${x},1220) rotate(${(seed === 1 ? -4 : 4) + wob}) scale(${interpolate(t, [0, 1], [0.3, 1])})`} opacity={clamp01(t * 2)}>
        <g filter="url(#paper)">
          <rect x={-215} y={-330} width={430} height={660} rx={10} fill={color} />
        </g>
        <rect x={-190} y={-305} width={380} height={610} rx={6} fill="none" stroke={PAPER} strokeWidth={5} opacity={0.7} />
        <text x={0} y={-90} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={230} fill={PAPER}>
          {letter}
        </text>
        <text x={0} y={80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={74} fill={PAPER}>
          {line1}
        </text>
        <text x={0} y={190} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={74} fill={PAPER}>
          {line2}
        </text>
      </g>
    );
  };
  return (
    <Stage f={f}>
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} />
      <Person kind="jimmu" x={540} y={830} scale={0.62} arm={50 + sway(f, 1, 5)} color={SUMI} opacity={0.92} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} />
      {card(290, "A", "実在", "した派", SHU, 12, 1)}
      {card(790, "B", "作られた", "派", AI, 22, 2)}
      <Tag x={540} y={1700} text="コメントで教えてね" size={60} t={pop(f, 40, 10)} rot={-1} />
      {/* 八咫烏が二枚の札の上を横切る */}
      {f >= 50 && f < 140 ? (
        <Crow x={interpolate(f, [50, 140], [1260, -220])} y={880 + Math.sin(f * 0.12) * 30} scale={0.7} flap={Math.sin(f * 0.6)} flip />
      ) : null}
    </Stage>
  );
};

export const SEGMENTS: Record<string, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8 };

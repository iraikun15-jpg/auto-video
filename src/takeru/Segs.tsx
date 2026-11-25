import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Cam, LL, lerpCam, pointAt, project } from "../jimmu/geo";
import { clamp01, Heading, MapLayer, PlaceLabel, pop, ramp, Route, Stage, Stamp, sway, Tag, Token } from "../jimmu/paper";
import { Boar, Crow, Person, Sun, Swan, Sword } from "../jimmu/figures";
import { AI, KIN, KUSA, MINCHO, PAPER, PAPER_DARK, SHU, SUMI } from "../jimmu/theme";
import { CLICK_AT, HOLD, segFrames, SegId, STAMPS } from "./events";
import { CAM_ALL, CAM_IBUKI, LANDS_ALL, PL, ROUTE_EAST2, ROUTE_WEST } from "./geo";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const P = (cam: Cam, ll: LL) => project(cam, ll);
const mix = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** 判子の出現（events.ts の STAMPS と同じフレーム） */
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);

/**
 * 金の霞（すやり霞）：絵巻物の金色の雲の帯。地図の上下の縁をゆっくり流れる
 * f はフレーム、bands は [y, 幅, 速さ, 位相]
 */
export const Kasumi: React.FC<{ f: number; bands?: [number, number, number, number][]; opacity?: number }> = ({
  f,
  bands = [
    [372, 520, 0.5, 0],
    [430, 360, -0.35, 600],
    [1186, 560, 0.4, 300],
    [1240, 380, -0.5, 900],
  ],
  opacity = 1,
}) => (
  <g opacity={opacity}>
    {bands.map(([y, w, sp, ph], i) => {
      const x = ((((f * sp + ph) % 1500) + 1500) % 1500) - 450;
      return (
        <g key={i} filter="url(#paperLow)">
          <rect x={x} y={y - 26} width={w} height={52} rx={26} fill={KIN} opacity={0.88} />
          <rect x={x + 40} y={y - 6} width={w - 80} height={4} rx={2} fill="#E9CF8E" opacity={0.9} />
          <rect x={x + 70} y={y + 8} width={w - 160} height={3} rx={1.5} fill="#E9CF8E" opacity={0.7} />
        </g>
      );
    })}
  </g>
);

const MapAll: React.FC<{ cam?: Cam; opacity?: number; seaRect?: [number, number, number, number] }> = ({ cam = CAM_ALL, opacity, seaRect }) => (
  <MapLayer cam={cam} lands={LANDS_ALL} opacity={opacity} seaRect={seaRect} />
);

// =====================================================================
// seg1 0〜3秒 フック：西征・東征ルート地図＋ヤマトタケルの影＋「実在？」
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  const cam = { ...CAM_ALL, lon: CAM_ALL.lon + f * 0.002 };
  const ku = P(cam, PL.kumaso);
  const to = P(cam, PL.togoku);
  const t = interpolate(f, [0, 50], [0.35, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <Stage f={f} peel={false} look="takeru">
      <MapAll cam={cam} />
      <Kasumi f={f} />
      <Route cam={cam} route={ROUTE_WEST} t={t} color={SUMI} dashed width={10} />
      <Route cam={cam} route={ROUTE_EAST2} t={t} dashed width={10} />
      <PlaceLabel x={ku[0]} y={ku[1]} text="西征" dx={0} dy={-110} size={40} />
      <PlaceLabel x={to[0]} y={to[1]} text="東征" dx={-10} dy={120} size={40} />
      <Sun x={540} y={1380} r={110} rot={f * 0.4} opacity={0.85} />
      <Swan x={interpolate(f, [0, 90], [900, 760])} y={1330 - f * 0.6} scale={0.5} flap={Math.sin(f * 0.5)} opacity={0.9} />
      <Person kind="takeru" x={540} y={1830} scale={0.84} arm={100 + sway(f, 2, 5)} spearTilt={-10 * ramp(f, 20, 34)} lean={sway(f, 3, 1.5)} />
      <Stamp x={540} y={205} text="実在？" size={150} t={stampT(f, "seg1", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜10秒 物語の紹介：景行天皇の皇子／熊襲建を討つ／東国平定／白鳥になって飛び去る
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const cam = CAM_ALL;
  const tW = ramp(f, 16, 80, Easing.inOut(Easing.cubic));
  const tE = ramp(f, 96, 158, Easing.inOut(Easing.cubic));
  const wPts = ROUTE_WEST.slice(0, 9).map((p) => P(cam, p));
  const ePts = ROUTE_EAST2.slice(0, 9).map((p) => P(cam, p));
  const tok = f < 92 ? pointAt(wPts, tW).p : pointAt(ePts, tE).p;
  const ku = P(cam, PL.kumaso);
  const hs = P(cam, PL.hashirimizu);
  const no = P(cam, PL.nobono);
  const swanT = ramp(f, 166, 200, Easing.in(Easing.quad));
  const walking = f >= 16 && f < 160;
  return (
    <Stage f={f} look="takeru">
      <MapAll cam={cam} />
      <Kasumi f={f} />
      <Route cam={cam} route={ROUTE_WEST.slice(0, 9)} t={tW} color={SUMI} width={10} />
      <Route cam={cam} route={ROUTE_EAST2.slice(0, 9)} t={tE} width={10} />
      <Token x={tok[0]} y={tok[1]} kind="takeru" r={24} t={ramp(f, 12, 18)} rot={walking ? sway(f, 1, 10, 0.5) : 0} />
      <Heading text="景行天皇の皇子" t={pop(f, 0, 12)} y={210} size={80} bg={AI} color={PAPER} />
      {/* 熊襲建を討つ */}
      <Token x={ku[0] + 4} y={ku[1] + 4} kind="enemy" r={22} t={pop(f, 50, 10)} />
      <Tag x={ku[0] + 70} y={ku[1] + 120} text="熊襲建" size={46} t={pop(f, 66, 10)} rot={-3} bg={SUMI} color={PAPER} />
      <Stamp x={ku[0] + 150} y={ku[1] - 40} text="討" size={56} t={stampT(f, "seg2", 0)} round rot={8} />
      {/* 東国：走水で弟橘比売 */}
      <PlaceLabel x={hs[0]} y={hs[1]} text="弟橘比売" dx={-20} dy={150} size={34} t={ramp(f, 126, 136)} />
      <Stamp x={820} y={500} text="東国平定" size={56} t={stampT(f, "seg2", 1)} rot={6} />
      {/* 下段：歩くヤマトタケル。最後は白鳥が能褒野から飛び立つ */}
      <Person
        kind="takeru"
        x={interpolate(f, [0, 160], [150, 330], { extrapolateRight: "clamp" })}
        y={1840}
        scale={0.72}
        walk={walking ? f * 0.3 : undefined}
        arm={walking ? 30 : 30 + 70 * ramp(f, 166, 180)}
        opacity={1 - swanT * 0.75}
      />
      {f >= 160 ? (
        <Swan
          x={interpolate(swanT, [0, 1], [no[0], 860])}
          y={interpolate(swanT, [0, 1], [no[1], 1380])}
          scale={interpolate(swanT, [0, 1], [0.2, 0.95])}
          flap={Math.sin(f * 0.55)}
          opacity={ramp(f, 160, 168)}
        />
      ) : null}
    </Stage>
  );
};

// =====================================================================
// seg3 10〜18秒 でも実は：各地の伝承が一人の英雄に集められた
// =====================================================================
const LEGENDS: LL[] = [
  PL.kumaso, PL.izumo, [133.9, 34.7], PL.ise, PL.owari, [136.1, 35.2],
  [138.4, 35.0], PL.sagami, PL.hashirimizu, PL.togoku, [138.6, 35.68], [138.1, 36.1],
];
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const cam = CAM_ALL;
  const gather = ramp(f, 118, 186, Easing.inOut(Easing.cubic));
  const target: [number, number] = [540, 1560];
  return (
    <Stage f={f} look="takeru">
      <MapAll cam={cam} opacity={interpolate(gather, [0, 1], [1, 0.55])} />
      <Kasumi f={f} />
      <Heading text="でも実は" t={pop(f, 0, 10)} y={210} size={80} bg={AI} color={PAPER} />
      <Tag x={540} y={1290} text="各地に残る平定の伝承" size={56} t={pop(f, 70, 10) * (1 - ramp(f, 112, 122))} rot={-2} />
      {/* 金の日輪の前に、集まってきた伝承が一人の影になる */}
      <Sun x={540} y={1500} r={120} rot={f * 0.4} opacity={0.85 * ramp(f, 150, 190)} />
      <Person kind="takeru" x={540} y={1860} scale={0.66} arm={100} opacity={ramp(f, 168, 200)} />
      {LEGENDS.map((ll, i) => {
        const from = P(cam, ll);
        const p = mix(from, target, Easing.inOut(Easing.cubic)(clamp01(gather * 1.25 - i * 0.02)));
        const fade = 1 - ramp(f, 184 + (i % 4) * 2, 196);
        return (
          <g key={i} opacity={fade}>
            <Tag x={p[0]} y={p[1]} text="伝" size={40} t={pop(f, 16 + i * 7, 10)} rot={sway(f, i, 6, 0.2)} bg={i % 2 ? PAPER : PAPER_DARK} />
          </g>
        );
      })}
      <Stamp x={540} y={1260} text="一人に集めた姿" size={74} t={stampT(f, "seg3", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg4 18〜26秒 根拠：古事記（父に疎まれた悲劇の皇子）と日本書紀（体制に従う皇子）
// =====================================================================
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const inL = ramp(f, 6, 26, Easing.out(Easing.back(1.3)));
  const inR = ramp(f, 62, 82, Easing.out(Easing.back(1.3)));
  const panel = (x: number, t: number, from: number, children: React.ReactNode) => (
    <g transform={`translate(${interpolate(t, [0, 1], [from, 0])},0) rotate(${interpolate(t, [0, 1], [from > 0 ? 8 : -8, from > 0 ? 1.5 : -1.5])},${x},800)`} opacity={clamp01(t * 3)}>
      <g filter="url(#paper)">
        <rect x={x - 235} y={360} width={470} height={900} rx={8} fill={PAPER} />
      </g>
      {children}
    </g>
  );
  return (
    <Stage f={f} look="takeru">
      <Heading text="描かれ方が違う" t={pop(f, 0, 10)} y={200} size={80} bg={AI} color={PAPER} />
      {panel(
        285,
        inL,
        -700,
        <>
          <Tag x={285} y={450} text="古事記" size={64} t={1} rot={-2} bg={PAPER_DARK} />
          {/* 背を向ける父と、ひざをつく皇子 */}
          <Person kind="folk" color={SUMI} x={180} y={1150} scale={0.55} flip opacity={0.55} arm={10} />
          <Person kind="folk" color={PAPER} outline x={330} y={1160} scale={0.5} kneel={ramp(f, 20, 40)} lean={-14 * ramp(f, 20, 40)} arm={5} />
          <Tag x={285} y={1330} text="悲劇の皇子" size={54} t={pop(f, 36, 10)} rot={2} bg={SHU} color={PAPER} />
        </>,
      )}
      {panel(
        795,
        inR,
        700,
        <>
          <Tag x={795} y={450} text="日本書紀" size={64} t={1} rot={2} bg={PAPER_DARK} />
          {/* 天皇に深く頭を下げる皇子 */}
          <Person kind="folk" color={SUMI} x={920} y={1150} scale={0.6} flip arm={30} />
          <Person kind="folk" color={PAPER} outline x={700} y={1160} scale={0.5} lean={30 * ramp(f, 86, 104)} arm={0} />
          <Tag x={795} y={1330} text="体制に従う皇子" size={48} t={pop(f, 96, 10)} rot={-2} bg={SUMI} color={PAPER} />
        </>,
      )}
      <Stamp x={540} y={1560} text="書き換え" size={110} t={stampT(f, "seg4", 0)} rot={-6} />
    </Stage>
  );
};

// =====================================================================
// seg5 26〜35秒 それでも残る核：大和が東へ広がったのは本当／各地の「建部」の記憶が一人に
// =====================================================================
const TAKEBE: LL[] = [PL.izumo, [133.9, 34.7], PL.ise, PL.owari, [136.1, 35.2], [138.4, 35.0], PL.sagami, [138.6, 35.68], [131.4, 33.3]];
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const cam = CAM_ALL;
  const grow = ramp(f, 14, 120, Easing.inOut(Easing.quad));
  const c = P(cam, [interpolate(grow, [0, 1], [135.84, 137.4]), interpolate(grow, [0, 1], [34.55, 35.2])]);
  const hero: [number, number] = [540, 1540];
  const lines = ramp(f, 172, 214, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} look="takeru">
      <defs>
        <clipPath id="landClip">
          {LANDS_ALL.map((land, i) => (
            <path key={i} d={land.map((p, j) => `${j ? "L" : "M"}${P(cam, p).join(",")}`).join("") + "Z"} />
          ))}
        </clipPath>
      </defs>
      <MapAll cam={cam} />
      <Kasumi f={f} />
      {/* 大和から東へ広がる勢力（朱の紙を重ねる） */}
      <g clipPath="url(#landClip)" opacity={0.42}>
        <ellipse cx={c[0]} cy={c[1]} rx={30 + grow * 420} ry={20 + grow * 210} fill={SHU} />
      </g>
      <Heading text="それでも残る核" t={pop(f, 0, 10)} y={210} size={76} bg={AI} color={PAPER} />
      <Tag x={540} y={1310} text="大和が東へ広がった" size={56} t={pop(f, 60, 10) * (1 - ramp(f, 156, 166))} rot={-2} />
      <Stamp x={850} y={470} text="本当" size={84} t={stampT(f, "seg5", 0)} rot={6} round />
      {/* 各地の建部 */}
      {TAKEBE.map((ll, i) => {
        const p = P(cam, ll);
        const lt = clamp01(lines * 1.2 - i * 0.03);
        const end = mix(p, [hero[0], hero[1] - 300], lt);
        return (
          <g key={i}>
            {lt > 0 ? <path d={`M${p[0]},${p[1]} L${end[0]},${end[1]}`} stroke={KIN} strokeWidth={6} strokeDasharray="14 10" opacity={0.9} /> : null}
            <Tag x={p[0]} y={p[1]} text="建部" size={30} t={pop(f, 124 + i * 5, 10)} rot={sway(f, i, 5, 0.2)} bg={SHU} color={PAPER} padX={10} padY={6} />
          </g>
        );
      })}
      <Sun x={hero[0]} y={hero[1] - 250} r={90} rot={f * 0.4} opacity={0.8 * ramp(f, 190, 220)} />
      <Person kind="takeru" x={hero[0]} y={1860} scale={0.6} arm={100} opacity={ramp(f, 166, 196)} />
      <Stamp x={540} y={1450} text="記憶が一人に" size={70} t={stampT(f, "seg5", 1)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg6 35〜43秒 IF：草薙剣を置いていかなければ？ → 敗因は剣ではなく、神を見誤ったこと
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const cam = CAM_IBUKI;
  const ow = P(cam, PL.owari);
  const ib = P(cam, PL.ibuki);
  const no = P(cam, PL.nobono);
  const go = ramp(f, 34, 84, Easing.inOut(Easing.cubic));
  const down = ramp(f, 150, 196, Easing.inOut(Easing.quad));
  const tok: [number, number] = f < 150 ? mix(ow, [ib[0] + 40, ib[1] + 40], go) : mix([ib[0] + 40, ib[1] + 40], no, down);
  const hail = ramp(f, 104, 116) * (1 - ramp(f, 196, 214));
  const hurt = ramp(f, 110, 150);
  return (
    <Stage f={f} tint="#7f93a8" tintOpacity={0.26} look="takeru">
      <MapAll cam={cam} seaRect={[0, 0, 1080, 1920]} />
      {/* 琵琶湖 */}
      <g filter="url(#paperLow)">
        <path
          d={(
            [[136.0, 35.52], [136.2, 35.45], [136.27, 35.3], [136.12, 35.12], [135.98, 35.02], [135.93, 34.98], [135.88, 35.05], [135.95, 35.2], [135.98, 35.35]] as LL[]
          )
            .map((ll, i) => `${i ? "L" : "M"}${P(cam, ll).join(",")}`)
            .join("") + "Z"}
          fill={AI}
        />
      </g>
      {/* 伊吹山（切り絵の山） */}
      <g filter="url(#paper)">
        <path d={`M${ib[0] - 190},${ib[1] + 60} L${ib[0] - 40},${ib[1] - 120} L${ib[0] + 10},${ib[1] - 90} L${ib[0] + 200},${ib[1] + 60}Z`} fill={KUSA} />
      </g>
      <path d={`M${ib[0] - 70},${ib[1] - 84} L${ib[0] - 40},${ib[1] - 120} L${ib[0] - 14},${ib[1] - 100}Z`} fill={PAPER} opacity={0.9} />
      <Tag x={ib[0] - 10} y={ib[1] + 120} text="伊吹山" size={50} t={pop(f, 20, 10)} rot={-3} />
      <PlaceLabel x={ow[0]} y={ow[1]} text="尾張" dx={70} dy={0} size={40} t={ramp(f, 14, 22)} />
      <PlaceLabel x={no[0]} y={no[1]} text="能褒野" dx={-72} dy={20} size={40} t={ramp(f, 150, 160)} />
      {/* 尾張に置いていった草薙剣 */}
      <Sword x={ow[0] + 30} y={ow[1] + 230} scale={0.6} rot={8} opacity={ramp(f, 20, 30)} />
      <Tag x={ow[0] + 60} y={ow[1] + 300} text="草薙剣" size={46} t={pop(f, 26, 10)} rot={3} bg={SUMI} color={PAPER} />
      {/* IF：剣を持っていったら（点線の剣が一緒に動く） */}
      <Sword x={tok[0] + 60} y={tok[1] + 20} scale={0.32} rot={20} dashed opacity={ramp(f, 40, 50) * (1 - hurt * 0.3)} />
      {/* 白い猪（神） */}
      <Boar x={ib[0] + 250} y={ib[1] - 20} scale={0.85} flip opacity={ramp(f, 80, 92)} step={f * 0.3} />
      <Tag x={ib[0] + 300} y={ib[1] + 100} text="白い猪＝神" size={40} t={pop(f, 92, 10)} rot={4} />
      {/* 氷雨 */}
      {hail > 0
        ? Array.from({ length: 70 }, (_, i) => {
            const hx = ib[0] - 300 + ((i * 97) % 760);
            const hy = ib[1] - 360 + (((f * 18 + i * 53) % 600));
            return <rect key={i} x={hx} y={hy} width={8} height={38} rx={3} fill="#FFFFFF" opacity={0.9 * hail} transform={`rotate(14,${hx},${hy})`} />;
          })
        : null}
      <Token x={tok[0] + Math.sin(f * 1.7) * 4 * hurt * (1 - down)} y={tok[1]} kind="takeru" r={40} t={ramp(f, 28, 36)} rot={-30 * hurt} />
      <Stamp x={540} y={230} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="草薙剣を置いていかなかったら" size={52} t={pop(f, 8, 10)} rot={1} />
      <Stamp x={540} y={1460} text="敗因＝神を見誤った" size={62} t={stampT(f, "seg6", 1)} rot={-4} />
      <Tag x={540} y={1640} text="剣があっても結末は同じ" size={50} t={pop(f, 204, 10)} rot={2} />
    </Stage>
  );
};

// =====================================================================
// seg7 43〜48秒 判定：人物＝物語／過程＝本物の圧縮記録
// =====================================================================
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  const cam = CAM_ALL;
  const fly = ramp(f, 20, 140, Easing.linear);
  return (
    <Stage f={f} look="takeru">
      <MapAll cam={cam} />
      <Kasumi f={f} />
      <Route cam={cam} route={ROUTE_WEST} t={1} color={SUMI} width={9} head={false} />
      <Route cam={cam} route={ROUTE_EAST2} t={1} width={9} />
      <Swan x={interpolate(fly, [0, 1], [180, 980])} y={interpolate(fly, [0, 1], [1140, 820])} scale={0.6} flap={Math.sin(f * 0.5)} opacity={ramp(f, 20, 28)} />
      <Stamp x={540} y={205} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      <g transform={`translate(0,${interpolate(pop(f, 26, 12), [0, 1], [200, 0])})`}>
        <Tag x={300} y={1420} text="人物" size={66} t={pop(f, 26, 12)} rot={-3} />
        <Stamp x={300} y={1600} text="物語" size={96} t={stampT(f, "seg7", 1)} rot={-6} color={SUMI} />
      </g>
      <g transform={`translate(0,${interpolate(pop(f, 86, 12), [0, 1], [200, 0])})`}>
        <Tag x={780} y={1420} text="過程" size={66} t={pop(f, 86, 12)} rot={3} />
        <Stamp x={760} y={1600} text="本物の圧縮記録" size={60} t={stampT(f, "seg7", 2)} rot={5} />
      </g>
    </Stage>
  );
};

// =====================================================================
// seg8 48〜54秒 二択：A 一人の英雄がいた派 / B みんなの記憶が集まった派
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
          <rect x={-235} y={-330} width={470} height={660} rx={10} fill={color} />
        </g>
        <rect x={-210} y={-305} width={420} height={610} rx={6} fill="none" stroke={PAPER} strokeWidth={5} opacity={0.7} />
        <text x={0} y={-90} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={230} fill={PAPER}>
          {letter}
        </text>
        <text x={0} y={80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={60} fill={PAPER}>
          {line1}
        </text>
        <text x={0} y={180} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={60} fill={PAPER}>
          {line2}
        </text>
      </g>
    );
  };
  return (
    <Stage f={f} look="takeru">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} />
      <Person kind="takeru" x={540} y={830} scale={0.6} arm={100 + sway(f, 1, 5)} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} bg={AI} color={PAPER} />
      {card(285, "A", "一人の英雄", "がいた派", SHU, 12, 1)}
      {card(795, "B", "みんなの記憶が", "集まった派", AI, 22, 2)}
      <Tag x={540} y={1700} text="コメントで教えてね" size={60} t={pop(f, 40, 10)} rot={-1} />
      {f >= 60 && f < 160 ? (
        <Swan x={interpolate(f, [60, 160], [-240, 1300])} y={900 + Math.sin(f * 0.1) * 30} scale={0.7} flap={Math.sin(f * 0.5)} />
      ) : null}
    </Stage>
  );
};

// =====================================================================
// seg9 54〜60秒 チャンネル登録エンドカード（第1本と同じ型）＋チャンネル名
// =====================================================================
export const Seg9: React.FC = () => {
  const f = useSegFrame("seg9");
  const PRESS = CLICK_AT;
  const btnIn = pop(f, 6, 12);
  const pressed = ramp(f, PRESS, PRESS + 3) - ramp(f, PRESS + 5, PRESS + 12) * 0.6;
  const bx = 540;
  const by = 1000;
  const fly = ramp(f, 14, PRESS - 4, Easing.out(Easing.cubic));
  const peck = Math.max(0, Math.sin(clamp01((f - (PRESS - 6)) / 10) * Math.PI));
  const crowX = interpolate(fly, [0, 1], [1300, bx + 300]);
  const crowY = interpolate(fly, [0, 1], [380, by - 190]) + peck * 75 - ramp(f, PRESS + 8, PRESS + 30) * 40;
  return (
    <Stage f={f} look="takeru">
      <Sun x={540} y={560} r={130} rot={f * 0.4} opacity={0.75 * ramp(f, 0, 14)} />
      <Heading text="この動画がよかったら" t={pop(f, 2, 10)} y={260} size={64} bg={AI} color={PAPER} />
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
      {f >= 12 ? <Crow x={crowX} y={crowY} scale={1.05} flap={f < PRESS - 4 ? Math.sin(f * 0.8) : Math.sin(f * 0.25) * 0.3} flip /> : null}
      <Stamp x={540} y={1330} text="お願いします" size={96} t={stampT(f, "seg9", 0)} rot={-4} />
      <Tag x={540} y={1560} text="もしも日本史ラボ" size={66} t={pop(f, 104, 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

export const SEGMENTS_TAKERU: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };

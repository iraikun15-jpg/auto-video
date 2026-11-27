import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Cam, LL, partial, polyPath, project } from "../jimmu/geo";
import { clamp01, Heading, MapLayer, pop, ramp, Stage, Stamp, sway, Tag, Token } from "../jimmu/paper";
import { Crow, Person, Sun } from "../jimmu/figures";
import { AI, H, KIN, MINCHO, MURASAKI, PAPER, PAPER_DARK, SHU, SUMI, W } from "../jimmu/theme";
import { LANDS_ALL } from "../takeru/geo";
import { CLICK_AT, HOLD, segFrames, SegId, STAMPS } from "./events";
import { ANDON, KASANUI, Kofun, Label, MIWA, MIYA, Shimenawa, Torii, YamatoMap } from "./yamato";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
const mix = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const HEAD = { bg: MURASAKI, color: PAPER };

/** 疫病の靄（紫がかった灰色の雲がゆっくり流れる） */
const Miasma: React.FC<{ f: number; amount: number; spread?: number }> = ({ f, amount, spread = 1 }) =>
  amount <= 0 ? null : (
    <g opacity={amount}>
      {Array.from({ length: 9 }, (_, i) => {
        const x = 160 + ((i * 113 + f * (0.6 + (i % 3) * 0.3)) % 760);
        const y = 450 + ((i * 97) % 640);
        const r = (70 + (i % 4) * 25) * spread;
        return (
          <g key={i} filter="url(#paperLow)">
            <ellipse cx={x} cy={y} rx={r * 1.6} ry={r * 0.7} fill="#5A4E66" opacity={0.55} />
            <ellipse cx={x + r * 0.5} cy={y - r * 0.3} rx={r} ry={r * 0.55} fill="#6E6178" opacity={0.5} />
          </g>
        );
      })}
    </g>
  );

/** 掛け軸（上から下へ開く）。text は縦書き */
const Kakejiku: React.FC<{ x: number; text: string; name: string; t: number; color: string }> = ({ x, text, name, t, color }) => {
  if (t <= 0) return null;
  const top = 380;
  const full = 820;
  const h = full * clamp01(t);
  const chars = [...text];
  const size = Math.min(84, (full - 120) / chars.length);
  return (
    <g>
      <clipPath id={`kj-${x}`}>
        <rect x={x - 170} y={top} width={340} height={h + 10} />
      </clipPath>
      <g clipPath={`url(#kj-${x})`}>
        <g filter="url(#paper)">
          <rect x={x - 150} y={top} width={300} height={full} fill={PAPER} />
        </g>
        <rect x={x - 150} y={top} width={300} height={full} fill="none" stroke={color} strokeWidth={14} />
        {chars.map((c, i) => (
          <text key={i} x={x} y={top + 70 + i * size * 1.05 + size * 0.8} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI}>
            {c}
          </text>
        ))}
      </g>
      {/* 軸棒 */}
      <rect x={x - 175} y={top - 20} width={350} height={24} rx={10} fill="#5a3b20" />
      <rect x={x - 175} y={top + h - 4} width={350} height={24} rx={10} fill="#5a3b20" />
      <Tag x={x} y={top - 70} text={name} size={54} t={1} bg={color} color={PAPER} rot={x < 540 ? -2 : 2} />
    </g>
  );
};

// =====================================================================
// seg1 0〜3秒 フック：神武と崇神が並ぶ系図。2人とも「ハツクニシラス」
// =====================================================================
const Genealogy: React.FC<{ f: number; y?: number }> = ({ f, y = 520 }) => {
  const xs = Array.from({ length: 10 }, (_, i) => 150 + (i * 780) / 9);
  return (
    <g>
      <path d={`M${xs[0]},${y} L${xs[9]},${y}`} stroke={SUMI} strokeWidth={8} />
      {xs.map((x, i) =>
        i === 0 || i === 9 ? (
          <g key={i}>
            <g filter="url(#paperLow)">
              <circle cx={x} cy={y} r={52} fill={i === 0 ? SHU : MURASAKI} />
            </g>
            <text x={x} y={y + 22} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={60} fill={PAPER}>
              {i === 0 ? "神" : "崇"}
            </text>
            <text x={x} y={y + 108} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={36} fill={SUMI} stroke={PAPER} strokeWidth={8} paintOrder="stroke">
              {i === 0 ? "第1代 神武" : "第10代 崇神"}
            </text>
          </g>
        ) : (
          <circle key={i} cx={x} cy={y} r={14 + Math.sin(f * 0.1 + i) * 1.5} fill={PAPER_DARK} stroke={SUMI} strokeWidth={5} />
        ),
      )}
    </g>
  );
};

export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  return (
    <Stage f={f} peel={false} look="sujin">
      <Genealogy f={f} />
      <Tag x={290} y={760} text="ハツクニシラス" size={50} t={1} rot={-2} bg={SHU} color={PAPER} />
      <Tag x={790} y={760} text="ハツクニシラス" size={50} t={1} rot={2} bg={MURASAKI} color={PAPER} />
      <g filter="url(#paperLow)">
        <circle cx={540} cy={760} r={46} fill={KIN} />
      </g>
      <text x={540} y={786} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={76} fill={PAPER}>
        ＝
      </text>
      <Sun x={290} y={1260} r={100} rot={f * 0.4} opacity={0.85} />
      <Sun x={790} y={1260} r={100} rot={-f * 0.4} opacity={0.85} color="#B79AC9" />
      <Person kind="jimmu" x={290} y={1830} scale={0.8} arm={50 + sway(f, 1, 4)} lean={sway(f, 2, 1.5)} />
      <Person kind="sujin" x={790} y={1830} scale={0.8} flip arm={70 + sway(f, 3, 4)} lean={sway(f, 4, 1.5)} />
      <Stamp x={540} y={210} text="初代はどっち？" size={110} t={stampT(f, "seg1", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜11秒 根拠1・称号：どちらもハツクニシラス＝初めて国を治めた天皇
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  return (
    <Stage f={f} look="sujin">
      <Heading text="証拠は名前" t={pop(f, 0, 10)} y={190} size={78} {...HEAD} />
      <Kakejiku x={290} text="始馭天下之天皇" name="神武" t={ramp(f, 12, 42, Easing.out(Easing.cubic))} color={SHU} />
      <Kakejiku x={790} text="御肇国天皇" name="崇神" t={ramp(f, 36, 66, Easing.out(Easing.cubic))} color={MURASAKI} />
      <Tag x={290} y={1290} text="ハツクニシラス" size={48} t={pop(f, 74, 10)} rot={-2} bg={SHU} color={PAPER} />
      <Tag x={790} y={1290} text="ハツクニシラス" size={48} t={pop(f, 84, 10)} rot={2} bg={MURASAKI} color={PAPER} />
      <Tag x={540} y={1430} text="＝ 初めて国を治めた天皇" size={58} t={pop(f, 108, 12)} rot={-1} />
      <Stamp x={540} y={1640} text="初代が2人？" size={110} t={stampT(f, "seg2", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg3 11〜19秒 根拠2・業績：税の仕組み／四道将軍／大和の支配拡大
// =====================================================================
const CAM_SHIDO: Cam = { lon: 135.55, lat: 35.15, zoom: 1.85, cy: 790 };
const YAMATO_LL: LL = [135.84, 34.55];
const SHIDO: { label: string; to: LL; via: LL[] }[] = [
  { label: "北陸", to: [136.7, 36.45], via: [[136.0, 35.2], [136.2, 35.9]] },
  { label: "東海", to: [137.4, 34.95], via: [[136.5, 34.7]] },
  { label: "西道", to: [133.9, 34.68], via: [[135.2, 34.65], [134.6, 34.75]] },
  { label: "丹波", to: [135.15, 35.35], via: [[135.6, 34.9]] },
];
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const cam = CAM_SHIDO;
  const y0 = project(cam, YAMATO_LL);
  const grow = ramp(f, 124, 170, Easing.inOut(Easing.quad));
  return (
    <Stage f={f} look="sujin">
      <defs>
        <clipPath id="landClipS">
          {LANDS_ALL.map((land, i) => (
            <path key={i} d={polyPath(land.map((p) => project(cam, p)))} />
          ))}
        </clipPath>
      </defs>
      <MapLayer cam={cam} lands={LANDS_ALL} />
      <g clipPath="url(#landClipS)" opacity={0.4}>
        <ellipse cx={y0[0]} cy={y0[1] - 40} rx={40 + grow * 360} ry={30 + grow * 260} fill={MURASAKI} />
      </g>
      <Shimenawa f={f} />
      {SHIDO.map((s, i) => {
        const pts = [YAMATO_LL, ...s.via, s.to].map((p) => project(cam, p));
        const t = ramp(f, 46 + i * 16, 80 + i * 16, Easing.inOut(Easing.cubic));
        const seg = partial(pts, t);
        const end = project(cam, s.to);
        return (
          <g key={s.label}>
            {t > 0 ? <path d={polyPath(seg, false)} fill="none" stroke={MURASAKI} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="22 14" /> : null}
            <Tag x={end[0]} y={end[1] + (s.label === "北陸" ? 60 : 0)} text={s.label} size={46} t={pop(f, 74 + i * 16, 10)} rot={sway(f, i, 3, 0.1)} bg={PAPER} />
          </g>
        );
      })}
      <Token x={y0[0]} y={y0[1]} kind="sujin" r={40} t={1} rot={sway(f, 1, 4)} />
      <Heading text="四道将軍" t={pop(f, 40, 10)} y={200} size={84} {...HEAD} />
      {/* 下段：税（調）を納める俵と布、指図する崇神 */}
      <g opacity={ramp(f, 8, 20)}>
        <Tag x={300} y={1330} text="税の仕組み" size={56} t={pop(f, 8, 12)} rot={-3} />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${170 + i * 120},${1520 - ramp(f, 14 + i * 6, 28 + i * 6) * 30})`} filter="url(#paperLow)">
            <ellipse cx={0} cy={0} rx={54} ry={38} fill="#C9A86A" />
            <rect x={-56} y={-6} width={112} height={10} fill="#8C7038" />
            <rect x={-40} y={-38} width={8} height={76} fill="#8C7038" opacity={0.6} />
            <rect x={32} y={-38} width={8} height={76} fill="#8C7038" opacity={0.6} />
          </g>
        ))}
        <g filter="url(#paperLow)">
          <rect x={150} y={1590} width={260} height={50} fill={PAPER_DARK} />
          <rect x={150} y={1600} width={260} height={8} fill={AI} opacity={0.5} />
        </g>
      </g>
      <Person kind="sujin" x={800} y={1850} scale={0.72} flip arm={60 + 60 * ramp(f, 40, 56)} />
      <Stamp x={540} y={1150} text="建国そのもの" size={90} t={stampT(f, "seg3", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg4 19〜28秒 疫病と三輪山：大物主を祀り、大田田根子が危機を救う
// =====================================================================
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const zoomT = ramp(f, 96, 130, Easing.inOut(Easing.cubic));
  const heal = ramp(f, 160, 220);
  const sick = ramp(f, 12, 70) * (1 - heal);
  return (
    <Stage f={f} look="sujin">
      <YamatoMap f={f} dim={sick} zoom={{ cx: MIWA[0] - 40, cy: MIWA[1] + 40, s: interpolate(zoomT, [0, 1], [1, 1.45]) }} miwaGlow={ramp(f, 150, 175) * (1 - ramp(f, 230, 260) * 0.5)} snake={ramp(f, 150, 200)}>
        {/* 大田田根子（白い切り絵）が山のふもとで祀る */}
        <Person kind="folk" color={PAPER} outline x={MIWA[0] - 170} y={MIWA[1] + 170} scale={0.26} arm={40 + 70 * ramp(f, 140, 156)} opacity={ramp(f, 128, 140)} filter="url(#paperLow)" />
        <Torii x={MIWA[0] - 60} y={MIWA[1] + 150} s={0.55} t={ramp(f, 132, 146)} />
      </YamatoMap>
      <Miasma f={f} amount={sick} />
      <Heading text="疫病の流行" t={pop(f, 4, 10) * (1 - ramp(f, 100, 110))} y={200} size={80} {...HEAD} />
      <Heading text="三輪山・大物主" t={pop(f, 108, 10)} y={200} size={76} {...HEAD} />
      <Tag x={250} y={1140} text="大田田根子" size={52} t={pop(f, 140, 10)} rot={-3} />
      {/* 下段：倒れる人々と、また立ち上がる人々 */}
      {[0, 1, 2, 3].map((i) => (
        <Person
          key={i}
          kind="folk"
          color="#3a332c"
          x={170 + i * 240}
          y={1880}
          scale={0.42}
          flip={i % 2 === 1}
          arm={20}
          kneel={ramp(f, 30 + i * 8, 52 + i * 8) * (1 - ramp(f, 186 + i * 6, 210 + i * 6))}
          lean={-14 * ramp(f, 30 + i * 8, 52 + i * 8) * (1 - heal)}
          filter="url(#paperLow)"
        />
      ))}
      <Stamp x={540} y={1400} text="最大の危機管理" size={86} t={stampT(f, "seg4", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg5 28〜36秒 アマテラス：宮中の天照大神を宮の外（笠縫邑）へ → 伊勢神宮の始まり
// =====================================================================
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const move = ramp(f, 40, 104, Easing.inOut(Easing.cubic));
  const mirrorPos = mix(MIYA, [KASANUI[0], KASANUI[1] - 10], move);
  const ise = ramp(f, 128, 168, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} look="sujin">
      <YamatoMap f={f} palace mirror={1 - ramp(f, 36, 44)} zoom={{ cx: 760, cy: 660, s: 1.35 }}>
        {/* 動いていく鏡 */}
        <path d={`M${MIYA[0]},${MIYA[1]} Q${MIYA[0] + 120},${MIYA[1] - 60} ${KASANUI[0]},${KASANUI[1]}`} fill="none" stroke={KIN} strokeWidth={6} strokeDasharray="12 10" opacity={ramp(f, 40, 60)} />
        <Torii x={KASANUI[0]} y={KASANUI[1] + 40} s={0.5} t={ramp(f, 96, 110)} />
        {f >= 36 ? <circle cx={mirrorPos[0]} cy={mirrorPos[1]} r={20} fill={KIN} stroke={PAPER} strokeWidth={4} /> : null}
      </YamatoMap>
      {/* 伊勢へ（右の外へ伸びる金の道） */}
      {ise > 0 ? (
        <g>
          <path d={`M790,560 Q930,500 ${790 + 230 * ise},${560 - 40 * ise}`} fill="none" stroke={KIN} strokeWidth={14} strokeLinecap="round" />
          <Tag x={890} y={420} text="伊勢へ" size={52} t={pop(f, 150, 10)} rot={4} bg={KIN} color={SUMI} />
        </g>
      ) : null}
      <Heading text="天照大神を宮の外へ" t={pop(f, 0, 10)} y={200} size={72} {...HEAD} />
      <Tag x={380} y={980} text="宮中" size={50} t={pop(f, 12, 10)} rot={-3} />
      <Tag x={560} y={420} text="笠縫邑" size={56} t={pop(f, 108, 10)} rot={-2} bg={SHU} color={PAPER} />
      <Sun x={850} y={1490} r={110} rot={f * 0.3} opacity={0.9} />
      <Person kind="sujin" x={300} y={1860} scale={0.72} arm={40} lean={22 * ramp(f, 20, 40)} />
      <Stamp x={540} y={1350} text="伊勢神宮の始まりへ" size={68} t={stampT(f, "seg5", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg6 36〜44秒 IF：疫病のとき神を祀らなかったら → 求心力が崩れ、大和のまとまりは遅れた
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const scatter = ramp(f, 80, 180, Easing.in(Easing.quad));
  const power = interpolate(f, [60, 186], [1, 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const r = 120 + scatter * 300;
    return [520 + Math.cos(a) * r * 1.2, 760 + Math.sin(a) * r] as [number, number];
  });
  return (
    <Stage f={f} tint="#7f7a95" tintOpacity={0.3} look="sujin">
      <YamatoMap f={f} dim={ramp(f, 20, 120)} />
      <Miasma f={f} amount={ramp(f, 20, 100)} spread={1 + scatter * 0.4} />
      {/* 大和の豪族の駒：まとまりがほどけて外へ散る */}
      {ring.map((p, i) => (
        <Token key={i} x={p[0]} y={p[1]} kind="clan" r={34} t={1} rot={sway(f, i, 10, 0.4) * (1 + scatter * 3)} />
      ))}
      <Token x={520} y={760} kind="sujin" r={44} t={1 - scatter * 0.5} rot={-scatter * 30} />
      <Stamp x={540} y={230} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="もし神を祀らなかったら" size={60} t={pop(f, 8, 10)} rot={1} />
      <g transform="translate(140,1360)">
        <Tag x={120} y={0} text="王権の求心力" size={44} t={ramp(f, 56, 64)} rot={-3} />
        <g filter="url(#paperLow)" opacity={ramp(f, 56, 64)}>
          <rect x={270} y={-36} width={560} height={72} fill={PAPER} rx={6} />
          <rect x={282} y={-24} width={536 * power} height={48} fill={MURASAKI} rx={4} />
        </g>
      </g>
      <Stamp x={540} y={1560} text="大和のまとまりは遅れた" size={62} t={stampT(f, "seg6", 1)} rot={-4} />
    </Stage>
  );
};

/** 判定の判子（2行・二重枠）：「実在した可能性のある / 最初の天皇」 */
const VerdictStamp: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t <= 0) return null;
  const s = interpolate(t, [0, 0.7, 1], [2.0, 0.95, 1]);
  return (
    <g transform={`translate(${x},${y}) rotate(-3) scale(${s})`} opacity={clamp01(t * 3)}>
      <rect x={-400} y={-150} width={800} height={300} rx={10} fill="none" stroke={SHU} strokeWidth={12} />
      <rect x={-382} y={-132} width={764} height={264} rx={6} fill="none" stroke={SHU} strokeWidth={4} />
      <text x={0} y={-30} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={68} fill={SHU}>
        実在した可能性のある
      </text>
      <text x={0} y={100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={118} fill={SHU}>
        最初の天皇
      </text>
    </g>
  );
};

// =====================================================================
// seg7 44〜50秒 判定：実在した可能性のある最初の天皇（ただし3〜4世紀頃）
// =====================================================================
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  const strike = ramp(f, 104, 114);
  return (
    <Stage f={f} look="sujin">
      <Stamp x={540} y={200} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      {/* 行燈山古墳（上から見た前方後円墳） */}
      <Kofun x={600} y={560} s={1.55} rot={115} t={ramp(f, 4, 24)} />
      <Tag x={180} y={600} text="行燈山古墳" size={50} t={pop(f, 20, 10)} rot={-3} vertical />
      <VerdictStamp x={520} y={930} t={stampT(f, "seg7", 1)} />
      <Stamp x={900} y={790} text="有力" size={64} t={ramp(f, STAMPS.seg7[1] + 6, STAMPS.seg7[1] + 16)} rot={12} round color={KIN} />
      {/* 年代：記紀の紀元前 → 実在なら3〜4世紀頃 */}
      <g opacity={ramp(f, 90, 100)}>
        <Tag x={260} y={1220} text="紀元前" size={58} t={pop(f, 90, 10)} rot={-2} bg={PAPER_DARK} />
        {strike > 0 ? <rect x={150} y={1214} width={220 * strike} height={10} fill={SUMI} transform="rotate(-6,260,1220)" /> : null}
        <path d="M410,1220 L560,1220" stroke={SUMI} strokeWidth={8} markerEnd="" />
        <path d="M560,1220 L536,1204 L536,1236Z" fill={SUMI} />
        <Tag x={790} y={1220} text="3〜4世紀頃" size={62} t={pop(f, 104, 10)} rot={2} />
      </g>
      <Stamp x={790} y={1360} text="妥当" size={56} t={stampT(f, "seg7", 2)} rot={-8} round />
      <Sun x={300} y={1500} r={100} rot={f * 0.4} opacity={0.6 * ramp(f, 40, 60)} />
      <Person kind="sujin" x={300} y={1860} scale={0.62} arm={70} />
    </Stage>
  );
};

// =====================================================================
// seg8 50〜55秒 二択：A 本当の初代は崇神派 / B 初代はやっぱり神武派
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
    <Stage f={f} look="sujin">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} />
      <Person kind="jimmu" x={370} y={830} scale={0.52} arm={50} />
      <Person kind="sujin" x={720} y={830} scale={0.52} flip arm={70} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} {...HEAD} />
      {card(285, "A", "本当の初代は", "崇神派", MURASAKI, 12, 1)}
      {card(795, "B", "初代はやっぱり", "神武派", SHU, 22, 2)}
      <Tag x={540} y={1700} text="コメントで教えてね" size={60} t={pop(f, 40, 10)} rot={-1} />
    </Stage>
  );
};

// =====================================================================
// seg9 55〜60秒 チャンネル登録エンドカード（前2本と同じ型）＋チャンネル名
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
    <Stage f={f} look="sujin">
      <Sun x={540} y={560} r={130} rot={f * 0.4} opacity={0.75 * ramp(f, 0, 14)} />
      <Heading text="この動画がよかったら" t={pop(f, 2, 10)} y={260} size={64} {...HEAD} />
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
      <Tag x={540} y={1560} text="もしも日本史ラボ" size={66} t={pop(f, 96, 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

export const SEGMENTS_SUJIN: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };
export { W, H, AI, ANDON };

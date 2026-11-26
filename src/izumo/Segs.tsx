import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Cam, LL, project } from "../jimmu/geo";
import { clamp01, CloudShape, Heading, MapLayer, pop, ramp, Stage, Stamp, sway, Tag } from "../jimmu/paper";
import { Crow, Person, Sun } from "../jimmu/figures";
import { AI, KIN, MINCHO, PAPER, PAPER_DARK, SEIDO, SHU, SUMI } from "../jimmu/theme";
import { LANDS_ALL } from "../takeru/geo";
import { CLICK_AT, HOLD, segFrames, SegId, STAMPS, SWORDS_FROM, SWORDS_TO } from "./events";
import { Balance, BronzeSword, Dotaku, PowerCircle, SOIL, TallShrine } from "./parts";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
const HEAD = { bg: SEIDO, color: PAPER };

/** 大国主命（青銅色・背中の袋） */
const Okuni: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; kneel?: number; lean?: number; opacity?: number }> = ({ x, y, s = 0.8, arm = 40, flip = false, kneel = 0, lean = 0, opacity = 1 }) => (
  <Person kind="okuninushi" x={x} y={y} scale={s} arm={arm} flip={flip} kneel={kneel} lean={lean} opacity={opacity} outline outlineColor={SUMI} />
);
/** 天の使い（白に金のふち、剣を持つ） */
const Envoy: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number; spearTilt?: number }> = ({ x, y, s = 0.8, arm = 100, flip = false, opacity = 1, spearTilt = 0 }) => (
  <Person kind="takeru" x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} spearTilt={spearTilt} outline outlineColor={KIN} />
);

/** 高天原の雲（上から垂れる雲の帯） */
const Heaven: React.FC<{ f: number; y?: number; opacity?: number }> = ({ f, y = 300, opacity = 1 }) => (
  <g opacity={opacity}>
    {[0, 1, 2].map((k) => (
      <CloudShape key={k} x={-200 + k * 420 + Math.sin(f * 0.02 + k) * 30} y={y + (k % 2) * 40} w={560} color={k % 2 ? "#F7F2E6" : "#EFE6D2"} />
    ))}
    <rect x={0} y={0} width={1080} height={y - 60} fill="#F3ECDD" opacity={0.6} />
  </g>
);

// =====================================================================
// seg1 0〜3秒 フック：国譲りの影＋「実は出雲の方が強かった？」
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  const slam = interpolate(f, [0, 4, 7], [1.08, 0.97, 1], { extrapolateRight: "clamp" });
  const shake = f < 12 ? Math.sin(f * 2.7) * (12 - f) * 1.2 : 0;
  const up = ramp(f, 46, 58, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} peel={false} look="izumo">
      <Heaven f={f} y={1080} opacity={0.9} />
      <Envoy x={760} y={1400} s={0.7} flip arm={110} />
      {/* 地面の下に眠る銅剣（ちらりと見せる） */}
      <g filter="url(#paperLow)">
        <rect x={0} y={1560} width={1080} height={360} fill={SOIL[1]} />
      </g>
      {Array.from({ length: 14 }, (_, i) => (
        <BronzeSword key={i} x={70 + i * 68} y={1830} s={0.8} rot={90} t={1} />
      ))}
      <Okuni x={300} y={1560} s={0.78} arm={40 + sway(f, 1, 4)} />
      <g transform={`translate(${540 + shake},${interpolate(up, [0, 1], [640, 330])}) scale(${slam * interpolate(up, [0, 1], [1, 0.62])})`}>
        <rect x={-500} y={-270} width={1000} height={430} rx={14} fill={SUMI} opacity={0.92} />
        <rect x={-484} y={-254} width={968} height={398} rx={10} fill="none" stroke={SEIDO} strokeWidth={6} />
        <text x={0} y={-80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={116} fill={PAPER}>
          実は出雲の方が
        </text>
        <text x={0} y={80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={124} fill="#7FC2B6">
          強かった？
        </text>
      </g>
      <Stamp x={540} y={780} text="証拠は地面の下" size={84} t={stampT(f, "seg1", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜11秒 神話の内容：大国主命が天の使いに地上の国を譲る
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const descend = ramp(f, 10, 70, Easing.out(Easing.cubic));
  const give = ramp(f, 120, 170, Easing.inOut(Easing.cubic));
  const land: [number, number] = [interpolate(give, [0, 1], [330, 750]), interpolate(give, [0, 1], [1480, 1330]) - Math.sin(give * Math.PI) * 120];
  return (
    <Stage f={f} look="izumo">
      <Heaven f={f} y={560} />
      <Heading text="国譲りの神話" t={pop(f, 0, 10)} y={190} size={84} {...HEAD} />
      {/* 天から降りる使い（光の筋） */}
      <path d={`M760,520 L${700},${1720} L${820},${1720}Z`} fill={KIN} opacity={0.12 * descend} />
      <Envoy x={760} y={interpolate(descend, [0, 1], [700, 1760])} s={0.72} flip arm={110} opacity={ramp(f, 8, 18)} />
      <Tag x={880} y={700} text="天の使い" size={52} t={pop(f, 40, 10)} rot={3} />
      {/* 地上：出雲の大国主 */}
      <g filter="url(#paperLow)">
        <path d="M0,1780 Q300,1740 540,1770 Q800,1800 1080,1760 L1080,1920 L0,1920Z" fill="#8E9A78" />
      </g>
      <Okuni x={300} y={1790} s={0.78} arm={40 + 50 * ramp(f, 110, 130)} kneel={0.25 * ramp(f, 160, 190)} lean={8 * ramp(f, 160, 190)} />
      <Tag x={300} y={1040} text="大国主命" size={60} t={pop(f, 70, 10)} rot={-3} bg={SEIDO} color={PAPER} />
      {/* 差し出される「地上の国」（小さな島の切り絵） */}
      <g transform={`translate(${land[0]},${land[1]}) scale(${0.6 + 0.4 * ramp(f, 100, 120)})`} opacity={ramp(f, 100, 116)}>
        <g filter="url(#paperLow)">
          <ellipse rx={130} ry={60} fill={AI} />
          <path d="M-90,10 Q-60,-50 0,-40 Q60,-60 90,0 Q40,30 -90,10Z" fill={PAPER} />
        </g>
        <text y={110} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={40} fill={SUMI} stroke={PAPER} strokeWidth={8} paintOrder="stroke">
          地上の国
        </text>
      </g>
      <Stamp x={540} y={1240} text="国を譲る" size={100} t={stampT(f, "seg2", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg3 11〜19秒 遺跡の証拠：荒神谷遺跡から銅剣358本（4列）
// =====================================================================
const ROWS = [34, 111, 120, 93];
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const dig = ramp(f, 10, 60, Easing.inOut(Easing.quad));
  const count = Math.round(interpolate(f, [SWORDS_FROM, SWORDS_TO], [0, 358], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const pit = { x: 70, y: 620, w: 940, h: 900 };
  let k = 0;
  return (
    <Stage f={f} look="izumo">
      <Heading text="荒神谷遺跡" t={pop(f, 0, 10)} y={190} size={88} {...HEAD} />
      <Tag x={860} y={320} text="1984年" size={46} t={pop(f, 14, 10)} rot={4} bg={SUMI} color={PAPER} />
      {/* 斜面の断面：土の層が掘り下げられていく */}
      <g filter="url(#paper)">
        <rect x={pit.x - 30} y={pit.y - 30} width={pit.w + 60} height={pit.h + 60} rx={10} fill={SOIL[3]} />
      </g>
      <rect x={pit.x} y={pit.y} width={pit.w} height={pit.h} fill={SOIL[2]} />
      {/* 掘る前の土（上から剥がれていく） */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={pit.x} y={pit.y + (pit.h / 3) * i} width={pit.w} height={(pit.h / 3) * (1 - clamp01(dig * 3 - i))} fill={SOIL[i]} />
      ))}
      {/* 方眼 */}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={`g${i}`} x={pit.x + (i * pit.w) / 9} y={pit.y} width={1.5} height={pit.h} fill={PAPER} opacity={0.25} />
      ))}
      {/* 銅剣：4列に、刃を交互に向けてずらりと並ぶ */}
      {ROWS.map((n, r) => {
        const rowY = pit.y + 120 + r * 220;
        const step = (pit.w - 40) / n;
        return Array.from({ length: n }, (_, i) => {
          const idx = k++;
          const on = clamp01(count - idx);
          if (on <= 0) return null;
          const flip = i % 2 ? 180 : 0;
          return <BronzeSword key={idx} x={pit.x + 20 + i * step + step / 2} y={rowY + (flip ? -100 : 100)} s={0.42} rot={flip} t={on} patina={0.5 + 0.3 * random(`pt${idx}`)} />;
        });
      })}
      {/* カウンター */}
      <g filter="url(#paperLow)">
        <rect x={260} y={1580} width={560} height={160} rx={12} fill={SUMI} />
      </g>
      <text x={540} y={1700} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={112} fill="#7FC2B6">
        銅剣{count}本
      </text>
      <Stamp x={540} y={1850} text="1か所で日本最多" size={70} t={stampT(f, "seg3", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg4 19〜27秒 力の裏づけ：銅鐸39個・独自の祭り／出雲と大和が並び立つ二大勢力
// =====================================================================
const CAM_POWER: Cam = { lon: 134.3, lat: 34.95, zoom: 1.4, cy: 1000 };
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const bells = Math.round(interpolate(f, [8, 60], [0, 39], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const toMap = ramp(f, 104, 122);
  const iz = project(CAM_POWER, [132.75, 35.38] as LL);
  const ya = project(CAM_POWER, [135.84, 34.55] as LL);
  const ring = Math.sin(clamp01((f - 70) / 30) * Math.PI * 4) * (1 - ramp(f, 70, 100)) * 10;
  return (
    <Stage f={f} look="izumo">
      <Heading text="銅鐸39個" t={pop(f, 0, 10) * (1 - toMap)} y={190} size={88} {...HEAD} />
      <Heading text="出雲と大和、二つの大勢力" t={pop(f, 110, 10)} y={190} size={64} {...HEAD} />
      {/* 銅鐸 39 個（加茂岩倉遺跡） */}
      <g opacity={1 - toMap}>
        {Array.from({ length: 39 }, (_, i) => (
          <Dotaku key={i} x={140 + (i % 8) * 114} y={430 + Math.floor(i / 8) * 190} s={0.62} rot={i % 8 === 3 ? ring : 0} t={clamp01(bells - i)} glow={f > 70 && f < 100 ? 1 - ramp(f, 70, 100) : 0} />
        ))}
        <Tag x={540} y={1400} text="加茂岩倉遺跡" size={54} t={pop(f, 30, 10)} rot={-2} bg={SUMI} color={PAPER} />
        <Tag x={540} y={1530} text="独自のお祭りの文化" size={58} t={pop(f, 74, 10)} rot={2} />
        {[220, 860].map((x, i) => (
          <Person key={x} kind="folk" color="#3a332c" x={x} y={1880} scale={0.45} flip={i === 1} arm={130 + Math.sin(f * 0.3 + i) * 20} filter="url(#paperLow)" />
        ))}
      </g>
      {/* 勢力図：出雲と大和が同じ大きさで並び立つ */}
      {toMap > 0 ? (
        <g opacity={toMap}>
          <MapLayer cam={CAM_POWER} lands={LANDS_ALL} seaRect={[40, 330, 1000, 1300]} />
          <PowerCircle x={iz[0]} y={iz[1]} r={230} color={SEIDO} name="出雲" t={ramp(f, 122, 146)} />
          <PowerCircle x={ya[0]} y={ya[1]} r={230} color={SHU} name="大和" t={ramp(f, 132, 156)} />
          <text x={(iz[0] + ya[0]) / 2} y={(iz[1] + ya[1]) / 2 + 30} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={110} fill={SUMI} opacity={ramp(f, 156, 166)}>
            ＝
          </text>
        </g>
      ) : null}
      <Stamp x={540} y={1760} text="並び立つ大勢力" size={86} t={stampT(f, "seg4", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg5 27〜35秒 神話の条件：代わりに大きな社を建てる（出雲大社）＝対等な交渉
// =====================================================================
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const rise = ramp(f, 20, 90, Easing.out(Easing.cubic));
  const tilt = interpolate(ramp(f, 110, 170, Easing.out(Easing.back(1.4))), [0, 1], [18, 0]);
  return (
    <Stage f={f} look="izumo">
      <Heading text="タダでは譲らない" t={pop(f, 0, 10)} y={190} size={80} {...HEAD} />
      <Heaven f={f} y={520} opacity={0.6} />
      <TallShrine x={330} y={1180} s={0.95} rise={rise} />
      <Tag x={820} y={520} text="出雲大社" size={66} t={pop(f, 70, 10)} rot={3} bg={SEIDO} color={PAPER} />
      <Tag x={820} y={660} text="大きな社を建てる" size={48} t={pop(f, 86, 10)} rot={-2} />
      {/* 対等な交渉：天秤が水平になる */}
      <g opacity={ramp(f, 100, 112)}>
        <Balance
          x={540}
          y={1300}
          s={0.85}
          tilt={tilt}
          left={<Okuni x={0} y={0} s={0.28} arm={60} />}
          right={<Envoy x={0} y={0} s={0.28} flip arm={60} />}
        />
      </g>
      <Stamp x={540} y={1810} text="対等な交渉" size={96} t={stampT(f, "seg5", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg6 35〜43秒 IF：ただの作り話だったら → 出雲の力が説明できない
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const fake = ramp(f, 30, 40);
  const q = ramp(f, 90, 110);
  const read = ramp(f, 150, 176);
  return (
    <Stage f={f} tint="#7f8a95" tintOpacity={0.24} look="izumo">
      <Stamp x={540} y={230} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="もし国譲りがただの作り話だったら" size={50} t={pop(f, 8, 10)} rot={1} />
      {/* 神話の巻物に「作り話」の判子 */}
      <g transform="translate(300,760)" opacity={1 - read * 0.6}>
        <g filter="url(#paper)">
          <rect x={-200} y={-150} width={400} height={300} rx={8} fill={PAPER} />
        </g>
        <rect x={-214} y={-160} width={22} height={320} rx={8} fill="#5A3B20" />
        <rect x={192} y={-160} width={22} height={320} rx={8} fill="#5A3B20" />
        <text x={0} y={-40} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={54} fill={SUMI}>
          国譲りの神話
        </text>
        <Stamp x={0} y={60} text="作り話" size={64} t={fake} rot={-8} color={SUMI} />
      </g>
      {/* 地面の下の 358 本は消えない */}
      <g transform="translate(780,760)">
        <g filter="url(#paper)">
          <rect x={-200} y={-150} width={400} height={300} rx={8} fill={SOIL[2]} />
        </g>
        {Array.from({ length: 24 }, (_, i) => (
          <BronzeSword key={i} x={-170 + (i % 12) * 30} y={-40 + Math.floor(i / 12) * 150} s={0.36} rot={i % 2 ? 180 : 0} t={1} />
        ))}
      </g>
      <text x={780} y={700} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={180} fill={SHU} opacity={q}>
        ？
      </text>
      <Tag x={780} y={990} text="この力は？" size={56} t={pop(f, 96, 10)} rot={3} bg={SUMI} color={PAPER} />
      {/* 読み解き：出雲が大和の秩序に入った歴史 */}
      <g opacity={read}>
        <PowerCircle x={380} y={1300} r={120} color={SEIDO} name="出雲" t={1} />
        <path d={`M${500},1300 L${600 + 40 * read},1300`} stroke={SUMI} strokeWidth={10} />
        <path d={`M${640 + 40 * read},1300 l-30,-20 l0,40Z`} fill={SUMI} />
        <PowerCircle x={800} y={1300} r={160} color={SHU} name="大和の秩序" t={1} />
      </g>
      <Stamp x={540} y={1640} text="説明がつかない" size={84} t={stampT(f, "seg6", 1)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg7 43〜49秒 判定：交渉は神話／勢力は実在（遺跡が証明）
// =====================================================================
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  return (
    <Stage f={f} look="izumo">
      <Stamp x={540} y={200} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      {/* 左：神話の雲の中の二人 */}
      <g opacity={ramp(f, 10, 24)}>
        <CloudShape x={60} y={760} w={440} color="#EFE6D2" />
        <Okuni x={200} y={800} s={0.34} arm={50} />
        <Envoy x={360} y={800} s={0.34} flip arm={50} />
      </g>
      {/* 右：土の中の銅剣 */}
      <g opacity={ramp(f, 16, 30)} transform="translate(780,700)">
        <rect x={-210} y={-170} width={420} height={260} rx={10} fill={SOIL[2]} filter="url(#paperLow)" />
        {Array.from({ length: 12 }, (_, i) => (
          <BronzeSword key={i} x={-180 + i * 33} y={20} s={0.42} rot={i % 2 ? 180 : 0} t={1} />
        ))}
      </g>
      <Stamp x={270} y={1100} text="交渉は神話" size={74} t={stampT(f, "seg7", 1)} rot={-6} color={SUMI} />
      <Stamp x={800} y={1100} text="勢力は実在" size={74} t={stampT(f, "seg7", 2)} rot={5} />
      <Stamp x={540} y={1360} text="遺跡が証明" size={70} t={ramp(f, STAMPS.seg7[2] + 10, STAMPS.seg7[2] + 20)} rot={-3} round color={KIN} />
      <Sun x={540} y={1640} r={100} rot={f * 0.4} opacity={0.6 * ramp(f, 60, 80)} />
      <Okuni x={540} y={1890} s={0.55} arm={70} />
    </Stage>
  );
};

// =====================================================================
// seg8 49〜54秒 二択：A 本当に平和に譲った派 / B 力関係を神話にした派
// =====================================================================
export const Seg8: React.FC = () => {
  const f = useSegFrame("seg8");
  const card = (x: number, letter: string, lines: string[], color: string, at: number, seed: number) => {
    const t = pop(f, at, 12);
    if (t <= 0) return null;
    const wob = f > at + 12 ? sway(f, seed, 2.2, 0.12) : 0;
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
          <text key={i} x={0} y={40 + i * 92} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={60} fill={PAPER}>
            {l}
          </text>
        ))}
      </g>
    );
  };
  return (
    <Stage f={f} look="izumo">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} />
      <Okuni x={410} y={830} s={0.5} arm={60} />
      <Envoy x={680} y={830} s={0.5} flip arm={60} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} {...HEAD} />
      {card(285, "A", ["本当に", "平和に", "譲った派"], SEIDO, 12, 1)}
      {card(795, "B", ["力関係を", "神話に", "した派"], SHU, 22, 2)}
      <Tag x={540} y={1700} text="コメントで教えてね" size={60} t={pop(f, 40, 10)} rot={-1} />
    </Stage>
  );
};

// =====================================================================
// seg9 54〜60秒 チャンネル登録エンドカード（前作と同じ型）
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
    <Stage f={f} look="izumo">
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
      <Tag x={540} y={1560} text="もしも日本史ラボ" size={66} t={pop(f, 100, 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

export const SEGMENTS_IZUMO: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };
export { PAPER_DARK };

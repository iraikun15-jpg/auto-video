import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp01, Heading, pop, ramp, Stage, Stamp, sway, Tag } from "../jimmu/paper";
import { Crow, Person, Sun } from "../jimmu/figures";
import { AI, KIN, MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";
import { Boat, Waves } from "../kusanagi/parts";
import { CLICK_AT, HOLD, MIRRORS_FROM, MIRRORS_TO, segFrames, SegId, STAMPS } from "./events";
import { AKA, Book, GoldSeal, KOKUSHI, Magnifier, Mirror, Mound, SealPrint, URUSHI, WeiPalace } from "./parts";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
const HEAD = { bg: AKA, color: PAPER };

/** 卑弥呼の影絵（翡翠の深緑・金のふち） */
const Himiko: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number; color?: string }> = ({ x, y, s = 0.8, arm = 120, flip = false, opacity = 1, color }) => (
  <Person kind="himiko" x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} color={color} outline outlineColor={KIN} />
);

// =====================================================================
// seg1 0〜3秒 フック：「教科書では教えてくれない女王」＋書物と女王の影＋「日本の歴史書に名前がない」
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  // 大きなテロップ：0 フレーム目から出ていて、最初の数フレームで叩きつけるように収まり、揺れる
  const slam = interpolate(f, [0, 4, 7], [1.07, 0.97, 1], { extrapolateRight: "clamp" });
  const shake = f < 12 ? Math.sin(f * 2.7) * (12 - f) * 1.2 : 0;
  const up = ramp(f, 44, 56, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} peel={false} look="himiko">
      <Sun x={540} y={1180} r={210} rot={f * 0.3} opacity={0.6} color="#C9A86A" />
      <Himiko x={540} y={1860} s={0.95} arm={110 + sway(f, 1, 6)} />
      <Book x={540} y={1380} s={0.72} glow={ramp(f, 20, 40)} />
      {/* 大きなテロップ（意外性のフック） */}
      <g transform={`translate(${540 + shake},${interpolate(up, [0, 1], [640, 330])}) scale(${slam * interpolate(up, [0, 1], [1, 0.62])})`}>
        <rect x={-500} y={-260} width={1000} height={420} rx={14} fill={URUSHI} opacity={0.9} />
        <rect x={-484} y={-244} width={968} height={388} rx={10} fill="none" stroke={KIN} strokeWidth={5} />
        <text x={0} y={-80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={104} fill={PAPER}>
          教科書では
        </text>
        <text x={0} y={70} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={104} fill={KIN}>
          教えてくれない女王
        </text>
      </g>
      <Stamp x={540} y={770} text="日本の歴史書に名前がない" size={64} t={stampT(f, "seg1", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜11秒 記録の出どころ：『魏志倭人伝』／邪馬台国の女王／鬼道で人々を従える
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const kidou = ramp(f, 100, 140);
  return (
    <Stage f={f} look="himiko">
      <Heading text="魏志倭人伝" t={pop(f, 2, 10)} y={190} size={88} {...HEAD} />
      <Book x={500} y={640} s={0.95} glow={ramp(f, 30, 50)} />
      <Tag x={540} y={1010} text="邪馬台国の女王" size={62} t={pop(f, 60, 10)} rot={-2} bg={KOKUSHI} color={PAPER} />
      {/* 鬼道：渦を巻く光と、ひれ伏す人々 */}
      {kidou > 0
        ? Array.from({ length: 3 }, (_, k) => (
            <circle key={k} cx={540} cy={1440} r={(140 + k * 90) * kidou + Math.sin(f * 0.1 + k) * 10} fill="none" stroke={KIN} strokeWidth={6} strokeDasharray="30 20" opacity={0.6 * kidou} transform={`rotate(${f * (2 + k)},540,1440)`} />
          ))
        : null}
      <Himiko x={540} y={1860} s={0.72} arm={interpolate(kidou, [0, 1], [60, 160])} />
      {[150, 300, 780, 930].map((x, i) => (
        <Person key={i} kind="folk" color="#3a332c" x={x} y={1880} scale={0.42} flip={x > 540} kneel={ramp(f, 120 + i * 6, 140 + i * 6)} lean={20 * ramp(f, 120, 150)} filter="url(#paperLow)" />
      ))}
      <Tag x={540} y={1180} text="鬼道で人々を従える" size={56} t={pop(f, 118, 10)} rot={2} bg={URUSHI} color={KIN} />
    </Stage>
  );
};

// =====================================================================
// seg3 11〜19秒 外交の証拠：魏への使い／「親魏倭王」の金印／銅鏡100枚
// =====================================================================
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const sail = ramp(f, 0, 40, Easing.inOut(Easing.quad));
  const press = ramp(f, 46, 60, Easing.in(Easing.cubic));
  const lift = f < 60 ? 1 - press : ramp(f, 66, 80);
  const count = Math.round(interpolate(f, [MIRRORS_FROM, MIRRORS_TO], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const gridOn = ramp(f, MIRRORS_FROM - 10, MIRRORS_FROM);
  return (
    <Stage f={f} look="himiko">
      {/* 海を渡る使い（場所は描かず、海と魏の宮殿だけ） */}
      <g opacity={1 - ramp(f, 38, 48)}>
        <WeiPalace x={260} y={720} s={1.0} />
        <Tag x={260} y={800} text="魏" size={60} t={1} bg={AKA} color={PAPER} />
        <Waves f={f} y={980} color="#2F4B68" amp={18} />
        <Boat x={interpolate(sail, [0, 1], [980, 600])} y={970} s={0.8} tilt={Math.sin(f * 0.08) * 4} />
        <Tag x={760} y={560} text="238年ごろ 魏へ使い" size={50} t={pop(f, 8, 10)} rot={2} />
      </g>
      {/* 金印と印影「親魏倭王」 */}
      <g opacity={ramp(f, 40, 48) * (1 - gridOn)}>
        <Heading text="親魏倭王の称号" t={1} y={200} size={80} {...HEAD} />
        <SealPrint x={540} y={1000} t={ramp(f, 60, 62)} s={1.2} />
        <GoldSeal x={540} y={1010} s={1.5} lift={lift} />
        <Tag x={540} y={1360} text="魏の皇帝から贈られた" size={56} t={pop(f, 70, 10)} rot={-2} bg={KIN} color={SUMI} />
      </g>
      {/* 銅鏡100枚：1枚ずつ並んで格子になる */}
      {gridOn > 0 ? (
        <g opacity={gridOn}>
          <Heading text="銅鏡100枚" t={1} y={200} size={88} {...HEAD} />
          {Array.from({ length: 100 }, (_, i) => {
            const cx = 135 + (i % 10) * 90;
            const cy = 470 + Math.floor(i / 10) * 115;
            const t = clamp01(count - i);
            const shine = Math.max(0, Math.sin(f * 0.15 - i * 0.3)) ** 12;
            return <Mirror key={i} x={cx} y={cy} r={38} t={t} shine={shine} />;
          })}
          <g filter="url(#paperLow)">
            <rect x={340} y={1640} width={400} height={150} rx={12} fill={URUSHI} />
          </g>
          <text x={540} y={1748} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={110} fill={KIN}>
            {count}枚
          </text>
        </g>
      ) : null}
    </Stage>
  );
};

// =====================================================================
// seg4 19〜27秒 死と後継：大きな塚と殉葬／13歳の台与が立ち、国が治まる
// =====================================================================
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const mound = ramp(f, 6, 50, Easing.out(Easing.cubic));
  const toyo = ramp(f, 140, 170, Easing.out(Easing.cubic));
  return (
    <Stage f={f} look="himiko">
      <Heading text="卑弥呼の死" t={pop(f, 0, 10) * (1 - ramp(f, 130, 140))} y={200} size={84} {...HEAD} />
      <Heading text="13歳の台与" t={pop(f, 140, 10)} y={200} size={84} {...HEAD} />
      <Mound x={540} y={1120} t={mound} people={ramp(f, 50, 110)} />
      <Tag x={540} y={500} text="大きな塚" size={60} t={pop(f, 30, 10) * (1 - ramp(f, 130, 140))} rot={-2} />
      <Tag x={540} y={1420} text="100人余りが共に葬られた" size={50} t={pop(f, 90, 10) * (1 - ramp(f, 130, 140))} rot={2} bg={URUSHI} color={PAPER} />
      {/* 台与：塚の上に小さな女王の影が立つ */}
      <Sun x={540} y={680} r={120} rot={f * 0.4} opacity={0.75 * toyo} />
      <Person kind="himiko" x={540} y={interpolate(toyo, [0, 1], [1000, 870])} scale={0.5} arm={100} opacity={toyo} color="#3E7A6A" outline outlineColor={KIN} />
      <Tag x={540} y={1420} text="国が治まった" size={62} t={pop(f, 176, 10)} rot={-2} bg={KOKUSHI} color={PAPER} />
    </Stage>
  );
};

// =====================================================================
// seg5 27〜35秒 日本側の沈黙：古事記・日本書紀に卑弥呼の名がない
// =====================================================================
const JapaneseBook: React.FC<{ x: number; y: number; title: string; t: number }> = ({ x, y, title, t }) => (
  <g transform={`translate(${x},${y}) scale(${0.6 + 0.4 * clamp01(t)})`} opacity={clamp01(t * 2)}>
    <g filter="url(#paper)">
      <rect x={-150} y={-210} width={300} height={420} rx={8} fill="#6B4A2A" />
      <rect x={-130} y={-190} width={260} height={380} rx={4} fill="#EFE4CC" />
    </g>
    {Array.from({ length: 5 }, (_, i) => (
      <rect key={i} x={90 - i * 45} y={-160} width={4} height={320} fill={SUMI} opacity={0.25} />
    ))}
    <g transform="translate(0,-260)">
      <rect x={-120} y={-34} width={240} height={68} fill={PAPER} stroke={SUMI} strokeWidth={3} />
      <text x={0} y={18} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={46} fill={SUMI}>
        {title}
      </text>
    </g>
  </g>
);
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const scan = ramp(f, 60, 140, Easing.inOut(Easing.quad));
  return (
    <Stage f={f} look="himiko">
      <Heading text="日本の記録には…" t={pop(f, 0, 10)} y={190} size={80} {...HEAD} />
      <JapaneseBook x={290} y={720} title="古事記" t={pop(f, 10, 12)} />
      <JapaneseBook x={790} y={720} title="日本書紀" t={pop(f, 20, 12)} />
      <Magnifier x={interpolate(scan, [0, 1], [200, 880])} y={interpolate(scan, [0, 1], [640, 780]) + Math.sin(scan * Math.PI * 3) * 40} s={1} />
      {[290, 790].map((x, i) => (
        <g key={x} opacity={ramp(f, 140 + i * 6, 150 + i * 6)}>
          <path d={`M${x - 90},${640} L${x + 90},${820} M${x + 90},${640} L${x - 90},${820}`} stroke={AKA} strokeWidth={22} strokeLinecap="round" />
        </g>
      ))}
      <Stamp x={540} y={1100} text="卑弥呼の名がない" size={84} t={stampT(f, "seg5", 0)} rot={-4} />
      {/* 下段：中国の書物の中にだけいる女王 */}
      <Book x={430} y={1560} s={0.52} glow={ramp(f, 170, 190)} title="" />
      <Tag x={860} y={1520} text="中国の本の中にだけ" size={42} t={pop(f, 176, 10)} rot={3} vertical bg={KOKUSHI} color={PAPER} />
    </Stage>
  );
};

// =====================================================================
// seg6 35〜43秒 IF：『魏志倭人伝』が残っていなかったら → 女王は歴史から消えていた
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const burn = ramp(f, 40, 150, Easing.inOut(Easing.quad));
  const vanish = ramp(f, 110, 180);
  return (
    <Stage f={f} tint="#7f8a95" tintOpacity={0.28} look="himiko">
      <Stamp x={540} y={230} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="もし魏志倭人伝が残っていなかったら" size={48} t={pop(f, 8, 10)} rot={1} />
      <Book x={500} y={860} s={0.9} burn={burn} />
      <Himiko x={540} y={1860} s={0.75} arm={90} opacity={1 - vanish * 0.92} />
      {/* 消えていく影の跡（点線の輪郭） */}
      {vanish > 0.3 ? <ellipse cx={540} cy={1600} rx={150} ry={260} fill="none" stroke={SUMI} strokeWidth={4} strokeDasharray="14 12" opacity={vanish * 0.4} /> : null}
      <Stamp x={540} y={1300} text="歴史から消えていた" size={76} t={stampT(f, "seg6", 1)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg7 43〜49秒 判定：中国の公式記録に残る、実在が濃厚な女王（ただし国の場所は謎）
// =====================================================================
const VerdictStamp: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t <= 0) return null;
  const s = interpolate(t, [0, 0.7, 1], [2.0, 0.95, 1]);
  return (
    <g transform={`translate(${x},${y}) rotate(-3) scale(${s})`} opacity={clamp01(t * 3)}>
      <rect x={-420} y={-150} width={840} height={300} rx={10} fill="none" stroke={SHU} strokeWidth={14} />
      <rect x={-400} y={-130} width={800} height={260} rx={6} fill="none" stroke={SHU} strokeWidth={5} />
      <text x={0} y={-28} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={64} fill={SHU}>
        中国の公式記録に残る
      </text>
      <text x={0} y={100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={106} fill={SHU}>
        実在が濃厚な女王
      </text>
    </g>
  );
};
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  return (
    <Stage f={f} look="himiko">
      <Stamp x={540} y={200} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      <Book x={480} y={560} s={0.62} glow={1} />
      <VerdictStamp x={540} y={1020} t={stampT(f, "seg7", 1)} />
      <Stamp x={930} y={860} text="濃厚" size={60} t={ramp(f, STAMPS.seg7[1] + 6, STAMPS.seg7[1] + 16)} rot={12} round color={KIN} />
      <Tag x={420} y={1300} text="ただし邪馬台国の場所は謎" size={48} t={pop(f, 104, 12)} rot={-2} bg={URUSHI} color={PAPER} />
      <text x={420} y={1500} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={140} fill={KIN} opacity={ramp(f, 112, 124)}>
        ？
      </text>
      <Sun x={850} y={1560} r={100} rot={f * 0.4} opacity={0.6 * ramp(f, 60, 80)} color="#C9A86A" />
      <Himiko x={850} y={1870} s={0.6} arm={100} flip />
    </Stage>
  );
};

// =====================================================================
// seg8 49〜54秒 二択：A 卑弥呼は鬼道の呪術者派 / B 卑弥呼は政治のリーダー派
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
        <rect x={-210} y={-305} width={420} height={610} rx={6} fill="none" stroke={KIN} strokeWidth={5} opacity={0.8} />
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
    <Stage f={f} look="himiko">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} color="#C9A86A" />
      <Himiko x={540} y={830} s={0.52} arm={120 + sway(f, 1, 6)} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} {...HEAD} />
      {card(285, "A", ["卑弥呼は", "鬼道の", "呪術者派"], KOKUSHI, 12, 1)}
      {card(795, "B", ["卑弥呼は", "政治の", "リーダー派"], AI, 22, 2)}
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
    <Stage f={f} look="himiko">
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

export const SEGMENTS_HIMIKO: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };

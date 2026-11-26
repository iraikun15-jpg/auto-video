import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { LL, project } from "../jimmu/geo";
import { clamp01, Heading, MapLayer, PlaceLabel, pop, ramp, Stage, Stamp, sway, Tag } from "../jimmu/paper";
import { Crow, Person, Sun } from "../jimmu/figures";
import { AI, KIN, MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";
import { CAM_ALL, LANDS_ALL } from "../takeru/geo";
import { Kofun } from "../sujin/yamato";
import { CLICK_AT, HOLD, segFrames, SegId, STAMPS } from "./events";
import { EvidenceStairs, IronSword, MEI_BACK, MEI_FRONT, OKIMI_AT, RUST, SurveyGrid, Timeline, Triad, XRAY, XRAY_DARK } from "./parts";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
const HEAD = { bg: RUST, color: KIN };
const range = (a: number, n: number) => Array.from({ length: n }, (_, i) => a + i);

/** X線写真のフィルム（紺の地に方眼） */
const Film: React.FC<{ x: number; y: number; w: number; h: number; t?: number }> = ({ x, y, w, h, t = 1 }) => (
  <g opacity={t}>
    <g filter="url(#paper)">
      <rect x={x} y={y} width={w} height={h} rx={10} fill={XRAY_DARK} />
    </g>
    {Array.from({ length: Math.floor(h / 120) }, (_, i) => (
      <rect key={i} x={x} y={y + (i + 1) * 120} width={w} height={1.5} fill={XRAY} opacity={0.15} />
    ))}
    {Array.from({ length: Math.floor(w / 120) }, (_, i) => (
      <rect key={`v${i}`} x={x + (i + 1) * 120} y={y} width={1.5} height={h} fill={XRAY} opacity={0.12} />
    ))}
    <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={8} fill="none" stroke={XRAY} strokeWidth={3} opacity={0.6} />
  </g>
);

/** スキャン光（y の位置を横切る） */
const ScanBar: React.FC<{ y: number; x?: number; w?: number; opacity?: number }> = ({ y, x = 140, w = 800, opacity = 1 }) => (
  <g opacity={opacity} style={{ mixBlendMode: "screen" }}>
    <rect x={x} y={y - 60} width={w} height={60} fill={XRAY} opacity={0.2} />
    <rect x={x} y={y - 10} width={w} height={10} fill="#BFEFFF" opacity={0.75} />
    <rect x={x} y={y - 2} width={w} height={3} fill="#FFFFFF" />
  </g>
);

// 稲荷山鉄剣の裏面、「…今獲加多支鹵大王寺在斯鬼宮時…」のあたり（20字）
const WIN_START = 20;
const WIN = MEI_BACK.slice(WIN_START, WIN_START + 20);
const WIN_HI = range(OKIMI_AT - WIN_START, 7);

// =====================================================================
// seg1 0〜3秒 フック：X線で銘文が浮かぶ鉄剣＋「名前が出てきた」
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  return (
    <Stage f={f} peel={false} look="yuryaku">
      <Film x={140} y={330} w={800} h={1500} />
      <IronSword x={540} y={1790} len={1420} xray={1} chars={WIN} highlight={WIN_HI} reveal={interpolate(f, [0, 24], [0.45, 1], { extrapolateRight: "clamp" })} glow={0.8 + 0.2 * Math.sin(f * 0.2)} />
      <ScanBar y={interpolate(f, [0, 40], [900, 1830], { extrapolateRight: "clamp" })} opacity={1 - ramp(f, 34, 44)} />
      <Stamp x={540} y={210} text="名前が出てきた" size={104} t={stampT(f, "seg1", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜11秒 決め手：稲荷山古墳の鉄剣／X線で「ワカタケル大王」
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const scan = ramp(f, 66, 130, Easing.inOut(Easing.quad));
  const scanY = interpolate(scan, [0, 1], [300, 1850]);
  // スキャン光が通ったところから X線写真に変わる
  const xr = ramp(f, 60, 70);
  return (
    <Stage f={f} look="yuryaku">
      <Heading text="稲荷山古墳" t={pop(f, 2, 10)} y={200} size={84} {...HEAD} />
      <Kofun x={250} y={480} s={1.25} rot={160} t={ramp(f, 6, 24)} />
      <Tag x={250} y={760} text="埼玉" size={44} t={pop(f, 14, 10)} rot={-3} />
      <Tag x={250} y={860} text="1968年 出土" size={40} t={pop(f, 30, 10)} rot={2} bg={SUMI} color={PAPER} />
      <Film x={440} y={330} w={520} h={1520} t={xr} />
      <IronSword
        x={700}
        y={interpolate(ramp(f, 14, 50, Easing.out(Easing.cubic)), [0, 1], [2100, 1800])}
        len={1400}
        xray={ramp(f, 66, 130)}
        chars={WIN}
        highlight={WIN_HI}
        reveal={scan}
        glow={xr}
      />
      {scan > 0 && scan < 1 ? <ScanBar y={scanY} x={440} w={520} /> : null}
      <Tag x={250} y={1000} text="1978年 X線" size={40} t={pop(f, 72, 10)} rot={-2} bg={XRAY_DARK} color={XRAY} />
      <Tag x={250} y={1300} text="ワカタケル大王" size={58} t={pop(f, 136, 12)} rot={-2} vertical bg={KIN} color={SUMI} />
      <Stamp x={250} y={1690} text="雄略天皇" size={80} t={stampT(f, "seg2", 0)} rot={-6} />
    </Stage>
  );
};

// =====================================================================
// seg3 11〜19秒 銘文の中身：115文字／471年の年紀／代々仕えた家系の記録
// =====================================================================
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const count = Math.round(interpolate(f, [8, 90], [0, 115], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const rv = ramp(f, 8, 90, Easing.linear);
  return (
    <Stage f={f} look="yuryaku">
      <Film x={110} y={400} w={860} h={1460} />
      <IronSword x={330} y={1830} len={1400} xray={1} chars={MEI_FRONT} highlight={[0, 1, 2]} reveal={clamp01(rv * 2)} glow={0.6} />
      <IronSword x={750} y={1830} len={1400} xray={1} chars={MEI_BACK} highlight={range(OKIMI_AT, 7)} reveal={clamp01(rv * 2 - 1)} glow={0.6} />
      <Tag x={330} y={470} text="表" size={40} t={1} bg={XRAY_DARK} color={XRAY} />
      <Tag x={750} y={470} text="裏" size={40} t={1} bg={XRAY_DARK} color={XRAY} />
      {/* 文字数のカウンター */}
      <g filter="url(#paperLow)">
        <rect x={300} y={140} width={480} height={150} rx={10} fill={RUST} />
      </g>
      <text x={540} y={252} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={110} fill={KIN}>
        {count}文字
      </text>
      <Tag x={540} y={900} text="辛亥年＝471年" size={64} t={pop(f, 100, 12)} rot={-2} bg={KIN} color={SUMI} />
      <Tag x={540} y={1110} text="代々仕えた家系の記録" size={54} t={pop(f, 130, 12)} rot={2} />
      <Stamp x={540} y={1380} text="同時代の鉄の記録" size={76} t={stampT(f, "seg3", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg4 19〜28秒 全国の証拠：江田船山古墳の鉄刀にも同じ名／関東〜九州を結ぶ
// =====================================================================
const INARI: LL = [139.48, 36.13];
const EDA: LL = [130.66, 32.98];
const YAMATO: LL = [135.84, 34.55];
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const cam = CAM_ALL;
  const ia = project(cam, INARI);
  const ef = project(cam, EDA);
  const ym = project(cam, YAMATO);
  const link = (a: [number, number], b: [number, number], t: number) => {
    if (t <= 0) return null;
    const mx = (a[0] + b[0]) / 2;
    const my = Math.min(a[1], b[1]) - 140;
    const pts: string[] = [];
    for (let k = 0; k <= 24 * t; k++) {
      const u = k / 24;
      pts.push(`${(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0]},${(1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1]}`);
    }
    return <path d={`M${pts.join(" L")}`} fill="none" stroke={KIN} strokeWidth={10} strokeLinecap="round" strokeDasharray="20 12" />;
  };
  const swordIcon = (p: [number, number], t: number) => (
    <g opacity={t} transform={`translate(${p[0]},${p[1]}) scale(${0.5 + 0.5 * t})`}>
      <circle r={40} fill={XRAY_DARK} stroke={XRAY} strokeWidth={4} />
      <path d="M0,-28 L6,-18 L6,18 L-6,18 L-6,-18Z" fill={KIN} />
      <rect x={-14} y={18} width={28} height={6} fill={KIN} />
    </g>
  );
  return (
    <Stage f={f} look="yuryaku">
      <MapLayer cam={cam} lands={LANDS_ALL} />
      <SurveyGrid x={40} y={330} w={1000} h={900} />
      {link(ym, ia, ramp(f, 96, 150, Easing.inOut(Easing.cubic)))}
      {link(ym, ef, ramp(f, 110, 164, Easing.inOut(Easing.cubic)))}
      {swordIcon(ia, ramp(f, 8, 20))}
      {swordIcon(ef, ramp(f, 54, 66))}
      <g opacity={ramp(f, 86, 96)}>
        <circle cx={ym[0]} cy={ym[1]} r={34} fill={RUST} stroke={KIN} strokeWidth={5} />
        <text x={ym[0]} y={ym[1] + 14} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={40} fill={KIN}>
          王
        </text>
      </g>
      <PlaceLabel x={ia[0]} y={ia[1]} text="稲荷山古墳" dx={-10} dy={190} size={36} t={ramp(f, 12, 22)} />
      <PlaceLabel x={ef[0]} y={ef[1]} text="江田船山古墳" dx={40} dy={-200} size={36} t={ramp(f, 58, 68)} />
      <Heading text="江田船山古墳にも" t={pop(f, 50, 10)} y={200} size={76} {...HEAD} />
      <Tag x={540} y={1320} text="同じ大王の名" size={64} t={pop(f, 164, 12)} rot={-2} bg={KIN} color={SUMI} />
      {/* 下段：東と西の豪族が、同じ大王に仕える */}
      <Person kind="folk" color="#3a332c" x={170} y={1880} scale={0.5} lean={22 * ramp(f, 170, 190)} arm={10} filter="url(#paperLow)" />
      <Person kind="folk" color="#3a332c" x={910} y={1880} scale={0.5} flip lean={22 * ramp(f, 170, 190)} arm={10} filter="url(#paperLow)" />
      <Person kind="yuryaku" x={540} y={1880} scale={0.6} arm={60} />
      <Stamp x={540} y={1490} text="関東〜九州" size={84} t={stampT(f, "seg4", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg5 28〜36秒 中国の記録：倭の五王の「武」／478年の上表文／三方向から一致
// =====================================================================
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const kings = ["讃", "珍", "済", "興", "武"];
  const fly = ramp(f, 76, 128, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} look="yuryaku">
      <Heading text="倭の五王" t={pop(f, 0, 10)} y={190} size={84} {...HEAD} />
      {kings.map((k, i) => {
        const t = pop(f, 10 + i * 7, 10);
        const hi = i === 4 && f > 56;
        return t > 0 ? (
          <g key={k} transform={`translate(${180 + i * 180},400) scale(${(0.4 + 0.6 * t) * (hi ? 1 + 0.12 * ramp(f, 56, 64) : 1)})`} opacity={clamp01(t * 2)}>
            <g filter="url(#paperLow)">
              <circle r={70} fill={hi ? SHU : SUMI} />
            </g>
            <text y={26} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={76} fill={PAPER}>
              {k}
            </text>
          </g>
        ) : null;
      })}
      <Tag x={900} y={540} text="＝雄略" size={50} t={pop(f, 60, 10)} rot={4} bg={SHU} color={PAPER} />
      {/* 宋へ送った手紙（上表文） */}
      <g opacity={ramp(f, 70, 80)}>
        <g filter="url(#paper)">
          <path d="M70,900 L200,820 L330,900Z" fill={SUMI} />
          <rect x={95} y={900} width={210} height={110} fill="#8B2E22" />
        </g>
        <text x={200} y={1080} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={SUMI} stroke={PAPER} strokeWidth={8} paintOrder="stroke">
          宋
        </text>
        <g transform={`translate(${interpolate(fly, [0, 1], [900, 340])},${940 - Math.sin(fly * Math.PI) * 120}) rotate(${-10 + fly * 10})`} filter="url(#paperLow)">
          <rect x={-70} y={-26} width={140} height={52} rx={6} fill={PAPER} />
          <rect x={-80} y={-30} width={14} height={60} rx={6} fill="#5a3b20" />
          <rect x={66} y={-30} width={14} height={60} rx={6} fill="#5a3b20" />
        </g>
        <Tag x={760} y={1060} text="478年 上表文" size={52} t={pop(f, 84, 10)} rot={-2} />
      </g>
      <Triad x={540} y={1480} t={ramp(f, 120, 176)} s={0.85} />
      <Stamp x={540} y={1470} text="三方向で一致" size={70} t={stampT(f, "seg5", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg6 36〜44秒 IF：鉄剣が見つかっていなかったら → 実在は記紀の中だけ／証明できる最古はもっと後
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const fade = ramp(f, 30, 90);
  const slide = ramp(f, 100, 170, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} tint="#7f8a95" tintOpacity={0.28} look="yuryaku">
      <Stamp x={540} y={230} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="もし鉄剣が見つかっていなかったら" size={50} t={pop(f, 8, 10)} rot={1} />
      <IronSword x={540} y={1180} len={640} xray={0} opacity={1 - fade * 0.8} />
      {/* 土に埋もれたまま */}
      <g filter="url(#paperLow)" opacity={fade}>
        <path d="M120,1180 Q300,1120 540,1150 Q780,1120 960,1180 L960,1260 L120,1260Z" fill="#6B4E32" />
      </g>
      <text x={540} y={820} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={150} fill={SUMI} opacity={fade * 0.8}>
        ？
      </text>
      <Timeline x={140} y={1460} w={800} marker={interpolate(slide, [0, 1], [471, 640])} label={slide < 0.5 ? "471年" : "もっと後？"} t={ramp(f, 90, 100)} />
      <Stamp x={540} y={1720} text="実在は記紀の中だけ" size={70} t={stampT(f, "seg6", 1)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg7 44〜50秒 判定：実在が証明された最も古い天皇（証拠の階段）
// =====================================================================
const VerdictStamp: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t <= 0) return null;
  const s = interpolate(t, [0, 0.7, 1], [2.0, 0.95, 1]);
  return (
    <g transform={`translate(${x},${y}) rotate(-3) scale(${s})`} opacity={clamp01(t * 3)}>
      <rect x={-410} y={-150} width={820} height={300} rx={10} fill="none" stroke={SHU} strokeWidth={14} />
      <rect x={-390} y={-130} width={780} height={260} rx={6} fill="none" stroke={SHU} strokeWidth={5} />
      <text x={0} y={-28} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={76} fill={SHU}>
        実在が証明された
      </text>
      <text x={0} y={100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={110} fill={SHU}>
        最も古い天皇
      </text>
    </g>
  );
};
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  return (
    <Stage f={f} look="yuryaku">
      <Stamp x={540} y={200} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      <EvidenceStairs x={560} y={760} lit={interpolate(f, [10, 52], [0, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <VerdictStamp x={540} y={1060} t={stampT(f, "seg7", 1)} />
      <Stamp x={920} y={900} text="証明" size={64} t={ramp(f, STAMPS.seg7[1] + 6, STAMPS.seg7[1] + 16)} rot={12} round color={KIN} />
      <Tag x={420} y={1330} text="ここから証拠で語れる時代" size={50} t={pop(f, 104, 12)} rot={-2} bg={RUST} color={KIN} />
      <Sun x={860} y={1560} r={90} rot={f * 0.4} opacity={0.6 * ramp(f, 60, 80)} />
      <Person kind="yuryaku" x={860} y={1870} scale={0.6} flip arm={70} />
    </Stage>
  );
};

// =====================================================================
// seg8 50〜55秒 二択：A 鉄剣で実在確定派 / B 名前が同じだけじゃ慎重派
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
    <Stage f={f} look="yuryaku">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} />
      <Person kind="yuryaku" x={540} y={830} scale={0.56} arm={100 + sway(f, 1, 5)} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} {...HEAD} />
      {card(285, "A", "鉄剣で", "実在確定派", SHU, 12, 1)}
      {card(795, "B", "名前が同じ", "だけじゃ慎重派", AI, 22, 2)}
      <Tag x={540} y={1700} text="コメントで教えてね" size={60} t={pop(f, 40, 10)} rot={-1} />
    </Stage>
  );
};

// =====================================================================
// seg9 55〜60秒 チャンネル登録エンドカード（前作と同じ型）
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
    <Stage f={f} look="yuryaku">
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

export const SEGMENTS_YURYAKU: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };

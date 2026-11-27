import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Cam, LL, partial, polyPath, project } from "../jimmu/geo";
import { clamp01, Heading, MapLayer, PlaceLabel, pop, ramp, Stage, Stamp, sway, Tag, Token } from "../jimmu/paper";
import { Crow, Person, Sun, Sword } from "../jimmu/figures";
import { KIN, MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";
import { LANDS_ALL } from "../takeru/geo";
import { Kasumi } from "../takeru/Segs";
import { CLICK_AT, GATE_CLOSE, HOLD, segFrames, SegId, SLASHES, STAMPS } from "./events";
import { Boat, Bubbles, Dragon, Flames, Gate, GlowSword, Grass, JADE, NIGHT, Orochi, Ryugu, SakeJar, Shrine, Waves } from "./parts";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
const HEAD = { bg: "#1A2348", color: KIN };
const SIL = "#0A0E1E"; // 夜の影絵の色（金のふちで縁取る）

/** 剣の一閃（光の線が走って消える） */
const SlashLine: React.FC<{ f: number; at: number; from: [number, number]; to: [number, number]; arc?: number }> = ({ f, at, from, to, arc = 0 }) => {
  const t = ramp(f, at - 4, at, Easing.out(Easing.cubic));
  const fade = 1 - ramp(f, at + 2, at + 14);
  if (t <= 0 || fade <= 0) return null;
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2 - arc;
  const pts: [number, number][] = [];
  for (let k = 0; k <= 20; k++) {
    const u = k / 20;
    pts.push([(1 - u) * (1 - u) * from[0] + 2 * (1 - u) * u * mx + u * u * to[0], (1 - u) * (1 - u) * from[1] + 2 * (1 - u) * u * my + u * u * to[1]]);
  }
  const d = polyPath(partial(pts, t), false);
  return (
    <g opacity={fade} style={{ mixBlendMode: "screen" }}>
      <path d={d} stroke="#FFF6D8" strokeWidth={70} opacity={0.18} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#FFF6D8" strokeWidth={26} opacity={0.5} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#FFFFFF" strokeWidth={8} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** 一閃の瞬間の画面全体の白い光 */
const Flash: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const v = ramp(f, at - 1, at + 1) * (1 - ramp(f, at + 2, at + 10));
  return v > 0 ? <rect width={1080} height={1920} fill="#FFF8E0" opacity={0.55 * v} /> : null;
};

// =====================================================================
// seg1 0〜3秒 フック：八岐大蛇と光る剣＋「実在？」
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  return (
    <Stage f={f} peel={false} look="kusanagi">
      <Orochi x={540} y={1180} s={0.95} f={f + 40} />
      <GlowSword x={540} y={1840} s={1.45} glow={0.85 + 0.15 * Math.sin(f * 0.2)} />
      <Stamp x={540} y={230} text="実在？" size={150} t={stampT(f, "seg1", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜12秒 オロチ退治：酒で酔わせて退治／尾の中から剣／天照大神へ献上
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const SL = SLASHES.seg2[0];
  const drunk = ramp(f, 56, 104, Easing.inOut(Easing.cubic));
  const slain = ramp(f, SL, SL + 40);
  const rise = ramp(f, 156, 230, Easing.inOut(Easing.cubic));
  const sx = interpolate(rise, [0, 1], [540 + 360 * 0.85, 540]);
  const sy = interpolate(rise, [0, 1], [1040, 760]);
  return (
    <Stage f={f} look="kusanagi">
      <Sun x={540} y={360} r={130} rot={f * 0.3} opacity={ramp(f, 180, 210)} />
      <Orochi x={540} y={1000} s={0.85} f={f} drunk={drunk} eyes={1 - drunk * 0.7} tailGlow={ramp(f, 140, 160) * (1 - rise)} opacity={1 - slain * 0.65} />
      {Array.from({ length: 8 }, (_, i) => (
        <SakeJar key={i} x={150 + i * 112} y={1180 + (i % 2) * 40} s={0.8} t={pop(f, 8 + i * 4, 10)} />
      ))}
      <Person
        kind="susanoo"
        color={SIL}
        outline
        outlineColor={KIN}
        x={interpolate(ramp(f, 16, 100), [0, 1], [-120, 250])}
        y={1840}
        scale={0.82}
        walk={f > 16 && f < 100 ? f * 0.3 : undefined}
        arm={f < 100 ? 30 : 30 + 100 * ramp(f, 100, 112) - 60 * ramp(f, SL, SL + 6)}
        spearTilt={-40 * ramp(f, SL - 2, SL + 4)}
        lean={8 * ramp(f, SL - 2, SL + 4)}
      />
      <SlashLine f={f} at={SL} from={[120, 1300]} to={[1000, 600]} arc={60} />
      <Flash f={f} at={SL} />
      {f >= 150 ? <GlowSword x={sx} y={sy + 200} s={interpolate(rise, [0, 1], [0.6, 1.1])} glow={ramp(f, 150, 170)} /> : null}
      <Heading text="八岐大蛇" t={pop(f, 4, 10) * (1 - ramp(f, 176, 186))} y={200} size={84} {...HEAD} />
      <Tag x={250} y={1300} text="スサノオ" size={50} t={pop(f, 40, 10) * (1 - ramp(f, 150, 160))} rot={-3} bg={SIL} color={KIN} />
      <Tag x={540} y={1460} text="天照大神へ献上" size={64} t={pop(f, 214, 12)} rot={-2} bg={KIN} color={NIGHT} />
    </Stage>
  );
};

// =====================================================================
// seg3 12〜21秒 天孫降臨とヤマトタケル：剣が地上へ／野火を薙いで「草薙剣」
// =====================================================================
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const SL = SLASHES.seg3[0];
  const descend = ramp(f, 6, 84, Easing.inOut(Easing.cubic));
  const field = ramp(f, 84, 104);
  const fire = ramp(f, 100, 140) * (1 - ramp(f, SL, SL + 30) * 0.75);
  return (
    <Stage f={f} look="kusanagi">
      {/* 天上から雲を抜けて降りる剣 */}
      <g opacity={1 - field}>
        <Kasumi f={f} bands={[[520, 620, 0.6, 100], [600, 420, -0.5, 700], [1250, 640, 0.5, 400], [1330, 400, -0.4, 1000]]} />
        <GlowSword x={540} y={interpolate(descend, [0, 1], [500, 1700])} s={1.1} glow={1} />
        <Heading text="天孫降臨" t={pop(f, 4, 10)} y={200} size={84} {...HEAD} />
        <Tag x={540} y={1800} text="剣は地上へ" size={54} t={pop(f, 50, 10)} rot={-2} bg={SIL} color={KIN} />
      </g>
      {/* 野火に囲まれたヤマトタケル */}
      {field > 0 ? (
        <g opacity={field}>
          <rect x={0} y={1500} width={1080} height={420} fill="#0F1A14" />
          <Flames f={f} x={-40} y={1520} w={1160} h={520} t={fire} />
          <Grass f={f} x={-20} y={1900} w={1120} h={300} cut={ramp(f, SL, SL + 26, Easing.out(Easing.cubic))} cutY={150} />
          <Person
            kind="takeru"
            x={540}
            y={1860}
            scale={0.85}
            arm={interpolate(ramp(f, 150, SL - 2), [0, 1], [60, 150]) - 120 * ramp(f, SL - 2, SL + 6)}
            spearTilt={-30 * ramp(f, SL - 2, SL + 6)}
            lean={10 * ramp(f, SL - 2, SL + 6)}
          />
          <SlashLine f={f} at={SL} from={[60, 1740]} to={[1020, 1740]} arc={-120} />
          <Flash f={f} at={SL} />
          <Heading text="ヤマトタケル" t={pop(f, 100, 10)} y={200} size={80} {...HEAD} />
          <Tag x={540} y={470} text="野火を剣で薙ぐ" size={60} t={pop(f, 130, 10)} rot={-2} bg={SIL} color={KIN} />
          <g transform={`translate(540,${interpolate(pop(f, SL + 12, 14), [0, 1], [760, 720])})`} opacity={ramp(f, SL + 12, SL + 22)}>
            <text x={0} y={0} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={170} fill={KIN} stroke={NIGHT} strokeWidth={18} paintOrder="stroke">
              草薙剣
            </text>
          </g>
        </g>
      ) : null}
    </Stage>
  );
};

// =====================================================================
// seg4 21〜29秒 熱田へ：剣は尾張に残され、熱田神宮へ（御神体とされる）
// =====================================================================
const CAM_ATSUTA: Cam = { lon: 136.75, lat: 35.05, zoom: 4.2, cy: 760 };
const NOBONO: LL = [136.47, 34.88];
const OWARI: LL = [136.9, 35.2];
const ATSUTA: LL = [136.908, 35.128];
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const cam = CAM_ATSUTA;
  const no = project(cam, NOBONO);
  const ow = project(cam, OWARI);
  const at = project(cam, ATSUTA);
  const go = ramp(f, 60, 110, Easing.inOut(Easing.cubic));
  const route = partial([ow, at], go);
  const shrineIn = ramp(f, 120, 150, Easing.out(Easing.cubic));
  return (
    <Stage f={f} look="kusanagi">
      <MapLayer cam={cam} lands={LANDS_ALL} />
      <PlaceLabel x={no[0]} y={no[1]} text="能褒野" dx={-70} dy={0} size={40} t={ramp(f, 10, 20)} />
      <Token x={no[0]} y={no[1]} kind="takeru" r={34} t={1 - ramp(f, 24, 50)} />
      <PlaceLabel x={ow[0]} y={ow[1]} text="尾張" dx={70} dy={-20} size={40} t={ramp(f, 30, 40)} />
      <path d={polyPath(route, false)} stroke={KIN} strokeWidth={10} strokeDasharray="18 12" fill="none" />
      <GlowSword x={interpolate(go, [0, 1], [ow[0], at[0]])} y={interpolate(go, [0, 1], [ow[1], at[1]]) + 70} s={0.32} glow={0.9} opacity={ramp(f, 30, 42)} />
      <PlaceLabel x={at[0]} y={at[1]} text="熱田" dx={-74} dy={40} size={44} t={ramp(f, 100, 110)} />
      <Heading text="尾張に残された剣" t={pop(f, 0, 10)} y={200} size={74} {...HEAD} />
      {/* 熱田神宮の社殿（扉の奥に光） */}
      <g transform={`translate(0,${interpolate(shrineIn, [0, 1], [300, 0])})`} opacity={shrineIn}>
        <Shrine x={540} y={1640} s={0.95} doors={ramp(f, 150, 170) * (1 - ramp(f, 200, 216))} inner={1} />
        <Tag x={540} y={1330} text="熱田神宮" size={70} t={pop(f, 136, 10)} rot={-2} bg={KIN} color={NIGHT} />
        <Tag x={540} y={1850} text="御神体として祀られているとされる" size={44} t={pop(f, 170, 10)} rot={1} bg={SIL} color={PAPER} />
      </g>
    </Stage>
  );
};

// =====================================================================
// seg5 29〜38秒 盗難事件：日本書紀の記録（新羅の僧）／戻った剣／閉ざされた「不開門」
// =====================================================================
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const walk = ramp(f, 46, 140, Easing.linear);
  const monkX = interpolate(walk, [0, 1], [720, 260]);
  const back = ramp(f, 148, 186, Easing.inOut(Easing.cubic));
  const swordPos: [number, number] = back > 0 ? [interpolate(back, [0, 1], [300, 790]), interpolate(back, [0, 1], [1460, 1010]) - Math.sin(back * Math.PI) * 300] : [monkX + 70, 1560];
  const close = ramp(f, GATE_CLOSE - 14, GATE_CLOSE, Easing.in(Easing.quad));
  const wind = ramp(f, 140, 150) * (1 - ramp(f, 186, 196));
  return (
    <Stage f={f} look="kusanagi">
      <Shrine x={790} y={1110} s={0.7} doors={ramp(f, 22, 40) * (1 - ramp(f, 186, 200))} inner={0.8} />
      <Gate x={300} y={1720} s={0.95} close={close} lock={ramp(f, GATE_CLOSE + 2, GATE_CLOSE + 12)} />
      {/* 剣を抱えて門へ向かう僧（門をくぐったところで嵐に遭う） */}
      <Person kind="monk" color={SIL} outline outlineColor={KIN} x={monkX} y={1800} scale={0.6} flip walk={f > 46 && f < 140 ? f * 0.32 : undefined} arm={30} opacity={1 - ramp(f, 136, 150)} />
      {f >= 40 ? <GlowSword x={swordPos[0]} y={swordPos[1]} s={0.35} rot={back > 0 ? -30 + back * 30 : -70} glow={0.8} opacity={1 - ramp(f, 186, 196)} /> : null}
      {/* 嵐 */}
      {wind > 0
        ? Array.from({ length: 18 }, (_, i) => {
            const y = 500 + ((i * 83) % 1100);
            const x = ((f * 40 + i * 151) % 1400) - 200;
            return <path key={i} d={`M${x},${y} q120,-30 240,0`} stroke="#9FB4E0" strokeWidth={5} fill="none" opacity={0.5 * wind} />;
          })
        : null}
      <Heading text="日本書紀の記録" t={pop(f, 0, 10)} y={200} size={76} {...HEAD} />
      <Tag x={540} y={400} text="新羅の僧が剣を盗む" size={58} t={pop(f, 30, 10) * (1 - ramp(f, 150, 160))} rot={-2} bg={SIL} color={KIN} />
      <Tag x={540} y={400} text="剣は戻ってきた" size={58} t={pop(f, 176, 10)} rot={2} bg={KIN} color={NIGHT} />
      <Tag x={300} y={1240} text="不開門" size={80} t={pop(f, GATE_CLOSE + 4, 10)} rot={-3} bg={SHU} color={PAPER} />
      <Tag x={760} y={1520} text="今も閉ざされたまま" size={46} t={pop(f, GATE_CLOSE + 16, 10)} rot={2} bg={SIL} color={PAPER} />
    </Stage>
  );
};

// =====================================================================
// seg6 38〜47秒 壇ノ浦と竜宮の伝説：安徳天皇と沈む剣／大蛇の生まれ変わりが竜宮へ帰る
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const dive = ramp(f, 66, 130, Easing.inOut(Easing.cubic)); // 海の中へ潜っていく
  const surfaceY = interpolate(dive, [0, 1], [980, -260]);
  const sink = ramp(f, 80, 210, Easing.inOut(Easing.quad));
  const dragon = ramp(f, 150, 262, Easing.inOut(Easing.quad));
  return (
    <Stage f={f} look="kusanagi">
      {/* 海の中（深くなるほど暗い青緑） */}
      <linearGradient id="deepSea" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#1C4A6E" />
        <stop offset="1" stopColor="#071628" />
      </linearGradient>
      <rect x={0} y={surfaceY} width={1080} height={2400} fill="url(#deepSea)" />
      {/* 光の筋 */}
      {[180, 420, 700, 900].map((x, i) => (
        <path key={x} d={`M${x},${surfaceY} L${x - 120},${surfaceY + 1600} L${x - 40},${surfaceY + 1600}Z`} fill="#BFEFFF" opacity={0.06 + 0.03 * Math.sin(f * 0.05 + i)} />
      ))}
      <Waves f={f} y={surfaceY - 20} color="#2A4A78" amp={22} />
      <Waves f={f + 40} y={surfaceY + 10} color="#1F3B63" amp={18} speed={-1.5} />
      {/* 海上の平家の舟 */}
      <g transform={`translate(0,${surfaceY - 980})`}>
        <Boat x={300} y={950} s={0.8} tilt={Math.sin(f * 0.06) * 4} />
        <Boat x={780} y={970} s={0.7} tilt={Math.sin(f * 0.05 + 1) * 5} />
      </g>
      <Bubbles f={f} amount={dive} />
      <Ryugu x={540} y={1880} s={1.0} glow={ramp(f, 140, 190)} opacity={ramp(f, 120, 160)} />
      <Dragon f={f} t={dragon} opacity={ramp(f, 150, 166)} />
      {/* 沈んでいく幼い天皇と剣 */}
      <g opacity={ramp(f, 60, 80) * (1 - ramp(f, 214, 240) * 0.7)}>
        <Person kind="folk" color={PAPER} outline x={500} y={interpolate(sink, [0, 1], [1000, 1420])} scale={0.38} arm={70} lean={-10} filter="url(#paperLow)" />
        <GlowSword x={600} y={interpolate(sink, [0, 1], [1040, 1480])} s={0.4} rot={20 + sink * 40} glow={0.9} />
      </g>
      <Heading text="壇ノ浦" t={pop(f, 4, 10) * (1 - ramp(f, 140, 150))} y={200} size={84} {...HEAD} />
      <Tag x={540} y={360} text="安徳天皇と沈む剣" size={56} t={pop(f, 60, 10) * (1 - ramp(f, 140, 150))} rot={-2} bg={SIL} color={KIN} />
      <Heading text="平家物語の伝説" t={pop(f, 150, 10)} y={200} size={76} {...HEAD} />
      <Tag x={540} y={360} text="大蛇は竜宮へ帰った" size={58} t={pop(f, 196, 10)} rot={2} bg={JADE} color={NIGHT} />
    </Stage>
  );
};

// =====================================================================
// seg7 47〜52秒 検証：誰にも公開されない／天皇でさえ見ない／確かめる方法がない
// =====================================================================
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  return (
    <Stage f={f} look="kusanagi">
      <Shrine x={540} y={1060} s={1.4} doors={0} />
      {/* 閉ざされた扉の向こうの剣（点線）と問い */}
      <Sword x={540} y={1110} scale={0.75} dashed color={KIN} opacity={0.5 + 0.3 * Math.sin(f * 0.12)} />
      <text x={540} y={720} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={180} fill={KIN} opacity={ramp(f, 30, 44)}>
        ？
      </text>
      <Heading text="誰にも公開されない" t={pop(f, 0, 10)} y={200} size={72} {...HEAD} />
      <Tag x={540} y={1400} text="天皇でさえ実物を見ない決まり" size={50} t={pop(f, 40, 10)} rot={-1} bg={SIL} color={PAPER} />
      <Stamp x={540} y={1640} text="確かめる方法がない" size={80} t={stampT(f, "seg7", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg8 52〜56秒 二択：これはあった？ なかった？
// =====================================================================
export const Seg8: React.FC = () => {
  const f = useSegFrame("seg8");
  const card = (x: number, letter: string, line1: string, line2: string, color: string, at: number, seed: number) => {
    const t = pop(f, at, 12);
    if (t <= 0) return null;
    const wob = f > at + 12 ? sway(f, seed, 2.2, 0.12) : 0;
    return (
      <g transform={`translate(${x},1240) rotate(${(seed === 1 ? -4 : 4) + wob}) scale(${interpolate(t, [0, 1], [0.3, 1])})`} opacity={clamp01(t * 2)}>
        <g filter="url(#paper)">
          <rect x={-235} y={-330} width={470} height={660} rx={10} fill={color} />
        </g>
        <rect x={-210} y={-305} width={420} height={610} rx={6} fill="none" stroke={KIN} strokeWidth={5} opacity={0.85} />
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
    <Stage f={f} look="kusanagi">
      <GlowSword x={540} y={880} s={0.8} glow={0.8 + 0.2 * Math.sin(f * 0.2)} />
      <Heading text="これはあった？ なかった？" t={pop(f, 0, 10)} y={210} size={70} {...HEAD} />
      {card(285, "A", "本物が", "熱田にある派", SHU, 10, 1)}
      {card(795, "B", "物語の中に", "だけある派", "#1F5E57", 18, 2)}
      <Tag x={540} y={1720} text="コメントで教えてね" size={60} t={pop(f, 32, 10)} rot={-1} bg={KIN} color={NIGHT} />
    </Stage>
  );
};

// =====================================================================
// seg9 56〜60秒 チャンネル登録エンドカード（これまでと同じ型）
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
    <Stage f={f} look="kusanagi">
      {/* 夜の上に生成りの紙を一枚貼って、これまでと同じエンドカードにする */}
      <g filter="url(#paper)">
        <rect x={60} y={150} width={960} height={1560} rx={12} fill={PAPER} />
      </g>
      <rect x={84} y={174} width={912} height={1512} rx={8} fill="none" stroke={KIN} strokeWidth={4} />
      <Sun x={540} y={560} r={130} rot={f * 0.4} opacity={0.75 * ramp(f, 0, 14)} />
      <Heading text="この動画がよかったら" t={pop(f, 2, 10)} y={300} size={64} {...HEAD} />
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
      <Tag x={540} y={1560} text="もしも日本史ラボ" size={66} t={pop(f, 90, 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

export const SEGMENTS_KUSANAGI: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };

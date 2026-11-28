import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Cam, LL, partial, polyPath, project } from "../jimmu/geo";
import { clamp01, Heading, MapLayer, pop, ramp, Stage, Stamp, sway, Tag, Token } from "../jimmu/paper";
import { Crow, Person, Sun } from "../jimmu/figures";
import { AI, CHANNEL, KIN, MINCHO, PAPER, PAPER_DARK, RURI, SHU, SUMI } from "../jimmu/theme";
import { LANDS_ALL } from "../takeru/geo";
import { CLICK_AT, FALL_AT, FUWA_AT, HOLD, segFrames, SegId, STAMPS } from "./events";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
const HEAD = { bg: RURI, color: PAPER };
const OTOMO = "#5A5A66"; // 大友方（鈍色）
const TENJI = "#6B4E32";

/** 大海人／天武（瑠璃紺・赤い布） */
const Ama: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number; walk?: number; lean?: number; monk?: boolean }> = ({
  x, y, s = 0.8, arm = 40, flip = false, opacity = 1, walk, lean = 0, monk = false,
}) => <Person kind={monk ? "monk" : "tenmu"} color={monk ? RURI : undefined} x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} walk={walk} lean={lean} outline outlineColor={KIN} />;
/** 大友皇子（鈍色） */
const Otomo: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number; fall?: number }> = ({ x, y, s = 0.7, arm = 40, flip = false, opacity = 1, fall = 0 }) => (
  <Person kind="sujin" color={OTOMO} x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} fall={fall} />
);
/** 天智天皇（茶） */
const Tenji: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number }> = ({ x, y, s = 0.6, arm = 40, flip = false, opacity = 1 }) => (
  <Person kind="sujin" color={TENJI} x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} />
);

/** 継承の矢印（a から b へ。t で伸びる） */
const SuccArrow: React.FC<{ a: [number, number]; b: [number, number]; t: number; color?: string; dashed?: boolean; label?: string }> = ({ a, b, t, color = KIN, dashed = false, label }) => {
  if (t <= 0) return null;
  const e: [number, number] = [a[0] + (b[0] - a[0]) * clamp01(t), a[1] + (b[1] - a[1]) * clamp01(t)];
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return (
    <g>
      <path d={`M${a[0]},${a[1]} L${e[0]},${e[1]}`} stroke={color} strokeWidth={14} strokeLinecap="round" strokeDasharray={dashed ? "22 16" : undefined} />
      <path transform={`translate(${e[0]},${e[1]}) rotate(${(ang * 180) / Math.PI})`} d="M30,0 L-10,22 L-10,-22Z" fill={color} />
      {label && t > 0.6 ? (
        <text x={(a[0] + e[0]) / 2 + 30} y={(a[1] + e[1]) / 2} fontFamily={MINCHO} fontWeight={800} fontSize={40} fill={SUMI} stroke={PAPER} strokeWidth={8} paintOrder="stroke">
          {label}
        </text>
      ) : null}
    </g>
  );
};

// =====================================================================
// seg1 0〜3秒 フック：「実は後継者から外された天皇」
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  const slam = interpolate(f, [0, 4, 7], [1.08, 0.97, 1], { extrapolateRight: "clamp" });
  const shake = f < 12 ? Math.sin(f * 2.7) * (12 - f) * 1.2 : 0;
  const up = ramp(f, 46, 58, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} peel={false} look="tenmu">
      {/* 冠が大海人の頭上から外れて飛んでいく */}
      <Sun x={540} y={1240} r={220} rot={f * 0.3} opacity={0.5} />
      <Ama x={540} y={1880} s={1.0} arm={40 + sway(f, 1, 4)} />
      <g transform={`translate(${540 + 300 * ramp(f, 16, 50)},${1060 - 80 * ramp(f, 16, 50)}) rotate(${40 * ramp(f, 16, 50)})`} opacity={0.9}>
        <rect x={-44} y={-30} width={88} height={60} rx={8} fill={KIN} />
        <rect x={-64} y={22} width={128} height={18} rx={6} fill={KIN} />
      </g>
      <g transform={`translate(${540 + shake},${interpolate(up, [0, 1], [640, 330])}) scale(${slam * interpolate(up, [0, 1], [1, 0.62])})`}>
        <rect x={-500} y={-270} width={1000} height={430} rx={14} fill={SUMI} opacity={0.92} />
        <rect x={-484} y={-254} width={968} height={398} rx={10} fill="none" stroke={SHU} strokeWidth={6} />
        <text x={0} y={-80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={110} fill={PAPER}>
          実は後継者から
        </text>
        <text x={0} y={80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={120} fill="#F08A72">
          外された天皇
        </text>
      </g>
      <Stamp x={540} y={780} text="次の天皇のはずだった" size={72} t={stampT(f, "seg1", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜13秒 背景：皇太弟だった大海人 → 大友が太政大臣に → 出家して吉野へ
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const tenji: [number, number] = [540, 560];
  const ama: [number, number] = [260, 1000];
  const oto: [number, number] = [820, 1000];
  const toAma = ramp(f, 30, 60);
  const swing = ramp(f, 110, 150, Easing.inOut(Easing.cubic));
  const leave = ramp(f, 190, 260, Easing.inOut(Easing.cubic));
  const target: [number, number] = [ama[0] + (oto[0] - ama[0]) * swing, ama[1] - 120];
  return (
    <Stage f={f} look="tenmu">
      <Heading text="天智天皇の後継者は？" t={pop(f, 0, 10) * (1 - ramp(f, 180, 190))} y={190} size={74} {...HEAD} />
      <Heading text="出家して吉野へ" t={pop(f, 190, 10)} y={190} size={78} {...HEAD} />
      <g opacity={1 - leave * 0.6}>
        <Tenji x={tenji[0]} y={tenji[1] + 180} s={0.42} />
        <Tag x={tenji[0]} y={tenji[1] + 250} text="天智天皇" size={46} t={pop(f, 8, 10)} rot={-2} bg={TENJI} color={PAPER} />
        <SuccArrow a={[tenji[0], tenji[1] + 300]} b={[target[0], target[1] + 40]} t={toAma} color={KIN} />
        <Tag x={540} y={tenji[1] + 420} text={swing < 0.5 ? "次の天皇" : "あとを継がせたい"} size={40} t={ramp(f, 50, 60)} rot={0} />
        <Otomo x={oto[0]} y={oto[1] + 300} s={0.5} flip />
        <Tag x={oto[0]} y={oto[1] + 360} text="大友皇子（子）" size={44} t={pop(f, 20, 10)} rot={2} bg={OTOMO} color={PAPER} />
        <Tag x={oto[0]} y={oto[1] + 470} text="太政大臣" size={56} t={pop(f, 112, 10)} rot={4} bg={KIN} color={SUMI} />
      </g>
      {/* 大海人：皇太弟 → 出家 → 吉野の山へ */}
      <Ama x={ama[0] - 200 * leave} y={ama[1] + 300 + 60 * leave} s={0.55} monk={f > 200} walk={leave > 0 && leave < 1 ? f * 0.3 : undefined} opacity={1 - ramp(f, 250, 275) * 0.6} />
      <Tag x={ama[0]} y={ama[1] + 360} text="大海人皇子（弟）" size={44} t={pop(f, 14, 10) * (1 - leave)} rot={-2} bg={RURI} color={PAPER} />
      <Tag x={ama[0]} y={ama[1] + 470} text="皇太弟" size={56} t={pop(f, 64, 10) * (1 - ramp(f, 150, 160))} rot={-4} bg={RURI} color={PAPER} />
      {/* 吉野の山 */}
      <g opacity={leave} filter="url(#paperLow)">
        <path d="M-60,1920 L120,1520 L260,1680 L420,1460 L620,1920Z" fill="#5F6E4A" />
        <path d="M200,1920 L380,1600 L560,1920Z" fill="#7A845A" />
      </g>
      <Stamp x={540} y={1500} text="外された" size={110} t={stampT(f, "seg2", 0)} rot={-6} />
    </Stage>
  );
};

// =====================================================================
// seg3 13〜22秒 挙兵：672年6月 吉野 → 伊賀 → 鈴鹿 → 美濃（不破をふさぐ）／東の国々の兵
// =====================================================================
const CAM_MAP: Cam = { lon: 136.15, lat: 34.95, zoom: 4.6, cy: 1000 };
const ROUTE: LL[] = [
  [135.86, 34.37], [136.0, 34.55], [136.13, 34.79], [136.4, 34.88], [136.62, 35.0], [136.68, 35.12], [136.55, 35.3], [136.48, 35.36],
];
const P = (ll: LL, cam: Cam = CAM_MAP) => project(cam, ll);
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const go = ramp(f, 20, 110, Easing.inOut(Easing.quad));
  const pts = ROUTE.map((p) => P(p));
  const seg = partial(pts, go);
  const head = seg[seg.length - 1];
  const fuwa = P([136.48, 35.36]);
  const gate = ramp(f, FUWA_AT - 8, FUWA_AT, Easing.in(Easing.quad));
  const gather = ramp(f, 130, 200, Easing.inOut(Easing.cubic));
  const east: LL[] = [[137.2, 35.5], [137.4, 35.2], [137.0, 34.9], [137.3, 35.75]];
  return (
    <Stage f={f} look="tenmu">
      <MapLayer cam={CAM_MAP} lands={LANDS_ALL} seaRect={[40, 330, 1000, 1300]} />
      {/* 琵琶湖 */}
      <g filter="url(#paperLow)">
        <path
          d={polyPath(([[136.02, 35.55], [136.2, 35.48], [136.27, 35.3], [136.12, 35.12], [135.98, 35.02], [135.93, 34.98], [135.88, 35.05], [135.95, 35.2], [135.98, 35.38]] as LL[]).map((ll) => P(ll)))}
          fill="#3E6688"
        />
      </g>
      {(
        [
          ["吉野", [135.86, 34.37], -80, 30],
          ["美濃", [136.75, 35.45], 90, -30],
          ["近江", [136.05, 35.25], -40, 0],
        ] as [string, LL, number, number][]
      ).map(([n, ll, dx, dy]) => {
        const p = P(ll);
        return (
          <text key={n} x={p[0] + dx} y={p[1] + dy} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={60} fill={SUMI} opacity={0.3}>
            {n}
          </text>
        );
      })}
      {go > 0 ? <path d={polyPath(seg, false)} fill="none" stroke={SHU} strokeWidth={12} strokeDasharray="20 12" strokeLinecap="round" /> : null}
      {/* 不破の関：道をふさぐ柵 */}
      <g transform={`translate(${fuwa[0]},${fuwa[1]})`} opacity={gate}>
        <rect x={-70} y={-16} width={140} height={32} fill="#5A3B20" />
        {[-60, -30, 0, 30, 60].map((x) => (
          <rect key={x} x={x - 6} y={-50} width={12} height={84} fill="#5A3B20" />
        ))}
      </g>
      <Tag x={fuwa[0] + 150} y={fuwa[1] - 90} text="不破をふさぐ" size={48} t={pop(f, FUWA_AT, 10)} rot={3} bg={SHU} color={PAPER} />
      {/* 東の国々の兵が集まる */}
      {east.map((ll, i) => {
        const s0 = P(ll);
        const p: [number, number] = [s0[0] + (fuwa[0] + 60 - s0[0]) * gather, s0[1] + (fuwa[1] + 60 - s0[1]) * gather];
        return <Token key={i} x={p[0] + i * 10} y={p[1] + i * 8} kind="jimmu" r={26} t={ramp(f, 126 + i * 4, 136 + i * 4)} />;
      })}
      <Token x={head[0]} y={head[1]} kind="jimmu" r={36} t={ramp(f, 14, 22)} rot={sway(f, 2, 6, 0.5)} />
      <Heading text="672年6月 吉野を出る" t={pop(f, 0, 10)} y={200} size={72} {...HEAD} />
      <Stamp x={540} y={1760} text="東の国々の兵を味方に" size={66} t={stampT(f, "seg3", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg4 22〜30秒 決戦：瀬田橋の戦い／大友皇子の自害／約1か月で決着
// =====================================================================
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const push = ramp(f, 40, FALL_AT, Easing.inOut(Easing.quad));
  const fallT = ramp(f, FALL_AT, FALL_AT + 30, Easing.in(Easing.quad));
  const cal = ramp(f, 130, 150);
  return (
    <Stage f={f} look="tenmu">
      <Heading text="瀬田橋の戦い" t={pop(f, 0, 10)} y={190} size={84} {...HEAD} />
      {/* 川と橋（上から見た図） */}
      <g filter="url(#paperLow)">
        <rect x={480} y={330} width={160} height={980} fill="#3E6688" />
      </g>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={490 + ((f * 2 + i * 40) % 140)} y={360 + i * 120} width={30} height={4} fill="#9EC0D8" opacity={0.7} />
      ))}
      <g filter="url(#paperLow)">
        <rect x={420} y={780} width={280} height={60} fill="#7A5634" />
        {[440, 500, 560, 620, 680].map((x) => (
          <rect key={x} x={x - 6} y={770} width={12} height={80} fill="#5A3B20" />
        ))}
      </g>
      <Tag x={560} y={300} text="瀬田川" size={40} t={pop(f, 8, 10)} rot={0} />
      <Tag x={220} y={460} text="大友方" size={48} t={pop(f, 12, 10)} rot={-3} bg={OTOMO} color={PAPER} />
      <Tag x={880} y={460} text="大海人方" size={48} t={pop(f, 16, 10)} rot={3} bg={RURI} color={PAPER} />
      {/* 両軍の駒：東（右）が西（左）へ押し込む */}
      {Array.from({ length: 6 }, (_, i) => {
        const y = 560 + (i % 3) * 260;
        const x = 880 - (i < 3 ? 0 : 110) - push * (i < 3 ? 520 : 470);
        return <Token key={`a${i}`} x={x} y={y + (i < 3 ? 0 : 130)} kind="jimmu" r={36} t={ramp(f, 20 + i * 3, 30 + i * 3)} rot={sway(f, i, 6, 0.4)} />;
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const y = 600 + (i % 3) * 260 + (i >= 3 ? 130 : 0);
        const x = 240 - (i >= 3 ? 110 : 0) - push * 120;
        return <Token key={`o${i}`} x={x} y={y} kind="enemy" r={34} t={ramp(f, 20 + i * 3, 30 + i * 3) * (1 - fallT * 0.7)} rot={fallT * 70 * (i % 2 ? 1 : -1)} />;
      })}
      {/* 下段：大友皇子が倒れる */}
      <Otomo x={300} y={1880} s={0.6} fall={fallT} opacity={1 - ramp(f, FALL_AT + 30, FALL_AT + 60) * 0.6} />
      <Tag x={300} y={1340} text="大友皇子 自害" size={52} t={pop(f, FALL_AT + 10, 10)} rot={-3} bg={SUMI} color={PAPER} />
      {/* 日付 */}
      <g opacity={cal} transform="translate(780,1660)">
        <g filter="url(#paperLow)">
          <rect x={-200} y={-140} width={400} height={280} rx={10} fill={PAPER} />
        </g>
        <text x={0} y={-60} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={SUMI}>
          6月24日 → 7月23日
        </text>
        <text x={0} y={60} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={86} fill={SHU}>
          約1か月
        </text>
      </g>
      <Stamp x={790} y={1330} text="決着" size={110} t={stampT(f, "seg4", 0)} rot={-6} />
    </Stage>
  );
};

// =====================================================================
// seg5 30〜39秒 即位：飛鳥で即位、外された後継者が皇位を取り戻す／天皇の木簡
// =====================================================================
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const back = ramp(f, 50, 100, Easing.out(Easing.back(1.3)));
  const crownT = ramp(f, 60, 100, Easing.inOut(Easing.cubic));
  const mokkan = ramp(f, 150, 175);
  return (
    <Stage f={f} look="tenmu">
      <Heading text="673年 飛鳥で即位" t={pop(f, 0, 10)} y={190} size={78} {...HEAD} />
      {/* 宮（飛鳥浄御原宮の雰囲気） */}
      <g filter="url(#paper)">
        <rect x={140} y={900} width={800} height={50} fill="#8C8270" />
        {[220, 400, 680, 860].map((x) => (
          <rect key={x} x={x - 16} y={560} width={32} height={340} fill={SHU} />
        ))}
        <path d="M80,570 Q540,470 1000,570 L1000,530 Q540,400 80,530Z" fill="#2B2216" />
      </g>
      <Sun x={540} y={680} r={150} rot={f * 0.3} opacity={0.7 * ramp(f, 40, 70)} />
      <Ama x={540} y={900} s={0.5} arm={60 + 60 * back} />
      {/* 飛んでいった冠が戻ってくる */}
      <g transform={`translate(${interpolate(crownT, [0, 1], [1000, 545])},${interpolate(crownT, [0, 1], [300, 575])}) rotate(${interpolate(crownT, [0, 1], [40, 0])})`} opacity={ramp(f, 56, 64)}>
        <rect x={-22} y={-15} width={44} height={30} rx={4} fill={KIN} />
        <rect x={-32} y={11} width={64} height={9} rx={3} fill={KIN} />
      </g>
      <Stamp x={540} y={1110} text="皇位を取り戻した" size={80} t={stampT(f, "seg5", 0)} rot={-4} />
      {/* 木簡「天皇」 */}
      <g opacity={mokkan} transform={`translate(780,1580) rotate(-6) scale(${0.6 + 0.4 * mokkan})`}>
        <g filter="url(#paper)">
          <rect x={-60} y={-260} width={120} height={520} rx={10} fill="#C9A86A" />
        </g>
        <path d="M-60,-200 L-40,-210 M60,180 L40,190" stroke="#8C7038" strokeWidth={4} />
        {["天", "皇"].map((c, i) => (
          <text key={c} x={0} y={-120 + i * 130} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={110} fill={SUMI}>
            {c}
          </text>
        ))}
      </g>
      <Tag x={330} y={1480} text="この時代の木簡" size={52} t={pop(f, 160, 10)} rot={-3} bg={SUMI} color={PAPER} />
      <Tag x={330} y={1600} text="「天皇」の呼び名が確実に" size={44} t={pop(f, 170, 10)} rot={2} />
    </Stage>
  );
};

// =====================================================================
// seg6 39〜47秒 IF：負けていたら → 大友の系統が続き、天武は「反乱者」で終わっていた
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const flip = ramp(f, 40, 80, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} tint="#7f8a95" tintOpacity={0.26} look="tenmu">
      <Stamp x={540} y={230} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="もし壬申の乱に負けていたら" size={56} t={pop(f, 8, 10)} rot={1} />
      {/* 大友が玉座に、大海人は縄で縛られた札に */}
      <Sun x={760} y={860} r={140} rot={f * 0.3} opacity={0.6 * flip} color="#B9B9C4" />
      <Otomo x={760} y={1180} s={0.62} arm={60 + 40 * flip} opacity={ramp(f, 30, 50)} />
      <Tag x={760} y={1260} text="大友の系統が続く" size={46} t={pop(f, 70, 10)} rot={3} bg={OTOMO} color={PAPER} />
      <Ama x={300} y={1180} s={0.62} arm={20} opacity={1 - flip * 0.4} />
      {/* 「反乱者」の札が貼られる */}
      <g transform={`translate(300,${interpolate(pop(f, 110, 12), [0, 1], [700, 800])})`} opacity={ramp(f, 110, 120)}>
        <g filter="url(#paperLow)">
          <rect x={-130} y={-60} width={260} height={120} rx={8} fill={SUMI} />
        </g>
        <text x={0} y={22} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={66} fill="#F08A72">
          反乱者
        </text>
      </g>
      <Stamp x={540} y={1560} text="反乱者で終わっていた" size={74} t={stampT(f, "seg6", 1)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg7 47〜53秒 判定：外されて、実力で取り戻した、実在が確かな天皇
// =====================================================================
const VerdictStamp: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t <= 0) return null;
  const s = interpolate(t, [0, 0.7, 1], [2.0, 0.95, 1]);
  return (
    <g transform={`translate(${x},${y}) rotate(-3) scale(${s})`} opacity={clamp01(t * 3)}>
      <rect x={-420} y={-150} width={840} height={300} rx={10} fill="none" stroke={SHU} strokeWidth={14} />
      <rect x={-400} y={-130} width={800} height={260} rx={6} fill="none" stroke={SHU} strokeWidth={5} />
      <text x={0} y={-28} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={70} fill={SHU}>
        外された後継者が
      </text>
      <text x={0} y={100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={92} fill={SHU}>
        実力で取り戻した
      </text>
    </g>
  );
};
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  return (
    <Stage f={f} look="tenmu">
      <Stamp x={540} y={200} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      <Sun x={540} y={620} r={170} rot={f * 0.3} opacity={0.7 * ramp(f, 6, 24)} />
      <Ama x={540} y={900} s={0.5} arm={100} />
      <VerdictStamp x={540} y={1150} t={stampT(f, "seg7", 1)} />
      <Stamp x={540} y={1440} text="実在は確か" size={80} t={ramp(f, STAMPS.seg7[1] + 8, STAMPS.seg7[1] + 18)} rot={4} color={KIN} />
    </Stage>
  );
};

// =====================================================================
// seg8 53〜58秒 二択：A 正当な後継者派 / B 実力で奪った派
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
          <text key={i} x={0} y={60 + i * 100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={64} fill={PAPER}>
            {l}
          </text>
        ))}
      </g>
    );
  };
  return (
    <Stage f={f} look="tenmu">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} />
      <Ama x={540} y={830} s={0.52} arm={60 + sway(f, 1, 6)} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} {...HEAD} />
      {card(285, "A", ["正当な", "後継者派"], RURI, 12, 1)}
      {card(795, "B", ["実力で", "奪った派"], SHU, 22, 2)}
      <Tag x={540} y={1700} text="コメントで教えてね" size={60} t={pop(f, 40, 10)} rot={-1} />
    </Stage>
  );
};

// =====================================================================
// seg9 58〜64秒 チャンネル登録エンドカード
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
    <Stage f={f} look="tenmu">
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
      <Tag x={540} y={1560} text={CHANNEL} size={60} t={pop(f, 100, 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

export const SEGMENTS_TENMU: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };
export { PAPER_DARK, AI };

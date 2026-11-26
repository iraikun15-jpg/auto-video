import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Cam, LL, partial, polyPath, project } from "../jimmu/geo";
import { clamp01, Heading, MapLayer, pop, ramp, Stage, Stamp, sway, Tag } from "../jimmu/paper";
import { Crow, Person, Sun } from "../jimmu/figures";
import { AI, KIN, MINCHO, PAPER, PAPER_DARK, SHU, SUMI } from "../jimmu/theme";
import { LANDS_ALL } from "../takeru/geo";
import { CLICK_AT, HOLD, segFrames, SegId, STAMPS, STOPS } from "./events";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
export const YAMABUKI = "#B98A2A";
const HEAD = { bg: YAMABUKI, color: SUMI };
const LAKE = "#3E6688";

const King: React.FC<{ x: number; y: number; s?: number; kasa?: boolean; arm?: number; flip?: boolean; walk?: number; opacity?: number; lean?: number }> = ({
  x,
  y,
  s = 0.8,
  kasa = false,
  arm = 40,
  flip = false,
  walk,
  opacity = 1,
  lean = 0,
}) => <Person kind={kasa ? "keitaiKasa" : "keitai"} x={x} y={y} scale={s} arm={arm} flip={flip} walk={walk} opacity={opacity} lean={lean} outline outlineColor={SUMI} />;

/** 遠山の切り絵（奥行き用に数枚重ねる）。drift で横にずらす */
const Hills: React.FC<{ y: number; color: string; amp: number; seed: number; drift?: number; opacity?: number }> = ({ y, color, amp, seed, drift = 0, opacity = 1 }) => {
  const pts: string[] = [];
  for (let x = -200; x <= 1300; x += 60) {
    const h = Math.sin((x + seed * 97) * 0.006) * amp + Math.sin((x + seed * 31) * 0.017) * amp * 0.35;
    pts.push(`${x + drift},${y - h}`);
  }
  return (
    <g filter="url(#paperLow)" opacity={opacity}>
      <path d={`M-200,2000 L${pts.join(" L")} L1300,2000Z`} fill={color} />
    </g>
  );
};

/** 葦（あし）の穂。f でそよぐ */
const Reeds: React.FC<{ f: number; x: number; y: number; n: number; h: number }> = ({ f, x, y, n, h }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const rx = x + i * 26 + (i % 3) * 7;
      const rh = h * (0.7 + ((i * 37) % 10) / 30);
      const sw = Math.sin(f * 0.06 + i * 0.7) * 12;
      return (
        <g key={i}>
          <path d={`M${rx},${y} Q${rx + sw * 0.4},${y - rh * 0.5} ${rx + sw},${y - rh}`} stroke="#5A5A34" strokeWidth={5} fill="none" />
          <ellipse cx={rx + sw} cy={y - rh - 16} rx={7} ry={22} fill="#8C7A4A" transform={`rotate(${sw},${rx + sw},${y - rh - 16})`} />
        </g>
      );
    })}
  </g>
);

/** 大きな「？」が背景でゆっくり漂う */
const Questions: React.FC<{ f: number; opacity?: number }> = ({ f, opacity = 0.12 }) => (
  <g opacity={opacity}>
    {[
      [150, 520, 220],
      [900, 640, 260],
      [220, 1300, 200],
      [860, 1450, 240],
    ].map(([x, y, s], i) => (
      <text key={i} x={x + Math.sin(f * 0.03 + i) * 20} y={y + Math.cos(f * 0.025 + i) * 16} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={s} fill={SUMI}>
        ？
      </text>
    ))}
  </g>
);

// =====================================================================
// seg1 0〜3秒 フック：「実は出自が謎だらけ？」＋王の影
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  const slam = interpolate(f, [0, 4, 7], [1.08, 0.97, 1], { extrapolateRight: "clamp" });
  const shake = f < 12 ? Math.sin(f * 2.7) * (12 - f) * 1.2 : 0;
  const up = ramp(f, 46, 58, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} peel={false} look="keitai">
      <Questions f={f} opacity={0.14} />
      <Sun x={540} y={1240} r={220} rot={f * 0.3} opacity={0.55} color="#D9B35A" />
      <King x={540} y={1880} s={1.0} arm={50 + sway(f, 1, 4)} />
      <g transform={`translate(${540 + shake},${interpolate(up, [0, 1], [650, 330])}) scale(${slam * interpolate(up, [0, 1], [1, 0.62])})`}>
        <rect x={-490} y={-270} width={980} height={430} rx={14} fill={SUMI} opacity={0.92} />
        <rect x={-474} y={-254} width={948} height={398} rx={10} fill="none" stroke={YAMABUKI} strokeWidth={5} />
        <text x={0} y={-80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={118} fill={PAPER}>
          実は出自が
        </text>
        <text x={0} y={80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={124} fill={YAMABUKI}>
          謎だらけ？
        </text>
      </g>
      <Stamp x={540} y={780} text="本当に天皇家の血筋？" size={70} t={stampT(f, "seg1", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜11秒 登場：近江国から都に呼ばれた地方の王（男大迹王）
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const msg = ramp(f, 70, 130, Easing.out(Easing.cubic));
  const inset = pop(f, 112, 14);
  return (
    <Stage f={f} look="keitai">
      {/* 近江の湖の風景（奥ほどゆっくり流れる） */}
      <Hills y={760} color="#B9B79A" amp={70} seed={1} drift={-f * 0.15} />
      <Hills y={860} color="#9AA27E" amp={60} seed={2} drift={-f * 0.3} />
      <g filter="url(#paperLow)">
        <rect x={0} y={900} width={1080} height={360} fill={LAKE} />
      </g>
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={((i * 151 + f * (1 + (i % 3) * 0.5)) % 1300) - 150} y={940 + i * 30} width={90 + (i % 4) * 40} height={4} rx={2} fill="#9EC0D8" opacity={0.6} />
      ))}
      <g filter="url(#paperLow)">
        <path d="M0,1240 Q300,1210 540,1240 Q800,1270 1080,1230 L1080,1920 L0,1920Z" fill="#C9B88E" />
      </g>
      <Reeds f={f} x={-10} y={1300} n={14} h={200} />
      <Reeds f={f + 30} x={760} y={1310} n={13} h={180} />
      <Heading text="近江国" t={pop(f, 2, 10)} y={200} size={88} {...HEAD} />
      <King x={300} y={1830} s={0.9} kasa arm={30 + 40 * ramp(f, 130, 150)} />
      <Tag x={300} y={1080} text="男大迹王（ヲホド）" size={52} t={pop(f, 30, 10)} rot={-2} bg={SUMI} color={YAMABUKI} />
      {/* 都からの使い（右から来てひざまずく） */}
      {[0, 1].map((k) => (
        <Person
          key={k}
          kind="folk"
          color="#3a332c"
          x={interpolate(msg, [0, 1], [1250 + k * 120, 690 + k * 150])}
          y={1860}
          scale={0.55}
          flip
          walk={msg > 0 && msg < 1 ? f * 0.3 + k : undefined}
          kneel={ramp(f, 132 + k * 6, 150 + k * 6)}
          lean={18 * ramp(f, 132, 150)}
          filter="url(#paperLow)"
        />
      ))}
      {/* 右上：跡継ぎのいない都（空の玉座） */}
      {inset > 0 ? (
        <g transform={`translate(800,470) scale(${0.4 + 0.6 * inset})`} opacity={clamp01(inset * 2)}>
          <g filter="url(#paper)">
            <rect x={-220} y={-150} width={440} height={300} rx={10} fill={PAPER} />
          </g>
          <rect x={-200} y={-130} width={400} height={260} rx={6} fill="none" stroke={YAMABUKI} strokeWidth={4} />
          <rect x={-60} y={-40} width={120} height={90} fill={PAPER_DARK} stroke={SUMI} strokeWidth={4} />
          <rect x={-70} y={-90} width={140} height={50} fill={PAPER_DARK} stroke={SUMI} strokeWidth={4} />
          <text x={0} y={30} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={70} fill={SHU}>
            ？
          </text>
          <text x={0} y={115} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={34} fill={SUMI}>
            跡継ぎのいない都
          </text>
        </g>
      ) : null}
      <Stamp x={540} y={1460} text="都に呼ばれた地方の王" size={66} t={stampT(f, "seg2", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg3 11〜19秒 20年の謎：近江 → 山城 → 大和、点が少しずつ動く移動ルート
// =====================================================================
const LAKE_LL: LL[] = [
  [136.02, 35.55], [136.2, 35.48], [136.27, 35.3], [136.12, 35.12], [135.98, 35.02], [135.93, 34.98], [135.88, 35.05], [135.95, 35.2], [135.98, 35.38],
];
const ROUTE: { ll: LL; name: string; year: string }[] = [
  { ll: [136.02, 35.36], name: "近江・高島", year: "" },
  { ll: [135.68, 34.86], name: "樟葉宮", year: "即位" },
  { ll: [135.79, 34.81], name: "筒城宮", year: "5年目" },
  { ll: [135.7, 34.93], name: "弟国宮", year: "12年目" },
  { ll: [135.84, 34.52], name: "磐余玉穂宮", year: "20年目" },
];
const VIA: LL[][] = [
  [[135.96, 35.18], [135.86, 35.0], [135.72, 34.9]],
  [[135.74, 34.83]],
  [[135.74, 34.88]],
  [[135.76, 34.8], [135.82, 34.66]],
];
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const z = interpolate(f, [0, 220], [6.0, 6.7], { extrapolateRight: "clamp" });
  const cam: Cam = { lon: 135.86 - ramp(f, 0, 200) * 0.02, lat: 34.97 - ramp(f, 120, 200) * 0.1, zoom: z, cy: 900 };
  const P = (ll: LL) => project(cam, ll);
  // 区間ごとの進み（STOPS で宮に着く）
  const starts = [8, 50, 92, 134];
  const legT = STOPS.map((end, i) => ramp(f, starts[i], end, Easing.inOut(Easing.cubic)));
  const legs = ROUTE.slice(0, -1).map((r, i) => [r.ll, ...VIA[i], ROUTE[i + 1].ll].map(P));
  let dot: [number, number] = P(ROUTE[0].ll);
  const trail: [number, number][][] = [];
  legs.forEach((pts, i) => {
    if (legT[i] > 0) {
      const seg = partial(pts, legT[i]);
      trail.push(seg);
      dot = seg[seg.length - 1];
    }
  });
  const arrived = STOPS.filter((s) => f >= s).length;
  const years = ["", "即位", "5年目", "12年目", "20年目"];
  return (
    <Stage f={f} look="keitai">
      <MapLayer cam={cam} lands={LANDS_ALL} seaRect={[40, 330, 1000, 1180]} />
      <clipPath id="mapClipK">
        <rect x={40} y={330} width={1000} height={1180} rx={6} />
      </clipPath>
      <g clipPath="url(#mapClipK)">
        <g filter="url(#paperLow)">
          <path d={polyPath(LAKE_LL.map(P))} fill={LAKE} />
        </g>
        {/* 国名（大きく淡く） */}
        {(
          [
            ["近江国", [136.12, 35.22]],
            ["山城", [135.84, 34.9]],
            ["大和", [135.88, 34.58]],
          ] as [string, LL][]
        ).map(([n, ll]) => {
          const p = P(ll);
          return (
            <text key={n} x={p[0]} y={p[1]} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={86} fill={SUMI} opacity={0.18}>
              {n}
            </text>
          );
        })}
        {/* 大和を囲む山（入口をふさぐ） */}
        {[[135.72, 34.7], [135.8, 34.7], [135.9, 34.7], [135.98, 34.66]].map((ll, i) => {
          const p = P(ll as LL);
          return (
            <g key={i} filter="url(#paperLow)">
              <path d={`M${p[0] - 90},${p[1] + 40} L${p[0]},${p[1] - 60} L${p[0] + 90},${p[1] + 40}Z`} fill={i % 2 ? "#7A845A" : "#66704A"} />
            </g>
          );
        })}
        {/* 足跡（たどった道） */}
        {trail.map((seg, i) => (
          <path key={i} d={polyPath(seg, false)} fill="none" stroke={SHU} strokeWidth={10} strokeDasharray="4 16" strokeLinecap="round" />
        ))}
        {/* 宮の印と年 */}
        {ROUTE.map((r, i) => {
          const p = P(r.ll);
          const on = i === 0 ? 1 : ramp(f, STOPS[i - 1] - 2, STOPS[i - 1] + 6);
          return on > 0 ? (
            <g key={r.name} opacity={on}>
              <circle cx={p[0]} cy={p[1]} r={16} fill={i === ROUTE.length - 1 ? SHU : PAPER} stroke={SUMI} strokeWidth={5} />
              <g transform={`translate(${p[0] + (i === 2 ? 110 : i === 3 ? -120 : 0)},${p[1] + (i === 1 ? 70 : i === 4 ? 80 : i === 0 ? -60 : 0)})`}>
                <rect x={-100} y={-34} width={200} height={66} rx={6} fill={i === ROUTE.length - 1 ? SHU : PAPER} stroke={SUMI} strokeWidth={3} filter="url(#paperLow)" />
                <text x={0} y={12} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={i === ROUTE.length - 1 ? 34 : 38} fill={i === ROUTE.length - 1 ? PAPER : SUMI}>
                  {r.name}
                </text>
              </g>
            </g>
          ) : null;
        })}
        {/* 動く王の点 */}
        <circle cx={dot[0]} cy={dot[1]} r={30} fill={YAMABUKI} stroke={SUMI} strokeWidth={6} />
        <circle cx={dot[0]} cy={dot[1]} r={46 + Math.sin(f * 0.25) * 6} fill="none" stroke={YAMABUKI} strokeWidth={4} opacity={0.6} />
      </g>
      <Heading text="大和に入るまで" t={pop(f, 0, 10)} y={200} size={80} {...HEAD} />
      {/* 年のカウンター */}
      <g filter="url(#paperLow)">
        <rect x={290} y={1560} width={500} height={140} rx={12} fill={SUMI} />
      </g>
      <text x={540} y={1660} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={92} fill={YAMABUKI}>
        {arrived === 0 ? "出発" : years[arrived]}
      </text>
      <Stamp x={540} y={1820} text="すんなり迎えられなかった" size={56} t={stampT(f, "seg3", 0)} rot={-3} />
    </Stage>
  );
};

// =====================================================================
// seg4 19〜27秒 実在の確かさ：記録が急にはっきりする／527年 磐井の乱
// =====================================================================
const CAM_KYUSHU: Cam = { lon: 131.2, lat: 32.9, zoom: 1.25, cy: 1290 };
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const focus = ramp(f, 10, 90, Easing.inOut(Easing.quad));
  const cards = ["神武", "崇神", "雄略", "継体"];
  const iwai = project(CAM_KYUSHU, [130.55, 33.35]);
  return (
    <Stage f={f} look="keitai">
      <Heading text="歴史が急にはっきり" t={pop(f, 0, 10)} y={200} size={78} {...HEAD} />
      {/* 記録の札：古い時代ほどぼやけ、継体で焦点が合う */}
      <defs>
        {[0, 1, 2, 3].map((i) => (
          <filter key={i} id={`blurK${i}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.max(0, (3 - i) * 3.2 * (1 - focus * (i === 3 ? 1 : 0.15)))} />
          </filter>
        ))}
      </defs>
      {cards.map((c, i) => {
        const x = 165 + i * 250;
        const on = pop(f, 6 + i * 8, 10);
        return (
          <g key={c} transform={`translate(${x},${520 + (i === 3 ? -20 * focus : 0)}) scale(${0.5 + 0.5 * on})`} opacity={clamp01(on * 2) * (i === 3 ? 1 : 0.65 + 0.1 * i)} filter={`url(#blurK${i})`}>
            <rect x={-105} y={-140} width={210} height={280} rx={8} fill={i === 3 ? YAMABUKI : PAPER_DARK} />
            <rect x={-92} y={-127} width={184} height={254} rx={6} fill="none" stroke={SUMI} strokeWidth={3} />
            <text x={0} y={22} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={66} fill={SUMI}>
              {c}
            </text>
          </g>
        );
      })}
      <Tag x={540} y={760} text="記録が具体的になる" size={54} t={pop(f, 70, 10)} rot={-2} />
      {/* 九州の地図：筑紫の磐井 */}
      <g opacity={ramp(f, 90, 106)}>
        <MapLayer cam={CAM_KYUSHU} lands={LANDS_ALL} seaRect={[140, 930, 800, 700]} />
        <circle cx={iwai[0]} cy={iwai[1]} r={26 + Math.sin(f * 0.3) * 4} fill={SHU} stroke={PAPER} strokeWidth={6} />
        <Tag x={iwai[0] + 250} y={iwai[1] - 120} text="527年 磐井の乱" size={52} t={pop(f, 104, 10)} rot={-2} bg={SUMI} color={YAMABUKI} />
        <Tag x={iwai[0] + 210} y={iwai[1] + 10} text="筑紫" size={44} t={pop(f, 110, 10)} rot={2} />
      </g>
      <Stamp x={540} y={1760} text="実在は確実" size={96} t={stampT(f, "seg4", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg5 27〜35秒 系譜が怪しい：応神天皇から伸びる家系図に「？」
// =====================================================================
const NameBox: React.FC<{ x: number; y: number; text: string; t: number; color?: string; textColor?: string; w?: number }> = ({ x, y, text, t, color = PAPER, textColor = SUMI, w = 230 }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${0.5 + 0.5 * clamp01(t)})`} opacity={clamp01(t * 2)}>
      <g filter="url(#paperLow)">
        <rect x={-w / 2} y={-46} width={w} height={92} rx={8} fill={color} />
      </g>
      <rect x={-w / 2 + 8} y={-38} width={w - 16} height={76} rx={6} fill="none" stroke={SUMI} strokeWidth={3} />
      <text x={0} y={16} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={48} fill={textColor}>
        {text}
      </text>
    </g>
  );
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const top: [number, number] = [540, 430];
  const main = ramp(f, 14, 60);
  const branch = ramp(f, 50, 130, Easing.inOut(Easing.quad));
  const gens = [620, 790, 960, 1130];
  const branchX = 780;
  return (
    <Stage f={f} look="keitai">
      <Heading text="系譜が怪しい" t={pop(f, 0, 10)} y={200} size={84} {...HEAD} />
      <NameBox x={top[0]} y={top[1]} text="応神天皇" t={pop(f, 6, 10)} color={PAPER_DARK} />
      {/* 本流：応神 → … → 武烈 */}
      <path d={`M${top[0]},${top[1] + 46} L${top[0]},${top[1] + 90} L300,${top[1] + 90} L300,${top[1] + 90 + 830 * main}`} fill="none" stroke={SUMI} strokeWidth={8} />
      {main > 0.3 ? <NameBox x={300} y={780} text="仁徳天皇" t={ramp(f, 26, 36)} w={210} /> : null}
      {main > 0.5 ? (
        <text x={300} y={1010} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={60} fill={SUMI} opacity={ramp(f, 40, 50)}>
          ⋮
        </text>
      ) : null}
      <NameBox x={300} y={1300} text="武烈天皇" t={ramp(f, 56, 66)} w={210} />
      {/* 継体への枝：点線と「？」 */}
      <path
        d={`M${top[0] + 115},${top[1] + 90} L${branchX},${top[1] + 90} L${branchX},${top[1] + 90 + (1300 - top[1] - 90 - 46) * branch}`}
        fill="none"
        stroke={SHU}
        strokeWidth={8}
        strokeDasharray="18 14"
      />
      {gens.map((y, i) => {
        const on = ramp(f, 70 + i * 14, 80 + i * 14);
        return on > 0 ? (
          <g key={i} transform={`translate(${branchX},${y}) scale(${0.6 + 0.4 * on})`} opacity={on}>
            <circle r={40} fill={PAPER} stroke={SHU} strokeWidth={5} filter="url(#paperLow)" />
            <text y={22} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={60} fill={SHU}>
              ？
            </text>
          </g>
        ) : null;
      })}
      <NameBox x={branchX} y={1300} text="継体天皇" t={ramp(f, 128, 140)} color={YAMABUKI} w={230} />
      <Tag x={950} y={880} text="5世の孫" size={48} t={pop(f, 110, 10)} rot={4} vertical bg={SUMI} color={YAMABUKI} />
      {/* 遠すぎる親戚 */}
      <g opacity={ramp(f, 146, 158)}>
        <path d="M420,1300 L660,1300" stroke={SUMI} strokeWidth={6} strokeDasharray="10 8" />
        <path d="M420,1300 l18,-12 l0,24Z M660,1300 l-18,-12 l0,24Z" fill={SUMI} />
        <Tag x={540} y={1420} text="遠すぎる親戚" size={50} t={pop(f, 150, 10)} rot={-2} />
      </g>
      <Stamp x={540} y={1640} text="後から作った？" size={92} t={stampT(f, "seg5", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg6 35〜43秒 IF：新王朝の始まりだったら → 「代々続く物語」が途切れる
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const snap = ramp(f, 110, 130, Easing.in(Easing.quad));
  const fall = ramp(f, 126, 200, Easing.in(Easing.quad));
  const links = 9;
  const breakAt = 5;
  return (
    <Stage f={f} tint="#7f8a95" tintOpacity={0.26} look="keitai">
      <Stamp x={540} y={230} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="もし新しい王朝の始まりだったら" size={52} t={pop(f, 8, 10)} rot={1} />
      <Tag x={540} y={640} text="代々続く天皇家" size={58} t={pop(f, 30, 10)} rot={-2} bg={SUMI} color={YAMABUKI} />
      {/* 鎖：継体のところで切れる */}
      {Array.from({ length: links }, (_, i) => {
        const x = 110 + i * 108;
        const on = ramp(f, 34 + i * 5, 44 + i * 5);
        const after = i >= breakAt;
        const dx = after ? snap * 30 : -snap * 10;
        const dy = after ? fall * 500 * (1 + (i - breakAt) * 0.2) : 0;
        const rot = after ? fall * (40 + i * 12) : 0;
        return on > 0 ? (
          <g key={i} transform={`translate(${x + dx},${900 + dy}) rotate(${rot + (i % 2 ? 0 : 0)})`} opacity={on * (after ? 1 - fall * 0.6 : 1)}>
            <ellipse rx={62} ry={36} fill="none" stroke={i === breakAt ? YAMABUKI : "#6B6255"} strokeWidth={18} transform={i % 2 ? "" : "rotate(0)"} />
          </g>
        ) : null;
      })}
      {snap > 0 && snap < 1 ? <circle cx={110 + breakAt * 108 - 54} cy={900} r={60 * snap} fill="#FFF3C8" opacity={1 - snap} /> : null}
      <Tag x={110 + breakAt * 108 + 40} y={1060} text="継体" size={48} t={pop(f, 70, 10) * (1 - fall)} rot={3} bg={YAMABUKI} color={SUMI} />
      <King x={540} y={1880} s={0.62} arm={30} lean={-8 * snap} />
      <Stamp x={540} y={1340} text="代々続く物語が途切れる" size={62} t={stampT(f, "seg6", 1)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg7 43〜49秒 判定：実在が確実になる境目の王（ただし出自は謎）
// =====================================================================
const VerdictStamp: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t <= 0) return null;
  const s = interpolate(t, [0, 0.7, 1], [2.0, 0.95, 1]);
  return (
    <g transform={`translate(${x},${y}) rotate(-3) scale(${s})`} opacity={clamp01(t * 3)}>
      <rect x={-410} y={-150} width={820} height={300} rx={10} fill="none" stroke={SHU} strokeWidth={14} />
      <rect x={-390} y={-130} width={780} height={260} rx={6} fill="none" stroke={SHU} strokeWidth={5} />
      <text x={0} y={-28} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={70} fill={SHU}>
        実在が確実になる
      </text>
      <text x={0} y={100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={116} fill={SHU}>
        境目の王
      </text>
    </g>
  );
};
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  const line = ramp(f, 8, 40, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} look="keitai">
      <Stamp x={540} y={200} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      {/* 境目：左は霞んだ伝承、右ははっきりした記録 */}
      <defs>
        <linearGradient id="hazeK" x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.65} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={360} width={540} height={560} fill="url(#hazeK)" opacity={line} />
      <text x={270} y={560} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={72} fill={SUMI} opacity={0.35 * line}>
        伝承
      </text>
      <text x={810} y={560} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={72} fill={SUMI} opacity={0.9 * line}>
        記録
      </text>
      <rect x={536} y={360} width={8} height={560 * line} fill={KIN} />
      <King x={540} y={900} s={0.42} arm={60} opacity={ramp(f, 20, 34)} />
      <VerdictStamp x={540} y={1130} t={stampT(f, "seg7", 1)} />
      <Stamp x={930} y={980} text="確実" size={60} t={ramp(f, STAMPS.seg7[1] + 6, STAMPS.seg7[1] + 16)} rot={12} round color={KIN} />
      <Tag x={420} y={1410} text="ただし出自は謎" size={58} t={pop(f, 104, 12)} rot={-2} bg={SUMI} color={YAMABUKI} />
      <text x={760} y={1450} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={130} fill={SHU} opacity={ramp(f, 112, 124)}>
        ？
      </text>
      <Sun x={860} y={1620} r={90} rot={f * 0.4} opacity={0.6 * ramp(f, 60, 80)} />
      <King x={860} y={1890} s={0.55} arm={70} flip />
    </Stage>
  );
};

// =====================================================================
// seg8 49〜54秒 二択：A 系譜通り、応神の末裔派 / B 実は新王朝の始まり派
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
    <Stage f={f} look="keitai">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} />
      <King x={540} y={830} s={0.52} arm={60 + sway(f, 1, 6)} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} {...HEAD} />
      {card(285, "A", ["系譜通り、", "応神の", "末裔派"], AI, 12, 1)}
      {card(795, "B", ["実は", "新王朝の", "始まり派"], SHU, 22, 2)}
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
    <Stage f={f} look="keitai">
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

export const SEGMENTS_KEITAI: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };

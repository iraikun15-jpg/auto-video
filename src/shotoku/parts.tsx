import React from "react";
import { random } from "remotion";
import { clamp01, CloudShape } from "../jimmu/paper";
import { Person } from "../jimmu/figures";
import { FUJI, KAN_I, KIN, KON, MINCHO, PAPER, SEPIA, SHU, SUMI } from "../jimmu/theme";

// =====================================================================
// 人物
// =====================================================================
/** 聖徳太子（厩戸皇子）：紺の影絵＋金のふち。頭巾・笏・裾までの袍。顔は描かない */
export const Taishi: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number; lean?: number; color?: string; outlineColor?: string }> = ({
  x,
  y,
  s = 0.8,
  arm = 50,
  flip = false,
  opacity = 1,
  lean = 0,
  color = KON,
  outlineColor = KIN,
}) => <Person kind="shotoku" x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} lean={lean} color={color} outline outlineColor={outlineColor} />;

/** 太子がいない（IF）ときの点線の輪郭 */
export const TaishiGhost: React.FC<{ x: number; y: number; s?: number; opacity?: number }> = ({ x, y, s = 0.8, opacity = 1 }) => (
  <g opacity={opacity}>
    <Person kind="shotoku" x={x} y={y} scale={s} arm={50} color="#000" opacity={0.08} filter="none" />
    <g transform={`translate(${x},${y - 330 * s})`}>
      <ellipse rx={150 * s} ry={330 * s} fill="none" stroke={SUMI} strokeWidth={6} strokeDasharray="18 14" opacity={0.6} />
      <text x={0} y={40 * s} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={180 * s} fill={SUMI} opacity={0.5}>
        ？
      </text>
    </g>
  </g>
);

// =====================================================================
// 法隆寺（五重塔と金堂）。build 0〜7 で部材が下から順に組み上がる
// =====================================================================
const WOOD = "#B0573A";
const WALL = "#EFE6D0";
const ROOF = "#2B2216";
const Roof: React.FC<{ y: number; bw: number; rw: number; rh: number }> = ({ y, bw, rw, rh }) => (
  <path d={`M${-rw / 2},${y - 10} Q0,${y + 8} ${rw / 2},${y - 10} L${bw / 2},${y - rh} L${-bw / 2},${y - rh}Z`} fill={ROOF} />
);
const Body: React.FC<{ y: number; w: number; h: number }> = ({ y, w, h }) => (
  <g>
    <rect x={-w / 2} y={y - h} width={w} height={h} fill={WALL} />
    {[-0.5, -0.17, 0.17, 0.5].map((k) => (
      <rect key={k} x={k * w - 6 + (k < 0 ? 6 : k > 0 ? -6 : 0)} y={y - h} width={12} height={h} fill={WOOD} />
    ))}
    <rect x={-w / 2} y={y - h} width={w} height={10} fill={WOOD} />
  </g>
);
export const Horyuji: React.FC<{ x: number; y: number; s?: number; build?: number; opacity?: number }> = ({ x, y, s = 1, build = 7, opacity = 1 }) => {
  const p = (i: number) => clamp01(build - i);
  const piece = (i: number, node: React.ReactNode) => {
    const t = p(i);
    if (t <= 0) return null;
    return (
      <g key={i} transform={`translate(0,${-90 * (1 - t) * (1 - t)})`} opacity={clamp01(t * 2.5)}>
        {node}
      </g>
    );
  };
  // 五重塔の各層（右側、中心 x=+190）
  const tiers: { y: number; bw: number }[] = [];
  {
    let y0 = -34;
    for (let i = 0; i < 5; i++) {
      const bw = 150 - i * 20;
      tiers.push({ y: y0, bw });
      y0 = y0 - 66 - 22;
    }
  }
  const tierNode = (i: number) => {
    const { y: ty, bw } = tiers[i];
    return (
      <g key={i}>
        <Body y={ty} w={bw} h={66} />
        <Roof y={ty - 60} bw={bw * 0.7} rw={bw + 140} rh={28} />
      </g>
    );
  };
  const topY = tiers[4].y - 66 - 28;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity} filter="url(#paper)">
      {piece(
        0,
        <g>
          <rect x={-420} y={-34} width={820} height={34} fill="#8C8270" />
          <rect x={-440} y={-6} width={860} height={10} fill="#6E6656" />
        </g>,
      )}
      {/* 金堂（左、中心 x=-190）：下の屋根の上に小さな上の屋根 */}
      {piece(
        1,
        <g transform="translate(-190,0)">
          <Body y={-34} w={230} h={110} />
          <Roof y={-138} bw={190} rw={390} rh={40} />
        </g>,
      )}
      {piece(
        2,
        <g transform="translate(-190,0)">
          <Body y={-176} w={150} h={64} />
          <path d={`M-150,-236 Q0,-220 150,-236 L80,-300 L-80,-300Z`} fill={ROOF} />
          <path d="M-60,-300 L0,-326 L60,-300Z" fill={ROOF} />
        </g>,
      )}
      {/* 五重塔 */}
      {piece(3, <g transform="translate(190,0)">{[0, 1].map(tierNode)}</g>)}
      {piece(4, <g transform="translate(190,0)">{tierNode(2)}</g>)}
      {piece(5, <g transform="translate(190,0)">{[3, 4].map(tierNode)}</g>)}
      {piece(
        6,
        <g transform="translate(190,0)">
          <rect x={-5} y={topY - 210} width={10} height={214} fill={KIN} />
          {Array.from({ length: 9 }, (_, k) => (
            <rect key={k} x={-22 + k * 0.8} y={topY - 30 - k * 17} width={44 - k * 1.6} height={7} rx={3} fill={KIN} />
          ))}
          <path d={`M0,${topY - 230} q-26,-10 -18,-34 q10,16 18,10 q8,6 18,-10 q8,24 -18,34Z`} fill={KIN} />
        </g>,
      )}
    </g>
  );
};

// =====================================================================
// 記録の資料：舟形光背（表）と、裏の銘文の拓本（黒地に白の字形）
// 実在の銘文の文字はうつさず、字の並びだけを抽象化して見せる
// =====================================================================
export const haloPath = (hx: number, hy: number) =>
  `M0,${-hy} C${hx * 0.55},${-hy * 0.55} ${hx},${-hy * 0.1} ${hx},${hy * 0.3} C${hx},${hy * 0.75} ${hx * 0.5},${hy * 0.62} 0,${hy * 0.62} C${-hx * 0.5},${hy * 0.62} ${-hx},${hy * 0.75} ${-hx},${hy * 0.3} C${-hx},${-hy * 0.1} ${-hx * 0.55},${-hy * 0.55} 0,${-hy}Z`;
export const Kohai: React.FC<{ x: number; y: number; s?: number; t?: number; glow?: number }> = ({ x, y, s = 1, t = 1, glow = 0 }) => {
  if (t <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s * (0.6 + 0.4 * clamp01(t))})`} opacity={clamp01(t * 2)}>
      <g filter="url(#paper)">
        <path d={haloPath(200, 300)} fill="#8A6A3A" />
      </g>
      <path d={haloPath(170, 260)} fill="none" stroke={KIN} strokeWidth={8} />
      {/* 火焔の縁取り */}
      {Array.from({ length: 16 }, (_, k) => {
        const a = (k / 16) * Math.PI * 2;
        return <circle key={k} cx={Math.sin(a) * 150} cy={-Math.cos(a) * 200 + 20} r={10} fill={KIN} opacity={0.55} />;
      })}
      <circle cx={0} cy={-40} r={70} fill="none" stroke={KIN} strokeWidth={6} />
      <circle cx={0} cy={-40} r={40} fill={KIN} opacity={0.35 + glow * 0.5} />
    </g>
  );
};
/** 拓本（黒地に白の字形のマス）。hi は光らせる列 */
export const Rubbing: React.FC<{ x: number; y: number; w?: number; h?: number; cols?: number; rows?: number; t?: number; hi?: number; hiT?: number; seed?: string }> = ({
  x,
  y,
  w = 380,
  h = 440,
  cols = 9,
  rows = 11,
  t = 1,
  hi = -1,
  hiT = 0,
  seed = "rb",
}) => {
  if (t <= 0) return null;
  const cw = (w - 40) / cols;
  const ch = (h - 40) / rows;
  return (
    <g transform={`translate(${x},${y})`} opacity={clamp01(t * 2)}>
      <g filter="url(#paper)">
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#2A2622" />
      </g>
      {Array.from({ length: cols }, (_, c) =>
        Array.from({ length: rows }, (_, r) => {
          // 右の列から順に現れる（縦書きの並び）
          const order = c * rows + r;
          if (order / (cols * rows) > t) return null;
          const cx = w / 2 - 20 - cw * (c + 0.5);
          const cy = -h / 2 + 20 + ch * (r + 0.5);
          const lit = c === hi ? hiT : 0;
          const col = lit > 0 ? `rgba(240,200,110,${0.55 + lit * 0.45})` : "rgba(240,232,214,0.75)";
          const n = 2 + Math.floor(random(`${seed}${c}-${r}`) * 3);
          return (
            <g key={`${c}-${r}`} stroke={col} strokeWidth={3.2} strokeLinecap="round">
              {Array.from({ length: n }, (_, k) => {
                const a = random(`${seed}a${c}-${r}-${k}`);
                const b = random(`${seed}b${c}-${r}-${k}`);
                const hor = k % 2 === 0;
                return hor ? (
                  <line key={k} x1={cx - cw * 0.32} x2={cx + cw * 0.32} y1={cy - ch * 0.3 + a * ch * 0.6} y2={cy - ch * 0.3 + a * ch * 0.6} />
                ) : (
                  <line key={k} x1={cx - cw * 0.3 + b * cw * 0.6} x2={cx - cw * 0.3 + b * cw * 0.6} y1={cy - ch * 0.34} y2={cy + ch * 0.34} />
                );
              })}
            </g>
          );
        }),
      )}
      {hi >= 0 && hiT > 0 ? (
        <rect x={w / 2 - 20 - cw * (hi + 1) - 4} y={-h / 2 + 14} width={cw + 8} height={h - 28} fill="none" stroke={KIN} strokeWidth={5} opacity={hiT} rx={6} />
      ) : null}
    </g>
  );
};

// =====================================================================
// 伝説：10人がいっせいに話す（吹き出しの字は訴えの中身）
// =====================================================================
const WORDS = ["田", "税", "水", "道", "市", "舟", "米", "家", "牛", "布"];
export const TenSpeakers: React.FC<{ cx: number; cy: number; rx: number; ry: number; f: number; at: readonly number[]; s?: number; dream?: boolean; opacity?: number; bs?: number }> = ({
  cx,
  cy,
  rx,
  ry,
  f,
  at,
  s = 0.3,
  dream = false,
  opacity = 1,
  bs = 1,
}) => (
  <g opacity={opacity}>
    {WORDS.map((w, i) => {
      // 下半分を避けて、上と左右に扇形に並べる
      const a = Math.PI * (-1.08 + (i / 9) * 1.16) - Math.PI * 0.0;
      const px = cx + Math.cos(a) * rx;
      const py = cy + Math.sin(a) * ry;
      const t = clamp01((f - at[i]) / 6);
      const bob = Math.sin(f * 0.25 + i * 1.7) * 6 * t;
      if (t <= 0) return null;
      const bx = px + (px < cx ? -10 : 10);
      const by = py - 600 * s - 70 * bs + bob;
      return (
        <g key={i}>
          <Person kind="folk" color={dream ? "#6E5E98" : ["#3a332c", "#5A4632", "#4A4A5A"][i % 3]} x={px} y={py} scale={s} arm={70 + Math.sin(f * 0.3 + i) * 25} flip={px > cx} filter="url(#paperLow)" />
          <g transform={`translate(${bx},${by}) scale(${(0.4 + 0.6 * t) * bs})`} opacity={t}>
            <path d="M-12,40 L-26,72 L14,42Z" fill={PAPER} />
            <ellipse rx={54} ry={46} fill={PAPER} stroke={dream ? FUJI : SUMI} strokeWidth={4} />
            <text x={0} y={18} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={50} fill={SUMI}>
              {w}
            </text>
          </g>
        </g>
      );
    })}
  </g>
);

/** 声が太子へ集まる弧（耳の伝説） */
export const VoiceArcs: React.FC<{ x: number; y: number; f: number; t: number; color?: string }> = ({ x, y, f, t, color = KIN }) =>
  t <= 0 ? null : (
    <g opacity={t}>
      {Array.from({ length: 4 }, (_, k) => {
        const ph = ((f * 0.04 + k / 4) % 1 + 1) % 1;
        const r = 260 - ph * 200;
        return (
          <g key={k} opacity={Math.sin(ph * Math.PI) * 0.8}>
            <path d={`M${x - r},${y - r * 0.2} A${r},${r} 0 0 1 ${x - r * 0.3},${y - r * 0.95}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
            <path d={`M${x + r},${y - r * 0.2} A${r},${r} 0 0 0 ${x + r * 0.3},${y - r * 0.95}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );

// =====================================================================
// 画の質感：伝説＝夢物語（藤色のもや・瑞雲・きらめき）／記録＝方眼と四隅の留め
// =====================================================================
export const DreamVeil: React.FC<{ f: number; t: number; id?: string }> = ({ f, t, id = "dv" }) => {
  if (t <= 0) return null;
  return (
    <g opacity={t} pointerEvents="none">
      <radialGradient id={`${id}g`} cx="50%" cy="45%" r="70%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
        <stop offset="55%" stopColor="#EDE4FA" stopOpacity={0.18} />
        <stop offset="100%" stopColor={FUJI} stopOpacity={0.45} />
      </radialGradient>
      <rect width={1080} height={1920} fill={`url(#${id}g)`} />
      {/* 画面の縁にたなびく瑞雲 */}
      {[
        [-80, 150, 420],
        [700, 110, 460],
        [-120, 1880, 520],
        [640, 1900, 520],
      ].map(([x, y, w], i) => (
        <CloudShape key={i} x={x + Math.sin(f * 0.02 + i) * 30} y={y} w={w} color="#EFE8FA" opacity={0.85} />
      ))}
      {/* きらめき（4方向の星） */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = random(`dvx${i}`) * 1080;
        const y = 300 + random(`dvy${i}`) * 1400;
        const tw = Math.max(0, Math.sin(f * 0.12 + i * 2.3));
        const r = 10 + random(`dvr${i}`) * 14;
        return <path key={i} d={`M${x},${y - r} L${x + r * 0.22},${y - r * 0.22} L${x + r},${y} L${x + r * 0.22},${y + r * 0.22} L${x},${y + r} L${x - r * 0.22},${y + r * 0.22} L${x - r},${y} L${x - r * 0.22},${y - r * 0.22}Z`} fill="#FFFFFF" opacity={tw * 0.9} />;
      })}
    </g>
  );
};
/** 記録の質感：薄い方眼（下に敷く） */
export const RecordGrid: React.FC<{ t: number }> = ({ t }) =>
  t <= 0 ? null : (
    <g opacity={t * 0.9}>
      {Array.from({ length: 19 }, (_, i) => (
        <line key={`v${i}`} x1={i * 60} x2={i * 60} y1={0} y2={1920} stroke={SEPIA} strokeWidth={1.5} opacity={i % 5 === 0 ? 0.35 : 0.15} />
      ))}
      {Array.from({ length: 33 }, (_, i) => (
        <line key={`h${i}`} x1={0} x2={1080} y1={i * 60} y2={i * 60} stroke={SEPIA} strokeWidth={1.5} opacity={i % 5 === 0 ? 0.35 : 0.15} />
      ))}
    </g>
  );
/** 記録の質感：四隅の留めと小さな見出し（上に重ねる） */
export const RecordCorners: React.FC<{ t: number; label?: string }> = ({ t, label = "記録" }) =>
  t <= 0 ? null : (
    <g opacity={t}>
      {[
        [40, 40, 1, 1],
        [1040, 40, -1, 1],
        [40, 1880, 1, -1],
        [1040, 1880, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <path key={i} d={`M${x},${y + sy * 90} L${x},${y} L${x + sx * 90},${y}`} fill="none" stroke={SEPIA} strokeWidth={8} />
      ))}
      <g transform="translate(76,1836)">
        <rect x={0} y={-30} width={label.length * 34 + 30} height={46} fill={SEPIA} />
        <text x={15} y={4} fontFamily={MINCHO} fontWeight={800} fontSize={32} fill={PAPER}>
          {label}
        </text>
      </g>
    </g>
  );

// =====================================================================
// 業績の部品
// =====================================================================
/** 冠（冠位十二階）。color は位の色 */
export const Cap: React.FC<{ x: number; y: number; color: string; s?: number }> = ({ x, y, color, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-34,22 L-34,-8 Q0,-46 34,-8 L34,22Z" fill={color} stroke={SUMI} strokeWidth={3} />
    <rect x={-40} y={16} width={80} height={12} rx={4} fill={color} stroke={SUMI} strokeWidth={3} />
  </g>
);
/** 冠位十二階の12色（大＝濃い、小＝淡い） */
export const KAN_I_12 = KAN_I.flatMap((c) => [c, c]);

/** 巻物（横に開く）。open 0〜1 */
export const Scroll: React.FC<{ x: number; y: number; open: number; w?: number; h?: number; children?: React.ReactNode }> = ({ x, y, open, w = 820, h = 420, children }) => {
  if (open <= 0) return null;
  const cur = Math.max(30, w * open);
  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        <clipPath id={`scr${Math.round(x)}${Math.round(y)}`}>
          <rect x={w / 2 - cur} y={-h / 2} width={cur} height={h} />
        </clipPath>
      </defs>
      <g filter="url(#paper)">
        <rect x={w / 2 - cur} y={-h / 2} width={cur} height={h} fill="#F1E6CC" />
      </g>
      <g clipPath={`url(#scr${Math.round(x)}${Math.round(y)})`}>{children}</g>
      {/* 軸（右端は固定、左端が開いていく） */}
      <rect x={w / 2 - 6} y={-h / 2 - 26} width={22} height={h + 52} rx={10} fill="#5A3B20" />
      <rect x={w / 2 - cur - 16} y={-h / 2 - 26} width={22} height={h + 52} rx={10} fill="#5A3B20" />
    </g>
  );
};

/** 縦書きの文字列（右から左へ列を並べる）。color は列ごとに指定可 */
export const VText: React.FC<{ x: number; y: number; cols: string[]; size?: number; gap?: number; colors?: string[]; t?: number }> = ({ x, y, cols, size = 50, gap = 1.25, colors = [], t = 1 }) => {
  const total = cols.reduce((a, c) => a + [...c].length, 0);
  let k = 0;
  return (
    <g>
      {cols.map((col, ci) =>
        [...col].map((ch, i) => {
          const idx = k++;
          if (idx / total >= t) return null;
          return (
            <text key={`${ci}-${i}`} x={x - ci * size * gap} y={y + i * size * 1.08} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={colors[ci] ?? SUMI}>
              {ch}
            </text>
          );
        }),
      )}
    </g>
  );
};

/** 国書（隋への手紙）。たたんだ紙が開く */
export const Letter: React.FC<{ x: number; y: number; t: number; hi?: number; s?: number }> = ({ x, y, t, hi = 0, s = 1 }) => {
  if (t <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s * (0.5 + 0.5 * clamp01(t))})`} opacity={clamp01(t * 2)}>
      <g filter="url(#paper)">
        <rect x={-170} y={-260} width={340} height={520} fill="#F3E9D2" />
      </g>
      <rect x={-150} y={-240} width={300} height={480} fill="none" stroke={SHU} strokeWidth={3} opacity={0.6} />
      {hi > 0 ? <rect x={68} y={-226} width={64} height={300} rx={6} fill={SHU} opacity={0.18 * hi} /> : null}
      <VText x={100} y={-180} cols={["日出處天子", "致書日沒處", "天子無恙"]} size={50} gap={1.36} colors={[hi > 0.5 ? SHU : SUMI, SUMI, SUMI]} t={clamp01(t * 1.2)} />
    </g>
  );
};

/** 判子のように押す2行の判定（大きな二重枠） */
export const VerdictStamp: React.FC<{ x: number; y: number; t: number; l1: string; l2: string; c1?: string; c2?: string }> = ({ x, y, t, l1, l2, c1 = SHU, c2 = SHU }) => {
  if (t <= 0) return null;
  const s = t < 0.7 ? 2.0 - (1.05 * t) / 0.7 : 0.95 + ((t - 0.7) / 0.3) * 0.05;
  return (
    <g transform={`translate(${x},${y}) rotate(-3) scale(${s})`} opacity={clamp01(t * 3)}>
      <rect x={-440} y={-160} width={880} height={320} rx={10} fill="rgba(244,236,218,0.85)" stroke={SHU} strokeWidth={14} />
      <rect x={-420} y={-140} width={840} height={280} rx={6} fill="none" stroke={SHU} strokeWidth={5} />
      <text x={0} y={-24} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={96} fill={c1}>
        {l1}
      </text>
      <text x={0} y={100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={96} fill={c2}>
        {l2}
      </text>
    </g>
  );
};

export { SHU };

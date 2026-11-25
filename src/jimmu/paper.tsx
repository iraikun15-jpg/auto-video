import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";
import { Cam, LANDS, LL, partial, polyPath, project } from "./geo";
import { AI, AI_LIGHT, H, KIN, MINCHO, PAPER, PAPER_BG, SANS, SHU, SUMI, W } from "./theme";

// ---------- 時間の補助 ----------
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** from〜to フレームで 0→1（イージング付き） */
export const ramp = (f: number, from: number, to: number, ease = Easing.out(Easing.cubic)) =>
  interpolate(f, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
/** 紙がペタッと貼られる感じ（少し行き過ぎて戻る） */
export const pop = (f: number, at: number, dur = 10) => ramp(f, at, at + dur, Easing.out(Easing.back(2)));
/** 紙のゆらぎ（ゆっくりした揺れ） */
export const sway = (f: number, seed: number, amp = 1.2, speed = 0.06) =>
  Math.sin(f * speed + seed * 7.3) * amp;

// ---------- 画面とフィルタ ----------
/**
 * 切り絵用の共通フィルタ
 *  - paper: 切り口のガタつき＋落ち影（紙が1枚浮いて見える）
 *  - paperLow: 落ち影を浅くしたもの（小さい部品用）
 *  - washi: 和紙の繊維ノイズ
 */
const Defs: React.FC = () => (
  <defs>
    <filter id="paper" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d" />
      <feDropShadow in="d" dx="5" dy="9" stdDeviation="5" floodColor="#3a2a14" floodOpacity="0.38" />
    </filter>
    <filter id="paperLow" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" result="d" />
      <feDropShadow in="d" dx="3" dy="5" stdDeviation="3" floodColor="#3a2a14" floodOpacity="0.35" />
    </filter>
    <filter id="washi" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.55 0.06" numOctaves="3" seed="11" />
      <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.15  0 0 0 0.9 -0.32" />
    </filter>
    <filter id="washiSpots" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="2" />
      <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.16  0 0 0 0.55 -0.12" />
    </filter>
    {/* 海の青海波もよう */}
    <pattern id="seigaiha" width="64" height="32" patternUnits="userSpaceOnUse">
      {[0, 64].map((x) =>
        [22, 15, 8].map((r) => (
          <path key={`${x}-${r}`} d={`M${x - r},32 A${r},${r} 0 0 1 ${x + r},32`} fill="none" stroke={AI_LIGHT} strokeWidth={2.4} />
        )),
      )}
      {[22, 15, 8].map((r) => (
        <path key={`m-${r}`} d={`M${32 - r},16 A${r},${r} 0 0 1 ${32 + r},16`} fill="none" stroke={AI_LIGHT} strokeWidth={2.4} />
      ))}
    </pattern>
  </defs>
);

/** 台紙（和紙）＋SVGキャンバス。children は SVG 要素 */
export const Stage: React.FC<{ children: React.ReactNode; tint?: string; tintOpacity?: number }> = ({
  children,
  tint,
  tintOpacity = 0,
}) => (
  <AbsoluteFill style={{ backgroundColor: PAPER_BG }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs />
      <rect width={W} height={H} fill={PAPER_BG} />
      <rect width={W} height={H} filter="url(#washiSpots)" opacity={0.5} />
      {children}
      {tint ? <rect width={W} height={H} fill={tint} opacity={tintOpacity} style={{ mixBlendMode: "multiply" }} /> : null}
      <rect width={W} height={H} filter="url(#washi)" opacity={0.4} />
      {/* 四隅を少し暗く（古い紙の焼け） */}
      <radialGradient id="vignette" cx="50%" cy="48%" r="75%">
        <stop offset="60%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#3a2410" stopOpacity={0.35} />
      </radialGradient>
      <rect width={W} height={H} fill="url(#vignette)" />
    </svg>
  </AbsoluteFill>
);

// ---------- 地図 ----------
/** 海（藍の紙）と陸（生成りの紙）。frame でゆらぎを入れない静かな地図 */
export const MapLayer: React.FC<{ cam: Cam; opacity?: number; seaRect?: [number, number, number, number] }> = ({
  cam,
  opacity = 1,
  seaRect = [40, 330, 1000, 900],
}) => {
  const [x, y, w, h] = seaRect;
  return (
    <g opacity={opacity}>
      {/* 海の紙（少し傾けて貼る） */}
      <g filter="url(#paper)">
        <rect x={x} y={y} width={w} height={h} fill={AI} rx={6} />
      </g>
      <clipPath id="seaClip">
        <rect x={x} y={y} width={w} height={h} rx={6} />
      </clipPath>
      <g clipPath="url(#seaClip)">
        <rect x={x} y={y} width={w} height={h} fill="url(#seigaiha)" opacity={0.55} />
        <g filter="url(#paper)">
          {LANDS.map((land, i) => (
            <path key={i} d={polyPath(land.map((p) => project(cam, p)))} fill={PAPER} />
          ))}
        </g>
      </g>
    </g>
  );
};

// ---------- 札（文字入りの紙） ----------
export const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  t?: number; // 0〜1 出現
  rot?: number;
  bg?: string;
  color?: string;
  vertical?: boolean;
  font?: string;
  padX?: number;
  padY?: number;
}> = ({ x, y, text, size = 56, t = 1, rot = 0, bg = PAPER, color = SUMI, vertical = false, font = MINCHO, padX, padY }) => {
  if (t <= 0) return null;
  const chars = [...text];
  const px = padX ?? size * 0.45;
  const py = padY ?? size * 0.3;
  const w = vertical ? size + px * 2 : chars.length * size * 0.98 + px * 2;
  const h = vertical ? chars.length * size * 1.02 + py * 2 : size + py * 2;
  const s = interpolate(t, [0, 1], [0.4, 1]);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={clamp01(t * 2)}>
      <g filter="url(#paperLow)">
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={bg} rx={4} />
      </g>
      {vertical ? (
        chars.map((c, i) => (
          <text
            key={i}
            x={0}
            y={-h / 2 + py + size * (i + 0.86) * 1.02}
            textAnchor="middle"
            fontFamily={font}
            fontWeight={800}
            fontSize={size}
            fill={color}
          >
            {c}
          </text>
        ))
      ) : (
        <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={font} fontWeight={800} fontSize={size} fill={color}>
          {text}
        </text>
      )}
    </g>
  );
};

/** 朱の判子（ドンと押される） */
export const Stamp: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  t: number; // 0〜1
  rot?: number;
  round?: boolean;
  color?: string;
}> = ({ x, y, text, size = 120, t, rot = -8, round = false, color = SHU }) => {
  if (t <= 0) return null;
  const chars = [...text];
  const s = interpolate(t, [0, 0.7, 1], [2.2, 0.94, 1]);
  const box = chars.length === 1 ? size * 1.5 : chars.length <= 2 ? size * 2.3 : size * (chars.length * 0.98 + 0.6);
  const h = size * 1.5;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={clamp01(t * 3)}>
      {round ? (
        <circle r={h * 0.72} fill="none" stroke={color} strokeWidth={size * 0.1} />
      ) : (
        <rect x={-box / 2} y={-h / 2} width={box} height={h} fill="none" stroke={color} strokeWidth={size * 0.1} rx={size * 0.08} />
      )}
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

/** 地図上の小さな地名ラベル（縦書きの細札） */
export const PlaceLabel: React.FC<{ x: number; y: number; text: string; t?: number; size?: number; dx?: number; dy?: number }> = ({
  x,
  y,
  text,
  t = 1,
  size = 38,
  dx = 0,
  dy = 0,
}) => {
  if (t <= 0) return null;
  return (
    <g opacity={clamp01(t * 2)}>
      <circle cx={x} cy={y} r={9} fill={SHU} stroke={PAPER} strokeWidth={3} />
      <Tag x={x + dx} y={y + dy} text={text} size={size} t={t} vertical padX={8} padY={10} />
    </g>
  );
};

// ---------- 駒 ----------
export type TokenKind = "jimmu" | "enemy" | "clan" | "itsuse";
const TOKEN_COLORS: Record<TokenKind, string> = { jimmu: SHU, enemy: SUMI, clan: "#7d6b55", itsuse: SHU };

/** 作戦盤の駒（丸い紙）。神武方は日輪、敵方は矛 */
export const Token: React.FC<{ x: number; y: number; kind: TokenKind; r?: number; t?: number; label?: string; rot?: number }> = ({
  x,
  y,
  kind,
  r = 34,
  t = 1,
  label,
  rot = 0,
}) => {
  if (t <= 0) return null;
  const s = interpolate(t, [0, 1], [0.2, 1]);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={clamp01(t * 3)}>
      <g filter="url(#paperLow)">
        <circle r={r} fill={TOKEN_COLORS[kind]} />
      </g>
      <circle r={r * 0.82} fill="none" stroke={PAPER} strokeWidth={r * 0.07} opacity={0.75} />
      {kind === "jimmu" || kind === "itsuse" ? (
        <g>
          <circle r={r * 0.3} fill={KIN} />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={-r * 0.05} y={-r * 0.62} width={r * 0.1} height={r * 0.18} fill={KIN} transform={`rotate(${i * 45})`} />
          ))}
        </g>
      ) : kind === "enemy" ? (
        <g fill={PAPER}>
          <rect x={-r * 0.05} y={-r * 0.45} width={r * 0.1} height={r * 0.95} />
          <path d={`M0,${-r * 0.68} L${r * 0.16},${-r * 0.38} L${-r * 0.16},${-r * 0.38}Z`} />
        </g>
      ) : (
        <g fill={PAPER}>
          <rect x={-r * 0.32} y={-r * 0.06} width={r * 0.64} height={r * 0.12} />
          <rect x={-r * 0.06} y={-r * 0.32} width={r * 0.12} height={r * 0.64} />
        </g>
      )}
      {label ? (
        <text y={r + 40} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={34} fill={SUMI} stroke={PAPER} strokeWidth={8} paintOrder="stroke">
          {label}
        </text>
      ) : null}
    </g>
  );
};

// ---------- 線・矢印 ----------
/** 地図上のルート（朱の太線。t まで描く） */
export const Route: React.FC<{
  cam: Cam;
  route: LL[];
  t: number;
  color?: string;
  width?: number;
  dashed?: boolean;
  head?: boolean;
  opacity?: number;
}> = ({ cam, route, t, color = SHU, width = 12, dashed = false, head = true, opacity = 1 }) => {
  if (t <= 0) return null;
  const pts = partial(route.map((p) => project(cam, p)), t);
  if (pts.length < 2) return null;
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g opacity={opacity}>
      <path d={polyPath(pts, false)} fill="none" stroke={PAPER} strokeWidth={width + 10} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <path
        d={polyPath(pts, false)}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? `${width * 1.6} ${width * 1.4}` : undefined}
      />
      {head ? (
        <path
          transform={`translate(${b[0]},${b[1]}) rotate(${ang})`}
          d={`M${width * 2.6},0 L${-width * 0.6},${width * 1.9} L${-width * 0.6},${-width * 1.9}Z`}
          fill={color}
          stroke={PAPER}
          strokeWidth={4}
        />
      ) : null}
    </g>
  );
};

/** 飛ぶ矢（a から b へ、t で進む） */
export const FlyingArrow: React.FC<{ a: [number, number]; b: [number, number]; t: number; scale?: number }> = ({ a, b, t, scale = 1 }) => {
  if (t <= 0) return null;
  const tt = clamp01(t);
  const x = a[0] + (b[0] - a[0]) * tt;
  const arc = Math.sin(tt * Math.PI) * -60 * scale;
  const y = a[1] + (b[1] - a[1]) * tt + arc;
  const ang = (Math.atan2(b[1] - a[1] + Math.cos(tt * Math.PI) * -60 * scale * Math.PI * 0.5, b[0] - a[0]) * 180) / Math.PI;
  return <Arrow x={x} y={y} angle={ang} scale={scale} />;
};

/** 矢（墨の切り絵） */
export const Arrow: React.FC<{ x: number; y: number; angle: number; scale?: number; color?: string }> = ({ x, y, angle, scale = 1, color = SUMI }) => (
  <g transform={`translate(${x},${y}) rotate(${angle}) scale(${scale})`} filter="url(#paperLow)">
    <rect x={-70} y={-3} width={84} height={6} fill={color} />
    <path d="M30,0 L10,-11 L14,0 L10,11Z" fill={color} />
    <path d="M-70,0 L-84,-12 L-60,-12 L-50,0 L-60,12 L-84,12Z" fill={color} />
  </g>
);

// ---------- 山並み ----------
/** 切り絵の山（何枚か重ねる）。x, baseY を基準に幅 w */
export const Mountains: React.FC<{ x: number; baseY: number; w: number; h: number; colors: string[]; seed?: number; t?: number }> = ({
  x,
  baseY,
  w,
  h,
  colors,
  seed = 1,
  t = 1,
}) => {
  if (t <= 0) return null;
  const rise = interpolate(clamp01(t), [0, 1], [h * 0.9, 0]);
  return (
    <g transform={`translate(0,${rise})`} opacity={clamp01(t * 2)}>
      {colors.map((c, layer) => {
        const n = 4 + layer;
        const pts: [number, number][] = [[x, baseY]];
        for (let i = 0; i <= n * 2; i++) {
          const px = x + (w * i) / (n * 2);
          const peak = i % 2 === 1;
          const hh = peak ? h * (0.55 + 0.45 * random(`m${seed}-${layer}-${i}`)) * (1 - layer * 0.18) : h * 0.18 * random(`v${seed}-${i}`);
          pts.push([px, baseY - hh]);
        }
        pts.push([x + w, baseY]);
        return (
          <g key={layer} filter="url(#paper)">
            <path d={polyPath(pts)} fill={c} />
          </g>
        );
      })}
    </g>
  );
};

/** 画面上部の見出し（明朝・紙札） */
export const Heading: React.FC<{ text: string; t: number; y?: number; size?: number; color?: string; bg?: string }> = ({
  text,
  t,
  y = 220,
  size = 84,
  color = SUMI,
  bg = PAPER,
}) => <Tag x={540} y={y} text={text} size={size} t={t} rot={-1.2} color={color} bg={bg} />;

export { SANS, MINCHO };

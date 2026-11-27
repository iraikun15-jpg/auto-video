import React from "react";
import { clamp01, Tag } from "../jimmu/paper";
import { AI, AI_LIGHT, KIN, KUSA, MURASAKI, PAPER, PAPER_DARK, SHU, SUGI, SUMI } from "../jimmu/theme";

// 大和（奈良盆地）の古地図風コラージュ。画面座標で描く（盆地の形は様式化）。
// 紺の台紙の上に生成りの盆地、ふちに山並み、東に三輪山、その北西に行燈山古墳。

export const MIWA: [number, number] = [830, 650]; // 三輪山の頂
export const ANDON: [number, number] = [690, 520]; // 行燈山古墳（後円部の中心）
export const MIYA: [number, number] = [700, 760]; // 磯城の宮
export const KASANUI: [number, number] = [770, 585]; // 笠縫邑（檜原）

const BASIN: [number, number][] = [
  [150, 420], [300, 380], [470, 395], [620, 380], [760, 410], [790, 520], [770, 640], [800, 760],
  [770, 900], [700, 1030], [560, 1140], [400, 1160], [260, 1110], [170, 980], [130, 820], [150, 640],
];
const path = (pts: [number, number][]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join("") + "Z";

/** 山（切り絵の三角） */
const Peak: React.FC<{ x: number; y: number; w: number; h: number; c: string }> = ({ x, y, w, h, c }) => (
  <g filter="url(#paperLow)">
    <path d={`M${x - w / 2},${y} L${x - w * 0.08},${y - h} L${x + w * 0.06},${y - h * 0.92} L${x + w / 2},${y}Z`} fill={c} />
  </g>
);

/** 前方後円墳（上から見た形）。x,y は後円部の中心、rot は前方部の向き */
export const Kofun: React.FC<{ x: number; y: number; s?: number; rot?: number; t?: number }> = ({ x, y, s = 1, rot = 200, t = 1 }) => {
  if (t <= 0) return null;
  const k = s * (0.4 + 0.6 * clamp01(t));
  // 後円部（円）から、くびれ（括れ部）を経て、前方部（台形）が広がる鍵穴の形
  const shape = (r: number) =>
    `M${-r * 0.55},${r * 0.84} A${r},${r} 0 1 1 ${r * 0.55},${r * 0.84} L${r * 1.15},${r * 2.5} L${-r * 1.15},${r * 2.5}Z`;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${k})`} opacity={clamp01(t * 2)}>
      {/* 周濠（紺）と墳丘（緑の段） */}
      <g filter="url(#paperLow)">
        <path d={shape(70)} fill={AI} />
      </g>
      <path d={shape(54)} fill={KUSA} />
      <path d={shape(40)} fill="#8C9468" />
      <path d={shape(26)} fill="#9DA578" />
    </g>
  );
};

/** 三輪山（円錐の神体山）。glow は神の光（0〜1） */
export const Miwa: React.FC<{ glow?: number; snake?: number }> = ({ glow = 0, snake = 0 }) => {
  const [x, y] = MIWA;
  return (
    <g>
      {glow > 0 ? (
        <g opacity={glow}>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={-7} y={-230} width={14} height={90} fill={KIN} transform={`translate(${x},${y - 40}) rotate(${i * 30})`} opacity={0.85} />
          ))}
        </g>
      ) : null}
      <g filter="url(#paper)">
        <path d={`M${x - 150},${y + 110} Q${x - 40},${y - 30} ${x},${y - 60} Q${x + 40},${y - 30} ${x + 150},${y + 110}Z`} fill={SUGI} />
      </g>
      <path d={`M${x - 70},${y + 40} Q${x},${y - 30} ${x + 70},${y + 40}`} fill="none" stroke="#6F8A55" strokeWidth={10} opacity={0.8} />
      {/* 大物主（蛇の姿でも語られる）を表す金の線が山を巻く */}
      {snake > 0 ? (
        <path
          d={`M${x - 120},${y + 90} Q${x},${y + 40} ${x + 100},${y + 70} Q${x + 10},${y + 10} ${x - 60},${y + 20} Q${x},${y - 20} ${x + 40},${y - 20}`}
          fill="none"
          stroke={KIN}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${700 * snake} 1000`}
        />
      ) : null}
    </g>
  );
};

/** 宮（切り絵の高床の建物） */
export const Palace: React.FC<{ x: number; y: number; s?: number; mirror?: number }> = ({ x, y, s = 1, mirror = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <g filter="url(#paperLow)">
      <path d="M-110,-40 L0,-110 L110,-40Z" fill={SUMI} />
      <rect x={-90} y={-40} width={180} height={70} fill={PAPER_DARK} />
      {[-80, -40, 0, 40, 80].map((px) => (
        <rect key={px} x={px - 5} y={30} width={10} height={40} fill={SUMI} />
      ))}
    </g>
    {/* 宮の中の鏡（天照大神） */}
    {mirror > 0 ? <circle cx={0} cy={-6} r={22} fill={KIN} opacity={mirror} stroke={PAPER} strokeWidth={4} /> : null}
  </g>
);

/** 鳥居（朱の切り絵） */
export const Torii: React.FC<{ x: number; y: number; s?: number; t?: number }> = ({ x, y, s = 1, t = 1 }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${s * (0.5 + 0.5 * clamp01(t))})`} opacity={clamp01(t * 2)} filter="url(#paperLow)">
      <path d="M-80,-100 Q0,-118 80,-100 L84,-86 L-84,-86Z" fill={SHU} />
      <rect x={-66} y={-72} width={132} height={12} fill={SHU} />
      <rect x={-56} y={-90} width={14} height={110} fill={SHU} />
      <rect x={42} y={-90} width={14} height={110} fill={SHU} />
    </g>
  );

/** 注連縄と紙垂（地図の上辺に掛ける飾り）。f でゆっくり揺れる */
export const Shimenawa: React.FC<{ f: number; y?: number }> = ({ f, y = 330 }) => {
  const sag = 26;
  const d = `M20,${y} Q540,${y + sag * 2} 1060,${y}`;
  return (
    <g>
      <path d={d} fill="none" stroke="#B89A5A" strokeWidth={26} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#8C7038" strokeWidth={26} strokeDasharray="10 22" strokeLinecap="round" opacity={0.7} />
      {[200, 400, 680, 880].map((x, i) => {
        const yy = y + sag * 2 * (1 - Math.pow((x - 540) / 520, 2)) * 0.5 + 10;
        const sw = Math.sin(f * 0.08 + i) * 4;
        return (
          <path
            key={x}
            transform={`rotate(${sw},${x},${yy})`}
            d={`M${x - 14},${yy} L${x + 14},${yy} L${x + 14},${yy + 26} L${x - 6},${yy + 26} L${x - 6},${yy + 52} L${x + 14},${yy + 52} L${x + 14},${yy + 80} L${x - 14},${yy + 80} L${x - 14},${yy + 54} L${x + 6},${yy + 54} L${x + 6},${yy + 28} L${x - 14},${yy + 28}Z`}
            fill="#FFFFFF"
            stroke="#D8CFBD"
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
};

/** 大和の地図本体。zoom で一部を拡大（cx,cy を中心に s 倍） */
export const YamatoMap: React.FC<{
  f: number;
  zoom?: { cx: number; cy: number; s: number };
  dim?: number; // 疫病などで暗くする度合い 0〜1
  children?: React.ReactNode; // 地図と一緒に拡大される上乗せ
  kofun?: number;
  miwaGlow?: number;
  snake?: number;
  palace?: boolean;
  mirror?: number;
  shimenawa?: boolean;
}> = ({ f, zoom, dim = 0, children, kofun = 1, miwaGlow = 0, snake = 0, palace = false, mirror = 1, shimenawa = true }) => {
  const z = zoom ?? { cx: 540, cy: 780, s: 1 };
  return (
    <g>
      <g filter="url(#paper)">
        <rect x={40} y={330} width={1000} height={900} rx={6} fill={AI} />
      </g>
      <clipPath id="yamatoClip">
        <rect x={40} y={330} width={1000} height={900} rx={6} />
      </clipPath>
      <g clipPath="url(#yamatoClip)">
        <rect x={40} y={330} width={1000} height={900} fill="url(#seigaiha)" opacity={0.5} />
        <g transform={`translate(${z.cx},${z.cy}) scale(${z.s}) translate(${-z.cx},${-z.cy})`}>
          <g filter="url(#paper)">
            <path d={path(BASIN)} fill={PAPER} />
          </g>
          {/* 川（初瀬川から大和川へ） */}
          <path d="M790,700 Q680,760 600,820 Q470,900 330,930 Q220,950 120,1000" fill="none" stroke={AI_LIGHT} strokeWidth={14} strokeLinecap="round" />
          <path d="M520,420 Q520,600 560,760 Q580,840 600,820" fill="none" stroke={AI_LIGHT} strokeWidth={9} strokeLinecap="round" />
          {/* 池（崇神は池や溝を開いたと伝わる） */}
          <ellipse cx={400} cy={700} rx={46} ry={26} fill={AI_LIGHT} />
          {/* ふちの山並み */}
          {[
            [110, 520, 180, 120], [120, 760, 200, 140], [170, 1040, 220, 130], [880, 470, 200, 130], [900, 880, 220, 150],
            [820, 1040, 200, 120], [330, 380, 180, 90], [620, 372, 200, 90],
          ].map(([x, y, w, h], i) => (
            <Peak key={i} x={x} y={y} w={w} h={h} c={i % 2 ? KUSA : "#66704A"} />
          ))}
          {/* 田（区画） */}
          {Array.from({ length: 30 }, (_, i) => {
            const cx = 250 + (i % 6) * 70 + (Math.floor(i / 6) % 2) * 30;
            const cy = 560 + Math.floor(i / 6) * 90;
            return <rect key={i} x={cx} y={cy} width={56} height={60} fill={PAPER_DARK} opacity={0.55} transform={`rotate(-4,${cx},${cy})`} />;
          })}
          {/* 集落（小さな屋根） */}
          {[
            [300, 520], [470, 640], [620, 900], [360, 980], [520, 1060], [640, 690],
          ].map(([x, y], i) => (
            <g key={i} filter="url(#paperLow)">
              <path d={`M${x - 24},${y} L${x},${y - 22} L${x + 24},${y}Z`} fill={SUMI} />
              <rect x={x - 16} y={y} width={32} height={18} fill={PAPER_DARK} />
            </g>
          ))}
          <Kofun x={ANDON[0]} y={ANDON[1]} s={1.0} rot={90} t={kofun} />
          <Miwa glow={miwaGlow} snake={snake} />
          {palace ? <Palace x={MIYA[0]} y={MIYA[1]} s={0.6} mirror={mirror} /> : null}
          {children}
        </g>
        {dim > 0 ? <rect x={40} y={330} width={1000} height={900} fill="#2A2238" opacity={0.45 * dim} /> : null}
      </g>
      {shimenawa ? <Shimenawa f={f} /> : null}
    </g>
  );
};

/** 地図上の地名札（縦書き） */
export const Label: React.FC<{ x: number; y: number; text: string; t?: number; size?: number; bg?: string; color?: string }> = ({
  x,
  y,
  text,
  t = 1,
  size = 40,
  bg = PAPER,
  color = SUMI,
}) => <Tag x={x} y={y} text={text} size={size} t={t} vertical padX={8} padY={10} bg={bg} color={color} />;

export { MURASAKI };

import React from "react";
import { random } from "remotion";
import { clamp01 } from "../jimmu/paper";
import { KIN, PAPER, SHU, SUMI } from "../jimmu/theme";

// 草薙剣回（神話ファンタジー）の部品。夜の和紙の上で、金のふちと光で見せる
export const JADE = "#7FD6C2"; // 翡翠色の光
export const NIGHT = "#0E1530";
export const OROCHI = "#3A1016"; // 大蛇の体（深い臙脂）
export const OROCHI_DARK = "#24090D";

/** 光をまとった剣（草薙剣）。原点は柄の端、上向き。glow 0〜1 */
export const GlowSword: React.FC<{ x: number; y: number; s?: number; rot?: number; glow?: number; opacity?: number }> = ({
  x,
  y,
  s = 1,
  rot = 0,
  glow = 1,
  opacity = 1,
}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
    <radialGradient id="swordGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stopColor="#FFF3C4" stopOpacity={0.9} />
      <stop offset="0.4" stopColor="#E9C26A" stopOpacity={0.35} />
      <stop offset="1" stopColor="#E9C26A" stopOpacity={0} />
    </radialGradient>
    {glow > 0 ? <ellipse cx={0} cy={-190} rx={150} ry={300} fill="url(#swordGlow)" opacity={glow} style={{ mixBlendMode: "screen" }} /> : null}
    <g filter="url(#paperLow)">
      {/* 柄・鍔・刀身（両刃の直剣） */}
      <rect x={-11} y={-70} width={22} height={70} rx={7} fill="#6B4A1E" />
      <rect x={-44} y={-90} width={88} height={22} rx={8} fill={KIN} />
      <path d="M-15,-90 L-15,-380 L0,-432 L15,-380 L15,-90Z" fill="#E8E2CF" />
      <path d="M0,-90 L0,-425" stroke="#A9A291" strokeWidth={3} />
    </g>
    <path d="M-15,-90 L-15,-380 L0,-432 L15,-380 L15,-90Z" fill="none" stroke={KIN} strokeWidth={3} />
  </g>
);

/** 八岐大蛇。x,y は胴の中心。drunk で首が垂れ、eyes で目の光、f で首がゆらぐ */
export const Orochi: React.FC<{ x: number; y: number; s?: number; f: number; drunk?: number; eyes?: number; tailGlow?: number; opacity?: number }> = ({
  x,
  y,
  s = 1,
  f,
  drunk = 0,
  eyes = 1,
  tailGlow = 0,
  opacity = 1,
}) => {
  // 8本の首：胴の上から扇形に立ち上がり、S字にうねって先に頭がつく
  const necks = Array.from({ length: 8 }, (_, i) => {
    const u = (i - 3.5) / 3.5; // -1〜1（左右）
    const sway = Math.sin(f * 0.05 + i * 0.9) * 18 * (1 - drunk);
    const sx = u * 170;
    const sy = -60 + Math.abs(u) * 20;
    // 頭の位置：中央ほど高く、外側ほど低く広がる。酔うと地面近くまで垂れる
    const hx0 = u * 470 + (i % 2 ? 30 : -30);
    const hy0 = -560 + Math.abs(u) * 260 + (i % 2) * 70;
    const hx = hx0 + sway + drunk * u * 80;
    const hy = hy0 + drunk * (600 + 80 * random(`dr${i}`));
    // S字の制御点
    const c1x = sx + u * 40 + (i % 2 ? 90 : -90);
    const c1y = sy - 200 * (1 - drunk * 0.6);
    const c2x = hx - (i % 2 ? 110 : -110) - u * 30;
    const c2y = hy + 160 * (1 - drunk * 0.5);
    const headAng = (Math.atan2(hy - c2y, hx - c2x) * 180) / Math.PI;
    return { sx, sy, hx, hy, c1x, c1y, c2x, c2y, headAng, i };
  });
  const neckD = (n: (typeof necks)[number]) => `M${n.sx},${n.sy} C${n.c1x},${n.c1y} ${n.c2x},${n.c2y} ${n.hx},${n.hy}`;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity}>
      {/* 尾（後ろへのびる）と光る尾の中の剣 */}
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M${60 + k * 40},40 Q${280 + k * 30},${120 - k * 20} ${380 + k * 40},${20 - k * 60}`} fill="none" stroke={KIN} strokeWidth={50} strokeLinecap="round" opacity={0.85} />
      ))}
      {[0, 1, 2].map((k) => (
        <path key={`t${k}`} d={`M${60 + k * 40},40 Q${280 + k * 30},${120 - k * 20} ${380 + k * 40},${20 - k * 60}`} fill="none" stroke={OROCHI_DARK} strokeWidth={42} strokeLinecap="round" />
      ))}
      {tailGlow > 0 ? <ellipse cx={360} cy={40} rx={90} ry={60} fill="#FFE08A" opacity={0.45 * tailGlow} style={{ mixBlendMode: "screen" }} /> : null}
      {/* 首（金のふち → 体色） */}
      {necks.map((n) => (
        <path key={`o${n.i}`} d={neckD(n)} fill="none" stroke={KIN} strokeWidth={62} strokeLinecap="round" />
      ))}
      {necks.map((n) => (
        <path key={`n${n.i}`} d={neckD(n)} fill="none" stroke={n.i % 2 ? OROCHI : "#46141B"} strokeWidth={52} strokeLinecap="round" />
      ))}
      {/* 首の鱗の筋 */}
      {necks.map((n) => (
        <path key={`k${n.i}`} d={neckD(n)} fill="none" stroke="#6A2028" strokeWidth={4} strokeDasharray="6 14" />
      ))}
      {/* 胴 */}
      <ellipse cx={0} cy={10} rx={250} ry={115} fill={KIN} />
      <ellipse cx={0} cy={12} rx={242} ry={108} fill={OROCHI_DARK} />
      {Array.from({ length: 14 }, (_, k) => (
        <path key={k} d={`M${-200 + k * 30},${-10 + (k % 2) * 30} q15,-16 30,0`} fill="none" stroke="#5A1A22" strokeWidth={5} />
      ))}
      {/* 頭（目は酸漿のように赤く光る） */}
      {necks.map((n) => {
        const jaw = (1 - drunk) * (0.5 + 0.5 * Math.sin(f * 0.09 + n.i * 1.3));
        return (
          <g key={`h${n.i}`} transform={`translate(${n.hx},${n.hy}) rotate(${n.headAng}) scale(1.5)`}>
            {/* 下あご（開け閉め） */}
            <g transform={`rotate(${14 * jaw},-10,10)`}>
              <path d="M-14,4 Q40,10 82,14 L84,24 Q36,34 -14,26Z" fill={KIN} />
              <path d="M-10,8 Q38,14 76,18 L76,22 Q34,28 -10,22Z" fill="#2A0A0F" />
              <path d="M30,14 L34,6 L38,15 M54,16 L58,8 L62,17" stroke="#F4EBD4" strokeWidth={3} fill="none" />
            </g>
            {/* 上あごと頭 */}
            <path d="M-22,-36 Q30,-48 74,-20 Q94,-8 92,6 L-16,8 Q-38,-12 -22,-36Z" fill={KIN} />
            <path d="M-17,-30 Q28,-41 70,-17 Q86,-6 85,3 L-12,4 Q-30,-12 -17,-30Z" fill={OROCHI} />
            <path d="M34,2 L38,12 L42,3 M60,2 L64,12 L68,3" stroke="#F4EBD4" strokeWidth={3} fill="none" />
            {/* 角のような突起 */}
            <path d="M-8,-30 L-30,-56 L4,-36Z" fill={KIN} />
            <circle cx={36} cy={-18} r={8} fill="#FF4A2E" opacity={eyes} />
            <circle cx={36} cy={-18} r={18} fill="#FF4A2E" opacity={0.35 * eyes} style={{ mixBlendMode: "screen" }} />
          </g>
        );
      })}
    </g>
  );
};

/** 酒の甕（かめ）。x,y は口の中心 */
export const SakeJar: React.FC<{ x: number; y: number; s?: number; t?: number }> = ({ x, y, s = 1, t = 1 }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${s * (0.5 + 0.5 * clamp01(t))})`} opacity={clamp01(t * 2)} filter="url(#paperLow)">
      <path d="M-40,0 Q-62,50 -36,96 L36,96 Q62,50 40,0Z" fill="#8C6A3E" />
      <ellipse cx={0} cy={0} rx={42} ry={12} fill="#3A2A18" />
      <ellipse cx={0} cy={0} rx={34} ry={8} fill="#E9DDB8" opacity={0.8} />
      <path d="M-50,40 L50,40" stroke={SHU} strokeWidth={6} />
    </g>
  );

/** 野火（炎の切り絵） */
export const Flames: React.FC<{ f: number; x: number; y: number; w: number; h: number; t?: number }> = ({ f, x, y, w, h, t = 1 }) => {
  if (t <= 0) return null;
  const n = Math.round(w / 70);
  return (
    <g opacity={clamp01(t * 1.5)}>
      {Array.from({ length: n }, (_, i) => {
        const fx = x + (i + 0.5) * (w / n);
        const fh = h * (0.6 + 0.4 * random(`fl${i}`)) * (0.85 + 0.15 * Math.sin(f * 0.4 + i * 1.7)) * clamp01(t);
        const fw = (w / n) * 0.9;
        const lean = Math.sin(f * 0.25 + i) * 10;
        return (
          <g key={i}>
            <path d={`M${fx - fw / 2},${y} Q${fx - fw / 2},${y - fh * 0.5} ${fx + lean},${y - fh} Q${fx + fw / 2},${y - fh * 0.5} ${fx + fw / 2},${y}Z`} fill="#D9481F" opacity={0.92} />
            <path d={`M${fx - fw / 3},${y} Q${fx - fw / 3},${y - fh * 0.35} ${fx + lean * 0.7},${y - fh * 0.68} Q${fx + fw / 3},${y - fh * 0.35} ${fx + fw / 3},${y}Z`} fill="#F2A23A" />
            <path d={`M${fx - fw / 6},${y} Q${fx},${y - fh * 0.3} ${fx + lean * 0.4},${y - fh * 0.38} Q${fx + fw / 6},${y - fh * 0.2} ${fx + fw / 6},${y}Z`} fill="#FFE7A0" />
          </g>
        );
      })}
    </g>
  );
};

/** 草むら。cut（0〜1）で切り口の線より上の穂先が飛ぶ。cutY は切る高さ */
export const Grass: React.FC<{ f: number; x: number; y: number; w: number; h: number; cut?: number; cutY?: number }> = ({ f, x, y, w, h, cut = 0, cutY = 0 }) => {
  const n = Math.round(w / 22);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const gx = x + i * (w / n) + random(`gx${i}`) * 10;
        const gh = h * (0.6 + 0.4 * random(`gh${i}`));
        const sway = Math.sin(f * 0.08 + i * 0.6) * 6;
        const top = y - gh;
        const cutAt = Math.max(top, y - cutY);
        if (cut <= 0 || cutAt <= top) {
          return <path key={i} d={`M${gx - 7},${y} L${gx + sway},${top} L${gx + 7},${y}Z`} fill={i % 2 ? "#2F4A2A" : "#3B5A33"} />;
        }
        const fly = cut;
        const dx = (random(`gd${i}`) - 0.3) * 300 * fly;
        const dy = -200 * fly - random(`ge${i}`) * 200 * fly;
        const rot = (random(`gr${i}`) - 0.5) * 400 * fly;
        return (
          <g key={i}>
            <path d={`M${gx - 7},${y} L${gx - 3},${cutAt} L${gx + 3},${cutAt} L${gx + 7},${y}Z`} fill="#2F4A2A" />
            <path
              d={`M${gx - 3},${cutAt} L${gx + sway},${top} L${gx + 3},${cutAt}Z`}
              fill="#4E7442"
              transform={`translate(${dx},${dy}) rotate(${rot},${gx},${cutAt})`}
              opacity={1 - fly * 0.6}
            />
          </g>
        );
      })}
    </g>
  );
};

/** 神社（神明造の社殿）。doors: 0=閉 1=開。inner は扉の奥に見せる光 */
export const Shrine: React.FC<{ x: number; y: number; s?: number; doors?: number; inner?: number }> = ({ x, y, s = 1, doors = 0, inner = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <g filter="url(#paper)">
      {/* 石段 */}
      <rect x={-240} y={80} width={480} height={30} fill="#3A3F55" />
      <rect x={-200} y={50} width={400} height={30} fill="#474D66" />
      {/* 本殿 */}
      <rect x={-170} y={-120} width={340} height={170} fill="#5B4127" />
      {/* 屋根（茅葺き）と千木・鰹木 */}
      <path d="M-230,-110 L0,-230 L230,-110 L200,-96 L0,-200 L-200,-96Z" fill="#2B2216" />
      <path d="M-215,-118 L0,-230 L215,-118Z" fill="#3B2F1E" />
      <path d="M-30,-230 L-80,-300 M30,-230 L80,-300" stroke="#2B2216" strokeWidth={14} strokeLinecap="round" />
      {[-90, -30, 30, 90].map((cx) => (
        <rect key={cx} x={cx - 16} y={-238} width={32} height={18} rx={8} fill={KIN} />
      ))}
    </g>
    {/* 扉の奥の光 */}
    {inner > 0 ? <rect x={-60} y={-90} width={120} height={140} fill="#FFF0B8" opacity={inner * doors} style={{ mixBlendMode: "screen" }} /> : null}
    {/* 扉（左右に開く） */}
    <rect x={-60} y={-90} width={60 * (1 - doors)} height={140} fill="#3B2A18" stroke={KIN} strokeWidth={3} />
    <rect x={60 - 60 * (1 - doors)} y={-90} width={60 * (1 - doors)} height={140} fill="#3B2A18" stroke={KIN} strokeWidth={3} />
    {/* 紙垂のついた注連縄 */}
    <path d="M-170,-112 Q0,-80 170,-112" fill="none" stroke="#B89A5A" strokeWidth={12} />
  </g>
);

/** 門（不開門）。close 0=開 1=閉、lock で閂（かんぬき） */
export const Gate: React.FC<{ x: number; y: number; s?: number; close?: number; lock?: number }> = ({ x, y, s = 1, close = 1, lock = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <g filter="url(#paper)">
      <path d="M-260,-260 L0,-330 L260,-260 L240,-240 L-240,-240Z" fill="#2B2216" />
      <rect x={-220} y={-240} width={30} height={330} fill="#4A3520" />
      <rect x={190} y={-240} width={30} height={330} fill="#4A3520" />
      <rect x={-220} y={-250} width={440} height={24} fill="#4A3520" />
    </g>
    {/* 奥の夜 */}
    <rect x={-190} y={-226} width={380} height={316} fill="#070A18" />
    {/* 扉（閉まるほど幅が広がる） */}
    <rect x={-190} y={-226} width={190 * close} height={316} fill="#5B4127" stroke={KIN} strokeWidth={3} />
    <rect x={190 - 190 * close} y={-226} width={190 * close} height={316} fill="#5B4127" stroke={KIN} strokeWidth={3} />
    {close > 0.6
      ? [-150, -110, 110, 150].map((sx) => <circle key={sx} cx={sx * close} cy={-60} r={7} fill={KIN} opacity={(close - 0.6) * 2.5} />)
      : null}
    {lock > 0 ? <rect x={-230 * lock} y={-90} width={460 * lock} height={24} rx={6} fill="#2B2216" stroke={KIN} strokeWidth={3} /> : null}
  </g>
);

/** 海面の波（切り絵の波が重なって流れる） */
export const Waves: React.FC<{ f: number; y: number; color?: string; amp?: number; speed?: number; opacity?: number }> = ({
  f,
  y,
  color = "#2A4A78",
  amp = 26,
  speed = 2,
  opacity = 1,
}) => {
  const pts: string[] = [];
  for (let x = -60; x <= 1140; x += 30) {
    pts.push(`${x},${y + Math.sin((x + f * speed) * 0.018) * amp + Math.sin((x - f * speed * 0.6) * 0.041) * amp * 0.4}`);
  }
  return (
    <g opacity={opacity} filter="url(#paperLow)">
      <path d={`M-60,2100 L${pts.join(" L")} L1140,2100Z`} fill={color} />
    </g>
  );
};

/** 泡（海底） */
export const Bubbles: React.FC<{ f: number; amount?: number }> = ({ f, amount = 1 }) =>
  amount <= 0 ? null : (
    <g opacity={amount}>
      {Array.from({ length: 22 }, (_, i) => {
        const sp = 1.2 + random(`bs${i}`) * 2;
        const y = 1950 - ((random(`by${i}`) * 1500 + f * sp) % 1500);
        const x = random(`bx${i}`) * 1080 + Math.sin(f * 0.07 + i) * 14;
        const r = 5 + random(`br${i}`) * 12;
        return <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#BFEFFF" strokeWidth={2.5} opacity={0.7} />;
      })}
    </g>
  );

/** 竜（大蛇の生まれ変わり）：海中をうねる長い体。t で泳ぎ進む */
export const Dragon: React.FC<{ f: number; t: number; opacity?: number }> = ({ f, t, opacity = 1 }) => {
  if (t <= 0) return null;
  const pts: [number, number][] = [];
  const headX = -300 + t * 1250;
  for (let k = 0; k < 40; k++) {
    const x = headX - k * 34;
    const y = 1180 + Math.sin(k * 0.35 - f * 0.12) * 90 + k * 6;
    pts.push([x, y]);
  }
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const [hx, hy] = pts[0];
  const ang = (Math.atan2(pts[0][1] - pts[2][1], pts[0][0] - pts[2][0]) * 180) / Math.PI;
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={JADE} strokeWidth={62} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
      <path d={d} fill="none" stroke="#173B47" strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={JADE} strokeWidth={4} strokeDasharray="10 16" strokeLinecap="round" opacity={0.8} />
      <g transform={`translate(${hx},${hy}) rotate(${ang})`}>
        <path d="M-30,-40 Q50,-46 110,-10 L118,8 Q50,26 -30,36 Q-50,0 -30,-40Z" fill={JADE} />
        <path d="M-24,-33 Q46,-38 102,-8 L108,6 Q46,20 -24,30 Q-40,0 -24,-33Z" fill="#173B47" />
        <path d="M0,-34 Q-30,-80 -70,-90 M10,-34 Q-10,-90 -40,-110" stroke={JADE} strokeWidth={6} fill="none" strokeLinecap="round" />
        <circle cx={44} cy={-12} r={9} fill="#FFF0B8" />
      </g>
    </g>
  );
};

/** 竜宮（海底の光る楼閣） */
export const Ryugu: React.FC<{ x: number; y: number; s?: number; glow?: number; opacity?: number }> = ({ x, y, s = 1, glow = 1, opacity = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity}>
    <radialGradient id="ryuguGlow">
      <stop offset="0" stopColor="#BFF5E8" stopOpacity={0.8} />
      <stop offset="1" stopColor="#BFF5E8" stopOpacity={0} />
    </radialGradient>
    <ellipse cx={0} cy={-120} rx={420} ry={300} fill="url(#ryuguGlow)" opacity={glow} style={{ mixBlendMode: "screen" }} />
    <g filter="url(#paper)">
      {[0, 1, 2].map((k) => {
        const w = 360 - k * 90;
        const yy = -k * 110;
        return (
          <g key={k}>
            <rect x={-w / 2 + 30} y={yy - 70} width={w - 60} height={70} fill="#2C1E3A" />
            {[-1, 0, 1].map((c) => (
              <rect key={c} x={c * (w / 4) - 8} y={yy - 66} width={16} height={62} fill={SHU} opacity={0.85} />
            ))}
            <path d={`M${-w / 2 - 20},${yy - 66} Q0,${yy - 120} ${w / 2 + 20},${yy - 66} L${w / 2 - 10},${yy - 84} Q0,${yy - 126} ${-w / 2 + 10},${yy - 84}Z`} fill="#12324A" stroke={JADE} strokeWidth={4} />
          </g>
        );
      })}
      <rect x={-200} y={0} width={400} height={30} fill="#12324A" stroke={JADE} strokeWidth={3} />
    </g>
    <circle cx={0} cy={-360} r={14} fill={KIN} />
  </g>
);

/** 舟（平家の舟と赤旗） */
export const Boat: React.FC<{ x: number; y: number; s?: number; tilt?: number }> = ({ x, y, s = 1, tilt = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${s})`} filter="url(#paperLow)">
    <path d="M-150,0 L150,0 L110,50 L-110,50Z" fill="#2B2216" />
    <rect x={-60} y={-60} width={120} height={60} fill="#3B2A18" />
    <rect x={-4} y={-190} width={8} height={130} fill="#2B2216" />
    <path d="M4,-188 L80,-170 L4,-150Z" fill={SHU} />
  </g>
);

export { SUMI, PAPER };

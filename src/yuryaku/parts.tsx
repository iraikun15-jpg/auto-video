import React from "react";
import { random } from "remotion";
import { clamp01 } from "../jimmu/paper";
import { KIN, MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";

// 雄略回（証拠の鉄剣）の部品
export const XRAY = "#7FD3FF"; // X線の光
export const XRAY_DARK = "#0C1A2A"; // X線写真の地
export const RUST = "#5E3B26"; // 鉄錆

// 稲荷山古墳出土鉄剣の金象嵌銘（表57字・裏58字、計115字）
export const MEI_FRONT = [..."辛亥年七月中記乎獲居臣上祖名意富比垝其児多加利足尼其児名弖已加利獲居其児名多加披次獲居其児名多沙鬼獲居其児名半弖比"];
export const MEI_BACK = [..."其児名加差披余其児名乎獲居臣世々為杖刀人首奉事来至今獲加多支鹵大王寺在斯鬼宮時吾左治天下令作此百練利刀記吾奉事根原也"];
export const OKIMI_AT = 26; // 裏面で「獲加多支鹵大王」が始まる位置（7字）

/**
 * 鉄剣（縦向き、原点は茎（なかご）の下端、上へ伸びる）
 * xray: 0=錆びた鉄、1=X線写真（紺の地に金の文字）
 * reveal: 銘文が現れる割合（上から順に）
 * chars: 刃に並べる文字。highlight に入る添字の文字を大きく光らせる
 */
export const IronSword: React.FC<{
  x: number;
  y: number;
  s?: number;
  rot?: number;
  len?: number;
  xray?: number;
  reveal?: number;
  chars?: string[];
  highlight?: number[];
  glow?: number;
  opacity?: number;
}> = ({ x, y, s = 1, rot = 0, len = 1300, xray = 0, reveal = 0, chars = [], highlight = [], glow = 0, opacity = 1 }) => {
  const w = 78;
  const top = -len;
  const bladeD = `M${-w / 2},-120 L${-w / 2},${top + 90} L0,${top} L${w / 2},${top + 90} L${w / 2},-120Z`;
  const n = chars.length;
  const step = n ? (len - 260) / n : 0;
  const size = Math.min(58, step * 0.92);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
      {glow > 0 ? <ellipse cx={0} cy={top / 2} rx={170} ry={len * 0.6} fill={XRAY} opacity={0.12 * glow} style={{ mixBlendMode: "screen" }} /> : null}
      {/* 錆びた鉄 */}
      <g opacity={1 - xray} filter="url(#paperLow)">
        <rect x={-16} y={-120} width={32} height={140} rx={6} fill="#3E2416" />
        <path d={bladeD} fill={RUST} />
        {Array.from({ length: 26 }, (_, i) => (
          <ellipse
            key={i}
            cx={(random(`rx${i}`) - 0.5) * w * 0.8}
            cy={-140 - random(`ry${i}`) * (len - 200)}
            rx={8 + random(`rr${i}`) * 18}
            ry={14 + random(`rh${i}`) * 34}
            fill={i % 3 ? "#7A4A2E" : "#3E2416"}
            opacity={0.55}
          />
        ))}
      </g>
      {/* X線写真 */}
      {xray > 0 ? (
        <g opacity={xray}>
          <rect x={-16} y={-120} width={32} height={140} rx={6} fill="#1C3A55" stroke={XRAY} strokeWidth={2} />
          <path d={bladeD} fill="#10283C" stroke={XRAY} strokeWidth={4} />
          <path d={`M0,-130 L0,${top + 40}`} stroke={XRAY} strokeWidth={2} opacity={0.4} />
        </g>
      ) : null}
      {/* 金象嵌の銘文（上から順に現れる） */}
      {chars.map((c, i) => {
        const appear = clamp01(reveal * (n + 4) - i);
        if (appear <= 0) return null;
        const hi = highlight.includes(i);
        const cy = top + 150 + i * step;
        return (
          <g key={i} opacity={appear}>
            {hi ? <circle cx={0} cy={cy - size * 0.35} r={size * 0.85} fill={KIN} opacity={0.25} style={{ mixBlendMode: "screen" }} /> : null}
            <text x={0} y={cy} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={hi ? size * 1.08 : size} fill={hi ? "#FFE08A" : KIN}>
              {c}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** 証拠の階段：神武（神話）→ 崇神（可能性）→ 雄略（証明）。lit は何段目まで光らせるか（0〜3） */
export const EvidenceStairs: React.FC<{ x: number; y: number; lit: number; s?: number }> = ({ x, y, lit, s = 1 }) => {
  const steps = [
    { name: "神武", word: "神話", color: "#8B7E6A" },
    { name: "崇神", word: "可能性", color: "#5E3C78" },
    { name: "雄略", word: "証明", color: SHU },
  ];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {steps.map((st, i) => {
        const on = clamp01(lit - i);
        const bx = -330 + i * 230;
        const h = 90 + i * 110;
        return (
          <g key={i} opacity={0.35 + 0.65 * on}>
            <g filter="url(#paperLow)">
              <rect x={bx} y={-h} width={220} height={h} fill={on > 0.5 ? st.color : "#C9BFA8"} />
            </g>
            <text x={bx + 110} y={-h + 60} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={PAPER}>
              {st.word}
            </text>
            <text x={bx + 110} y={44} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={40} fill={SUMI}>
              {st.name}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** 三方向の記録が一致する三角形（記紀・鉄剣・中国の史書）。t で線が結ばれる */
export const Triad: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => {
  const pts: [number, number, string][] = [
    [0, -260, "記紀の雄略"],
    [-300, 200, "鉄剣の銘文"],
    [300, 200, "中国の史書"],
  ];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {pts.map((p, i) => {
        const q = pts[(i + 1) % 3];
        const k = clamp01(t * 3 - i);
        return k > 0 ? <path key={`l${i}`} d={`M${p[0]},${p[1]} L${p[0] + (q[0] - p[0]) * k},${p[1] + (q[1] - p[1]) * k}`} stroke={KIN} strokeWidth={10} strokeLinecap="round" /> : null;
      })}
      {pts.map((p, i) => (
        <g key={i}>
          <g filter="url(#paperLow)">
            <circle cx={p[0]} cy={p[1]} r={70} fill={i === 1 ? RUST : i === 2 ? "#2F4B68" : SUMI} />
          </g>
          <text x={p[0]} y={p[1] + 120} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={SUMI} stroke={PAPER} strokeWidth={8} paintOrder="stroke">
            {p[2]}
          </text>
          <text x={p[0]} y={p[1] + 18} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={52} fill={PAPER}>
            {i === 0 ? "紀" : i === 1 ? "剣" : "宋"}
          </text>
        </g>
      ))}
    </g>
  );
};

/** 年表のバー（400〜700年）。marker の位置に印、label を添える */
export const Timeline: React.FC<{ x: number; y: number; w: number; marker: number; label: string; t?: number }> = ({ x, y, w, marker, label, t = 1 }) => {
  const pos = (yr: number) => x + ((yr - 400) / 300) * w;
  return (
    <g opacity={t}>
      <g filter="url(#paperLow)">
        <rect x={x} y={y - 10} width={w} height={20} rx={10} fill={PAPER} />
      </g>
      {[400, 500, 600, 700].map((yr) => (
        <g key={yr}>
          <rect x={pos(yr) - 2} y={y - 24} width={4} height={48} fill={SUMI} />
          <text x={pos(yr)} y={y + 70} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={36} fill={SUMI} stroke={PAPER} strokeWidth={6} paintOrder="stroke">
            {yr}年
          </text>
        </g>
      ))}
      <g transform={`translate(${pos(marker)},${y})`}>
        <path d="M0,-30 L-24,-74 L24,-74Z" fill={SHU} />
        <text x={0} y={-90} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={SHU} stroke={PAPER} strokeWidth={8} paintOrder="stroke">
          {label}
        </text>
      </g>
    </g>
  );
};

/** 発掘調査の方眼（地図に重ねる） */
export const SurveyGrid: React.FC<{ x: number; y: number; w: number; h: number; step?: number; opacity?: number }> = ({ x, y, w, h, step = 100, opacity = 0.35 }) => (
  <g opacity={opacity}>
    {Array.from({ length: Math.floor(w / step) + 1 }, (_, i) => (
      <rect key={`v${i}`} x={x + i * step} y={y} width={1.5} height={h} fill={PAPER} />
    ))}
    {Array.from({ length: Math.floor(h / step) + 1 }, (_, i) => (
      <rect key={`h${i}`} x={x} y={y + i * step} width={w} height={1.5} fill={PAPER} />
    ))}
    {/* 方位 */}
    <g transform={`translate(${x + w - 60},${y + 70})`}>
      <circle r={34} fill="none" stroke={PAPER} strokeWidth={3} />
      <path d="M0,-30 L10,6 L0,0 L-10,6Z" fill={PAPER} />
      <text x={0} y={-40} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={26} fill={PAPER}>
        N
      </text>
    </g>
  </g>
);

export { SUMI, PAPER, KIN };

import React from "react";
import { clamp01 } from "../jimmu/paper";
import { KIN, MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";

// 卑弥呼回（中国の史書の中の日本）の部品
export const KOKUSHI = "#2F5D50"; // 卑弥呼の翡翠の深緑
export const URUSHI = "#1C1414"; // 黒漆
export const BRONZE = "#A67C3D"; // 銅鏡
export const AKA = "#B33A2A"; // 中国の朱

// 『魏志倭人伝』の一節（右ページ・左ページ、各列は縦書き）
export const BOOK_RIGHT = ["倭人在帶方東南大海之中", "其國本亦以男子爲王", "倭國亂相攻伐歴年", "乃共立一女子爲王", "名曰卑彌呼", "事鬼道能惑衆"];
export const BOOK_LEFT = ["制詔親魏倭王卑彌呼", "銅鏡百枚", "卑彌呼以死大作冢", "徇葬者奴婢百餘人", "復立卑彌呼宗女壹與", "年十三爲王國中遂定"];

/**
 * 線装本（見開き）。中国の書物らしく右ページから縦書き。
 * glow: 「卑彌呼」を光らせる度合い、burn: 下から焦げて消える度合い（IF 用）
 */
export const Book: React.FC<{ x: number; y: number; s?: number; glow?: number; burn?: number; title?: string; opacity?: number; hiWords?: string[] }> = ({
  x,
  y,
  s = 1,
  glow = 0,
  burn = 0,
  title = "魏志倭人伝",
  opacity = 1,
  hiWords = ["卑彌呼"],
}) => {
  const pw = 360;
  const ph = 480;
  const col = (text: string, cx: number) => {
    const chars = [...text];
    const size = Math.min(34, (ph - 70) / chars.length);
    const marks = new Set<number>();
    for (const w of hiWords) {
      let k = text.indexOf(w);
      while (k >= 0) {
        for (let j = 0; j < [...w].length; j++) marks.add(k + j);
        k = text.indexOf(w, k + 1);
      }
    }
    return chars.map((c, i) => {
      const hi = marks.has(i);
      return (
        <g key={i}>
          {hi && glow > 0 ? <circle cx={cx} cy={-ph / 2 + 50 + i * size * 1.05 - size * 0.3} r={size * 0.72} fill={KIN} opacity={0.45 * glow} /> : null}
          <text x={cx} y={-ph / 2 + 50 + i * size * 1.05} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={hi && glow > 0 ? AKA : SUMI}>
            {c}
          </text>
        </g>
      );
    });
  };
  const burnTop = ph / 2 - ph * 1.1 * clamp01(burn);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity * (1 - clamp01((burn - 0.85) * 6.7))}>
      <clipPath id={`bookClip-${x}-${y}`}>
        <rect x={-pw - 40} y={-ph / 2 - 60} width={pw * 2 + 80} height={burnTop + ph / 2 + 60} />
      </clipPath>
      <g clipPath={burn > 0 ? `url(#bookClip-${x}-${y})` : undefined}>
        <g filter="url(#paper)">
          {/* 表紙（藍の布）が見開きの外に少しのぞく */}
          <rect x={-pw - 24} y={-ph / 2 - 20} width={pw * 2 + 48} height={ph + 40} rx={8} fill="#2A3A55" />
          <rect x={-pw} y={-ph / 2} width={pw} height={ph} fill="#EFE4CC" />
          <rect x={0} y={-ph / 2} width={pw} height={ph} fill="#F3E9D3" />
        </g>
        {/* 罫線（朱）と本文 */}
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <rect x={pw - 20 - i * 52} y={-ph / 2 + 16} width={1.5} height={ph - 32} fill={AKA} opacity={0.35} />
            <rect x={-20 - i * 52} y={-ph / 2 + 16} width={1.5} height={ph - 32} fill={AKA} opacity={0.35} />
          </g>
        ))}
        {BOOK_RIGHT.map((t, i) => col(t, pw - 46 - i * 52))}
        {BOOK_LEFT.map((t, i) => col(t, -46 - i * 52))}
        {/* 綴じ糸 */}
        <rect x={-3} y={-ph / 2} width={6} height={ph} fill="#7A6A50" opacity={0.6} />
      </g>
      {burn > 0 && burn < 1 ? (
        <path
          d={Array.from({ length: 18 }, (_, i) => `${i ? "L" : "M"}${-pw - 24 + (i * (pw * 2 + 48)) / 17},${burnTop + Math.sin(i * 1.9 + burn * 30) * 10}`).join("")}
          stroke="#E8762E"
          strokeWidth={10}
          fill="none"
        />
      ) : null}
      {/* 題箋 */}
      {title ? (
        <g transform={`translate(${pw + 70},${-ph / 2 + 40})`}>
          <rect x={-40} y={0} width={80} height={title.length * 52 + 30} fill={PAPER} stroke={AKA} strokeWidth={4} filter="url(#paperLow)" />
          {[...title].map((c, i) => (
            <text key={i} x={0} y={60 + i * 52} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={SUMI}>
              {c}
            </text>
          ))}
        </g>
      ) : null}
    </g>
  );
};

/** 銅鏡（上から見た円鏡）。shine で光が走る */
export const Mirror: React.FC<{ x: number; y: number; r: number; t?: number; shine?: number }> = ({ x, y, r, t = 1, shine = 0 }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${0.3 + 0.7 * clamp01(t)})`} opacity={clamp01(t * 2)}>
      <circle r={r} fill={BRONZE} />
      <circle r={r * 0.82} fill="none" stroke="#7A5A2A" strokeWidth={Math.max(1, r * 0.06)} />
      <circle r={r * 0.58} fill="none" stroke="#C49A55" strokeWidth={Math.max(1, r * 0.05)} />
      {Array.from({ length: 8 }, (_, k) => (
        <circle key={k} cx={Math.cos((k / 8) * Math.PI * 2) * r * 0.7} cy={Math.sin((k / 8) * Math.PI * 2) * r * 0.7} r={r * 0.06} fill="#7A5A2A" />
      ))}
      <circle r={r * 0.16} fill="#7A5A2A" />
      {shine > 0 ? <circle r={r} fill="#FFF1C2" opacity={0.6 * shine} /> : null}
    </g>
  );

/** 金印（つまみ付き）。press 0〜1 で降りてきて押す */
export const GoldSeal: React.FC<{ x: number; y: number; s?: number; lift?: number }> = ({ x, y, s = 1, lift = 0 }) => (
  <g transform={`translate(${x},${y - lift * 220}) scale(${s})`} filter="url(#paper)">
    <rect x={-80} y={-60} width={160} height={60} rx={6} fill={KIN} />
    <path d="M-60,-60 Q-60,-130 0,-140 Q60,-130 60,-60Z" fill="#D9B35A" />
    <circle cx={0} cy={-110} r={16} fill="#B08A3A" />
  </g>
);

/** 印影「親魏倭王」（朱の四角い印） */
export const SealPrint: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(-3)`} opacity={clamp01(t * 2)}>
      <rect x={-150} y={-150} width={300} height={300} rx={14} fill="none" stroke={AKA} strokeWidth={16} />
      {[
        ["親", 70, -60],
        ["魏", 70, 80],
        ["倭", -70, -60],
        ["王", -70, 80],
      ].map(([c, cx, cy]) => (
        <text key={c as string} x={cx as number} y={(cy as number) + 30} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={120} fill={AKA}>
          {c}
        </text>
      ))}
    </g>
  );

/** 魏の宮殿（反りのある屋根の楼閣） */
export const WeiPalace: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} filter="url(#paper)">
    <rect x={-170} y={-20} width={340} height={40} fill="#5A4A3A" />
    <rect x={-130} y={-140} width={260} height={120} fill={AKA} />
    {[-90, -30, 30, 90].map((cx) => (
      <rect key={cx} x={cx - 10} y={-140} width={20} height={120} fill="#7A2418" />
    ))}
    <path d="M-200,-140 Q-120,-150 0,-210 Q120,-150 200,-140 L220,-160 Q120,-170 0,-240 Q-120,-170 -220,-160Z" fill={URUSHI} />
    <path d="M-120,-250 Q0,-290 120,-250 L130,-262 Q0,-310 -130,-262Z" fill={URUSHI} />
    <rect x={-80} y={-250} width={160} height={40} fill={AKA} />
  </g>
);

/** 大きな塚（円い墳丘）と、殉葬された人々の小さな影の列 */
export const Mound: React.FC<{ x: number; y: number; t: number; people: number }> = ({ x, y, t, people }) => (
  <g>
    <g transform={`translate(${x},${y})`} opacity={clamp01(t * 2)}>
      <g filter="url(#paper)">
        <path d={`M-380,0 Q-330,${-260 * t} 0,${-300 * t} Q330,${-260 * t} 380,0Z`} fill="#6E7A52" />
      </g>
      <path d={`M-300,-20 Q0,${-250 * t} 300,-20`} fill="none" stroke="#8C9468" strokeWidth={12} />
    </g>
    {Array.from({ length: 30 }, (_, i) => {
      const on = clamp01(people * 30 - i);
      const px = x - 420 + (i % 15) * 60;
      const py = y + 70 + Math.floor(i / 15) * 70;
      return on > 0 ? (
        <g key={i} opacity={0.75 * on} transform={`translate(${px},${py})`}>
          <circle cx={0} cy={-46} r={10} fill={SUMI} />
          <path d="M-12,-34 L12,-34 L16,0 L-16,0Z" fill={SUMI} />
        </g>
      ) : null;
    })}
  </g>
);

/** 虫めがね */
export const Magnifier: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = -30 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} filter="url(#paperLow)">
    <circle r={90} fill="#DCEFF2" opacity={0.35} stroke="#5A4A3A" strokeWidth={18} />
    <rect x={-14} y={90} width={28} height={150} rx={10} fill="#5A3B20" />
  </g>
);

export { SHU, KIN, PAPER, SUMI };

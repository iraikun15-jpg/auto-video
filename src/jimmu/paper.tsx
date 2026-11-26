import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile } from "remotion";
import { Cam, LANDS, LL, partial, polyPath, project } from "./geo";
import { AI, AI_LIGHT, H, KIN, MINCHO, MURASAKI, PAPER, PAPER_BG, SANS, SHU, SUGI, SUMI, W } from "./theme";

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
 *  - paper: 落ち影（紙が1枚浮いて見える）
 *  - paperLow: 浅い落ち影（小さい部品用）
 */
const Defs: React.FC<{ f: number }> = ({ f }) => (
  <defs>
    {/* 紙が1枚浮いて見える落ち影（ノイズ系フィルタは描画が崩れるので使わない） */}
    <filter id="paper" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="5" dy="9" stdDeviation="5" floodColor="#3a2a14" floodOpacity="0.38" />
    </filter>
    <filter id="paperLow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="3" dy="5" stdDeviation="3" floodColor="#3a2a14" floodOpacity="0.35" />
    </filter>
    {/* 海の青海波もよう */}
    <pattern id="seigaiha" width="64" height="32" patternUnits="userSpaceOnUse" patternTransform={`translate(${(f * 0.8) % 64},${Math.sin(f * 0.05) * 4})`}>
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

/** 台紙（和紙の画像）＋SVGキャンバス＋いちばん上に和紙の繊維。children は SVG 要素 */
export const Stage: React.FC<{
  children: React.ReactNode;
  tint?: string;
  tintOpacity?: number;
  f?: number; // セグメント内フレーム（海の波・舞う紙片・めくり用）
  peel?: boolean; // 冒頭の場面転換を入れるか
  look?: "jimmu" | "takeru" | "sujin" | "kusanagi" | "yuryaku" | "himiko"; // 回ごとの見た目（舞うもの・場面転換）。jimmu=金の小片＋紙めくり、takeru=白い羽根＋巻物、sujin=杉の葉＋御簾、kusanagi=夜の和紙＋光の粒＋剣閃
  night?: number; // 夜の和紙の濃さ（kusanagi の既定は 1。0 で生成りの和紙）
}> = ({ children, tint, tintOpacity = 0, f = 0, peel = true, look = "jimmu", night }) => {
  const dark = night ?? (look === "kusanagi" ? 1 : 0);
  return (
  <AbsoluteFill style={{ backgroundColor: PAPER_BG }}>
    <Img src={staticFile("jimmu/washi_bg.jpg")} style={{ position: "absolute", width: W, height: H }} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <Defs f={f} />
      {dark > 0 ? (
        <>
          <linearGradient id="nightGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#0B1128" />
            <stop offset="0.6" stopColor="#141E3E" />
            <stop offset="1" stopColor="#1E2B4E" />
          </linearGradient>
          <rect width={W} height={H} fill="url(#nightGrad)" opacity={0.9 * dark} />
        </>
      ) : null}
      {children}
    </svg>
    {tint ? <AbsoluteFill style={{ backgroundColor: tint, opacity: tintOpacity, mixBlendMode: "multiply" }} /> : null}
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <Defs f={f} />
      {/* 四隅を少し暗く（古い紙の焼け） */}
      <radialGradient id="vignette" cx="50%" cy="48%" r="75%">
        <stop offset="60%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#3a2410" stopOpacity={0.35} />
      </radialGradient>
      <rect width={W} height={H} fill="url(#vignette)" />
      {look === "takeru" ? <Feathers f={f} /> : look === "sujin" ? <SugiLeaves f={f} /> : look === "kusanagi" ? <Motes f={f} /> : look === "yuryaku" ? <FloatingGlyphs f={f} /> : look === "himiko" ? <MirrorGlints f={f} /> : <Flecks f={f} />}
      {peel ? look === "takeru" ? <ScrollIn f={f} /> : look === "sujin" ? <MisuIn f={f} /> : look === "kusanagi" ? <SlashIn f={f} /> : look === "yuryaku" ? <XrayIn f={f} /> : look === "himiko" ? <PageTurnIn f={f} /> : <PeelIn f={f} /> : null}
    </svg>
    <Img src={staticFile("jimmu/washi_fibers.png")} style={{ position: "absolute", width: W, height: H, opacity: dark > 0 ? 0.6 - 0.35 * dark : 0.6 }} />
  </AbsoluteFill>
  );
};

/** ゆっくり舞う金と紙の小片（画面が止まって見えないように） */
const Flecks: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 14 }, (_, i) => {
      const sx = random(`fx${i}`) * W;
      const speed = 0.6 + random(`fs${i}`) * 0.9;
      const y = ((random(`fy${i}`) * (H + 200) + f * speed) % (H + 200)) - 100;
      const x = sx + Math.sin(f * 0.03 + i) * 40;
      const r = 5 + random(`fr${i}`) * 7;
      return (
        <rect
          key={i}
          x={x - r}
          y={y - r * 0.6}
          width={r * 2}
          height={r * 1.2}
          rx={2}
          fill={i % 3 === 0 ? KIN : PAPER}
          opacity={0.55}
          transform={`rotate(${f * (2 + i) + i * 40},${x},${y})`}
        />
      );
    })}
  </g>
);

/** 小さな銅鏡がくるりと回りながら漂い、ときどき光る（卑弥呼回） */
const MirrorGlints: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 10 }, (_, i) => {
      const speed = 0.3 + random(`mg${i}`) * 0.5;
      const y = ((random(`mgy${i}`) * (H + 200) + f * speed) % (H + 200)) - 100;
      const x = random(`mgx${i}`) * W + Math.sin(f * 0.02 + i * 2.3) * 40;
      const r = 12 + random(`mgr${i}`) * 12;
      const flip = Math.cos(f * 0.06 + i * 1.1);
      const shine = Math.max(0, flip) ** 8;
      return (
        <g key={i} transform={`translate(${x},${y}) scale(${Math.abs(flip) * 0.9 + 0.1},1)`} opacity={0.55}>
          <circle r={r} fill="#A67C3D" />
          <circle r={r * 0.7} fill="none" stroke="#7A5A2A" strokeWidth={2} />
          <circle r={r * 0.2} fill="#7A5A2A" />
          {shine > 0.05 ? <circle r={r * 1.6} fill="#FFF1C2" opacity={0.5 * shine} /> : null}
        </g>
      );
    })}
  </g>
);

/** 冒頭：線装本のページが右から左へめくれ、次の場面が現れる（卑弥呼回） */
const PageTurnIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 15, Easing.inOut(Easing.cubic));
  if (t >= 1) return null;
  // ページは左端（綴じ側）を軸にして、幅が 1→0 に縮みながら左へ倒れる
  const wPage = W * (1 - t);
  const cols = 9;
  return (
    <g>
      <g filter="url(#paper)">
        <rect x={0} y={0} width={wPage} height={H} fill="#EFE4CC" />
      </g>
      {Array.from({ length: cols }, (_, i) => (
        <rect key={i} x={wPage * ((i + 0.5) / cols) - 2} y={140} width={4} height={H - 280} fill="#B33A2A" opacity={0.25} />
      ))}
      {/* めくれの影 */}
      <rect x={Math.max(0, wPage - 60)} y={0} width={60} height={H} fill="#000" opacity={0.12 * (1 - t)} />
      <rect x={wPage} y={0} width={30} height={H} fill="#000" opacity={0.18 * Math.sin(t * Math.PI)} />
    </g>
  );
};

/** 稲荷山鉄剣の銘文の文字がかすかに漂う（雄略回） */
const GLYPHS = [..."辛亥年七月中記乎獲居臣上祖名意富比垝獲加多支鹵大王寺在斯鬼宮時吾左治天下令作此百練利刀"];
const FloatingGlyphs: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 12 }, (_, i) => {
      const speed = 0.35 + random(`gy${i}`) * 0.5;
      const y = ((random(`gyy${i}`) * (H + 200) + f * speed) % (H + 200)) - 100;
      const x = random(`gyx${i}`) * W + Math.sin(f * 0.02 + i * 1.9) * 30;
      const ch = GLYPHS[Math.floor(random(`gyc${i}`) * GLYPHS.length)];
      return (
        <text key={i} x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={34 + random(`gys${i}`) * 26} fill={KIN} opacity={0.22 + 0.1 * Math.sin(f * 0.06 + i)}>
          {ch}
        </text>
      );
    })}
  </g>
);

/** 冒頭：X線のスキャン光が上から下へ走り、光の通ったあとに次の場面が現れる（雄略回） */
const XrayIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 15, Easing.inOut(Easing.cubic));
  if (t >= 1) return null;
  const y = -40 + t * (H + 80);
  return (
    <g>
      <rect x={0} y={y} width={W} height={H - y + 40} fill="#0C1A2A" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={0} y={y + i * 160} width={W} height={2} fill="#7FD3FF" opacity={0.18} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={`v${i}`} x={i * 135} y={y} width={2} height={H - y + 40} fill="#7FD3FF" opacity={0.12} />
      ))}
      <rect x={0} y={y - 70} width={W} height={70} fill="#7FD3FF" opacity={0.18} />
      <rect x={0} y={y - 14} width={W} height={14} fill="#BFEFFF" opacity={0.7} />
      <rect x={0} y={y - 3} width={W} height={4} fill="#FFFFFF" />
    </g>
  );
};

/** 蛍火のような光の粒がゆっくり昇る（草薙剣回） */
const Motes: React.FC<{ f: number }> = ({ f }) => (
  <g style={{ mixBlendMode: "screen" }}>
    <radialGradient id="moteGrad">
      <stop offset="0" stopColor="#FFF4C8" stopOpacity={1} />
      <stop offset="0.35" stopColor="#E9C26A" stopOpacity={0.7} />
      <stop offset="1" stopColor="#E9C26A" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="moteGrad2">
      <stop offset="0" stopColor="#E6FFF6" stopOpacity={1} />
      <stop offset="0.35" stopColor="#7FD6C2" stopOpacity={0.7} />
      <stop offset="1" stopColor="#7FD6C2" stopOpacity={0} />
    </radialGradient>
    {Array.from({ length: 16 }, (_, i) => {
      const speed = 0.5 + random(`mo${i}`) * 0.9;
      const y = H + 100 - ((random(`my${i}`) * (H + 200) + f * speed) % (H + 200));
      const x = random(`mx${i}`) * W + Math.sin(f * 0.03 + i * 2.1) * 40;
      const r = 10 + random(`mr${i}`) * 16;
      const flicker = 0.55 + 0.45 * Math.sin(f * 0.15 + i * 1.3);
      return <circle key={i} cx={x} cy={y} r={r} fill={`url(#${i % 3 === 0 ? "moteGrad2" : "moteGrad"})`} opacity={flicker} />;
    })}
  </g>
);

/** 冒頭：剣閃。斜めに光の線が走り、夜の紙が二つに切り分かれて左右へ退く（草薙剣回） */
const SlashIn: React.FC<{ f: number }> = ({ f }) => {
  const flash = ramp(f, 0, 3) * (1 - ramp(f, 5, 12));
  const open = ramp(f, 3, 16, Easing.in(Easing.cubic));
  if (open >= 1) return null;
  // 切り口：左下 (-200,1500) → 右上 (1280,420)。法線方向に開く
  const ax = -200, ay = 1500, bx = 1280, by = 420;
  const nx = (ay - by) / Math.hypot(bx - ax, by - ay);
  const ny = (bx - ax) / Math.hypot(bx - ax, by - ay);
  const d = open * 1200;
  const upper = `M${ax},${ay} L${bx},${by} L${bx},-400 L${ax},-400Z`;
  const lower = `M${ax},${ay} L${bx},${by} L${bx},${H + 400} L${ax},${H + 400}Z`;
  return (
    <g>
      <g transform={`translate(${-nx * d},${-ny * d})`}>
        <path d={upper} fill="#0E1530" />
        <path d={`M${ax},${ay} L${bx},${by}`} stroke={KIN} strokeWidth={6} />
      </g>
      <g transform={`translate(${nx * d},${ny * d})`}>
        <path d={lower} fill="#121A36" />
        <path d={`M${ax},${ay} L${bx},${by}`} stroke={KIN} strokeWidth={6} />
      </g>
      {flash > 0 ? (
        <g opacity={flash}>
          <path d={`M${ax},${ay} L${bx},${by}`} stroke="#FFF6D8" strokeWidth={60} opacity={0.25} />
          <path d={`M${ax},${ay} L${bx},${by}`} stroke="#FFF6D8" strokeWidth={22} opacity={0.6} />
          <path d={`M${ax},${ay} L${bx},${by}`} stroke="#FFFFFF" strokeWidth={6} />
        </g>
      ) : null}
    </g>
  );
};

/** ゆっくり舞い落ちる杉の葉（崇神回：三輪の神杉にちなむ） */
const SugiLeaves: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 9 }, (_, i) => {
      const speed = 0.6 + random(`sg${i}`) * 0.8;
      const y = ((random(`sy${i}`) * (H + 300) + f * speed) % (H + 300)) - 150;
      const x = random(`sx${i}`) * W + Math.sin(f * 0.02 + i * 1.7) * 60;
      const sc = 0.6 + random(`sr${i}`) * 0.6;
      const rot = f * (0.6 + (i % 3) * 0.3) + i * 50;
      return (
        <g key={i} transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={0.85} stroke={SUGI} strokeLinecap="round">
          <path d="M0,-34 L0,34" strokeWidth={3} />
          {[-24, -12, 0, 12, 24].map((yy) => (
            <path key={yy} d={`M0,${yy} L-12,${yy - 9} M0,${yy} L12,${yy - 9}`} strokeWidth={3} />
          ))}
        </g>
      );
    })}
  </g>
);

/** 冒頭：竹の御簾（みす）が上へ巻き上がり、次の場面が現れる（崇神回） */
const MisuIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 15, Easing.inOut(Easing.cubic));
  if (t >= 1) return null;
  const bottom = H * (1 - t);
  const slats = Math.ceil(bottom / 22);
  return (
    <g>
      <g filter="url(#paper)">
        <rect x={0} y={0} width={W} height={bottom} fill="#C9B27E" />
      </g>
      {Array.from({ length: slats }, (_, i) => (
        <rect key={i} x={0} y={i * 22} width={W} height={3} fill="#8A7346" opacity={0.6} />
      ))}
      {/* 縦の綴じ糸 */}
      {[180, 540, 900].map((x) => (
        <rect key={x} x={x - 3} y={0} width={6} height={bottom} fill={MURASAKI} opacity={0.75} />
      ))}
      {/* 巻き上がった部分と紫の縁 */}
      <rect x={0} y={bottom - 34} width={W} height={34} rx={14} fill="#A88F5C" />
      <rect x={0} y={bottom - 6} width={W} height={10} fill={MURASAKI} />
    </g>
  );
};

/** ゆっくり舞い落ちる白い羽根（ヤマトタケル回：白鳥伝説にちなむ） */
const Feathers: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 9 }, (_, i) => {
      const speed = 0.7 + random(`ws${i}`) * 0.8;
      const y = ((random(`wy${i}`) * (H + 300) + f * speed) % (H + 300)) - 150;
      const x = random(`wx${i}`) * W + Math.sin(f * 0.025 + i * 1.3) * 70;
      const sc = 0.6 + random(`wr${i}`) * 0.7;
      const rot = Math.sin(f * 0.03 + i) * 35 + i * 40;
      return (
        <g key={i} transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={0.85}>
          <path d="M0,-34 C14,-22 16,10 4,34 L-2,34 C-14,12 -12,-20 0,-34Z" fill="#FFFFFF" />
          <path d="M0,-30 L1,40" stroke="#B9AE98" strokeWidth={2} />
          <path d="M1,-6 L12,-14 M1,6 L13,-1 M0,-2 L-11,-10 M0,10 L-12,3" stroke="#D8CFBD" strokeWidth={1.5} />
        </g>
      );
    })}
  </g>
);

/** 冒頭：木の軸の巻物が左から右へ転がり、軸の通ったあとに新しい場面が現れる（ヤマトタケル回） */
const ScrollIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 15, Easing.inOut(Easing.cubic));
  if (t >= 1) return null;
  const rx = -40 + t * (W + 100);
  return (
    <g>
      <rect x={rx} y={0} width={W - rx + 60} height={H} fill={PAPER_BG} />
      <linearGradient id="scrollRod" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#4a2f18" />
        <stop offset="0.45" stopColor="#a8794a" />
        <stop offset="1" stopColor="#3d2612" />
      </linearGradient>
      <g filter="url(#paper)">
        <rect x={rx - 26} y={-20} width={52} height={H + 40} fill="url(#scrollRod)" rx={10} />
      </g>
      {/* 巻物の紐（朱）と軸の金具 */}
      <rect x={rx - 30} y={H / 2 - 10} width={60} height={20} fill={SHU} />
      <rect x={rx - 34} y={-10} width={68} height={40} rx={8} fill={KIN} />
      <rect x={rx - 34} y={H - 30} width={68} height={40} rx={8} fill={KIN} />
    </g>
  );
};

/** 冒頭：前の場面の紙が、破れた端からめくれて左へ剥がれていく */
const PeelIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 13, Easing.in(Easing.quad));
  if (t >= 1) return null;
  const off = -300 - t * 1300;
  const edge = Array.from({ length: 25 }, (_, i) => {
    const y = -150 + i * 92;
    return `L${W + 40 + (random(`pe${i}`) - 0.5) * 70},${y}`;
  }).join("");
  return (
    <g transform={`translate(${off},${t * 120}) rotate(${-t * 14},${W},${H / 2})`}>
      <g filter="url(#paper)">
        <path d={`M-400,-150 ${edge} L-400,${H + 150}Z`} fill={PAPER_BG} />
      </g>
    </g>
  );
};

// ---------- 地図 ----------
/** 海（藍の紙）と陸（生成りの紙）。frame でゆらぎを入れない静かな地図 */
export const MapLayer: React.FC<{ cam: Cam; opacity?: number; seaRect?: [number, number, number, number]; lands?: LL[][] }> = ({
  cam,
  opacity = 1,
  seaRect = [40, 330, 1000, 900],
  lands = LANDS,
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
          {lands.map((land, i) => (
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
export type TokenKind = "jimmu" | "enemy" | "clan" | "itsuse" | "takeru" | "sujin";
const TOKEN_COLORS: Record<TokenKind, string> = { jimmu: SHU, enemy: SUMI, clan: "#7d6b55", itsuse: SHU, takeru: PAPER, sujin: MURASAKI };

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
        <circle r={r} fill={TOKEN_COLORS[kind]} stroke={kind === "takeru" ? SUMI : undefined} strokeWidth={kind === "takeru" ? r * 0.12 : undefined} />
      </g>
      <circle r={r * 0.82} fill="none" stroke={kind === "takeru" ? SUMI : PAPER} strokeWidth={r * 0.07} opacity={0.75} />
      {kind === "sujin" ? (
        // 紫の駒に金の冠
        <g fill={KIN}>
          <rect x={-r * 0.3} y={-r * 0.42} width={r * 0.6} height={r * 0.5} rx={r * 0.08} />
          <rect x={-r * 0.48} y={r * 0.08} width={r * 0.96} height={r * 0.16} rx={r * 0.06} />
        </g>
      ) : kind === "takeru" ? (
        // 白い駒に墨の剣
        <g fill={SUMI}>
          <path d={`M0,${-r * 0.66} L${r * 0.1},${-r * 0.5} L${r * 0.1},${r * 0.22} L${-r * 0.1},${r * 0.22} L${-r * 0.1},${-r * 0.5}Z`} />
          <rect x={-r * 0.3} y={r * 0.22} width={r * 0.6} height={r * 0.1} />
          <rect x={-r * 0.06} y={r * 0.32} width={r * 0.12} height={r * 0.3} />
        </g>
      ) : kind === "jimmu" || kind === "itsuse" ? (
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

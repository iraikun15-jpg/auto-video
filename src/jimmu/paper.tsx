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

export type Look = "jimmu" | "takeru" | "sujin" | "kusanagi" | "yuryaku" | "himiko" | "keitai" | "izumo" | "suiko" | "shotoku";

/** 台紙（和紙の画像）＋SVGキャンバス＋いちばん上に和紙の繊維。children は SVG 要素 */
export const Stage: React.FC<{
  children: React.ReactNode;
  tint?: string;
  tintOpacity?: number;
  f?: number; // セグメント内フレーム（海の波・舞う紙片・めくり用）
  peel?: boolean; // 冒頭の場面転換を入れるか
  look?: Look; // 回ごとの見た目（舞うもの・場面転換）。jimmu=金の小片＋紙めくり、takeru=白い羽根＋巻物、sujin=杉の葉＋御簾、kusanagi=夜の和紙＋光の粒＋剣閃
  night?: number; // 夜の和紙の濃さ（kusanagi の既定は 1。0 で生成りの和紙）
  fx?: Look; // 舞うものだけ別の回のものにする（日本史キット用。省略時は look と同じ）
  trans?: Look; // 場面転換だけ別の回のものにする（同上）
}> = ({ children, tint, tintOpacity = 0, f = 0, peel = true, look: baseLook = "jimmu", night, fx, trans }) => {
  const dark = night ?? (baseLook === "kusanagi" ? 1 : 0);
  // 舞うもの・場面転換は別々に選べる（既存の回は look だけ渡すので今までどおり）
  const fxLook: Look = fx ?? baseLook;
  const transLook: Look = trans ?? baseLook;
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
      {fxLook === "takeru" ? <Feathers f={f} /> : fxLook === "sujin" ? <SugiLeaves f={f} /> : fxLook === "kusanagi" ? <Motes f={f} /> : fxLook === "yuryaku" ? <FloatingGlyphs f={f} /> : fxLook === "himiko" ? <MirrorGlints f={f} /> : fxLook === "keitai" ? <Ripples f={f} /> : fxLook === "izumo" ? <Yakumo f={f} /> : fxLook === "suiko" ? <LotusPetals f={f} /> : fxLook === "shotoku" ? <Palmettes f={f} /> : <Flecks f={f} />}
      {peel ? transLook === "takeru" ? <ScrollIn f={f} /> : transLook === "sujin" ? <MisuIn f={f} /> : transLook === "kusanagi" ? <SlashIn f={f} /> : transLook === "yuryaku" ? <XrayIn f={f} /> : transLook === "himiko" ? <PageTurnIn f={f} /> : transLook === "keitai" ? <FusumaIn f={f} /> : transLook === "izumo" ? <CloudIn f={f} /> : transLook === "suiko" ? <KaniIn f={f} /> : transLook === "shotoku" ? <HaloIn f={f} /> : <PeelIn f={f} /> : null}
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

/** 蓮の花びらがひらひら舞い落ちる（推古回：仏教が栄えた飛鳥の時代） */
const LotusPetals: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 9 }, (_, i) => {
      const speed = 0.5 + random(`lp${i}`) * 0.7;
      const y = ((random(`lpy${i}`) * (H + 300) + f * speed) % (H + 300)) - 150;
      const x = random(`lpx${i}`) * W + Math.sin(f * 0.025 + i * 1.7) * 60;
      const flip = Math.cos(f * 0.05 + i);
      return (
        <g key={i} transform={`translate(${x},${y}) rotate(${f * 0.8 + i * 40}) scale(${0.4 + Math.abs(flip) * 0.6},1)`} opacity={0.7}>
          <path d="M0,-30 Q18,-6 0,26 Q-18,-6 0,-30Z" fill="#F2C6CC" />
          <path d="M0,-24 L0,20" stroke="#D99AA6" strokeWidth={2} />
        </g>
      );
    })}
  </g>
);

/** 冒頭：冠位十二階の6色の帯が縦に並んで画面を覆い、上下へ流れ去る（推古回） */
const KaniIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 16, Easing.in(Easing.cubic));
  if (t >= 1) return null;
  const cols = ["#5E3C78", "#2F5D8A", "#C2412D", "#D9B03A", "#F2EEE4", "#211D1A"];
  const w = W / cols.length;
  return (
    <g>
      {cols.map((c, i) => {
        const dir = i % 2 ? 1 : -1;
        const off = dir * t * (H + 200) * (0.8 + i * 0.06);
        return (
          <g key={i} transform={`translate(0,${off})`}>
            <rect x={i * w - 1} y={-40} width={w + 2} height={H + 80} fill={c} />
            <rect x={i * w + w / 2 - 3} y={-40} width={6} height={H + 80} fill={KIN} opacity={0.5} />
          </g>
        );
      })}
    </g>
  );
};

/** 忍冬唐草（飛鳥の寺の文様）の金の小片がゆっくり舞う（聖徳太子回） */
const Palmettes: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 8 }, (_, i) => {
      const speed = 0.35 + random(`pm${i}`) * 0.5;
      const y = ((random(`pmy${i}`) * (H + 300) + f * speed) % (H + 300)) - 150;
      const x = random(`pmx${i}`) * W + Math.sin(f * 0.02 + i * 2.1) * 50;
      const flip = Math.cos(f * 0.04 + i * 1.3);
      return (
        <g key={i} transform={`translate(${x},${y}) rotate(${Math.sin(f * 0.03 + i) * 30 + i * 45}) scale(${(0.5 + Math.abs(flip) * 0.5) * (0.8 + random(`pms${i}`) * 0.5)},1)`} opacity={0.6}>
          {/* 三つ葉の忍冬（パルメット）と巻きひげ */}
          <path d="M0,10 Q-4,-14 0,-30 Q4,-14 0,10Z" fill={KIN} />
          <path d="M0,10 Q-20,-4 -24,-20 Q-8,-10 0,10Z" fill={KIN} />
          <path d="M0,10 Q20,-4 24,-20 Q8,-10 0,10Z" fill={KIN} />
          <path d="M0,10 Q-6,22 6,26 Q16,26 12,16" fill="none" stroke={KIN} strokeWidth={3} />
        </g>
      );
    })}
  </g>
);

/** 冒頭：紺の幕に光背（舟形の光）の形の窓が開いて広がる（聖徳太子回） */
const HaloIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 16, Easing.in(Easing.quad));
  if (t >= 1) return null;
  const k = 0.02 + t * 2.6;
  const cx = W / 2;
  const cy = H * 0.52;
  // 舟形光背（下が丸く、上がとがる）
  const hx = 420 * k;
  const hy = 620 * k;
  const halo = `M${cx},${cy - hy} C${cx + hx * 0.55},${cy - hy * 0.55} ${cx + hx},${cy - hy * 0.1} ${cx + hx},${cy + hy * 0.3} C${cx + hx},${cy + hy * 0.75} ${cx + hx * 0.5},${cy + hy * 0.62} ${cx},${cy + hy * 0.62} C${cx - hx * 0.5},${cy + hy * 0.62} ${cx - hx},${cy + hy * 0.75} ${cx - hx},${cy + hy * 0.3} C${cx - hx},${cy - hy * 0.1} ${cx - hx * 0.55},${cy - hy * 0.55} ${cx},${cy - hy}Z`;
  return (
    <g>
      <path d={`M-10,-10 H${W + 10} V${H + 10} H-10Z ${halo}`} fill="#1F2B4A" fillRule="evenodd" />
      <path d={halo} fill="none" stroke={KIN} strokeWidth={14} />
      <path d={halo} fill="none" stroke={KIN} strokeWidth={4} transform={`translate(${cx},${cy}) scale(1.06) translate(${-cx},${-cy})`} opacity={0.6} />
    </g>
  );
};

/** 切り絵の雲（丸みの連なり）。x,y は左端、w は幅 */
export const CloudShape: React.FC<{ x: number; y: number; w: number; color?: string; opacity?: number }> = ({ x, y, w, color = "#F4EEE0", opacity = 1 }) => {
  const r = w / 5;
  return (
    <g opacity={opacity} filter="url(#paperLow)">
      <path
        d={`M${x},${y} a${r * 0.8},${r * 0.8} 0 0 1 ${r * 1.2},${-r * 0.6} a${r},${r} 0 0 1 ${r * 1.6},${-r * 0.5} a${r * 0.9},${r * 0.9} 0 0 1 ${r * 1.4},${r * 0.4} a${r * 0.7},${r * 0.7} 0 0 1 ${r * 0.8},${r * 0.7}Z`}
        fill={color}
      />
      <path d={`M${x + r * 0.6},${y - r * 0.15} q${w * 0.4},${-r * 0.2} ${w * 0.8},0`} fill="none" stroke="#C9BFA8" strokeWidth={3} />
    </g>
  );
};

/** 八雲：小さな雲がゆっくり横に流れる（出雲回：「八雲立つ出雲」にちなむ） */
const Yakumo: React.FC<{ f: number }> = ({ f }) => (
  <g opacity={0.5}>
    {Array.from({ length: 6 }, (_, i) => {
      const speed = 0.3 + random(`yk${i}`) * 0.5;
      const w = 120 + random(`ykw${i}`) * 120;
      const x = ((random(`ykx${i}`) * (W + 400) + f * speed) % (W + 400)) - 300;
      const y = 260 + random(`yky${i}`) * (H - 500);
      return <CloudShape key={i} x={x} y={y} w={w} />;
    })}
  </g>
);

/** 冒頭：左右から雲が湧いて画面を覆い、流れ去って次の場面が現れる（出雲回） */
const CloudIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 16, Easing.in(Easing.quad));
  if (t >= 1) return null;
  const rows = 9;
  return (
    <g>
      {Array.from({ length: rows }, (_, i) => {
        const y = (i + 0.5) * (H / rows) + 60;
        const dir = i % 2 ? 1 : -1;
        const off = dir * t * (W + 600);
        return (
          <g key={i} transform={`translate(${off},0)`}>
            <rect x={-200} y={y - H / rows - 40} width={W + 400} height={H / rows + 80} fill="#F1EBDC" />
            <CloudShape x={-120} y={y + 40} w={700} color="#F7F2E6" />
            <CloudShape x={420} y={y + 30} w={760} color="#EDE5D2" />
          </g>
        );
      })}
    </g>
  );
};

/** 湖のさざ波：あちこちで淡い波紋が広がって消える（継体回：近江の湖にちなむ） */
const Ripples: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 7 }, (_, i) => {
      const period = 120 + Math.floor(random(`rp${i}`) * 80);
      const ph = (f + i * 37) % period;
      const cycle = Math.floor((f + i * 37) / period);
      const x = random(`rx${i}-${cycle}`) * W;
      const y = 200 + random(`ry${i}-${cycle}`) * (H - 400);
      const t = ph / period;
      return (
        <g key={i} opacity={0.35 * Math.sin(t * Math.PI)}>
          {[0, 1, 2].map((k) => (
            <ellipse key={k} cx={x} cy={y} rx={(20 + t * 120) * (1 - k * 0.25)} ry={(8 + t * 40) * (1 - k * 0.25)} fill="none" stroke="#6E8FA8" strokeWidth={2.5} />
          ))}
        </g>
      );
    })}
  </g>
);

/** 冒頭：襖（ふすま）が中央から左右へ開き、次の場面が現れる（継体回） */
const FusumaIn: React.FC<{ f: number }> = ({ f }) => {
  const t = ramp(f, 0, 16, Easing.inOut(Easing.cubic));
  if (t >= 1) return null;
  const half = W / 2;
  const off = t * (half + 40);
  const panel = (x: number, key: string) => (
    <g key={key} transform={`translate(${x},0)`}>
      <g filter="url(#paper)">
        <rect x={0} y={0} width={half} height={H} fill="#E9DFC8" />
      </g>
      <rect x={0} y={0} width={half} height={H} fill="none" stroke="#3B2A18" strokeWidth={18} />
      {/* 襖絵：遠山と金の雲 */}
      <path d={`M0,1300 Q${half * 0.3},1100 ${half * 0.55},1220 Q${half * 0.8},1080 ${half},1180 L${half},1500 L0,1500Z`} fill="#8E9A78" opacity={0.6} />
      <rect x={40} y={420} width={half - 80} height={40} rx={20} fill={KIN} opacity={0.55} />
      <rect x={90} y={500} width={half - 200} height={28} rx={14} fill={KIN} opacity={0.4} />
      {/* 引手 */}
      <circle cx={x < half ? half - 50 : 50} cy={H / 2} r={22} fill="#3B2A18" />
      <circle cx={x < half ? half - 50 : 50} cy={H / 2} r={12} fill={KIN} />
    </g>
  );
  return <g>{[panel(-off, "l"), panel(half + off, "r")]}</g>;
};

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

/**
 * 背景用の小道具（第5弾）。線は INK・塗りは BG だけで描く（キャラ以外に色を増やさない）。
 * x は左端、床に置くものは FLOOR_Y に接地。壁に掛けるものは y が上端。
 * f（フレーム）を受け取るものは、時計の秒針・湯気・電車の景色などが動く。
 */
import React from "react";
import { random } from "remotion";
import { BG, FLOOR_Y, FONT, INK, PROP_LINE } from "./theme";

const S = {
  fill: BG,
  stroke: INK,
  strokeWidth: PROP_LINE,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};
const Ln: React.FC<{ x1: number; y1: number; x2: number; y2: number; w?: number; o?: number }> = ({ x1, y1, x2, y2, w = PROP_LINE, o = 1 }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={w} strokeLinecap="round" opacity={o} />
);

/** 壁掛け時計。time は "17:59" の形。秒針が動く */
export const WallClock: React.FC<{ x: number; y?: number; time?: string; f?: number; r?: number }> = ({ x, y = 690, time = "10:10", f = 0, r = 58 }) => {
  const [h, m] = time.split(":").map(Number);
  const cx = x + r;
  const cy = y + r;
  const hand = (deg: number, len: number, w: number) => (
    <Ln x1={cx} y1={cy} x2={cx + Math.sin((deg * Math.PI) / 180) * len} y2={cy - Math.cos((deg * Math.PI) / 180) * len} w={w} />
  );
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} {...S} />
      {[0, 90, 180, 270].map((a) => (
        <Ln key={a} x1={cx + Math.sin((a * Math.PI) / 180) * (r - 14)} y1={cy - Math.cos((a * Math.PI) / 180) * (r - 14)} x2={cx + Math.sin((a * Math.PI) / 180) * (r - 6)} y2={cy - Math.cos((a * Math.PI) / 180) * (r - 6)} w={4} />
      ))}
      {hand(((h % 12) + m / 60) * 30, r * 0.5, 7)}
      {hand(m * 6, r * 0.75, 5)}
      {hand(Math.floor(f / 30) * 6, r * 0.8, 2)}
    </g>
  );
};

/** 窓（十字の枠）。curtain でカーテン付き */
export const Window: React.FC<{ x: number; y?: number; width?: number; height?: number; curtain?: boolean }> = ({ x, y = 660, width = 260, height = 230, curtain = false }) => (
  <g>
    <rect x={x} y={y} width={width} height={height} {...S} />
    <Ln x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} w={5} />
    <Ln x1={x} y1={y + height / 2} x2={x + width} y2={y + height / 2} w={5} />
    {/* 光の反射 */}
    <Ln x1={x + 24} y1={y + 70} x2={x + 60} y2={y + 30} w={4} o={0.5} />
    {curtain ? (
      <g>
        <Ln x1={x - 30} y1={y - 14} x2={x + width + 30} y2={y - 14} />
        {[x - 30, x + width - 40].map((cx, i) => (
          <path key={i} d={`M ${cx} ${y - 14} L ${cx + 70} ${y - 14} Q ${cx + 50} ${y + height / 2} ${cx + 70} ${y + height + 30} L ${cx} ${y + height + 30} Z`} {...S} />
        ))}
      </g>
    ) : null}
  </g>
);

/** ホワイトボード（脚付き）。text で板書を入れられる */
export const Whiteboard: React.FC<{ x: number; width?: number; text?: string }> = ({ x, width = 400, text }) => {
  const top = FLOOR_Y - 560;
  const h = 250;
  return (
    <g>
      <Ln x1={x + 40} y1={top + h} x2={x + 30} y2={FLOOR_Y} />
      <Ln x1={x + width - 40} y1={top + h} x2={x + width - 30} y2={FLOOR_Y} />
      <rect x={x} y={top} width={width} height={h} rx={6} {...S} />
      <Ln x1={x + 20} y1={top + h + 14} x2={x + width - 20} y2={top + h + 14} w={6} />
      {text ? (
        <text x={x + width / 2} y={top + h / 2 + 22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={Math.min(64, (width - 40) / Math.max(1, [...text].length))} fill={INK}>
          {text}
        </text>
      ) : (
        <g>
          {[0, 1, 2].map((i) => (
            <Ln key={i} x1={x + 40} y1={top + 60 + i * 60} x2={x + 40 + [260, 190, 230][i] * (width / 400)} y2={top + 60 + i * 60} w={5} o={0.7} />
          ))}
        </g>
      )}
    </g>
  );
};

/** 会議机（長机）。モニターなし */
export const MeetingTable: React.FC<{ x: number; width?: number }> = ({ x, width = 560 }) => {
  const top = FLOOR_Y - 180;
  return (
    <g>
      <rect x={x} y={top} width={width} height={20} rx={5} {...S} />
      <Ln x1={x + 40} y1={top + 20} x2={x + 40} y2={FLOOR_Y} />
      <Ln x1={x + width - 40} y1={top + 20} x2={x + width - 40} y2={FLOOR_Y} />
      <Ln x1={x + 40} y1={FLOOR_Y - 60} x2={x + width - 40} y2={FLOOR_Y - 60} w={5} />
    </g>
  );
};

/** ドア */
export const Door: React.FC<{ x: number; open?: number }> = ({ x, open = 0 }) => {
  const w = 210;
  const top = FLOOR_Y - 430;
  const ow = w * (1 - Math.min(1, Math.max(0, open)) * 0.8);
  return (
    <g>
      <rect x={x - 10} y={top - 10} width={w + 20} height={440} fill="none" stroke={INK} strokeWidth={PROP_LINE} strokeLinejoin="round" />
      <rect x={x} y={top} width={ow} height={430} {...S} />
      <circle cx={x + ow - 30} cy={top + 230} r={10} {...S} strokeWidth={5} />
    </g>
  );
};

/** 商品棚（コンビニ）。3段に商品が並ぶ */
export const StoreShelf: React.FC<{ x: number; width?: number }> = ({ x, width = 360 }) => {
  const top = FLOOR_Y - 520;
  const levels = [FLOOR_Y - 380, FLOOR_Y - 230, FLOOR_Y - 80];
  return (
    <g>
      <rect x={x} y={top} width={width} height={520} {...S} />
      {levels.map((ly, li) => {
        const items: React.ReactNode[] = [];
        let ix = x + 16;
        let k = 0;
        while (ix < x + width - 40) {
          const w = 28 + random(`shelf-w-${x}-${li}-${k}`) * 26;
          const h = 50 + random(`shelf-h-${x}-${li}-${k}`) * 60;
          items.push(<rect key={k} x={ix} y={ly - h} width={w} height={h} rx={4} {...S} strokeWidth={4} />);
          ix += w + 8;
          k++;
        }
        return (
          <g key={li}>
            {items}
            <Ln x1={x} y1={ly} x2={x + width} y2={ly} />
          </g>
        );
      })}
    </g>
  );
};

/** レジカウンター（レジ付き） */
export const Register: React.FC<{ x: number; width?: number }> = ({ x, width = 340 }) => {
  const top = FLOOR_Y - 200;
  return (
    <g>
      <rect x={x} y={top} width={width} height={200} {...S} />
      <Ln x1={x - 10} y1={top} x2={x + width + 10} y2={top} w={PROP_LINE + 3} />
      {/* レジ本体 */}
      <path d={`M ${x + width - 150} ${top} L ${x + width - 140} ${top - 70} L ${x + width - 40} ${top - 70} L ${x + width - 30} ${top} Z`} {...S} />
      <rect x={x + width - 125} y={top - 120} width={70} height={45} rx={4} {...S} />
    </g>
  );
};

/** ソファ（右向きに座る用）。座面の高さは椅子とほぼ同じ */
export const Sofa: React.FC<{ x: number; width?: number }> = ({ x, width = 420 }) => {
  const seat = FLOOR_Y - 120;
  return (
    <g>
      <rect x={x} y={seat - 190} width={width} height={120} rx={30} {...S} />
      <rect x={x} y={seat} width={width} height={90} rx={14} {...S} />
      <rect x={x - 30} y={seat - 70} width={60} height={160} rx={22} {...S} />
      <rect x={x + width - 30} y={seat - 70} width={60} height={160} rx={22} {...S} />
      <Ln x1={x + 20} y1={seat + 90} x2={x + 20} y2={FLOOR_Y} />
      <Ln x1={x + width - 20} y1={seat + 90} x2={x + width - 20} y2={FLOOR_Y} />
    </g>
  );
};

/** テレビ（台付き） */
export const TV: React.FC<{ x: number; on?: boolean; f?: number }> = ({ x, on = false, f = 0 }) => {
  const standTop = FLOOR_Y - 150;
  return (
    <g>
      <rect x={x} y={standTop} width={300} height={150} {...S} />
      <Ln x1={x + 150} y1={standTop} x2={x + 150} y2={standTop + 150} w={5} />
      <rect x={x + 125} y={standTop - 30} width={50} height={30} {...S} />
      <rect x={x + 10} y={standTop - 230} width={280} height={190} rx={8} {...S} />
      {on
        ? [0, 1, 2, 3].map((i) => (
            <Ln key={i} x1={x + 35} y1={standTop - 200 + i * 40 + ((f * 3) % 40)} x2={x + 265} y2={standTop - 200 + i * 40 + ((f * 3) % 40)} w={3} o={0.4} />
          ))
        : null}
    </g>
  );
};

/** ベッド（頭側が左） */
export const Bed: React.FC<{ x: number; width?: number }> = ({ x, width = 560 }) => {
  const top = FLOOR_Y - 150;
  return (
    <g>
      <rect x={x} y={FLOOR_Y - 300} width={30} height={300} rx={6} {...S} />
      <rect x={x + 30} y={top} width={width - 30} height={90} rx={8} {...S} />
      <rect x={x + 45} y={top - 40} width={120} height={44} rx={20} {...S} />
      <path d={`M ${x + 180} ${top} Q ${x + 200} ${top - 30} ${x + 260} ${top - 26} L ${x + width} ${top - 20} L ${x + width} ${top + 60} L ${x + 180} ${top + 60} Z`} {...S} />
      <Ln x1={x + width - 15} y1={top + 90} x2={x + width - 15} y2={FLOOR_Y} />
    </g>
  );
};

/** 自動販売機 */
export const Vending: React.FC<{ x: number }> = ({ x }) => {
  const top = FLOOR_Y - 600;
  return (
    <g>
      <rect x={x} y={top} width={300} height={600} rx={8} {...S} />
      <rect x={x + 25} y={top + 30} width={250} height={250} {...S} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect key={`${r}-${c}`} x={x + 40 + c * 47} y={top + 55 + r * 75} width={28} height={50} rx={8} {...S} strokeWidth={4} />
        )),
      )}
      <rect x={x + 200} y={top + 320} width={60} height={110} rx={4} {...S} strokeWidth={5} />
      <rect x={x + 40} y={top + 480} width={220} height={70} rx={6} {...S} />
    </g>
  );
};

/** 観葉植物 */
export const Plant: React.FC<{ x: number }> = ({ x }) => {
  const potTop = FLOOR_Y - 120;
  const leaves = [-60, -30, 0, 30, 60];
  return (
    <g>
      {leaves.map((a, i) => {
        const r = (a * Math.PI) / 180;
        const len = 170 - Math.abs(a);
        const tx = x + 60 + Math.sin(r) * len;
        const ty = potTop - Math.cos(r) * len;
        return <path key={i} d={`M ${x + 60} ${potTop} Q ${(x + 60 + tx) / 2 - 30 * Math.sign(a || 1)} ${(potTop + ty) / 2} ${tx} ${ty} Q ${(x + 60 + tx) / 2 + 30 * Math.sign(a || 1)} ${(potTop + ty) / 2} ${x + 60} ${potTop} Z`} {...S} strokeWidth={5} />;
      })}
      <path d={`M ${x} ${potTop} L ${x + 120} ${potTop} L ${x + 100} ${FLOOR_Y} L ${x + 20} ${FLOOR_Y} Z`} {...S} />
    </g>
  );
};

/** ゴミ箱 */
export const TrashCan: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <path d={`M ${x} ${FLOOR_Y - 120} L ${x + 90} ${FLOOR_Y - 120} L ${x + 78} ${FLOOR_Y} L ${x + 12} ${FLOOR_Y} Z`} {...S} />
    <Ln x1={x + 30} y1={FLOOR_Y - 95} x2={x + 34} y2={FLOOR_Y - 20} w={4} />
    <Ln x1={x + 60} y1={FLOOR_Y - 95} x2={x + 56} y2={FLOOR_Y - 20} w={4} />
  </g>
);

/** コーヒーカップ（湯気が動く）。y はカップの底（机の上なら 1310） */
export const Coffee: React.FC<{ x: number; y?: number; f?: number }> = ({ x, y = FLOOR_Y - 190, f = 0 }) => (
  <g>
    {[0, 1].map((i) => {
      const sx = x + 18 + i * 18;
      const ph = f * 0.15 + i * 2;
      return (
        <path
          key={i}
          d={`M ${sx} ${y - 62} q ${8 * Math.sin(ph)} -14 0 -28 q ${-8 * Math.sin(ph)} -14 0 -28`}
          fill="none"
          stroke={INK}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.45 + 0.25 * Math.sin(ph)}
        />
      );
    })}
    <path d={`M ${x} ${y - 55} L ${x + 60} ${y - 55} L ${x + 54} ${y} L ${x + 6} ${y} Z`} {...S} strokeWidth={5} />
    <path d={`M ${x + 58} ${y - 44} q 22 4 18 20 q -4 12 -20 10`} fill="none" stroke={INK} strokeWidth={5} />
  </g>
);

/** 書類の山。y は底（机の上なら 1310）。count で枚数（高さ） */
export const PaperStack: React.FC<{ x: number; y?: number; count?: number }> = ({ x, y = FLOOR_Y - 190, count = 6 }) => (
  <g>
    {Array.from({ length: count }).map((_, i) => (
      <rect key={i} x={x + (random(`ps-${x}-${i}`) - 0.5) * 16} y={y - (i + 1) * 16} width={120} height={16} {...S} strokeWidth={4} />
    ))}
  </g>
);

/** 段ボール箱 */
export const Cardboard: React.FC<{ x: number; y?: number; width?: number }> = ({ x, y = FLOOR_Y, width = 180 }) => {
  const h = width * 0.7;
  return (
    <g>
      <rect x={x} y={y - h} width={width} height={h} {...S} />
      <Ln x1={x} y1={y - h + 30} x2={x + width} y2={y - h + 30} w={4} />
      <Ln x1={x + width / 2} y1={y - h} x2={x + width / 2} y2={y - h + 30} w={4} />
    </g>
  );
};

/** 電柱 */
export const Pole: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <rect x={x} y={FLOOR_Y - 900} width={34} height={900} {...S} />
    <Ln x1={x - 50} y1={FLOOR_Y - 840} x2={x + 84} y2={FLOOR_Y - 840} />
    <Ln x1={x - 1000} y1={FLOOR_Y - 820} x2={x + 2000} y2={FLOOR_Y - 800} w={3} o={0.6} />
  </g>
);

/** 木 */
export const Tree: React.FC<{ x: number; f?: number }> = ({ x, f = 0 }) => {
  const sway = Math.sin(f * 0.06) * 4;
  return (
    <g>
      <rect x={x + 70} y={FLOOR_Y - 300} width={40} height={300} {...S} />
      <g transform={`rotate(${sway * 0.4} ${x + 90} ${FLOOR_Y - 300})`}>
        <circle cx={x + 90} cy={FLOOR_Y - 420} r={130} {...S} />
        <circle cx={x + 30} cy={FLOOR_Y - 360} r={70} {...S} />
        <circle cx={x + 160} cy={FLOOR_Y - 370} r={75} {...S} />
      </g>
    </g>
  );
};

/** 吊り革（電車）。x から間隔 gap で count 本 */
export const Straps: React.FC<{ x: number; count?: number; gap?: number; f?: number }> = ({ x, count = 6, gap = 180, f = 0 }) => (
  <g>
    <Ln x1={x - 60} y1={740} x2={x + gap * (count - 1) + 60} y2={740} w={9} />
    {Array.from({ length: count }).map((_, i) => {
      const sx = x + i * gap;
      const sw = Math.sin(f * 0.12 + i * 0.7) * 3;
      return (
        <g key={i} transform={`rotate(${sw} ${sx} 740)`}>
          <Ln x1={sx} y1={740} x2={sx} y2={830} w={6} />
          <path d={`M ${sx - 24} 830 L ${sx + 24} 830 L ${sx + 22} 860 Q ${sx} 890 ${sx - 22} 860 Z`} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);

import React from "react";
import type { Pose } from "./pose";
import { SIT_TABLE, STAND } from "./pose";
import { solve, StickFigure, STAND_HIP_Y_OFFSET, StickFigureProps } from "./StickFigure";
import { BG, FLOOR_Y, INK, PROP_LINE } from "./theme";
import { Floor } from "./props";

/*
 * 第3話で追加：「いつもの店」一式（シリーズ資産）
 * 背景・席・構図は固定。以後の回も ShopScene と SHOP の座標をそのまま使う。
 *   左の席 = 主人公（右向き）／右の席 = 友達（左向き）／店員は右奥ののれんから出てくる
 */

const stroke = {
  fill: BG,
  stroke: INK,
  strokeWidth: PROP_LINE,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

const TABLE_TOP = FLOOR_Y - 202;
export const SHOP = {
  beamY: 700, // 天井の梁
  tableX1: 330,
  tableX2: 690,
  tableTop: TABLE_TOP,
  heroChairX: 160, // 椅子の座面左端（右向き）
  friendChairX: 860, // 椅子の座面右端（左向き）
  heroSeat: { ...SIT_TABLE, x: 220, y: 1361 } as Pose,
  friendSeat: { ...SIT_TABLE, x: 800, y: 1361 } as Pose,
  staffSpot: 560, // 店員が注文を取る位置（卓の奥）
  staffStand: { ...STAND, x: 560, y: FLOOR_Y - STAND_HIP_Y_OFFSET } as Pose,
  norenX: 880, // 厨房ののれん（右上）
  heroMug: 445,
  friendMug: 575,
};

/** のれん（3枚・裾が揺れる）。sway は -1〜1 */
export const Noren: React.FC<{ x: number; y: number; w?: number; h?: number; sway?: number; part?: number }> = ({
  x,
  y,
  w = 220,
  h = 230,
  sway = 0,
  part = 0,
}) => {
  const pw = w / 3;
  return (
    <g>
      <line x1={x - 14} x2={x + w + 14} y1={y} y2={y} stroke={INK} strokeWidth={PROP_LINE + 3} strokeLinecap="round" />
      {[0, 1, 2].map((i) => {
        const x0 = x + i * pw + 4;
        const x1 = x0 + pw - 8;
        // 真ん中ほど店員がくぐると大きく開く
        const open = part * (i === 1 ? 1 : 0.55) * (i === 0 ? -1 : 1);
        const dx = sway * 12 * (0.6 + i * 0.2) + open * 60;
        return (
          <path
            key={i}
            d={`M ${x0} ${y} L ${x1} ${y} L ${x1 + dx} ${y + h} L ${x0 + dx} ${y + h} Z`}
            {...stroke}
            strokeWidth={6}
          />
        );
      })}
      {/* 白抜きの丸紋（文字は入れない） */}
      <circle cx={x + w / 2 + sway * 6} cy={y + h * 0.5} r={26} fill="none" stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** 壁の品書き札（文字の代わりに短い線） */
const MenuTags: React.FC<{ x: number; y: number; n?: number }> = ({ x, y, n = 7 }) => (
  <g>
    <line x1={x - 20} x2={x + n * 66} y1={y} y2={y} stroke={INK} strokeWidth={5} />
    {Array.from({ length: n }).map((_, i) => {
      const tx = x + i * 66;
      const len = 60 + ((i * 37) % 5) * 10;
      return (
        <g key={i}>
          <rect x={tx} y={y + 8} width={48} height={150} rx={4} {...stroke} strokeWidth={5} />
          <line x1={tx + 24} x2={tx + 24} y1={y + 30} y2={y + 30 + len} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    })}
  </g>
);

/** 提灯 */
const Lantern: React.FC<{ x: number; y: number; swing?: number }> = ({ x, y, swing = 0 }) => (
  <g transform={`rotate(${swing} ${x} ${y})`}>
    <line x1={x} y1={y} x2={x} y2={y + 30} stroke={INK} strokeWidth={5} />
    <rect x={x - 26} y={y + 28} width={52} height={14} rx={3} {...stroke} strokeWidth={5} />
    <ellipse cx={x} cy={y + 110} rx={58} ry={70} {...stroke} />
    {[-40, 0, 40].map((d) => (
      <path key={d} d={`M ${x - 56} ${y + 110 + d} Q ${x} ${y + 120 + d} ${x + 56} ${y + 110 + d}`} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
    ))}
    <rect x={x - 26} y={y + 176} width={52} height={14} rx={3} {...stroke} strokeWidth={5} />
  </g>
);

/** テーブルの上のペンダントライト */
const PendantLamp: React.FC<{ x: number; y: number; len: number }> = ({ x, y, len }) => (
  <g>
    <line x1={x} y1={y} x2={x} y2={y + len} stroke={INK} strokeWidth={4} />
    <path d={`M ${x - 70} ${y + len + 55} Q ${x} ${y + len - 15} ${x + 70} ${y + len + 55} Z`} {...stroke} />
  </g>
);

/** 背景（壁・梁・品書き・提灯・のれん・照明・床）。テーブルと椅子は別 */
export const ShopBackdrop: React.FC<{ frame: number; norenPart?: number }> = ({ frame, norenPart = 0 }) => (
  <g>
    <line x1={-20} x2={1100} y1={SHOP.beamY} y2={SHOP.beamY} stroke={INK} strokeWidth={PROP_LINE + 3} />
    <line x1={-20} x2={1100} y1={SHOP.beamY + 22} y2={SHOP.beamY + 22} stroke={INK} strokeWidth={4} />
    <MenuTags x={250} y={SHOP.beamY + 60} />
    <Lantern x={120} y={SHOP.beamY + 22} swing={Math.sin(frame * 0.07) * 3} />
    <PendantLamp x={(SHOP.tableX1 + SHOP.tableX2) / 2} y={SHOP.beamY + 22} len={180} />
    <Noren x={SHOP.norenX} y={SHOP.beamY + 22} sway={Math.sin(frame * 0.09)} part={norenPart} />
    {/* 厨房の入口の柱 */}
    <line x1={SHOP.norenX - 20} x2={SHOP.norenX - 20} y1={SHOP.beamY + 22} y2={FLOOR_Y} stroke={INK} strokeWidth={5} opacity={0.5} />
    <Floor />
  </g>
);

/** 卓（横から見た天板＋脚）。天板の上に物を置くときは SHOP.tableTop を使う */
export const ShopTable: React.FC = () => (
  <g>
    <rect x={SHOP.tableX1} y={SHOP.tableTop} width={SHOP.tableX2 - SHOP.tableX1} height={24} rx={5} {...stroke} />
    <line x1={(SHOP.tableX1 + SHOP.tableX2) / 2} y1={SHOP.tableTop + 24} x2={(SHOP.tableX1 + SHOP.tableX2) / 2} y2={FLOOR_Y - 14} stroke={INK} strokeWidth={PROP_LINE + 3} />
    <line x1={(SHOP.tableX1 + SHOP.tableX2) / 2 - 90} x2={(SHOP.tableX1 + SHOP.tableX2) / 2 + 90} y1={FLOOR_Y - 8} y2={FLOOR_Y - 8} stroke={INK} strokeWidth={PROP_LINE + 3} strokeLinecap="round" />
  </g>
);

/** 店の椅子（丸椅子＋低い背もたれ）。facing=1 は右向きに座る（背もたれが左） */
export const ShopChair: React.FC<{ x: number; facing?: 1 | -1 }> = ({ x, facing = 1 }) => {
  const seat = FLOOR_Y - 128;
  const sx = (v: number) => x + facing * v;
  return (
    <g>
      <line x1={sx(4)} y1={seat} x2={sx(-4)} y2={seat - 120} stroke={INK} strokeWidth={PROP_LINE} strokeLinecap="round" />
      <line x1={sx(0)} y1={seat} x2={sx(110)} y2={seat} stroke={INK} strokeWidth={PROP_LINE + 2} strokeLinecap="round" />
      <line x1={sx(14)} y1={seat} x2={sx(6)} y2={FLOOR_Y} stroke={INK} strokeWidth={PROP_LINE} />
      <line x1={sx(96)} y1={seat} x2={sx(104)} y2={FLOOR_Y} stroke={INK} strokeWidth={PROP_LINE} />
      <line x1={sx(18)} y1={seat + 70} x2={sx(92)} y2={seat + 70} stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** ジョッキ（x は中心、y は底） */
export const Mug: React.FC<{ x: number; y: number; rotate?: number; flip?: boolean }> = ({ x, y, rotate = 0, flip = false }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${flip ? -1 : 1} 1)`}>
    <rect x={-24} y={-78} width={48} height={78} rx={6} {...stroke} strokeWidth={6} />
    <path d="M 24 -60 Q 48 -60 48 -38 Q 48 -18 24 -18" fill="none" stroke={INK} strokeWidth={6} />
    {/* 泡 */}
    <path d="M -28 -76 Q -20 -96 -6 -86 Q 4 -100 16 -86 Q 30 -94 28 -76 Z" {...stroke} strokeWidth={5} />
  </g>
);

/** 立てたメニュー（閉じたまま） */
export const MenuStand: React.FC<{ x: number; y: number; tilt?: number }> = ({ x, y, tilt = 0 }) => (
  <g transform={`rotate(${tilt} ${x} ${y})`}>
    <path d={`M ${x - 30} ${y} L ${x - 16} ${y - 110} L ${x + 16} ${y - 110} L ${x + 30} ${y} Z`} {...stroke} strokeWidth={5} />
    <line x1={x - 6} x2={x + 6} y1={y - 70} y2={y - 70} stroke={INK} strokeWidth={4} />
  </g>
);

/** 小皿（枝豆） */
export const SmallPlate: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <ellipse cx={x} cy={y - 10} rx={56} ry={12} {...stroke} strokeWidth={5} />
    {[-28, -6, 16].map((d, i) => (
      <ellipse key={d} cx={x + d} cy={y - 26 + (i % 2) * 4} rx={16} ry={8} transform={`rotate(${i * 25 - 20} ${x + d} ${y - 26})`} {...stroke} strokeWidth={4} />
    ))}
  </g>
);

/** 店員（主人公と同じ黒の線＋前掛けとはちまき）。色を増やさず見分けられるようにする */
export const ShopStaff: React.FC<Omit<StickFigureProps, "color" | "tie"> & { facing?: 1 | -1 }> = (props) => {
  const { pose, facing = 1, scale = 1 } = props;
  const j = solve(pose, facing, scale);
  const rad = (d: number) => (d * Math.PI) / 180;
  // 胴体方向（下向き）と直交方向
  const dx = -facing * Math.sin(rad(pose.torso));
  const dy = Math.cos(rad(pose.torso));
  const px = -dy;
  const py = dx;
  const at = (base: [number, number], along: number, side: number) =>
    `${base[0] + (dx * along + px * side) * scale},${base[1] + (dy * along + py * side) * scale}`;
  const [hx, hy] = j.head;
  const r = 44 * scale;
  return (
    <g>
      <StickFigure {...props} facing={facing} color={INK} />
      {/* 前掛け（腰から膝上まで） */}
      <polygon
        points={[at(j.hip, -38, -30), at(j.hip, -38, 30), at(j.hip, 80, 40), at(j.hip, 80, -40)].join(" ")}
        fill={BG}
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <line x1={j.hip[0] - 34 * scale} x2={j.hip[0] + 34 * scale} y1={j.hip[1] - 38 * scale} y2={j.hip[1] - 38 * scale} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {/* はちまき（頭に帯＋後ろに結び目の端） */}
      <line x1={hx - r * 0.98} x2={hx + r * 0.98} y1={hy - r * 0.32} y2={hy - r * 0.32} stroke={INK} strokeWidth={13 * scale} strokeLinecap="round" />
      <path
        d={`M ${hx - facing * r} ${hy - r * 0.32} l ${-facing * 30 * scale} ${-14 * scale} M ${hx - facing * r} ${hy - r * 0.32} l ${-facing * 26 * scale} ${18 * scale}`}
        stroke={INK}
        strokeWidth={8 * scale}
        strokeLinecap="round"
      />
    </g>
  );
};

/** 店の背景＋卓＋椅子をまとめた固定構図（人物は各場面で描く） */
export const ShopScene: React.FC<{ frame: number; norenPart?: number }> = ({ frame, norenPart }) => (
  <g>
    <ShopBackdrop frame={frame} norenPart={norenPart} />
    <ShopChair x={SHOP.heroChairX} facing={1} />
    <ShopChair x={SHOP.friendChairX} facing={-1} />
  </g>
);

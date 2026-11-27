import React from "react";
import { BG, INK } from "./theme";

// 第4話で追加：財布（開く・逆さにする・膨らむ・しぼむ）と小銭

const P = 120; // 片側パネルの幅
const H = 92; // 高さ

/** 小銭（中央に穴のない硬貨。縁の線だけ） */
export const Coin: React.FC<{ x: number; y: number; r?: number; rotate?: number }> = ({ x, y, r = 17, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <circle r={r} fill={BG} stroke={INK} strokeWidth={5} />
    <circle r={r * 0.55} fill="none" stroke={INK} strokeWidth={3} opacity={0.6} />
  </g>
);

/** 膨らみ b（-1〜1）に応じた角丸の輪郭。b>0 で外へ膨らみ、b<0 で内へへこむ */
const outline = (x0: number, x1: number, y0: number, y1: number, b: number): string => {
  const bb = b * 16;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return `M ${x0} ${y0} Q ${mx} ${y0 - bb} ${x1} ${y0} Q ${x1 + bb * 0.6 * Math.sign(x1 - x0)} ${my} ${x1} ${y1} Q ${mx} ${y1 + bb} ${x0} ${y1} Q ${x0 - bb * 0.6 * Math.sign(x1 - x0)} ${my} ${x0} ${y0} Z`;
};

/** お札（パネル上端からはみ出す） */
const Bills: React.FC<{ x0: number; n: number; y0: number }> = ({ x0, n, y0 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => (
      <g key={i} transform={`rotate(${(i - (n - 1) / 2) * 7} ${x0 + P / 2} ${y0 + 30})`}>
        <rect x={x0 + 14 + i * 4} y={y0 - 34 - (i % 2) * 8} width={P - 28} height={60} rx={4} fill={BG} stroke={INK} strokeWidth={5} />
        <circle cx={x0 + P / 2 + i * 4} cy={y0 - 10 - (i % 2) * 8} r={9} fill="none" stroke={INK} strokeWidth={3} />
      </g>
    ))}
  </g>
);

export type WalletProps = {
  x: number; // 蝶番（中央）の位置
  y: number;
  /** 0=閉じている、1=開いて中が見えている */
  open?: number;
  rotate?: number;
  scale?: number;
  /** 膨らみ：1=パンパン、0=ふつう、-1=ぺしゃんこ */
  bulge?: number;
  /** 小銭の枚数（開いているときに見える） */
  coins?: number;
};

/** 二つ折り財布（正面から見た図） */
export const Wallet: React.FC<WalletProps> = ({ x, y, open = 0, rotate = 0, scale = 1, bulge = 0, coins = 3 }) => {
  const sx = 1 - 2 * open; // 左パネルの折り返し（1=閉じて右パネルに重なる、-1=左に開く）
  const sy = 1 + bulge * 0.16;
  const y0 = -H / 2;
  const y1 = H / 2;
  const bills = bulge > 0.15 ? Math.round(bulge * 5) : 0;
  const wrinkles = bulge < -0.2;
  const stroke = { stroke: INK, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale} ${scale * sy})`}>
      {/* 右パネル（内側：カード段と小銭入れ） */}
      {open > 0.02 ? (
        <g>
          <path d={outline(0, P, y0, y1, bulge)} fill={BG} {...stroke} />
          {[0, 1].map((i) => (
            <line key={i} x1={12} x2={P - 12} y1={y0 + 16 + i * 14} y2={y0 + 16 + i * 14} stroke={INK} strokeWidth={4} />
          ))}
          <path d={`M 10 ${y0 + 44} L ${P - 10} ${y0 + 44} L ${P - 14} ${y1 - 8} L 14 ${y1 - 8} Z`} fill={BG} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {Array.from({ length: coins }).map((_, i) => (
            <Coin key={i} x={30 + i * 30} y={y1 - 26 - (i % 2) * 6} r={14} />
          ))}
        </g>
      ) : null}
      {/* 左パネル（閉じているときは外側、開くと内側の札入れ） */}
      <g transform={`scale(${sx === 0 ? 0.001 : sx} 1)`}>
        {sx < 0 && bills > 0 ? <Bills x0={0} n={bills} y0={y0} /> : null}
        <path d={outline(0, P, y0, y1, bulge)} fill={BG} {...stroke} />
        {sx >= 0 ? (
          // 外側：ステッチ
          <path d={`M 10 ${y0 + 10} L ${P - 10} ${y0 + 10} L ${P - 10} ${y1 - 10} L 10 ${y1 - 10} Z`} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="8 7" opacity={0.6} />
        ) : (
          <line x1={10} x2={P - 10} y1={y0 + 20} y2={y0 + 20} stroke={INK} strokeWidth={4} />
        )}
      </g>
      {/* 閉じていてパンパンなら上からお札がはみ出す */}
      {sx >= 0 && bills > 0 ? (
        <g>
          <Bills x0={0} n={Math.min(3, bills)} y0={y0 + 10} />
          <path d={outline(0, P, y0, y1, bulge)} fill={BG} {...stroke} />
          <path d={`M 10 ${y0 + 10} L ${P - 10} ${y0 + 10} L ${P - 10} ${y1 - 10} L 10 ${y1 - 10} Z`} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="8 7" opacity={0.6} />
        </g>
      ) : null}
      {/* 蝶番 */}
      <line x1={0} x2={0} y1={y0} y2={y1} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      {/* しぼんだしわ */}
      {wrinkles ? (
        <g stroke={INK} strokeWidth={3} fill="none" opacity={0.7}>
          <path d={`M ${P * 0.2} ${y0 + 20} q 10 14 0 28`} />
          <path d={`M ${P * 0.7} ${y0 + 30} q -10 14 0 30`} />
          {sx < 0 ? <path d={`M ${-P * 0.4} ${y0 + 24} q 10 14 0 28`} /> : null}
        </g>
      ) : null}
    </g>
  );
};

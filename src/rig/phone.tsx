import React from "react";
import { BG, FONT, FRIEND_BLUE, INK, PROP_LINE } from "./theme";

// 第3話で追加：スマホ（大きな画面パネル／手持ちの小さなスマホ）とグループ作成画面

export type ScreenRect = { x: number; y: number; w: number; h: number };

/** 画面パネルの寸法から、画面（表示領域）の矩形を返す */
export const phoneScreen = (x: number, y: number, w: number, h: number): ScreenRect => {
  const m = w * 0.045;
  return { x: x + m, y: y + m * 2.4, w: w - m * 2, h: h - m * 4.2 };
};

/** 大きなスマホ画面。children は画面の中に切り抜いて描く。dim で画面を暗くする（0〜1） */
export const PhoneFrame: React.FC<{
  id: string; // clipPath 用の一意な名前
  x: number;
  y: number;
  w: number;
  h: number;
  dim?: number;
  children?: (screen: ScreenRect) => React.ReactNode;
}> = ({ id, x, y, w, h, dim = 0, children }) => {
  const s = phoneScreen(x, y, w, h);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={w * 0.11} fill={BG} stroke={INK} strokeWidth={PROP_LINE + 3} />
      <defs>
        <clipPath id={id}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={w * 0.04} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={BG} />
        {children ? children(s) : null}
        {dim > 0 ? <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={INK} opacity={dim} /> : null}
      </g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={w * 0.04} fill="none" stroke={INK} strokeWidth={4} />
      {/* 上部のスピーカーと下のホームバー */}
      <rect x={x + w / 2 - w * 0.09} y={y + (s.y - y) / 2 - 6} width={w * 0.18} height={12} rx={6} fill={INK} />
      <rect x={x + w / 2 - w * 0.14} y={y + h - (y + h - s.y - s.h) / 2 - 4} width={w * 0.28} height={8} rx={4} fill={INK} />
    </g>
  );
};

/** 手に持つ小さなスマホ（中心 x,y、角度 rotate） */
export const HandPhone: React.FC<{ x: number; y: number; rotate?: number; dim?: number }> = ({
  x,
  y,
  rotate = 0,
  dim = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <rect x={-26} y={-44} width={52} height={88} rx={10} fill={BG} stroke={INK} strokeWidth={6} />
    <rect x={-17} y={-32} width={34} height={60} rx={4} fill={INK} opacity={0.12 + dim * 0.8} />
  </g>
);

/** 手持ちスマホから大きな画面パネルへの吹き出しのしっぽ（2本の線） */
export const PhoneCallout: React.FC<{ from: [number, number]; toL: [number, number]; toR: [number, number]; opacity?: number }> = ({
  from,
  toL,
  toR,
  opacity = 1,
}) => (
  <path
    d={`M ${toL[0]} ${toL[1]} L ${from[0]} ${from[1]} L ${toR[0]} ${toR[1]}`}
    fill={BG}
    stroke={INK}
    strokeWidth={5}
    strokeLinejoin="round"
    strokeDasharray="2 16"
    strokeLinecap="round"
    opacity={opacity}
  />
);

/** 友達のアイコン（青い丸の中に棒人間の胸像） */
export const FriendIcon: React.FC<{ x: number; y: number; r?: number; pop?: number }> = ({
  x,
  y,
  r = 60,
  pop = 1,
}) => {
  if (pop <= 0) return null;
  const k = r / 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${pop})`}>
      <circle r={r} fill={BG} stroke={FRIEND_BLUE} strokeWidth={7} />
      <circle cy={-14 * k} r={17 * k} fill={BG} stroke={FRIEND_BLUE} strokeWidth={6 * k} />
      <path
        d={`M ${-30 * k} ${44 * k} Q ${-28 * k} ${12 * k} 0 ${10 * k} Q ${28 * k} ${12 * k} ${30 * k} ${44 * k}`}
        fill="none"
        stroke={FRIEND_BLUE}
        strokeWidth={6 * k}
        strokeLinecap="round"
      />
    </g>
  );
};

/**
 * グループ作成直後のトーク画面。
 * icons: 3人分の出現度（0〜1）、notice: 「グループを作成しました」の出現度、cursor: 入力欄のカーソル表示
 */
export const GroupCreatedScreen: React.FC<{
  s: ScreenRect;
  icons: [number, number, number];
  notice: number;
  cursor: boolean;
}> = ({ s, icons, notice, cursor }) => {
  const headH = s.h * 0.1;
  const cx = s.x + s.w / 2;
  const iconY = s.y + headH + s.h * 0.17;
  const gap = s.w * 0.27;
  const noticeY = iconY + s.h * 0.2;
  const inputY = s.y + s.h - s.h * 0.1;
  return (
    <g>
      {/* ヘッダー（戻る矢印と人数の丸だけ。文字は入れない） */}
      <line x1={s.x} x2={s.x + s.w} y1={s.y + headH} y2={s.y + headH} stroke={INK} strokeWidth={4} />
      <path
        d={`M ${s.x + 44} ${s.y + headH / 2 - 16} L ${s.x + 28} ${s.y + headH / 2} L ${s.x + 44} ${s.y + headH / 2 + 16}`}
        fill="none"
        stroke={INK}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={cx - 34 + i * 34} cy={s.y + headH / 2} r={18} fill={BG} stroke={FRIEND_BLUE} strokeWidth={5} opacity={icons[i] > 0.5 ? 1 : 0} />
      ))}
      {/* 友達3人のアイコン */}
      {[0, 1, 2].map((i) => (
        <FriendIcon key={i} x={cx + (i - 1) * gap} y={iconY} r={s.w * 0.1} pop={icons[i]} />
      ))}
      {/* 「グループを作成しました」 */}
      {notice > 0 ? (
        <g opacity={notice} transform={`translate(0 ${(1 - notice) * 20})`}>
          <rect x={cx - s.w * 0.4} y={noticeY - 44} width={s.w * 0.8} height={76} rx={38} fill={BG} stroke={INK} strokeWidth={5} />
          <text x={cx} y={noticeY + 10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={s.w * 0.064} fill={INK}>
            グループを作成しました
          </text>
        </g>
      ) : null}
      {/* 入力欄（何も打たれない） */}
      <line x1={s.x} x2={s.x + s.w} y1={inputY - s.h * 0.06} y2={inputY - s.h * 0.06} stroke={INK} strokeWidth={4} />
      <rect x={s.x + 30} y={inputY - 34} width={s.w - 140} height={60} rx={30} fill={BG} stroke={INK} strokeWidth={4} />
      {cursor ? <line x1={s.x + 64} x2={s.x + 64} y1={inputY - 20} y2={inputY + 12} stroke={INK} strokeWidth={5} /> : null}
      <path
        d={`M ${s.x + s.w - 86} ${inputY - 24} L ${s.x + s.w - 40} ${inputY - 4} L ${s.x + s.w - 86} ${inputY + 16} L ${s.x + s.w - 76} ${inputY - 4} Z`}
        fill={BG}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </g>
  );
};

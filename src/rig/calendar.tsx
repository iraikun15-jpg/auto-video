import React from "react";
import { random } from "remotion";
import { BG, FONT, INK } from "./theme";

// 第3話で追加：めくれるカレンダー（季節アイコンつき）。線画＋差し色1色のみ

export type Season = "spring" | "summer" | "autumn" | "winter";

/** 月（1〜12）から季節を返す */
export const seasonOf = (month: number): Season =>
  month >= 3 && month <= 5
    ? "spring"
    : month >= 6 && month <= 8
      ? "summer"
      : month >= 9 && month <= 11
        ? "autumn"
        : "winter";

/** 季節アイコン（桜・太陽・もみじ・雪）。中心 x,y、大きさ size */
export const SeasonIcon: React.FC<{
  season: Season;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  color?: string;
  opacity?: number;
}> = ({ season, x, y, size = 60, rotate = 0, color = INK, opacity = 1 }) => {
  const s = size / 60;
  const common = {
    stroke: color,
    strokeWidth: 5 / s,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  let body: React.ReactNode;
  if (season === "spring") {
    // 桜：先が割れた花びら5枚
    const petal = "M 0 0 C -14 -10 -16 -26 -7 -34 L 0 -28 L 7 -34 C 16 -26 14 -10 0 0 Z";
    body = (
      <g fill={BG} {...common}>
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d={petal} transform={`rotate(${a})`} />
        ))}
        <circle r={5} fill={color} stroke="none" />
      </g>
    );
  } else if (season === "summer") {
    body = (
      <g {...common} fill={BG}>
        <circle r={15} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const t = (a * Math.PI) / 180;
          return <line key={a} x1={Math.cos(t) * 22} y1={Math.sin(t) * 22} x2={Math.cos(t) * 32} y2={Math.sin(t) * 32} />;
        })}
      </g>
    );
  } else if (season === "autumn") {
    // もみじ：7つの尖り
    const pts: string[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 30 : 13;
      pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
    }
    body = (
      <g {...common} fill={BG}>
        <polygon points={pts.join(" ")} />
        <line x1={0} y1={4} x2={4} y2={34} />
      </g>
    );
  } else {
    body = (
      <g {...common} fill="none">
        {[0, 60, 120].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <line x1={0} y1={-32} x2={0} y2={32} />
            <path d="M -9 -24 L 0 -15 L 9 -24 M -9 24 L 0 15 L 9 24" />
          </g>
        ))}
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`} opacity={opacity}>
      {body}
    </g>
  );
};

export type CalendarPageProps = {
  x: number; // 左上
  y: number;
  w: number;
  h: number;
  /** 見出し（"4月" など）。big を指定すると中央に大きな文字だけを描く（「来年」用） */
  label?: string;
  big?: string;
  bigColor?: string;
  season?: Season;
  /** 日付マスに付ける×印の割合（0〜1）。決定的に並ぶ */
  busy?: number;
  /** 裏面（めくれて裏返った状態） */
  back?: boolean;
  markColor?: string;
};

/** カレンダーの1ページ（リングは別部品 CalendarRings） */
export const CalendarPage: React.FC<CalendarPageProps> = ({
  x,
  y,
  w,
  h,
  label,
  big,
  bigColor = INK,
  season,
  busy = 0.85,
  back = false,
  markColor = INK,
}) => {
  const head = h * 0.2;
  const pad = w * 0.07;
  const cols = 7;
  const rows = 5;
  const gw = (w - pad * 2) / cols;
  const gy0 = y + head + h * 0.08;
  const gh = (h - head - h * 0.08 - pad) / rows;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={BG} stroke={INK} strokeWidth={7} />
      {back ? (
        // 裏面：薄い斜線だけ
        <g stroke={INK} strokeWidth={3} opacity={0.25}>
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={x + pad} x2={x + w - pad} y1={y + h * t} y2={y + h * t} />
          ))}
        </g>
      ) : big ? (
        <text
          x={x + w / 2}
          y={y + h / 2 + w * 0.12}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={w * 0.34}
          fill={bigColor}
        >
          {big}
        </text>
      ) : (
        <g>
          <line x1={x} x2={x + w} y1={y + head} y2={y + head} stroke={INK} strokeWidth={6} />
          <text
            x={x + pad}
            y={y + head * 0.74}
            fontFamily={FONT}
            fontWeight={900}
            fontSize={head * 0.62}
            fill={INK}
          >
            {label}
          </text>
          {season ? <SeasonIcon season={season} x={x + w - pad - head * 0.36} y={y + head * 0.52} size={head * 0.62} /> : null}
          {Array.from({ length: rows * cols }).map((_, i) => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const cx = x + pad + gw * (c + 0.5);
            const cy = gy0 + gh * (r + 0.5);
            // 決定的な「埋まり具合」
            const filled = random(`cal-${label}-${i}`) < busy;
            const m = Math.min(gw, gh) * 0.24;
            return (
              <g key={i}>
                <rect x={cx - gw * 0.42} y={cy - gh * 0.42} width={gw * 0.84} height={gh * 0.84} rx={6} fill="none" stroke={INK} strokeWidth={3} opacity={0.35} />
                {filled ? (
                  <path
                    d={`M ${cx - m} ${cy - m} L ${cx + m} ${cy + m} M ${cx + m} ${cy - m} L ${cx - m} ${cy + m}`}
                    stroke={markColor}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

/** ページ上端のリング */
export const CalendarRings: React.FC<{ x: number; y: number; w: number; count?: number }> = ({
  x,
  y,
  w,
  count = 6,
}) => (
  <g>
    {Array.from({ length: count }).map((_, i) => {
      const cx = x + (w * (i + 0.5)) / count;
      return (
        <rect key={i} x={cx - 9} y={y - 26} width={18} height={46} rx={9} fill={BG} stroke={INK} strokeWidth={6} />
      );
    })}
  </g>
);

/**
 * めくれる途中のページ。t=0で平ら、t=1で上へ裏返って消える。
 * 上端（リング位置）を軸に縦方向に潰して表→裏を描く（ズームは使わない）
 */
export const FlippingPage: React.FC<CalendarPageProps & { t: number }> = ({ t, ...page }) => {
  if (t <= 0) return <CalendarPage {...page} />;
  if (t >= 1) return null;
  const sy = Math.cos(t * Math.PI);
  const isBack = sy < 0;
  return (
    <g
      transform={`translate(0 ${page.y}) scale(1 ${sy === 0 ? 0.001 : sy}) translate(0 ${-page.y})`}
      opacity={isBack ? 1 - (t - 0.5) * 1.6 : 1}
    >
      <CalendarPage {...page} back={isBack} />
    </g>
  );
};

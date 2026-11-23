import React from "react";
import type { Pose } from "./pose";
import { BG, BOSS_RED, INK, LINE } from "./theme";

// 体の寸法（第1話の棒人間に合わせた比率）
export const HEAD_R = 44;
export const TORSO = 170;
export const UPPER_ARM = 105;
export const FOREARM = 100;
export const THIGH = 125;
export const SHIN = 125;
export const STAND_HIP_Y_OFFSET = THIGH + SHIN + LINE / 2; // 床から腰までの高さ

const rad = (d: number) => (d * Math.PI) / 180;

export type Joints = {
  hip: [number, number];
  neck: [number, number];
  shoulder: [number, number];
  chest: [number, number];
  head: [number, number];
  backElbow: [number, number];
  backHand: [number, number];
  frontElbow: [number, number];
  frontHand: [number, number];
  backKnee: [number, number];
  backFoot: [number, number];
  frontKnee: [number, number];
  frontFoot: [number, number];
};

/** 順運動学：ポーズから各関節の座標を求める。facing=1で右向き、-1で左向き */
export const solve = (p: Pose, facing: 1 | -1 = 1, scale = 1): Joints => {
  const limb = (
    from: [number, number],
    angle: number,
    len: number,
  ): [number, number] => [
    from[0] + facing * Math.sin(rad(angle)) * len * scale,
    from[1] + Math.cos(rad(angle)) * len * scale,
  ];
  const up = (
    from: [number, number],
    angle: number,
    len: number,
  ): [number, number] => [
    from[0] + facing * Math.sin(rad(angle)) * len * scale,
    from[1] - Math.cos(rad(angle)) * len * scale,
  ];
  const hip: [number, number] = [p.x, p.y];
  const neck = up(hip, p.torso, TORSO);
  const shoulder = up(hip, p.torso, TORSO * 0.86);
  const chest = up(hip, p.torso, TORSO * 0.62);
  const head = up(neck, p.torso + p.head, HEAD_R + 2);
  const backElbow = limb(shoulder, p.backArm, UPPER_ARM);
  const frontElbow = limb(shoulder, p.frontArm, UPPER_ARM);
  const backKnee = limb(hip, p.backThigh, THIGH);
  const frontKnee = limb(hip, p.frontThigh, THIGH);
  return {
    hip,
    neck,
    shoulder,
    chest,
    head,
    backElbow,
    backHand: limb(backElbow, p.backArm + p.backFore, FOREARM),
    frontElbow,
    frontHand: limb(frontElbow, p.frontArm + p.frontFore, FOREARM),
    backKnee,
    backFoot: limb(backKnee, p.backThigh + p.backShin, SHIN),
    frontKnee,
    frontFoot: limb(frontKnee, p.frontThigh + p.frontShin, SHIN),
  };
};

const Seg: React.FC<{
  a: [number, number];
  b: [number, number];
  c?: [number, number];
  color: string;
  w: number;
}> = ({ a, b, c, color, w }) => (
  <polyline
    points={[a, b, ...(c ? [c] : [])].map((q) => q.join(",")).join(" ")}
    fill="none"
    stroke={color}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

/** ネクタイ（上司の固定パーツ）。首元から胴体に沿って描く */
const Tie: React.FC<{ j: Joints; p: Pose; facing: 1 | -1; color: string; scale: number }> = ({
  j,
  p,
  facing,
  color,
  scale,
}) => {
  const [nx, ny] = j.neck;
  // 胴体方向の単位ベクトル（下向き）と、それに直交するベクトル
  const dx = -facing * Math.sin(rad(p.torso));
  const dy = Math.cos(rad(p.torso));
  const px = -dy;
  const py = dx;
  const at = (along: number, side: number): string =>
    `${nx + (dx * along + px * side) * scale},${ny + (dy * along + py * side) * scale}`;
  return (
    <g fill={color} stroke={color} strokeLinejoin="round" strokeWidth={3}>
      {/* 結び目 */}
      <polygon points={[at(4, -13), at(4, 13), at(24, 8), at(24, -8)].join(" ")} />
      {/* 剣先 */}
      <polygon
        points={[at(24, -8), at(24, 8), at(92, 17), at(112, 0), at(92, -17)].join(" ")}
      />
    </g>
  );
};

export type StickFigureProps = {
  pose: Pose;
  facing?: 1 | -1;
  color?: string;
  scale?: number;
  tie?: boolean; // 上司用
  opacity?: number;
  lineWidth?: number;
  /** 頭の中を塗るか（影キャラはfalse） */
  headFill?: string;
  silhouette?: boolean; // 影表現：頭も塗りつぶす
};

/** シリーズ共通の棒人間リグ */
export const StickFigure: React.FC<StickFigureProps> = ({
  pose,
  facing = 1,
  color = INK,
  scale = 1,
  tie = false,
  opacity = 1,
  lineWidth = LINE,
  headFill = BG,
  silhouette = false,
}) => {
  const j = solve(pose, facing, scale);
  const w = lineWidth * scale;
  return (
    <g opacity={opacity}>
      {/* 奥側の手足 */}
      <Seg a={j.shoulder} b={j.backElbow} c={j.backHand} color={color} w={w} />
      <Seg a={j.hip} b={j.backKnee} c={j.backFoot} color={color} w={w} />
      {/* 胴体 */}
      <Seg a={j.hip} b={j.neck} color={color} w={w} />
      {tie ? <Tie j={j} p={pose} facing={facing} color={color} scale={scale} /> : null}
      {/* 手前側の手足 */}
      <Seg a={j.hip} b={j.frontKnee} c={j.frontFoot} color={color} w={w} />
      <Seg a={j.shoulder} b={j.frontElbow} c={j.frontHand} color={color} w={w} />
      {/* 頭 */}
      <circle
        cx={j.head[0]}
        cy={j.head[1]}
        r={HEAD_R * scale}
        fill={silhouette ? color : headFill}
        stroke={color}
        strokeWidth={w * 0.92}
      />
    </g>
  );
};

/** 上司（赤の棒人間＋ネクタイ）。シリーズ固定キャラ */
export const Boss: React.FC<Omit<StickFigureProps, "color" | "tie">> = (props) => (
  <StickFigure {...props} color={BOSS_RED} tie />
);

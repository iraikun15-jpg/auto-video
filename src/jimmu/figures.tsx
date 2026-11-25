import React from "react";
import { KIN, PAPER, SHU, SUMI } from "./theme";

// 影絵（切り絵）の人物。顔は描かず、輪郭だけで人物を表す（断定画にしない）。
// 原点は足元の中央。scale=1 で身長およそ 600px。右向きが基本、flip で左向き。

type Limb = { hipX: number; thigh: number; shin: number; w: number };

/** 太い棒（丸み付き）を from から角度 deg・長さ len で描く */
const Bar: React.FC<{ x: number; y: number; len: number; deg: number; w: number; fill: string; children?: React.ReactNode }> = ({
  x,
  y,
  len,
  deg,
  w,
  fill,
  children,
}) => (
  <g transform={`translate(${x},${y}) rotate(${deg})`}>
    <rect x={-w / 2} y={-w / 2} width={w} height={len + w / 2} rx={w / 2} fill={fill} />
    <g transform={`translate(0,${len})`}>{children}</g>
  </g>
);

export type PersonKind = "jimmu" | "nagasune" | "folk" | "itsuse";

export const Person: React.FC<{
  kind: PersonKind;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  color?: string;
  walk?: number; // 歩きの位相（ラジアン）。undefined なら直立
  stride?: number; // 歩幅（度）
  arm?: number; // 前の腕の角度（度、0=真下、正で前へ上がる）
  lean?: number; // 体の傾き（度）
  opacity?: number;
  filter?: string;
  draw?: number; // 弓を引く度合い 0〜1（神武）
  spearTilt?: number; // 矛の傾き（度、負で前へ倒す＝突き）
  fall?: number; // 倒れる度合い 0〜1（足元を支点に後ろへ）
  turn?: number; // 向き 1=そのまま、-1=反対向き（間は振り向き途中）
  kneel?: number; // ひざをつく度合い 0〜1
}> = ({
  kind, x, y, scale = 1, flip = false, color, walk, stride = 26, arm: arm0 = 45, lean = 0, opacity = 1, filter = "url(#paper)",
  draw = 0, spearTilt = 0, fall = 0, turn = 1, kneel = 0,
}) => {
  // 弓を引くときは前の腕を水平近くまで上げる
  const arm = arm0 + (80 - arm0) * draw;
  const fill = color ?? (kind === "nagasune" ? SUMI : kind === "folk" ? SUMI : SHU);
  const tall = kind === "nagasune";
  // 長髄彦は「すねが長い」ので下腿を長く
  const legs: Limb = { hipX: 0, thigh: tall ? 120 : 110, shin: tall ? 200 : 120, w: tall ? 44 : 52 };
  const hipY = -(legs.thigh + legs.shin) - 10;
  const sw = walk === undefined ? kneel * 50 : Math.sin(walk) * stride;
  const knee = walk === undefined ? kneel * 100 : Math.max(0, -Math.cos(walk)) * 30;
  const knee2 = walk === undefined ? kneel * 10 : Math.max(0, Math.cos(walk)) * 30;
  const bob = (walk === undefined ? 0 : Math.abs(Math.cos(walk)) * 8) - kneel * 120;
  const torsoH = tall ? 220 : 205;
  const shoulderY = hipY - torsoH;
  const headR = tall ? 54 : 58;

  const leg = (deg: number, kneeBend: number, key: string) => (
    <Bar key={key} x={legs.hipX} y={hipY} len={legs.thigh} deg={deg} w={legs.w} fill={fill}>
      <Bar x={0} y={0} len={legs.shin} deg={-kneeBend} w={legs.w * 0.78} fill={fill}>
        {/* 足結（ひざ下の紐） */}
        {kind !== "nagasune" ? <rect x={-legs.w * 0.5} y={-legs.shin + 18} width={legs.w} height={12} fill={PAPER} opacity={0.5} /> : null}
        <ellipse cx={-14} cy={0} rx={36} ry={14} fill={fill} />
      </Bar>
    </Bar>
  );

  return (
    <g transform={`translate(${x},${y - bob * scale}) scale(${(flip ? -scale : scale) * turn},${scale}) rotate(${-fall * 78})`} opacity={opacity} filter={filter}>
      {/* 後ろ足 */}
      {leg(sw, knee, "b")}
      <g transform={`rotate(${lean},0,${hipY})`}>
        {/* 後ろの腕 */}
        <Bar x={-6} y={shoulderY + 20} len={120} deg={(walk === undefined ? 12 : -sw * 0.8 + 8) * (1 - draw) + 84 * draw} w={36} fill={fill}>
          <Bar x={0} y={0} len={105} deg={-18 * (1 - draw) - 150 * draw} w={30} fill={fill} />
        </Bar>
        {/* 胴（衣・よろい） */}
        {tall ? (
          <path
            d={`M-62,${shoulderY} L66,${shoulderY} L60,${hipY - 60} L96,${hipY + 30} L-92,${hipY + 30} L-58,${hipY - 60}Z`}
            fill={fill}
          />
        ) : (
          <path
            d={`M-52,${shoulderY} L58,${shoulderY} Q66,${hipY - 80} 92,${hipY + 40} L-88,${hipY + 40} Q-62,${hipY - 80} -52,${shoulderY}Z`}
            fill={fill}
          />
        )}
        {/* 帯 */}
        <rect x={-62} y={hipY - 48} width={124} height={16} fill={PAPER} opacity={0.35} />
        {/* 首と頭 */}
        <rect x={-14} y={shoulderY - 40} width={30} height={50} fill={fill} />
        <circle cx={6} cy={shoulderY - 40 - headR * 0.8} r={headR} fill={fill} />
        {/* 鼻・あご（横顔の輪郭だけ） */}
        <path d={`M${6 + headR - 6},${shoulderY - 40 - headR * 0.9} L${6 + headR + 14},${shoulderY - 40 - headR * 0.6} L${6 + headR - 4},${shoulderY - 40 - headR * 0.45}Z`} fill={fill} />
        {kind === "nagasune" ? (
          // 冠り物（とがった帽子）
          <path d={`M${-44},${shoulderY - 40 - headR * 1.2} L${60},${shoulderY - 40 - headR * 1.25} L${-10},${shoulderY - 40 - headR * 2.6}Z`} fill={fill} />
        ) : (
          <g>
            {/* みずら（耳の横で結った髪） */}
            <circle cx={-6} cy={shoulderY - 40 - headR * 0.45} r={20} fill="none" stroke={fill} strokeWidth={13} />
            <circle cx={-6} cy={shoulderY - 40 - headR * 0.05} r={15} fill="none" stroke={fill} strokeWidth={11} />
            <path d={`M${-40},${shoulderY - 40 - headR * 1.35} Q${6},${shoulderY - 40 - headR * 2.05} ${50},${shoulderY - 40 - headR * 1.4}Z`} fill={fill} />
          </g>
        )}
        {/* 腰の剣（神武） */}
        {kind === "jimmu" || kind === "itsuse" ? (
          <rect x={-150} y={hipY - 44} width={190} height={14} rx={6} fill={fill} transform={`rotate(-24,-20,${hipY - 40})`} />
        ) : null}
        {/* 番えた矢（弓を引いているときだけ） */}
        {draw > 0.25 ? (
          <g opacity={Math.min(1, (draw - 0.25) * 4)}>
            <rect x={20 - 60 * draw} y={shoulderY + 4} width={250} height={9} fill={fill} />
            <path d={`M${290 - 60 * draw},${shoulderY + 8} L${262 - 60 * draw},${shoulderY - 8} L${262 - 60 * draw},${shoulderY + 24}Z`} fill={fill} />
          </g>
        ) : null}
        {/* 前の腕＋持ち物 */}
        <Bar x={12} y={shoulderY + 22} len={118} deg={-(arm) + (walk === undefined ? 0 : sw * 0.6)} w={36} fill={fill}>
          <Bar x={0} y={0} len={100} deg={-30} w={30} fill={fill}>
            {kind === "nagasune" ? (
              // 矛（ほこ）
              <g transform={`rotate(${arm + 30 + spearTilt})`}>
                <rect x={-9} y={-470} width={18} height={720} fill={fill} />
                <path d="M0,-560 L26,-470 L-26,-470Z" fill={fill} />
              </g>
            ) : kind === "jimmu" ? (
              // 弓
              <g transform={`rotate(${arm + 30})`}>
                <path d="M-10,-300 Q120,0 -10,300" fill="none" stroke={fill} strokeWidth={20} strokeLinecap="round" />
                <path d="M-10,-300 L-10,300" stroke={fill} strokeWidth={4} />
              </g>
            ) : null}
          </Bar>
        </Bar>
      </g>
      {/* 前足 */}
      {leg(-sw, knee2, "f")}
    </g>
  );
};

/** 八咫烏（三本足の烏）。翼のはばたき flap: -1〜1 */
export const Crow: React.FC<{ x: number; y: number; scale?: number; flap?: number; flip?: boolean }> = ({ x, y, scale = 1, flap = 0, flip = false }) => {
  const up = flap * 60;
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`} filter="url(#paper)">
      {/* 奥の翼 */}
      <path d={`M-10,-10 Q-40,${-90 - up} -150,${-120 - up} Q-90,-40 -40,10Z`} fill="#3a3430" />
      {/* 体 */}
      <ellipse cx={0} cy={0} rx={78} ry={40} fill={SUMI} />
      {/* 頭とくちばし */}
      <circle cx={70} cy={-26} r={30} fill={SUMI} />
      <path d="M92,-36 L148,-20 L92,-12Z" fill={SUMI} />
      <circle cx={78} cy={-32} r={6} fill={KIN} />
      {/* 尾 */}
      <path d="M-70,-10 L-150,-30 L-140,0 L-155,20 L-70,16Z" fill={SUMI} />
      {/* 手前の翼 */}
      <path d={`M0,-12 Q-10,${-110 - up} -120,${-150 - up} Q-30,${-60 - up * 0.3} -20,22Z`} fill={SUMI} />
      {/* 三本の足 */}
      {[-14, 4, 22].map((dx, i) => (
        <path key={i} d={`M${dx},30 L${dx - 8},72 L${dx - 22},80 M${dx - 8},72 L${dx + 6},82`} stroke={SUMI} strokeWidth={7} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
};

/** 日輪（神武方の印・金の紙） */
export const Sun: React.FC<{ x: number; y: number; r: number; rot?: number; opacity?: number; color?: string }> = ({
  x,
  y,
  r,
  rot = 0,
  opacity = 1,
  color = KIN,
}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={opacity} filter="url(#paper)">
    {Array.from({ length: 16 }, (_, i) => (
      <path key={i} d={`M0,${-r * 1.08} L${r * 0.1},${-r * 1.42} L${-r * 0.1},${-r * 1.42}Z`} transform={`rotate(${i * 22.5})`} fill={color} />
    ))}
    <circle r={r} fill={color} />
  </g>
);

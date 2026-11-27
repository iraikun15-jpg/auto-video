import React from "react";
import { KIN, MURASAKI, PAPER, SHU, SUMI } from "./theme";

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

export type PersonKind = "jimmu" | "nagasune" | "folk" | "itsuse" | "takeru" | "sujin" | "susanoo" | "monk" | "yuryaku" | "himiko" | "keitai" | "keitaiKasa" | "okuninushi" | "suiko" | "shotoku";

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
  outline?: boolean; // 墨のふち取り（白い切り絵用）。ヤマトタケルは既定でオン
  outlineColor?: string; // ふち取りの色（夜の場面では金にする）
  strokeW?: number; // 内部用：ふち取りの太さ
}> = (props) => {
  const { kind, color, opacity = 1, filter = "url(#paper)" } = props;
  const outline = props.outline ?? kind === "takeru";
  if (outline) {
    // 墨で少し太らせた影を下に敷き、その上に白い切り絵を重ねる
    return (
      <g opacity={opacity} filter={filter}>
        <PersonBody {...props} color={props.outlineColor ?? SUMI} strokeW={16} />
        <PersonBody {...props} color={color} />
      </g>
    );
  }
  return (
    <g opacity={opacity} filter={filter}>
      <PersonBody {...props} />
    </g>
  );
};

const PersonBody: React.FC<React.ComponentProps<typeof Person>> = ({
  kind, x, y, scale = 1, flip = false, color, walk, stride = 26, arm: arm0 = 45, lean = 0,
  draw = 0, spearTilt = 0, fall = 0, turn = 1, kneel = 0, strokeW,
}) => {
  // 弓を引くときは前の腕を水平近くまで上げる
  const arm = arm0 + (80 - arm0) * draw;
  const fill = color ?? (kind === "nagasune" ? SUMI : kind === "folk" ? SUMI : kind === "takeru" ? PAPER : kind === "sujin" ? MURASAKI : kind === "yuryaku" ? "#5A3424" : kind === "himiko" ? "#2F5D50" : kind === "keitai" || kind === "keitaiKasa" ? "#B98A2A" : kind === "okuninushi" ? "#3F7F77" : kind === "suiko" ? "#A9465A" : kind === "shotoku" ? "#26355A" : SHU);
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
    <g
      transform={`translate(${x},${y - bob * scale}) scale(${(flip ? -scale : scale) * turn},${scale}) rotate(${-fall * 78})`}
      stroke={strokeW ? fill : undefined}
      strokeWidth={strokeW ? strokeW / scale : undefined}
      strokeLinejoin="round"
    >
      {/* 後ろ足 */}
      {kind === "shotoku" ? (
        // 裾まで届く袍（細め。脚は隠れる）
        <path d={`M-56,${hipY - 40} Q-80,${hipY + 120} -104,-4 L112,-4 Q90,${hipY + 120} 60,${hipY - 40}Z`} fill={fill} />
      ) : kind === "himiko" || kind === "suiko" ? (
        // 裾まで届く衣（脚は隠れる）
        <path d={`M-58,${hipY - 40} Q-110,${hipY + 120} -150,-4 L150,-4 Q110,${hipY + 120} 62,${hipY - 40}Z`} fill={fill} />
      ) : (
        leg(sw, knee, "b")
      )}
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
        {kind === "shotoku" ? (
          // 頭巾（後ろへ二本の纓が垂れる）。有名な肖像画の写しにはしない
          <g>
            <path d={`M${-44},${shoulderY - 40 - headR * 1.15} Q${-34},${shoulderY - 40 - headR * 2.6} ${6},${shoulderY - 40 - headR * 2.6} Q${46},${shoulderY - 40 - headR * 2.6} ${56},${shoulderY - 40 - headR * 1.15}Z`} fill={fill} />
            <rect x={-52} y={shoulderY - 40 - headR * 1.22} width={114} height={16} rx={6} fill={fill} />
            <rect x={-46} y={shoulderY - 40 - headR * 1.16} width={102} height={6} fill={KIN} opacity={0.85} />
            {[0, 1].map((k) => (
              <path key={k} d={`M${-40},${shoulderY - 40 - headR * 1.15} Q${-110 - k * 20},${shoulderY - 40 - headR * (1.0 - k * 0.2)} ${-96 - k * 30},${shoulderY - 40 - headR * (0.1 - k * 0.3)}`} fill="none" stroke={fill} strokeWidth={11} strokeLinecap="round" />
            ))}
          </g>
        ) : kind === "suiko" ? (
          // 結い上げた髪（宝髻）と金の簪、肩から流れる領巾
          <g>
            <ellipse cx={-4} cy={shoulderY - 40 - headR * 1.75} rx={40} ry={30} fill={fill} />
            <ellipse cx={-4} cy={shoulderY - 40 - headR * 2.25} rx={26} ry={22} fill={fill} />
            <path d={`M${-60},${shoulderY - 40 - headR * 2.0} L${60},${shoulderY - 40 - headR * 2.15}`} stroke={KIN} strokeWidth={7} strokeLinecap="round" />
            <circle cx={62} cy={shoulderY - 40 - headR * 2.15} r={9} fill={KIN} />
            <path d={`M${-50},${shoulderY + 10} Q${-170},${shoulderY + 120} ${-120},${shoulderY + 320} Q${-90},${shoulderY + 380} ${-150},${shoulderY + 460}`} fill="none" stroke="#E7B9C1" strokeWidth={16} strokeLinecap="round" opacity={0.9} />
          </g>
        ) : kind === "okuninushi" ? (
          // 背中の大きな袋（大国主）とみずら
          <g>
            <path d={`M${-40},${shoulderY + 10} Q${-200},${shoulderY - 60} ${-190},${shoulderY + 130} Q${-180},${shoulderY + 230} ${-60},${shoulderY + 200}Z`} fill={fill} />
            <path d={`M${-40},${shoulderY + 10} Q${-80},${shoulderY - 40} ${-120},${shoulderY - 20}`} fill="none" stroke={KIN} strokeWidth={6} />
            <circle cx={-6} cy={shoulderY - 40 - headR * 0.45} r={20} fill="none" stroke={fill} strokeWidth={13} />
            <circle cx={-6} cy={shoulderY - 40 - headR * 0.05} r={15} fill="none" stroke={fill} strokeWidth={11} />
            <path d={`M${-40},${shoulderY - 40 - headR * 1.35} Q${6},${shoulderY - 40 - headR * 2.05} ${50},${shoulderY - 40 - headR * 1.4}Z`} fill={fill} />
          </g>
        ) : kind === "keitaiKasa" ? (
          // 旅の笠（地方から来た王）
          <g>
            <path d={`M${-120},${shoulderY - 40 - headR * 1.05} Q${6},${shoulderY - 40 - headR * 2.5} ${132},${shoulderY - 40 - headR * 1.05} Q${6},${shoulderY - 40 - headR * 1.3} ${-120},${shoulderY - 40 - headR * 1.05}Z`} fill={fill} />
            <path d={`M${-90},${shoulderY - 40 - headR * 1.15} L${100},${shoulderY - 40 - headR * 1.15}`} stroke={SUMI} strokeWidth={4} opacity={0.4} />
          </g>
        ) : kind === "keitai" ? (
          // 冠（帯に低い立ち飾り）とみずら
          <g>
            <rect x={-48} y={shoulderY - 40 - headR * 1.32} width={100} height={18} rx={4} fill={fill} />
            <path d={`M${-20},${shoulderY - 40 - headR * 1.32} L${6},${shoulderY - 40 - headR * 1.9} L${32},${shoulderY - 40 - headR * 1.32}Z`} fill={fill} />
            <rect x={-48} y={shoulderY - 40 - headR * 1.24} width={100} height={5} fill={KIN} />
            <circle cx={-6} cy={shoulderY - 40 - headR * 0.4} r={18} fill="none" stroke={fill} strokeWidth={12} />
          </g>
        ) : kind === "himiko" ? (
          // 背中まで垂れる長い髪・玉飾りの髪帯・金の勾玉の首飾り
          <g>
            <path d={`M${-34},${shoulderY - 40 - headR * 1.4} Q${-110},${shoulderY - 40 - headR * 0.6} ${-96},${shoulderY + 160} L${-40},${shoulderY + 150} Q${-50},${shoulderY - 20} ${10},${shoulderY - 40 - headR * 1.6}Z`} fill={fill} />
            <rect x={-46} y={shoulderY - 40 - headR * 1.35} width={104} height={14} rx={6} fill={KIN} />
            {[-30, 0, 30].map((cx) => (
              <circle key={cx} cx={cx + 6} cy={shoulderY - 40 - headR * 1.42} r={7} fill="#7FC8B4" />
            ))}
            <path d={`M-40,${shoulderY + 8} Q6,${shoulderY + 60} 52,${shoulderY + 8}`} fill="none" stroke={KIN} strokeWidth={5} />
            {[-20, 6, 32].map((cx) => (
              <path key={cx} d={`M${cx},${shoulderY + 34} q10,-4 8,10 q-4,12 -12,4`} fill={KIN} />
            ))}
          </g>
        ) : kind === "monk" ? null : kind === "susanoo" ? (
          // 荒ぶる長い髪（後ろへなびく筋）
          <g fill="none" stroke={fill} strokeLinecap="round">
            {[0, 1, 2, 3, 4].map((k) => (
              <path
                key={k}
                d={`M${-10},${shoulderY - 40 - headR * (1.4 - k * 0.22)} Q${-90 - k * 10},${shoulderY - 40 - headR * (1.5 - k * 0.3)} ${-150 - k * 14},${shoulderY - 40 - headR * (0.9 - k * 0.32)}`}
                strokeWidth={18 - k * 2}
              />
            ))}
            <path d={`M${-36},${shoulderY - 40 - headR * 1.3} Q${6},${shoulderY - 40 - headR * 2.0} ${48},${shoulderY - 40 - headR * 1.38}`} strokeWidth={22} />
          </g>
        ) : kind === "yuryaku" ? (
          // 金銅の冠（古墳時代の大王：帯に立ち飾りが並ぶ）
          <g>
            <rect x={-56} y={shoulderY - 40 - headR * 1.3} width={116} height={22} rx={4} fill={KIN} />
            {[-44, -14, 16, 46].map((cx, k) => (
              <path key={k} d={`M${cx - 9},${shoulderY - 40 - headR * 1.3} L${cx},${shoulderY - 40 - headR * (2.05 + (k % 2) * 0.2)} L${cx + 9},${shoulderY - 40 - headR * 1.3}Z`} fill={KIN} />
            ))}
            <circle cx={2} cy={shoulderY - 40 - headR * 1.19} r={5} fill={SHU} />
          </g>
        ) : kind === "sujin" ? (
          // 冠（箱形の冠に後ろへ垂れる纓）
          <g>
            <rect x={-30} y={shoulderY - 40 - headR * 1.95} width={62} height={headR * 0.95} rx={8} fill={fill} />
            <rect x={-50} y={shoulderY - 40 - headR * 1.15} width={104} height={16} rx={6} fill={fill} />
            <path d={`M${-26},${shoulderY - 40 - headR * 1.7} Q${-80},${shoulderY - 40 - headR * 1.4} ${-70},${shoulderY - 40 - headR * 0.4}`} fill="none" stroke={fill} strokeWidth={12} strokeLinecap="round" />
            <rect x={-30} y={shoulderY - 40 - headR * 1.25} width={62} height={7} fill={KIN} opacity={0.85} />
          </g>
        ) : kind === "nagasune" ? (
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
        {kind === "shotoku" ? (
          // 腰の太刀（袍の後ろへ斜めに出る）
          <rect x={-170} y={hipY - 30} width={170} height={12} rx={5} fill={fill} transform={`rotate(-14,-20,${hipY - 30})`} />
        ) : null}
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
            ) : kind === "sujin" || kind === "shotoku" ? (
              // 笏（しゃく）
              <g transform={`rotate(${arm + 30 + spearTilt})`}>
                <rect x={-11} y={-150} width={22} height={170} rx={9} fill={fill} />
                <rect x={-11} y={-150} width={22} height={170} rx={9} fill="none" stroke={KIN} strokeWidth={3} opacity={0.7} />
              </g>
            ) : kind === "takeru" || kind === "susanoo" || kind === "yuryaku" ? (
              // 剣（spearTilt で傾ける。負で前へ振り下ろす）
              <g transform={`rotate(${arm + 30 + spearTilt})`}>
                <rect x={-26} y={-18} width={52} height={14} rx={5} fill={fill} />
                <rect x={-8} y={-4} width={16} height={60} rx={6} fill={fill} />
                <path d="M-11,-18 L-11,-300 L0,-336 L11,-300 L11,-18Z" fill={fill} />
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
      {kind === "himiko" || kind === "suiko" || kind === "shotoku" ? null : leg(-sw, knee2, "f")}
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

/** 白鳥（白い切り絵）。翼のはばたき flap: -1〜1 */
export const Swan: React.FC<{ x: number; y: number; scale?: number; flap?: number; flip?: boolean; opacity?: number }> = ({
  x,
  y,
  scale = 1,
  flap = 0,
  flip = false,
  opacity = 1,
}) => {
  const up = flap * 70;
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`} filter="url(#paper)" opacity={opacity}>
      <path d={`M-10,-10 Q-50,${-100 - up} -190,${-140 - up} Q-100,-40 -40,10Z`} fill="#E9E1CF" />
      <ellipse cx={0} cy={0} rx={88} ry={36} fill={PAPER} />
      {/* 長い首と頭 */}
      <path d="M60,-14 Q120,-40 112,-110 Q108,-130 128,-134 L134,-120 Q124,-112 128,-96 Q136,-30 74,10Z" fill={PAPER} />
      <path d="M128,-134 L168,-124 L132,-116Z" fill={KIN} />
      <path d="M-80,-6 L-140,-22 L-128,4 L-84,14Z" fill={PAPER} />
      <path d={`M0,-12 Q-14,${-130 - up} -150,${-170 - up} Q-40,${-70 - up * 0.3} -20,20Z`} fill={PAPER} />
    </g>
  );
};

/** 白い猪（伊吹山の神の使い）。白い切り絵 */
export const Boar: React.FC<{ x: number; y: number; scale?: number; flip?: boolean; opacity?: number; step?: number }> = ({
  x,
  y,
  scale = 1,
  flip = false,
  opacity = 1,
  step = 0,
}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`} filter="url(#paper)" opacity={opacity}>
    {[-70, -40, 40, 70].map((lx, i) => (
      <rect key={i} x={lx - 11} y={10} width={22} height={70} rx={8} fill={i % 2 ? "#E9E1CF" : PAPER} transform={`rotate(${Math.sin(step + i * 1.6) * 12},${lx},10)`} />
    ))}
    <ellipse cx={0} cy={0} rx={115} ry={62} fill={PAPER} />
    {/* 背中のたてがみ */}
    <path d="M-90,-40 L-60,-78 L-40,-50 L-15,-86 L5,-56 L30,-84 L50,-52 L80,-70 L95,-30Z" fill={PAPER} />
    <path d="M90,-30 L170,-6 L176,24 L100,40Z" fill={PAPER} />
    <path d="M150,18 Q176,10 168,-14" fill="none" stroke={KIN} strokeWidth={8} strokeLinecap="round" />
    <circle cx={128} cy={-6} r={6} fill={SUMI} />
    <path d="M-112,-10 Q-140,-30 -132,-50" fill="none" stroke={PAPER} strokeWidth={8} strokeLinecap="round" />
  </g>
);

/** 草薙剣（金の切り絵）。原点が柄の端、上向き */
export const Sword: React.FC<{ x: number; y: number; scale?: number; rot?: number; opacity?: number; color?: string; dashed?: boolean }> = ({
  x,
  y,
  scale = 1,
  rot = 0,
  opacity = 1,
  color = KIN,
  dashed = false,
}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`} filter={dashed ? undefined : "url(#paperLow)"} opacity={opacity}>
    {dashed ? (
      <path d="M-10,0 L-10,-60 L-34,-60 L-34,-76 L-12,-76 L-12,-300 L0,-340 L12,-300 L12,-76 L34,-76 L34,-60 L10,-60 L10,0Z" fill="none" stroke={color} strokeWidth={6} strokeDasharray="14 10" />
    ) : (
      <g fill={color}>
        <rect x={-10} y={-62} width={20} height={62} rx={6} />
        <rect x={-36} y={-78} width={72} height={18} rx={6} />
        <path d="M-12,-78 L-12,-300 L0,-340 L12,-300 L12,-78Z" />
        <rect x={-2} y={-290} width={4} height={200} fill={SUMI} opacity={0.25} />
      </g>
    )}
  </g>
);

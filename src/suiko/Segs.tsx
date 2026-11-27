import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp01, Heading, pop, ramp, Stage, Stamp, sway, Tag } from "../jimmu/paper";
import { Crow, Person, Sun } from "../jimmu/figures";
import { AI, CHANNEL, KAN_I, KIN, KOBAI, MINCHO, PAPER, PAPER_DARK, SHU, SUMI, TOKI } from "../jimmu/theme";
import { Boat, Waves } from "../kusanagi/parts";
import { CLICK_AT, HOLD, REFORMS, segFrames, SegId, SNAP_AT, STAMPS } from "./events";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
const HEAD = { bg: TOKI, color: PAPER };
const UMAKO = "#6B4E32";

/** 推古（紅梅色の女帝） */
const Suiko: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number; lean?: number }> = ({ x, y, s = 0.8, arm = 40, flip = false, opacity = 1, lean = 0 }) => (
  <Person kind="suiko" x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} lean={lean} outline outlineColor={KIN} />
);
/** 摂政・聖徳太子（墨、小さく。次回への伏線） */
const Taishi: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number }> = ({ x, y, s = 0.4, arm = 60, flip = false, opacity = 1 }) => (
  <Person kind="sujin" color={SUMI} x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} />
);
/** 大臣・蘇我馬子（茶） */
const Umako: React.FC<{ x: number; y: number; s?: number; arm?: number; flip?: boolean; opacity?: number; lean?: number }> = ({ x, y, s = 0.5, arm = 60, flip = false, opacity = 1, lean = 0 }) => (
  <Person kind="sujin" color={UMAKO} x={x} y={y} scale={s} arm={arm} flip={flip} opacity={opacity} lean={lean} />
);

/** 飛鳥の宮殿の背景（朱の柱・反った屋根・石の基壇） */
const Palace: React.FC<{ y?: number; opacity?: number }> = ({ y = 1500, opacity = 1 }) => (
  <g opacity={opacity}>
    <g filter="url(#paper)">
      <rect x={40} y={y - 40} width={1000} height={60} fill="#8C8270" />
      {[120, 330, 540, 750, 960].map((x) => (
        <rect key={x} x={x - 20} y={y - 640} width={40} height={600} fill={SHU} />
      ))}
      <rect x={60} y={y - 660} width={960} height={40} fill="#7A2418" />
      <path d={`M-40,${y - 650} Q540,${y - 760} 1120,${y - 650} L1120,${y - 700} Q540,${y - 860} -40,${y - 700}Z`} fill="#2B2216" />
    </g>
  </g>
);

/** 玉座（高御座風の台） */
const Throne: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} filter="url(#paperLow)">
    <rect x={-170} y={0} width={340} height={60} fill="#5A3B20" />
    <rect x={-140} y={-30} width={280} height={40} fill={KIN} />
    <path d="M-150,-420 L0,-500 L150,-420Z" fill="#2B2216" />
    <rect x={-150} y={-420} width={12} height={400} fill={SHU} />
    <rect x={138} y={-420} width={12} height={400} fill={SHU} />
  </g>
);

/** 書物（日本書紀・隋書）。cn で中国の書物の色 */
const Record: React.FC<{ x: number; y: number; title: string; lines: string[]; t: number; cn?: boolean }> = ({ x, y, title, lines, t, cn = false }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${0.5 + 0.5 * clamp01(t)})`} opacity={clamp01(t * 2)}>
      <g filter="url(#paper)">
        <rect x={-180} y={-250} width={360} height={500} rx={8} fill={cn ? "#2A3A55" : "#6B4A2A"} />
        <rect x={-160} y={-230} width={320} height={460} rx={4} fill="#EFE4CC" />
      </g>
      {lines.map((l, i) => (
        <text key={i} x={110 - i * 56} y={-180} fontFamily={MINCHO} fontWeight={800} fontSize={36} fill={SUMI} style={{ writingMode: "vertical-rl" } as React.CSSProperties}>
          {[...l].map((c, k) => (
            <tspan key={k} x={110 - i * 56} y={-170 + k * 40}>
              {c}
            </tspan>
          ))}
        </text>
      ))}
      <g transform="translate(0,-300)">
        <rect x={-130} y={-36} width={260} height={72} fill={PAPER} stroke={cn ? "#B33A2A" : SUMI} strokeWidth={4} />
        <text x={0} y={18} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={50} fill={SUMI}>
          {title}
        </text>
      </g>
    </g>
  );

// =====================================================================
// seg1 0〜3秒 フック：「実は暗殺事件から生まれた女帝」＋女帝と小さな太子
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  const slam = interpolate(f, [0, 4, 7], [1.08, 0.97, 1], { extrapolateRight: "clamp" });
  const shake = f < 12 ? Math.sin(f * 2.7) * (12 - f) * 1.2 : 0;
  const up = ramp(f, 46, 58, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} peel={false} look="suiko">
      <Palace y={1920} opacity={0.45} />
      <Sun x={540} y={1240} r={220} rot={f * 0.3} opacity={0.5} color="#E7B9C1" />
      <Suiko x={540} y={1880} s={1.0} arm={40 + sway(f, 1, 4)} />
      <Taishi x={860} y={1880} s={0.5} flip arm={70} />
      <g transform={`translate(${540 + shake},${interpolate(up, [0, 1], [640, 330])}) scale(${slam * interpolate(up, [0, 1], [1, 0.62])})`}>
        <rect x={-510} y={-270} width={1020} height={430} rx={14} fill={SUMI} opacity={0.92} />
        <rect x={-494} y={-254} width={988} height={398} rx={10} fill="none" stroke={TOKI} strokeWidth={6} />
        <text x={0} y={-80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={104} fill={PAPER}>
          実は暗殺事件から
        </text>
        <text x={0} y={80} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={116} fill="#F2A7B4">
          生まれた女帝
        </text>
      </g>
      <Stamp x={540} y={780} text="日本初の女帝" size={90} t={stampT(f, "seg1", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜11秒 即位の背景：崇峻天皇の暗殺 → 馬子に担がれて推古が即位
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const fall = ramp(f, 40, 70, Easing.in(Easing.quad));
  const dark = ramp(f, 30, 50) * (1 - ramp(f, 100, 130));
  const carry = ramp(f, 110, 170, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} look="suiko">
      <Palace y={1500} opacity={0.35} />
      <rect width={1080} height={1920} fill="#1A1020" opacity={0.35 * dark} />
      <Heading text="592年 崇峻天皇の暗殺" t={pop(f, 0, 10) * (1 - ramp(f, 100, 110))} y={200} size={70} {...HEAD} />
      <Heading text="馬子に担がれた即位" t={pop(f, 110, 10)} y={200} size={74} {...HEAD} />
      {/* 崇峻：倒れて消える */}
      <g opacity={1 - ramp(f, 90, 110)}>
        <Person kind="sujin" color="#4A4A5A" x={540} y={1300} scale={0.7} fall={fall} arm={20} />
        {f >= 36 && f < 60 ? <path d={`M300,${700} L780,${1200}`} stroke={SHU} strokeWidth={14 * (1 - ramp(f, 40, 60))} strokeLinecap="round" /> : null}
        <Tag x={540} y={500} text="崇峻天皇" size={58} t={pop(f, 8, 10)} rot={-2} bg={SUMI} color={PAPER} />
      </g>
      {/* 輿（こし）に乗って担がれる推古 */}
      {carry > 0 ? (
        <g transform={`translate(${interpolate(carry, [0, 1], [-400, 540])},0)`} opacity={ramp(f, 110, 120)}>
          <g filter="url(#paperLow)">
            <rect x={-260} y={1390} width={520} height={20} rx={8} fill="#5A3B20" />
            <rect x={-130} y={1290} width={260} height={110} fill={SHU} />
            <path d="M-160,1290 L0,1210 L160,1290Z" fill="#2B2216" />
          </g>
          <Suiko x={0} y={1300} s={0.42} arm={40} />
          {[-200, 200].map((dx, k) => (
            <Person key={k} kind="folk" color="#3a332c" x={dx} y={1700} scale={0.4} walk={f * 0.35 + k} arm={150} filter="url(#paperLow)" />
          ))}
          <Umako x={-360} y={1720} s={0.55} arm={120} />
        </g>
      ) : null}
      <Tag x={190} y={1150} text="蘇我馬子" size={54} t={pop(f, 150, 10)} rot={-3} bg={UMAKO} color={PAPER} />
      <Stamp x={540} y={1820} text="担がれた即位" size={84} t={stampT(f, "seg2", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg3 11〜19秒 実在の確かさ：日本書紀と『隋書』の両方に残る
// =====================================================================
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const link = ramp(f, 80, 130, Easing.inOut(Easing.cubic));
  return (
    <Stage f={f} look="suiko">
      <Heading text="二つの国の記録" t={pop(f, 0, 10)} y={190} size={84} {...HEAD} />
      <Record x={280} y={760} title="日本書紀" lines={["豊御食炊屋姫天皇", "即天皇位於豊浦宮"]} t={pop(f, 10, 12)} />
      <Record x={800} y={760} title="隋書" lines={["倭國", "遣使朝貢"]} t={pop(f, 30, 12)} cn />
      <Tag x={800} y={1080} text="中国の記録" size={46} t={pop(f, 46, 10)} rot={2} bg="#2A3A55" color={PAPER} />
      {/* 二つの記録を結ぶ金の線 */}
      {link > 0 ? (
        <g>
          <path d={`M280,1060 Q540,${1060 + 240 * link} ${280 + 520 * link},1060`} fill="none" stroke={KIN} strokeWidth={10} strokeDasharray="20 12" />
        </g>
      ) : null}
      <g opacity={ramp(f, 120, 136)}>
        <circle cx={540} cy={1300} r={110} fill={TOKI} filter="url(#paperLow)" />
        <text x={540} y={1290} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={PAPER}>
          推古の
        </text>
        <text x={540} y={1345} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={PAPER}>
          時代
        </text>
      </g>
      <Suiko x={540} y={1880} s={0.5} arm={50} />
      <Taishi x={720} y={1880} s={0.3} flip />
      <Stamp x={540} y={1540} text="実在は確か" size={90} t={stampT(f, "seg3", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg4 19〜27秒 実績：冠位十二階（603）・十七条憲法（604）・遣隋使（607）
// =====================================================================
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const line = ramp(f, 10, 140, Easing.inOut(Easing.quad));
  const card = (i: number, children: React.ReactNode, year: string, name: string) => {
    const t = pop(f, REFORMS[i], 12);
    if (t <= 0) return null;
    const x = 200 + i * 340;
    return (
      <g transform={`translate(${x},${880}) scale(${0.4 + 0.6 * t})`} opacity={clamp01(t * 2)}>
        <g filter="url(#paper)">
          <rect x={-150} y={-260} width={300} height={440} rx={10} fill={PAPER} />
        </g>
        <rect x={-136} y={-246} width={272} height={412} rx={6} fill="none" stroke={TOKI} strokeWidth={4} />
        <g transform="translate(0,-90)">{children}</g>
        <text x={0} y={96} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={38} fill={SUMI}>
          {name}
        </text>
        <g transform="translate(0,-300)">
          <rect x={-80} y={-34} width={160} height={68} rx={8} fill={SUMI} />
          <text x={0} y={16} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={PAPER}>
            {year}
          </text>
        </g>
      </g>
    );
  };
  return (
    <Stage f={f} look="suiko">
      <Heading text="国の形を作る改革" t={pop(f, 0, 10)} y={190} size={80} {...HEAD} />
      {/* 年表の線 */}
      <rect x={60} y={578} width={960 * line} height={10} rx={5} fill={SUMI} opacity={0.6} />
      {card(
        0,
        <g>
          {KAN_I.map((c, k) => (
            <g key={k} transform={`translate(${(k % 3) * 80 - 80},${Math.floor(k / 3) * 90 - 40})`}>
              <path d="M-30,20 L-30,-10 Q0,-40 30,-10 L30,20Z" fill={c} stroke={SUMI} strokeWidth={2} />
            </g>
          ))}
        </g>,
        "603年",
        "冠位十二階",
      )}
      {card(
        1,
        <g>
          <rect x={-100} y={-80} width={200} height={170} fill="#EFE4CC" stroke="#5A3B20" strokeWidth={4} />
          {["一", "曰", "以", "和", "為", "貴"].map((c, k) => (
            <text key={k} x={(k < 3 ? 40 : -20)} y={-40 + (k % 3) * 48} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={40} fill={SUMI}>
              {c}
            </text>
          ))}
        </g>,
        "604年",
        "十七条憲法",
      )}
      {card(
        2,
        <g>
          <g transform="translate(0,-10) scale(0.7)">
            <Boat x={0} y={0} s={1} tilt={Math.sin(f * 0.08) * 4} />
          </g>
          <path d="M-110,60 Q-55,40 0,60 Q55,80 110,60" fill="none" stroke={AI} strokeWidth={8} />
        </g>,
        "607年",
        "遣隋使",
      )}
      {/* 下段：中心にいた二人 */}
      <g opacity={ramp(f, 140, 156)}>
        <Taishi x={330} y={1840} s={0.62} arm={80} />
        <Umako x={750} y={1840} s={0.62} flip arm={70} />
        <Tag x={330} y={1260} text="摂政 聖徳太子" size={50} t={pop(f, 146, 10)} rot={-3} bg={SUMI} color={PAPER} />
        <Tag x={750} y={1260} text="大臣 蘇我馬子" size={50} t={pop(f, 152, 10)} rot={3} bg={UMAKO} color={PAPER} />
      </g>
      <Stamp x={540} y={1420} text="中心は太子と馬子？" size={70} t={stampT(f, "seg4", 0)} rot={-4} />
    </Stage>
  );
};

/** 操り糸（上の手から推古へ）。snap 0〜1 で切れて落ちる */
const Strings: React.FC<{ from: [number, number][]; to: [number, number][]; t: number; snap?: number }> = ({ from, to, t, snap = 0 }) => (
  <g>
    {from.map((a, i) => {
      const b = to[i];
      const mx = a[0] + (b[0] - a[0]) * t;
      const my = a[1] + (b[1] - a[1]) * t;
      if (snap <= 0) return <path key={i} d={`M${a[0]},${a[1]} L${mx},${my}`} stroke="#4A3A2A" strokeWidth={4} opacity={0.9} />;
      const cut = (a[1] + b[1]) / 2;
      const ux = a[0] + (b[0] - a[0]) * 0.5;
      return (
        <g key={i}>
          <path d={`M${a[0]},${a[1]} Q${ux - 20 * snap},${cut - 40 * snap} ${ux},${cut - 60 * snap}`} fill="none" stroke="#4A3A2A" strokeWidth={4} opacity={1 - snap * 0.5} />
          <path d={`M${ux},${cut + 100 * snap} Q${ux + 30 * snap},${(cut + b[1]) / 2 + 120 * snap} ${b[0]},${b[1]}`} fill="none" stroke="#4A3A2A" strokeWidth={4} opacity={1 - snap} />
        </g>
      );
    })}
  </g>
);

// =====================================================================
// seg5 27〜35秒 お飾り説：玉座の推古を、太子と馬子が操り糸で動かす？
// =====================================================================
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const str = ramp(f, 40, 90, Easing.out(Easing.cubic));
  const puppet = Math.sin(f * 0.12) * 8 * str;
  const hands: [number, number][] = [
    [300, 600],
    [380, 610],
    [700, 610],
    [780, 600],
  ];
  const pts: [number, number][] = [
    [470, 1180],
    [500, 1060],
    [580, 1060],
    [610, 1180],
  ];
  return (
    <Stage f={f} look="suiko">
      <Heading text="推古はお飾り？" t={pop(f, 0, 10)} y={190} size={84} {...HEAD} />
      <Throne x={540} y={1560} s={1.0} />
      <g transform={`rotate(${puppet * 0.3},540,1500)`}>
        <Suiko x={540} y={1540} s={0.62} arm={40 + puppet * 3} />
      </g>
      {/* 上から糸を握る太子と馬子 */}
      <g opacity={ramp(f, 20, 36)}>
        <Taishi x={340} y={640} s={0.42} arm={160} />
        <Umako x={740} y={640} s={0.48} flip arm={160} />
      </g>
      <Strings from={hands} to={pts} t={str} />
      <Tag x={540} y={1700} text="実権は太子と馬子？" size={60} t={pop(f, 100, 12)} rot={-2} bg={SUMI} color={PAPER} />
      <Stamp x={540} y={1850} text="お飾り説" size={90} t={stampT(f, "seg5", 0)} rot={-5} />
    </Stage>
  );
};

// =====================================================================
// seg6 35〜43秒 IF：ただのお飾りだったら → 36年の在位が続く理由が弱い
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const year = Math.round(interpolate(f, [30, 140], [592, 628], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const bar = ramp(f, 30, 140, Easing.linear);
  const snap = ramp(f, SNAP_AT, SNAP_AT + 20, Easing.out(Easing.cubic));
  const stand = ramp(f, SNAP_AT + 6, SNAP_AT + 30, Easing.out(Easing.back(1.4)));
  return (
    <Stage f={f} tint="#7f8a95" tintOpacity={0.22} look="suiko">
      <Stamp x={540} y={230} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="もしただのお飾りだったら" size={56} t={pop(f, 8, 10)} rot={1} />
      {/* 在位年数のバー */}
      <g transform="translate(90,600)">
        <g filter="url(#paperLow)">
          <rect x={0} y={0} width={900} height={70} rx={10} fill={PAPER} />
        </g>
        <rect x={10} y={10} width={880 * bar} height={50} rx={6} fill={TOKI} />
        <text x={0} y={130} fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={SUMI}>
          592年
        </text>
        <text x={900} y={130} textAnchor="end" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={SUMI} opacity={ramp(f, 130, 140)}>
          628年
        </text>
      </g>
      <text x={540} y={900} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={150} fill={KOBAI}>
        {year}年
      </text>
      <Tag x={540} y={1010} text="在位36年" size={64} t={pop(f, 140, 10)} rot={-2} bg={SUMI} color={PAPER} />
      {/* 操り糸が切れて、推古が自分で立つ */}
      <Strings
        from={[
          [380, 1090],
          [460, 1090],
          [620, 1090],
          [700, 1090],
        ]}
        to={[
          [470, 1500],
          [500, 1380],
          [580, 1380],
          [610, 1500],
        ]}
        t={1}
        snap={snap}
      />
      <Suiko x={540} y={1860} s={0.62} arm={40 + 80 * stand} lean={-6 * stand} />
      <Stamp x={540} y={1300} text="理由が弱い" size={90} t={stampT(f, "seg6", 1)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg7 43〜49秒 判定：実在が確かな日本初の女帝（時代を進めた中心）
// =====================================================================
const VerdictStamp: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t <= 0) return null;
  const s = interpolate(t, [0, 0.7, 1], [2.0, 0.95, 1]);
  return (
    <g transform={`translate(${x},${y}) rotate(-3) scale(${s})`} opacity={clamp01(t * 3)}>
      <rect x={-410} y={-150} width={820} height={300} rx={10} fill="none" stroke={SHU} strokeWidth={14} />
      <rect x={-390} y={-130} width={780} height={260} rx={6} fill="none" stroke={SHU} strokeWidth={5} />
      <text x={0} y={-28} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={74} fill={SHU}>
        実在が確かな
      </text>
      <text x={0} y={100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={110} fill={SHU}>
        日本初の女帝
      </text>
    </g>
  );
};
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  return (
    <Stage f={f} look="suiko">
      <Stamp x={540} y={200} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      <Sun x={540} y={640} r={170} rot={f * 0.3} opacity={0.7 * ramp(f, 6, 24)} color="#E7B9C1" />
      <Throne x={540} y={900} s={0.7} />
      <Suiko x={540} y={880} s={0.42} arm={60} />
      <Taishi x={760} y={900} s={0.24} flip />
      <Umako x={320} y={900} s={0.26} />
      <VerdictStamp x={540} y={1180} t={stampT(f, "seg7", 1)} />
      <Stamp x={930} y={1030} text="確か" size={60} t={ramp(f, STAMPS.seg7[1] + 6, STAMPS.seg7[1] + 16)} rot={12} round color={KIN} />
      <Tag x={540} y={1460} text="担がれた即位でも、時代を進めた中心" size={44} t={pop(f, 104, 12)} rot={-2} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

// =====================================================================
// seg8 49〜54秒 二択：A 自分で政治を動かした派 / B 太子と馬子のお飾り派
// =====================================================================
export const Seg8: React.FC = () => {
  const f = useSegFrame("seg8");
  const card = (x: number, letter: string, lines: string[], color: string, at: number, seed: number) => {
    const t = pop(f, at, 12);
    if (t <= 0) return null;
    const wob = f > at + 12 ? sway(f, seed, 2.2, 0.12) : 0;
    return (
      <g transform={`translate(${x},1220) rotate(${(seed === 1 ? -4 : 4) + wob}) scale(${interpolate(t, [0, 1], [0.3, 1])})`} opacity={clamp01(t * 2)}>
        <g filter="url(#paper)">
          <rect x={-235} y={-330} width={470} height={660} rx={10} fill={color} />
        </g>
        <rect x={-210} y={-305} width={420} height={610} rx={6} fill="none" stroke={PAPER} strokeWidth={5} opacity={0.75} />
        <text x={0} y={-110} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={210} fill={PAPER}>
          {letter}
        </text>
        {lines.map((l, i) => (
          <text key={i} x={0} y={40 + i * 92} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={58} fill={PAPER}>
            {l}
          </text>
        ))}
      </g>
    );
  };
  return (
    <Stage f={f} look="suiko">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} color="#E7B9C1" />
      <Suiko x={540} y={830} s={0.52} arm={60 + sway(f, 1, 6)} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} {...HEAD} />
      {card(285, "A", ["自分で", "政治を", "動かした派"], KOBAI, 12, 1)}
      {card(795, "B", ["太子と", "馬子の", "お飾り派"], AI, 22, 2)}
      <Tag x={540} y={1700} text="コメントで教えてね" size={60} t={pop(f, 40, 10)} rot={-1} />
    </Stage>
  );
};

// =====================================================================
// seg9 54〜60秒 チャンネル登録エンドカード（前作と同じ型・新チャンネル名）
// =====================================================================
export const Seg9: React.FC = () => {
  const f = useSegFrame("seg9");
  const PRESS = CLICK_AT;
  const btnIn = pop(f, 6, 12);
  const pressed = ramp(f, PRESS, PRESS + 3) - ramp(f, PRESS + 5, PRESS + 12) * 0.6;
  const bx = 540;
  const by = 1000;
  const fly = ramp(f, 14, PRESS - 4, Easing.out(Easing.cubic));
  const peck = Math.max(0, Math.sin(clamp01((f - (PRESS - 6)) / 10) * Math.PI));
  const crowX = interpolate(fly, [0, 1], [1300, bx + 300]);
  const crowY = interpolate(fly, [0, 1], [380, by - 190]) + peck * 75 - ramp(f, PRESS + 8, PRESS + 30) * 40;
  return (
    <Stage f={f} look="suiko">
      <Sun x={540} y={560} r={130} rot={f * 0.4} opacity={0.75 * ramp(f, 0, 14)} />
      <Heading text="この動画がよかったら" t={pop(f, 2, 10)} y={260} size={64} {...HEAD} />
      {btnIn > 0 ? (
        <g transform={`translate(${bx},${by + pressed * 10}) scale(${interpolate(btnIn, [0, 1], [0.3, 1]) * (1 - pressed * 0.05)})`} opacity={clamp01(btnIn * 2)}>
          <g filter={pressed > 0.5 ? "url(#paperLow)" : "url(#paper)"}>
            <rect x={-380} y={-120} width={760} height={240} rx={120} fill={SHU} />
          </g>
          <rect x={-356} y={-96} width={712} height={192} rx={96} fill="none" stroke={PAPER} strokeWidth={5} opacity={0.6} />
          <path d="M-305,-42 L-232,0 L-305,42Z" fill={PAPER} />
          <text x={72} y={30} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={84} fill={PAPER}>
            チャンネル登録
          </text>
        </g>
      ) : null}
      {f >= PRESS && f < PRESS + 16 ? (
        <g opacity={1 - ramp(f, PRESS, PRESS + 16)}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r0 = 260 + ramp(f, PRESS, PRESS + 16) * 160;
            return <rect key={i} x={-8} y={-40} width={16} height={60} fill={KIN} transform={`translate(${bx + Math.cos(a) * r0 * 1.4},${by + Math.sin(a) * r0 * 0.6}) rotate(${(a * 180) / Math.PI + 90})`} />;
          })}
        </g>
      ) : null}
      {f >= 12 ? <Crow x={crowX} y={crowY} scale={1.05} flap={f < PRESS - 4 ? Math.sin(f * 0.8) : Math.sin(f * 0.25) * 0.3} flip /> : null}
      <Stamp x={540} y={1330} text="お願いします" size={96} t={stampT(f, "seg9", 0)} rot={-4} />
      <Tag x={540} y={1560} text={CHANNEL} size={60} t={pop(f, 100, 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

export const SEGMENTS_SUIKO: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };
export { PAPER_DARK, Waves };

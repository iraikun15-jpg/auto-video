import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp01, Heading, pop, ramp, Stage, Stamp, sway, Tag } from "../jimmu/paper";
import { Crow, Person, Sun } from "../jimmu/figures";
import { AI, CHANNEL, FUJI, KIN, KON, MINCHO, PAPER, PAPER_DARK, SEPIA, SHU, SUMI } from "../jimmu/theme";
import { Boat, Waves } from "../kusanagi/parts";
import {
  BUBBLES_SEG1,
  BUBBLES_SEG5,
  BUILD_AT,
  CAPS_AT,
  CLICK_AT,
  DREAM_FADE,
  HOLD,
  LINK_AT,
  SCROLL_AT,
  segFrames,
  SegId,
  SHIP_AT,
  STAMPS,
} from "./events";
import {
  Cap,
  DreamVeil,
  haloPath,
  Horyuji,
  KAN_I_12,
  Kohai,
  Letter,
  RecordCorners,
  RecordGrid,
  Rubbing,
  Scroll,
  Taishi,
  TaishiGhost,
  TenSpeakers,
  VerdictStamp,
  VoiceArcs,
  VText,
} from "./parts";

/** 場面内のフレーム。末尾 HOLD フレームは完全に静止させる（後付けナレーション用の間） */
const useSegFrame = (id: SegId): number => Math.min(useCurrentFrame(), segFrames(id) - HOLD - 1);
const stampT = (f: number, seg: SegId, i: number) => ramp(f, STAMPS[seg][i], STAMPS[seg][i] + 10);
const HEAD = { bg: KON, color: PAPER };
const DREAM_HEAD = { bg: FUJI, color: PAPER };
const KIN_LIGHT = "#E8C77A";

// =====================================================================
// seg1 0〜3秒 フック：10人の話を一度に聞いた天才 × 「実在？」
// =====================================================================
export const Seg1: React.FC = () => {
  const f = useSegFrame("seg1");
  const slam = interpolate(f, [0, 4, 7], [1.08, 0.97, 1], { extrapolateRight: "clamp" });
  const shake = f < 12 ? Math.sin(f * 2.7) * (12 - f) * 1.2 : 0;
  return (
    <Stage f={f} peel={false} look="shotoku">
      {/* 伝説の側（夢物語っぽい藤色のもや） */}
      <DreamVeil f={f} t={0.85} id="dv1" />
      <Sun x={540} y={1260} r={190} rot={f * 0.3} opacity={0.55} color={KIN_LIGHT} />
      <VoiceArcs x={540} y={1300} f={f + 20} t={1} />
      <TenSpeakers cx={540} cy={1620} rx={440} ry={500} f={f + 1} at={BUBBLES_SEG1} s={0.26} dream bs={0.9} />
      <Taishi x={540} y={1880} s={0.95} arm={50 + sway(f, 1, 4)} />
      <g transform={`translate(${540 + shake},330) scale(${slam})`}>
        <rect x={-500} y={-190} width={1000} height={370} rx={14} fill={KON} opacity={0.94} />
        <rect x={-484} y={-174} width={968} height={338} rx={10} fill="none" stroke={KIN} strokeWidth={6} />
        <text x={0} y={-36} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={104} fill={PAPER}>
          教科書の天才、
        </text>
        <text x={0} y={110} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={104} fill={KIN_LIGHT}>
          実は矛盾だらけ？
        </text>
      </g>
      <Tag x={540} y={600} text="10人の話を一度に聞いた？" size={56} t={pop(f, -6, 8)} rot={-1.5} bg={FUJI} color={PAPER} />
      <Stamp x={540} y={800} text="実在？" size={130} t={stampT(f, "seg1", 0)} rot={-6} />
    </Stage>
  );
};

// =====================================================================
// seg2 3〜11秒 人物の紹介：本名は厩戸皇子／前回の推古朝の摂政
// =====================================================================
export const Seg2: React.FC = () => {
  const f = useSegFrame("seg2");
  const nameOut = 1 - ramp(f, 112, 126);
  const move = ramp(f, LINK_AT - 6, LINK_AT + 30, Easing.inOut(Easing.cubic));
  const cardT = pop(f, 118, 12);
  const glow = ramp(f, LINK_AT - 8, LINK_AT) * (1 - ramp(f, LINK_AT + 30, LINK_AT + 50));
  return (
    <Stage f={f} look="shotoku">
      <RecordGrid t={1} />
      <Heading text="実在した人物" t={pop(f, 0, 10) * (1 - ramp(f, 112, 120))} y={200} size={80} {...HEAD} />
      <Heading text="推古天皇の摂政" t={pop(f, 124, 10)} y={200} size={80} {...HEAD} />
      {/* 本名の札 */}
      <g opacity={nameOut}>
        <Tag x={720} y={400} text="聖徳太子は通称" size={50} t={pop(f, 10, 10)} rot={2} bg={PAPER} color={SUMI} />
        <Tag x={720} y={880} text="厩戸皇子" size={124} t={pop(f, 30, 12)} rot={-1} bg={KON} color={PAPER} vertical />
        <Tag x={720} y={1290} text="うまやどのみこ" size={40} t={pop(f, 44, 10)} rot={1} bg={PAPER} color={SUMI} />
        <Stamp x={940} y={560} text="本名" size={56} t={ramp(f, 40, 50)} rot={10} round />
      </g>
      {/* 前回（推古回）の札：玉座の推古と、そばに小さな太子 */}
      {cardT > 0 ? (
        <g transform={`translate(300,880) rotate(-3) scale(${interpolate(cardT, [0, 1], [0.4, 1])})`} opacity={clamp01(cardT * 2)}>
          <g filter="url(#paper)">
            <rect x={-230} y={-330} width={460} height={620} fill={PAPER} />
          </g>
          <rect x={-206} y={-306} width={412} height={500} fill="#E9DDC4" />
          <Sun x={-20} y={-130} r={90} color="#E7B9C1" opacity={0.8} />
          <g filter="url(#paperLow)">
            <rect x={-150} y={150} width={240} height={36} fill="#5A3B20" />
            <rect x={-130} y={132} width={200} height={24} fill={KIN} />
            <rect x={-140} y={-160} width={9} height={300} fill={SHU} />
            <rect x={61} y={-160} width={9} height={300} fill={SHU} />
            <path d="M-150,-160 L-30,-220 L80,-160Z" fill="#2B2216" />
          </g>
          <Person kind="suiko" x={-30} y={140} scale={0.42} arm={40} outline outlineColor={KIN} />
          <g opacity={1 - move}>
            <Person kind="sujin" color={SUMI} x={150} y={180} scale={0.26} arm={60} flip />
          </g>
          {glow > 0 ? <circle cx={150} cy={100} r={70 + glow * 20} fill="none" stroke={KIN} strokeWidth={8} opacity={glow} /> : null}
          <text x={0} y={252} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={44} fill={SUMI}>
            前回 推古天皇
          </text>
        </g>
      ) : null}
      {/* 太子：はじめは左に大きく、前回の札が出ると右へ移って主役に */}
      {(() => {
        const x = interpolate(move, [0, 1], [300, 790]);
        const y = interpolate(move, [0, 1], [1640, 1600]);
        const s = interpolate(move, [0, 1], [0.95, 0.85]);
        return <Taishi x={x} y={y} s={s} arm={50 + sway(f, 2, 5)} flip={move > 0.5} />;
      })()}
      {move > 0 && move < 1 ? (
        <path d={`M440,980 Q${600},${900} ${interpolate(move, [0, 1], [440, 760])},${interpolate(move, [0, 1], [980, 1080])}`} fill="none" stroke={KIN} strokeWidth={8} strokeDasharray="18 12" opacity={1 - move * 0.6} />
      ) : null}
      <Tag x={300} y={1300} text="改革を進めた実行役" size={48} t={pop(f, 160, 10)} rot={-2} bg={SUMI} color={PAPER} />
      <Stamp x={300} y={1520} text="摂政" size={110} t={stampT(f, "seg2", 0)} rot={-6} />
      <RecordCorners t={1} label="記録" />
    </Stage>
  );
};

// =====================================================================
// seg3 11〜19秒 業績：冠位十二階（才能で選ぶ）・十七条憲法（和をもって貴しとなす）
// =====================================================================
export const Seg3: React.FC = () => {
  const f = useSegFrame("seg3");
  const strike = ramp(f, 76, 90);
  return (
    <Stage f={f} look="shotoku">
      <Heading text="603年 冠位十二階" t={pop(f, 0, 10)} y={200} size={76} {...HEAD} />
      {/* 12の冠が2段に並ぶ（大＝上段、小＝下段） */}
      {KAN_I_12.map((c, i) => {
        const row = i % 2;
        const col = Math.floor(i / 2);
        const t = ramp(f, CAPS_AT + i * 4, CAPS_AT + i * 4 + 10, Easing.out(Easing.back(2)));
        if (t <= 0) return null;
        return (
          <g key={i} opacity={row ? 0.72 : 1} transform={`translate(0,${-60 * (1 - t)})`}>
            <Cap x={140 + col * 160} y={390 + row * 120} color={c} s={1.3} />
          </g>
        );
      })}
      {/* 家柄 ✕ → 才能 ○ */}
      <g>
        <Tag x={250} y={720} text="家柄" size={70} t={pop(f, 60, 10)} rot={-2} bg="#8B7E6A" color={PAPER} />
        {strike > 0 ? <path d={`M160,690 L${160 + 180 * strike},${750}`} stroke={SHU} strokeWidth={14} strokeLinecap="round" /> : null}
        <g opacity={ramp(f, 84, 92)}>
          <path d="M420,720 L600,720" stroke={SUMI} strokeWidth={10} />
          <path d="M600,694 L650,720 L600,746Z" fill={SUMI} />
        </g>
        <Tag x={820} y={720} text="才能" size={86} t={pop(f, 90, 10)} rot={2} bg={KON} color={PAPER} />
        <Tag x={820} y={830} text="で位を与える" size={42} t={pop(f, 96, 10)} rot={1} />
      </g>
      {/* 十七条憲法の巻物 */}
      <Tag x={540} y={1000} text="604年 十七条憲法" size={62} t={pop(f, SCROLL_AT - 6, 10)} rot={-1} bg={KON} color={PAPER} />
      <Scroll x={540} y={1330} open={ramp(f, SCROLL_AT, SCROLL_AT + 40, Easing.inOut(Easing.cubic))} w={860} h={420}>
        <VText x={330} y={-150} cols={["十七條憲法"]} size={52} colors={[SHU]} />
        <VText x={220} y={-150} cols={["一曰"]} size={64} />
        <VText x={90} y={-150} cols={["以和為貴"]} size={84} colors={[SUMI]} />
        <VText x={-60} y={-150} cols={["二曰"]} size={52} colors={["#8C7A5A"]} />
        <VText x={-150} y={-150} cols={["篤敬三寶"]} size={52} colors={["#8C7A5A"]} />
        <VText x={-240} y={-150} cols={["三曰"]} size={52} colors={["#8C7A5A"]} />
        <VText x={-330} y={-150} cols={["承詔必謹"]} size={52} colors={["#8C7A5A"]} />
      </Scroll>
      <Tag x={540} y={1640} text="和をもって貴しとなす" size={64} t={pop(f, 158, 12)} rot={-1.5} bg={SUMI} color={PAPER} />
      <Stamp x={540} y={1810} text="国のルール" size={88} t={stampT(f, "seg3", 0)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg4 19〜28秒 外交と建立：隋への国書「日出づる処の天子」→ 法隆寺が組み上がる
// =====================================================================
export const Seg4: React.FC = () => {
  const f = useSegFrame("seg4");
  const a = 1 - ramp(f, 124, 138);
  const b = ramp(f, 132, 146);
  const sail = ramp(f, SHIP_AT, 118, Easing.inOut(Easing.quad));
  const build = BUILD_AT.reduce((acc, at) => acc + ramp(f, at, at + 10, Easing.out(Easing.quad)), 0);
  return (
    <Stage f={f} look="shotoku">
      {/* 前半：遣隋使（右＝日の出る倭、左＝日の沈む隋）。地図コラージュ */}
      {a > 0 ? (
        <g opacity={a}>
          <Heading text="607年 遣隋使" t={pop(f, 0, 10)} y={200} size={80} {...HEAD} />
          <Letter x={540} y={640} t={pop(f, 26, 14)} hi={ramp(f, 54, 70)} s={0.95} />
          <rect x={0} y={1080} width={1080} height={420} fill={AI} />
          <rect x={0} y={1080} width={1080} height={420} fill="url(#seigaiha)" opacity={0.6} />
          {/* 左：大陸（隋）、右：島々（倭） */}
          <g filter="url(#paper)">
            <path d="M-20,1040 L250,1060 Q300,1180 250,1300 Q200,1420 260,1540 L-20,1540Z" fill={PAPER_DARK} />
            <path d="M860,1120 Q930,1080 1000,1130 Q1060,1200 1100,1180 L1100,1330 Q1000,1360 940,1300 Q880,1240 860,1120Z" fill={PAPER} />
            <path d="M900,1380 Q960,1360 1000,1410 Q980,1460 920,1450Z" fill={PAPER} />
          </g>
          <Sun x={110} y={interpolate(f, [0, 120], [990, 1040])} r={60} color="#D98A4E" opacity={0.85} />
          <Sun x={970} y={interpolate(f, [0, 120], [1040, 990])} r={60} color={KIN} />
          <Tag x={120} y={1220} text="隋" size={66} t={pop(f, 8, 10)} rot={-3} bg={SUMI} color={PAPER} />
          <Tag x={960} y={1240} text="倭" size={66} t={pop(f, 12, 10)} rot={3} bg={KON} color={PAPER} />
          <Tag x={120} y={1340} text="日の沈む処" size={30} t={pop(f, 16, 10)} rot={-2} />
          <Tag x={960} y={1360} text="日の出づる処" size={30} t={pop(f, 18, 10)} rot={2} />
          <g transform={`translate(${interpolate(sail, [0, 1], [860, 330])},1230) scale(-1,1)`}>
            <Boat x={0} y={0} s={0.7} tilt={Math.sin(f * 0.1) * 3} />
          </g>
          <Waves f={f} y={1440} color="#24405F" amp={18} />
          <Tag x={540} y={1000} text="日出づる処の天子" size={62} t={pop(f, 62, 10)} rot={-1.5} bg={SHU} color={PAPER} />
          <Tag x={540} y={1650} text="小野妹子が国書を届ける" size={46} t={pop(f, 30, 10)} rot={1} />
          <Stamp x={540} y={1820} text="対等外交" size={96} t={stampT(f, "seg4", 0)} rot={-5} />
        </g>
      ) : null}
      {/* 後半：法隆寺が組み上がる */}
      {b > 0 ? (
        <g opacity={b}>
          <Heading text="法隆寺を建てる" t={pop(f, 134, 10)} y={200} size={80} {...HEAD} />
          <Sun x={540} y={760} r={170} rot={f * 0.3} color={KIN} opacity={0.6} />
          <Horyuji x={540} y={1460} s={1.05} build={build} />
          <rect x={0} y={1460} width={1080} height={460} fill="#CBBE9F" opacity={0.5} />
          <Taishi x={150} y={1760} s={0.42} arm={70 + sway(f, 3, 6)} />
          <Tag x={540} y={1580} text="法隆寺（奈良・斑鳩）" size={60} t={pop(f, 214, 10)} rot={-1} bg={KON} color={PAPER} />
          <Stamp x={700} y={1780} text="太子が建立" size={78} t={stampT(f, "seg4", 1)} rot={-4} />
        </g>
      ) : null}
    </Stage>
  );
};

// =====================================================================
// seg5 28〜36秒 伝説の部分：豊聡耳（夢物語の画）→ 後世の伝記の話（記録の画）
// =====================================================================
/** 後世の伝記（線装本）。夢の雲がこぼれ出る */
const LaterBook: React.FC<{ x: number; y: number; t: number; f: number }> = ({ x, y, t, f }) =>
  t <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${0.5 + 0.5 * clamp01(t)})`} opacity={clamp01(t * 2)}>
      {[0, 1, 2].map((k) => (
        <circle key={k} cx={Math.sin(f * 0.05 + k * 2) * 40} cy={-300 - k * 70 - ((f * 0.8 + k * 30) % 60)} r={34 + k * 8} fill="#EFE8FA" stroke={FUJI} strokeWidth={4} opacity={0.85} />
      ))}
      <g filter="url(#paper)">
        <rect x={-170} y={-240} width={340} height={480} rx={6} fill="#4B3A66" />
      </g>
      {[-180, -60, 60, 180].map((yy) => (
        <circle key={yy} cx={-140} cy={yy} r={7} fill={PAPER} />
      ))}
      <rect x={20} y={-210} width={90} height={330} fill={PAPER} />
      <VText x={65} y={-160} cols={["太子の伝記"]} size={56} />
    </g>
  );
export const Seg5: React.FC = () => {
  const f = useSegFrame("seg5");
  const dream = ramp(f, 0, 16) * (1 - ramp(f, DREAM_FADE, DREAM_FADE + 24));
  const rec = ramp(f, DREAM_FADE + 12, DREAM_FADE + 30);
  const shrink = ramp(f, DREAM_FADE, DREAM_FADE + 14, Easing.in(Easing.quad));
  return (
    <Stage f={f} look="shotoku">
      <RecordGrid t={rec} />
      <DreamVeil f={f} t={dream} id="dv5" />
      {/* 前半：伝説（豊聡耳） */}
      {shrink < 1 ? (
        <g opacity={1 - shrink} transform={`translate(${540 - 240 * shrink},${1000 - 0 * shrink}) scale(${1 - 0.6 * shrink}) translate(-540,-1000)`}>
          <Heading text="伝説：豊聡耳" t={pop(f, 4, 10)} y={200} size={84} {...DREAM_HEAD} />
          <Tag x={540} y={360} text="10人の訴えを一度に聞き分けた" size={48} t={pop(f, 12, 10)} rot={1} bg={PAPER} color={SUMI} />
          <g transform="translate(540,1120)">
            <path d={haloPath(260, 380)} fill="#FFF6DD" opacity={0.6} />
            <path d={haloPath(260, 380)} fill="none" stroke={KIN} strokeWidth={8} opacity={0.8} />
          </g>
          <VoiceArcs x={540} y={1180} f={f} t={ramp(f, 30, 50)} />
          <TenSpeakers cx={540} cy={1560} rx={450} ry={560} f={f} at={BUBBLES_SEG5} s={0.27} dream bs={0.95} />
          <Taishi x={540} y={1760} s={0.9} arm={60 + sway(f, 1, 6)} />
        </g>
      ) : null}
      {/* 後半：後世の伝記 ⇔ 同時代の記録 */}
      {rec > 0 ? (
        <g opacity={rec}>
          <Heading text="伝説はいつ書かれた？" t={pop(f, DREAM_FADE + 16, 10)} y={200} size={76} {...HEAD} />
          <LaterBook x={290} y={830} t={pop(f, DREAM_FADE + 16, 14)} f={f} />
          <Tag x={290} y={1150} text="後世の伝記" size={54} t={pop(f, DREAM_FADE + 26, 10)} rot={-2} bg={FUJI} color={PAPER} />
          <Tag x={290} y={1250} text="太子の死から約100年後〜" size={30} t={pop(f, DREAM_FADE + 30, 10)} rot={-1} />
          <Rubbing x={790} y={760} w={340} h={400} cols={8} rows={10} t={ramp(f, DREAM_FADE + 20, DREAM_FADE + 56)} seed="s5" />
          <Tag x={790} y={1030} text="同時代の記録" size={54} t={pop(f, DREAM_FADE + 34, 10)} rot={2} bg={SEPIA} color={PAPER} />
          <g opacity={ramp(f, 150, 160)}>
            <circle cx={790} cy={1210} r={80} fill={PAPER} stroke={SUMI} strokeWidth={6} />
            <path d="M745,1165 L835,1255 M835,1165 L745,1255" stroke={SHU} strokeWidth={14} strokeLinecap="round" />
            <Tag x={790} y={1340} text="10人の話は出てこない" size={36} t={pop(f, 154, 10)} rot={1} bg={SUMI} color={PAPER} />
          </g>
          <Stamp x={540} y={1620} text="後世の作り話" size={92} t={stampT(f, "seg5", 0)} rot={-4} />
          <RecordCorners t={rec} />
        </g>
      ) : null}
    </Stage>
  );
};

// =====================================================================
// seg6 36〜44秒 IF：太子がいなかったら → 家柄から才能とルールへの切り替えが遅れる
// =====================================================================
export const Seg6: React.FC = () => {
  const f = useSegFrame("seg6");
  const fall = ramp(f, 40, 80, Easing.in(Easing.quad));
  const fast = ramp(f, 70, 130, Easing.inOut(Easing.cubic));
  const slow = ramp(f, 90, 200, Easing.out(Easing.quad));
  const x0 = 150;
  const x1 = 930;
  const markX = x0 + (x1 - x0) * 0.38 * slow;
  return (
    <Stage f={f} tint="#7f8a95" tintOpacity={0.22} look="shotoku">
      <Stamp x={540} y={220} text="IF" size={150} t={stampT(f, "seg6", 0)} rot={-6} round />
      <Tag x={540} y={420} text="もし太子がいなかったら" size={58} t={pop(f, 8, 10)} rot={1} />
      {/* 太子のいない場所と、持ち手を失った改革の旗印 */}
      <TaishiGhost x={330} y={1120} s={0.6} opacity={ramp(f, 14, 30)} />
      <g transform={`rotate(${-fall * 26},720,1120)`} opacity={ramp(f, 14, 30)}>
        <rect x={712} y={600} width={16} height={520} fill="#5A3B20" />
        <g filter="url(#paperLow)">
          <rect x={728} y={610} width={150} height={260} fill={KON} />
        </g>
        <VText x={803} y={680} cols={["改革"]} size={70} colors={[PAPER]} />
      </g>
      <Tag x={720} y={1180} text="旗印がいない" size={44} t={pop(f, 74, 10)} rot={-2} bg={SUMI} color={PAPER} />
      {/* 家柄の政治 → 才能とルールの政治 の道 */}
      <Tag x={200} y={1320} text="家柄の政治" size={46} t={pop(f, 50, 10)} rot={-2} bg="#8B7E6A" color={PAPER} />
      <Tag x={850} y={1320} text="才能とルール" size={46} t={pop(f, 56, 10)} rot={2} bg={KON} color={PAPER} />
      <g opacity={ramp(f, 56, 66)}>
        <rect x={x0} y={1424} width={x1 - x0} height={12} rx={6} fill={SUMI} opacity={0.5} />
        {/* 本来（太子がいた歴史）：点線の玉がすっと着く */}
        <circle cx={x0 + (x1 - x0) * fast} cy={1430} r={30} fill="none" stroke={KON} strokeWidth={6} strokeDasharray="10 8" opacity={0.7} />
        <Tag x={x0 + (x1 - x0) * fast} y={1510} text="実際" size={30} t={fast > 0.05 ? 1 : 0} />
        {/* IF：朱の玉はなかなか進まない */}
        <circle cx={markX} cy={1430} r={34} fill={SHU} stroke={PAPER} strokeWidth={5} />
        <Tag x={markX} y={1360} text="IF" size={30} t={ramp(f, 90, 96)} bg={SHU} color={PAPER} />
        <text x={markX + 60} y={1450} fontFamily={MINCHO} fontWeight={800} fontSize={60} fill={SUMI} opacity={ramp(f, 150, 170) * (0.5 + 0.5 * Math.sin(f * 0.2))}>
          …
        </text>
      </g>
      {/* 家柄の豪族たち（左下） */}
      <g opacity={ramp(f, 60, 76)}>
        {[0, 1, 2].map((k) => (
          <Person key={k} kind="sujin" color={["#6B4E32", "#5A5048", "#7A5A3A"][k]} x={110 + k * 110} y={1880} scale={0.3} arm={30 + k * 10} />
        ))}
      </g>
      <Stamp x={600} y={1610} text="切り替えが遅れた" size={76} t={stampT(f, "seg6", 1)} rot={-4} />
    </Stage>
  );
};

// =====================================================================
// seg7 44〜50秒 判定：人物は実在（記録）／万能像は後世作（夢）
// =====================================================================
export const Seg7: React.FC = () => {
  const f = useSegFrame("seg7");
  const panels = ramp(f, 4, 20);
  return (
    <Stage f={f} look="shotoku">
      <Stamp x={540} y={200} text="判定" size={130} t={stampT(f, "seg7", 0)} rot={-5} />
      <g opacity={panels}>
        {/* 左：記録の画（同時代の銘文と、実在の太子） */}
        <g filter="url(#paper)">
          <rect x={40} y={340} width={490} height={780} fill={PAPER} />
        </g>
        <clipPath id="s7l">
          <rect x={40} y={340} width={490} height={780} />
        </clipPath>
        <g clipPath="url(#s7l)">
          <RecordGrid t={1} />
        </g>
        <Tag x={285} y={400} text="同時代の記録" size={42} bg={SEPIA} color={PAPER} />
        <Rubbing x={285} y={620} w={300} h={300} cols={7} rows={8} t={1} hi={2} hiT={ramp(f, 20, 34)} seed="s7" />
        <Taishi x={285} y={1100} s={0.36} arm={50} />
        {/* 右：夢の画（後世が盛った万能の超人） */}
        <g filter="url(#paper)">
          <rect x={550} y={340} width={490} height={780} fill="#E6DDF5" />
        </g>
        <clipPath id="s7r">
          <rect x={550} y={340} width={490} height={780} />
        </clipPath>
        <g clipPath="url(#s7r)">
          <Sun x={795} y={820} r={120} rot={f * 0.4} color="#FFF1C8" opacity={0.9} />
          <DreamVeil f={f} t={0.9} id="dv7" />
          <TenSpeakers cx={795} cy={1040} rx={200} ry={300} f={f + 80} at={BUBBLES_SEG5} s={0.15} dream bs={0.55} />
          <Taishi x={795} y={1100} s={0.36} arm={70 + sway(f, 2, 6)} outlineColor="#FFF1C8" />
        </g>
        <Tag x={795} y={400} text="後世の伝記" size={42} bg={FUJI} color={PAPER} />
      </g>
      <VerdictStamp x={540} y={1340} t={stampT(f, "seg7", 1)} l1="人物は実在" l2="万能像は後世作" />
      <Stamp x={940} y={1180} text="実在" size={56} t={ramp(f, STAMPS.seg7[1] + 6, STAMPS.seg7[1] + 16)} rot={12} round color={KIN} />
      <Tag x={540} y={1620} text="後世が理想の政治家を重ねた姿" size={46} t={pop(f, 100, 12)} rot={-2} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

// =====================================================================
// seg8 50〜55秒 二択：A 実在の改革者派 / B 理想像が本体派
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
          <text key={i} x={0} y={60 + i * 100} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={66} fill={PAPER}>
            {l}
          </text>
        ))}
      </g>
    );
  };
  return (
    <Stage f={f} look="shotoku">
      <Sun x={540} y={560} r={150} rot={f * 0.3} opacity={0.85} color={KIN_LIGHT} />
      <Taishi x={540} y={830} s={0.52} arm={60 + sway(f, 1, 6)} />
      <Heading text="君はどっち派？" t={pop(f, 0, 10)} y={200} size={88} {...HEAD} />
      {card(285, "A", ["実在の", "改革者派"], KON, 12, 1)}
      {card(795, "B", ["理想像が", "本体派"], FUJI, 22, 2)}
      <Tag x={540} y={1700} text="コメントで教えてね" size={60} t={pop(f, 40, 10)} rot={-1} />
    </Stage>
  );
};

// =====================================================================
// seg9 55〜60秒 チャンネル登録エンドカード（前作と同じ型）
// =====================================================================
export const Seg9: React.FC = () => {
  const f = useSegFrame("seg9");
  const PRESS = CLICK_AT;
  const btnIn = pop(f, 6, 12);
  const pressed = ramp(f, PRESS, PRESS + 3) - ramp(f, PRESS + 5, PRESS + 12) * 0.6;
  const bx = 540;
  const by = 1000;
  const fly = ramp(f, 12, PRESS - 4, Easing.out(Easing.cubic));
  const peck = Math.max(0, Math.sin(clamp01((f - (PRESS - 6)) / 10) * Math.PI));
  const crowX = interpolate(fly, [0, 1], [1300, bx + 300]);
  const crowY = interpolate(fly, [0, 1], [380, by - 190]) + peck * 75 - ramp(f, PRESS + 8, PRESS + 30) * 40;
  return (
    <Stage f={f} look="shotoku">
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
      {f >= 10 ? <Crow x={crowX} y={crowY} scale={1.05} flap={f < PRESS - 4 ? Math.sin(f * 0.8) : Math.sin(f * 0.25) * 0.3} flip /> : null}
      <Stamp x={540} y={1330} text="お願いします" size={96} t={stampT(f, "seg9", 0)} rot={-4} />
      <Tag x={540} y={1560} text={CHANNEL} size={60} t={pop(f, 86, 12)} rot={-1} bg={SUMI} color={PAPER} />
    </Stage>
  );
};

export const SEGMENTS_SHOTOKU: Record<SegId, React.FC> = { seg1: Seg1, seg2: Seg2, seg3: Seg3, seg4: Seg4, seg5: Seg5, seg6: Seg6, seg7: Seg7, seg8: Seg8, seg9: Seg9 };
export { Kohai };

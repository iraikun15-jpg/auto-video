// 聖徳太子回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-shotoku.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（10人の話を一度に聞いた天才、本当にいたの？）" },
  { id: "seg2", frames: 240, label: "人物の紹介（本名は厩戸皇子・推古天皇の摂政）" },
  { id: "seg3", frames: 240, label: "業績（冠位十二階・十七条憲法「和をもって貴しとなす」）" },
  { id: "seg4", frames: 270, label: "外交と建立（「日出づる処の天子」の国書・法隆寺）" },
  { id: "seg5", frames: 240, label: "伝説の部分（10人の話を聞いた超人伝説は後世の伝記の話）" },
  { id: "seg6", frames: 240, label: "IF検証（太子がいなかったら、切り替えは遅れたはず）" },
  { id: "seg7", frames: 180, label: "判定（人物は実在、万能像は後世作）" },
  { id: "seg8", frames: 150, label: "二択（A 実在の改革者派／B 理想像が本体派）" },
  { id: "seg9", frames: 150, label: "チャンネル登録エンドカード" },
] as const;

export type SegId = (typeof SEGMENTS)[number]["id"];
export const TOTAL_FRAMES = SEGMENTS.reduce((a, s) => a + s.frames, 0);
export const segStart = (id: SegId) => {
  let f = 0;
  for (const s of SEGMENTS) {
    if (s.id === id) return f;
    f += s.frames;
  }
  throw new Error(id);
};
export const segFrames = (id: SegId) => SEGMENTS.find((s) => s.id === id)!.frames;

/**
 * 判子が押され始めるフレーム（場面内）。判子は押し始めから約7フレームで紙に着くので、音はそこで鳴らす。
 * seg1 の「実在？」は 0 フレーム目から見せるため、押し始めを -7（＝0フレーム目で紙に着く）にしている
 */
export const STAMPS: Record<SegId, number[]> = {
  seg1: [-7],
  seg2: [188],
  seg3: [196],
  seg4: [96, 222],
  seg5: [176],
  seg6: [0, 186],
  seg7: [2, 56],
  seg8: [],
  seg9: [52],
};
export const STAMP_LAND = 7;
/** 冒頭フックの一打（seg1 の 0 フレーム目） */
export const HOOK_AT = 0;
/** 10人の吹き出しが次々に出るフレーム（seg1・seg5 内） */
export const BUBBLES_SEG1 = [-15, -14, -13, -12, -11, -10, -9, -8, -7, -6]; // 0フレーム目からほぼ全員見せる
export const BUBBLES_SEG5 = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65];
/** 伝説の夢がしぼんで、記録の紙に切り替わるフレーム（seg5 内） */
export const DREAM_FADE = 110;
/** 冠位の冠が並ぶ・憲法の巻物が開くフレーム（seg3 内） */
export const CAPS_AT = 14;
export const SCROLL_AT = 110;
/** 遣隋使の船が出る・法隆寺の部材が組み上がるフレーム（seg4 内） */
export const SHIP_AT = 10;
export const BUILD_AT = [140, 152, 164, 176, 188, 200, 212];
/** 前回（推古回）の札から太子が飛び出すフレーム（seg2 内） */
export const LINK_AT = 130;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 46;

/** 光背の窓が開く（場面の切り替わり）。seg1 は1フレーム目のフックを優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

/** 場面の質感：伝説（夢物語っぽく）と記録（記録っぽく） */
export const DREAM_SEGMENTS: SegId[] = ["seg5"];

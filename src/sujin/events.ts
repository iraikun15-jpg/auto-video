// 崇神回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-sujin.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（神武と崇神が並ぶ系図・初代はどっち？）" },
  { id: "seg2", frames: 240, label: "根拠1・称号（2人ともハツクニシラス）" },
  { id: "seg3", frames: 240, label: "根拠2・業績（税の仕組み・四道将軍・支配の拡大）" },
  { id: "seg4", frames: 270, label: "疫病と三輪山（大物主を祀る・大田田根子）" },
  { id: "seg5", frames: 240, label: "アマテラス（宮の外の笠縫邑へ・伊勢神宮の始まり）" },
  { id: "seg6", frames: 240, label: "IF検証（疫病のとき神を祀らなかったら）" },
  { id: "seg7", frames: 180, label: "判定（実在した可能性のある最初の天皇・3〜4世紀頃）" },
  { id: "seg8", frames: 150, label: "二択（A 本当の初代は崇神派／B 初代はやっぱり神武派）" },
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
 * 判子が押され始めるフレーム（場面内）。判子は押し始めから約7フレームで紙に着くので、音はそこで鳴らす
 */
export const STAMPS: Record<SegId, number[]> = {
  seg1: [4],
  seg2: [150],
  seg3: [164],
  seg4: [196],
  seg5: [176],
  seg6: [0, 188],
  seg7: [2, 50, 118],
  seg8: [],
  seg9: [58],
};
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** 御簾が上がる（場面の切り替わり）。seg1 は1フレーム目の構図を優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

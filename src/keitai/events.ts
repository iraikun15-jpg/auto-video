// 継体回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-keitai.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（実は出自が謎だらけ？）" },
  { id: "seg2", frames: 240, label: "登場（近江国から呼ばれた地方の王・男大迹王）" },
  { id: "seg3", frames: 240, label: "20年の謎（大和に入れず転々とする移動ルート）" },
  { id: "seg4", frames: 240, label: "実在の確かさ（磐井の乱・記録がはっきりする）" },
  { id: "seg5", frames: 240, label: "系譜が怪しい（応神天皇から伸びる家系図に？）" },
  { id: "seg6", frames: 240, label: "IF検証（新王朝の始まりだったら）" },
  { id: "seg7", frames: 180, label: "判定（実在が確実になる境目の王・ただし出自は謎）" },
  { id: "seg8", frames: 150, label: "二択（A 系譜通り、応神の末裔派／B 実は新王朝の始まり派）" },
  { id: "seg9", frames: 180, label: "チャンネル登録エンドカード" },
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
  seg1: [54],
  seg2: [176],
  seg3: [196],
  seg4: [170],
  seg5: [172],
  seg6: [0, 180],
  seg7: [2, 50],
  seg8: [],
  seg9: [58],
};
/** 冒頭フックの一打（seg1 の 0 フレーム目） */
export const HOOK_AT = 0;
/** 移動ルートで宮に着くフレーム（seg3 内）：小さな鈴を鳴らす */
export const STOPS = [40, 82, 124, 166];
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** 襖が左右に開く（場面の切り替わり）。seg1 は1フレーム目のフックを優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

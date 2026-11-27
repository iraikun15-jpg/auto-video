// 雄略回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-yuryaku.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（鉄剣の銘文・名前が出てきた）" },
  { id: "seg2", frames: 240, label: "決め手（稲荷山古墳の鉄剣・X線でワカタケル大王）" },
  { id: "seg3", frames: 240, label: "銘文の中身（115文字・471年・代々仕えた家系）" },
  { id: "seg4", frames: 270, label: "全国の証拠（江田船山古墳の鉄刀・関東〜九州）" },
  { id: "seg5", frames: 240, label: "中国の記録（倭の五王の武・478年の上表文・三方向の一致）" },
  { id: "seg6", frames: 240, label: "IF検証（鉄剣が見つかっていなかったら）" },
  { id: "seg7", frames: 180, label: "判定（実在が証明された最も古い天皇）" },
  { id: "seg8", frames: 150, label: "二択（A 鉄剣で実在確定派／B 名前が同じだけじゃ慎重派）" },
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
  seg1: [8],
  seg2: [168],
  seg3: [176],
  seg4: [200],
  seg5: [180],
  seg6: [0, 186],
  seg7: [2, 60],
  seg8: [],
  seg9: [58],
};
/** X線で銘文が浮かび上がるフレーム（場面内）：効果音のきらめきを鳴らす */
export const REVEALS: Record<SegId, number[]> = {
  seg1: [0],
  seg2: [70],
  seg3: [],
  seg4: [],
  seg5: [],
  seg6: [],
  seg7: [],
  seg8: [],
  seg9: [],
};
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** X線のスキャン光（場面の切り替わり）。seg1 は1フレーム目の構図を優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

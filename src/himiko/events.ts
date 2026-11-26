// 卑弥呼回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-himiko.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（教科書では教えてくれない女王／日本の歴史書に名前がない）" },
  { id: "seg2", frames: 240, label: "記録の出どころ（魏志倭人伝・邪馬台国の女王・鬼道）" },
  { id: "seg3", frames: 240, label: "外交の証拠（魏への使い・親魏倭王・銅鏡100枚）" },
  { id: "seg4", frames: 240, label: "死と後継（大きな塚と殉葬・13歳の台与）" },
  { id: "seg5", frames: 240, label: "日本側の沈黙（古事記・日本書紀に名前がない）" },
  { id: "seg6", frames: 240, label: "IF検証（魏志倭人伝が残っていなかったら）" },
  { id: "seg7", frames: 180, label: "判定（実在が濃厚な女王・ただし場所は謎）" },
  { id: "seg8", frames: 150, label: "二択（A 鬼道の呪術者派／B 政治のリーダー派）" },
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
  seg1: [52],
  seg2: [],
  seg3: [60],
  seg4: [],
  seg5: [150],
  seg6: [0, 180],
  seg7: [2, 50],
  seg8: [],
  seg9: [58],
};
/** 冒頭フックの「カンッ」（拍子木＋太鼓の一打）。seg1 の 0 フレーム目 */
export const HOOK_AT = 0;
/** 銅鏡が1枚ずつ並ぶ区間（seg3 内）：小さなきらめきを鳴らす */
export const MIRRORS_FROM = 96;
export const MIRRORS_TO = 190;
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** 書物のページがめくれる（場面の切り替わり）。seg1 は1フレーム目のフックを優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

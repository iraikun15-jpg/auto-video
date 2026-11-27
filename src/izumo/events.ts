// 出雲回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-izumo.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（実は出雲の方が強かった？）" },
  { id: "seg2", frames: 240, label: "神話の内容（大国主命が天の使いに国を譲る）" },
  { id: "seg3", frames: 240, label: "遺跡の証拠（荒神谷遺跡・銅剣358本）" },
  { id: "seg4", frames: 240, label: "力の裏づけ（銅鐸39個・出雲と大和の二大勢力）" },
  { id: "seg5", frames: 240, label: "神話の条件（大きな社＝出雲大社・対等な交渉）" },
  { id: "seg6", frames: 240, label: "IF検証（作り話だったら力の説明がつかない）" },
  { id: "seg7", frames: 180, label: "判定（交渉は神話・勢力は実在）" },
  { id: "seg8", frames: 150, label: "二択（A 本当に平和に譲った派／B 力関係を神話にした派）" },
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
  seg2: [180],
  seg3: [186],
  seg4: [196],
  seg5: [190],
  seg6: [0, 184],
  seg7: [2, 44, 84],
  seg8: [],
  seg9: [58],
};
/** 冒頭フックの一打（seg1 の 0 フレーム目） */
export const HOOK_AT = 0;
/** 銅剣が並び始めて終わるフレーム（seg3 内）。土を掘る音・金属の小さな当たり音 */
export const SWORDS_FROM = 60;
export const SWORDS_TO = 150;
/** 銅鐸が鳴るフレーム（seg4 内） */
export const BELL_AT = 70;
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** 雲が湧いて流れ去る（場面の切り替わり）。seg1 は1フレーム目のフックを優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

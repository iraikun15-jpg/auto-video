// ヤマトタケル回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-takeru.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（ヤマトタケルって、ほんとにいたの？）" },
  { id: "seg2", frames: 210, label: "物語の紹介（景行天皇の皇子・熊襲・東国・白鳥）" },
  { id: "seg3", frames: 240, label: "でも実は（各地の伝承が一人に集まった姿）" },
  { id: "seg4", frames: 240, label: "根拠（古事記と日本書紀で描かれ方が違う）" },
  { id: "seg5", frames: 270, label: "それでも残る核（大和の東への拡大・建部）" },
  { id: "seg6", frames: 240, label: "IF検証（草薙剣を置いていかなければ）" },
  { id: "seg7", frames: 150, label: "判定（人物＝物語／過程＝本物の圧縮記録）" },
  { id: "seg8", frames: 180, label: "二択（A 一人の英雄がいた派／B みんなの記憶が集まった派）" },
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
  seg1: [4],
  seg2: [84, 160],
  seg3: [198],
  seg4: [150],
  seg5: [96, 214],
  seg6: [0, 186],
  seg7: [2, 44, 104],
  seg8: [],
  seg9: [58],
};
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** 紙めくり（場面の切り替わり）。seg1 は1フレーム目の構図を優先してめくりなし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

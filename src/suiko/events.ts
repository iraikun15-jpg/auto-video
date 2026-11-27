// 推古回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-suiko.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（実は暗殺事件から生まれた女帝）" },
  { id: "seg2", frames: 240, label: "即位の背景（崇峻天皇の暗殺・蘇我馬子に担がれた即位）" },
  { id: "seg3", frames: 240, label: "実在の確かさ（日本書紀と隋書の両方に残る）" },
  { id: "seg4", frames: 240, label: "実績（冠位十二階・十七条憲法・遣隋使）" },
  { id: "seg5", frames: 240, label: "お飾り説（実権は太子と馬子？）" },
  { id: "seg6", frames: 240, label: "IF検証（お飾りなら36年の在位の理由が弱い）" },
  { id: "seg7", frames: 180, label: "判定（実在が確かな日本初の女帝）" },
  { id: "seg8", frames: 150, label: "二択（A 自分で政治を動かした派／B 太子と馬子のお飾り派）" },
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
  seg2: [184],
  seg3: [176],
  seg4: [190],
  seg5: [170],
  seg6: [0, 190],
  seg7: [2, 50],
  seg8: [],
  seg9: [58],
};
/** 冒頭フックの一打（seg1 の 0 フレーム目） */
export const HOOK_AT = 0;
/** 改革の3つの札が置かれるフレーム（seg4 内） */
export const REFORMS = [30, 70, 110];
/** 操り糸が切れるフレーム（seg6 内） */
export const SNAP_AT = 150;
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** 冠位十二階の色帯が流れ去る（場面の切り替わり）。seg1 は1フレーム目のフックを優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

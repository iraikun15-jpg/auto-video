// 天武回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-tenmu.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（実は後継者から外された天皇）" },
  { id: "seg2", frames: 300, label: "背景（皇太弟だった大海人・大友が太政大臣に・出家して吉野へ）" },
  { id: "seg3", frames: 270, label: "挙兵（672年6月 吉野から美濃へ・不破をふさぐ・東の国々の兵）" },
  { id: "seg4", frames: 240, label: "決戦（瀬田橋の戦い・大友皇子の自害・約1か月）" },
  { id: "seg5", frames: 270, label: "即位（飛鳥で即位・皇位を取り戻す・天皇の木簡）" },
  { id: "seg6", frames: 240, label: "IF検証（負けていたら反乱者で終わっていた）" },
  { id: "seg7", frames: 180, label: "判定（外されて、実力で取り戻した、実在が確かな天皇）" },
  { id: "seg8", frames: 150, label: "二択（A 正当な後継者派／B 実力で奪った派）" },
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
  seg2: [240],
  seg3: [214],
  seg4: [186],
  seg5: [110],
  seg6: [0, 170],
  seg7: [2, 50],
  seg8: [],
  seg9: [58],
};
/** 冒頭フックの一打（seg1 の 0 フレーム目） */
export const HOOK_AT = 0;
/** 不破の道をふさぐ（関が閉じる）フレーム（seg3 内） */
export const FUWA_AT = 120;
/** 大友方の駒が倒れる（決着）フレーム（seg4 内） */
export const FALL_AT = 110;
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** のろしの煙が湧いて晴れる（場面の切り替わり）。seg1 は1フレーム目のフックを優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

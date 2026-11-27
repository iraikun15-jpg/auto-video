// 草薙剣回の場面タイミングと効果音のきっかけ。映像（Segs.tsx）と音（scripts/synth-kusanagi.mjs）の両方がここを読む
export const FPS = 30;
export const HOLD = 9; // 各場面の末尾の静止（0.3秒）

export const SEGMENTS = [
  { id: "seg1", frames: 90, label: "フック（八岐大蛇と剣・実在？）" },
  { id: "seg2", frames: 270, label: "オロチ退治（酒で酔わせて退治・尾から剣・天照大神へ献上）" },
  { id: "seg3", frames: 270, label: "天孫降臨とヤマトタケル（剣が地上へ・野火を薙ぐ＝草薙の由来）" },
  { id: "seg4", frames: 240, label: "熱田へ（尾張に残され熱田神宮へ・御神体とされる）" },
  { id: "seg5", frames: 270, label: "盗難事件（日本書紀の新羅の僧・不開門）" },
  { id: "seg6", frames: 270, label: "壇ノ浦と竜宮の伝説（安徳天皇と沈む剣・竜宮へ帰る大蛇）" },
  { id: "seg7", frames: 150, label: "検証（誰にも公開されない・確かめる方法がない）" },
  { id: "seg8", frames: 120, label: "二択（これはあった？なかった？ A 本物が熱田にある派／B 物語の中にだけある派）" },
  { id: "seg9", frames: 120, label: "チャンネル登録エンドカード" },
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
  seg1: [6],
  seg2: [],
  seg3: [],
  seg4: [],
  seg5: [],
  seg6: [],
  seg7: [92],
  seg8: [],
  seg9: [58],
};
/** 剣の一閃（大蛇を斬る・草を薙ぐ）のフレーム（場面内） */
export const SLASHES: Record<SegId, number[]> = {
  seg1: [],
  seg2: [118],
  seg3: [196],
  seg4: [],
  seg5: [],
  seg6: [],
  seg7: [],
  seg8: [],
  seg9: [],
};
/** 不開門が閉まるフレーム（seg5 内） */
export const GATE_CLOSE = 206;
export const STAMP_LAND = 7;

/** 登録ボタンを八咫烏がつつくフレーム（seg9 内） */
export const CLICK_AT = 52;

/** 剣閃（場面の切り替わり）。seg1 は1フレーム目の構図を優先して転換なし */
export const PEEL_SEGMENTS: SegId[] = ["seg2", "seg3", "seg4", "seg5", "seg6", "seg7", "seg8", "seg9"];

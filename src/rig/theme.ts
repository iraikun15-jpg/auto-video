import { loadFont } from "@remotion/google-fonts/NotoSansJP";

// シリーズ共通の見た目（第1話の画面に合わせた値）
export const BG = "#FBFAF5"; // 背景（生成り）
export const INK = "#151515"; // 主人公・背景部品の線
export const BOSS_RED = "#D7263D"; // 上司の色
export const FRIEND_BLUE = "#1E6FD9"; // 友達の色（第3話で追加・シリーズ固定）
export const LINE = 12; // 棒人間の線の太さ
export const PROP_LINE = 7; // 背景部品の線の太さ
export const FLOOR_Y = 1500; // 床の高さ

const { fontFamily } = loadFont("normal", {
  weights: ["900"],
  subsets: ["japanese", "latin"],
  ignoreTooManyRequestsWarning: true,
});
export const FONT = fontFamily;

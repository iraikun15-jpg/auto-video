import { loadFont as loadMincho } from "@remotion/google-fonts/ShipporiMinchoB1";
import { loadFont as loadSans } from "@remotion/google-fonts/NotoSansJP";

// 歴史チャンネル「切り絵」スタイルの色（和紙・墨・朱・藍・金）
export const PAPER_BG = "#E6DAC0"; // 台紙（いちばん奥の和紙）
export const PAPER = "#F4ECDA"; // 陸地・札の紙
export const PAPER_DARK = "#D9C9A6"; // 山並みの奥の紙
export const SUMI = "#211D1A"; // 墨（影絵の人物・敵方）
export const SHU = "#C2412D"; // 朱（神武方・判子）
export const AI = "#2F4B68"; // 藍（海）
export const AI_LIGHT = "#3E5E80"; // 海の波模様
export const KIN = "#C99A3E"; // 金（日輪・差し色）
export const KUSA = "#7A845A"; // 山の緑
export const HAI = "#8B7E6A"; // その他の豪族の駒
export const MURASAKI = "#5E3C78"; // 紫（崇神回の主役・見出し）
export const SUGI = "#4F6B3A"; // 杉の緑（崇神回）
export const SEIDO = "#3F7F77"; // 青銅の緑青（出雲回）

const mincho = loadMincho("normal", {
  weights: ["800"],
  subsets: ["japanese", "latin"],
  ignoreTooManyRequestsWarning: true,
});
const sans = loadSans("normal", {
  weights: ["900"],
  subsets: ["japanese", "latin"],
  ignoreTooManyRequestsWarning: true,
});
/** 見出し・札の文字（明朝） */
export const MINCHO = mincho.fontFamily;
/** 数字や小さい注記（ゴシック） */
export const SANS = sans.fontFamily;

export const W = 1080;
export const H = 1920;

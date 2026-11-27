// scripts/build-episodes.mjs が書き出す台本データの型
import type { PoseName } from "../rig/poses";

export type Opts = {
  x?: number;
  y?: number;
  facing?: 1 | -1;
  dur?: number; // フレーム
  to?: number;
  speed?: number; // 倍率
  then?: PoseName;
  times?: number;
  height?: number;
  power?: number;
  size?: number;
  ease?: string;
  text?: string;
  color?: string;
  place?: string;
};

export type Action = {
  who: string; // 登場人物の名前、または「画面」
  start: number; // 結合版での開始フレーム
  kind: "pose" | "motion" | "effect";
  code: string;
  seg: number;
  opts: Opts;
};

export type CastMember = {
  color: "ink" | "red";
  tie: boolean;
  x: number;
  facing: 1 | -1;
  pose: PoseName;
  always: boolean;
};

export type TextItem = Opts & { start: number; end?: number; text: string; color: string };

export type Segment = {
  id: string;
  label: string;
  script: string;
  start: number;
  frames: number;
  texts: TextItem[];
  background?: string; // セグメントだけ背景を変えるとき
  props?: PropItem[]; // セグメントだけ小道具を変えるとき
};

export type PropItem = {
  type: string;
  x?: number;
  y?: number;
  width?: number;
  tilt?: number;
  front?: boolean; // 人物より手前に描く
  open?: number; // ドアの開き 0〜1
  count?: number;
  on?: boolean; // テレビが点いている
  text?: string; // ホワイトボードの板書
  time?: string; // 時計の時刻 "17:59"
};

export type Episode = {
  id: string;
  title: string;
  release: boolean;
  fps: number;
  hold: number;
  background: string;
  props: PropItem[];
  cast: Record<string, CastMember>;
  segments: Segment[];
  actions: Action[];
  thumbnail: { frame: number; texts: Omit<TextItem, "start">[] };
  totalFrames: number;
};

// scripts/build-history.mjs が書き出す日本史キットの台本データの型
import type { Look } from "../jimmu/paper";
import type { PersonKind } from "../jimmu/figures";

export type HPerson = { kind: PersonKind; color?: string; outline?: string; x?: number; y?: number; s?: number; flip?: boolean };
export type HStamp = { text: string; at: number; round: boolean; color: string; x?: number; y?: number; size?: number };
export type HPart = { name: string; x: number; y: number; s: number; at: number; color?: string };

export type HScene = {
  id: string;
  type: "hook" | "intro" | "timeline" | "map" | "points" | "compare" | "ifcase" | "verdict" | "choice" | "subscribe";
  start: number;
  frames: number;
  label: string;
  heading?: string;
  person?: HPerson | null; // undefined=主役を型の既定の位置に、null=出さない
  stamps: HStamp[];
  note?: { text: string; at: number; bg: string };
  parts: HPart[];
  // 型ごとの中身
  big?: string[];
  name?: { big: string; reading?: string; note?: string; at: number[] };
  items?: { year?: string; text: string; at: number }[];
  places?: { name: string; lon: number; lat: number; at: number }[];
  route?: boolean;
  left?: { heading: string; items: string[]; color: string; texture?: "dream" | "record"; at: number };
  right?: { heading: string; items: string[]; color: string; texture?: "dream" | "record"; at: number };
  fact?: string[];
  what?: string[];
  factAt?: number[];
  whatAt?: number[];
  verdict?: string[];
  verdictAt?: number;
  gold?: string;
  goldAt?: number;
  a?: string[];
  b?: string[];
  clickAt?: number;
};

export type HEpisode = {
  id: string;
  title: string;
  fps: number;
  hold: number;
  stampLand: number;
  style: {
    particles: Look;
    transition: Look;
    tagBg: string;
    tagColor: string;
    night: boolean;
    hero: { kind: PersonKind; color?: string; outline?: string };
  };
  audio: { instrument: string; scale: number[]; tempo: number; pad: boolean; bells: boolean; gong: boolean; lufs: number };
  scenes: HScene[];
  events: { kind: "hook" | "stamp" | "place" | "transition" | "click" | "ting"; frame: number; seg: string }[];
  thumb: { lines: string[]; stamp?: string; parts: HPart[]; person: boolean };
  totalFrames: number;
};

/**
 * 台本の「背景」「小道具」の名前と絵の対応。
 * 新しい背景・小道具を作ったら、ここと src/story/names.json に足す。
 *
 * 背景は壁側の飾りと床。家具など位置を変えたいものは「小道具」で置く。
 * 背景の飾りは y=640 より下に置く（上は文字のための余白）。
 */
import React from "react";
import { random } from "remotion";
import { Chair, Desk, Floor, PaperReam, Printer } from "../rig/props";
import {
  Bed,
  Cardboard,
  Coffee,
  Door,
  MeetingTable,
  PaperStack,
  Plant,
  Pole,
  Register,
  Sofa,
  StoreShelf,
  Straps,
  Tree,
  TrashCan,
  TV,
  Vending,
  WallClock,
  Whiteboard,
  Window,
} from "../rig/scenery";
import { BG, FLOOR_Y, INK, PROP_LINE } from "../rig/theme";
import type { PropItem } from "./types";

type BgProps = { f: number };

/** 電車の窓：外の景色（ビルの輪郭）が右から左へ流れる */
const TrainWindow: React.FC<{ x: number; f: number; i: number }> = ({ x, f, i }) => {
  const y = 900;
  const w = 300;
  const h = 230;
  const id = `train-win-${i}`;
  const shift = (f * 22) % 1200;
  const buildings: React.ReactNode[] = [];
  for (let k = 0; k < 14; k++) {
    const bw = 60 + random(`tb-w-${k}`) * 90;
    const bh = 60 + random(`tb-h-${k}`) * 130;
    const bx = x + ((k * 110 - shift + 2400) % 1200) - 300;
    buildings.push(<rect key={k} x={bx} y={y + h - bh} width={bw} height={bh + 10} fill="none" stroke={INK} strokeWidth={4} opacity={0.45} />);
  }
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={w} height={h} rx={16} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={BG} />
      <g clipPath={`url(#${id})`}>{buildings}</g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="none" stroke={INK} strokeWidth={PROP_LINE} />
    </g>
  );
};

export const Backgrounds: Record<string, React.FC<BgProps>> = {
  floor: () => <Floor />,
  none: () => null,
  office: ({ f }) => (
    <>
      <Floor />
      <Window x={70} y={650} />
      <WallClock x={850} y={660} f={f} time="17:59" />
    </>
  ),
  meeting: ({ f }) => (
    <>
      <Floor />
      <Whiteboard x={330} />
      <WallClock x={850} y={660} f={f} time="15:00" />
      <Window x={40} y={650} width={220} />
    </>
  ),
  train: ({ f }) => (
    <>
      {/* 天井・吊り革・窓・ロングシート */}
      <line x1={-20} y1={650} x2={1100} y2={650} stroke={INK} strokeWidth={PROP_LINE} />
      <Straps x={90} count={6} gap={180} f={f} />
      {[20, 390, 760].map((x, i) => (
        <TrainWindow key={i} x={x} f={f} i={i} />
      ))}
      <rect x={-20} y={FLOOR_Y - 230} width={1120} height={110} rx={20} fill={BG} stroke={INK} strokeWidth={PROP_LINE} />
      <rect x={-20} y={FLOOR_Y - 128} width={1120} height={60} rx={12} fill={BG} stroke={INK} strokeWidth={PROP_LINE} />
      <Floor />
    </>
  ),
  store: () => (
    <>
      {[200, 540, 880].map((x) => (
        <line key={x} x1={x - 90} y1={655} x2={x + 90} y2={655} stroke={INK} strokeWidth={10} strokeLinecap="round" />
      ))}
      <StoreShelf x={10} width={330} />
      <StoreShelf x={740} width={330} />
      <Floor />
    </>
  ),
  home: () => (
    <>
      <Floor />
      <Window x={400} y={680} width={280} curtain />
      {/* 壁の額縁 */}
      <rect x={90} y={760} width={150} height={115} fill={BG} stroke={INK} strokeWidth={PROP_LINE} />
      <path d="M 110 855 L 150 805 L 180 835 L 200 815 L 222 855" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </>
  ),
  outdoor: ({ f }) => (
    <>
      {/* 遠くのビル・流れる雲・電柱・木 */}
      {[
        [-10, 260, 260],
        [230, 180, 380],
        [390, 220, 200],
        [690, 200, 330],
        [870, 230, 250],
      ].map(([x, w, h], i) => (
        <rect key={i} x={x} y={FLOOR_Y - 40 - h} width={w} height={h} fill="none" stroke={INK} strokeWidth={4} opacity={0.35} />
      ))}
      {[0, 1].map((i) => {
        const cx = ((i * 560 + f * 0.8) % 1400) - 160;
        const cy = 700 + i * 60;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} q 10 -40 50 -30 q 25 -40 70 -15 q 40 -20 55 20 q 30 5 20 25 Z`}
            fill={BG}
            stroke={INK}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        );
      })}
      <Floor />
      <Tree x={-40} f={f} />
      <Pole x={960} />
    </>
  ),
};

export const PropView: React.FC<{ item: PropItem; f: number }> = ({ item, f }) => {
  const x = item.x ?? 540;
  switch (item.type) {
    case "desk":
      return <Desk x={x} width={item.width} />;
    case "chair":
      return <Chair x={x} tilt={item.tilt} />;
    case "printer":
      return <Printer x={x} />;
    case "ream":
      return <PaperReam x={x} y={item.y ?? FLOOR_Y - 23} rotate={item.tilt} />;
    case "clock":
      return <WallClock x={x} y={item.y} time={item.time} f={f} />;
    case "window":
      return <Window x={x} y={item.y} width={item.width} />;
    case "whiteboard":
      return <Whiteboard x={x} width={item.width} text={item.text} />;
    case "table":
      return <MeetingTable x={x} width={item.width} />;
    case "door":
      return <Door x={x} open={item.open} />;
    case "shelf":
      return <StoreShelf x={x} width={item.width} />;
    case "register":
      return <Register x={x} width={item.width} />;
    case "sofa":
      return <Sofa x={x} width={item.width} />;
    case "tv":
      return <TV x={x} on={item.on} f={f} />;
    case "bed":
      return <Bed x={x} width={item.width} />;
    case "vending":
      return <Vending x={x} />;
    case "plant":
      return <Plant x={x} />;
    case "trash":
      return <TrashCan x={x} />;
    case "coffee":
      return <Coffee x={x} y={item.y} f={f} />;
    case "papers":
      return <PaperStack x={x} y={item.y} count={item.count} />;
    case "box":
      return <Cardboard x={x} y={item.y} width={item.width} />;
    case "straps":
      return <Straps x={x} count={item.count} f={f} />;
    case "tree":
      return <Tree x={x} f={f} />;
    case "pole":
      return <Pole x={x} />;
    default:
      return null;
  }
};

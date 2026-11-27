/**
 * 台本の「背景」「小道具」の名前と絵の対応。
 * 新しい背景・小道具を作ったら、ここと src/story/names.json に足す。
 */
import React from "react";
import { Chair, Desk, Floor, PaperReam, Printer } from "../rig/props";
import { FLOOR_Y } from "../rig/theme";
import type { PropItem } from "./types";

export const Backgrounds: Record<string, React.FC> = {
  floor: () => <Floor />,
  none: () => null,
};

export const PropView: React.FC<{ item: PropItem; f: number }> = ({ item }) => {
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
    default:
      return null;
  }
};

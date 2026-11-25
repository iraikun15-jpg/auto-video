// 西日本の簡略地図（経度・緯度）とカメラ投影
// 古地図風にするため、海岸線はわざと粗く単純化している。
// 河内湾（当時は生駒山のふもと・白肩津まで海が入り込んでいた）も描く。

export type LL = [number, number]; // [経度, 緯度]

export const KYUSHU: LL[] = [
  [130.9, 33.95], [131.2, 33.65], [131.7, 33.6], [131.55, 33.2], [131.95, 32.95],
  [131.75, 32.5], [131.5, 31.85], [131.25, 31.4], [130.75, 31.05], [130.25, 31.3],
  [130.35, 31.75], [130.6, 32.05], [130.2, 32.45], [130.45, 32.8], [130.1, 33.05],
  [129.8, 32.8], [129.6, 33.2], [129.95, 33.5], [130.4, 33.75],
];

export const SHIKOKU: LL[] = [
  [132.05, 33.3], [132.4, 33.85], [133.0, 34.1], [133.6, 34.3], [134.2, 34.3],
  [134.6, 34.2], [134.72, 33.85], [134.25, 33.3], [133.9, 33.5], [133.3, 33.4],
  [133.0, 32.8], [132.6, 32.85], [132.4, 33.1],
];

export const AWAJI: LL[] = [
  [134.88, 34.62], [135.02, 34.56], [134.95, 34.3], [134.78, 34.22], [134.72, 34.35],
];

// 本州（中国・近畿・紀伊半島）。右端は画面外まで伸ばす
export const HONSHU: LL[] = [
  [130.9, 34.0], [131.0, 34.35], [131.4, 34.5], [131.8, 34.7], [132.2, 35.0],
  [132.7, 35.4], [133.2, 35.55], [134.0, 35.55], [134.8, 35.65], [135.3, 35.6],
  [135.8, 35.55], [136.1, 35.75], [136.5, 35.75], [137.5, 36.0], [138.5, 36.0],
  [138.5, 34.6],
  [137.2, 34.65], [136.85, 35.05], [136.62, 34.92], [136.55, 34.72], [136.68, 34.55],
  [136.9, 34.45], [136.85, 34.3], [136.55, 34.22], [136.25, 34.1], [136.1, 33.9],
  [136.0, 33.7], [135.88, 33.5], [135.76, 33.44], [135.58, 33.48], [135.4, 33.56],
  [135.33, 33.72], [135.18, 33.88], [135.13, 34.05], [135.1, 34.22], [135.2, 34.3],
  [135.32, 34.42], [135.42, 34.52], [135.47, 34.6],
  // 河内湾（白肩津まで入り込む）
  [135.56, 34.62], [135.62, 34.65], [135.63, 34.7], [135.58, 34.76], [135.48, 34.75],
  [135.3, 34.7], [135.15, 34.68], [134.9, 34.72], [134.6, 34.76], [134.2, 34.68],
  [133.8, 34.55], [133.4, 34.48], [132.9, 34.33], [132.4, 34.2], [132.05, 33.97],
  [131.5, 34.02], [131.05, 33.93],
];

export const LANDS = [HONSHU, KYUSHU, SHIKOKU, AWAJI];

// 地名
export const PLACES = {
  hyuga: [131.42, 32.05] as LL, // 日向
  usa: [131.35, 33.5] as LL,
  naniwa: [135.46, 34.66] as LL, // 難波
  kusaka: [135.62, 34.68] as LL, // 白肩津
  ikoma: [135.68, 34.67] as LL, // 生駒山
  kusae: [135.66, 34.66] as LL, // 孔舎衛坂
  kinokuni: [135.2, 34.22] as LL, // 紀国
  kumano: [135.98, 33.72] as LL, // 熊野
  yoshino: [135.86, 34.37] as LL, // 吉野
  uda: [135.95, 34.52] as LL, // 宇陀
  kashihara: [135.79, 34.49] as LL, // 橿原
  yamato: [135.8, 34.55] as LL, // 大和
};

export type Cam = { lon: number; lat: number; zoom: number; cx?: number; cy?: number };

/** 全体図（九州〜紀伊） */
export const CAM_WEST: Cam = { lon: 133.35, lat: 33.45, zoom: 1, cy: 780 };
/** 近畿のアップ（生駒〜大和） */
export const CAM_IKOMA: Cam = { lon: 135.62, lat: 34.6, zoom: 6.2, cy: 820 };
/** 紀伊半島（迂回ルート） */
export const CAM_KII: Cam = { lon: 135.55, lat: 34.0, zoom: 4.3, cy: 860 };

const PX_LON = 138; // zoom=1 のときの経度1度あたりの画素
const PX_LAT = PX_LON / 0.82;

export const project = (cam: Cam, [lon, lat]: LL): [number, number] => {
  const cx = cam.cx ?? 540;
  const cy = cam.cy ?? 960;
  return [cx + (lon - cam.lon) * PX_LON * cam.zoom, cy - (lat - cam.lat) * PX_LAT * cam.zoom];
};

export const lerpCam = (a: Cam, b: Cam, t: number): Cam => {
  // ズームは対数で補間すると自然に見える
  const z = Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * t);
  const k = (z - a.zoom) / (b.zoom - a.zoom || 1);
  const u = b.zoom === a.zoom ? t : k;
  return {
    lon: a.lon + (b.lon - a.lon) * u,
    lat: a.lat + (b.lat - a.lat) * u,
    zoom: z,
    cx: (a.cx ?? 540) + ((b.cx ?? 540) - (a.cx ?? 540)) * u,
    cy: (a.cy ?? 960) + ((b.cy ?? 960) - (a.cy ?? 960)) * u,
  };
};

export const polyPath = (pts: [number, number][], close = true): string =>
  pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("") + (close ? "Z" : "");

/** 折れ線を先頭から t（0〜1）の割合だけ切り出す */
export const partial = (pts: [number, number][], t: number): [number, number][] => {
  if (t <= 0) return [pts[0]];
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let left = Math.min(1, t) * total;
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (left >= segs[i - 1]) {
      out.push(pts[i]);
      left -= segs[i - 1];
    } else {
      const r = left / segs[i - 1];
      out.push([
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r,
      ]);
      break;
    }
  }
  return out;
};

/** 折れ線上の位置 t の点と進行方向（度） */
export const pointAt = (pts: [number, number][], t: number): { p: [number, number]; angle: number } => {
  const tt = Math.min(1, Math.max(0, t));
  const last = (u: number) => {
    const seg = partial(pts, u);
    return seg[seg.length - 1];
  };
  const p = last(tt);
  const a = last(Math.max(0, tt - 0.01));
  const b = last(Math.min(1, tt + 0.01));
  return { p, angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
};

// ---- ルート（経度緯度） ----
/** 日向 → 瀬戸内海 → 難波 → 白肩津 */
export const ROUTE_EAST: LL[] = [
  [131.42, 32.05], [131.62, 32.6], [131.75, 33.2], [131.5, 33.75], [131.3, 33.98],
  [131.9, 33.92], [132.5, 34.08], [133.2, 34.3], [133.9, 34.47], [134.5, 34.6],
  [135.08, 34.6], [135.35, 34.64], [135.5, 34.69], [135.61, 34.68],
];
/** 迂回：難波 → 紀国 → 熊野 → 吉野 → 宇陀 → 橿原 */
export const ROUTE_DETOUR: LL[] = [
  [135.58, 34.68], [135.4, 34.6], [135.25, 34.4], [135.1, 34.22], [135.06, 34.0],
  [135.25, 33.7], [135.55, 33.4], [135.85, 33.42], [136.02, 33.68], [135.98, 33.9],
  [135.9, 34.15], [135.86, 34.37], [135.95, 34.52], [135.8, 34.5],
];
/** IF：白肩津から生駒を越えて大和へ一直線 */
export const ROUTE_IF: LL[] = [
  [135.61, 34.68], [135.68, 34.66], [135.74, 34.62], [135.8, 34.55],
];

import { random } from "remotion";
import { beamAmount, beamHit, FRAMES, LANDINGS, rootAt, tailDir, TL } from "./motion";

/**
 * ローポリの街と、各建物がいつ・どう壊れるかの予定表。
 * 怪獣の動き（motion.ts）から当たり判定を事前計算するので、毎フレーム同じ結果になる。
 */

export type Building = {
  id: number;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  tone: number; // 外壁の明るさのばらつき
  variant: number; // 窓テクスチャの種類
  roof: boolean;
  tower?: boolean;
  crushF?: number; // 踏み潰し
  toppleF?: number; // 尾でなぎ倒し
  toppleDir?: [number, number];
  cutF?: number; // 熱線で切断
  cutH?: number;
  burnF?: number; // 炎上開始
};

export type Spot = { x: number; z: number; f: number; s: number };

const R = (k: string) => random(`city-${k}`);

const build = () => {
  const list: Building[] = [];
  let id = 0;
  const add = (b: Omit<Building, "id">) => list.push({ ...b, id: id++ });

  // ランドマーク：赤い塔（熱線の1回目の通り道に置く）
  const tp = beamHit(640).point;
  const r0 = rootAt(640);
  const towerX = tp.x - (tp.x - r0.x) * 0.06;
  const towerZ = tp.z;
  add({ x: towerX, z: towerZ, w: 2.6, d: 2.6, h: 19, tone: 0, variant: 0, roof: false, tower: true });

  // 怪獣の通り道（|z| が小さい帯）に低めのビルを並べる（踏み潰し用）
  for (let x = -21; x < 6; x += 4.6) {
    const i = Math.round(x * 10);
    const z = (R(`cz${i}`) > 0.5 ? 1 : -1) * (0.6 + R(`czz${i}`) * 1.6);
    add({
      x: x + R(`cx${i}`) * 1.2,
      z,
      w: 2.3 + R(`cw${i}`) * 0.9,
      d: 2.3 + R(`cd${i}`) * 0.9,
      h: 2.4 + R(`ch${i}`) * 1.8,
      tone: R(`ct${i}`),
      variant: Math.floor(R(`cv${i}`) * 3),
      roof: R(`cr${i}`) > 0.5,
    });
  }

  // 碁盤目の街区
  const PITCH = 9.5;
  for (let bx = -21; bx < 52; bx += PITCH) {
    for (let bz = -50; bz < 0; bz += PITCH) {
      const key = `${bx}_${bz}`;
      const lots: [number, number, number, number][] = []; // 中心x, 中心z, 幅, 奥行き
      const kind = R(`k${key}`);
      const S = 7;
      if (kind < 0.25) lots.push([bx + S / 2, bz + S / 2, S, S]);
      else if (kind < 0.55) {
        lots.push([bx + S / 4, bz + S / 2, S / 2, S]);
        lots.push([bx + (3 * S) / 4, bz + S / 2, S / 2, S]);
      } else {
        for (const ox of [0.25, 0.75]) for (const oz of [0.25, 0.75]) lots.push([bx + S * ox, bz + S * oz, S / 2, S / 2]);
      }
      lots.forEach(([cx, cz, lw, ld], li) => {
        const k2 = `${key}_${li}`;
        // 通り道の帯と、塔の周りは空ける
        // カメラ側（z>5）は空けて、怪獣が手前のビルに隠れないようにする
        if (cz > 5) return;
        if (Math.abs(cz) < 4.8 && cx > -24 && cx < 14) return;
        if (Math.hypot(cx - towerX, cz - towerZ) < 5) return;
        if (R(`skip${k2}`) < 0.08) return;
        const downtown = Math.max(0, 1 - Math.hypot(cx - 26, cz + 24) / 26);
        const far = cz < -30 ? 1.4 : 1;
        add({
          x: cx,
          z: cz,
          w: lw * (0.62 + R(`w${k2}`) * 0.3),
          d: ld * (0.62 + R(`d${k2}`) * 0.3),
          h: (2.2 + R(`h${k2}`) * 4 + downtown * R(`hh${k2}`) * 9) * far,
          tone: R(`t${k2}`),
          variant: Math.floor(R(`v${k2}`) * 3),
          roof: R(`r${k2}`) > 0.45,
        });
      });
    }
  }
  return list;
};

export const BUILDINGS: Building[] = build();
export const EXPLOSIONS: Spot[] = [];
export const GROUND_FIRES: Spot[] = [];
export const DUST: Spot[] = []; // 倒壊の土煙（s=大きさ）
export const COLLAPSES: { f: number; kind: "crush" | "topple" | "cut"; x: number; z: number; size: number }[] = [];

(() => {
  // 1. 踏み潰し：着地した足の下の建物
  for (const b of BUILDINGS) {
    if (b.tower) continue;
    for (const l of LANDINGS) {
      const r = rootAt(l.frame);
      const fx = r.x + 0.6;
      const fz = l.left ? 1.15 : -1.15;
      if (Math.abs(fx - b.x) < b.w / 2 + 1.5 && Math.abs(fz - b.z) < b.d / 2 + 1.1) {
        b.crushF = l.frame - 3;
        break;
      }
    }
    // 足に当たらなくても体が通過すれば潰れる
    if (b.crushF === undefined && Math.abs(b.z) < b.d / 2 + 2.6) {
      for (let f = 0; f < FRAMES; f++) {
        if (rootAt(f).x + 2.2 > b.x - b.w / 2) {
          b.crushF = f;
          break;
        }
      }
    }
  }

  // 2. 尾でなぎ倒し：尾の向きが建物の方向を通過した瞬間
  for (const t of TL.tailSweeps) {
    for (let f = t.start + 1; f < t.start + t.dur; f++) {
      const r = rootAt(f);
      const [a0x, a0z] = tailDir(f - 1);
      const [a1x, a1z] = tailDir(f);
      for (const b of BUILDINGS) {
        if (b.crushF !== undefined || b.toppleF !== undefined || b.tower) continue;
        const dx = b.x - r.x;
        const dz = b.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 3 || dist > 14.5) continue;
        const c0 = a0x * dz - a0z * dx;
        const c1 = a1x * dz - a1z * dx;
        if (c0 * c1 <= 0 && a1x * dx + a1z * dz > 0) {
          b.toppleF = f;
          b.toppleDir = [dx / dist, dz / dist];
        }
      }
    }
  }

  // 3. 熱線：着弾点の周りの建物を切断して炎上させる。周囲は延焼
  for (let f = 0; f < FRAMES; f++) {
    if (beamAmount(f) < 0.5) continue;
    const p = beamHit(f).point;
    if (f % TL.explosionEvery === 0) {
      EXPLOSIONS.push({ x: p.x + (random(`ex${f}`) - 0.5) * 1.5, z: p.z + (random(`ez${f}`) - 0.5) * 1.5, f, s: 0.8 + random(`es${f}`) * 0.6 });
    }
    if (f % 8 === 0) GROUND_FIRES.push({ x: p.x, z: p.z, f, s: 0.8 + random(`gs${f}`) * 0.5 });
    for (const b of BUILDINGS) {
      const dist = Math.hypot(b.x - p.x, b.z - p.z);
      const reach = Math.max(b.w, b.d) / 2 + 1.6;
      if (dist < reach && b.cutF === undefined && b.crushF === undefined && b.toppleF === undefined) {
        b.cutF = f;
        b.cutH = b.tower ? 0.42 : 0.3 + random(`cut${b.id}`) * 0.25;
        b.burnF = f;
      } else if (dist < reach + 4.5 && b.burnF === undefined) {
        b.burnF = f + 6 + Math.floor(random(`ign${b.id}`) * 24);
      }
    }
  }

  for (const b of BUILDINGS) {
    const ev =
      b.crushF !== undefined
        ? { f: b.crushF, kind: "crush" as const }
        : b.toppleF !== undefined
          ? { f: b.toppleF, kind: "topple" as const }
          : b.cutF !== undefined
            ? { f: b.cutF + 6, kind: "cut" as const }
            : null;
    if (ev) {
      COLLAPSES.push({ ...ev, x: b.x, z: b.z, size: Math.max(b.w, b.d) });
      DUST.push({ x: b.x, z: b.z, f: ev.f + (ev.kind === "cut" ? 10 : 2), s: Math.max(b.w, b.d) * (b.tower ? 1.6 : 1) });
    }
  }
  COLLAPSES.sort((a, b) => a.f - b.f);
})();

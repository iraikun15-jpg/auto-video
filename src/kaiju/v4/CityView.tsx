import React, { useMemo } from "react";
import * as THREE from "three";
import { Easing, interpolate, random } from "remotion";
import { Building, BUILDINGS } from "./city";
import { Flame, SmokeColumn } from "./effects";
import { TokyoTower } from "./Tower";

/** 窓明かりのテクスチャ（夜景）。1枚で 4×4 ユニット、8×8 の窓 */
const windowTex = (() => {
  const cache: THREE.CanvasTexture[] = [];
  return (variant: number) => {
    if (!cache[variant]) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d")!;
      g.fillStyle = "#000000";
      g.fillRect(0, 0, 128, 128);
      for (let r = 0; r < 8; r++) {
        for (let k = 0; k < 8; k++) {
          const v = random(`win-${variant}-${r}-${k}`);
          if (v < 0.42) continue;
          g.fillStyle = v > 0.93 ? "#cfe6ff" : v > 0.7 ? "#ffd690" : "#c9894a";
          g.globalAlpha = v > 0.7 ? 1 : 0.55;
          g.fillRect(k * 16 + 4, r * 16 + 5, 8, 7);
        }
      }
      g.globalAlpha = 1;
      // 左上の1マスは窓なし（屋根に使う）
      g.fillStyle = "#000000";
      g.fillRect(0, 0, 16, 16);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.magFilter = THREE.NearestFilter;
      t.colorSpace = THREE.SRGBColorSpace;
      cache[variant] = t;
    }
    return cache[variant];
  };
})();

/** UV をビルの大きさに合わせた箱（窓の大きさをどのビルでも揃える） */
const geoCache = new Map<string, THREE.BoxGeometry>();
const buildingGeo = (w: number, h: number, d: number) => {
  const key = `${w.toFixed(2)}|${h.toFixed(2)}|${d.toFixed(2)}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    const faceW = [d, d, w, w, w, w];
    for (let face = 0; face < 6; face++) {
      for (let v = 0; v < 4; v++) {
        const i = face * 4 + v;
        if (face === 2 || face === 3) {
          uv.setXY(i, 0.03, 0.97); // 屋上・底面は窓なし
        } else {
          uv.setXY(i, (uv.getX(i) * faceW[face]) / 4, (uv.getY(i) * h) / 4);
        }
      }
    }
    geoCache.set(key, g);
  }
  return g;
};

const BASE_A = new THREE.Color("#6d7386");
const BASE_B = new THREE.Color("#9aa0ae");
const CHAR = new THREE.Color("#1b1716");
const FIRE = new THREE.Color("#ff6a20");

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useBuildingMaterial = (b: Building, f: number) => {
  const m = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        flatShading: true,
        roughness: 0.85,
        emissiveMap: windowTex(b.variant),
        emissive: new THREE.Color("#ffffff"),
      }),
    [b.variant],
  );
  const burning = b.burnF !== undefined && f >= b.burnF ? f - b.burnF : -1;
  const char = burning >= 0 ? Math.min(1, burning / 90) : 0;
  const destroyed = (b.crushF !== undefined && f >= b.crushF) || (b.toppleF !== undefined && f >= b.toppleF + 20);
  const base = BASE_A.clone().lerp(BASE_B, b.tone);
  m.color.copy(base.lerp(CHAR, destroyed ? 0.6 : char));
  if (burning >= 0) {
    // 窓の明かりが炎の色に変わり、揺らめく
    const fl = 0.8 + 0.4 * Math.sin(f * 0.7 + b.id) + 0.2 * Math.sin(f * 1.9 + b.id * 3);
    m.emissive.copy(FIRE);
    m.emissiveIntensity = (1.4 - char * 0.5) * fl;
  } else {
    m.emissive.set("#ffffff");
    m.emissiveIntensity = destroyed ? 0 : 0.55;
  }
  return m;
};

const Rooftop: React.FC<{ b: Building; mat: THREE.Material; h: number }> = ({ b, mat, h }) =>
  b.roof ? (
    <mesh position={[b.w * 0.15, h, -b.d * 0.1]} material={mat} castShadow geometry={buildingGeo(b.w * 0.35, 0.7, b.d * 0.35)} />
  ) : null;

const BuildingMesh: React.FC<{ b: Building; f: number }> = ({ b, f }) => {
  const mat = useBuildingMaterial(b, f);
  const fireOn = b.burnF !== undefined && f >= b.burnF;

  // 踏み潰し：一気につぶれて、平たい瓦礫に
  if (b.crushF !== undefined && f >= b.crushF) {
    const t = interpolate(f - b.crushF, [0, 9], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const sy = 1 - 0.86 * t;
    return (
      <group position={[b.x, 0, b.z]} rotation={[0.08 * t, b.id, -0.06 * t]}>
        <mesh material={mat} geometry={buildingGeo(b.w * (1 + 0.25 * t), b.h * sy, b.d * (1 + 0.25 * t))} castShadow receiveShadow />
      </group>
    );
  }

  // 尾でなぎ倒し：根元の縁を支点に倒れながら沈む
  if (b.toppleF !== undefined && f >= b.toppleF) {
    const t = interpolate(f - b.toppleF, [0, 26], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const [dx, dz] = b.toppleDir ?? [1, 0];
    const half = Math.max(b.w, b.d) / 2;
    const angle = 1.45 * t;
    const axis = new THREE.Vector3(dz, 0, -dx).normalize();
    const q = new THREE.Quaternion().setFromAxisAngle(axis, -angle);
    const sink = interpolate(f - b.toppleF, [18, 40], [0, b.h * 0.25], clamp);
    return (
      <group position={[b.x + dx * half, -sink, b.z + dz * half]} quaternion={q}>
        <mesh position={[-dx * half, 0, -dz * half]} material={mat} geometry={buildingGeo(b.w, b.h, b.d)} castShadow receiveShadow />
      </group>
    );
  }

  // 熱線で切断：上部が滑り落ちて倒れ、下部は炎上
  if (b.cutF !== undefined && f >= b.cutF && !b.tower) {
    const ch = b.h * (b.cutH ?? 0.4);
    const top = b.h - ch;
    const t = interpolate(f - b.cutF, [3, 30], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const dir = random(`cutdir${b.id}`) > 0.5 ? 1 : -1;
    const fall = Math.min(1, t);
    return (
      <group position={[b.x, 0, b.z]}>
        <mesh material={mat} geometry={buildingGeo(b.w, ch, b.d)} castShadow receiveShadow />
        <group position={[dir * b.w * 0.5 + dir * fall * 1.2, ch * (1 - fall) - fall * top * 0.25, 0]} rotation={[0, 0, -dir * fall * 1.35]}>
          <mesh position={[-dir * b.w * 0.5, 0, 0]} material={mat} geometry={buildingGeo(b.w, top, b.d)} castShadow />
        </group>
        <Flame x={0} y={ch} z={0} f={f} scale={Math.max(b.w, b.d) * 0.75} seed={b.id} />
      </group>
    );
  }

  return (
    <group position={[b.x, 0, b.z]}>
      <mesh material={mat} geometry={buildingGeo(b.w, b.h, b.d)} castShadow receiveShadow />
      <Rooftop b={b} mat={mat} h={b.h} />
      {fireOn ? <Flame x={0} y={b.h} z={0} f={f} scale={Math.max(b.w, b.d) * 0.6 * Math.min(1, (f - b.burnF!) / 20)} seed={b.id} /> : null}
    </group>
  );
};

export const City: React.FC<{ f: number }> = ({ f }) => (
  <>
    {BUILDINGS.map((b) =>
      b.tower ? (
        <TokyoTower key={b.id} x={b.x} z={b.z} h={b.h} f={f} cutF={b.cutF} cutH={b.cutH} />
      ) : (
        <BuildingMesh key={b.id} b={b} f={f} />
      ),
    )}
    {/* 燃えているビルからの煙 */}
    {BUILDINGS.filter((b) => b.burnF !== undefined && f >= b.burnF).map((b) => (
      <SmokeColumn key={`smoke-${b.id}`} x={b.x} y={b.cutF !== undefined ? b.h * (b.cutH ?? 0.4) : b.h} z={b.z} f={f} start={b.burnF!} size={Math.max(b.w, b.d) * 0.5} seed={b.id} puffs={3} />
    ))}
  </>
);

/** 遠景のビル群（シルエット＋まばらな窓） */
export const Skyline: React.FC = () => {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#7a7f90", flatShading: true, emissiveMap: windowTex(1), emissive: "#ffffff", emissiveIntensity: 0.3 }),
    [],
  );
  return (
    <>
      {Array.from({ length: 46 }).map((_, i) => {
        const x = -30 + i * 3.4 + random(`sx${i}`) * 2;
        const z = -70 - random(`sz${i}`) * 25;
        const w = 2.5 + random(`sw${i}`) * 3;
        const h = 5 + random(`sh${i}`) * 16;
        return <mesh key={i} position={[x, 0, z]} material={mat} geometry={buildingGeo(w, h, w)} />;
      })}
    </>
  );
};

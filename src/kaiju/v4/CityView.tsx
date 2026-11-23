import React, { useMemo } from "react";
import * as THREE from "three";
import { Easing, interpolate, random } from "remotion";
import { Building, BUILDINGS } from "./city";
import { Flame, SmokeColumn } from "./effects";

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

const BASE_A = new THREE.Color("#3d4456");
const BASE_B = new THREE.Color("#5d6478");
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
    m.emissiveIntensity = destroyed ? 0 : 0.95;
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

/** 赤い塔（様式化したランドマーク）。熱線で上部が切り落とされる */
const TowerMesh: React.FC<{ b: Building; f: number }> = ({ b, f }) => {
  const red = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d8432c", flatShading: true, roughness: 0.6, emissive: "#5a0d04", emissiveIntensity: 0.6 }), []);
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e8e2da", flatShading: true, roughness: 0.6, emissive: "#3a3a3a", emissiveIntensity: 0.5 }), []);
  const H = b.h;
  const cut = b.cutF !== undefined && f >= b.cutF ? H * (b.cutH ?? 0.42) : Infinity;
  const char = b.cutF !== undefined && f >= b.cutF ? Math.min(1, (f - b.cutF) / 80) : 0;
  red.color.set("#d8432c").lerp(new THREE.Color("#2a1410"), char * 0.7);
  const width = (y: number) => 2.6 * (1 - (y / H) * 0.85);
  const parts: { y0: number; y1: number; node: (key: string) => React.ReactNode }[] = [];
  // 脚（4本、上に向かって内側へ）
  const legSegs = 8;
  for (let i = 0; i < legSegs; i++) {
    const y0 = (i / legSegs) * H * 0.92;
    const y1 = ((i + 1) / legSegs) * H * 0.92;
    const mat = i % 2 ? white : red;
    for (const [sx, sz] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const a: [number, number, number] = [(sx * width(y0)) / 2, y0, (sz * width(y0)) / 2];
      const c: [number, number, number] = [(sx * width(y1)) / 2, y1, (sz * width(y1)) / 2];
      const len = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
      const mid: [number, number, number] = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
      const tilt = Math.atan2(Math.hypot(c[0] - a[0], c[2] - a[2]), c[1] - a[1]);
      parts.push({
        y0,
        y1,
        node: (k) => (
          <mesh key={k} position={mid} material={mat} rotation={[sz * tilt * 0.7, 0, -sx * tilt * 0.7]} castShadow>
            <boxGeometry args={[0.22, len, 0.22]} />
          </mesh>
        ),
      });
    }
    // 水平の梁
    parts.push({
      y0: y1,
      y1,
      node: (k) => (
        <mesh key={k} position={[0, y1, 0]} material={i % 2 ? red : white} castShadow>
          <boxGeometry args={[width(y1) + 0.2, 0.16, width(y1) + 0.2]} />
        </mesh>
      ),
    });
  }
  // 展望台2つとアンテナ
  for (const [y, s] of [
    [H * 0.36, 1.5],
    [H * 0.62, 0.9],
  ] as const) {
    parts.push({
      y0: y,
      y1: y,
      node: (k) => (
        <mesh key={k} position={[0, y, 0]} material={white} castShadow>
          <boxGeometry args={[width(y) * s, 0.7, width(y) * s]} />
        </mesh>
      ),
    });
  }
  parts.push({
    y0: H * 0.92,
    y1: H,
    node: (k) => (
      <mesh key={k} position={[0, H * 0.96, 0]} material={red} castShadow>
        <cylinderGeometry args={[0.05, 0.14, H * 0.12, 5]} />
      </mesh>
    ),
  });

  const lower = parts.filter((p) => p.y1 <= cut);
  const upper = parts.filter((p) => p.y1 > cut);
  const t = b.cutF !== undefined ? interpolate(f - b.cutF, [4, 44], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  return (
    <group position={[b.x, 0, b.z]}>
      {lower.map((p, i) => p.node(`l${i}`))}
      {cut < Infinity ? (
        <group position={[0, cut - t * cut * 0.55, 0]} rotation={[0.25 * t, 0, 1.25 * t]}>
          <group position={[0, -cut, 0]}>{upper.map((p, i) => p.node(`u${i}`))}</group>
        </group>
      ) : (
        upper.map((p, i) => p.node(`u${i}`))
      )}
      {cut < Infinity ? <Flame x={0} y={cut} z={0} f={f} scale={1.4} seed={99} /> : null}
    </group>
  );
};

export const City: React.FC<{ f: number }> = ({ f }) => (
  <>
    {BUILDINGS.map((b) => (b.tower ? <TowerMesh key={b.id} b={b} f={f} /> : <BuildingMesh key={b.id} b={b} f={f} />))}
    {/* 燃えているビルからの煙 */}
    {BUILDINGS.filter((b) => b.burnF !== undefined && f >= b.burnF).map((b) => (
      <SmokeColumn key={`smoke-${b.id}`} x={b.x} y={b.cutF !== undefined ? b.h * (b.cutH ?? 0.4) : b.h} z={b.z} f={f} start={b.burnF!} size={Math.max(b.w, b.d) * 0.5} seed={b.id} puffs={3} />
    ))}
  </>
);

/** 遠景のビル群（シルエット＋まばらな窓） */
export const Skyline: React.FC = () => {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1c2030", flatShading: true, emissiveMap: windowTex(1), emissive: "#ffffff", emissiveIntensity: 0.45 }),
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

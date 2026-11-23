import React, { useMemo } from "react";
import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import { Flame } from "./effects";

/**
 * 東京タワー風の赤い電波塔（ローポリの様式化デザイン。精密な再現はしない）
 * - 裾が大きく広がる4本脚の鉄骨、各面にX字の筋交い
 * - 足元のアーチ、大展望台・特別展望台の2つの展望台、上部のアンテナ
 * - 赤（インターナショナルオレンジ）と白の帯
 * cutAt を渡すと、その高さより上の部分が倒れ落ちる（熱線で切断される演出）。
 */

type P = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 2点を結ぶ角材 */
const Strut: React.FC<{ a: P; b: P; t: number; mat: THREE.Material }> = ({ a, b, t, mat }) => {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()),
      len: d.length(),
    };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={mat} castShadow>
      <boxGeometry args={[t, len, t]} />
    </mesh>
  );
};

type Part = { y: number; node: (k: string) => React.ReactNode };

export const TokyoTower: React.FC<{ x: number; z: number; h: number; f: number; cutF?: number; cutH?: number }> = ({ x, z, h: H, f, cutF, cutH }) => {
  const mats = useMemo(
    () => ({
      orange: new THREE.MeshStandardMaterial({ color: "#e8501e", flatShading: true, roughness: 0.55, emissive: "#5a1606", emissiveIntensity: 0.5 }),
      white: new THREE.MeshStandardMaterial({ color: "#f2eee6", flatShading: true, roughness: 0.55, emissive: "#3a3632", emissiveIntensity: 0.4 }),
      deck: new THREE.MeshStandardMaterial({ color: "#c9ccd4", flatShading: true, roughness: 0.4, metalness: 0.2 }),
      glass: new THREE.MeshStandardMaterial({ color: "#2a3448", emissive: "#ffd9a0", emissiveIntensity: 1.1, flatShading: true }),
      lamp: new THREE.MeshBasicMaterial({ color: "#ff3020" }),
    }),
    [],
  );
  const burned = cutF !== undefined && f >= cutF ? Math.min(1, (f - cutF) / 90) : 0;
  mats.orange.color.set("#e8501e").lerp(new THREE.Color("#2a1410"), burned * 0.6);
  mats.white.color.set("#f2eee6").lerp(new THREE.Color("#3a2e2a"), burned * 0.6);

  const FRAME_TOP = H * 0.8;
  // 断面の半幅：裾が大きく広がる曲線
  const half = (y: number) => 0.45 + 3.6 * Math.pow(Math.max(0, 1 - y / FRAME_TOP), 2.3);
  // 帯の色：下半分は赤、上は赤白の交互
  const band = (y: number) => {
    const u = y / FRAME_TOP;
    if (u < 0.42) return mats.orange;
    return Math.floor((u - 0.42) / 0.0835) % 2 === 0 ? mats.white : mats.orange;
  };

  const parts: Part[] = [];
  const LEVELS = 14;
  const ys = Array.from({ length: LEVELS + 1 }, (_, i) => FRAME_TOP * Math.pow(i / LEVELS, 1.15));
  const corners = (y: number): P[] => {
    const w = half(y);
    return [
      [w, y, w],
      [w, y, -w],
      [-w, y, -w],
      [-w, y, w],
    ];
  };
  for (let i = 0; i < LEVELS; i++) {
    const y0 = ys[i];
    const y1 = ys[i + 1];
    const c0 = corners(y0);
    const c1 = corners(y1);
    const m = band((y0 + y1) / 2);
    const thick = 0.16 + 0.22 * (1 - i / LEVELS);
    for (let k = 0; k < 4; k++) {
      // 脚
      parts.push({ y: y1, node: (key) => <Strut key={key} a={c0[k]} b={c1[k]} t={thick} mat={m} /> });
      // 水平の梁
      const n = (k + 1) % 4;
      parts.push({ y: y1, node: (key) => <Strut key={key} a={c1[k]} b={c1[n]} t={thick * 0.6} mat={m} /> });
      // X字の筋交い
      if (i > 0 || true) {
        parts.push({ y: y1, node: (key) => <Strut key={key} a={c0[k]} b={c1[n]} t={thick * 0.45} mat={m} /> });
        parts.push({ y: y1, node: (key) => <Strut key={key} a={c0[n]} b={c1[k]} t={thick * 0.45} mat={m} /> });
      }
    }
  }
  // 足元のアーチ（各面）
  const base = corners(0);
  for (let k = 0; k < 4; k++) {
    const a = base[k];
    const b = base[(k + 1) % 4];
    const SEG = 6;
    const pts: P[] = Array.from({ length: SEG + 1 }, (_, s) => {
      const t = s / SEG;
      const ax = a[0] + (b[0] - a[0]) * t;
      const az = a[2] + (b[2] - a[2]) * t;
      const inset = half(0) - half(2.2 * Math.sin(Math.PI * t));
      // 面の内側へ少し入りながら持ち上がる
      const nx = Math.sign(a[0] + b[0]) * (a[0] === -b[0] ? 0 : 1);
      const nz = Math.sign(a[2] + b[2]) * (a[2] === -b[2] ? 0 : 1);
      return [ax - nx * inset, 2.4 * Math.sin(Math.PI * t), az - nz * inset];
    });
    for (let s = 0; s < SEG; s++) {
      parts.push({ y: 2.4, node: (key) => <Strut key={key} a={pts[s]} b={pts[s + 1]} t={0.32} mat={mats.orange} /> });
    }
  }
  // 展望台（大展望台・特別展望台）
  for (const [u, size, tall] of [
    [0.45, 1.5, 1.3],
    [0.75, 1.15, 0.8],
  ] as const) {
    const y = FRAME_TOP * u;
    const w = half(y) * 2 * size + 0.6;
    parts.push({
      y,
      node: (key) => (
        <group key={key} position={[0, y, 0]}>
          <mesh material={mats.deck} castShadow>
            <cylinderGeometry args={[w * 0.62, w * 0.55, tall, 8]} />
          </mesh>
          <mesh material={mats.glass} position={[0, tall * 0.08, 0]}>
            <cylinderGeometry args={[w * 0.635, w * 0.62, tall * 0.42, 8]} />
          </mesh>
          <mesh material={mats.white} position={[0, tall * 0.55, 0]}>
            <cylinderGeometry args={[w * 0.4, w * 0.6, 0.18, 8]} />
          </mesh>
        </group>
      ),
    });
  }
  // アンテナ（赤白の帯）と航空障害灯
  const ANT = 5;
  for (let i = 0; i < ANT; i++) {
    const y0 = FRAME_TOP + ((H - FRAME_TOP) * i) / ANT;
    const y1 = FRAME_TOP + ((H - FRAME_TOP) * (i + 1)) / ANT;
    const r = 0.32 * (1 - i / ANT) + 0.06;
    parts.push({
      y: y1,
      node: (key) => (
        <mesh key={key} position={[0, (y0 + y1) / 2, 0]} material={i % 2 ? mats.white : mats.orange} castShadow>
          <cylinderGeometry args={[r * 0.85, r, y1 - y0, 6]} />
        </mesh>
      ),
    });
  }
  parts.push({
    y: H,
    node: (key) => (
      <mesh key={key} position={[0, H + 0.1, 0]} material={mats.lamp}>
        <icosahedronGeometry args={[0.22, 0]} />
      </mesh>
    ),
  });

  const cut = cutF !== undefined && f >= cutF ? H * (cutH ?? 0.42) : Infinity;
  const lower = parts.filter((p) => p.y <= cut);
  const upper = parts.filter((p) => p.y > cut);
  const t = cutF !== undefined ? interpolate(f - cutF, [4, 50], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  return (
    <group position={[x, 0, z]}>
      {lower.map((p, i) => p.node(`lo-${i}`))}
      {cut < Infinity ? (
        <>
          {/* 切断面を支点に傾き、落ちながら倒れる */}
          <group position={[0, cut - t * cut * 0.7, 0]} rotation={[-0.35 * t, 0, -1.3 * t]}>
            <group position={[0, -cut, 0]}>{upper.map((p, i) => p.node(`up-${i}`))}</group>
          </group>
          <Flame x={0} y={cut} z={0} f={f} scale={2.2} seed={99} />
        </>
      ) : (
        upper.map((p, i) => p.node(`up-${i}`))
      )}
    </group>
  );
};

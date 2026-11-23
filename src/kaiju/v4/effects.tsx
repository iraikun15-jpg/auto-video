import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";

/** 炎・煙・爆発・土煙・火の粉（すべてフレーム番号から決まる） */

const ico0 = new THREE.IcosahedronGeometry(1, 0);
const ico1 = new THREE.IcosahedronGeometry(1, 1);
const cone = new THREE.ConeGeometry(1, 1, 6);
cone.translate(0, 0.5, 0);

const addMat = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });

const FLAME_COLORS = ["#ff5a1a", "#ff9a2a", "#ffd56a"];

/** 炎の塊。scale=大きさ、seed で揺らぎを変える */
export const Flame: React.FC<{ x: number; y: number; z: number; f: number; scale: number; seed: number; opacity?: number }> = ({
  x,
  y,
  z,
  f,
  scale,
  seed,
  opacity = 1,
}) => {
  const mats = useMemo(() => FLAME_COLORS.map((c, i) => addMat(c, [0.75, 0.7, 0.85][i])), []);
  mats.forEach((m, i) => (m.opacity = [0.75, 0.7, 0.85][i] * opacity));
  return (
    <group position={[x, y, z]} scale={scale}>
      {[0, 1, 2, 3].map((k) => {
        const ph = seed * 7.3 + k * 2.1;
        const fl = 0.75 + 0.35 * Math.sin(f * 0.9 + ph) + 0.15 * Math.sin(f * 2.3 + ph * 1.7);
        const ox = Math.cos(ph) * 0.45 * (k ? 1 : 0);
        const oz = Math.sin(ph) * 0.45 * (k ? 1 : 0);
        const ci = k === 0 ? 0 : k === 3 ? 2 : 1;
        const w = k === 3 ? 0.32 : 0.55 - k * 0.06;
        return (
          <mesh
            key={k}
            geometry={cone}
            material={mats[ci]}
            position={[ox, 0, oz]}
            scale={[w, (1.6 - k * 0.2) * fl, w]}
            rotation={[0, ph, Math.sin(f * 0.5 + ph) * 0.12]}
          />
        );
      })}
    </group>
  );
};

const smokeMats = new Map<number, THREE.MeshStandardMaterial>();
const smokeMat = (o: number) => {
  const k = Math.round(o * 20);
  let m = smokeMats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: "#2a2422", transparent: true, opacity: k / 20, flatShading: true, depthWrite: false, roughness: 1 });
    smokeMats.set(k, m);
  }
  return m;
};

/** 立ちのぼる煙の柱（puffs 個の塊が周期的に上がる） */
export const SmokeColumn: React.FC<{ x: number; y: number; z: number; f: number; start: number; size: number; seed: number; puffs?: number }> = ({
  x,
  y,
  z,
  f,
  start,
  size,
  seed,
  puffs = 4,
}) => {
  const age = f - start;
  if (age < 0) return null;
  const PERIOD = 80;
  const grow = Math.min(1, age / 40);
  return (
    <group>
      {Array.from({ length: puffs }).map((_, i) => {
        const t = ((age + (i * PERIOD) / puffs + seed * 13) % PERIOD) / PERIOD;
        const born = age - t * PERIOD;
        if (born < 0) return null;
        const r = size * (0.7 + t * 2.2) * grow;
        const op = 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.4)) * (1 - t * 0.4);
        return (
          <mesh
            key={i}
            geometry={ico0}
            material={smokeMat(Math.max(0.05, op))}
            position={[x + t * 6 + Math.sin(seed + i) * 0.6, y + 1 + t * 14 * Math.max(0.6, size / 2), z - t * 2]}
            scale={[r, r * 0.8, r]}
            rotation={[seed + i, t * 2, i]}
          />
        );
      })}
    </group>
  );
};

/** 爆発：白い閃光→火球→黒煙 */
export const Explosion: React.FC<{ x: number; z: number; f: number; start: number; s: number }> = ({ x, z, f, start, s }) => {
  const t = f - start;
  const mats = useMemo(() => [addMat("#fff4d8", 1), addMat("#ff8a2a", 0.9), addMat("#c23a10", 0.6)], []);
  if (t < 0 || t > 90) return null;
  const fb = Math.min(1, t / 14);
  const fade = Math.max(0, 1 - t / 26);
  mats[0].opacity = Math.max(0, 1 - t / 5);
  mats[1].opacity = 0.9 * fade;
  mats[2].opacity = 0.6 * fade;
  return (
    <group position={[x, 0, z]}>
      {t < 6 ? <mesh geometry={ico1} material={mats[0]} position={[0, 1.2 * s, 0]} scale={(1.4 + t * 0.8) * s} /> : null}
      {t < 28 ? (
        <>
          <mesh geometry={ico1} material={mats[1]} position={[0, (1 + fb * 2.2) * s, 0]} scale={(1 + fb * 3) * s} rotation={[t * 0.05, t * 0.07, 0]} />
          <mesh geometry={ico0} material={mats[2]} position={[0.6 * s, (0.8 + fb * 3) * s, 0.4 * s]} scale={(0.8 + fb * 3.6) * s} />
        </>
      ) : null}
      {t > 10 ? (
        <mesh
          geometry={ico0}
          material={smokeMat(Math.max(0.05, 0.55 * (1 - (t - 10) / 80)))}
          position={[(t - 10) * 0.05, (2.5 + (t - 10) * 0.12) * s, 0]}
          scale={(2 + (t - 10) * 0.05) * s}
          rotation={[t * 0.02, 0, 0]}
        />
      ) : null}
    </group>
  );
};

const dustMats = new Map<number, THREE.MeshStandardMaterial>();
const dustMat = (o: number) => {
  const k = Math.round(o * 20);
  let m = dustMats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: "#6b625a", transparent: true, opacity: k / 20, flatShading: true, depthWrite: false, roughness: 1 });
    dustMats.set(k, m);
  }
  return m;
};

/** 倒壊の土煙：根元から外へ広がって薄れる */
export const Dust: React.FC<{ x: number; z: number; f: number; start: number; s: number; seed: number }> = ({ x, z, f, start, s, seed }) => {
  const t = f - start;
  if (t < 0 || t > 80) return null;
  const u = t / 80;
  const spread = s * (0.6 + Math.sqrt(u) * 1.6);
  const op = 0.6 * (1 - u) * Math.min(1, t / 4);
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2 + seed;
        const r = spread * (0.6 + random(`d${seed}${i}`) * 0.5);
        return (
          <mesh
            key={i}
            geometry={ico0}
            material={dustMat(op)}
            position={[Math.cos(a) * r * 0.7, s * 0.35 + u * s * 0.8 + i * 0.1, Math.sin(a) * r * 0.7]}
            scale={spread * 0.55}
            rotation={[a, a * 2, 0]}
          />
        );
      })}
    </group>
  );
};

/** 破片：倒壊時に外へ飛び散る小さな塊 */
export const Debris: React.FC<{ x: number; z: number; f: number; start: number; size: number; seed: number; color: string }> = ({
  x,
  z,
  f,
  start,
  size,
  seed,
  color,
}) => {
  const t = (f - start) / 30;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 }), [color]);
  if (t < 0 || t > 3) return null;
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = random(`dbA${seed}${i}`) * Math.PI * 2;
        const v = 4 + random(`dbV${seed}${i}`) * 6;
        const vy = 6 + random(`dbY${seed}${i}`) * 8;
        const tt = Math.min(t, 1.1);
        const y = Math.max(0.15, size * 0.5 + vy * tt - 12 * tt * tt);
        const c = 0.25 + random(`dbS${seed}${i}`) * 0.35;
        return (
          <mesh
            key={i}
            material={mat}
            position={[Math.cos(a) * v * tt, y, Math.sin(a) * v * tt]}
            rotation={[t * 5 + i, t * 3, i]}
            scale={c * size * 0.5}
          >
            <boxGeometry />
          </mesh>
        );
      })}
    </group>
  );
};

/** 火の粉：火元から舞い上がる光の粒 */
export const Embers: React.FC<{ f: number; sources: { x: number; y: number; z: number }[]; count: number }> = ({ f, sources, count }) => {
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#ffb35a",
        size: 0.32,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  );
  const n = sources.length ? count : 0;
  const pos = new Float32Array(Math.max(1, n) * 3);
  for (let i = 0; i < n; i++) {
    const src = sources[i % sources.length];
    const life = 50 + random(`emL${i}`) * 60;
    const t = ((f + random(`emP${i}`) * life) % life) / life;
    const ang = random(`emA${i}`) * Math.PI * 2;
    const spread = 0.5 + random(`emS${i}`) * 2.5;
    pos[i * 3] = src.x + Math.cos(ang) * spread * (0.3 + t) + t * 5 + Math.sin(f * 0.1 + i) * 0.6;
    pos[i * 3 + 1] = src.y + t * (8 + random(`emH${i}`) * 12);
    pos[i * 3 + 2] = src.z + Math.sin(ang) * spread * (0.3 + t);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setDrawRange(0, n);
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

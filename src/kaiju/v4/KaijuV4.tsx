import React, { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FinGlowContext, KaijuModelV2 } from "../ModelV2";
import { BUILDINGS, DUST, EXPLOSIONS, GROUND_FIRES, COLLAPSES } from "./city";
import { City, Skyline } from "./CityView";
import { Debris, Dust, Embers, Explosion, Flame, SmokeColumn } from "./effects";
import { beamAmount, beamHit, chargeAmount, finGlow, MOUTH_LOCAL, poseAt, rootAt, shakeAt, TL } from "./motion";

export const KAIJU_V4_FRAMES = TL.frames;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.inOut(Easing.cubic);

// ---- カメラ（x は怪獣の位置からの相対、y と z は絶対） ----
type Cam = { p: [number, number, number]; l: [number, number, number]; fov: number };
const CAM_KEYS: [number, Cam][] = [
  [0, { p: [7, 10, 50], l: [4, 7.5, -10], fov: 40 }], // 引き：海から現れる怪獣と街
  [120, { p: [9, 9, 46], l: [5, 8, -8], fov: 40 }],
  [165, { p: [17, 4.5, 40], l: [3, 8.5, 0], fov: 42 }], // 足元から見上げる
  [440, { p: [15, 4.5, 38], l: [3, 8.5, 0], fov: 42 }],
  [475, { p: [-15, 10, 30], l: [-1, 9, 0], fov: 42 }], // 背びれのチャージ
  [528, { p: [-13, 10, 31], l: [0, 9, 0], fov: 42 }],
  [552, { p: [4, 14, 50], l: [16, 4, -6], fov: 44 }], // 熱線のなぎ払い
  [722, { p: [6, 13, 50], l: [15, 4, -4], fov: 44 }],
  [762, { p: [17, 5, 40], l: [3, 8.5, 0], fov: 42 }],
  [870, { p: [16, 5, 40], l: [3, 8.5, 0], fov: 42 }],
  [892, { p: [8, 10, 46], l: [14, 5, -4], fov: 44 }], // 短い熱線
  [990, { p: [9, 10, 46], l: [13, 5, -4], fov: 44 }],
  [1024, { p: [16, 5, 40], l: [3, 8.5, 0], fov: 42 }],
  [1062, { p: [16, 5.5, 42], l: [3, 8.5, 0], fov: 42 }],
  [1170, { p: [12, 15, 84], l: [3, 9, -10], fov: 40 }], // 引いて締め
  [1200, { p: [12.5, 15.2, 86], l: [3, 9, -10], fov: 40 }],
];

const camAt = (f: number): Cam => {
  if (f <= CAM_KEYS[0][0]) return CAM_KEYS[0][1];
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const [f0, a] = CAM_KEYS[i];
    const [f1, b] = CAM_KEYS[i + 1];
    if (f <= f1) {
      const t = io((f - f0) / (f1 - f0));
      const m = (u: number, v: number) => u + (v - u) * t;
      return { p: [m(a.p[0], b.p[0]), m(a.p[1], b.p[1]), m(a.p[2], b.p[2])], l: [m(a.l[0], b.l[0]), m(a.l[1], b.l[1]), m(a.l[2], b.l[2])], fov: m(a.fov, b.fov) };
    }
  }
  return CAM_KEYS[CAM_KEYS.length - 1][1];
};

const noise = (f: number, s: number) => Math.sin(f * 1.73 + s) * 0.6 + Math.sin(f * 3.11 + s * 2.3) * 0.4;

const CameraRig: React.FC<{ f: number }> = ({ f }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  // 怪獣の位置は少し遅らせて追う（カメラが滑らかになる）
  const kx = (rootAt(f).x + rootAt(f - 6).x + rootAt(f - 12).x) / 3;
  const c = camAt(f);
  const sh = shakeAt(f);
  camera.position.set(kx + c.p[0] + noise(f, 1) * sh, c.p[1] + noise(f, 2) * sh, c.p[2] + noise(f, 3) * sh * 0.5);
  camera.fov = c.fov;
  camera.near = 0.5;
  camera.far = 400;
  camera.updateProjectionMatrix();
  camera.lookAt(kx + c.l[0] + noise(f, 4) * sh * 0.6, c.l[1] + noise(f, 5) * sh * 0.6, c.l[2]);
  return null;
};

// ---- 地面（道路の碁盤目）と海 ----
const groundTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (!t) {
      const c = document.createElement("canvas");
      c.width = c.height = 190;
      const g = c.getContext("2d")!;
      g.fillStyle = "#14161d";
      g.fillRect(0, 0, 190, 190);
      g.fillStyle = "#23262f";
      g.fillRect(0, 0, 140, 140); // 街区（7/9.5）
      g.fillStyle = "#4a4436";
      for (let i = 0; i < 190; i += 16) g.fillRect(162, i, 3, 8); // 中央線
      t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
    }
    return t;
  };
})();

const Ground: React.FC = () => {
  const tex = useMemo(() => {
    const t = groundTex().clone();
    t.needsUpdate = true;
    // 1リピート = 9.5ユニット。街区の原点 (-21, -50) に合わせる
    t.repeat.set(140 / 9.5, 180 / 9.5);
    t.offset.set((-24 + 21) / 9.5, (50 - 120 - 50) / 9.5);
    return t;
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[46, 0, -30]} receiveShadow>
        <planeGeometry args={[140, 180]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      {/* 海：簡単な平面＋夕空を映したような色 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-94, 0.05, -30]} receiveShadow>
        <planeGeometry args={[140, 180]} />
        <meshStandardMaterial color="#1a2c48" roughness={0.25} metalness={0.4} emissive="#2a1c30" emissiveIntensity={0.6} />
      </mesh>
      {/* 岸壁 */}
      <mesh position={[-24.2, -0.4, -30]}>
        <boxGeometry args={[0.6, 1.2, 180]} />
        <meshStandardMaterial color="#3a3d46" flatShading />
      </mesh>
    </>
  );
};

/** 熱線（頭の座標系の中に置くので、頭と一緒に動く） */
const Beam: React.FC<{ f: number }> = ({ f }) => {
  const a = beamAmount(f);
  const charge = chargeAmount(f);
  const len = beamHit(f).len;
  const mats = useMemo(
    () =>
      ["#ffffff", "#a8ecff", "#3c9dff"].map(
        (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
      ),
    [],
  );
  const fl = 0.9 + 0.1 * Math.sin(f * 2.7) + 0.06 * Math.sin(f * 5.3);
  mats[0].opacity = a;
  mats[1].opacity = 0.65 * a;
  mats[2].opacity = 0.28 * a + 0.5 * charge;
  return (
    <group position={MOUTH_LOCAL.toArray()}>
      {a > 0.01 ? (
        <group rotation={[0, 0, -Math.PI / 2]}>
          {[0.3, 0.65, 1.3].map((r, i) => (
            <mesh key={i} material={mats[i]} position={[0, len / 2, 0]} scale={[r * fl * (0.6 + 0.4 * a), len, r * fl * (0.6 + 0.4 * a)]}>
              <cylinderGeometry args={[1, 0.75, 1, 10, 1, true]} />
            </mesh>
          ))}
        </group>
      ) : null}
      {/* 口元の光 */}
      {a + charge > 0.01 ? (
        <mesh material={mats[2]} scale={0.6 + charge * 0.8 + a * 1.2}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ) : null}
      <pointLight color="#8fd8ff" intensity={(a * 60 + charge * 12) * fl} distance={45} decay={1.6} />
    </group>
  );
};

/** 着弾点の光と爆炎 */
const Impact: React.FC<{ f: number }> = ({ f }) => {
  const a = beamAmount(f);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff0d0", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  if (a < 0.05) return null;
  const p = beamHit(f).point;
  mat.opacity = a * 0.9;
  return (
    <group position={[p.x, 0.5, p.z]}>
      <mesh material={mat} scale={2.2 + Math.sin(f * 2.1) * 0.4}>
        <icosahedronGeometry args={[1, 1]} />
      </mesh>
      <pointLight color="#ffb070" intensity={a * 140} distance={40} decay={1.7} position={[0, 2, 0]} />
    </group>
  );
};

const Scene: React.FC<{ f: number }> = ({ f }) => {
  const root = rootAt(f);
  const pose = poseAt(f);
  const glow = finGlow(f);
  const fire = interpolate(f, [540, 760, 1100], [0, 0.6, 1], clamp);
  const fogColor = new THREE.Color("#2b2236").lerp(new THREE.Color("#3a1912"), fire);

  // 燃えている場所（火の粉と炎の照り返し用）
  const sources = [
    ...BUILDINGS.filter((b) => b.burnF !== undefined && f >= b.burnF).map((b) => ({ x: b.x, y: b.cutF !== undefined ? b.h * (b.cutH ?? 0.4) : b.h, z: b.z })),
    ...GROUND_FIRES.filter((g) => f >= g.f).map((g) => ({ x: g.x, y: 0.5, z: g.z })),
  ];
  const fireCenter = sources.length
    ? sources.reduce((a, s) => ({ x: a.x + s.x / sources.length, z: a.z + s.z / sources.length }), { x: 0, z: 0 })
    : { x: 20, z: -10 };

  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(root.x, 0, 0);
  target.updateMatrixWorld();

  return (
    <>
      <CameraRig f={f} />
      <fog attach="fog" args={[fogColor, 45, 190]} />
      <hemisphereLight args={["#5a5a8c", "#1a1210", 0.75]} />
      {/* 主光源：夕日の残光（後ろ左から低く）。怪獣の周りに影を落とす */}
      <primitive object={target} />
      <directionalLight
        position={[root.x - 30, 22, -26]}
        target={target}
        color="#ffb08a"
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-far={120}
        shadow-bias={-0.0006}
      />
      {/* 正面からの弱い補助光（怪獣の顔が真っ黒にならないように） */}
      <directionalLight position={[root.x + 20, 14, 40]} color="#8a93c8" intensity={0.95} />
      {/* 炎の照り返し */}
      <pointLight color="#ff6a2a" position={[fireCenter.x, 6, fireCenter.z]} intensity={Math.min(1, sources.length / 12) * 220} distance={70} decay={1.5} />

      <Ground />
      <Skyline />
      <City f={f} />

      {/* 怪獣 */}
      <group position={[root.x, root.y, 0]} rotation={[0, root.yaw, 0]}>
        <FinGlowContext.Provider value={glow}>
          <KaijuModelV2 pose={pose} headExtra={<Beam f={f} />} />
        </FinGlowContext.Provider>
      </group>
      {glow > 0.05 ? <pointLight color="#8fdcff" position={[root.x - 3, 10, 0]} intensity={glow * 25} distance={22} decay={1.5} /> : null}

      <Impact f={f} />
      {EXPLOSIONS.map((e, i) =>
        f >= e.f && f < e.f + 90 ? <Explosion key={`ex-${i}`} x={e.x} z={e.z} f={f} start={e.f} s={e.s * 1.6} /> : null,
      )}
      {GROUND_FIRES.map((g, i) =>
        f < g.f ? null : (
        <React.Fragment key={`gf-${i}`}>
          <Flame x={g.x} y={0} z={g.z} f={f} scale={g.s * 1.8 * Math.min(1, (f - g.f) / 10)} seed={i + 40} />
          {i % 2 === 0 ? <SmokeColumn x={g.x} y={0} z={g.z} f={f} start={g.f + 10} size={1.6} seed={i + 40} puffs={3} /> : null}
        </React.Fragment>
        ),
      )}
      {DUST.map((d, i) =>
        f >= d.f && f < d.f + 80 ? <Dust key={`dust-${i}`} x={d.x} z={d.z} f={f} start={d.f} s={d.s} seed={i} /> : null,
      )}
      {COLLAPSES.map((c, i) =>
        f >= c.f && f < c.f + 90 ? (
          <Debris key={`debris-${i}`} x={c.x} z={c.z} f={f} start={c.f} size={c.size} seed={i} color="#3a3d48" />
        ) : null,
      )}
      <Embers f={f} sources={sources} count={Math.min(700, sources.length * 18)} />
    </>
  );
};

export const KaijuV4: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fire = interpolate(f, [560, 800, 1120], [0, 0.45, 0.85], clamp);
  const beam = beamAmount(f);
  // 爆発の閃光
  const flash = EXPLOSIONS.reduce((v, e) => Math.max(v, f >= e.f && f < e.f + 5 ? 1 - (f - e.f) / 5 : 0), 0) * 0.18;
  return (
    <AbsoluteFill
      style={{
        // 夕景→夜。下（地平線）ほど夕焼けが残る
        background: `linear-gradient(#070a1a 0%, #1b1a3a 38%, ${fire > 0.3 ? "#6a2418" : "#7a3a4a"} 72%, #d06a3a 100%)`,
      }}
    >
      <ThreeCanvas width={width} height={height} shadows gl={{ alpha: true, antialias: true }} camera={{ fov: 40, position: [0, 10, 60] }}>
        <Scene f={f} />
      </ThreeCanvas>
      {/* 炎で画面全体が赤く染まっていく */}
      <AbsoluteFill style={{ background: "linear-gradient(transparent 20%, #ff3a10 100%)", mixBlendMode: "screen", opacity: fire * 0.35 }} />
      <AbsoluteFill style={{ background: "#b4200a", mixBlendMode: "multiply", opacity: fire * 0.35 }} />
      {/* 熱線の青白い光と爆発の閃光 */}
      <AbsoluteFill style={{ background: "#9fdcff", mixBlendMode: "screen", opacity: beam * 0.08 + flash }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
      {withAudio ? <Audio src={staticFile("kaiju_v4.wav")} /> : null}
    </AbsoluteFill>
  );
};

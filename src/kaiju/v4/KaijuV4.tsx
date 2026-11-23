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
  [552, { p: [-3, 13, 56], l: [10, 6, -6], fov: 46 }], // 熱線のなぎ払い（怪獣・熱線・塔を一画面に）
  [722, { p: [-1, 12.5, 56], l: [10, 6, -5], fov: 46 }],
  [762, { p: [17, 5, 40], l: [3, 8.5, 0], fov: 42 }],
  [870, { p: [16, 5, 40], l: [3, 8.5, 0], fov: 42 }],
  [892, { p: [0, 11, 52], l: [10, 6, -4], fov: 46 }], // 短い熱線
  [990, { p: [1, 11, 52], l: [10, 6, -4], fov: 46 }],
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
      g.fillStyle = "#3a3c44";
      g.fillRect(0, 0, 190, 190);
      g.fillStyle = "#5a5c64";
      g.fillRect(0, 0, 140, 140); // 街区（7/9.5）
      g.fillStyle = "#c8b060";
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
        <meshStandardMaterial color="#4a6a96" roughness={0.2} metalness={0.35} emissive="#a06050" emissiveIntensity={0.45} />
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
  // 要素は常に置いたまま visible で出し入れする（途中で付け外しすると描画が壊れることがあるため）
  return (
    <group position={MOUTH_LOCAL.toArray()}>
      <group rotation={[0, 0, -Math.PI / 2]} visible={a > 0.01}>
        {[0.3, 0.65, 1.3].map((r, i) => (
          <mesh key={i} material={mats[i]} position={[0, len / 2, 0]} scale={[r * fl * (0.6 + 0.4 * a), Math.max(0.01, len), r * fl * (0.6 + 0.4 * a)]}>
            <cylinderGeometry args={[1, 0.75, 1, 10, 1, true]} />
          </mesh>
        ))}
      </group>
      {/* 口元の光 */}
      <mesh material={mats[2]} scale={0.6 + charge * 0.8 + a * 1.2} visible={a + charge > 0.01}>
        <icosahedronGeometry args={[1, 1]} />
      </mesh>
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
  const fogColor = new THREE.Color("#e0a088").lerp(new THREE.Color("#b0503a"), fire);

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
      <fog attach="fog" args={[fogColor, 60, 230]} />
      <hemisphereLight args={["#b8c4f0", "#6a4a3a", 1.5]} />
      {/* 主光源：夕日（左手前から低く）。怪獣の周りに影を落とす */}
      <primitive object={target} />
      <directionalLight
        position={[root.x - 34, 20, 26]}
        target={target}
        color="#ffbb88"
        intensity={3.2}
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
      <directionalLight position={[root.x + 24, 16, 34]} color="#c8b8e8" intensity={0.9} />
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
        // 夕焼け空。上は青紫、地平線に向かって橙
        background: `linear-gradient(#3a4a86 0%, #8a6a9a 30%, ${fire > 0.3 ? "#e0603a" : "#f08a6a"} 58%, #ffc080 78%, #ffd8a0 100%)`,
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
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(20,10,20,0.4) 100%)" }} />
      {withAudio ? <Audio src={staticFile("kaiju_v4.wav")} /> : null}
    </AbsoluteFill>
  );
};

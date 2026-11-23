import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * ローポリ怪獣モデル（オリジナルの様式化デザイン）。
 * 寸法・配色は godzilla.py（numpy+PIL版）の設計を Three.js 用に組み直したもの。
 * 座標系：x=前方, y=上, z=左右。単位は godzilla.py と同じ。
 */

export const PALETTE = {
  skin: "#525456", // 炭色
  skinDark: "#3c3e40",
  belly: "#6e706a",
  fin: "#c6cac0", // 骨白色の背びれ
  finDark: "#a4a89e",
  eye: "#ffc430",
  teeth: "#eceee8",
  mouth: "#7a2420",
};

type V3 = [number, number, number];

// 同じ色のマテリアルは使い回す（フラットシェーディングで面ごとに陰影を出す）
const matCache = new Map<string, THREE.MeshStandardMaterial>();
const mat = (color: string) => {
  let m = matCache.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: color === PALETTE.eye ? 0.4 : 0.92,
      metalness: 0,
      emissive: color === PALETTE.eye ? new THREE.Color("#7a4a00") : new THREE.Color("#000000"),
    });
    matCache.set(color, m);
  }
  return m;
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

export const Box: React.FC<{ p: V3; s: V3; c: string; rz?: number; ry?: number }> = ({ p, s, c, rz = 0, ry = 0 }) => (
  <mesh position={p} scale={s} rotation={[0, ry, rz]} geometry={boxGeo} material={mat(c)} castShadow receiveShadow />
);

/** 2点間の円錐（爪・角など）。godzilla.py の cyl_between に相当 */
export const Spike: React.FC<{ a: V3; b: V3; r1: number; r2?: number; c: string; seg?: number }> = ({
  a,
  b,
  r1,
  r2 = 0.03,
  c,
  seg = 6,
}) => {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const l = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { pos: va.clone().add(vb).multiplyScalar(0.5), quat: q, len: l };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={mat(c)} castShadow>
      <cylinderGeometry args={[r2, r1, len, seg]} />
    </mesh>
  );
};

/** 関節：at を回転中心にして子を回す。子は絶対座標のまま書ける */
export const Joint: React.FC<{ at: V3; r?: V3; children: React.ReactNode }> = ({ at, r = [0, 0, 0], children }) => (
  <group position={at} rotation={r}>
    <group position={[-at[0], -at[1], -at[2]]}>{children}</group>
  </group>
);

export type KaijuPose = {
  hipL: number; // 脚の振り（z回転, +で前）
  hipR: number;
  kneeL: number;
  kneeR: number;
  bodyRoll: number; // 胴の左右の揺れ
  bodyPitch: number; // 胴の前後の傾き（+で反る）
  bob: number; // 上下
  shoulderL: number;
  shoulderR: number;
  elbow: number;
  headPitch: number; // +で上を向く
  jaw: number; // 0〜1 顎の開き
  tail: number[]; // 各節の左右のしなり（y回転）
  tailLift: number; // 尾の持ち上げ
};

export const REST: KaijuPose = {
  hipL: 0,
  hipR: 0,
  kneeL: 0,
  kneeR: 0,
  bodyRoll: 0,
  bodyPitch: 0,
  bob: 0,
  shoulderL: 0,
  shoulderR: 0,
  elbow: 0,
  headPitch: 0,
  jaw: 0,
  tail: [0, 0, 0, 0, 0],
  tailLift: 0,
};

const Leg: React.FC<{ s: 1 | -1; hip: number; knee: number }> = ({ s, hip, knee }) => {
  const z = s * 1.12;
  return (
    <Joint at={[-0.15, 5.9, z]} r={[0, 0, hip]}>
      <Box p={[-0.15, 4.75, z + s * 0.05]} s={[2.3, 2.2, 2.15]} c={PALETTE.skin} />
      <Joint at={[0.1, 3.45, z]} r={[0, 0, knee]}>
        <Box p={[0.1, 3.45, z]} s={[2.1, 0.7, 2.0]} c={PALETTE.skinDark} />
        <Box p={[0.05, 2.0, z]} s={[1.95, 2.6, 1.85]} c={PALETTE.skin} />
        {/* 足首から先は地面と平行に保つ */}
        <Joint at={[0.05, 0.75, z]} r={[0, 0, -(hip + knee)]}>
          <Box p={[0.3, 0.38, z]} s={[3.2, 0.75, 1.65]} c={PALETTE.skinDark} />
          {[-0.52, 0, 0.52].map((tz) => (
            <Spike key={tz} a={[1.75, 0.32, z + tz]} b={[2.9, 0.15, z + tz * 1.18]} r1={0.27} c={PALETTE.teeth} />
          ))}
        </Joint>
      </Joint>
    </Joint>
  );
};

const Arm: React.FC<{ s: 1 | -1; shoulder: number; elbow: number }> = ({ s, shoulder, elbow }) => {
  const z = s * 2.35;
  return (
    <Joint at={[0.25, 9.5, z]} r={[0, 0, shoulder]}>
      <Box p={[0.25, 9.5, z]} s={[2.0, 1.5, 1.4]} c={PALETTE.skin} />
      <Box p={[0.25, 8.25, z]} s={[1.25, 1.7, 1.25]} c={PALETTE.skin} />
      <Joint at={[0.25, 7.25, z]} r={[0, 0, elbow]}>
        <Box p={[0.25, 7.25, z]} s={[1.0, 0.6, 1.0]} c={PALETTE.skinDark} />
        <Box p={[0.32, 6.05, z + s * 0.06]} s={[1.45, 1.85, 1.45]} c={PALETTE.skin} />
        <Box p={[0.32, 4.9, z + s * 0.06]} s={[1.05, 0.65, 1.15]} c={PALETTE.skinDark} />
        {[-0.38, -0.13, 0.13, 0.38].map((tz) => (
          <Spike
            key={tz}
            a={[0.68, 4.62, z + s * 0.06 + tz]}
            b={[1.1, 4.02, z + s * 0.06 + tz * 1.25]}
            r1={0.16}
            c={PALETTE.teeth}
          />
        ))}
      </Joint>
    </Joint>
  );
};

// 尾の節：[中心x, 中心y, 長さ, 高さ, 幅]
const TAIL: [number, number, number, number, number][] = [
  [-2.7, 5.5, 3.2, 2.4, 3.0],
  [-5.1, 4.95, 2.9, 1.9, 2.3],
  [-7.2, 4.5, 2.5, 1.45, 1.7],
  [-9.0, 4.18, 2.1, 1.08, 1.2],
  [-10.5, 3.98, 1.7, 0.78, 0.8],
];
const TAIL_FINS: [number, number][] = [
  [1.15, 1.0],
  [0.95, 0.85],
  [0.78, 0.66],
  [0.58, 0.48],
  [0.42, 0.35],
];

/** 尾：節ごとに入れ子の関節にして、根元から先へしなりを伝える */
const TailSegment: React.FC<{ i: number; sway: number[]; lift: number }> = ({ i, sway, lift }) => {
  if (i >= TAIL.length) {
    return <Spike a={[-11.25, 3.98, 0]} b={[-12.45, 4.12, 0]} r1={0.36} c={PALETTE.skin} seg={8} />;
  }
  const [tx, ty, sx, sy, sz] = TAIL[i];
  const [fw, fh] = TAIL_FINS[i];
  return (
    <Joint at={[tx + sx / 2, ty, 0]} r={[0, sway[i], lift]}>
      <Box p={[tx, ty, 0]} s={[sx, sy, sz]} c={PALETTE.skin} />
      <Box p={[tx, ty + sy / 2 + fh / 2 - 0.08, 0]} s={[fw, fh, 0.24]} c={PALETTE.fin} rz={0.16} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          p={[tx + 0.35, ty + sy / 2 + fh * 0.22, s * sz * 0.3]}
          s={[fw * 0.62, fh * 0.55, 0.2]}
          c={PALETTE.finDark}
          rz={0.16}
        />
      ))}
      <TailSegment i={i + 1} sway={sway} lift={lift} />
    </Joint>
  );
};

const Head: React.FC<{ pitch: number; jaw: number }> = ({ pitch, jaw }) => (
  <Joint at={[0.55, 10.0, 0]} r={[0, 0, pitch]}>
    <Box p={[0.55, 10.25, 0]} s={[1.35, 0.95, 1.5]} c={PALETTE.skinDark} />
    <Box p={[1.3, 10.95, 0]} s={[2.0, 1.35, 1.65]} c={PALETTE.skin} />
    <Box p={[1.45, 11.78, 0]} s={[1.45, 0.38, 1.45]} c={PALETTE.skinDark} />
    <Box p={[0.85, 12.05, 0]} s={[0.85, 0.42, 0.24]} c={PALETTE.finDark} rz={-0.12} />
    {[-1, 1].map((s) => (
      <React.Fragment key={s}>
        <Box p={[1.92, 11.12, s * 0.84]} s={[0.6, 0.24, 0.06]} c={PALETTE.eye} />
        <Spike a={[0.42, 11.15, s * 0.8]} b={[0.1, 11.38, s * 1.02]} r1={0.2} c={PALETTE.skinDark} />
      </React.Fragment>
    ))}
    <Box p={[2.55, 10.8, 0]} s={[1.3, 0.6, 1.3]} c={PALETTE.skin} />
    <Box p={[3.22, 10.9, 0]} s={[0.36, 0.4, 1.0]} c={PALETTE.skinDark} />
    {/* 口の中（顎が開くと見える） */}
    <Box p={[2.2, 10.32, 0]} s={[1.5, 0.3, 1.0]} c={PALETTE.mouth} />
    {[1.9, 2.3, 2.7, 3.02].map((tx) =>
      [-1, 1].map((s) => <Box key={`${tx}${s}`} p={[tx, 10.4, s * 0.36]} s={[0.17, 0.26, 0.17]} c={PALETTE.teeth} />),
    )}
    {/* 下顎：後端を支点に開く */}
    <Joint at={[1.55, 10.2, 0]} r={[0, 0, -0.62 * jaw]}>
      <Box p={[2.3, 10.12, 0]} s={[1.4, 0.12, 0.95]} c={PALETTE.mouth} />
      <Box p={[2.32, 9.98, 0]} s={[1.55, 0.38, 1.1]} c={PALETTE.skinDark} rz={-0.07} />
      {[2.0, 2.45, 2.85].map((tx) =>
        [-1, 1].map((s) => <Box key={`${tx}${s}`} p={[tx, 10.24, s * 0.34]} s={[0.15, 0.22, 0.15]} c={PALETTE.teeth} />),
      )}
    </Joint>
  </Joint>
);

export const KaijuModel: React.FC<{ pose: KaijuPose }> = ({ pose }) => (
  <group position={[0, pose.bob, 0]}>
    <Leg s={1} hip={pose.hipL} knee={pose.kneeL} />
    <Leg s={-1} hip={pose.hipR} knee={pose.kneeR} />
    {/* 骨盤を中心に上半身と尾 */}
    <Joint at={[-0.25, 6.0, 0]} r={[pose.bodyRoll, 0, pose.bodyPitch]}>
      <Box p={[-0.25, 6.0, 0]} s={[2.8, 1.3, 3.6]} c={PALETTE.skinDark} />
      <TailSegment i={0} sway={pose.tail} lift={pose.tailLift} />
      <Box p={[-0.05, 7.1, 0]} s={[2.6, 1.6, 3.1]} c={PALETTE.skin} />
      <Box p={[1.05, 7.1, 0]} s={[0.65, 1.45, 2.5]} c={PALETTE.belly} />
      <Box p={[0.15, 8.65, 0]} s={[3.2, 2.3, 3.8]} c={PALETTE.skin} />
      <Box p={[1.45, 8.65, 0]} s={[0.65, 2.0, 3.0]} c={PALETTE.belly} />
      <Box p={[0.15, 9.9, 0]} s={[2.7, 0.45, 3.3]} c={PALETTE.skinDark} />
      {/* 背びれ：中央の大きな板3枚＋左右の列（互い違い） */}
      <Box p={[-1.85, 7.45, 0]} s={[1.05, 1.5, 0.26]} c={PALETTE.fin} rz={0.22} />
      <Box p={[-1.95, 9.05, 0]} s={[1.15, 1.85, 0.26]} c={PALETTE.fin} rz={0.1} />
      <Box p={[-1.8, 10.5, 0]} s={[0.95, 1.4, 0.26]} c={PALETTE.fin} rz={-0.05} />
      {(
        [
          [8.2, 0.85],
          [8.2, -0.85],
          [9.7, 0.8],
          [9.7, -0.8],
        ] as const
      ).map(([fy, fz]) => (
        <Box key={`${fy}${fz}`} p={[-1.75, fy, fz]} s={[0.75, 1.0, 0.22]} c={PALETTE.finDark} rz={0.12} />
      ))}
      <Arm s={1} shoulder={pose.shoulderL} elbow={pose.elbow} />
      <Arm s={-1} shoulder={pose.shoulderR} elbow={pose.elbow} />
      <Head pitch={pose.headPitch} jaw={pose.jaw} />
    </Joint>
  </group>
);

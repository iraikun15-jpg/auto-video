import React, { useMemo } from "react";
import * as THREE from "three";
import { Joint, KaijuPose, PALETTE, Spike } from "./Model";

/**
 * ローポリ怪獣モデル v2（オリジナルの様式化デザイン）
 * v1 からの変更：
 *  - 背びれ：骨白色の板を首の後ろ〜尾の付け根〜尾先まで3列・互い違いに密に並べる
 *  - 各パーツをテーパー（先細り）や斜めカットにして、箱の積み上げ感を減らす
 *  - 頭：吻が前に出て下顎とつながる形
 * 色・全体のプロポーションは v1（godzilla.py 準拠）を維持。
 */

type V3 = [number, number, number];
type V2 = [number, number];

/**
 * 背びれの発光（v4 の熱線チャージ用）。0=発光なし、1=尾の先から頭まで全部光る。
 * 値の増加に合わせて尾の先→頭の順に光が伝わる。v2 では使わない（常に0）。
 */
export const FinGlowContext = React.createContext(0);
export const FIN_GLOW_COLOR = "#8fdcff";
const glowLevel = (glow: number, s: number) => Math.max(0, Math.min(1, (glow * 1.25 - s) / 0.15));

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
      side: THREE.DoubleSide,
    });
    matCache.set(color, m);
  }
  return m;
};

/**
 * テーパー付きの箱。axis 方向の負側/正側の断面をそれぞれ neg/pos 倍に絞る。
 * shift は正側の断面をずらす量（axis='y' なら x 方向、axis='x' なら y 方向。単位は箱の大きさ比）。
 */
const geoCache = new Map<string, THREE.BufferGeometry>();
const taperGeo = (axis: "x" | "y", neg: V2, pos: V2, shift: number) => {
  const key = `${axis}|${neg}|${pos}|${shift}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(1, 1, 1);
    const a = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < a.count; i++) {
      let x = a.getX(i);
      let y = a.getY(i);
      let z = a.getZ(i);
      if (axis === "y") {
        const f = y > 0 ? pos : neg;
        x *= f[0];
        z *= f[1];
        if (y > 0) x += shift;
      } else {
        const f = x > 0 ? pos : neg;
        y *= f[0];
        z *= f[1];
        if (x > 0) y += shift;
      }
      a.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    geoCache.set(key, g);
  }
  return g;
};

const T: React.FC<{
  p: V3;
  s: V3;
  c: string;
  axis?: "x" | "y";
  neg?: V2;
  pos?: V2;
  shift?: number;
  r?: V3;
}> = ({ p, s, c, axis = "y", neg = [1, 1], pos = [1, 1], shift = 0, r = [0, 0, 0] }) => (
  <mesh
    position={p}
    scale={s}
    rotation={r}
    geometry={taperGeo(axis, neg, pos, shift)}
    material={mat(c)}
    castShadow
    receiveShadow
  />
);

// ---- 背びれ：ギザギザの炎形の板（押し出し） ----
const finGeo = (() => {
  const sh = new THREE.Shape();
  const pts: V2[] = [
    [-0.5, 0],
    [0.5, 0],
    [0.38, 0.32],
    [0.46, 0.4],
    [0.22, 0.58],
    [0.3, 0.66],
    [0.04, 1.0],
    [-0.12, 0.72],
    [-0.26, 0.78],
    [-0.3, 0.5],
    [-0.46, 0.42],
  ];
  sh.moveTo(...pts[0]);
  pts.slice(1).forEach((q) => sh.lineTo(...q));
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
})();

/** 背びれ1枚。base=付け根の中心, h=高さ, w=幅, lean=後ろへの傾き(rad), out=左右への開き(rad), s=背骨上の位置(0=尾の先,1=頭) */
const Fin: React.FC<{ base: V3; h: number; w: number; lean: number; out?: number; c?: string; t?: number; s?: number }> = ({
  base,
  h,
  w,
  lean,
  out = 0,
  c = PALETTE.fin,
  t = 0.2,
  s = 0.5,
}) => {
  const glow = React.useContext(FinGlowContext);
  const g = glow > 0 ? glowLevel(glow, s) : 0;
  // マテリアルは常に同じものを使い、発光の強さだけを変える（付け替えると描画が壊れるため）
  const m = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide, emissive: FIN_GLOW_COLOR, emissiveIntensity: 0 }),
    [c],
  );
  m.color.set(c).lerp(new THREE.Color("#e8f8ff"), g * 0.6);
  m.emissiveIntensity = g * 2.2;
  m.roughness = 0.92 - g * 0.3;
  return (
    <mesh position={base} rotation={[out, 0, lean]} scale={[w, h, t]} geometry={finGeo} material={m} castShadow receiveShadow />
  );
};

// 胴体の背骨ライン上の背びれ [x, y, 高さ, 幅, 後傾]（首の後ろ→腰）
const BACK_FINS: [number, number, number, number, number][] = [
  [-0.25, 10.45, 1.5, 0.95, 0.55],
  [-0.95, 10.15, 2.3, 1.25, 0.8],
  [-1.4, 9.35, 3.0, 1.5, 1.0],
  [-1.5, 8.35, 3.25, 1.6, 1.12],
  [-1.42, 7.35, 2.9, 1.5, 1.15],
  [-1.6, 6.45, 2.3, 1.25, 1.05],
];

const BackFins: React.FC = () => (
  <>
    {/* 中央列 */}
    {BACK_FINS.map(([x, y, h, w, lean]) => (
      <Fin key={`c${y}`} base={[x + 0.15, y, 0]} h={h} w={w} lean={lean} t={0.24} s={0.95 - BACK_FINS.findIndex((b) => b[1] === y) * 0.08} />
    ))}
    {/* 左右の列：中央列の間に互い違いで、少し外へ開く */}
    {BACK_FINS.slice(0, -1).map(([x, y, h, w, lean], i) => {
      const [x2, y2, h2, w2, lean2] = BACK_FINS[i + 1];
      const mx = (x + x2) / 2;
      const my = (y + y2) / 2;
      const mh = ((h + h2) / 2) * 0.72;
      const mw = ((w + w2) / 2) * 0.72;
      const ml = (lean + lean2) / 2;
      return [-1, 1].map((s) => (
        <Fin
          key={`s${i}${s}`}
          base={[mx + 0.2, my, s * 0.66]}
          h={mh}
          w={mw}
          lean={ml}
          out={s * 0.32}
          c={PALETTE.finDark}
          t={0.18}
          s={0.91 - i * 0.08}
        />
      ));
    })}
  </>
);

// ---- 脚：太ももが太く、足元に向けて細く。足裏は平ら ----
const Leg: React.FC<{ s: 1 | -1; hip: number; knee: number }> = ({ s, hip, knee }) => {
  const z = s * 1.15;
  return (
    <Joint at={[-0.15, 5.9, z]} r={[0, 0, hip]}>
      <T p={[-0.15, 4.85, z + s * 0.08]} s={[2.75, 2.5, 2.5]} c={PALETTE.skin} neg={[0.72, 0.76]} pos={[0.92, 0.95]} />
      <Joint at={[0.1, 3.5, z]} r={[0, 0, knee]}>
        <T p={[0.12, 3.5, z]} s={[2.0, 0.75, 1.9]} c={PALETTE.skinDark} neg={[0.88, 0.9]} pos={[0.95, 0.95]} />
        <T p={[0.08, 2.05, z]} s={[1.9, 2.55, 1.8]} c={PALETTE.skin} neg={[0.66, 0.7]} pos={[1, 1]} shift={-0.05} />
        <Joint at={[0.05, 0.75, z]} r={[0, 0, -(hip + knee)]}>
          {/* 足：底は平ら、甲は斜めに落とす */}
          <T p={[0.35, 0.38, z]} s={[3.2, 0.76, 1.8]} c={PALETTE.skinDark} neg={[1, 1]} pos={[0.66, 0.8]} shift={-0.1} />
          <T p={[-0.75, 0.36, z]} s={[0.9, 0.72, 1.5]} c={PALETTE.skinDark} axis="x" neg={[0.7, 0.8]} />
          {[-0.55, 0, 0.55].map((tz) => (
            <Spike key={tz} a={[1.75, 0.3, z + tz]} b={[2.95, 0.12, z + tz * 1.18]} r1={0.26} c={PALETTE.teeth} />
          ))}
        </Joint>
      </Joint>
    </Joint>
  );
};

const Arm: React.FC<{ s: 1 | -1; shoulder: number; elbow: number }> = ({ s, shoulder, elbow }) => {
  const z = s * 2.3;
  return (
    <Joint at={[0.25, 9.5, z]} r={[0, 0, shoulder]}>
      <T p={[0.25, 9.45, z]} s={[2.0, 1.5, 1.45]} c={PALETTE.skin} neg={[0.75, 0.85]} pos={[0.85, 0.9]} />
      <T p={[0.25, 8.2, z]} s={[1.3, 1.75, 1.3]} c={PALETTE.skin} neg={[0.75, 0.78]} />
      <Joint at={[0.25, 7.25, z]} r={[0, 0, elbow]}>
        <T p={[0.25, 7.25, z]} s={[1.0, 0.6, 1.0]} c={PALETTE.skinDark} neg={[0.85, 0.85]} />
        <T p={[0.34, 6.05, z + s * 0.06]} s={[1.5, 1.9, 1.5]} c={PALETTE.skin} neg={[0.68, 0.72]} shift={-0.04} />
        <T p={[0.4, 4.9, z + s * 0.06]} s={[1.1, 0.65, 1.15]} c={PALETTE.skinDark} neg={[0.8, 0.85]} />
        {[-0.38, -0.13, 0.13, 0.38].map((tz) => (
          <Spike
            key={tz}
            a={[0.72, 4.62, z + s * 0.06 + tz]}
            b={[1.14, 4.02, z + s * 0.06 + tz * 1.25]}
            r1={0.16}
            c={PALETTE.teeth}
          />
        ))}
      </Joint>
    </Joint>
  );
};

// 尾の節：[中心x, 中心y, 長さ, 高さ, 幅, 背びれの大きさ]
const TAIL: [number, number, number, number, number, number][] = [
  [-2.75, 5.5, 3.3, 2.4, 3.0, 2.0],
  [-5.15, 4.95, 2.9, 1.9, 2.3, 1.6],
  [-7.25, 4.5, 2.5, 1.45, 1.7, 1.25],
  [-9.05, 4.18, 2.1, 1.08, 1.2, 0.9],
  [-10.55, 3.98, 1.7, 0.78, 0.8, 0.6],
];

const TailSegment: React.FC<{ i: number; sway: number[]; lift: number }> = ({ i, sway, lift }) => {
  if (i >= TAIL.length) {
    return <Spike a={[-11.3, 3.98, 0]} b={[-12.6, 4.1, 0]} r1={0.34} c={PALETTE.skin} seg={6} />;
  }
  const [tx, ty, sx, sy, sz, fs] = TAIL[i];
  const next = TAIL[i + 1];
  // 次の節の太さに向けて絞る（後ろ側が細い）
  const ny = next ? next[3] / sy : 0.6;
  const nz = next ? next[4] / sz : 0.6;
  const top = ty + sy / 2;
  return (
    <Joint at={[tx + sx / 2, ty, 0]} r={[0, sway[i], lift * (0.6 + i * 0.2)]}>
      <T
        p={[tx, ty, 0]}
        s={[sx + 0.25, sy, sz]}
        c={PALETTE.skin}
        axis="x"
        neg={[Math.min(1, ny * 1.08), Math.min(1, nz * 1.08)]}
        pos={[1, 1]}
        shift={0.04}
      />
      {/* 中央列2枚 */}
      {[0.22, -0.28].map((k, j) => (
        <Fin
          key={`c${j}`}
          base={[tx + sx * k, top - 0.12 - k * 0.15, 0]}
          h={fs * (j ? 0.88 : 1)}
          w={fs * 0.62}
          lean={0.42}
          t={0.22}
          s={0.08 + (4 - i) * 0.1 + (j ? -0.03 : 0.03)}
        />
      ))}
      {/* 左右の列（中央列の間に互い違い） */}
      {[-1, 1].map((s) => (
        <Fin
          key={`s${s}`}
          base={[tx - sx * 0.02, top - 0.2, s * sz * 0.22]}
          h={fs * 0.7}
          w={fs * 0.48}
          lean={0.42}
          out={s * 0.3}
          c={PALETTE.finDark}
          t={0.18}
          s={0.08 + (4 - i) * 0.1}
        />
      ))}
      <TailSegment i={i + 1} sway={sway} lift={lift} />
    </Joint>
  );
};

// ---- 頭：吻が前に出て下顎とつながる ----
const Head: React.FC<{ pitch: number; jaw: number; extra?: React.ReactNode }> = ({ pitch, jaw, extra }) => (
  <Joint at={[0.55, 10.0, 0]} r={[0, 0, pitch]}>
    {extra}
    {/* 首 */}
    <T p={[0.45, 10.25, 0]} s={[1.7, 1.15, 1.75]} c={PALETTE.skinDark} neg={[1, 1]} pos={[0.82, 0.85]} shift={0.08} />
    {/* 頭蓋：前に向けて低く細く */}
    <T p={[1.25, 10.95, 0]} s={[1.9, 1.3, 1.7]} c={PALETTE.skin} axis="x" neg={[0.85, 0.92]} pos={[0.78, 0.85]} shift={-0.08} />
    {/* 眉の張り出し：前に向けて傾斜 */}
    <T p={[1.55, 11.62, 0]} s={[1.5, 0.36, 1.6]} c={PALETTE.skinDark} axis="x" neg={[0.8, 0.9]} pos={[0.6, 0.85]} shift={-0.28} />
    {/* 後頭部の小さなひれ */}
    <Fin base={[0.6, 11.55, 0]} h={0.7} w={0.55} lean={0.5} c={PALETTE.finDark} t={0.18} s={1} />
    {[-1, 1].map((s) => (
      <React.Fragment key={s}>
        <T p={[1.98, 11.08, s * 0.76]} s={[0.55, 0.2, 0.06]} c={PALETTE.eye} axis="x" pos={[0.7, 1]} shift={-0.15} />
        <Spike a={[0.5, 11.15, s * 0.78]} b={[0.1, 11.42, s * 1.0]} r1={0.2} c={PALETTE.skinDark} />
      </React.Fragment>
    ))}
    {/* 上顎（吻）：前に長く出して先を絞る */}
    <T p={[2.6, 10.72, 0]} s={[2.0, 0.72, 1.35]} c={PALETTE.skin} axis="x" neg={[1, 1]} pos={[0.72, 0.7]} shift={-0.1} />
    <T p={[3.55, 10.76, 0]} s={[0.4, 0.42, 0.9]} c={PALETTE.skinDark} axis="x" neg={[1, 1]} pos={[0.7, 0.7]} shift={-0.05} />
    {/* 口の中 */}
    <T p={[2.45, 10.32, 0]} s={[1.9, 0.3, 1.0]} c={PALETTE.mouth} axis="x" pos={[0.75, 0.8]} />
    {[2.05, 2.5, 2.92, 3.3].map((tx, k) =>
      [-1, 1].map((s) => (
        <T key={`${tx}${s}`} p={[tx, 10.32, s * (0.42 - k * 0.04)]} s={[0.16, 0.26, 0.16]} c={PALETTE.teeth} neg={[0.4, 0.4]} />
      )),
    )}
    {/* 下顎：頬（支点側）から吻の先へ向けて細くなり、先が持ち上がる */}
    <Joint at={[1.45, 10.2, 0]} r={[0, 0, -0.62 * jaw]}>
      <T p={[1.4, 10.05, 0]} s={[0.9, 0.6, 1.4]} c={PALETTE.skinDark} axis="x" pos={[0.85, 0.9]} />
      <T p={[2.42, 10.13, 0]} s={[1.8, 0.12, 0.95]} c={PALETTE.mouth} axis="x" pos={[0.7, 0.75]} />
      <T p={[2.4, 9.96, 0]} s={[2.05, 0.42, 1.15]} c={PALETTE.skinDark} axis="x" neg={[1, 1]} pos={[0.6, 0.7]} shift={0.08} />
      {[2.1, 2.55, 2.98].map((tx, k) =>
        [-1, 1].map((s) => (
          <T key={`${tx}${s}`} p={[tx, 10.24, s * (0.36 - k * 0.04)]} s={[0.15, 0.22, 0.15]} c={PALETTE.teeth} pos={[0.4, 0.4]} />
        )),
      )}
    </Joint>
  </Joint>
);

/** headExtra は頭の関節の中（頭と一緒に動く座標系）に置く。v4 の熱線用 */
export const KaijuModelV2: React.FC<{ pose: KaijuPose; headExtra?: React.ReactNode }> = ({ pose, headExtra }) => (
  <group position={[0, pose.bob, 0]}>
    <Leg s={1} hip={pose.hipL} knee={pose.kneeL} />
    <Leg s={-1} hip={pose.hipR} knee={pose.kneeR} />
    <Joint at={[-0.25, 6.0, 0]} r={[pose.bodyRoll, 0, pose.bodyPitch]}>
      {/* 骨盤〜腹〜胸：下が太く、肩へ向けて絞る */}
      <T p={[-0.25, 6.0, 0]} s={[3.0, 1.45, 3.75]} c={PALETTE.skinDark} neg={[0.85, 0.9]} pos={[1, 1]} />
      <TailSegment i={0} sway={pose.tail} lift={pose.tailLift} />
      <T p={[-0.05, 7.15, 0]} s={[2.9, 1.8, 3.5]} c={PALETTE.skin} neg={[1, 1]} pos={[0.95, 0.95]} />
      <T p={[1.12, 7.1, 0]} s={[0.6, 1.6, 2.6]} c={PALETTE.belly} neg={[0.9, 0.85]} pos={[1, 1]} shift={0.08} />
      <T p={[0.15, 8.7, 0]} s={[3.2, 2.4, 3.9]} c={PALETTE.skin} neg={[1, 1]} pos={[0.8, 0.78]} shift={0.04} />
      <T p={[1.38, 8.6, 0]} s={[0.6, 2.1, 3.0]} c={PALETTE.belly} neg={[1, 1]} pos={[0.85, 0.7]} shift={-0.2} />
      <T p={[0.2, 9.95, 0]} s={[2.4, 0.55, 3.0]} c={PALETTE.skinDark} neg={[1, 1]} pos={[0.72, 0.66]} />
      <BackFins />
      <Arm s={1} shoulder={pose.shoulderL} elbow={pose.elbow} />
      <Arm s={-1} shoulder={pose.shoulderR} elbow={pose.elbow} />
      <Head pitch={pose.headPitch} jaw={pose.jaw} extra={headExtra} />
    </Joint>
  </group>
);

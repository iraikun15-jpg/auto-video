import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { KaijuModel, KaijuPose, REST } from "./Model";

/**
 * ローポリ3Dテスト（9秒・無音）
 *  0〜4秒  : ターンテーブル1回転
 *  4〜7.6秒: その場で歩行（6歩）＋尾のしなり
 *  7.6〜9秒: 顎を開けて咆哮ポーズで静止
 */
export const KAIJU_FRAMES = 270;
const TURN_END = 120;
const WALK_END = 228;
const ROAR_END = 250;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.inOut(Easing.cubic);

const poseAt = (f: number): { pose: KaijuPose; turn: number } => {
  const turn = interpolate(f, [0, TURN_END], [0, Math.PI * 2], { ...clamp, easing: io });

  // 歩行：36フレームで左右1歩ずつ。入りと終わりは振れ幅をなめらかに
  const walkAmp = interpolate(f, [TURN_END, TURN_END + 10, WALK_END - 12, WALK_END], [0, 1, 1, 0], clamp);
  const ph = ((f - TURN_END) / 36) * Math.PI * 2;
  const sL = Math.sin(ph);
  const sR = Math.sin(ph + Math.PI);

  // 咆哮
  const roar = interpolate(f, [WALK_END - 4, ROAR_END], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });

  // 尾：根元から先へ遅れて伝わる波（常に少し揺らす）
  const tailAmp = 0.05 + 0.13 * walkAmp;
  const tail = [0, 1, 2, 3, 4].map((i) => tailAmp * Math.sin(f * 0.087 - i * 0.7) * (0.6 + i * 0.25));

  const pose: KaijuPose = {
    ...REST,
    hipL: walkAmp * 0.34 * sL,
    hipR: walkAmp * 0.34 * sR,
    kneeL: -walkAmp * 0.55 * Math.max(0, Math.cos(ph)),
    kneeR: -walkAmp * 0.55 * Math.max(0, Math.cos(ph + Math.PI)),
    bob: -walkAmp * 0.22 * Math.abs(Math.cos(ph)) - roar * 0.1,
    bodyRoll: walkAmp * 0.05 * sL,
    bodyPitch: roar * 0.12,
    shoulderL: -walkAmp * 0.14 * sL + roar * 0.75,
    shoulderR: -walkAmp * 0.14 * sR + roar * 0.75,
    elbow: roar * 0.55,
    headPitch: walkAmp * 0.04 * Math.sin(ph * 2) + roar * 0.42,
    jaw: roar,
    tail: tail.map((t, i) => t * (1 - roar) + roar * 0.04 * i),
    tailLift: roar * 0.05,
  };
  return { pose, turn };
};

/** v1/v2 共通の舞台（カメラ距離・背景・ライト・地面を揃えて比較できるように） */
export const KaijuStage: React.FC<{ turn: number; children: React.ReactNode }> = ({ turn, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 70% 40% at 50% 52%, #34405a 0%, rgba(52,64,90,0) 70%), linear-gradient(#0d1220, #080b14)",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 30, position: [0, 8.5, 54], near: 1, far: 200 }}
        onCreated={({ camera }) => camera.lookAt(0, 6, 0)}
      >
        <hemisphereLight args={["#b8c4dc", "#20242c", 0.9]} />
        {/* 主光源（1灯）：左上手前から。面ごとの陰影と地面の影を作る */}
        <directionalLight
          position={[-12, 24, 32]}
          intensity={2.6}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.0005}
        />
        {/* 地面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[19, 48]} />
          <meshStandardMaterial color="#2a3244" roughness={1} />
        </mesh>
        {/* 胴体の少し後ろ(x=-2.5)を回転軸に。初期は斜め前向き */}
        <group rotation={[0, -1.0 + turn, 0]}>
          <group position={[2.5, 0, 0]}>{children}</group>
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const KaijuTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { pose, turn } = poseAt(frame);
  return (
    <KaijuStage turn={turn}>
      <KaijuModel pose={pose} />
    </KaijuStage>
  );
};

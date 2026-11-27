import { Composition, Still } from "remotion";
import { ShortVideo } from "./ShortVideo";
import { Ep2, Ep2Segments, EP2_TOTAL_FRAMES } from "./ep2/Ep2";
import { Ep2Thumbnail } from "./ep2/Thumbnail";
import { FPS } from "./ep2/common";
import { MotionDemo, MOTION_DEMO_FRAMES, PoseCatalog } from "./rig/PoseCatalog";
import { KaijuTest, KAIJU_FRAMES } from "./kaiju/KaijuTest";
import { KaijuTestV2, KAIJU_V2_FRAMES } from "./kaiju/KaijuTestV2";
import { KaijuV4, KAIJU_V4_FRAMES } from "./kaiju/v4/KaijuV4";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 第2話：結合版（無音） */}
      <Composition
        id="Ep2"
        component={Ep2}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={EP2_TOTAL_FRAMES}
      />
      {/* 第2話：セグメント別（無音・音声同期用） */}
      {Ep2Segments.map((s) => (
        <Composition
          key={s.id}
          id={`Ep2-${s.id}`}
          component={s.component}
          width={1080}
          height={1920}
          fps={FPS}
          durationInFrames={s.frames}
        />
      ))}
      <Still id="Ep2Thumbnail" component={Ep2Thumbnail} width={1080} height={1920} />

      {/* 棒人間ポーズ集：一覧（静止画）と動きの見本（動画） */}
      <Still id="PoseCatalog" component={PoseCatalog} width={1080} height={1920} />
      <Composition
        id="MotionDemo"
        component={MotionDemo}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={MOTION_DEMO_FRAMES}
      />

      {/* ローポリ3Dテスト（Three.js） */}
      <Composition
        id="KaijuTest"
        component={KaijuTest}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={KAIJU_FRAMES}
      />

      <Composition
        id="KaijuTestV2"
        component={KaijuTestV2}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={KAIJU_V2_FRAMES}
      />

      {/* 本編テスト v4：東京破壊（約40秒・音あり） */}
      <Composition
        id="KaijuV4"
        component={KaijuV4}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={KAIJU_V4_FRAMES}
        defaultProps={{ withAudio: true }}
      />

      {/* 最初に作ったサンプル */}
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={150}
        defaultProps={{
          title: "こんにちは！",
          subtitle: "Remotionで作った\n縦型ショート動画",
        }}
      />
    </>
  );
};

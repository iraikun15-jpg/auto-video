import { Composition, Still } from "remotion";
import { ShortVideo } from "./ShortVideo";
import { Ep2, Ep2Segments, EP2_TOTAL_FRAMES } from "./ep2/Ep2";
import { Ep2Thumbnail } from "./ep2/Thumbnail";
import { FPS } from "./ep2/common";
import { Ep3, Ep3Segments, EP3_TOTAL_FRAMES } from "./ep3/Ep3";
import { Ep3Thumbnail } from "./ep3/Thumbnail";
import { Ep4, Ep4Segments, EP4_TOTAL_FRAMES } from "./ep4/Ep4";
import { Ep4Thumbnail } from "./ep4/Thumbnail";
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

      {/* 第3話：結合版（無音） */}
      <Composition
        id="Ep3"
        component={Ep3}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={EP3_TOTAL_FRAMES}
      />
      {/* 第3話：セグメント別（無音・音声同期用） */}
      {Ep3Segments.map((s) => (
        <Composition
          key={s.id}
          id={`Ep3-${s.id}`}
          component={s.component}
          width={1080}
          height={1920}
          fps={FPS}
          durationInFrames={s.frames}
        />
      ))}
      <Still id="Ep3Thumbnail" component={Ep3Thumbnail} width={1080} height={1920} />

      {/* 第4話：結合版（無音） */}
      <Composition
        id="Ep4"
        component={Ep4}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={EP4_TOTAL_FRAMES}
      />
      {/* 第4話：セグメント別（無音・音声同期用） */}
      {Ep4Segments.map((s) => (
        <Composition
          key={s.id}
          id={`Ep4-${s.id}`}
          component={s.component}
          width={1080}
          height={1920}
          fps={FPS}
          durationInFrames={s.frames}
        />
      ))}
      <Still id="Ep4Thumbnail" component={Ep4Thumbnail} width={1080} height={1920} />

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

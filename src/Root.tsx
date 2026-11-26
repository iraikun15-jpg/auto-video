import { Composition, Still } from "remotion";
import { ShortVideo } from "./ShortVideo";
import { Ep2, Ep2Segments, EP2_TOTAL_FRAMES } from "./ep2/Ep2";
import { Ep2Thumbnail } from "./ep2/Thumbnail";
import { FPS } from "./ep2/common";
import { KaijuTest, KAIJU_FRAMES } from "./kaiju/KaijuTest";
import { KaijuTestV2, KAIJU_V2_FRAMES } from "./kaiju/KaijuTestV2";
import { KaijuV4, KAIJU_V4_FRAMES } from "./kaiju/v4/KaijuV4";
import { Jimmu, JimmuSegments, JIMMU_TOTAL_FRAMES } from "./jimmu/Jimmu";
import { JimmuThumbnail } from "./jimmu/Thumbnail";
import { Takeru } from "./takeru/Takeru";
import { TakeruThumbnail } from "./takeru/Thumbnail";
import { TOTAL_FRAMES as TAKERU_FRAMES } from "./takeru/events";
import { Sujin } from "./sujin/Sujin";
import { SujinThumbnail } from "./sujin/Thumbnail";
import { TOTAL_FRAMES as SUJIN_FRAMES } from "./sujin/events";
import { Kusanagi } from "./kusanagi/Kusanagi";
import { KusanagiThumbnail } from "./kusanagi/Thumbnail";
import { TOTAL_FRAMES as KUSANAGI_FRAMES } from "./kusanagi/events";
import { Yuryaku } from "./yuryaku/Yuryaku";
import { YuryakuThumbnail } from "./yuryaku/Thumbnail";
import { TOTAL_FRAMES as YURYAKU_FRAMES } from "./yuryaku/events";

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

      {/* 歴史ch 第1本「神武東征」Short：結合版＋セグメント別（無音・切り絵スタイル） */}
      <Composition id="Jimmu" component={Jimmu} width={1080} height={1920} fps={30} durationInFrames={JIMMU_TOTAL_FRAMES} />
      {JimmuSegments.map((s) => (
        <Composition key={s.id} id={`Jimmu-${s.id}`} component={s.component} width={1080} height={1920} fps={30} durationInFrames={s.frames} />
      ))}
      <Still id="JimmuThumbnail" component={JimmuThumbnail} width={1080} height={1920} />

      {/* もしも日本史ラボ 第2本「ヤマトタケルは実在したのか」（BGM・効果音入り） */}
      <Composition id="Takeru" component={Takeru} width={1080} height={1920} fps={30} durationInFrames={TAKERU_FRAMES} defaultProps={{ withAudio: true }} />
      <Still id="TakeruThumbnail" component={TakeruThumbnail} width={1080} height={1920} />

      {/* もしも日本史ラボ 第3本「本当の初代天皇は崇神？」（BGM・効果音入り） */}
      <Composition id="Sujin" component={Sujin} width={1080} height={1920} fps={30} durationInFrames={SUJIN_FRAMES} defaultProps={{ withAudio: true }} />
      <Still id="SujinThumbnail" component={SujinThumbnail} width={1080} height={1920} />

      {/* もしも日本史ラボ 第4本「草薙剣は本当にあったのか」（神話ファンタジー寄り・BGM・効果音入り） */}
      <Composition id="Kusanagi" component={Kusanagi} width={1080} height={1920} fps={30} durationInFrames={KUSANAGI_FRAMES} defaultProps={{ withAudio: true }} />
      <Still id="KusanagiThumbnail" component={KusanagiThumbnail} width={1080} height={1920} />

      {/* もしも日本史ラボ 第5本「雄略天皇は実在したのか」（BGM・効果音入り） */}
      <Composition id="Yuryaku" component={Yuryaku} width={1080} height={1920} fps={30} durationInFrames={YURYAKU_FRAMES} defaultProps={{ withAudio: true }} />
      <Still id="YuryakuThumbnail" component={YuryakuThumbnail} width={1080} height={1920} />

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

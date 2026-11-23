import { Composition } from "remotion";
import { ShortVideo } from "./ShortVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ShortVideo"
      component={ShortVideo}
      // スマホ向け縦型（9:16）
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={150} // 5秒
      defaultProps={{
        title: "こんにちは！",
        subtitle: "Remotionで作った\n縦型ショート動画",
      }}
    />
  );
};

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  title: string;
  subtitle: string;
};

export const ShortVideo: React.FC<Props> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // タイトルがポンと出てくるアニメーション
  const titleScale = spring({ frame, fps, config: { damping: 12 } });

  // サブタイトルは少し遅れてフェードイン＆スライドアップ
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [20, 40], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 最後にフェードアウト
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // 背景のグラデーションをゆっくり回転
  const angle = interpolate(frame, [0, durationInFrames], [135, 225]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, #ff6b6b, #845ef7)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          "'Hiragino Sans', 'Noto Sans CJK JP', 'Noto Sans JP', sans-serif",
        color: "white",
        opacity: fadeOut,
        padding: 80,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 140,
          fontWeight: 900,
          transform: `scale(${titleScale})`,
          textShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 60,
          fontSize: 60,
          fontWeight: 700,
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          lineHeight: 1.4,
          whiteSpace: "pre-line",
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

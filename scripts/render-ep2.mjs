// 第2話の納品物一式を out/ep2/ に書き出す
//  ① ep2_full.mp4（結合済み・無音）
//  ② ep2_seg1.mp4〜ep2_seg5.mp4（セグメント別・無音）
//  ③ ep2_thumbnail.png
//  ④ ep2_timing.md（各セグメントの実尺）
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "out/ep2";
mkdirSync(OUT, { recursive: true });
const timing = JSON.parse(readFileSync("src/ep2/timing.json", "utf8"));
const { fps, holdFrames } = timing;

const remotion = (...args) =>
  execFileSync("npx", ["remotion", ...args], { stdio: "inherit" });

const render = (comp, file) =>
  remotion("render", "src/index.ts", comp, `${OUT}/${file}`, "--codec=h264", "--muted", "--log=warn");

// 実ファイルからフレーム数・尺・音声トラック有無を読む
const probe = (file) => {
  const json = execFileSync(
    "npx",
    ["remotion", "ffprobe", "-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", `${OUT}/${file}`],
    { encoding: "utf8" },
  );
  const info = JSON.parse(json.slice(json.indexOf("{")));
  const video = info.streams.find((s) => s.codec_type === "video");
  const hasAudio = info.streams.some((s) => s.codec_type === "audio");
  return {
    frames: Number(video.nb_read_frames),
    width: video.width,
    height: video.height,
    hasAudio,
  };
};

render("Ep2", "ep2_full.mp4");
for (const s of timing.segments) render(`Ep2-${s.id}`, `ep2_${s.id}.mp4`);
remotion("still", "src/index.ts", "Ep2Thumbnail", `${OUT}/ep2_thumbnail.png`, "--log=warn");

// ---- タイミング表 ----
const sec = (fr) => (fr / fps).toFixed(3);
const full = probe("ep2_full.mp4");
let start = 0;
const rows = [];
for (const s of timing.segments) {
  const p = probe(`ep2_${s.id}.mp4`);
  if (p.frames !== s.frames) throw new Error(`${s.id}: 想定${s.frames}f / 実際${p.frames}f`);
  if (p.hasAudio) throw new Error(`${s.id}: 音声トラックが含まれています`);
  rows.push(
    `| ${s.id} | ${s.label} | ${sec(p.frames)} | ${p.frames} | ${sec(start)} | ${sec(start + p.frames)} | ${sec(start + p.frames - holdFrames)} |`,
  );
  start += p.frames;
}
if (full.frames !== start) throw new Error(`結合版: 想定${start}f / 実際${full.frames}f`);
if (full.hasAudio) throw new Error("結合版に音声トラックが含まれています");

const { pause } = timing;
const pauseBase = timing.segments
  .slice(0, timing.segments.findIndex((s) => s.id === pause.segment))
  .reduce((a, s) => a + s.frames, 0);
const md = `# 第2話「上司の『ちょっといい？』が一番怖い」タイミング表

- 解像度: ${full.width}×${full.height} / ${fps}fps / H.264 / 音声トラックなし
- 結合版 ep2_full.mp4 の実尺: **${sec(full.frames)}秒（${full.frames}フレーム）**
- 各セグメントの末尾 ${holdFrames}フレーム（${sec(holdFrames)}秒）は動きを止めた余白です
- seg4 の「間」（上司が用件を言う直前・全員静止）: seg4開始から ${sec(pause.fromFrame)}〜${sec(pause.toFrame)}秒（結合版では ${sec(pauseBase + pause.fromFrame)}〜${sec(pauseBase + pause.toFrame)}秒）。上司の用件はその直後から

| セグメント | 内容 | 実尺(秒) | フレーム数 | 結合版の開始(秒) | 結合版の終了(秒) | 静止の開始(秒) |
|---|---|---|---|---|---|---|
${rows.join("\n")}
`;
writeFileSync(`${OUT}/ep2_timing.md`, md);
console.log(md);

// 歴史ch 第1本「神武東征」Short の納品物一式を out/jimmu/ に書き出す
//  ① jimmu_full.mp4（結合済み・無音）
//  ② jimmu_seg1.mp4〜jimmu_seg9.mp4（セグメント別・無音）
//  ③ jimmu_thumbnail.png
//  ④ jimmu_timing.md（各セグメントの実尺）
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "out/jimmu";
mkdirSync(OUT, { recursive: true });
const timing = JSON.parse(readFileSync("src/jimmu/timing.json", "utf8"));
const { fps, holdFrames } = timing;

const remotion = (...args) =>
  execFileSync("npx", ["remotion", ...args], { stdio: "inherit" });

// 同時描画数。切り絵は1フレームの描画が重く、多く並べると描きかけのフレーム（画面の一部が
// タイル状に並ぶ・人物が欠ける）が混ざるため、少なめに固定する。JIMMU_CONCURRENCY で変更可
const CONCURRENCY = process.env.JIMMU_CONCURRENCY ?? "1";
const render = (comp, file) =>
  remotion("render", "src/index.ts", comp, `${OUT}/${file}`, "--codec=h264", "--muted", "--log=warn", `--concurrency=${CONCURRENCY}`);

// 壊れたフレームの検出：前後で絵が急に変わったフレームを探す。
// セグメントの境目（紙めくりを含む前後15フレーム）以外で見つかったら書き出し失敗にする
const glitchCheck = (file, boundaries) => {
  // Remotion 同梱の ffmpeg には select フィルタがないので、システムの ffmpeg を使う
  const log = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", `${OUT}/${file}`, "-vf", "scale=540:960,select=gt(scene\\,0.25),metadata=print:file=-", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const frames = [...log.matchAll(/pts_time:([0-9.]+)/g)].map((m) => Math.round(Number(m[1]) * fps));
  const bad = frames.filter((fr) => !boundaries.some((b) => fr >= b - 2 && fr <= b + 15));
  if (bad.length) throw new Error(`${file}: 絵が急に変わるフレームがあります（壊れている可能性）: ${bad.join(", ")}`);
};

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

render("Jimmu", "jimmu_full.mp4");
for (const s of timing.segments) render(`Jimmu-${s.id}`, `jimmu_${s.id}.mp4`);
remotion("still", "src/index.ts", "JimmuThumbnail", `${OUT}/jimmu_thumbnail.png`, "--log=warn");

// ---- タイミング表 ----
const sec = (fr) => (fr / fps).toFixed(3);
const full = probe("jimmu_full.mp4");
let start = 0;
const rows = [];
for (const s of timing.segments) {
  const p = probe(`jimmu_${s.id}.mp4`);
  if (p.frames !== s.frames) throw new Error(`${s.id}: 想定${s.frames}f / 実際${p.frames}f`);
  if (p.hasAudio) throw new Error(`${s.id}: 音声トラックが含まれています`);
  rows.push(
    `| ${s.id} | ${s.label} | ${sec(p.frames)} | ${p.frames} | ${sec(start)} | ${sec(start + p.frames)} | ${sec(start + p.frames - holdFrames)} |`,
  );
  start += p.frames;
}
{
  const bounds = [0];
  for (const s of timing.segments) bounds.push(bounds[bounds.length - 1] + s.frames);
  glitchCheck("jimmu_full.mp4", bounds);
  for (const s of timing.segments) glitchCheck(`jimmu_${s.id}.mp4`, [0]);
}
if (full.frames !== start) throw new Error(`結合版: 想定${start}f / 実際${full.frames}f`);
if (full.hasAudio) throw new Error("結合版に音声トラックが含まれています");

const md = `# 歴史ch 第1本「神武天皇は実在したのか」Short タイミング表

- スタイル: 切り絵（和紙・影絵）＋地図の場面は作戦盤
- 解像度: ${full.width}×${full.height} / ${fps}fps / H.264 / 音声トラックなし
- 結合版 jimmu_full.mp4 の実尺: **${sec(full.frames)}秒（${full.frames}フレーム）**
- 各セグメントの末尾 ${holdFrames}フレーム（${sec(holdFrames)}秒）は動きを止めた余白です
- 尺は台本の目安秒数どおりの仮組みです（seg8 の二択は5秒、seg9 のチャンネル登録は3秒）。ナレーションの実尺が決まったら合わせ直せます

| セグメント | 内容 | 実尺(秒) | フレーム数 | 結合版の開始(秒) | 結合版の終了(秒) | 静止の開始(秒) |
|---|---|---|---|---|---|---|
${rows.join("\n")}
`;
writeFileSync(`${OUT}/jimmu_timing.md`, md);
console.log(md);

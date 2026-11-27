// 台本ファイルから作る回の納品物一式を out/<id>/ に書き出す
//   node scripts/render-episode.mjs <id>      例: node scripts/render-episode.mjs ep3
//  ① <id>_full.mp4（結合済み・無音）
//  ② <id>_seg1.mp4〜（セグメント別・無音）
//  ③ <id>_thumbnail.png
//  ④ <id>_timing.md（各セグメントの実尺・台本）
// 書き出したあと、フレーム数と音声トラックが無いことを確かめる
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const id = process.argv[2];
if (!id) {
  console.error("使い方: node scripts/render-episode.mjs <台本のファイル名（.yaml を除く）>");
  process.exit(1);
}

execFileSync("node", ["scripts/build-episodes.mjs"], { stdio: "inherit" });
const ep = JSON.parse(readFileSync("src/story/episodes.generated.json", "utf8")).find((e) => e.id === id);
if (!ep) {
  console.error(`episodes/${id}.yaml が見つかりません`);
  process.exit(1);
}

const OUT = `out/${id}`;
mkdirSync(OUT, { recursive: true });
const remotion = (...args) => execFileSync("npx", ["remotion", ...args], { stdio: "inherit" });
const render = (comp, file) =>
  remotion("render", "src/index.ts", comp, `${OUT}/${file}`, "--codec=h264", "--muted", "--log=warn");

const probe = (file) => {
  const json = execFileSync(
    "npx",
    ["remotion", "ffprobe", "-v", "error", "-count_frames", "-show_streams", "-of", "json", `${OUT}/${file}`],
    { encoding: "utf8" },
  );
  const info = JSON.parse(json.slice(json.indexOf("{")));
  const video = info.streams.find((s) => s.codec_type === "video");
  return {
    frames: Number(video.nb_read_frames),
    width: video.width,
    height: video.height,
    hasAudio: info.streams.some((s) => s.codec_type === "audio"),
  };
};

render(id, `${id}_full.mp4`);
for (const s of ep.segments) render(`${id}-${s.id}`, `${id}_${s.id}.mp4`);
remotion("still", "src/index.ts", `${id}-thumbnail`, `${OUT}/${id}_thumbnail.png`, "--log=warn");

// ---- 検品とタイミング表 ----
const { fps, hold } = ep;
const sec = (fr) => (fr / fps).toFixed(3);
const problems = [];
const full = probe(`${id}_full.mp4`);
const rows = [];
let start = 0;
for (const s of ep.segments) {
  const p = probe(`${id}_${s.id}.mp4`);
  if (p.frames !== s.frames) problems.push(`${s.id}: 想定${s.frames}フレーム / 実際${p.frames}フレーム`);
  if (p.hasAudio) problems.push(`${s.id}: 音声トラックが含まれています`);
  if (p.width !== 1080 || p.height !== 1920) problems.push(`${s.id}: 解像度が ${p.width}×${p.height} です`);
  rows.push(
    `| ${s.id} | ${s.label} | ${s.script.replaceAll("|", "／")} | ${sec(p.frames)} | ${p.frames} | ${sec(start)} | ${sec(start + p.frames)} | ${sec(start + p.frames - hold)} |`,
  );
  start += p.frames;
}
if (full.frames !== start) problems.push(`結合版: 想定${start}フレーム / 実際${full.frames}フレーム`);
if (full.hasAudio) problems.push("結合版に音声トラックが含まれています");
if (problems.length) {
  console.error(`✗ 検品で問題が見つかりました:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

const md = `# ${ep.title} タイミング表

- 解像度: ${full.width}×${full.height} / ${fps}fps / H.264 / 音声トラックなし
- 結合版 ${id}_full.mp4 の実尺: **${sec(full.frames)}秒（${full.frames}フレーム）**
- 各セグメントの末尾 ${hold}フレーム（${sec(hold)}秒）は動きを止めた余白です

| セグメント | 内容 | 台本 | 実尺(秒) | フレーム数 | 結合版の開始(秒) | 結合版の終了(秒) | 静止の開始(秒) |
|---|---|---|---|---|---|---|---|
${rows.join("\n")}
`;
writeFileSync(`${OUT}/${id}_timing.md`, md);
console.log(md);

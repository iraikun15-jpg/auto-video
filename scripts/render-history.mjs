// 日本史キット：台本（history/<id>.yaml）から納品物一式を out/history/<id>/ に書き出す
//   node scripts/render-history.mjs <id>          例: npm run history -- sample
//  ① <id>_full.mp4（結合済み・BGM と効果音入り・ナレーションなし）
//  ② <id>_full_light.mp4（スマホで受け取りやすい軽量版。中身は同じ）
//  ③ <id>_thumbnail.png
//  ④ <id>_timing.md（各場面の開始秒・効果音の位置・音量の測定値）
// 書き出し後に、フレーム数・音声トラック・壊れたフレーム・ラウドネスを自動で確認し、問題があれば失敗にする。
// SKIP_RENDER=1 なら書き出し済みのファイルで確認とタイミング表だけやり直す。
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const id = process.argv[2];
if (!id) {
  console.error("使い方: node scripts/render-history.mjs <台本のファイル名（.yaml を除く）>");
  process.exit(1);
}
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", ...opts });
run("node", ["scripts/build-history.mjs"]);
const ep = JSON.parse(readFileSync("src/history/generated.json", "utf8")).find((e) => e.id === id);
if (!ep) {
  console.error(`history/${id}.yaml が見つかりません`);
  process.exit(1);
}
const { fps: FPS, hold: HOLD, scenes, events, totalFrames } = ep;
const OUT = `out/history/${id}`;
mkdirSync(OUT, { recursive: true });
// 同時描画数は1（増やすと描きかけのフレームが混ざる。CLAUDE.md 参照）
const CONCURRENCY = process.env.HISTORY_CONCURRENCY ?? "1";

if (!process.env.SKIP_RENDER) {
  run("node", ["scripts/synth-history.mjs", id]);
  run("npx", ["remotion", "render", "src/index.ts", `h-${id}`, `${OUT}/${id}_full.mp4`, "--codec=h264", "--audio-codec=aac", "--log=warn", `--concurrency=${CONCURRENCY}`]);
  run("npx", ["remotion", "still", "src/index.ts", `h-${id}-thumbnail`, `${OUT}/${id}_thumbnail.png`, "--log=warn"]);
  run("ffmpeg", ["-loglevel", "error", "-y", "-i", `${OUT}/${id}_full.mp4`, "-c:v", "libx264", "-crf", "24", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", `${OUT}/${id}_full_light.mp4`]);
}

// ---- 確認 ----
const probe = (file) => {
  const info = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-show_streams", "-of", "json", `${OUT}/${file}`], { encoding: "utf8" }));
  const v = info.streams.find((s) => s.codec_type === "video");
  return { frames: Number(v.nb_read_frames), width: v.width, height: v.height, audio: info.streams.some((s) => s.codec_type === "audio") };
};
const boundaries = scenes.map((s) => s.start);
const glitchCheck = (file) => {
  const log = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", `${OUT}/${file}`, "-vf", "scale=540:960,select=gt(scene\\,0.25),metadata=print:file=-", "-an", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const frames = [...log.matchAll(/pts_time:([0-9.]+)/g)].map((m) => Math.round(Number(m[1]) * FPS));
  const bad = frames.filter((fr) => !boundaries.some((b) => fr >= b - 2 && fr <= b + 15));
  if (bad.length) throw new Error(`${file}: 絵が急に変わるフレームがあります（壊れている可能性）: ${bad.join(", ")}`);
  return frames;
};
const measure = (file) => {
  const r = execFileSync("sh", ["-c", `ffmpeg -nostats -i "${OUT}/${file}" -vn -af ebur128=peak=true -f null - 2>&1`], { encoding: "utf8" });
  const sum = r.slice(r.lastIndexOf("Summary:"));
  return { I: Number(/I:\s+(-?[0-9.]+) LUFS/.exec(sum)[1]), peak: Number(/Peak:\s+(-?[0-9.]+) dBFS/.exec(sum)[1]) };
};

const full = probe(`${id}_full.mp4`);
const light = probe(`${id}_full_light.mp4`);
for (const [name, p] of [[`${id}_full.mp4`, full], [`${id}_full_light.mp4`, light]]) {
  if (p.frames !== totalFrames) throw new Error(`${name}: 想定${totalFrames}f / 実際${p.frames}f`);
  if (p.width !== 1080 || p.height !== 1920) throw new Error(`${name}: 解像度 ${p.width}×${p.height}`);
  if (!p.audio) throw new Error(`${name}: 音声トラックがありません`);
}
const changes = glitchCheck(`${id}_full.mp4`);
glitchCheck(`${id}_full_light.mp4`);
const loud = measure(`${id}_full.mp4`);
if (loud.peak > -5) throw new Error(`ピークが高すぎます: ${loud.peak} dBFS`);

// ---- タイミング表 ----
const sec = (fr) => (fr / FPS).toFixed(2);
const rows = scenes.map((s) => `| ${s.id} | ${s.label} | ${sec(s.start)} | ${sec(s.start + s.frames)} | ${sec(s.frames)} | ${sec(s.start + s.frames - HOLD)} |`);
const NAME = { hook: "冒頭フック：拍子木＋太鼓の一打", stamp: "判子", transition: "場面転換", click: "登録ボタンのクリック", ting: "金の判子の鈴" };
const sfx = events.filter((e) => e.kind !== "place").map((e) => `| ${sec(e.frame)} | ${NAME[e.kind]}（${e.seg}） |`);
const md = `# ${ep.title} タイミング表

- 解像度: ${full.width}×${full.height} / ${FPS}fps / H.264 ＋ AAC（BGM・効果音入り、ナレーションなし）
- 結合版 ${id}_full.mp4 の実尺: **${sec(full.frames)}秒（${full.frames}フレーム）**
- 音量: 全体 ${loud.I} LUFS、ピーク ${loud.peak} dBFS（ナレーションの邪魔にならないよう小さめ）
- 各場面の末尾 ${HOLD}フレーム（${sec(HOLD)}秒）は動きを止めた余白です
- 札が貼られるときの小さな「コトッ」は表から省いています

## 場面の開始秒（ナレーション同期用）

| 場面 | 内容 | 開始(秒) | 終了(秒) | 長さ(秒) | 静止の開始(秒) |
|---|---|---|---|---|---|
${rows.join("\n")}

## 効果音の位置

| 時刻(秒) | 音 |
|---|---|
${sfx.join("\n")}

（確認：絵が急に変わったのは ${changes.map((f) => sec(f)).join("・") || "なし"} 秒＝場面の境目のみ）
`;
writeFileSync(`${OUT}/${id}_timing.md`, md);
console.log(md);

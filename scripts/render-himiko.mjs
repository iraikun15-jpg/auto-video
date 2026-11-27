// もしも日本史ラボ 第6本「卑弥呼は実在したのか」の納品物を out/himiko/ に書き出す
//  ① himiko_full.mp4（結合済み・BGM と効果音入り・ナレーションなし）
//  ② himiko_full_light.mp4（スマホで受け取りやすい軽量版。中身は同じ）
//  ③ himiko_thumbnail.png
//  ④ himiko_timing.md（各場面の開始秒・効果音の位置・音量の測定値）
// 書き出し後に、フレーム数・音声トラック・壊れたフレーム・ラウドネスを自動で確認し、問題があれば失敗にする
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const OUT = "out/himiko";
mkdirSync(OUT, { recursive: true });

const tmp = path.resolve("node_modules/.cache/himiko-events-render.mjs");
mkdirSync(path.dirname(tmp), { recursive: true });
await build({ entryPoints: ["src/himiko/events.ts"], bundle: true, platform: "node", format: "esm", outfile: tmp, logLevel: "error" });
const EV = await import(pathToFileURL(tmp).href);
rmSync(tmp);
const { FPS, HOLD, SEGMENTS, TOTAL_FRAMES, STAMPS, STAMP_LAND, CLICK_AT, HOOK_AT, MIRRORS_FROM, MIRRORS_TO, segStart } = EV;

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", ...opts });
// 同時描画数は1（増やすと描きかけのフレームが混ざる。CLAUDE.md 参照）
const CONCURRENCY = process.env.HIMIKO_CONCURRENCY ?? "1";

// ---- 音を合成して、映像と一緒に書き出す ----
// SKIP_RENDER=1 なら書き出し済みのファイルで確認とタイミング表だけやり直す
if (!process.env.SKIP_RENDER) {
  run("node", ["scripts/synth-himiko.mjs"]);
  run("npx", ["remotion", "render", "src/index.ts", "Himiko", `${OUT}/himiko_full.mp4`, "--codec=h264", "--audio-codec=aac", "--log=warn", `--concurrency=${CONCURRENCY}`]);
  run("npx", ["remotion", "still", "src/index.ts", "HimikoThumbnail", `${OUT}/himiko_thumbnail.png`, "--log=warn"]);
  run("ffmpeg", ["-loglevel", "error", "-y", "-i", `${OUT}/himiko_full.mp4`, "-c:v", "libx264", "-crf", "24", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", `${OUT}/himiko_full_light.mp4`]);
}

// ---- 確認 ----
const probe = (file) => {
  const info = JSON.parse(
    execFileSync("ffprobe", ["-v", "error", "-count_frames", "-show_streams", "-of", "json", `${OUT}/${file}`], { encoding: "utf8" }),
  );
  const v = info.streams.find((s) => s.codec_type === "video");
  return { frames: Number(v.nb_read_frames), width: v.width, height: v.height, audio: info.streams.some((s) => s.codec_type === "audio") };
};
const boundaries = [];
{
  let f = 0;
  for (const s of SEGMENTS) {
    boundaries.push(f);
    f += s.frames;
  }
}
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
  const I = Number(/I:\s+(-?[0-9.]+) LUFS/.exec(sum)[1]);
  const peak = Number(/Peak:\s+(-?[0-9.]+) dBFS/.exec(sum)[1]);
  return { I, peak };
};

const full = probe("himiko_full.mp4");
const light = probe("himiko_full_light.mp4");
for (const [name, p] of [["himiko_full.mp4", full], ["himiko_full_light.mp4", light]]) {
  if (p.frames !== TOTAL_FRAMES) throw new Error(`${name}: 想定${TOTAL_FRAMES}f / 実際${p.frames}f`);
  if (p.width !== 1080 || p.height !== 1920) throw new Error(`${name}: 解像度 ${p.width}×${p.height}`);
  if (!p.audio) throw new Error(`${name}: 音声トラックがありません`);
}
const changes = glitchCheck("himiko_full.mp4");
glitchCheck("himiko_full_light.mp4");
const loud = measure("himiko_full.mp4");
if (loud.peak > -5) throw new Error(`ピークが高すぎます: ${loud.peak} dBFS`);

// ---- タイミング表 ----
const sec = (fr) => (fr / FPS).toFixed(2);
const rows = SEGMENTS.map((s) => {
  const st = segStart(s.id);
  return `| ${s.id} | ${s.label} | ${sec(st)} | ${sec(st + s.frames)} | ${sec(s.frames)} | ${sec(st + s.frames - HOLD)} |`;
});
const sfx = [];
for (const s of SEGMENTS) {
  if (s.id !== "seg1") sfx.push(`| ${sec(segStart(s.id))} | ページめくり（${s.id} の始まり） |`);
  for (const at of STAMPS[s.id]) sfx.push(`| ${sec(segStart(s.id) + at + STAMP_LAND)} | 判子（${s.id}） |`);
}
sfx.push(`| ${sec(segStart("seg1") + HOOK_AT)} | 冒頭フック：拍子木＋太鼓の一打（seg1） |`);
sfx.push(`| ${sec(segStart("seg3") + MIRRORS_FROM)}〜${sec(segStart("seg3") + MIRRORS_TO)} | 銅鏡が並ぶ小さな鈴（seg3） |`);
sfx.push(`| ${sec(segStart("seg9") + CLICK_AT)} | 登録ボタンのクリック（seg9） |`);
sfx.sort((a, b) => parseFloat(a.slice(2)) - parseFloat(b.slice(2)));

const md = `# もしも日本史ラボ 第6本「卑弥呼は実在したのか」タイミング表

- 解像度: ${full.width}×${full.height} / ${FPS}fps / H.264 ＋ AAC（BGM・効果音入り、ナレーションなし）
- 結合版 himiko_full.mp4 の実尺: **${sec(full.frames)}秒（${full.frames}フレーム）**
- 音量: 全体 ${loud.I} LUFS、ピーク ${loud.peak} dBFS（ナレーションの邪魔にならないよう小さめ）
- 各場面の末尾 ${HOLD}フレーム（${sec(HOLD)}秒）は動きを止めた余白です
- 冒頭0〜1.7秒に大きなテロップ「教科書では教えてくれない女王」（新しいフック型）。1.9秒ごろ「日本の歴史書に名前がない」の判子。
- 場面の並びは台本どおり（判定 → 二択 → 登録）。邪馬台国の場所には触れていません。「以上、もしも日本史ラボでした。」は seg9 の最後（チャンネル名の札が出るところ）に入ります

## 場面の開始秒（ナレーション同期用）

| 場面 | 内容 | 開始(秒) | 終了(秒) | 長さ(秒) | 静止の開始(秒) |
|---|---|---|---|---|---|
${rows.join("\n")}

## 効果音の位置

| 時刻(秒) | 音 |
|---|---|
${sfx.join("\n")}

（確認：絵が急に変わったのは ${changes.map((f) => sec(f)).join("・")} 秒＝場面の境目のみ）
`;
writeFileSync(`${OUT}/himiko_timing.md`, md);
console.log(md);

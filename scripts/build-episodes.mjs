// 台本ファイル（episodes/*.yaml）を読み、書き間違いを日本語で知らせてから
// 動画用のデータ（src/story/episodes.generated.json）に変換する。
//
//   node scripts/build-episodes.mjs          … 全部の台本を変換
//   node scripts/build-episodes.mjs --list   … 公開: true の台本の名前を1行ずつ出す（CI用）
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { parse } from "yaml";

const NAMES = JSON.parse(readFileSync("src/story/names.json", "utf8"));
const FPS = 30;
const DIR = "episodes";
const OUT = "src/story/episodes.generated.json";

// ---- 名前の解決 ----
const codesOf = (table) => new Set(Object.values(table));
const POSE_CODES = codesOf(NAMES.poses);
const lookup = (table, name, extra = {}) => {
  if (name == null) return undefined;
  const s = String(name).trim();
  if (s in table) return table[s];
  if (s in extra) return extra[s];
  if (codesOf(table).has(s)) return s; // 英字の名前もそのまま使える
  return undefined;
};
const poseCode = (name) => lookup(NAMES.poses, name, NAMES.poseAliases);

class ScriptError extends Error {}
const fail = (where, msg) => {
  throw new ScriptError(`${where}: ${msg}`);
};
const list = (table) => Object.keys(table).join("・");

const num = (v, where, what) => {
  const n = Number(v);
  if (v === undefined || v === null || v === "" || Number.isNaN(n)) fail(where, `「${what}」は数字で書いてください（いま: ${JSON.stringify(v)}）`);
  return n;
};
const sec2f = (s) => Math.round(s * FPS);
const facing = (v, where) => {
  if (v === undefined) return undefined;
  if (v === "右" || v === 1 || v === "right") return 1;
  if (v === "左" || v === -1 || v === "left") return -1;
  fail(where, `「向き」は 右 か 左 で書いてください（いま: ${v}）`);
};

// 動き・文字のオプション（日本語キー → 内部名）。秒で書くものはフレームに直す
const OPT_KEYS = {
  x: ["x", "num"],
  y: ["y", "num"],
  向き: ["facing", "facing"],
  時間: ["dur", "sec"],
  到着: ["to", "num"],
  速さ: ["speed", "num"],
  のち: ["then", "pose"],
  回数: ["times", "num"],
  高さ: ["height", "num"],
  強さ: ["power", "num"],
  大きさ: ["size", "num"],
  動き方: ["ease", "str"],
  文: ["text", "str"],
  色: ["color", "color"],
  位置: ["place", "str"],
};

const readOpts = (raw, where, allowed = Object.keys(OPT_KEYS)) => {
  const out = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    if (!allowed.includes(k)) fail(where, `「${k}」という指定はありません。使えるのは ${allowed.join("・")}`);
    const [key, type] = OPT_KEYS[k];
    if (type === "num") out[key] = num(v, where, k);
    else if (type === "sec") out[key] = sec2f(num(v, where, k));
    else if (type === "facing") out[key] = facing(v, where);
    else if (type === "pose") {
      out[key] = poseCode(v);
      if (!out[key]) fail(where, `「のち: ${v}」のポーズがありません。使えるポーズ: ${list(NAMES.poses)}`);
    } else if (type === "color") {
      out[key] = lookup(NAMES.colors, v);
      if (!out[key]) fail(where, `「色: ${v}」は使えません。使える色: ${list(NAMES.colors)}`);
    } else out[key] = String(v);
  }
  return out;
};

// ---- 1本の台本を変換 ----
const buildEpisode = (file) => {
  const id = basename(file, ".yaml");
  if (!/^[a-z0-9-]+$/.test(id)) fail(file, "ファイル名は半角の英小文字・数字・ハイフンだけにしてください（例: ep3.yaml）");
  const raw = parse(readFileSync(`${DIR}/${file}`, "utf8")) ?? {};
  const W = (s) => `${file} ${s}`;

  const hold = sec2f(raw.静止 ?? 0.3);

  // 登場人物
  const cast = {};
  for (const [name, c] of Object.entries(raw.登場人物 ?? {})) {
    const where = W(`登場人物「${name}」`);
    const color = lookup(NAMES.colors, c?.色 ?? "黒");
    if (!color) fail(where, `「色: ${c.色}」は使えません。使える色: ${list(NAMES.colors)}`);
    const pose = poseCode(c?.ポーズ ?? "立つ");
    if (!pose) fail(where, `「ポーズ: ${c.ポーズ}」がありません。使えるポーズ: ${list(NAMES.poses)}`);
    cast[name] = {
      color,
      tie: c?.ネクタイ ?? color === "red",
      x: num(c?.x ?? 540, where, "x"),
      facing: facing(c?.向き ?? "右", where),
      pose,
      always: c?.最初から === true,
    };
  }
  if (Object.keys(cast).length === 0) fail(W(""), "「登場人物」が1人もいません");

  // 背景・小道具
  const readBackground = (v, where) => {
    const bg = lookup(NAMES.backgrounds, v);
    if (!bg) fail(where, `「${v}」はありません。使える背景: ${list(NAMES.backgrounds)}`);
    return bg;
  };
  const readProps = (arr, prefix) => (arr ?? []).map((p, i) => {
    const where = W(`${prefix}小道具 ${i + 1}個目`);
    const type = lookup(NAMES.props, p?.種類);
    if (!type) fail(where, `「種類: ${p?.種類}」はありません。使える小道具: ${list(NAMES.props)}`);
    const opts = {};
    for (const [k, v] of Object.entries(p)) {
      if (k === "種類") continue;
      const NUM = { x: "x", y: "y", 幅: "width", 傾き: "tilt", 開き: "open", 数: "count" };
      if (k in NUM) opts[NUM[k]] = num(v, where, k);
      else if (k === "前") opts.front = v === true;
      else if (k === "点く") opts.on = v === true;
      else if (k === "文") opts.text = String(v);
      else if (k === "時刻") {
        if (!/^\d{1,2}:\d{2}$/.test(String(v))) fail(where, `「時刻」は "17:59" のように書いてください（いま: ${v}）`);
        opts.time = String(v);
      } else fail(where, `「${k}」という指定はありません。使えるのは 種類・x・y・幅・傾き・前・開き・数・点く・文・時刻`);
    }
    return { type, ...opts };
  });
  const background = readBackground(raw.背景 ?? "床", W("背景"));
  const props = readProps(raw.小道具, "");

  // セグメント
  const segsRaw = raw.セグメント ?? [];
  if (segsRaw.length === 0) fail(W(""), "「セグメント」がありません");
  let start = 0;
  const segments = [];
  const actions = [];
  segsRaw.forEach((s, si) => {
    const sid = String(s?.id ?? `seg${si + 1}`);
    if (!/^[a-zA-Z0-9-]+$/.test(sid)) fail(W(`セグメント ${si + 1}`), "id は半角英数字にしてください（例: seg1）");
    const where = W(sid);
    const frames = sec2f(num(s?.秒, where, "秒"));
    if (frames <= hold + 1) fail(where, "「秒」が短すぎます");
    const end = start + frames;
    const at = (t, w) => {
      const f = start + sec2f(num(t, w, "秒"));
      if (f >= end) fail(w, `${t}秒はこのセグメント（${s.秒}秒）の外です`);
      return f;
    };

    (s.動き ?? []).forEach((a, ai) => {
      const w = `${where} の動き ${ai + 1}行目`;
      // [秒, 誰, 何, {オプション}] か { 秒:, 誰:, 何:, ... } のどちらでも書ける
      const [t, who, what, opt] = Array.isArray(a) ? a : [a?.秒, a?.誰, a?.何, Object.fromEntries(Object.entries(a ?? {}).filter(([k]) => !["秒", "誰", "何"].includes(k)))];
      if (who !== "画面" && !(who in cast)) fail(w, `「${who}」は登場人物にいません。登場人物: ${Object.keys(cast).join("・")}${NAMES.effects && Object.keys(NAMES.effects).length ? "（画面全体の演出は 誰 を「画面」に）" : ""}`);
      const frame = at(t, w);
      const opts = readOpts(opt, w);
      const pose = poseCode(what);
      const motion = lookup(NAMES.motions, what);
      const effect = lookup(NAMES.effects, what);
      let kind;
      let code;
      if (motion) [kind, code] = ["motion", motion];
      else if (pose) [kind, code] = ["pose", pose];
      else if (effect) [kind, code] = ["effect", effect];
      else
        fail(
          w,
          `「${what}」というポーズ・動き・演出はありません。\n  ポーズ: ${list(NAMES.poses)}\n  動き: ${list(NAMES.motions)}${Object.keys(NAMES.effects).length ? `\n  演出: ${list(NAMES.effects)}` : ""}`,
        );
      if (who === "画面" && kind !== "effect") fail(w, "「画面」に付けられるのは演出だけです");
      if (who === "画面" && !["focus", "shake", "flash", "dim"].includes(code)) fail(w, `「${what}」は人物に付ける演出です。「画面」に付けられるのは 集中線・揺れ・フラッシュ・暗くなる`);
      if ((code === "walk" || code === "run") && opts.to === undefined) fail(w, `「${what}」には行き先の「到着: x座標」が必要です（例: { 到着: 700 }）`);
      actions.push({ who, start: frame, kind, code, seg: si, opts });
    });

    const texts = (s.文字 ?? []).map((tx, ti) => {
      const w = `${where} の文字 ${ti + 1}個目`;
      const { 秒: t, 消える, ...rest } = tx ?? {};
      const opts = readOpts(rest, w, ["文", "色", "大きさ", "位置", "y"]);
      if (!opts.text) fail(w, "「文」がありません");
      return {
        start: at(t ?? 0, w),
        end: 消える === undefined ? end : at(消える, w),
        ...opts,
        color: opts.color ?? "ink",
      };
    });

    // セグメントごとに背景・小道具を変えられる（書かなければ全体の設定）
    const segBg = s.背景 === undefined ? undefined : readBackground(s.背景, `${where} の背景`);
    const segProps = s.小道具 === undefined ? undefined : readProps(s.小道具, `${sid} の`);
    segments.push({ id: sid, label: String(s.内容 ?? ""), script: String(s.台本 ?? ""), start, frames, texts, background: segBg, props: segProps });
    start = end;
  });
  // 同じ時刻の動きは書いた順のまま、時刻順に並べる
  actions.sort((a, b) => a.start - b.start);

  // サムネイル
  const th = raw.サムネイル ?? {};
  const thSeg = segments.findIndex((s) => s.id === String(th.セグメント ?? segments[0].id));
  if (thSeg < 0) fail(W("サムネイル"), `セグメント「${th.セグメント}」がありません`);
  const thumbnail = {
    frame: segments[thSeg].start + Math.min(sec2f(num(th.秒 ?? 0, W("サムネイル"), "秒")), segments[thSeg].frames - hold - 1),
    texts: (th.文字 ?? []).map((tx, i) => {
      const opts = readOpts(tx, W(`サムネイル 文字 ${i + 1}個目`), ["文", "色", "大きさ", "位置", "y"]);
      return { ...opts, color: opts.color ?? "ink" };
    }),
  };

  return {
    id,
    title: String(raw.タイトル ?? id),
    release: raw.公開 === true,
    fps: FPS,
    hold,
    background,
    props,
    cast,
    segments,
    actions,
    thumbnail,
    totalFrames: start,
  };
};

const files = readdirSync(DIR).filter((f) => f.endsWith(".yaml")).sort();
const episodes = [];
let ok = true;
for (const f of files) {
  try {
    episodes.push(buildEpisode(f));
  } catch (e) {
    if (!(e instanceof ScriptError)) throw e;
    ok = false;
    console.error(`✗ 台本の書き間違い: ${e.message}`);
  }
}
if (!ok) process.exit(1);

if (process.argv.includes("--list")) {
  for (const e of episodes) if (e.release) console.log(e.id);
} else {
  writeFileSync(OUT, JSON.stringify(episodes, null, 1) + "\n");
  for (const e of episodes) console.log(`✓ ${e.id}（${e.title}）: ${e.segments.length}セグメント・${(e.totalFrames / FPS).toFixed(1)}秒${e.release ? "・公開" : ""}`);
}

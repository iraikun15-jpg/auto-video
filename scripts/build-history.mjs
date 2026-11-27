// 日本史キット：台本（history/*.yaml）を読み、書き間違いを日本語で知らせてから
// 映像と音の両方が読むデータ（src/history/generated.json）に変換する。
// 場面の中の出現タイミング・判子・効果音の位置はここで決める（これまでの回の events.ts の役目）。
//
//   node scripts/build-history.mjs            … 全部の台本を変換
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { parse } from "yaml";

const N = JSON.parse(readFileSync("src/history/names.json", "utf8"));
const FPS = 30;
const HOLD = 9; // 各場面の末尾 0.3 秒は静止
const STAMP_LAND = 7; // 判子は押し始めから7フレームで紙に着く
const DIR = "history";
const OUT = "src/history/generated.json";

class ScriptError extends Error {}
const fail = (where, msg) => {
  throw new ScriptError(`${where}: ${msg}`);
};
const list = (t) => Object.keys(t).join("・");
const f = (sec) => Math.round(sec * FPS);
const num = (v, where, what) => {
  const n = Number(v);
  if (v === undefined || v === null || v === "" || Number.isNaN(n)) fail(where, `「${what}」は数字で書いてください（いま: ${JSON.stringify(v)}）`);
  return n;
};
const pick = (table, v, where, what) => {
  if (v === undefined) return undefined;
  const s = String(v).trim();
  if (s in table) return table[s];
  if (Object.values(table).includes(s)) return s;
  fail(where, `${what}「${s}」はありません。使えるのは: ${list(table)}`);
};
const color = (v, where, fallback) => {
  if (v === undefined) return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(String(v))) return String(v);
  return pick(N.colors, v, where, "色");
};
const lines = (v) => (v === undefined ? [] : Array.isArray(v) ? v.map(String) : String(v).split(/\n|／/));
const allowKeys = (obj, keys, where) => {
  for (const k of Object.keys(obj ?? {})) if (!keys.includes(k)) fail(where, `「${k}」という指定はありません。使えるのは ${keys.join("・")}`);
};

const COMMON = ["型", "秒", "内容", "見出し", "人物", "判子", "札", "部品"];
const TYPE_KEYS = {
  hook: ["大見出し"],
  intro: ["名前"],
  timeline: ["項目"],
  map: ["地点", "線"],
  points: ["項目"],
  compare: ["左", "右"],
  ifcase: ["史実", "もしも"],
  verdict: ["判定", "金"],
  choice: ["A", "B"],
  subscribe: [],
  title: ["大見出し"],
  chapter: ["題"],
  narration: ["項目"],
  summary: ["項目"],
};

const buildEpisode = (file) => {
  const id = basename(file, ".yaml");
  if (!/^[a-z0-9-]+$/.test(id)) fail(file, "ファイル名は半角の英小文字・数字・ハイフンだけにしてください（例: soga.yaml）");
  const raw = parse(readFileSync(`${DIR}/${file}`, "utf8")) ?? {};
  const W = (s) => `${file} ${s}`;
  allowKeys(raw, ["タイトル", "画面", "見た目", "音", "場面", "サムネイル"], W(""));
  // 画面の向き：縦（Short・1080×1920）／横（長尺・1920×1080）
  if (raw.画面 !== undefined && raw.画面 !== "縦" && raw.画面 !== "横") fail(W("画面"), "「画面」は 縦 か 横 で書いてください");
  const wide = raw.画面 === "横";

  // ---- 見た目 ----
  const look = raw.見た目 ?? {};
  allowKeys(look, ["舞うもの", "転換", "札の色", "札の文字色", "主役", "夜"], W("見た目"));
  const hero = look.主役 ?? {};
  allowKeys(hero, ["種類", "色", "ふち"], W("見た目 主役"));
  const style = {
    particles: pick(N.particles, look.舞うもの ?? "金の小片", W("見た目"), "舞うもの"),
    transition: pick(N.transitions, look.転換 ?? "紙めくり", W("見た目"), "転換"),
    tagBg: color(look.札の色, W("見た目"), N.colors.紺),
    tagColor: color(look.札の文字色, W("見た目"), N.colors.生成り),
    night: look.夜 === true,
    hero: {
      kind: pick(N.people, hero.種類 ?? "貴人", W("見た目 主役"), "人物"),
      color: color(hero.色, W("見た目 主役"), undefined),
      outline: hero.ふち === undefined ? undefined : color(hero.ふち, W("見た目 主役"), undefined),
    },
  };

  // ---- 音 ----
  const snd = raw.音 ?? {};
  allowKeys(snd, ["楽器", "音階", "速さ", "持続音", "鈴", "鐘", "大きさ"], W("音"));
  const audio = {
    instrument: pick(N.instruments, snd.楽器 ?? "箏", W("音"), "楽器"),
    scale: N.scales[snd.音階 ?? "律"] ?? fail(W("音"), `音階「${snd.音階}」はありません。使えるのは: ${list(N.scales)}`),
    tempo: num(snd.速さ ?? 62, W("音"), "速さ"),
    pad: snd.持続音 !== false,
    bells: snd.鈴 === true,
    gong: snd.鐘 !== false,
    lufs: num(snd.大きさ ?? -28, W("音"), "大きさ"),
  };

  // ---- 場面 ----
  const scenesRaw = raw.場面 ?? [];
  if (scenesRaw.length === 0) fail(W(""), "「場面」がありません");
  let start = 0;
  let chapterNo = 0;
  const chapters = []; // 長尺の章（YouTube のチャプター用）
  const events = []; // 効果音のきっかけ（結合版のフレーム）
  const scenes = scenesRaw.map((s, si) => {
    const sid = `seg${si + 1}`;
    const where = W(`場面${si + 1}（${s?.型 ?? "型なし"}）`);
    const type = pick(N.sceneTypes, s?.型, where, "型");
    if (!type) fail(where, `「型」がありません。使えるのは: ${list(N.sceneTypes)}`);
    allowKeys(s, [...COMMON, ...TYPE_KEYS[type]], where);
    const frames = f(num(s.秒, where, "秒"));
    if (frames < 45) fail(where, "「秒」は 1.5 秒以上にしてください");
    const last = frames - HOLD - 1; // 動いてよい最後のフレーム
    const at = (sec, w, def) => {
      const fr = sec === undefined ? def : f(num(sec, w, "秒"));
      if (fr > last) fail(w, `${sec}秒は場面（${s.秒}秒、最後の0.3秒は静止）の外です`);
      return fr;
    };
    // 項目を場面の前半〜6割（長い場面は8割5分）に等間隔で出す
    const spread = (n, from = 12, until = Math.round(last * (frames > 600 ? 0.85 : 0.6))) =>
      Array.from({ length: n }, (_, i) => Math.round(from + (n <= 1 ? 0 : ((until - from) * i) / (n - 1))));

    const sc = { id: sid, type, start, frames, label: String(s.内容 ?? Object.keys(N.sceneTypes).find((k) => N.sceneTypes[k] === type)) };
    if (s.見出し !== undefined) sc.heading = String(s.見出し);

    // 人物（既定は主役。なし で出さない）
    if (s.人物 === "なし" || s.人物 === false) sc.person = null;
    else if (s.人物 !== undefined) {
      const p = typeof s.人物 === "string" ? { 種類: s.人物 } : s.人物;
      allowKeys(p, ["種類", "色", "ふち", "x", "y", "大きさ", "向き"], `${where} 人物`);
      sc.person = {
        kind: pick(N.people, p.種類 ?? hero.種類 ?? "貴人", `${where} 人物`, "人物"),
        color: color(p.色, `${where} 人物`, p.種類 ? undefined : style.hero.color),
        outline: p.ふち === undefined ? (p.種類 ? undefined : style.hero.outline) : color(p.ふち, `${where} 人物`, undefined),
        x: p.x === undefined ? undefined : num(p.x, where, "x"),
        y: p.y === undefined ? undefined : num(p.y, where, "y"),
        s: p.大きさ === undefined ? undefined : num(p.大きさ, where, "大きさ"),
        flip: p.向き === "左",
      };
    }

    // 判子（1つでも複数でも）
    const stampDefault = type === "hook" ? -STAMP_LAND : Math.max(0, last - 50);
    sc.stamps = (s.判子 === undefined ? [] : Array.isArray(s.判子) ? s.判子 : [s.判子]).map((st, k) => {
      const o = typeof st === "string" ? { 文: st } : st;
      const w = `${where} 判子${k + 1}`;
      allowKeys(o, ["文", "秒", "丸", "色", "x", "y", "大きさ"], w);
      if (!o.文) fail(w, "「文」がありません");
      const press = o.秒 === undefined ? (k === 0 ? stampDefault : stampDefault - 30 * k) : at(o.秒, w) - STAMP_LAND;
      events.push({ kind: "stamp", frame: Math.max(0, start + press + STAMP_LAND), seg: sid });
      return {
        text: String(o.文),
        at: press,
        round: o.丸 === true,
        color: color(o.色, w, N.colors.朱),
        x: o.x === undefined ? undefined : num(o.x, w, "x"),
        y: o.y === undefined ? undefined : num(o.y, w, "y"),
        size: o.大きさ === undefined ? undefined : num(o.大きさ, w, "大きさ"),
      };
    });

    // 下の札（ひとこと）
    if (s.札 !== undefined) {
      const o = typeof s.札 === "string" ? { 文: s.札 } : s.札;
      allowKeys(o, ["文", "秒", "色"], `${where} 札`);
      sc.note = { text: String(o.文), at: at(o.秒, `${where} 札`, Math.round(last * 0.55)), bg: color(o.色, `${where} 札`, N.colors.墨) };
    }

    // 部品（日輪・法隆寺など）
    sc.parts = (s.部品 ?? []).map((p, k) => {
      const w = `${where} 部品${k + 1}`;
      allowKeys(p, ["名前", "x", "y", "大きさ", "秒", "色"], w);
      return {
        name: pick(N.parts, p.名前, w, "部品"),
        x: num(p.x ?? 540, w, "x"),
        y: num(p.y ?? 900, w, "y"),
        s: num(p.大きさ ?? 1, w, "大きさ"),
        at: at(p.秒, w, 0),
        color: color(p.色, w, undefined),
      };
    });

    // ---- 型ごとの中身 ----
    if (type === "hook") {
      const big = lines(s.大見出し);
      if (big.length === 0 || big.length > 2) fail(where, "「大見出し」は1〜2行で書いてください（例: [教科書の天才、, 実は矛盾だらけ？]）");
      sc.big = big;
      if (si === 0) events.push({ kind: "hook", frame: start, seg: sid });
    }
    if (type === "title") {
      const big = lines(s.大見出し ?? raw.タイトル);
      if (big.length === 0 || big.length > 2) fail(where, "「大見出し」は1〜2行で書いてください");
      sc.big = big;
      if (si === 0) events.push({ kind: "hook", frame: start, seg: sid });
    }
    if (type === "chapter") {
      if (!s.題) fail(where, "「題: 神話の中の天皇」のように章の題を書いてください");
      chapterNo += 1;
      sc.chapterNo = chapterNo;
      sc.chapterTitle = String(s.題);
      chapters.push({ title: sc.chapterTitle, frame: start, no: chapterNo });
    }
    if (type === "intro") {
      const n = s.名前 ?? {};
      allowKeys(n, ["大", "読み", "注"], `${where} 名前`);
      if (!n.大) fail(where, "「名前: { 大: 厩戸皇子 }」のように名前を書いてください");
      sc.name = { big: String(n.大), reading: n.読み && String(n.読み), note: n.注 && String(n.注), at: [10, 30, 44] };
    }
    if (type === "timeline" || type === "points" || type === "narration" || type === "summary") {
      const items = s.項目 ?? [];
      const max = type === "timeline" || type === "points" ? 5 : 6;
      if ((items.length === 0 && type !== "narration") || items.length > max) fail(where, `「項目」は1〜${max}個で書いてください`);
      const times = spread(items.length);
      sc.items = items.map((it, k) => {
        const w = `${where} 項目${k + 1}`;
        const o = typeof it === "string" || typeof it === "number" ? { 文: it } : it;
        allowKeys(o, ["年", "文", "秒"], w);
        const fr = at(o.秒, w, times[k]);
        events.push({ kind: "place", frame: start + fr, seg: sid });
        return { year: o.年 === undefined ? undefined : String(o.年), text: String(o.文 ?? ""), at: fr };
      });
    }
    if (type === "map") {
      const pts = s.地点 ?? [];
      if (pts.length < 1 || pts.length > 6) fail(where, "「地点」は1〜6個で書いてください");
      const times = spread(pts.length, 16, Math.round(last * 0.7));
      sc.places = pts.map((p, k) => {
        const w = `${where} 地点${k + 1}`;
        allowKeys(p, ["名前", "経度", "緯度", "秒"], w);
        const lon = num(p.経度, w, "経度");
        const lat = num(p.緯度, w, "緯度");
        if (lon < 128 || lon > 146 || lat < 30 || lat > 46) fail(w, "経度は128〜146、緯度は30〜46の範囲（日本列島）で書いてください");
        const fr = at(p.秒, w, times[k]);
        events.push({ kind: "place", frame: start + fr, seg: sid });
        return { name: String(p.名前 ?? ""), lon, lat, at: fr };
      });
      sc.route = s.線 !== false;
    }
    if (type === "compare") {
      const side = (o, k) => {
        const w = `${where} ${k}`;
        allowKeys(o ?? {}, ["見出し", "項目", "色", "質感"], w);
        if (!o) fail(where, `「${k}」がありません`);
        return {
          heading: String(o.見出し ?? ""),
          items: lines(o.項目).slice(0, 4),
          color: color(o.色, w, k === "左" ? N.colors.茶 : N.colors.藤),
          texture: o.質感 === "夢" ? "dream" : o.質感 === "記録" ? "record" : undefined,
        };
      };
      sc.left = { ...side(s.左, "左"), at: 10 };
      sc.right = { ...side(s.右, "右"), at: 40 };
      events.push({ kind: "place", frame: start + 10, seg: sid }, { kind: "place", frame: start + 40, seg: sid });
    }
    if (type === "ifcase") {
      const a = lines(s.史実);
      const b = lines(s.もしも);
      if (!a.length || !b.length || a.length > 4 || b.length > 4) fail(where, "「史実」と「もしも」をそれぞれ1〜4個で書いてください");
      sc.fact = a;
      sc.what = b;
      sc.factAt = spread(a.length, 10, Math.round(last * 0.35));
      sc.whatAt = spread(b.length, Math.round(last * 0.4), Math.round(last * 0.7));
      for (const fr of [...sc.factAt, ...sc.whatAt]) events.push({ kind: "place", frame: start + fr, seg: sid });
    }
    if (type === "verdict") {
      const v = lines(s.判定);
      if (v.length < 1 || v.length > 2) fail(where, "「判定」は1〜2行で書いてください（例: [人物は実在, 万能像は後世作]）");
      sc.verdict = v;
      sc.verdictAt = 2;
      events.push({ kind: "stamp", frame: start + 2 + STAMP_LAND, seg: sid });
      if (s.金 !== undefined) {
        sc.gold = String(s.金);
        sc.goldAt = 2 + 22;
        events.push({ kind: "ting", frame: start + sc.goldAt + 6, seg: sid });
      }
    }
    if (type === "choice") {
      const a = lines(s.A);
      const b = lines(s.B);
      if (!a.length || !b.length) fail(where, "「A」と「B」を書いてください（例: A: [実在の, 改革者派]）");
      sc.a = a;
      sc.b = b;
      events.push({ kind: "place", frame: start + 12, seg: sid }, { kind: "place", frame: start + 22, seg: sid });
    }
    if (type === "subscribe") {
      sc.clickAt = Math.min(46, last - 30);
      sc.stamps.push({ text: "お願いします", at: sc.clickAt + 6, round: false, color: N.colors.朱 });
      events.push({ kind: "click", frame: start + sc.clickAt, seg: sid }, { kind: "stamp", frame: start + sc.clickAt + 6 + STAMP_LAND, seg: sid });
    }
    if (si > 0) events.push({ kind: "transition", frame: start, seg: sid });

    start += frames;
    return sc;
  });

  // ---- サムネイル ----
  const th = raw.サムネイル ?? {};
  allowKeys(th, ["文字", "判子", "部品", "人物"], W("サムネイル"));
  const thumb = {
    lines: lines(th.文字 ?? raw.タイトル ?? id).slice(0, 2),
    stamp: th.判子 === undefined ? scenes[0].stamps[0]?.text : String(th.判子),
    parts: (th.部品 ?? []).map((p, k) => ({
      name: pick(N.parts, p.名前, W(`サムネイル 部品${k + 1}`), "部品"),
      x: num(p.x ?? 540, W("サムネイル"), "x"),
      y: num(p.y ?? 1000, W("サムネイル"), "y"),
      s: num(p.大きさ ?? 1, W("サムネイル"), "大きさ"),
      at: 0,
      color: color(p.色, W("サムネイル"), undefined),
    })),
    person: th.人物 !== "なし",
  };

  for (const l of thumb.lines) if ([...l].length > 10) console.warn(`△ ${file} サムネイル: 「${l}」は${[...l].length}文字。スマホで読めるよう1行10文字以内がおすすめ`);
  events.sort((a, b) => a.frame - b.frame);
  if (chapters.length && chapters[0].frame > 0) chapters.unshift({ title: "オープニング", frame: 0, no: 0 });
  return { id, title: String(raw.タイトル ?? id), wide, chapters, fps: FPS, hold: HOLD, stampLand: STAMP_LAND, style, audio, scenes, events, thumb, totalFrames: start };
};

const files = readdirSync(DIR).filter((x) => x.endsWith(".yaml")).sort();
const out = [];
let ok = true;
for (const file of files) {
  try {
    out.push(buildEpisode(file));
  } catch (e) {
    if (!(e instanceof ScriptError)) throw e;
    ok = false;
    console.error(`✗ 台本の書き間違い: ${e.message}`);
  }
}
if (!ok) process.exit(1);
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
for (const e of out) console.log(`✓ ${e.id}（${e.title}）: ${e.scenes.length}場面・${(e.totalFrames / FPS).toFixed(1)}秒`);

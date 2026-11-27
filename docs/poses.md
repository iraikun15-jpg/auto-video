# 棒人間ポーズ集

`src/rig/poses.ts` に、名前付きのポーズと動きの部品をまとめています。
一覧画像は `PoseCatalog`（静止画）、動きの見本は `MotionDemo`（5秒の動画）です。Release には載せません（必要なときに `npx remotion still src/index.ts PoseCatalog out/pose_catalog.png` で書き出す）。

## 指示ファイルでの指定のしかた（例）

```
seg2：主人公は「指さし」→ 0.5秒で「驚く」。上司は左から「歩く」で入ってきて「腕組み」
```

日本語名でもコード名（英字）でも通じます。

## ポーズ（29種、右向き。左向きは反転して使う）

| 日本語名 | コード名 | 日本語名 | コード名 |
|---|---|---|---|
| 立つ | STAND | 気をつけ | ATTENTION |
| 指さし | POINT | 上を指す | POINT_UP |
| 挙手 | RAISE_HAND | 手を振る | WAVE |
| バンザイ | BANZAI | ガッツポーズ | GUTS |
| 腰に手 | HANDS_ON_HIPS | 腕組み | ARMS_CROSSED |
| 考える | THINK | 驚く | SURPRISED |
| 頭を抱える | HEAD_IN_HANDS | 落ち込む | SLUMP |
| お辞儀 | BOW | 深いお辞儀 | DEEP_BOW |
| スマホを見る | PHONE | 電話する | PHONE_CALL |
| 運ぶ | CARRY | 急ぐ | HURRY |
| しゃがむ | CROUCH | 崩れ落ちる | ORZ |
| 座る | SIT | 座ってタイピング | SIT_TYPE |
| 座ってスマホ | SIT_PHONE | 座って伸び | SIT_STRETCH |
| 机に突っ伏す | SIT_FACEPLANT | 座って考える | SIT_THINK |
| もたれる | SIT_LEAN_BACK | | |

## 動き（フレームを渡すとポーズが返る）

| 日本語名 | 関数 | メモ |
|---|---|---|
| 歩く | `walk(f, { startX, speed })` | speed がマイナスなら左へ（`facing={-1}` も渡す） |
| 走る | `run(f, { startX, speed })` | 前のめり・着地の合間に少し浮く |
| お辞儀 / 謝罪 | `bow(f, { start, deep })` | 下げる→止める→戻す |
| うなずく | `nod(f, pose, { start, times })` | |
| 首を振る | `shakeHead(f, pose, { start })` | |
| 手を振る | `wave(f)` | |
| ジャンプ | `jump(f, { start, height })` | しゃがんで踏み切り→着地 |
| タイピング | `typing(f)` | |
| 震える | `tremble(f, pose)` | 恐怖・寒さ・怒り |
| 待機の揺れ | `breathe(f, pose)` | 止まって見えないよう常に重ねられる |

## 置き方・つなぎ方

- `place("POINT", 300)`：名前で取り出して x=300 に置き、床に接地させる
- `ground(pose)`：いちばん低い点（足・ひざ・手）を床に合わせる
- `change(f, from, to, start, dur)`：ポーズ A→B へ dur フレームで移る（接地は保つ）
- これまでの `poseAt` / `shiftPose` / `jitter`（`pose.ts`）とも組み合わせられる

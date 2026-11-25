# auto-video 引き継ぎメモ

Remotion で縦型ショート動画を作るリポジトリ。依頼者はスマホ（iPhone の Safari / Claude アプリ）から指示を出し、完成品は GitHub Releases から受け取る。

## 依頼者とのやり取り
- 返答はすべて日本語
- 依頼は「指示ファイル（.md）」で来ることが多い。禁止事項・維持事項・納品物の指定に厳密に従う
- **投稿・予約は絶対にしない**。完成品を返すだけ
- 完成したら、ファイルをチャットに送り、Releases の直リンクも伝える（依頼者は「リンクください」とよく言う）
- 開発ブランチ: `claude/busy-goldberg-3yt680`（push すると Actions が自動で動く）

## 環境の注意
- GPU なし。3D は `--gl=swangle` で書き出す
- ローカルでは Chromium のダウンロードが塞がれているので、`--browser-executable=/opt/pw-browsers/chromium` か環境変数 `REMOTION_BROWSER` を使う
- フォントは `@remotion/google-fonts` の Noto Sans JP（weight 900）

## 自動公開（.github/workflows/render.yml）
- push（.md だけの変更は除く）で歴史ch神武・第2話・怪獣 v1/v2/v4 をレンダリングし、`video-<実行番号>` の Release を作る
- `video.mp4` は現在「神武東征」Short の結合版（`jimmu_full.mp4` と同じ）。最新の結合版は常に `https://github.com/iraikun15-jpg/auto-video/releases/latest/download/video.mp4`
- 個別ファイルは `https://github.com/iraikun15-jpg/auto-video/releases/download/video-<番号>/<ファイル名>`
- Google Drive へのアップロード手順もあるが、Secrets（GDRIVE_*）が未登録なのでスキップされる。依頼者は Releases で受け取る方式を選んだ

## 棒人間あるあるシリーズ（2D）
- 共通部品: `src/rig/`（棒人間リグ `StickFigure`、上司 `Boss`、デスク・椅子・プリンター等）。新しい回もこれを使い回す
- 見た目: 背景 `#FBFAF5`（生成り）、線 `#151515`、床の線あり。第1話の動画から測った値
- キャラ: 主人公=黒、上司=赤（`#D7263D`）＋ネクタイ。色はこの2色まで
- 納品ルール（第2話の指示より）
  - 1080×1920、H.264、**無音**（音声トラックなし。音・字幕・テロップは依頼者側で後付け）
  - 結合版＋セグメント別（seg1〜）＋サムネイル1枚＋タイミング表（実尺）
  - 各セグメントの終わりに 0.3秒の静止（`timing.json` の `holdFrames`）
  - 台本のセリフ・文言は変えない。ズーム多用禁止。全セグメントで棒人間を動かす
- 第2話: `src/ep2/`、書き出しは `npm run render`（`scripts/render-ep2.mjs` がフレーム数と無音を検証してタイミング表を作る）

## 歴史チャンネル（切り絵スタイル）
- 第1本「神武天皇は実在したのか」Short: `src/jimmu/`、書き出しは `npm run render:jimmu`（`out/jimmu/` に結合版・seg1〜8・サムネ・タイミング表）
- スタイル: 依頼者が「切り絵（Paper Cutout）＋地図の場面は作戦盤（Tactics Board）」を選んだ。和紙の台紙・藍の海（青海波）・朱/墨/金
  - 部品: `paper.tsx`（台紙・地図・札・判子・駒・ルート・矢）、`figures.tsx`（影絵の人物・八咫烏・日輪）、`geo.ts`（簡略地図・カメラ・ルート）
  - 人物は顔を描かない影絵（断定画にしない方針）。神武方=朱、長髄彦=墨、その他の豪族=茶
  - 文字は しっぽり明朝B1（weight 800）
  - 和紙の質感は `public/jimmu/washi_bg.jpg`・`washi_fibers.png`（`scripts/make-washi.py` で生成）。SVG のノイズフィルタは使わない
  - 書き出しは同時描画数を少なくしている（`JIMMU_CONCURRENCY`、既定は1）。増やすと描きかけのフレームが混ざる
- 納品は棒人間シリーズと同じ形式（無音・セグメント別・末尾0.3秒静止）。尺は台本の目安秒数で仮組み（計55秒）
- 二択の「派」の読み指定（「ハ」）はナレーション原稿側の話。画面の文字は「派」のまま

## 怪獣シリーズ（3D・Three.js）
- オリジナルの様式化デザイン。**公式モデル・画像・音源の模倣や流用はしない**。画面に作品名を出さない
- モデル: `src/kaiju/ModelV2.tsx`（v2 が現行）。色は炭色の皮膚・骨白色の背びれ（3列互い違い）・白い爪・黄色い目・赤い口内。色とプロポーションは変えない
  - 背びれの発光は `FinGlowContext`、頭に物を付けるのは `headExtra`
  - マテリアルを付け外しすると影の描画で落ちる。値を書き換える／`visible` で出し入れすること
  - 一時的に出す要素の React key は必ず一意に（重複すると描画が壊れる）
- v1/v2 テスト: `src/kaiju/KaijuTest.tsx` / `KaijuTestV2.tsx`（カメラ・背景は `KaijuStage` で共通）
- v4「東京破壊」: `src/kaiju/v4/`（40秒・音あり）
  - 場面・タイミングは `timeline.json`、動きは `motion.ts`、街と壊れ方は `city.ts`、塔は `Tower.tsx`（東京タワー風）
  - 明るさは夕焼け（依頼者の希望）
  - 詳細とレンダリング時間は `docs/kaiju-v4.md`
- 音のルール: **すべて自前合成**（`scripts/synth-kaiju-v4.mjs`、サイン波・ノコギリ波・ノイズ＋フィルタのみ）。既存の効果音・BGM・公式の咆哮は使わない
  - 全体 -14〜-16 LUFS、ピーク -1 dB 以下。咆哮と熱線がいちばん大きく、足音・倒壊はその下
  - 映像と同じイベント情報（`src/kaiju/v4/events.ts`）から音を配置して同期する
- 目安のレンダリング時間（ローカル 4コア）: v2 9秒で約85秒、v4 40秒で約17分

## 確認の習慣（依頼者から「次回もしっかり確認しなさい」と言われている）
- **渡す前に必ず、書き出した動画そのものを確認する**。静止画（remotion still）だけの確認では足りない
  - 静止画は1枚ずつ丁寧に描くので崩れないが、本番の並列書き出しでは描きかけのフレームが混ざることがある（神武 v1 で発生：画面の一部がタイル状に並ぶ・人物が欠ける → 依頼者に「ブレブレ」と指摘された）
  - 検出: `ffmpeg -i x.mp4 -vf "scale=540:960,select=gt(scene\,0.25),metadata=print:file=-" -f null -` で絵が急に変わるフレームを出し、場面の境目以外にあれば壊れている。神武は `render-jimmu.mjs` が自動でこれを行い、見つかれば失敗にする
  - 書き出した mp4 から連続フレームを切り出して目で見る
- 重い SVG フィルタ（feTurbulence・feDisplacementMap を画面全体や多数の部品に掛ける）は使わない。質感は画像にして貼る
- Release のリンクは、Actions が終わって Release ができたのを確認してから伝える
- 書き出したら ffprobe で解像度・フレーム数・音声トラックの有無を確認する
- 音ありは `ffmpeg -af ebur128=peak=true` でラウドネスとピークを測る
- 静止画を何枚か書き出して、見た目を目で確認してから本番レンダリングする

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
- push（.md だけの変更は除く）で第2話・怪獣 v1/v2/v4 をレンダリングし、`video-<実行番号>` の Release を作る
- 最新の結合版は常に `https://github.com/iraikun15-jpg/auto-video/releases/latest/download/video.mp4`
- 個別ファイルは `https://github.com/iraikun15-jpg/auto-video/releases/download/video-<番号>/<ファイル名>`
- Google Drive へのアップロード手順もあるが、Secrets（GDRIVE_*）が未登録なのでスキップされる。依頼者は Releases で受け取る方式を選んだ

## 棒人間あるあるシリーズ（2D）
- 共通部品: `src/rig/`（棒人間リグ `StickFigure`、上司 `Boss`、デスク・椅子・プリンター等）。新しい回もこれを使い回す
- **ポーズ集**: `src/rig/poses.ts`（29ポーズ＋歩く・走る・お辞儀・うなずき等の動き、床への接地 `ground`/`place`）。新しい回はまずここから選ぶ。足りないポーズはここに追加して一覧（`PoseCatalog`）で見た目を確認する。詳細は `docs/poses.md`
- 見た目: 背景 `#FBFAF5`（生成り）、線 `#151515`、床の線あり。第1話の動画から測った値
- キャラ: 主人公=黒、上司=赤（`#D7263D`）＋ネクタイ。色はこの2色まで
- 納品ルール（第2話の指示より）
  - 1080×1920、H.264、**無音**（音声トラックなし。音・字幕・テロップは依頼者側で後付け）
  - 結合版＋セグメント別（seg1〜）＋サムネイル1枚＋タイミング表（実尺）
  - 各セグメントの終わりに 0.3秒の静止（`timing.json` の `holdFrames`）
  - 台本のセリフ・文言は変えない。ズーム多用禁止。全セグメントで棒人間を動かす
- **台本ファイルから作る（第3話以降の基本）**: `episodes/<id>.yaml` に日本語で台本を書く → `npm run episode -- <id>` で out/<id>/ に納品物一式。書き方は `docs/script-format.md`
  - 依頼者の指示ファイル（.md）を受けたら、まずこの YAML に書き起こす。足りないポーズ・演出・小道具はコード側に足してから台本で使う
  - 仕組み: `scripts/build-episodes.mjs`（検証・変換）→ `src/story/`（`timeline.ts` が姿勢計算、`Episode.tsx` が描画、`scenery.tsx` が背景・小道具）。名前の対応表は `src/story/names.json`
  - 「公開: true」の台本だけ CI で書き出して Release に載る
- 第2話: `src/ep2/`、書き出しは `npm run render`（`scripts/render-ep2.mjs` がフレーム数と無音を検証してタイミング表を作る）

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

## 確認の習慣
- 書き出したら ffprobe で解像度・フレーム数・音声トラックの有無を確認する
- 音ありは `ffmpeg -af ebur128=peak=true` でラウドネスとピークを測る
- 静止画を何枚か書き出して、見た目を目で確認してから本番レンダリングする

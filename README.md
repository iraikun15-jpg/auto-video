# auto-video

[Remotion](https://www.remotion.dev/) でスマホ向けの縦型ショート動画（1080x1920 / 30fps / MP4）を作る最小構成のプロジェクトです。

## ファイル構成

| ファイル | 役割 |
| --- | --- |
| `src/rig/` | シリーズ共通の部品（棒人間リグ・上司・デスク・椅子・プリンター等） |
| `src/ep2/` | 第2話（seg1〜seg5、サムネイル、`timing.json` に各セグメントの尺） |
| `scripts/render-ep2.mjs` | 第2話の納品物一式を `out/ep2/` に書き出す |
| `src/ShortVideo.tsx` | 最初のサンプル動画 |
| `src/Root.tsx` | コンポジションの登録 |
| `src/index.ts` | Remotion のエントリーポイント |
| `.github/workflows/render.yml` | 自動レンダリング＆Releases公開のワークフロー |

## 自動レンダリング

リポジトリに push すると GitHub Actions が第2話をレンダリングし、
[Releases](../../releases) に次のファイルを添付して公開します（すべて無音）。

- `video.mp4` / `ep2_full.mp4`：結合版（同じもの）
- `ep2_seg1.mp4`〜`ep2_seg5.mp4`：セグメント別
- `ep2_thumbnail.png`：サムネイル
- `ep2_timing.md`：各セグメントの実尺

最新の動画は常に次のURLからダウンロードできます：

```
https://github.com/<オーナー>/<リポジトリ>/releases/latest/download/video.mp4
```

Actions タブの「Render video」→「Run workflow」から手動でも実行できます。

## Google Drive への自動アップロード

GitHub の Secrets に次の4つを登録すると、レンダリング後に指定フォルダへ
`video-<実行番号>-<コミット>.mp4` という名前でアップロードされます（未登録ならスキップ）。

| Secret 名 | 内容 |
| --- | --- |
| `GDRIVE_CLIENT_ID` | Google Cloud の OAuth クライアント ID |
| `GDRIVE_CLIENT_SECRET` | 同 クライアント シークレット |
| `GDRIVE_REFRESH_TOKEN` | OAuth 2.0 Playground で取得したリフレッシュトークン |
| `GDRIVE_FOLDER_ID` | アップロード先フォルダのURL末尾のID |

※ 個人の Google アカウントのマイドライブには、サービスアカウントからはアップロードできない
（容量を持たないため）ので、OAuth のリフレッシュトークン方式を使っています。

## ローカルで使う場合

```bash
npm install
npm run dev     # ブラウザでプレビュー（Remotion Studio）
npm run render  # 第2話の納品物を out/ep2/ に書き出し
```

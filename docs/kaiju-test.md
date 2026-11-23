# ローポリ3Dテスト（怪獣）メモ

## 使った方法（Three.js の構成）
- `@remotion/three` の `<ThreeCanvas>` に React Three Fiber（`@react-three/fiber` 8 / `three` 0.170）でシーンを記述
- モデル（`src/kaiju/Model.tsx`）：`godzilla.py` の寸法・配色を流用し、`BoxGeometry`（箱）と `CylinderGeometry`（爪・角・尾先の円錐）だけで構成
  - マテリアルは `MeshStandardMaterial` の `flatShading: true`（面ごとに陰影が出る）
  - 関節は `group` の入れ子。脚（股→膝→足首）、腕（肩→肘）、首→下顎、尾は5節を根元から入れ子にしてしなりを伝える
- アニメーション（`src/kaiju/KaijuTest.tsx`）：`useCurrentFrame()` からポーズを計算（フレーム単位で決定的）
  - 0〜4秒 ターンテーブル1回転 / 4〜7.6秒 その場歩行6歩＋尾の波 / 7.6〜9秒 顎を開けて咆哮ポーズで静止
- ライト：主光源は `directionalLight` 1灯（シャドウマップ 2048px で地面に影）＋補助の `hemisphereLight`
- 背景：CSS グラデーション（キャンバスは透過）、地面は円盤メッシュ
- レンダリング：GPU なし環境のため `--gl=swangle`（ソフトウェア WebGL）

## 生成コマンド
```bash
npx remotion render src/index.ts KaijuTest out/kaiju/kaiju_test.mp4 --codec=h264 --muted --gl=swangle
```

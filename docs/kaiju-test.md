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

## v2（`KaijuTestV2`）での変更点
カメラ距離・背景・ライト・地面は v1 と共通（`KaijuStage`）。色とプロポーションは維持。

1. **背びれ**（`ModelV2.tsx` の `BackFins` / `TailSegment`）
   - ギザギザの炎形の板（`Shape` を `ExtrudeGeometry` で厚み付け）を、首の後ろ→腰→尾先まで中央列＋左右2列の計3列、互い違いに配置
   - 中央列は背中の中央で最大（高さ3.25）、首と尾先へ向けて小さく。左右列は外へ開く
2. **面の角度**
   - 箱の頂点を書き換えたテーパー形状（`taperGeo`）で、太もも→すね→足首を先細りに、足裏は平らで甲を斜めにカット
   - 胴は腰が太く肩へ絞る。尾は各節を次の節の太さへ絞って一続きのシルエットに
   - 頭は吻を前に伸ばして先を絞り、下顎も頬から先へ細く、先端が上顎とつながる形に
3. **歩行の重さ**（`KaijuTestV2.tsx`）
   - 1歩 = 38フレーム。足を素早く上げる→ゆっくり前へ→ストンと着地（区間ごとに別のイージング）
   - 着地直後に体全体が沈み込み、支持脚の膝が曲がってから戻る。片足立ちの間は少し伸び上がる
   - 脚を上げている間は支持脚側へ傾き、着地で反対側へ切り替わる（体重移動）
   - 尾の各節は体の傾きを 4フレームずつ遅れて受け取る（先端ほど遅れて、大きく振れる）

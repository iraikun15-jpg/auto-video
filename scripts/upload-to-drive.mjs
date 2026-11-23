// レンダリングしたMP4をGoogle Driveの指定フォルダにアップロードするスクリプト
// 使い方: node scripts/upload-to-drive.mjs <ファイルパス> <Drive上のファイル名>
// 必要な環境変数:
//   GDRIVE_CLIENT_ID / GDRIVE_CLIENT_SECRET / GDRIVE_REFRESH_TOKEN / GDRIVE_FOLDER_ID
import { readFile, stat } from "node:fs/promises";

const [filePath, driveName] = process.argv.slice(2);
const {
  GDRIVE_CLIENT_ID,
  GDRIVE_CLIENT_SECRET,
  GDRIVE_REFRESH_TOKEN,
  GDRIVE_FOLDER_ID,
} = process.env;

if (!filePath || !driveName) {
  console.error("Usage: node scripts/upload-to-drive.mjs <file> <name>");
  process.exit(1);
}
for (const [k, v] of Object.entries({
  GDRIVE_CLIENT_ID,
  GDRIVE_CLIENT_SECRET,
  GDRIVE_REFRESH_TOKEN,
  GDRIVE_FOLDER_ID,
})) {
  if (!v) {
    console.error(`環境変数 ${k} が設定されていません`);
    process.exit(1);
  }
}

async function fail(step, res) {
  console.error(`${step} に失敗しました (HTTP ${res.status})`);
  console.error(await res.text());
  process.exit(1);
}

// 1. リフレッシュトークンからアクセストークンを取得
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: GDRIVE_CLIENT_ID,
    client_secret: GDRIVE_CLIENT_SECRET,
    refresh_token: GDRIVE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});
if (!tokenRes.ok) await fail("アクセストークンの取得", tokenRes);
const { access_token } = await tokenRes.json();

// 2. レジューム可能アップロードのセッションを開始
const { size } = await stat(filePath);
const initRes = await fetch(
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,webViewLink",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": String(size),
    },
    body: JSON.stringify({ name: driveName, parents: [GDRIVE_FOLDER_ID] }),
  },
);
if (!initRes.ok) await fail("アップロードの開始", initRes);
const uploadUrl = initRes.headers.get("location");

// 3. ファイル本体を送信
const putRes = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "video/mp4", "Content-Length": String(size) },
  body: await readFile(filePath),
});
if (!putRes.ok) await fail("ファイルの送信", putRes);
const file = await putRes.json();

console.log(`アップロード完了: ${file.name}`);
console.log(`Driveで開く: ${file.webViewLink}`);

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { google } = require('googleapis');
require('dotenv').config();

// 檔案路徑設定
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

// Google OAuth2 Scopes
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function main() {
  console.log('正在初始化 Google Drive 專案分析報告建立工具 (.cjs)...');

  // 1. 載入 credentials
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`找不到 credentials.json 檔案。請確保該檔案位於 ${CREDENTIALS_PATH}`);
    process.exit(1);
  }

  const credentialsContent = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  const credentials = JSON.parse(credentialsContent);
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

  // 使用 redirect_uris[0]，或是我們自訂的 localhost 埠以進行 loopback
  const port = 3000;
  const redirectUri = `http://localhost:${port}`;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );

  // 2. 獲取或讀取 Token
  let authClient;
  if (fs.existsSync(TOKEN_PATH)) {
    console.log('從 token.json 載入現有的 OAuth2 Token...');
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    authClient = oAuth2Client;
  } else {
    console.log('找不到已存的 Token，啟動本地 OAuth2 授權流程...');
    authClient = await getNewToken(oAuth2Client, port);
  }

  // 3. 建立 Google Drive 報告
  try {
    const drive = google.drive({ version: 'v3', auth: authClient });
    
    console.log('正在產生專案分析報告的 HTML 內容...');
    const htmlContent = generateReportHtml();

    console.log('正在向 Google Drive 上傳並建立 Google Doc 文件...');
    const fileMetadata = {
      name: 'topic-learning-hub 專案分析報告',
      mimeType: 'application/vnd.google-apps.document',
    };

    const media = {
      mimeType: 'text/html',
      body: htmlContent,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    console.log('\n==================================================');
    console.log('🎉 報告建立成功！');
    console.log(`文件名稱: ${file.data.name}`);
    console.log(`文件 ID: ${file.data.id}`);
    console.log(`閱讀連結: ${file.data.webViewLink}`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('建立雲端硬碟報告時出錯:', err);
  }
}

/**
 * 啟動本機伺服器並引導使用者完成 OAuth 授權
 */
function getNewToken(oAuth2Client, port) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    console.log('\n--------------------------------------------------');
    console.log('請在瀏覽器中打開以下網址，登入您的 Google 帳號並授權存取：');
    console.log(authUrl);
    console.log('--------------------------------------------------\n');

    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.startsWith('/?code=') || req.url.includes('code=')) {
          const queryObject = url.parse(req.url, true).query;
          const code = queryObject.code;

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>授權成功！</h1><p>您可以關閉此瀏覽器分頁，並回到終端機查看進度。</p>');
          
          server.close();
          console.log('已成功獲取授權碼，正在向 Google 交換 Token...');

          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);

          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
          console.log(`Token 已成功儲存至: ${TOKEN_PATH}`);

          resolve(oAuth2Client);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      } catch (err) {
        res.writeHead(500);
        res.end('Error parsing token');
        server.close();
        reject(err);
      }
    });

    server.listen(port, (err) => {
      if (err) {
        return reject(err);
      }
      console.log(`本地授權伺服器正在監聽 http://localhost:${port} ...`);
    });
  });
}

/**
 * 生成報告的精美 HTML 內容
 */
function generateReportHtml() {
  const currentDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Microsoft JhengHei, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px double #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 30px;
      text-align: center;
    }
    .project-title {
      font-size: 28pt;
      font-weight: 800;
      color: #4f46e5;
      margin: 0 0 10px 0;
    }
    .doc-subtitle {
      font-size: 16pt;
      color: #64748b;
      margin: 0 0 15px 0;
    }
    .meta-info {
      font-size: 10pt;
      color: #94a3b8;
    }
    h2 {
      color: #312e81;
      font-size: 18pt;
      border-left: 5px solid #4f46e5;
      padding-left: 12px;
      margin-top: 35px;
      margin-bottom: 15px;
    }
    h3 {
      color: #4338ca;
      font-size: 13pt;
      margin-top: 20px;
    }
    p, li {
      font-size: 11pt;
      text-align: justify;
    }
    ul, ol {
      padding-left: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 10px;
      font-weight: bold;
      text-align: left;
      color: #334155;
    }
    td {
      border: 1px solid #cbd5e1;
      padding: 10px;
      vertical-align: top;
    }
    .badge {
      display: inline-block;
      background-color: #e0e7ff;
      color: #4338ca;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
    }
    .folder {
      color: #b45309;
      font-weight: bold;
    }
    .file {
      color: #0f766e;
      font-weight: 500;
    }
    .callout {
      background-color: #f8fafc;
      border-left: 4px solid #6366f1;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .callout-title {
      font-weight: bold;
      color: #4338ca;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="project-title">topic-learning-hub</div>
    <div class="doc-subtitle">專案檔案結構與核心目標分析報告</div>
    <div class="meta-info">報告生成時間：${currentDate} | 建立者：Antigravity AI Agent</div>
  </div>

  <h2>二、 核心目標分析</h2>
  <p>topic-learning-hub 專案在設計上具備三大核心目標：</p>
  <ol>
    <li>
      <strong>無伺服器中轉（BYOK - Bring Your Own Key）與高隱私保障：</strong><br>
      系統不需要集中的後端伺服器來處理敏感數據。使用者需自備個人 Google 雲端硬碟的 Client ID 與 Gemini API 金鑰。所有金鑰均儲存在瀏覽器本地快取 (LocalStorage) 中，AI 生成與雲端備份的行為皆直接與 Google 官方 API 對接，從源頭確保了用戶的隱私權益。
    </li>
    <li>
      <strong>AI 驅動的結構化「主題學習手冊」生成：</strong><br>
      專案運用 Gemini AI 引擎的結構化 JSON 生成能力。當用戶輸入任何感興趣的領域時，AI 會立刻將其拆解為「前言引導與學習地圖」、「核心概念精要」以及「常見盲點與誤區對照」，免除使用者在茫茫網海中摸索的低效。
    </li>
    <li>
      <strong>基於 Google Drive 的雲端同步與備份：</strong><br>
      利用 Google Drive API v3，在用戶的雲端硬碟中自動建立 <code>Topic Learning Hub</code> 資料夾。手冊在儲存時採用「混合格式」(Markdown + Front-matter XML 註解內嵌 JSON)，使得產出物既可在一般 Markdown 編輯器 (如 Obsidian, Notion) 完美呈現，又能在本系統中被無損地重讀與渲染。
    </li>
  </ol>

  <h2>三、 專案檔案結構解析</h2>
  <p>本專案採用了 <strong>Vite + Vue 3 (Pinia + Vue Router)</strong> 的現代前端架構。以下是專案的關鍵檔案樹狀結構與其對應的功能解析：</p>

  <table>
    <thead>
      <tr>
        <th style="width: 30%">路徑</th>
        <th style="width: 15%">類型</th>
        <th style="width: 55%">功能描述與職責</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="folder">/src</td>
        <td><span class="badge">Directory</span></td>
        <td>專案原始碼主目錄。</td>
      </tr>
      <tr>
        <td class="file">/src/main.js</td>
        <td><span class="badge">JavaScript</span></td>
        <td>前端 entry point，負責初始化 Vue 實例、掛載 Pinia 與 Vue Router。</td>
      </tr>
      <tr>
        <td class="file">/src/App.vue</td>
        <td><span class="badge">Vue Component</span></td>
        <td>單頁應用的根組件，內含主體佈局結構與側邊欄切換邏輯。</td>
      </tr>
      <tr>
        <td class="file">/src/style.css</td>
        <td><span class="badge">CSS</span></td>
        <td>定義了全局的視覺系統，包含極具現代感的 Glassmorphism (玻璃擬物化) 樣式、流暢的深色/淺色模式變數以及微互動動畫。</td>
      </tr>
      <tr>
        <td class="folder">/src/stores</td>
        <td><span class="badge">Directory</span></td>
        <td>狀態管理目錄。</td>
      </tr>
      <tr>
        <td class="file">/src/stores/app.js</td>
        <td><span class="badge">Pinia Store</span></td>
        <td>全域狀態中心。儲存 Gemini API Key、Google OAuth 憑證、使用者 Profile、雲端/本地手冊清單與全域載入狀態。</td>
      </tr>
      <tr>
        <td class="folder">/src/services</td>
        <td><span class="badge">Directory</span></td>
        <td>第三方 API 整合服務。</td>
      </tr>
      <tr>
        <td class="file">/src/services/gemini.js</td>
        <td><span class="badge">JavaScript</span></td>
        <td>Gemini API (BYOK) 的呼叫封裝。藉由 System Instructions 指引模型生成嚴格符合 Schema 的主題手冊 JSON 數據。</td>
      </tr>
      <tr>
        <td class="file">/src/services/googleDrive.js</td>
        <td><span class="badge">JavaScript</span></td>
        <td>Google Identity Services (GIS) 與 gapi SDK 的整合封裝。包含 OAuth2 授權管理、目錄建立、Markdown 混合上傳與下載解析。</td>
      </tr>
      <tr>
        <td class="folder">/src/views</td>
        <td><span class="badge">Directory</span></td>
        <td>SPA 頁面視圖。</td>
      </tr>
      <tr>
        <td class="file">/src/views/Dashboard.vue</td>
        <td><span class="badge">Vue Component</span></td>
        <td>儀表板首頁。包含主題輸入欄位、微動畫生成載入畫面、Markdown 渲染、概念卡片手風琴折疊、以及盲點對照 UI。</td>
      </tr>
      <tr>
        <td class="file">/src/views/Settings.vue</td>
        <td><span class="badge">Vue Component</span></td>
        <td>設定頁面。使用者在此輸入 API Key 與 Client ID，並檢視雲端硬碟連線狀態。</td>
      </tr>
    </tbody>
  </table>

  <h2>四、 架構設計與數據流向</h2>
  <p>系統中的兩大核心數據流為：<strong>手冊生成數據流</strong>與<strong>雲端同步數據流</strong>。</p>
  
  <h3>1. 結構化手冊生成流程：</h3>
  <ul>
    <li>用戶於 <code>Dashboard.vue</code> 輸入主題（如「Rust 非同步程式設計」）。</li>
    <li>系統從 Pinia Store 讀取本地保存的 <code>Gemini API Key</code>。</li>
    <li>呼叫 <code>gemini.js</code> 封裝的 API，送出 System Instruction 指引模型輸出 JSON 物件。</li>
    <li>Gemini 返回 JSON，系統將其解析，更新至 Pinia Store 的 <code>currentNotebook</code>，同時在 <code>localStorage</code> 留下一份暫存檔防丟失。</li>
    <li>UI 將返回的 Markdown 內容使用 <code>marked</code> 解析渲染，並將核心概念、誤區以精美卡片呈現在畫面上。</li>
  </ul>

  <h3>2. Google Drive 雲端同步流程：</h3>
  <ul>
    <li>使用者在 <code>Settings.vue</code> 配置 Google Client ID，並點擊「連線 Google Drive」。</li>
    <li><code>googleDrive.js</code> 呼叫 GIS，引導用戶進行 OAuth 授權，取得 Access Token 並保存在 Store。</li>
    <li>進行存檔時，腳本檢查雲端是否存在 <code>Topic Learning Hub</code> 資料夾，若無則建立。</li>
    <li>將當前手冊組裝成包含 JSON Front-matter (<!-- JSON_METADATA_START -->) 與主 Markdown 的混合字串。</li>
    <li>利用 <code>multipart/related</code> 格式向 Drive API v3 發送 PATCH 或 POST 請求，完成無中轉的上傳。</li>
  </ul>

  <h2>五、 總結與後續優化建議</h2>
  <p>
    <code>topic-learning-hub</code> 通過精巧的純前端架構與 BYOK 模式，在不增加運營成本的前提下，為用戶提供了一個極佳的主題學習手冊管理方案。
    為了讓本專案更臻完善，建議後續可加入以下功能：
  </p>
  <ul>
    <li><strong>離線本地存儲優化：</strong> 在 Google 雲端未連線時，支援更豐富的 LocalStorage/IndexedDB 快取管理，連線後自動提示雙向同步。</li>
    <li><strong>流式內容生成 (Streaming)：</strong> 讓 Markdown 地圖能夠逐字顯示，改善使用者等待 AI 生成時的視覺體驗。</li>
    <li><strong>更多元的匯出格式：</strong> 提供一鍵轉存 PDF、EPUB 或單獨的純 Markdown 文件下載。</li>
  </ul>

</body>
</html>
  `;
}

if (require.main === module) {
  main();
}

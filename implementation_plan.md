# 萬用主題學習手冊建構器實作計畫

本專案旨在開發一個名為「萬用主題學習手冊建構器」的純前端 SPA 網頁應用。用戶輸入任何主題後，系統會自動生成結構化的學習手冊（章節、核心概念、誤區），並能透過 Google OAuth 2.0 與 Google API Client Library，將手冊直接儲存至用戶自己的 Google Drive 雲端硬碟中。

## 建議前端技術堆疊

為了達到高品質、模組化且易於維護的純前端 SPA 架構，我們建議使用以下技術堆疊：

1. **核心框架**：**Vue 3 (Pinia + Vue Router)**
   - 使用 Vue 3 的 Composition API 進行邏輯關注點分離。
   - 使用 Pinia 進行全域狀態管理（例如使用者登入狀態、目前編輯中的手冊、Google Drive 同步狀態）。
   - 使用 Vite 作為建置工具，提供極速的熱重載（HMR）開發體驗。
2. **樣式與設計系統**：**Vanilla CSS (CSS Modules / CSS Variables)**
   - 配合專案的視覺規範，使用自訂 CSS 變數（CSS Variables）實作流暢的深色模式、現代的玻璃擬物化（Glassmorphism）與微互動動畫，以達成 wow-factor 的精緻視覺體驗。
   - 不依賴大型 CSS 框架，保持專案輕量與極佳的加載速度。
3. **Google API 整合**：**Google Identity Services (GIS) + Google API Client Library (gapi)**
   - 使用 GIS 進行 OAuth 2.0 隱式授權流程（Implicit Flow），獲取 Access Token。
   - 使用 `gapi` 的 Drive API v3，直接在前端進行檔案的讀寫與目錄建立。
4. **手冊生成引擎**：**Gemini API (純前端呼叫)**
   - 採「自備金鑰 (Bring Your Own Key, BYOK)」模式。用戶在設定中輸入自己的 Gemini API Key，並儲存於瀏覽器的 LocalStorage。
   - 前端使用 `fetch` 或 `@google/genai` SDK 直接呼叫 Gemini API，生成結構化的 JSON/Markdown 手冊內容。

---

## User Review Required

> [!IMPORTANT]
> **1. Google OAuth 2.0 Client ID 配置**
> 由於是純前端 SPA，我們需要一個 Google Client ID 來執行 Drive API。在開發與測試階段，我們將提供一個輸入欄位讓用戶（或您）填入自己的 Client ID，或在 `.env.local` 中配置。請確認這是否符合您的本地測試需求。
>
> **2. AI 內容生成方式 (BYOK)**
> 為了達成無伺服器成本，本專案將採用讓用戶在 UI 中填入個人 **Gemini API Key** 的設計。Key 會安全地儲存在用戶本地瀏覽器的 `localStorage` 中。

---

## Open Questions

> [!NOTE]
> 1. **手冊儲存格式**：您偏好將手冊儲存為純 Markdown 格式（方便用戶下載後在 Obsidian/Notion 等工具閱讀），還是 JSON 格式（方便應用程式重複讀取與解析渲染）？抑或是「在雲端硬碟儲存為 Markdown，並在檔案 Meta Data 或開頭夾帶 JSON」的混合格式？
> 2. **專案目錄結構**：是否同意以標準的 Vite + Vue 3 結構初始化專案目錄？

---

## Proposed Changes

### 1. 專案初始化與設定

#### [NEW] [package.json](file:///d:/antigravity/topic-learning-hub/package.json)
- 配置 Vite, Vue 3, Pinia, Vue Router, @google/genai 等依賴。

#### [NEW] [vite.config.js](file:///d:/antigravity/topic-learning-hub/vite.config.js)
- Vite 相關配置。

#### [NEW] [index.html](file:///d:/antigravity/topic-learning-hub/index.html)
- 載入 Google API Client Library 以及 Google Identity Services SDK。
- 設定 SPA 的掛載點。

---

### 2. 核心 CSS 設計系統

#### [NEW] [src/assets/main.css](file:///d:/antigravity/topic-learning-hub/src/assets/main.css)
- 定義全局 CSS 變數（主題色、漸層色、陰影、字體）。
- 實作流暢的深色模式切換樣式與現代微動畫。

---

### 3. Google Drive 服務模組

#### [NEW] [src/services/googleDrive.js](file:///d:/antigravity/topic-learning-hub/src/services/googleDrive.js)
- 封裝 GIS 授權流程（登入、登出、Token 自動更新）。
- 封裝 Google Drive API 操作：
  - 建立專用資料夾（例如 `Topic Learning Hub`）。
  - 讀取資料夾內的手冊列表。
  - 儲存/更新指定手冊內容（JSON/Markdown）。
  - 刪除手冊。

---

### 4. AI 生成服務模組

#### [NEW] [src/services/gemini.js](file:///d:/antigravity/topic-learning-hub/src/services/gemini.js)
- 封裝 Gemini API 呼叫邏輯。
- 設計 System Prompt，引導模型生成包含「章節、核心概念、誤區」的結構化 JSON 資料。
- 支援流式傳輸（Streaming）或分段逐步生成（精細學習模式）。

---

### 5. UI 組件與頁面

#### [NEW] [src/components/Sidebar.vue](file:///d:/antigravity/topic-learning-hub/src/components/Sidebar.vue)
- 左側導覽列：手冊清單、新增手冊按鈕、設定按鈕。

#### [NEW] [src/views/Dashboard.vue](file:///d:/antigravity/topic-learning-hub/src/views/Dashboard.vue)
- 主畫面：主題輸入、手冊生成進度條、手冊渲染區域。
- 渲染區域需包含「核心概念說明卡片」、「誤區對照表」與「逐步學習導航」。

#### [NEW] [src/views/Settings.vue](file:///d:/antigravity/topic-learning-hub/src/views/Settings.vue)
- 設定頁面：輸入 Gemini API Key、Google Client ID，以及雲端硬碟連線測試。

---

## Verification Plan

### Automated Tests
- 由於是純前端 SPA，我們將主要依賴瀏覽器端手動驗證與主控台紀錄。
- 撰寫 API 模擬腳本來測試 Drive API 讀寫與 Gemini API 回傳解析。

### Manual Verification
1. **OAuth 登入流程驗證**：點擊「登入 Google 帳號」，驗證 GIS 彈出視窗並成功取得 Token。
2. **手冊生成驗證**：輸入「量子力學入門」，驗證是否成功流式生成章節、概念與誤區，且 UI 呈現動畫良好。
3. **雲端儲存驗證**：手冊生成後點擊儲存，驗證用戶本人的 Google Drive 中是否出現對應檔案。
4. **讀取加載驗證**：重整網頁，驗證是否能從 Google Drive 重新拉取已儲存的手冊並正確渲染。

# 任務清單 - 萬用主題學習手冊建構器

## 階段一：專案初始化與基礎建設
- [x] 初始化 Vite + Vue 3 專案目錄結構 `[x]`
- [x] 配置專案相依套件 (`Pinia`, `Vue Router`, `marked`) `[x]`
- [x] 撰寫 HTML 範本，引入 Google GIS 與 GAPI SDK `[x]`
- [x] 建立基礎設定檔 (`.env.local.example`) `[x]`

## 階段二：樣式系統與全域狀態
- [x] 撰寫 `main.css` 定義現代感的 Glassmorphism 視覺與深色模式變數 `[x]`
- [x] 建立 Pinia Store 管理使用者狀態（OAuth Token, API Keys, 目前手冊） `[x]`
- [x] 配置 Vue Router 路由系統（Dashboard, Settings, AuthCallback） `[x]`

## 階段三：Google SDK 與 API 整合
- [x] 實作 GIS (Google Identity Services) OAuth 2.0 登入/登出模組 `[x]`
- [x] 實作 Google Drive API v3 檔案管理器 (新建資料夾、存檔、讀檔、列出清單) `[x]`
- [x] 實作 Gemini API 純前端整合服務（支援結構化 JSON 解析） `[x]`

## 階段四：UI 組件開發與渲染
- [x] 開發 App 側邊欄組件 (手冊清單、新建、設定連結) `[x]`
- [x] 開發設定頁面 (API Key 配置、Client ID 配置) `[x]`
- [x] 開發儀表板首頁 (主題輸入、生成中狀態/微動畫) `[x]`
- [x] 開發手冊內容渲染器 (Markdown 解析器、誤區對照卡片、核心概念拆解 UI) `[x]`

## 階段五：功能整合與調優
- [ ] 進行 AI 生成與 Google Drive 自動存檔的聯調測試 `[ ]`
- [ ] 加入離線暫存機制（當 Google Drive 未連線時，先暫存在 LocalStorage） `[ ]`
- [ ] 優化 UI 載入動畫、手風琴摺疊、與滑動微特效 `[ ]`
- [ ] 撰寫 Walkthrough 與使用手冊 `[ ]`

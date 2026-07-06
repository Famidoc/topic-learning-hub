<template>
  <div class="settings-container">
    <div class="header">
      <h1>系統配置與設定</h1>
      <p class="subtitle">設定 Google Drive 與 Gemini AI 的連線資訊，所有敏感資料均儲存於您的本機瀏覽器中，安全且無伺服器中轉。</p>
    </div>

    <div class="settings-grid">
      <!-- Google Drive 設定卡片 -->
      <div class="glass-panel card">
        <div class="card-header">
          <div class="icon-wrap google">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z"/>
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <h2>Google 雲端硬碟 API 設定</h2>
        </div>
        
        <div class="card-body">
          <p class="description">
            本專案直接將您的學習手冊讀寫至您的 Google Drive 中。您需要先在 
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a>
            啟用 <strong>Google Drive API</strong> 並建立一個 <strong>OAuth 2.0 Web 用戶端 ID</strong>。
          </p>

          <div class="form-group">
            <label for="clientId">OAuth 2.0 用戶端 ID (Client ID)</label>
            <input 
              id="clientId" 
              type="text" 
              v-model="clientId" 
              placeholder="例如: 12345678-abcde.apps.googleusercontent.com"
            />
            <span class="tip">請確保在 Google Cloud 憑證設定中，將目前的網址 (例如 <code>http://localhost:5173</code> 或您的部署網址) 加入至「已授權的 JavaScript 來源」。</span>
          </div>

          <div class="auth-status" v-if="store.isAuthenticated">
            <span class="badge success">已連線至 Google 雲端硬碟</span>
            <span class="user-info" v-if="store.userProfile">
              <img :src="store.userProfile.picture" alt="Avatar" class="avatar" v-if="store.userProfile.picture" />
              <span>{{ store.userProfile.name }} ({{ store.userProfile.email }})</span>
            </span>
          </div>
          <div class="auth-status" v-else>
            <span class="badge warning">未登入 / 尚未驗證</span>
          </div>
        </div>
      </div>

      <!-- Gemini AI 設定卡片 -->
      <div class="glass-panel card">
        <div class="card-header">
          <div class="icon-wrap gemini">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h2>Gemini AI 生成引擎設定</h2>
        </div>

        <div class="card-body">
          <p class="description">
            使用您的個人 API 金鑰直接與 Gemini 模型溝通。您可以前往 
            <a href="https://aistudio.google.com/" target="_blank" rel="noopener">Google AI Studio</a> 
            免費獲取一個 API 金鑰。
          </p>

          <div class="form-group">
            <label for="apiKey">Gemini API 金鑰 (API Key)</label>
            <div class="input-with-toggle">
              <input 
                id="apiKey" 
                :type="showApiKey ? 'text' : 'password'" 
                v-model="apiKey" 
                placeholder="AIzaSy..."
              />
              <button class="btn-toggle-visibility" @click="showApiKey = !showApiKey">
                {{ showApiKey ? '隱藏' : '顯示' }}
              </button>
            </div>
            <span class="tip">金鑰會安全地保存在您瀏覽器的 LocalStorage，不會發送到任何第三方伺服器。</span>
          </div>

          <div class="divider"></div>

          <div class="form-group">
            <label>生成偏好設定</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="annotateKeyTerms"
                />
                <span class="checkbox-text">為第一次出現的關鍵名詞加註英文</span>
              </label>
              <span class="tip">啟用此選項後，在生成學習手冊時，所有內容中第一次出現的專業術語或關鍵概念將會自動附上英文對照（例如：機器學習 (Machine Learning)）。</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel glass-panel">
      <div class="left-controls">
        <button class="btn btn-secondary" @click="store.toggleTheme">
          切換 {{ store.theme === 'dark' ? '淺色' : '深色' }} 模式
        </button>
      </div>
      <div class="right-controls">
        <button class="btn btn-primary" @click="saveSettings">
          儲存配置設定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { useRouter } from 'vue-router'
import { initTokenClientHelper } from '../services/googleDrive'

const store = useAppStore()
const router = useRouter()

const clientId = ref(store.googleClientId)
const apiKey = ref(store.geminiApiKey)
const showApiKey = ref(false)
const annotateKeyTerms = ref(store.annotateKeyTerms)

const saveSettings = () => {
  if (!clientId.value) {
    alert('請填寫 Google OAuth Client ID 才能使用雲端硬碟備份功能。')
    return
  }
  
  store.setGoogleClientId(clientId.value)
  store.setGeminiApiKey(apiKey.value)
  store.setAnnotateKeyTerms(annotateKeyTerms.value)
  
  // 重新初始化 GIS
  initTokenClientHelper()
  
  alert('設定已成功儲存！')
  router.push({ name: 'Dashboard' })
}
</script>

<style scoped>
.settings-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.header {
  margin-bottom: 2.5rem;
}

.header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-sm);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

.icon-wrap.google {
  color: #4285F4;
}

.icon-wrap.gemini {
  color: var(--accent-secondary);
}

.card-body {
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.description {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.description a {
  color: var(--accent-primary);
  text-decoration: none;
}

.description a:hover {
  text-decoration: underline;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.tip {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.tip code {
  background: rgba(0,0,0,0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.input-with-toggle {
  display: flex;
  gap: 0.5rem;
}

.btn-toggle-visibility {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  padding: 0 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all var(--transition-fast);
}

.btn-toggle-visibility:hover {
  background: rgba(255, 255, 255, 0.08);
}

.auth-status {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.success {
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge.warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--accent-warning);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
}

.divider {
  height: 1px;
  background: var(--glass-border);
  margin: 1.5rem 0;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  accent-color: var(--accent-secondary);
}

.checkbox-text {
  font-weight: 500;
}
</style>

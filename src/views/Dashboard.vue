<template>
  <div class="dashboard-container">
    <!-- 未登入 Google 時的頂部提示 -->
    <div v-if="!store.isAuthenticated" class="glass-panel warning-banner">
      <div class="banner-text">
        <h3>雲端硬碟尚未連線</h3>
        <p>您目前處於「本地暫存模式」。連線至 Google 帳號後，手冊將會自動安全地備份至您的雲端硬碟。</p>
      </div>
      <button class="btn btn-primary" @click="loginGoogle">
        連線 Google Drive
      </button>
    </div>

    <!-- 歡迎 / 主題輸入區塊 -->
    <div v-if="!store.currentNotebook && !isGenerating" class="welcome-section glass-panel">
      <div class="welcome-badge">Topic Learning Hub</div>
      <h1>您今天想探索什麼主題？</h1>
      <p class="welcome-lead">輸入任何您想學習的主題。AI 將為您客製化一份「結構化學習手冊」，引導您精細學習、避開誤區。</p>
      
      <div class="search-box">
        <input 
          v-model="topicInput" 
          type="text" 
          placeholder="例如：量子力學基礎、Rust 非同步程式設計、咖啡烘焙工藝..." 
          @keyup.enter="generateHandbook"
        />
        <button class="btn btn-primary btn-generate" @click="generateHandbook" :disabled="!topicInput">
          建構學習手冊
        </button>
      </div>

      <div class="suggested-topics">
        <span>推薦主題：</span>
        <button v-for="t in suggestions" :key="t" class="tag-btn" @click="topicInput = t">
          {{ t }}
        </button>
      </div>
    </div>

    <!-- AI 手冊生成中畫面 -->
    <div v-else-if="isGenerating" class="generating-section glass-panel">
      <div class="spinner-wrap">
        <div class="pulse-ring"></div>
        <div class="pulse-ring delay"></div>
        <div class="spinner-core"></div>
      </div>
      <h2>正在為您規劃「{{ topicInput }}」學習手冊...</h2>
      <p class="status-message">{{ generatingStatus }}</p>
      
      <!-- 虛擬生成進度條 -->
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- 手冊渲染與閱讀畫面 -->
    <div v-else class="handbook-reader">
      <div class="reader-header glass-panel">
        <div class="handbook-meta">
          <span class="badge-theme">{{ store.currentNotebook?.meta?.theme || '通用主題' }}</span>
          <h1>{{ store.currentNotebook?.name }}</h1>
          <p class="desc" v-if="store.currentNotebook?.meta?.description">
            {{ store.currentNotebook.meta.description }}
          </p>
        </div>
        <div class="reader-actions">
          <button class="btn btn-secondary" @click="closeNotebook">
            返回首頁
          </button>
          <button class="btn btn-primary" @click="saveToDrive" :disabled="isSaving">
            <svg v-if="isSaving" class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
            {{ isSaving ? '儲存中...' : (store.currentNotebook?.id && !store.currentNotebook.id.startsWith('temp_') ? '同步更新雲端' : '儲存至 Google Drive') }}
          </button>
        </div>
      </div>

      <!-- 手冊主要內容區域 -->
      <div class="reader-content-layout">
        <div class="glass-panel main-document">
          <div class="doc-tabs">
            <button 
              v-for="tab in ['readme', 'concepts', 'misconceptions']" 
              :key="tab"
              :class="['tab-btn', { active: activeTab === tab }]"
              @click="activeTab = tab"
            >
              {{ tabName(tab) }}
            </button>
          </div>

          <div class="tab-content">
            <!-- Tab 1: 學習地圖 Markdown -->
            <div v-if="activeTab === 'readme'" class="markdown-body" v-html="renderedMarkdown"></div>
            
            <!-- Tab 2: 核心概念精要 -->
            <div v-else-if="activeTab === 'concepts'" class="concepts-view">
              <div class="concepts-grid">
                <div 
                  v-for="(concept, idx) in store.currentNotebook?.meta?.concepts || []" 
                  :key="idx" 
                  class="concept-card glass-panel hover-lift"
                  :class="{ expanded: expandedConcepts[idx] }"
                >
                  <div class="concept-header" @click="expandedConcepts[idx] = !expandedConcepts[idx]">
                    <div class="concept-title-row">
                      <span class="concept-num">0{{ idx + 1 }}</span>
                      <h3>{{ concept.title }}</h3>
                    </div>
                    <span class="toggle-indicator">{{ expandedConcepts[idx] ? '收合' : '展開細節' }}</span>
                  </div>
                  
                  <div class="concept-brief">
                    <p class="summary-text">{{ concept.summary }}</p>
                  </div>
                  
                  <div class="concept-details" v-if="expandedConcepts[idx]">
                    <div class="detail-section">
                      <h4>原理深度剖析</h4>
                      <p>{{ concept.explanation }}</p>
                    </div>
                    <div class="detail-section takeaway" v-if="concept.key_takeaway">
                      <h4>💡 核心要點記法</h4>
                      <p>{{ concept.key_takeaway }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Tab 3: 常見盲點與誤區 -->
            <div v-else-if="activeTab === 'misconceptions'" class="misconceptions-view">
              <div class="misconceptions-list">
                <div 
                  v-for="(item, idx) in store.currentNotebook?.meta?.misconceptions || []" 
                  :key="idx" 
                  class="misconception-card glass-panel"
                >
                  <div class="misconception-header">
                    <span class="myth-badge">盲點對照 0{{ idx + 1 }}</span>
                  </div>
                  <div class="comparison-grid">
                    <!-- 誤區 -->
                    <div class="comparison-column myth">
                      <div class="col-header">
                        <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span>常見直覺誤區 (Myth)</span>
                      </div>
                      <div class="col-content">
                        <p>{{ item.myth }}</p>
                      </div>
                    </div>
                    
                    <!-- 事實 -->
                    <div class="comparison-column truth">
                      <div class="col-header">
                        <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>導正科學事實 (Truth)</span>
                      </div>
                      <div class="col-content">
                        <p>{{ item.truth }}</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 分析 -->
                  <div class="misconception-analysis">
                    <h4>🔍 為什麼直覺會出錯？</h4>
                    <p>{{ item.explanation }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { generateLearningManual } from '../services/gemini'
import { loginGoogleDrive, saveNotebookToDrive } from '../services/googleDrive'

const store = useAppStore()
const router = useRouter()

const topicInput = ref('')
const isGenerating = ref(false)
const generatingStatus = ref('')
const progressPercent = ref(0)
const activeTab = ref('readme')
const isSaving = ref(false)
const expandedConcepts = ref({})

const suggestions = ['量子力學基礎', 'Rust 異步程式設計', '古典音樂賞析', '世界咖啡烘焙學']

const tabName = (tab) => {
  const names = {
    readme: '學習地圖 (Markdown)',
    concepts: '核心概念精要',
    misconceptions: '常見盲點與誤區'
  }
  return names[tab] || tab
}

const renderedMarkdown = computed(() => {
  if (!store.currentNotebook || !store.currentNotebook.content) return ''
  return marked.parse(store.currentNotebook.content)
})

const loginGoogle = () => {
  loginGoogleDrive()
}

const generateHandbook = async () => {
  if (!store.geminiApiKey) {
    alert('在開始生成前，請先至「設定」頁面填寫您的 Gemini API Key。')
    router.push({ name: 'Settings' })
    return
  }

  isGenerating.value = true
  progressPercent.value = 15
  generatingStatus.value = '正在呼叫 Gemini 模型分析主題框架...'
  
  // 建立進度條微調定時器
  const progressTimer = setInterval(() => {
    if (progressPercent.value < 85) {
      progressPercent.value += 3
    }
  }, 300)

  try {
    const data = await generateLearningManual(topicInput.value)
    
    clearInterval(progressTimer)
    progressPercent.value = 100
    generatingStatus.value = '規劃完成！正在組織學習資料...'
    
    setTimeout(() => {
      isGenerating.value = false
      // 寫入當前 Notebook 物件至全域 Store
      store.currentNotebook = {
        id: 'temp_' + Date.now(),
        name: `${data.theme} 學習手冊`,
        content: data.markdown_content,
        meta: {
          theme: data.theme,
          description: data.description,
          concepts: data.concepts,
          misconceptions: data.misconceptions,
          created: new Date().toISOString()
        }
      }
      
      // 生成成功後同時存入本地 LocalStorage 暫存，確保刷新不丟失
      store.saveLocalNotebook(store.currentNotebook)
      
      // 自動展開第一個核心概念卡片
      expandedConcepts.value = { 0: true }
    }, 800)
    
  } catch (err) {
    clearInterval(progressTimer)
    isGenerating.value = false
    alert('生成手冊失敗: ' + err.message)
  }
}

const closeNotebook = () => {
  store.currentNotebook = null
  topicInput.value = ''
}

const saveToDrive = async () => {
  if (!store.isAuthenticated) {
    alert('請先點擊頂部橫幅或前往「設定」完成 Google 雲端硬碟授權。')
    return
  }
  
  if (!store.currentNotebook) return
  
  isSaving.value = true
  try {
    const name = store.currentNotebook.name
    const content = store.currentNotebook.content
    const meta = store.currentNotebook.meta
    const oldTempId = store.currentNotebook.id
    
    const fileId = await saveNotebookToDrive(name, content, meta)
    
    // 更新當前手冊 ID 為 Drive 中的 ID
    store.currentNotebook.id = fileId
    
    // 如果之前是本地暫存手冊，上傳至雲端後，自本地快取中刪除，防止雙重列出
    if (oldTempId && oldTempId.startsWith('temp_')) {
      store.deleteLocalNotebook(oldTempId)
    }
    
    alert(`儲存成功！手冊已儲存至您雲端硬碟的「Topic Learning Hub」資料夾下。`)
  } catch (err) {
    console.error(err)
    alert('雲端儲存失敗: ' + err.message)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.warning-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  border-left: 4px solid var(--accent-warning);
}

.banner-text h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.banner-text p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 5rem 2rem;
  gap: 1.5rem;
}

.welcome-badge {
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-primary);
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 0.35rem 1rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.welcome-section h1 {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-lead {
  max-width: 600px;
  color: var(--text-secondary);
  font-size: 1.15rem;
}

.search-box {
  display: flex;
  width: 100%;
  max-width: 650px;
  gap: 0.75rem;
  margin-top: 1rem;
}

.search-box input {
  flex-grow: 1;
  font-size: 1.05rem;
  padding: 0.9rem 1.25rem;
  border-radius: var(--radius-sm);
}

.btn-generate {
  white-space: nowrap;
  font-size: 1rem;
}

.suggested-topics {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
}

.tag-btn {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  padding: 0.3rem 0.8rem;
  border-radius: 99px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tag-btn:hover {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
  border-color: var(--text-muted);
}

/* AI 生成中畫面樣式 */
.generating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
  gap: 2rem;
}

.spinner-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-core {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 50%;
  z-index: 2;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid var(--accent-primary);
  border-radius: 50%;
  animation: pulse 2s infinite cubic-bezier(0.215, 0.610, 0.355, 1);
  opacity: 0;
}

.pulse-ring.delay {
  animation-delay: 0.6s;
}

@keyframes pulse {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.generating-section h2 {
  font-size: 1.8rem;
  font-weight: 600;
}

.status-message {
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.progress-bar-container {
  width: 100%;
  max-width: 400px;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 99px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  transition: width 0.4s ease-out;
  border-radius: 99px;
}

/* 閱讀介面 */
.handbook-reader {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.handbook-meta {
  flex: 1;
  min-width: 300px;
}

.handbook-meta h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

.handbook-meta .desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.badge-theme {
  display: inline-block;
  font-size: 0.8rem;
  background: rgba(168, 85, 247, 0.1);
  color: var(--accent-secondary);
  border: 1px solid rgba(168, 85, 247, 0.2);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.reader-actions {
  display: flex;
  gap: 0.75rem;
}

.reader-content-layout {
  display: flex;
  gap: 1.5rem;
}

.main-document {
  flex-grow: 1;
  padding: 2rem;
}

.doc-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.doc-tabs .tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: 0;
}

.doc-tabs .tab-btn:hover {
  color: var(--text-primary);
}

.doc-tabs .tab-btn.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
  font-weight: 600;
}

.tab-content {
  min-height: 350px;
}

/* 核心概念卡片樣式 */
.concepts-view {
  animation: fadeIn 0.4s ease-out;
}

.concepts-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.concept-card {
  padding: 1.25rem;
  cursor: pointer;
}

.concept-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.concept-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.concept-num {
  font-family: 'Outfit', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.concept-header h3 {
  font-size: 1.15rem;
  font-weight: 600;
}

.toggle-indicator {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.concept-brief {
  margin-top: 0.5rem;
  padding-left: 3rem;
}

.summary-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
}

.concept-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--glass-border);
  padding-left: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: slideDown 0.3s ease-out;
}

.detail-section h4 {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.detail-section p {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.detail-section.takeaway {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--accent-secondary);
}

.detail-section.takeaway p {
  color: var(--text-primary);
  font-weight: 500;
}

/* 常見盲點與誤區樣式 */
.misconceptions-view {
  animation: fadeIn 0.4s ease-out;
}

.misconceptions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.misconception-card {
  padding: 1.5rem;
  border-left: 4px solid var(--accent-secondary);
}

.myth-badge {
  background: rgba(168, 85, 247, 0.1);
  color: var(--accent-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}

.comparison-column {
  padding: 1rem;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comparison-column.myth {
  background: rgba(239, 68, 68, 0.03);
  border: 1px solid rgba(239, 68, 68, 0.08);
}

.comparison-column.truth {
  background: rgba(16, 185, 129, 0.03);
  border: 1px solid rgba(16, 185, 129, 0.08);
}

.col-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.9rem;
}

.myth .col-header {
  color: var(--accent-danger);
}

.truth .col-header {
  color: var(--accent-success);
}

.col-content p {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-primary);
}

.misconception-analysis {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--glass-border);
}

.misconception-analysis h4 {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.misconception-analysis p {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.animate-spin {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; max-height: 0; overflow: hidden; }
  to { opacity: 1; max-height: 1000px; }
}

/* ================= 響應式微調 (RWD) ================= */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem 0.75rem;
    gap: 1.25rem;
  }
  
  /* 歡迎區優化 */
  .welcome-section {
    padding: 3rem 1rem;
    gap: 1rem;
  }
  
  .welcome-section h1 {
    font-size: 1.8rem;
  }
  
  .welcome-lead {
    font-size: 0.95rem;
  }
  
  .search-box {
    flex-direction: column;
    width: 100%;
  }
  
  .search-box input {
    font-size: 0.95rem;
    padding: 0.75rem 1rem;
  }
  
  .btn-generate {
    width: 100%;
    padding: 0.75rem;
  }
  
  /* 閱讀介面優化 */
  .reader-header {
    flex-direction: column;
    align-items: stretch;
    padding: 1.25rem 1rem;
    gap: 1rem;
  }
  
  .handbook-meta {
    min-width: 0;
  }
  
  .handbook-meta h1 {
    font-size: 1.4rem;
  }
  
  .reader-actions {
    width: 100%;
    display: flex;
    gap: 0.5rem;
  }
  
  .reader-actions button {
    flex: 1;
    font-size: 0.85rem;
    padding: 0.6rem 0.5rem;
    white-space: nowrap;
  }
  
  .reader-content-layout {
    display: block;
    width: 100%;
  }

  .main-document {
    padding: 1.25rem 1rem;
    width: 100% !important;
    box-sizing: border-box;
    min-width: 0;
  }
  
  /* 標籤頁自適應滾動 */
  .doc-tabs {
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  .doc-tabs .tab-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
  }
  
  /* 核心概念卡片縮小縮排 */
  .concept-brief, .concept-details {
    padding-left: 0.5rem;
  }
  
  .concept-num {
    width: 26px;
    height: 26px;
    font-size: 0.95rem;
  }
  
  .concept-header h3 {
    font-size: 1rem;
  }
}
</style>

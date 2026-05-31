<template>
  <div class="app-layout">
    <!-- 手機版頂部導航列 -->
    <header class="mobile-header glass-panel">
      <button class="btn-hamburger" @click="isMobileMenuOpen = true" aria-label="開啟選單">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div class="mobile-logo">
        <svg class="logo-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span class="mobile-logo-text">TopicHub</span>
      </div>
      <div class="mobile-header-spacer"></div>
    </header>

    <!-- 側邊欄背景遮罩 (僅在手機版選單開啟時顯示) -->
    <div 
      class="sidebar-backdrop" 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- 側邊欄 Sidebar -->
    <aside 
      class="sidebar glass-panel" 
      :class="{ 
        collapsed: !store.sidebarOpen,
        'mobile-open': isMobileMenuOpen 
      }"
    >
      <div class="sidebar-header">
        <div class="logo">
          <svg class="logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span class="logo-text" v-if="store.sidebarOpen || isMobileMenuOpen">TopicHub</span>
        </div>
        
        <!-- 桌機版折疊按鈕 -->
        <button class="btn-toggle-sidebar desktop-only" @click="store.sidebarOpen = !store.sidebarOpen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" v-if="!store.sidebarOpen"/>
            <path d="M15 19l-7-7 7-7" v-else/>
          </svg>
        </button>

        <!-- 手機版關閉按鈕 -->
        <button class="btn-close-sidebar mobile-only" @click="isMobileMenuOpen = false" aria-label="關閉選單">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 新增按鈕 -->
      <div class="sidebar-actions" v-if="store.sidebarOpen || isMobileMenuOpen">
        <button class="btn btn-primary btn-new" @click="createNewManual">
          <span class="plus-icon">+</span> 新建手冊
        </button>
      </div>

      <!-- 導覽選單 / 手冊清單 -->
      <div class="sidebar-content" v-if="store.sidebarOpen || isMobileMenuOpen">
        <div class="menu-section">
          <router-link to="/" class="menu-item" active-class="active" @click="isMobileMenuOpen = false">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            儀表板
          </router-link>
          
          <router-link to="/settings" class="menu-item" active-class="active" @click="isMobileMenuOpen = false">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            設定
          </router-link>
        </div>

        <!-- 手冊歷史清單區 -->
        <div class="notebooks-list-section">
          <div class="section-title">我的學習手冊</div>
          <div class="notebooks-scroll">
            <div v-if="store.allNotebooks.length === 0" class="empty-list">
              目前無任何手冊存檔。
            </div>
            <div 
              v-else 
              v-for="nb in store.allNotebooks" 
              :key="nb.id"
              :class="['notebook-item', { active: store.currentNotebook?.id === nb.id }]"
              @click="loadNotebook(nb)"
            >
              <svg class="notebook-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span class="notebook-name">{{ nb.name }}</span>
              <span v-if="nb.isLocal" class="local-tag">本地</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 側邊欄底部帳戶區 -->
      <div class="sidebar-footer" v-if="store.sidebarOpen || isMobileMenuOpen">
        <div v-if="store.isAuthenticated" class="user-profile-summary">
          <img :src="store.userProfile?.picture" class="user-avatar" alt="User avatar" v-if="store.userProfile?.picture" />
          <div class="user-details">
            <span class="user-name">{{ store.userProfile?.name }}</span>
            <span class="logout-link" @click="handleLogout">登出</span>
          </div>
        </div>
        <div v-else class="login-prompt">
          <router-link to="/settings" class="btn btn-secondary btn-login" @click="isMobileMenuOpen = false">
            尚未授權雲端
          </router-link>
        </div>
      </div>
    </aside>

    <!-- 主要檢視畫面 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 全局加載遮罩 (Global Loading Spinner) -->
    <div class="global-loading-overlay" v-if="store.globalLoading">
      <div class="glass-panel loading-card">
        <div class="spinner"></div>
        <p>{{ store.loadingMessage || '處理中，請稍候...' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from './stores/app'
import { useRouter } from 'vue-router'
import { initGapiClient, initTokenClientHelper, syncNotebooksList, loadNotebookFromDrive } from './services/googleDrive'

const store = useAppStore()
const router = useRouter()

// 手機版選單狀態
const isMobileMenuOpen = ref(false)

const createNewManual = () => {
  store.currentNotebook = null
  isMobileMenuOpen.value = false
  router.push({ name: 'Dashboard' })
}

const loadNotebook = async (nb) => {
  isMobileMenuOpen.value = false
  if (nb.isLocal) {
    const local = store.localNotebooks.find(item => item.id === nb.id)
    if (local) {
      store.currentNotebook = JSON.parse(JSON.stringify(local))
      router.push({ name: 'Dashboard' })
    }
    return
  }
  
  store.startLoading(`正在從雲端下載 ${nb.name}...`)
  try {
    const notebook = await loadNotebookFromDrive(nb.id)
    store.currentNotebook = notebook
    store.stopLoading()
    router.push({ name: 'Dashboard' })
  } catch (err) {
    store.stopLoading()
    alert('下載手冊失敗: ' + err.message)
  }
}

const handleLogout = () => {
  store.logout()
  isMobileMenuOpen.value = false
  router.push({ name: 'Dashboard' })
}

onMounted(async () => {
  try {
    await initGapiClient()
    if (store.googleClientId) {
      initTokenClientHelper()
    }
    if (store.isAuthenticated) {
      await syncNotebooksList()
    }
  } catch (e) {
    console.error('初始化 Google API 失敗:', e)
  }
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* 手機頂部欄預設隱藏 */
.mobile-header {
  display: none;
}

/* 側邊欄樣式 */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  border-top: none;
  border-left: none;
  border-bottom: none;
  background: var(--bg-sidebar);
  transition: width var(--transition-normal);
  z-index: 10;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  border-bottom: 1px solid var(--glass-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--accent-primary);
}

.logo-icon {
  filter: drop-shadow(var(--glow-effect));
  flex-shrink: 0;
}

.logo-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.btn-toggle-sidebar {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.btn-toggle-sidebar:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.sidebar-actions {
  padding: 1.25rem;
}

.btn-new {
  width: 100%;
  padding: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.plus-icon {
  font-size: 1.2rem;
  margin-right: 0.25rem;
}

.sidebar-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 1.25rem;
  overflow: hidden;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.menu-item:hover, .menu-item.active {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.menu-item.active {
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-primary);
  border-left: 3px solid var(--accent-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.notebooks-list-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  padding-left: 0.5rem;
  flex-shrink: 0;
}

.notebooks-scroll {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.empty-list {
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 1rem 0.5rem;
  font-style: italic;
}

.notebook-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.notebook-item:hover, .notebook-item.active {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.notebook-item.active {
  color: var(--accent-secondary);
  background: rgba(168, 85, 247, 0.08);
}

.notebook-icon {
  flex-shrink: 0;
}

.notebook-name {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.local-tag {
  font-size: 0.7rem;
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.05rem 0.3rem;
  border-radius: 4px;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 1.25rem;
  border-top: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.user-profile-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
}

.user-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-link {
  font-size: 0.75rem;
  color: var(--accent-danger);
  cursor: pointer;
  align-self: flex-start;
}

.logout-link:hover {
  text-decoration: underline;
}

.btn-login {
  width: 100%;
  font-size: 0.85rem;
  padding: 0.5rem;
  white-space: nowrap;
}

.main-content {
  flex-grow: 1;
  height: 100vh;
  overflow-y: auto;
  position: relative;
}

/* 全局 Loading */
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-card {
  padding: 2rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99, 102, 241, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================= 響應式網頁設計 (RWD) ================= */
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  
  .desktop-only {
    display: none !important;
  }
  
  .mobile-only {
    display: flex !important;
  }
  
  /* 手機版頂部欄 */
  .mobile-header {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    border-radius: 0;
    border-top: none;
    border-left: none;
    border-right: none;
    background: var(--bg-sidebar);
    z-index: 20;
    flex-shrink: 0;
  }
  
  .btn-hamburger {
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    width: 44px;
    height: 44px;
    padding: 0 !important; /* 重設全域按鈕的 padding，防止內部的 SVG 被擠壓成 0 寬度 */
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-hamburger svg {
    stroke: var(--text-primary) !important;
  }
  
  .btn-hamburger:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .mobile-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--accent-primary);
  }
  
  .mobile-logo-text {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 1.15rem;
    color: var(--text-primary);
  }
  
  .mobile-header-spacer {
    width: 44px; /* 對齊左側 44px 漢堡按鈕，以維持 Logo 置中 */
  }

  /* 手機版側邊欄背景遮罩 */
  .sidebar-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 90;
  }
  
  /* 手機版側邊欄 (抽屜 Drawer 形式) */
  .sidebar {
    position: fixed;
    top: 0;
    left: -290px; /* 預設完全藏起 */
    width: 280px !important;
    height: 100vh;
    z-index: 100;
    transition: left var(--transition-normal);
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
  }
  
  .sidebar.mobile-open {
    left: 0; /* 彈出 */
  }
  
  .btn-close-sidebar {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    width: 32px;
    height: 32px;
    padding: 0 !important; /* 重設全域按鈕的 padding，防止關閉圖標被擠壓 */
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-close-sidebar:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  /* 主要內容區手機滿版 */
  .main-content {
    height: calc(100vh - 60px);
    width: 100% !important;
  }
}
</style>

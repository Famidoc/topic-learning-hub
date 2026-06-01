import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // API 設定
    googleClientId: localStorage.getItem('google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    geminiApiKey: localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '',
    
    // Auth 狀態
    googleToken: localStorage.getItem('google_token') || null,
    googleTokenExpiry: localStorage.getItem('google_token_expiry') || null,
    userProfile: JSON.parse(localStorage.getItem('user_profile') || 'null'),
    
    // 手冊清單與當前編輯手冊
    notebooks: [], // 雲端硬碟手冊清單 { id, name, updatedTime }
    localNotebooks: JSON.parse(localStorage.getItem('local_notebooks') || '[]'), // 本地暫存手冊 { id, name, content, meta, updatedTime }
    currentNotebook: null, // { id, name, content, meta: { theme, description, created } }
    
    // UI 狀態
    theme: localStorage.getItem('app_theme') || 'dark',
    sidebarOpen: true,
    globalLoading: false,
    loadingMessage: ''
  }),
  
  getters: {
    isAuthenticated: (state) => {
      if (!state.googleToken) return false
      // 檢查 Token 是否過期
      const now = new Date().getTime()
      return state.googleTokenExpiry ? now < parseInt(state.googleTokenExpiry) : false
    },
    isConfigured: (state) => {
      // 必須設定 Client ID 才能登入 Google，且必須有 Gemini API Key 才能生成內容
      return !!state.googleClientId
    },
    // 合併雲端與本地手冊列表，方便 Sidebar 統一渲染
    allNotebooks: (state) => {
      const locals = state.localNotebooks.map(nb => ({
        id: nb.id,
        name: nb.name,
        isLocal: true,
        updatedTime: nb.updatedTime
      }))
      return [...locals, ...state.notebooks]
    }
  },
  
  actions: {
    // 初始化設定
    initTheme() {
      document.documentElement.setAttribute('data-theme', this.theme)
    },
    
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('app_theme', this.theme)
      document.documentElement.setAttribute('data-theme', this.theme)
    },
    
    setGoogleClientId(id) {
      this.googleClientId = id
      localStorage.setItem('google_client_id', id)
    },
    
    setGeminiApiKey(key) {
      this.geminiApiKey = key
      localStorage.setItem('gemini_api_key', key)
    },
    
    // 儲存手冊至本地 LocalStorage
    saveLocalNotebook(notebook) {
      const idx = this.localNotebooks.findIndex(nb => nb.id === notebook.id || nb.name === notebook.name)
      const nowStr = new Date().toISOString()
      
      const newNotebook = {
        ...notebook,
        updatedTime: nowStr
      }
      
      if (idx !== -1) {
        // 更新現有
        this.localNotebooks[idx] = newNotebook
      } else {
        // 新增
        this.localNotebooks.unshift(newNotebook)
      }
      
      localStorage.setItem('local_notebooks', JSON.stringify(this.localNotebooks))
    },
    
    // 從本地刪除某個手冊 (例如已成功上傳到雲端後)
    deleteLocalNotebook(id) {
      this.localNotebooks = this.localNotebooks.filter(nb => nb.id !== id)
      localStorage.setItem('local_notebooks', JSON.stringify(this.localNotebooks))
    },
    
    async deleteNotebook(id) {
      if (id.startsWith('temp_')) {
        this.deleteLocalNotebook(id)
        if (this.currentNotebook && this.currentNotebook.id === id) {
          this.currentNotebook = null
        }
        return
      }
      
      // 動態導入 googleDrive 服務以避免循環引用
      const { deleteNotebookFromDrive } = await import('../services/googleDrive')
      this.startLoading('正在將手冊移至雲端硬碟垃圾桶...')
      try {
        await deleteNotebookFromDrive(id)
        this.notebooks = this.notebooks.filter(nb => nb.id !== id)
        if (this.currentNotebook && this.currentNotebook.id === id) {
          this.currentNotebook = null
        }
      } catch (err) {
        console.error('從雲端刪除手冊失敗:', err)
        throw err
      } finally {
        this.stopLoading()
      }
    },
    
    // 登入成功
    setAuth(token, expiresIn, profile = null) {
      this.googleToken = token
      const expiryTime = new Date().getTime() + expiresIn * 1000
      this.googleTokenExpiry = expiryTime.toString()
      
      localStorage.setItem('google_token', token)
      localStorage.setItem('google_token_expiry', expiryTime.toString())
      
      if (profile) {
        this.userProfile = profile
        localStorage.setItem('user_profile', JSON.stringify(profile))
      }
    },
    
    // 登出
    logout() {
      this.googleToken = null
      this.googleTokenExpiry = null
      this.userProfile = null
      this.notebooks = []
      this.currentNotebook = null
      
      localStorage.removeItem('google_token')
      localStorage.removeItem('google_token_expiry')
      localStorage.removeItem('user_profile')
      
      // 同時清除 gapi token
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(null)
      }
    },
    
    // Loading 管理
    startLoading(message = '') {
      this.globalLoading = true
      this.loadingMessage = message
    },
    
    stopLoading() {
      this.globalLoading = false
      this.loadingMessage = ''
    }
  }
})

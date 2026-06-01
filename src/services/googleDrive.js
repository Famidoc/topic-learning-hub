import { useAppStore } from '../stores/app'

// Google Drive API Scopes
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'

let tokenClient = null
let gapiInited = false
let gisInited = false

/**
 * 載入 GAPI 並初始化 client
 */
export function initGapiClient() {
  return new Promise((resolve, reject) => {
    if (gapiInited) return resolve()
    
    if (!window.gapi) {
      return reject(new Error('Google API Client 尚未載入，請確認網路或 index.html 配置'))
    }
    
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          // 不需要 apiKey 也可以直接用 Token 請求，但 discoveryDocs 必須載入
          discoveryDocs: [DISCOVERY_DOC],
        })
        gapiInited = true
        
        // 如果 localStorage 中有可用的 Token，先設定給 gapi
        const store = useAppStore()
        if (store.isAuthenticated) {
          window.gapi.client.setToken({ access_token: store.googleToken })
        }
        
        resolve()
      } catch (err) {
        console.error('初始化 GAPI client 失敗:', err)
        reject(err)
      }
    })
  })
}

/**
 * 初始化 GIS (Google Identity Services) Token Client
 */
export function initTokenClientHelper() {
  const store = useAppStore()
  if (gisInited || !store.googleClientId) return
  
  if (!window.google) {
    console.warn('Google GIS SDK 尚未載入')
    return
  }
  
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: store.googleClientId,
    scope: SCOPES,
    callback: async (response) => {
      if (response.error !== undefined) {
        store.stopLoading()
        alert('Google 授權失敗: ' + response.error)
        return
      }
      
      // 授權成功，儲存 Token 與過期時間
      store.setAuth(response.access_token, response.expires_in)
      
      // 設定 gapi Token
      window.gapi.client.setToken({ access_token: response.access_token })
      
      // 獲取使用者 Profile 資訊
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        })
        const profile = await userInfoRes.json()
        store.setAuth(response.access_token, response.expires_in, {
          name: profile.name,
          email: profile.email,
          picture: profile.picture
        })
        
        // 登入後拉取手冊列表
        await syncNotebooksList()
      } catch (e) {
        console.error('獲取使用者基本資料失敗:', e)
      } finally {
        store.stopLoading()
      }
    },
  })
  gisInited = true
}

/**
 * 觸發 Google OAuth2 授權
 */
export function loginGoogleDrive() {
  const store = useAppStore()
  if (!gisInited) {
    initTokenClientHelper()
  }
  
  if (!tokenClient) {
    alert('請先在設定中填寫正確的 Google Client ID！')
    return
  }
  
  store.startLoading('正在引導至 Google 安全授權畫面...')
  
  // 檢查是否已有 token，如有則使用 prompt: '' 靜默獲取
  if (store.googleToken) {
    tokenClient.requestAccessToken({ prompt: '' })
  } else {
    tokenClient.requestAccessToken({ prompt: 'select_account' })
  }
}

/**
 * 尋找或建立應用程式的專用資料夾 (Topic Learning Hub)
 */
async function getOrCreateFolder() {
  const folderName = 'Topic Learning Hub'
  
  try {
    // 搜尋資料夾
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    })
    
    const files = response.result.files
    if (files && files.length > 0) {
      return files[0].id
    }
    
    // 建立資料夾
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    }
    
    const createRes = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    })
    return createRes.result.id
  } catch (err) {
    console.error('尋找或建立 Topic Learning Hub 資料夾時出錯:', err)
    throw err
  }
}

/**
 * 同步雲端硬碟內的所有手冊清單到 Pinia Store
 */
export async function syncNotebooksList() {
  const store = useAppStore()
  if (!store.isAuthenticated) return
  
  try {
    await initGapiClient()
    const folderId = await getOrCreateFolder()
    
    const response = await window.gapi.client.drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc'
    })
    
    const files = response.result.files || []
    store.notebooks = files.map(file => ({
      id: file.id,
      name: file.name,
      updatedTime: file.modifiedTime
    }))
  } catch (err) {
    console.error('同步雲端手冊清單失敗:', err)
    // 如果 token 過期或失效，自動登出
    if (err.status === 401) {
      store.logout()
    }
  }
}

/**
 * 將手冊儲存為混合格式的 Markdown 到 Google Drive
 * 混合格式：檔案開頭使用 JSON Front-matter (用 <!-- json ... --> 夾帶，避免破壞 Markdown 在一般閱讀器中的觀感)
 */
export async function saveNotebookToDrive(name, markdownContent, metaData) {
  const store = useAppStore()
  if (!store.isAuthenticated) throw new Error('雲端硬碟尚未授權')
  
  await initGapiClient()
  const folderId = await getOrCreateFolder()
  
  // 構造混合格式內容
  const jsonMetaString = JSON.stringify(metaData, null, 2)
  const fullContent = `<!-- JSON_METADATA_START\n${jsonMetaString}\nJSON_METADATA_END -->\n\n${markdownContent}`
  
  // 檢查是否為現有檔案（更新），或是新建檔案
  let fileId = null
  
  // 如果當前 Notebook 有 id 且不是 mock 的臨時 id，就更新它
  if (store.currentNotebook && store.currentNotebook.id && !store.currentNotebook.id.startsWith('temp_')) {
    fileId = store.currentNotebook.id
  } else {
    // 試圖在雲端搜尋同名檔案
    const searchRes = await window.gapi.client.drive.files.list({
      q: `'${folderId}' in parents and name = '${name}' and mimeType = 'text/markdown' and trashed = false`,
      fields: 'files(id)'
    })
    const files = searchRes.result.files
    if (files && files.length > 0) {
      fileId = files[0].id
    }
  }
  
  const boundary = 'foo_bar_baz_boundary'
  const delimiter = `\n--${boundary}\n`
  const closeDelimiter = `\n--${boundary}--`
  
  const metadata = {
    name: name,
    mimeType: 'text/markdown',
  }
  
  if (!fileId) {
    // 新建檔案時指定父資料夾
    metadata.parents = [folderId]
  }
  
  // 使用 multipart 上傳（既上傳 Metadata，又上傳 File 實體內容）
  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\n\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/markdown; charset=UTF-8\n\n' +
    fullContent +
    closeDelimiter
    
  let request
  if (fileId) {
    // 更新檔案
    request = window.gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    })
  } else {
    // 建立新檔案
    request = window.gapi.client.request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    })
  }
  
  const res = await request
  const savedFile = res.result
  
  // 更新 Store 狀態
  if (!fileId) {
    store.currentNotebook.id = savedFile.id
  }
  
  // 重新同步清單
  await syncNotebooksList()
  return savedFile.id
}

/**
 * 從 Google Drive 下載檔案並解析混合格式
 */
export async function loadNotebookFromDrive(fileId) {
  const store = useAppStore()
  await initGapiClient()
  
  // 1. 取得檔案 metadata
  const fileMetaRes = await window.gapi.client.drive.files.get({
    fileId: fileId,
    fields: 'id, name'
  })
  const fileName = fileMetaRes.result.name
  
  // 2. 下載檔案純文字內容
  const fileContentRes = await window.gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'
  })
  
  const rawText = fileContentRes.body || ''
  
  // 3. 解析混合格式中的 JSON 中繼資料
  let metaData = {}
  let markdownContent = rawText
  
  const metaRegex = /<!-- JSON_METADATA_START\s*([\s\S]*?)\s*JSON_METADATA_END -->/
  const match = rawText.match(metaRegex)
  if (match) {
    try {
      metaData = JSON.parse(match[1].trim())
      // 移除 Metadata 註解得到純 Markdown
      markdownContent = rawText.replace(metaRegex, '').trim()
    } catch (e) {
      console.error('解析檔案 metadata 失敗，將作為普通 Markdown 處理:', e)
    }
  }
  
  return {
    id: fileId,
    name: fileName,
    content: markdownContent,
    meta: metaData
  }
}

/**
 * 從雲端將檔案移入垃圾桶
 */
export async function deleteNotebookFromDrive(fileId) {
  const store = useAppStore()
  if (!store.isAuthenticated) throw new Error('雲端硬碟尚未授權')
  
  await initGapiClient()
  await window.gapi.client.drive.files.update({
    fileId: fileId,
    resource: { trashed: true }
  })
}

/**
 * 匯出為 Google Doc 格式以利 NotebookLM 匯入
 */
export async function exportToGoogleDoc(name, htmlContent) {
  const store = useAppStore()
  if (!store.isAuthenticated) throw new Error('雲端硬碟尚未授權')
  
  await initGapiClient()
  const folderId = await getOrCreateFolder()
  
  const boundary = 'foo_bar_baz_boundary_doc'
  const delimiter = `\n--${boundary}\n`
  const closeDelimiter = `\n--${boundary}--`
  
  const metadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.document',
    parents: [folderId]
  }
  
  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\n\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html; charset=UTF-8\n\n' +
    htmlContent +
    closeDelimiter
    
  const request = window.gapi.client.request({
    path: '/upload/drive/v3/files',
    method: 'POST',
    params: { uploadType: 'multipart' },
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  })
  
  const res = await request
  return res.result.id
}

/**
 * 尋找或建立圖片專用子資料夾
 */
async function getOrCreateAssetsFolder(parentFolderId) {
  const folderName = 'assets'
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${folderName}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
      spaces: 'drive'
    })
    const files = response.result.files
    if (files && files.length > 0) {
      return files[0].id
    }
    
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    }
    const createRes = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    })
    return createRes.result.id
  } catch (err) {
    console.error('建立 assets 資料夾出錯:', err)
    throw err
  }
}

/**
 * 上傳圖片到 Google Drive 並設為公開讀取
 */
export async function uploadImageToDrive(file) {
  const store = useAppStore()
  if (!store.isAuthenticated) throw new Error('雲端硬碟尚未授權')
  
  await initGapiClient()
  const parentFolderId = await getOrCreateFolder()
  const assetsFolderId = await getOrCreateAssetsFolder(parentFolderId)
  
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
    reader.readAsDataURL(file)
  })
  
  const boundary = 'foo_bar_baz_boundary_img'
  const delimiter = `\n--${boundary}\n`
  const closeDelimiter = `\n--${boundary}--`
  
  const metadata = {
    name: `${Date.now()}_${file.name}`,
    mimeType: file.type,
    parents: [assetsFolderId]
  }
  
  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\n\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type}\n` +
    'Content-Transfer-Encoding: base64\n\n' +
    base64Data +
    closeDelimiter
    
  const createRes = await window.gapi.client.request({
    path: '/upload/drive/v3/files',
    method: 'POST',
    params: { uploadType: 'multipart' },
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  })
  
  const imageId = createRes.result.id
  
  // 修改權限，使任何人有連結都能讀取圖片
  await window.gapi.client.drive.permissions.create({
    fileId: imageId,
    resource: {
      role: 'reader',
      type: 'anyone'
    }
  })
  
  return `https://lh3.googleusercontent.com/d/${imageId}`
}

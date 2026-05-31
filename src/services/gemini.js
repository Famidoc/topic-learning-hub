import { useAppStore } from '../stores/app'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * 根據用戶輸入的主題呼叫 Gemini 生成學習手冊
 * @param {string} topic 學習主題
 * @returns {Promise<object>} 解析後的結構化學習手冊對象
 */
export async function generateLearningManual(topic) {
  const store = useAppStore()
  const apiKey = store.geminiApiKey
  
  if (!apiKey) {
    throw new Error('未設定 Gemini API 金鑰，請先至「設定」頁面進行配置')
  }
  
  const systemInstruction = `
你是一位世界級的學習設計專家與學術導師。
你的任務是為用戶輸入的主題建構一份結構化的「主題學習手冊」。
請嚴格返回一個符合以下 JSON Schema 的 JSON 物件。不要輸出 Markdown 程式碼塊以外的任何額外文字。

JSON Schema 格式必須嚴格如下：
{
  "theme": "主題名稱",
  "description": "一句話簡述此主題的核心本質與學習價值",
  "markdown_content": "以 Markdown 語法撰寫的『逐步學習地圖』。包含前言、完整的學習路徑章節（第 1 章、第 2 章...），以及學習建議。請使用 H2 (##) 與 H3 (###) 來組織章節。",
  "concepts": [
    {
      "title": "概念名稱",
      "summary": "一句話描述此概念",
      "explanation": "深入淺出的詳細原理說明，多用生活實例比喻",
      "key_takeaway": "核心重點與學習技巧"
    }
  ],
  "misconceptions": [
    {
      "myth": "新手的常見直覺誤區、迷思或錯誤觀念",
      "truth": "導正後的正確觀念或科學事實",
      "explanation": "詳細解釋為什麼直覺會出錯，以及如何正確理解它"
    }
  ]
}

要求細節：
1. concepts 陣列中請包含該主題最核心的 3 到 5 個關鍵概念。
2. misconceptions 陣列中請包含新手最容易犯、最嚴重的 2 到 4 個觀念誤區。
3. markdown_content 請撰寫得條理清晰、語氣鼓勵、且具備實用的引導步驟（一步一步來）。
4. 請全部以「繁體中文（traditional Chinese）」撰寫。
`

  const requestBody = {
    contents: [
      {
        parts: [
          { text: `請為我建構主題：「${topic}」的學習手冊。` }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        { text: systemInstruction }
      ]
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7
    }
  }
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || response.statusText
      throw new Error(`Gemini API 錯誤 (${response.status}): ${errorMessage}`)
    }
    
    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!rawText) {
      throw new Error('Gemini API 未回傳有效內容')
    }
    
    // 解析 JSON
    const parsedData = JSON.parse(rawText.trim())
    return parsedData
    
  } catch (err) {
    console.error('Gemini 生成失敗:', err)
    throw err
  }
}

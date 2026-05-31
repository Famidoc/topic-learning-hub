// Service Worker 空殼，用於滿足各大行動瀏覽器（如 Safari, Chrome）的 PWA 安裝判定機制
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 保持空 fetch 監聽器，不做實際的離線快取阻攔，確保完全聯網且即時讀寫 Google Drive 與 Gemini API
});

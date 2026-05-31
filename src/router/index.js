import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Settings from '../views/Settings.vue'
import { useAppStore } from '../stores/app'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 簡易導航守衛：若沒有設定 Google Client ID，且不是去設定頁，則導向設定頁面
router.beforeEach((to, from, next) => {
  const store = useAppStore()
  if (!store.googleClientId && to.name !== 'Settings') {
    next({ name: 'Settings' })
  } else {
    next()
  }
})

export default router

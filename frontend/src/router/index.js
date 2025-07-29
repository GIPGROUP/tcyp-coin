import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/PersonalDashboard.vue')
      },
      {
        path: 'general',
        name: 'General',
        component: () => import('@/views/GeneralDashboard.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/AdminDashboard.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Проверка авторизации
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Если маршрут требует авторизацию
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next('/login')
    }
    
    // Загружаем пользователя если его нет
    if (!authStore.user) {
      await authStore.fetchUser()
    }
    
    // Проверяем права администратора
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      return next('/dashboard')
    }
  }
  
  // Если пользователь авторизован и пытается зайти на страницу логина
  if (to.path === '/login' && authStore.isAuthenticated) {
    return next('/dashboard')
  }
  
  next()
})

export default router
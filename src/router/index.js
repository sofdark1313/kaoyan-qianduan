import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/upgrade',
    name: 'UpgradeVIP',
    component: () => import('@/views/UpgradeVIP.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/recovery',
    name: 'Recovery',
    component: () => import('@/views/Recovery.vue'),
    meta: { requiresAuth: false }
  },
  // 添加通配符路由，捕获所有未匹配的路径
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (token && (to.path === '/login' || to.path === '/register')) {
    // 如果已登录，访问登录或注册页面时重定向到聊天页面
    next('/chat')
  } else {
    next()
  }
})

export default router
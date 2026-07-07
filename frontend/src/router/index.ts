import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/lays/MainLayout.vue'),
    redirect: '/todo',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'todo',
        name: 'TodoCenter',
        component: () => import('@/views/todo/index.vue'),
        meta: { title: '统一待办中心', icon: 'Tickets' }
      },
      {
        path: 'approval/:id',
        name: 'ApprovalDesk',
        component: () => import('@/views/approval/index.vue'),
        meta: { title: '智能审批台', icon: 'Document', hidden: true }
      },
      {
        path: 'ai-audit/:id',
        name: 'AiAudit',
        component: () => import('@/views/ai-audit/index.vue'),
        meta: { title: 'AI审核详情', icon: 'MagicStick', hidden: true }
      },
      {
        path: 'expense',
        name: 'ExpenseReport',
        component: () => import('@/views/expense/index.vue'),
        meta: { title: '智能报销', icon: 'Wallet' }
      },
      {
        path: 'contract',
        name: 'ContractManage',
        component: () => import('@/views/contract/index.vue'),
        meta: { title: '智能合同', icon: 'Files' }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '管理驾驶舱', icon: 'DataLine' }
      },
      {
        path: 'llm',
        name: 'LLMManage',
        component: () => import('@/views/llm/index.vue'),
        meta: { title: '大模型服务管理', icon: 'Setting', requiresAuth: true }
      },
      {
        path: 'connector',
        name: 'ConnectorManage',
        component: () => import('@/views/connector/index.vue'),
        meta: { title: '连接器管理', icon: 'Connection', requiresAuth: true }
      },
      {
        path: 'data-chat',
        name: 'DataChat',
        component: () => import('@/views/data-chat/index.vue'),
        meta: { title: '数据智能问答', icon: 'ChatLineRound', requiresAuth: true }
      },
      {
        path: 'system-admin',
        name: 'SystemAdmin',
        component: () => import('@/views/system-admin/index.vue'),
        meta: { title: '系统管理', icon: 'Setting', requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/todo'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

const WHITE_LIST = ['/login']

router.beforeEach((to, _from, next) => {
  // 设置标题
  const title = (to.meta?.title as string) || '道一云AI协同中台'
  document.title = `${title} · 道一云AI协同中台`

  const token = localStorage.getItem('jml_token')

  if (to.meta?.requiresAuth === false || WHITE_LIST.includes(to.path)) {
    // 已登录用户访问登录页 → 跳转首页
    if (to.path === '/login' && token) {
      return next('/todo')
    }
    return next()
  }

  if (!token) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  next()
})

router.afterEach(() => {
  // 占位：可用于埋点
})

export default router

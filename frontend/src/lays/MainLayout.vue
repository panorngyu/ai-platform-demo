<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Fold,
  Expand,
  Tickets,
  DataLine,
  User,
  ArrowDown,
  SwitchButton,
  HomeFilled,
  Monitor,
  Setting,
  Connection,
  ChatLineRound,
  Opportunity,
  Service
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ============ 菜单配置 ============
const menus = [
  { index: '/todo', title: '待办中心', icon: Tickets },
  { index: '/smart-square', title: '智能广场', icon: Opportunity },
  { index: '/agent', title: '智能体中心', icon: Service },

  { index: '/dashboard', title: '管理驾驶舱', icon: DataLine },
  { index: '/llm', title: '大模型服务管理', icon: Setting },
  { index: '/connector', title: '连接器管理', icon: Connection },
  { index: '/data-chat', title: '数据智能问答', icon: ChatLineRound },
  { index: '/system-admin', title: '系统管理', icon: Setting }
]

// ============ 侧边栏折叠 ============
const isCollapse = ref(false)
const isMobile = ref(false)
const drawerVisible = ref(false)

function checkScreen() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    isCollapse.value = false
  }
}

onMounted(() => {
  checkScreen()
  window.addEventListener('resize', checkScreen)
  // 拉取用户信息
  if (userStore.isLoggedIn && !userStore.userInfo) {
    userStore.fetchUserInfo()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreen)
})

function toggleSidebar() {
  if (isMobile.value) {
    drawerVisible.value = !drawerVisible.value
  } else {
    isCollapse.value = !isCollapse.value
  }
}

function handleMenuSelect(index: string) {
  router.push(index)
  if (isMobile.value) drawerVisible.value = false
}

// ============ 面包屑 ============
const breadcrumbItems = computed(() => {
  const items: Array<{ title: string; path?: string }> = [
    { title: '首页', path: '/todo' }
  ]
  // 支持自定义多级面包屑（用于智能体中心等层级入口）
  const breadcrumbs = route.meta?.breadcrumb as Array<{ title: string; path?: string }> | undefined
  if (breadcrumbs && breadcrumbs.length > 0) {
    items.push(...breadcrumbs)
  } else {
    const title = route.meta?.title as string
    if (title && title !== '首页') {
      items.push({ title })
    }
  }
  return items
})

const activeMenu = computed(() => {
  const seg = route.path.split('/')[1]
  // 智能体相关页面统一高亮「智能体中心」
  const agentSegments = ['expense', 'contract', 'approval', 'ai-audit']
  if (agentSegments.includes(seg)) {
    return '/agent'
  }
  return '/' + seg
})

const pageTitle = computed(() => (route.meta?.title as string) || '道一云AI协同中台')

// ============ 用户下拉 ============
function handleCommand(cmd: string) {
  if (cmd === 'profile') {
    ElMessage.info('个人信息功能开发中')
  } else if (cmd === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      })
      .catch(() => {})
  }
}
</script>

<template>
  <el-container class="main-layout">
    <!-- 侧边栏 - 桌面端 -->
    <el-aside
      v-if="!isMobile"
      :width="isCollapse ? '64px' : '220px'"
      class="sidebar"
    >
      <div class="logo" :class="{ collapse: isCollapse }">
        <div class="logo-icon">道</div>
        <span v-show="!isCollapse" class="logo-text">AI协同中台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="transparent"
        text-color="#cbd5e1"
        active-text-color="#e8734a"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="m in menus" :key="m.index" :index="m.index">
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ m.title }}</template>
        </el-menu-item>
      </el-menu>

      <div v-show="!isCollapse" class="sidebar-footer">
        <el-icon><Monitor /></el-icon>
        <span>v1.0.0 Demo</span>
      </div>
    </el-aside>

    <!-- 侧边栏 - 移动端抽屉 -->
    <el-drawer
      v-if="isMobile"
      v-model="drawerVisible"
      direction="ltr"
      :with-header="false"
      size="220px"
    >
      <div class="sidebar sidebar-mobile">
        <div class="logo">
          <div class="logo-icon">道</div>
          <span class="logo-text">AI协同中台</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          background-color="transparent"
          text-color="#cbd5e1"
          active-text-color="#e8734a"
          @select="handleMenuSelect"
        >
          <el-menu-item v-for="m in menus" :key="m.index" :index="m.index">
            <el-icon><component :is="m.icon" /></el-icon>
            <template #title>{{ m.title }}</template>
          </el-menu-item>
        </el-menu>
      </div>
    </el-drawer>

    <!-- 右侧主体 -->
    <el-container class="main-container">
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            text
            class="collapse-btn"
            @click="toggleSidebar"
          >
            <el-icon :size="20">
              <Fold v-if="!isCollapse && !isMobile" />
              <Expand v-else />
            </el-icon>
          </el-button>

          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item
              v-for="(item, i) in breadcrumbItems"
              :key="i"
              :to="item.path ? { path: item.path } : undefined"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <span class="page-title">{{ pageTitle }}</span>
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ userStore.displayName?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100%;
}

.sidebar {
  height: 100%;
  background: linear-gradient(180deg, #1a3a5c 0%, #0f2540 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.logo.collapse {
  justify-content: center;
  padding: 0;
}
.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #e8734a, #c75930);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  flex-shrink: 0;
}
.logo-text {
  margin-left: 10px;
  white-space: nowrap;
}

.sidebar :deep(.el-menu) {
  border-right: none;
  padding: 8px;
  flex: 1;
}
.sidebar :deep(.el-menu-item) {
  border-radius: 6px;
  margin: 4px 0;
  height: 44px;
  line-height: 44px;
}
.sidebar :deep(.el-menu-item.is-active) {
  background: rgba(232, 115, 74, 0.15) !important;
  color: #e8734a !important;
}
.sidebar :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.06) !important;
}

.sidebar-footer {
  padding: 12px 18px;
  font-size: 12px;
  color: rgba(203, 213, 225, 0.6);
  display: flex;
  align-items: center;
  gap: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-mobile {
  height: 100vh;
}

.main-container {
  height: 100%;
  overflow: hidden;
}

.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  padding: 6px;
  color: var(--text-regular);
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 14px;
  color: var(--text-secondary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.user-info:hover {
  background: var(--bg-page);
}
.avatar {
  background: linear-gradient(135deg, #1a3a5c, #4a7bb0);
  color: #fff;
  font-weight: 600;
}
.user-name {
  font-size: 14px;
  color: var(--text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  background: var(--bg-page);
  padding: 0;
  overflow-y: auto;
  height: calc(100% - 60px);
}

@media (max-width: 768px) {
  .header {
    padding: 0 12px;
  }
  .page-title,
  .user-name {
    display: none;
  }
  .breadcrumb {
    font-size: 13px;
  }
}
</style>

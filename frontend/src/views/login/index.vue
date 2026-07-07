<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, ChatDotRound, Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive({
  username: 'admin',
  password: 'admin123'
})

const loading = ref(false)
const weComLoading = ref(false)
const formRef = ref()

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login({
        username: loginForm.username,
        password: loginForm.password
      })
      ElMessage.success('登录成功')
      const redirect = (route.query.redirect as string) || '/todo'
      router.push(redirect)
    } catch (e: any) {
      ElMessage.error(e?.message || '登录失败，请检查账号密码')
    } finally {
      loading.value = false
    }
  })
}

function handleWeComLogin() {
  weComLoading.value = true
  setTimeout(() => {
    weComLoading.value = false
    ElMessage.info('请使用企业微信扫码登录')
  }, 600)
}

function handleEnter(e: KeyboardEvent) {
  if (e.key === 'Enter') handleLogin()
}

onMounted(() => {
  window.addEventListener('keydown', handleEnter)
})
</script>

<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-decorations">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="grid-bg"></div>
    </div>

    <!-- 顶部品牌 -->
    <div class="brand-bar">
      <div class="brand-logo">
        <div class="brand-icon">道</div>
        <div class="brand-text">
          <div class="brand-name">道一云AI协同中台</div>
          <div class="brand-sub">JINMAILANG AI COLLABORATION PLATFORM</div>
        </div>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <h2>欢迎登录</h2>
          <p>AI驱动 · 智能协同 · 高效决策</p>
        </div>

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          size="large"
          @submit.prevent
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox>记住账号</el-checkbox>
            <a class="forget-link">忘记密码？</a>
          </div>

          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            <el-icon v-if="!loading"><User /></el-icon>
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>

          <el-divider>其他登录方式</el-divider>

          <el-button
            class="wecom-btn"
            :loading="weComLoading"
            @click="handleWeComLogin"
          >
            <el-icon v-if="!weComLoading"><ChatDotRound /></el-icon>
            <el-icon v-else><Loading /></el-icon>
            企业微信登录
          </el-button>

          <div class="demo-tip">
            <span>演示账号：admin / admin123</span>
          </div>
        </el-form>
      </div>

      <!-- 右侧介绍 -->
      <div class="intro-panel">
        <div class="intro-content">
          <div class="ai-badge">
            <span class="ai-tag">AI POWERED</span>
          </div>
          <h1 class="intro-title">
            重塑企业<br />
            <span class="gradient-text">协同审批新范式</span>
          </h1>
          <p class="intro-desc">
            融合大模型能力，覆盖待办聚合、智能审批、AI风控、
            智能报销与合同管理全流程，让组织决策更高效。
          </p>

          <ul class="feature-list">
            <li>
              <i class="dot dot-1"></i>
              <div>
                <strong>统一待办中心</strong>
                <span>多系统审批事项一站式处理</span>
              </div>
            </li>
            <li>
              <i class="dot dot-2"></i>
              <div>
                <strong>AI智能审核</strong>
                <span>风险自动识别，意见秒级生成</span>
              </div>
            </li>
            <li>
              <i class="dot dot-3"></i>
              <div>
                <strong>驾驶舱洞察</strong>
                <span>实时数据可视化决策</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <div class="footer">
      © 2025 道一云集团 · AI协同中台 Demo · 仅供演示使用
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f2540 0%, #1a3a5c 40%, #2c5485 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 背景装饰 */
.bg-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
}
.circle-1 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, #e8734a, transparent 70%);
  top: -120px;
  right: -80px;
}
.circle-2 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, #4a7bb0, transparent 70%);
  bottom: -100px;
  left: -80px;
}
.circle-3 {
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, #5b8ff9, transparent 70%);
  top: 40%;
  left: 40%;
  opacity: 0.25;
}
.grid-bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
}

/* 顶部品牌栏 */
.brand-bar {
  position: relative;
  z-index: 2;
  padding: 28px 48px;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
}
.brand-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #e8734a, #c75930);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(232, 115, 74, 0.4);
}
.brand-name {
  font-size: 20px;
  font-weight: 600;
}
.brand-sub {
  font-size: 11px;
  opacity: 0.6;
  letter-spacing: 1px;
}

/* 主体 */
.login-wrapper {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 48px;
  gap: 60px;
}

.login-card {
  width: 400px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: cardIn 0.6s ease;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}
.login-header h2 {
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 6px;
  font-weight: 600;
}
.login-header p {
  font-size: 13px;
  color: var(--text-secondary);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 13px;
}
.forget-link {
  color: var(--primary);
  cursor: pointer;
}
.forget-link:hover {
  color: var(--accent);
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(135deg, #1a3a5c 0%, #2c5485 100%);
  border: none;
  letter-spacing: 4px;
}
.login-btn:hover {
  background: linear-gradient(135deg, #2c5485 0%, #4a7bb0 100%);
}

.wecom-btn {
  width: 100%;
  height: 42px;
  background: #07c160;
  color: #fff;
  border: none;
  font-size: 14px;
}
.wecom-btn:hover {
  background: #06ad56;
  color: #fff;
}

.demo-tip {
  margin-top: 16px;
  padding: 8px 12px;
  background: #fff7f3;
  color: var(--accent);
  font-size: 12px;
  text-align: center;
  border-radius: 6px;
  border: 1px dashed var(--accent);
}

/* 右侧介绍 */
.intro-panel {
  width: 480px;
  color: #fff;
}
.intro-content {
  max-width: 420px;
}
.ai-badge {
  margin-bottom: 20px;
}
.intro-title {
  font-size: 38px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 18px;
}
.gradient-text {
  background: linear-gradient(135deg, #e8734a, #f5a623);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.intro-desc {
  font-size: 15px;
  line-height: 1.8;
  opacity: 0.85;
  margin-bottom: 32px;
}
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.feature-list .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}
.dot-1 {
  background: #e8734a;
  box-shadow: 0 0 12px #e8734a;
}
.dot-2 {
  background: #5b8ff9;
  box-shadow: 0 0 12px #5b8ff9;
}
.dot-3 {
  background: #2bb673;
  box-shadow: 0 0 12px #2bb673;
}
.feature-list strong {
  display: block;
  font-size: 15px;
  margin-bottom: 2px;
}
.feature-list span {
  font-size: 13px;
  opacity: 0.7;
}

.footer {
  position: relative;
  z-index: 2;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  padding: 20px;
}

@media (max-width: 1024px) {
  .intro-panel {
    display: none;
  }
}
@media (max-width: 480px) {
  .brand-bar {
    padding: 20px;
  }
  .login-wrapper {
    padding: 20px;
  }
  .login-card {
    width: 100%;
    padding: 24px;
  }
  .intro-title {
    font-size: 28px;
  }
}
</style>

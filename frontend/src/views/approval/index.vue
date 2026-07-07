<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Document,
  Loading,
  MagicStick,
  Warning,
  Check,
  Close,
  RefreshLeft,
  Share,
  Paperclip,
  Clock,
  ChatLineSquare
} from '@element-plus/icons-vue'
import {
  getApprovalDetail,
  approve as approveApi,
  getHistory,
  getOpinionTemplates,
  type ApprovalDetail,
  type ApprovalHistoryItem,
  type OpinionTemplate
} from '@/api/approval'
import { auditSummary, auditRisk, auditOpinion } from '@/api/ai'

const route = useRoute()
const router = useRouter()

const todoId = computed(() => route.params.id as string)

// ============ 详情 ============
const detail = ref<ApprovalDetail | null>(null)
const loading = ref(true)

async function fetchDetail() {
  loading.value = true
  try {
    const res: any = await getApprovalDetail(todoId.value)
    detail.value = res?.data ?? res
    // 触发AI分析
    runAiAnalysis()
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

// ============ AI 摘要 ============
const aiSummary = ref({
  loading: false,
  text: '',
  keyPoints: [] as string[]
})
async function fetchAiSummary() {
  aiSummary.value.loading = true
  aiSummary.value.text = ''
  aiSummary.value.keyPoints = []
  try {
    const content =
      detail.value?.summary ||
      detail.value?.title + ' ' + JSON.stringify(detail.value?.fields || {})
    const res: any = await auditSummary(content)
    const data = res?.data ?? res
    // 打字机效果
    await typeWriter(data.summary || data.text || '', (t) => {
      aiSummary.value.text = t
    })
    aiSummary.value.keyPoints = data.keyPoints || []
  } catch (e) {
    aiSummary.value.text = 'AI摘要生成失败，请稍后重试'
  } finally {
    aiSummary.value.loading = false
  }
}

// ============ AI 风险 ============
const aiRisk = ref({
  loading: false,
  level: '' as 'high' | 'medium' | 'low' | '',
  risks: [] as Array<{ level: string; type: string; description: string; suggestion?: string }>,
  conclusion: ''
})
async function fetchAiRisk() {
  aiRisk.value.loading = true
  try {
    const content =
      detail.value?.summary ||
      detail.value?.title + ' ' + JSON.stringify(detail.value?.fields || {})
    const res: any = await auditRisk(content)
    const data = res?.data ?? res
    aiRisk.value.level = data.riskLevel
    aiRisk.value.risks = data.risks || []
    aiRisk.value.conclusion = data.conclusion || ''
  } catch (e) {
    // ignore
  } finally {
    aiRisk.value.loading = false
  }
}

// ============ AI 意见 ============
const aiOpinionData = ref({
  loading: false,
  opinion: '',
  conclusion: '' as 'approve' | 'reject' | 'return' | ''
})
async function fetchAiOpinion() {
  aiOpinionData.value.loading = true
  aiOpinionData.value.opinion = ''
  try {
    const content =
      detail.value?.summary ||
      detail.value?.title + ' ' + JSON.stringify(detail.value?.fields || {})
    const res: any = await auditOpinion(content)
    const data = res?.data ?? res
    await typeWriter(data.opinion || '', (t) => {
      aiOpinionData.value.opinion = t
    })
    aiOpinionData.value.conclusion = data.conclusion || ''
  } catch (e) {
    // ignore
  } finally {
    aiOpinionData.value.loading = false
  }
}

// ============ 打字机 ============
function typeWriter(text: string, setter: (t: string) => void) {
  return new Promise<void>((resolve) => {
    let i = 0
    setter('')
    const timer = setInterval(() => {
      if (i >= text.length) {
        clearInterval(timer)
        setter(text)
        resolve()
        return
      }
      i += 2
      setter(text.slice(0, i))
    }, 30)
  })
}

// ============ 触发 AI 分析 ============
async function runAiAnalysis() {
  await fetchAiSummary()
  await fetchAiRisk()
  await fetchAiOpinion()
}

// ============ 审批历史 ============
const history = ref<ApprovalHistoryItem[]>([])
const historyLoading = ref(false)
async function fetchHistory() {
  historyLoading.value = true
  try {
    const res: any = await getHistory(todoId.value)
    history.value = res?.data ?? res ?? []
  } catch (e) {
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

// ============ 意见模板 ============
const templates = ref<OpinionTemplate[]>([])
async function fetchTemplates() {
  try {
    const res: any = await getOpinionTemplates()
    templates.value = res?.data ?? res ?? []
  } catch (e) {
    templates.value = []
  }
}

// ============ 审批操作 ============
const opinion = ref('')
const submitting = ref(false)

function applyTemplate(content: string) {
  opinion.value = content
}

async function handleApprove(action: 'approve' | 'reject' | 'return' | 'transfer') {
  if (action !== 'approve' && !opinion.value.trim()) {
    ElMessage.warning('请填写审批意见')
    return
  }
  submitting.value = true
  try {
    await approveApi(todoId.value, {
      action,
      opinion: opinion.value
    })
    ElMessage.success('审批操作成功')
    setTimeout(() => router.push('/todo'), 800)
  } catch (e) {
    // ignore
  } finally {
    submitting.value = false
  }
}

function useAiOpinion() {
  opinion.value = aiOpinionData.value.opinion
  ElMessage.success('AI意见已填入')
}

// ============ 风险等级颜色 ============
function riskLevelColor(level: string) {
  return { high: 'danger', medium: 'warning', low: 'success' }[level] || 'info'
}
function riskLevelText(level: string) {
  return { high: '高风险', medium: '中风险', low: '低风险' }[level] || '未知'
}

// ============ 时间线 ============
function actionTagType(action: string) {
  return (
    {
      approve: 'success',
      reject: 'danger',
      return: 'warning',
      submit: 'primary',
      transfer: 'info'
    } as any
  )[action] || 'info'
}

// ============ 初始化 ============
onMounted(() => {
  fetchDetail()
  fetchHistory()
  fetchTemplates()
})
</script>

<template>
  <div class="page-container approval-page" v-loading="loading">
    <!-- 顶部 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/todo')">返回</el-button>
      <div class="header-title">
        <span class="title-text">{{ detail?.title || '审批详情' }}</span>
        <el-tag
          v-if="detail?.status"
          :type="({
            pending: 'warning',
            approved: 'success',
            rejected: 'danger',
            processing: 'primary'
          } as any)[detail.status] || 'info'"
        >
          {{ detail.statusName || detail.status }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button :icon="MagicStick" type="warning" plain @click="runAiAnalysis" :loading="aiSummary.loading">
          重新AI分析
        </el-button>
      </div>
    </div>

    <div class="approval-content" v-if="detail">
      <!-- 左侧主区域 -->
      <div class="main-area">
        <!-- 审批单详情 -->
        <div class="card">
          <div class="card-title">
            <span><el-icon><Document /></el-icon> 审批单详情</span>
            <el-tag size="small">{{ detail.type }}</el-tag>
          </div>
          <div class="detail-grid" v-if="detail.fields?.length">
            <div
              v-for="(f, i) in detail.fields"
              :key="i"
              class="detail-item"
            >
              <span class="detail-label">{{ f.label }}</span>
              <span class="detail-value">{{ f.value }}</span>
            </div>
          </div>
          <div v-else class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">申请人</span>
              <span class="detail-value">{{ detail.applicant }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">部门</span>
              <span class="detail-value">{{ detail.department }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">提交时间</span>
              <span class="detail-value">{{ detail.submitTime }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">金额</span>
              <span class="detail-value">¥{{ detail.amount }}</span>
            </div>
          </div>
        </div>

        <!-- 附件区 -->
        <div class="card" v-if="detail.attachments?.length">
          <div class="card-title">
            <span><el-icon><Paperclip /></el-icon> 附件预览</span>
          </div>
          <div class="attachment-list">
            <div
              v-for="(file, i) in detail.attachments"
              :key="i"
              class="attachment-item"
            >
              <el-icon class="file-icon"><Document /></el-icon>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size" v-if="file.size">{{ (file.size / 1024).toFixed(1) }} KB</div>
              </div>
              <el-button text type="primary">预览</el-button>
            </div>
          </div>
        </div>

        <!-- AI 摘要 -->
        <div class="card ai-card">
          <div class="card-title">
            <span><el-icon><MagicStick /></el-icon> AI 审核摘要 <span class="ai-tag">AI</span></span>
          </div>
          <div v-if="aiSummary.loading" class="ai-loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>AI正在分析单据内容...</span>
            <div class="skeleton-line" v-for="i in 3" :key="i"></div>
          </div>
          <div v-else>
            <p class="ai-text" :class="{ 'typing-cursor': aiSummary.text }">
              {{ aiSummary.text || '点击"重新AI分析"开始分析' }}
            </p>
            <div v-if="aiSummary.keyPoints.length" class="key-points">
              <div class="kp-title">关键信息：</div>
              <ul>
                <li v-for="(p, i) in aiSummary.keyPoints" :key="i">{{ p }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 合规风险 -->
        <div class="card risk-card">
          <div class="card-title">
            <span><el-icon><Warning /></el-icon> 合规风险标注 <span class="ai-tag">AI</span></span>
            <el-tag
              v-if="aiRisk.level"
              :type="riskLevelColor(aiRisk.level) as any"
              effect="dark"
            >
              {{ riskLevelText(aiRisk.level) }}
            </el-tag>
          </div>
          <div v-if="aiRisk.loading" class="ai-loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>正在识别风险点...</span>
            <div class="skeleton-line" v-for="i in 2" :key="i"></div>
          </div>
          <div v-else-if="aiRisk.risks.length">
            <div
              v-for="(r, i) in aiRisk.risks"
              :key="i"
              class="risk-item"
              :class="`risk-${r.level}`"
            >
              <div class="risk-head">
                <el-tag :type="riskLevelColor(r.level) as any" size="small" effect="dark">
                  {{ riskLevelText(r.level) }}
                </el-tag>
                <span class="risk-type">{{ r.type }}</span>
              </div>
              <div class="risk-desc">{{ r.description }}</div>
              <div class="risk-suggestion" v-if="r.suggestion">
                <el-icon><ChatLineSquare /></el-icon>
                <span>{{ r.suggestion }}</span>
              </div>
            </div>
            <div class="risk-conclusion" v-if="aiRisk.conclusion">
              <el-icon><Warning /></el-icon>
              <span>{{ aiRisk.conclusion }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无风险数据" :image-size="60" />
        </div>

        <!-- 审批历史 -->
        <div class="card">
          <div class="card-title">
            <span><el-icon><Clock /></el-icon> 审批历史</span>
          </div>
          <div v-loading="historyLoading">
            <el-timeline v-if="history.length">
              <el-timeline-item
                v-for="(h, i) in history"
                :key="i"
                :timestamp="h.time"
                :type="actionTagType(h.action) as any"
                placement="top"
              >
                <div class="history-item">
                  <div class="history-head">
                    <span class="history-node">{{ h.nodeName }}</span>
                    <el-tag :type="actionTagType(h.action) as any" size="small">
                      {{ h.actionName || h.action }}
                    </el-tag>
                  </div>
                  <div class="history-meta">
                    操作人：{{ h.operator }}
                    <span v-if="h.operatorRole"> · {{ h.operatorRole }}</span>
                  </div>
                  <div class="history-opinion" v-if="h.opinion">
                    "{{ h.opinion }}"
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无审批历史" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 右侧操作区 -->
      <div class="side-area">
        <!-- AI 审核意见 -->
        <div class="card ai-card">
          <div class="card-title">
            <span><el-icon><MagicStick /></el-icon> AI 审核建议 <span class="ai-tag">AI</span></span>
          </div>
          <div v-if="aiOpinionData.loading" class="ai-loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>AI正在生成审核意见...</span>
            <div class="skeleton-line" v-for="i in 3" :key="i"></div>
          </div>
          <div v-else>
            <p class="ai-text" :class="{ 'typing-cursor': aiOpinionData.opinion }">
              {{ aiOpinionData.opinion || 'AI意见将在此显示' }}
            </p>
            <el-button
              v-if="aiOpinionData.opinion"
              type="primary"
              plain
              size="small"
              @click="useAiOpinion"
            >
              一键填入意见框
            </el-button>
          </div>
        </div>

        <!-- 审批操作面板 -->
        <div class="card action-card">
          <div class="card-title">
            <span><el-icon><Check /></el-icon> 审批操作</span>
          </div>

          <div class="opinion-section">
            <div class="opinion-label">
              <span>审批意见</span>
              <el-dropdown trigger="click" @command="applyTemplate">
                <el-button text type="primary" size="small">
                  常用意见 ↓
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="t in templates"
                      :key="t.id"
                      :command="t.content"
                    >
                      {{ t.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <el-input
              v-model="opinion"
              type="textarea"
              :rows="5"
              placeholder="请输入审批意见"
              maxlength="500"
              show-word-limit
            />
          </div>

          <div class="action-buttons">
            <el-button
              type="primary"
              :icon="Check"
              :loading="submitting"
              @click="handleApprove('approve')"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              :icon="Close"
              :loading="submitting"
              @click="handleApprove('reject')"
            >
              驳回
            </el-button>
            <el-button
              :icon="RefreshLeft"
              :loading="submitting"
              @click="handleApprove('return')"
            >
              退回
            </el-button>
            <el-button
              :icon="Share"
              :loading="submitting"
              @click="handleApprove('transfer')"
            >
              转交
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="!loading" description="未找到审批单" />
  </div>
</template>

<style scoped>
.approval-page {
  padding: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: var(--shadow-base);
}
.header-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
}
.title-text {
  color: var(--text-primary);
}

.approval-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  align-items: start;
}

.card {
  margin-bottom: 16px;
}

/* 详情网格 */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: var(--bg-page);
  border-radius: 6px;
}
.detail-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.detail-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

/* 附件 */
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-page);
  border-radius: 6px;
  border: 1px solid var(--border-light);
}
.file-icon {
  font-size: 24px;
  color: var(--primary);
}
.file-info {
  flex: 1;
}
.file-name {
  font-size: 14px;
  color: var(--text-primary);
}
.file-size {
  font-size: 12px;
  color: var(--text-secondary);
}

/* AI 区域 */
.ai-card {
  border-left: 3px solid var(--accent);
}
.ai-loading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}
.ai-loading .loading-icon {
  animation: rotate 1.5s linear infinite;
  color: var(--accent);
  font-size: 16px;
}
@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
.ai-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 12px;
  min-height: 40px;
}
.key-points {
  background: rgba(232, 115, 74, 0.06);
  padding: 10px 12px;
  border-radius: 6px;
}
.kp-title {
  font-size: 13px;
  color: var(--accent);
  font-weight: 600;
  margin-bottom: 6px;
}
.key-points ul {
  padding-left: 18px;
  font-size: 13px;
  color: var(--text-regular);
}
.key-points li {
  margin: 4px 0;
}

/* 风险 */
.risk-item {
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 3px solid;
}
.risk-high {
  background: rgba(233, 79, 79, 0.06);
  border-color: var(--danger);
}
.risk-medium {
  background: rgba(245, 166, 35, 0.06);
  border-color: var(--warning);
}
.risk-low {
  background: rgba(43, 182, 115, 0.06);
  border-color: var(--success);
}
.risk-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.risk-type {
  font-weight: 600;
  font-size: 13px;
}
.risk-desc {
  font-size: 13px;
  color: var(--text-regular);
  margin-bottom: 4px;
}
.risk-suggestion {
  display: flex;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
}
.risk-conclusion {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px;
  background: rgba(233, 79, 79, 0.08);
  border-radius: 6px;
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
}

/* 时间线 */
.history-item {
  font-size: 13px;
}
.history-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.history-node {
  font-weight: 600;
  color: var(--text-primary);
}
.history-meta {
  font-size: 12px;
  color: var(--text-secondary);
}
.history-opinion {
  margin-top: 4px;
  padding: 6px 10px;
  background: var(--bg-page);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-regular);
  font-style: italic;
}

/* 操作面板 */
.side-area {
  position: sticky;
  top: 16px;
}
.opinion-section {
  margin-bottom: 16px;
}
.opinion-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
}
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.action-buttons .el-button {
  margin-left: 0 !important;
}

@media (max-width: 1024px) {
  .approval-content {
    grid-template-columns: 1fr;
  }
  .side-area {
    position: static;
  }
}
@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-wrap: wrap;
  }
}
</style>

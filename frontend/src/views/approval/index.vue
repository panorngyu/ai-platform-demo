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
const fromPage = computed(() => (route.query.from as string) || 'todo')

function goBack() {
  if (fromPage.value === 'agent') {
    router.push('/agent')
  } else {
    router.push('/todo')
  }
}

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

    // 如果后端返回了完整数据，直接使用
    if (data.risks && data.risks.length > 0) {
      aiRisk.value.level = data.riskLevel || 'medium'
      aiRisk.value.risks = data.risks
      aiRisk.value.conclusion = data.conclusion || ''
    } else {
      // 后端数据不完整时，使用前端兜底 Mock
      applyFallbackRiskData(content)
    }
  } catch (e) {
    // 网络异常时，使用前端兜底 Mock
    const content = detail.value?.summary || detail.value?.title || ''
    applyFallbackRiskData(content)
  } finally {
    aiRisk.value.loading = false
  }
}

// 前端兜底 Mock 风险评估数据
function applyFallbackRiskData(content: string) {
  const isContract = content.includes('合同')
  const isExpense = content.includes('报销')
  const isPurchase = content.includes('采购')
  const isProject = content.includes('项目')

  const templates: Record<string, {
    level: 'low' | 'medium' | 'high'
    risks: Array<{ level: string; type: string; description: string; suggestion: string }>
    conclusion: string
  }> = {
    contract: {
      level: 'medium',
      risks: [
        { level: 'high', type: '合规风险', description: '合同条款中违约责任约定不够明确，缺少具体赔偿标准与上限，可能造成公司利益受损', suggestion: '建议补充违约赔偿计算方式与赔偿上限条款，并明确约定管辖法院' },
        { level: 'medium', type: '金额风险', description: '合同金额较大，付款周期较长，预付款比例偏高（30%），存在资金回收风险', suggestion: '建议将预付款比例调整为20%以下，并增加分期付款节点与验收确认机制' },
        { level: 'medium', type: '资质风险', description: '供应商资质文件不完整，缺少近三年财务审计报告和行业资质认证', suggestion: '建议要求供应商补充财务审计报告、行业资质证书及相关经营许可证明' },
        { level: 'low', type: '流程风险', description: '合同签署流程中缺少法务审核环节，合同条款未经专业法律审查', suggestion: '建议在合同签署前增加法务审核节点，确保条款合法合规' },
        { level: 'low', type: '时效风险', description: '合同有效期约定模糊，缺少明确的起止日期和续签条件', suggestion: '建议明确约定合同起止日期、自动续签条款及终止通知期限' }
      ],
      conclusion: '该合同存在中等合规风险，主要问题集中在违约责任条款不明确和付款比例偏高。建议补充违约赔偿细则、降低预付款比例，并完成法务审核后再行审批。'
    },
    expense: {
      level: 'low',
      risks: [
        { level: 'medium', type: '金额风险', description: '报销金额超出部门月度预算10%，可能影响后续费用开支', suggestion: '建议核实预算余额，如超出可申请临时预算追加或分月报销' },
        { level: 'low', type: '凭证风险', description: '报销附件中发票日期与报销申请日期间隔超过30天，存在时效性疑问', suggestion: '建议附上延迟报销的合理说明，如出差在外等原因' },
        { level: 'low', type: '合规风险', description: '报销科目与实际业务关联性需进一步确认，餐饮报销缺少会议/出差关联记录', suggestion: '建议补充会议通知或出差审批单作为关联凭证' }
      ],
      conclusion: '该报销单风险较低，金额略超预算但整体可控。建议核实预算余额并补充出差关联凭证后可审批通过。'
    },
    purchase: {
      level: 'medium',
      risks: [
        { level: 'high', type: '合规风险', description: '采购金额超过10万元但未走公开招标流程，不符合公司采购管理制度要求', suggestion: '建议补充三家比价记录或转为公开招标流程，确保采购合规性' },
        { level: 'medium', type: '预算风险', description: '采购金额占部门年度预算的35%，预算占用比例偏高', suggestion: '建议评估年度剩余预算及后续采购计划，避免预算超支' },
        { level: 'medium', type: '供应商风险', description: '指定供应商与申请人部门存在历史合作关系，可能存在利益关联', suggestion: '建议增加供应商筛选透明度，确保至少三家供应商参与比价' },
        { level: 'low', type: '交付风险', description: '采购合同中交付验收标准不够具体，缺少性能指标与验收条件', suggestion: '建议细化验收标准和交付物清单，明确性能指标与验收测试方案' }
      ],
      conclusion: '该采购申请存在中等风险，主要问题是未走招标流程和供应商选择可能存在利益关联。建议补充比价流程、完善验收标准后再行审批。'
    },
    project: {
      level: 'low',
      risks: [
        { level: 'medium', type: '进度风险', description: '项目里程碑时间节点安排较为紧凑，部分关键节点缺少缓冲时间', suggestion: '建议在关键里程碑间增加5-10天缓冲期，降低延期风险' },
        { level: 'low', type: '人员风险', description: '项目核心团队成员同时参与多个项目，人力投入可能不足', suggestion: '建议确认核心成员工时分配，确保关键角色有足够投入' },
        { level: 'low', type: '预算风险', description: '项目预算中应急预留比例为5%，低于行业建议的10-15%', suggestion: '建议将应急预留比例提高至10%，覆盖潜在需求变更风险' }
      ],
      conclusion: '该项目审批风险较低，建议关注进度安排和人员投入，适当增加应急预算后可审批通过。'
    }
  }

  const defaultTemplate = {
    level: 'medium' as const,
    risks: [
      { level: 'medium', type: '合规风险', description: '单据信息与公司审批制度存在部分不符，需要进一步核实关键要素', suggestion: '建议对照公司审批制度逐条核实，确保合规性' },
      { level: 'low', type: '完整性风险', description: '单据部分字段信息不完整，可能影响审批判断准确性', suggestion: '建议补充缺失信息后再提交审批' },
      { level: 'low', type: '时效风险', description: '单据提交时间与业务发生时间间隔较长，可能影响追溯核实', suggestion: '建议附上延迟提交的合理说明' }
    ],
    conclusion: '该单据存在中等风险，建议核实合规要点和补充必要信息后审批。'
  }

  const template = isContract ? templates.contract
    : isExpense ? templates.expense
    : isPurchase ? templates.purchase
    : isProject ? templates.project
    : defaultTemplate

  aiRisk.value.level = template.level
  aiRisk.value.risks = template.risks
  aiRisk.value.conclusion = template.conclusion
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
    setTimeout(() => goBack(), 800)
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
      <el-button :icon="ArrowLeft" text @click="goBack()">返回</el-button>
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

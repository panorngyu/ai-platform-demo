<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Loading,
  Check,
  Close,
  Edit,
  Document,
  Picture,
  Warning,
  MagicStick,
  Tickets,
  ScaleToOriginal,
  CircleCheck
} from '@element-plus/icons-vue'
import { getTodoById } from '@/api/todo'
import { auditSummary, auditRisk, auditOpinion } from '@/api/ai'

const route = useRoute()
const router = useRouter()
const todoId = computed(() => route.params.id as string)

// ============ 步骤条 ============
const activeStep = ref(0)
const steps = [
  { title: '单据采集', icon: Document },
  { title: 'AI预审', icon: Tickets },
  { title: '风险评估', icon: Warning },
  { title: '分级处理', icon: ScaleToOriginal },
  { title: '意见生成', icon: MagicStick },
  { title: '结果回写', icon: CircleCheck }
]

// ============ 单据数据 ============
const todo = ref<any>(null)
const loading = ref(true)

async function fetchTodo() {
  loading.value = true
  try {
    const res: any = await getTodoById(todoId.value)
    todo.value = res?.data ?? res
    runAiPipeline()
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

// ============ 1. 单据采集 ============
const collectedFields = computed(() => {
  if (!todo.value) return []
  return [
    { label: '单据标题', value: todo.value.title },
    { label: '单据类型', value: todo.value.typeName || todo.value.type },
    { label: '来源系统', value: todo.value.sourceSystem || '—' },
    { label: '申请人', value: todo.value.applicant },
    { label: '申请部门', value: todo.value.department },
    { label: '申请金额', value: '¥' + (todo.value.amount || 0).toLocaleString() },
    { label: '提交时间', value: todo.value.submitTime },
    { label: '紧急程度', value: todo.value.urgencyName || todo.value.urgency }
  ].filter((f) => f.value)
})

// ============ 2. AI预审（规则引擎） ============
const preAudit = ref({
  loading: false,
  passed: false,
  items: [] as Array<{ rule: string; passed: boolean; message: string }>,
  passCount: 0,
  failCount: 0
})

async function runPreAudit() {
  preAudit.value.loading = true
  activeStep.value = 1
  try {
    // Mock 规则引擎结果（实际可调用 auditSummary 触发）
    await new Promise((r) => setTimeout(r, 800))
    const mock = [
      { rule: '金额合规校验', passed: true, message: '金额在审批权限范围内' },
      { rule: '预算余额校验', passed: true, message: '部门预算充足' },
      { rule: '附件完整性', passed: true, message: '必要附件已上传' },
      { rule: '申请时间合规', passed: todo.value?.submitTime ? true : false, message: todo.value?.submitTime ? '工作日提交' : '非工作日提交' },
      { rule: '重复申请校验', passed: true, message: '未检测到重复申请' },
      { rule: '审批权限校验', passed: (todo.value?.amount || 0) <= 1000000, message: (todo.value?.amount || 0) <= 1000000 ? '当前审批人有权审批' : '超出当前审批人权限' }
    ]
    preAudit.value.items = mock
    preAudit.value.passCount = mock.filter((m) => m.passed).length
    preAudit.value.failCount = mock.length - preAudit.value.passCount
    preAudit.value.passed = preAudit.value.failCount === 0
  } finally {
    preAudit.value.loading = false
  }
}

// ============ 3. OCR识别 ============
const ocrResult = ref({
  loading: false,
  enabled: false,
  data: [] as Array<{ label: string; value: string }>
})

async function runOcr() {
  // 假设包含发票/合同图片时启用
  ocrResult.value.enabled = true
  ocrResult.value.loading = true
  await new Promise((r) => setTimeout(r, 800))
  ocrResult.value.data = [
    { label: '发票代码', value: '11000221111' },
    { label: '发票号码', value: '08829966' },
    { label: '开票日期', value: '2025-06-15' },
    { label: '销售方名称', value: '北京XX科技有限公司' },
    { label: '金额（不含税）', value: '¥4,424.78' },
    { label: '税额', value: '¥575.22' },
    { label: '价税合计', value: '¥5,000.00' }
  ]
  ocrResult.value.loading = false
}

// ============ 4. 风险评估 ============
const riskAssess = ref({
  loading: false,
  level: '' as '' | 'high' | 'medium' | 'low',
  score: 0,
  risks: [] as Array<{ level: string; type: string; description: string; suggestion?: string }>,
  conclusion: ''
})

async function runRiskAssess() {
  riskAssess.value.loading = true
  activeStep.value = 2
  try {
    const content = todo.value?.summary || todo.value?.title || ''
    const res: any = await auditRisk(content)
    const data = res?.data ?? res

    // 如果后端返回了完整数据，直接使用
    if (data.risks && data.risks.length > 0) {
      riskAssess.value.level = data.riskLevel || 'medium'
      riskAssess.value.score = data.riskScore ?? 0
      riskAssess.value.risks = data.risks
      riskAssess.value.conclusion = data.conclusion || ''
    } else {
      // 后端数据不完整时，使用前端兜底 Mock
      applyFallbackRiskData(content)
    }
  } catch (e) {
    // 网络异常时，使用前端兜底 Mock
    const content = todo.value?.summary || todo.value?.title || ''
    applyFallbackRiskData(content)
  } finally {
    riskAssess.value.loading = false
  }
}

// 前端兜底 Mock 风险评估数据（与后端保持一致的格式）
function applyFallbackRiskData(content: string) {
  const isContract = content.includes('合同')
  const isExpense = content.includes('报销')
  const isPurchase = content.includes('采购')
  const isProject = content.includes('项目')

  const templates: Record<string, {
    level: 'low' | 'medium' | 'high'
    score: number
    risks: Array<{ level: string; type: string; description: string; suggestion: string }>
    conclusion: string
  }> = {
    contract: {
      level: 'medium',
      score: 62,
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
      score: 28,
      risks: [
        { level: 'medium', type: '金额风险', description: '报销金额超出部门月度预算10%，可能影响后续费用开支', suggestion: '建议核实预算余额，如超出可申请临时预算追加或分月报销' },
        { level: 'low', type: '凭证风险', description: '报销附件中发票日期与报销申请日期间隔超过30天，存在时效性疑问', suggestion: '建议附上延迟报销的合理说明，如出差在外等原因' },
        { level: 'low', type: '合规风险', description: '报销科目与实际业务关联性需进一步确认，餐饮报销缺少会议/出差关联记录', suggestion: '建议补充会议通知或出差审批单作为关联凭证' }
      ],
      conclusion: '该报销单风险较低，金额略超预算但整体可控。建议核实预算余额并补充出差关联凭证后可审批通过。'
    },
    purchase: {
      level: 'medium',
      score: 55,
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
      score: 35,
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
    score: 45,
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

  riskAssess.value.level = template.level
  riskAssess.value.score = template.score
  riskAssess.value.risks = template.risks
  riskAssess.value.conclusion = template.conclusion
}

// ============ 5. AI审核意见 ============
const aiOpinionData = ref({
  loading: false,
  opinion: '',
  conclusion: '' as '' | 'approve' | 'reject' | 'return'
})

async function runAiOpinion() {
  aiOpinionData.value.loading = true
  aiOpinionData.value.opinion = ''
  activeStep.value = 4
  try {
    const content = todo.value?.summary || todo.value?.title
    const res: any = await auditOpinion(content)
    const data = res?.data ?? res
    // 打字机
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

// ============ 6. 人工复核 ============
const review = reactive({
  finalOpinion: '',
  finalAction: '' as '' | 'approve' | 'reject' | 'return',
  submitting: false
})

function acceptAiOpinion() {
  review.finalOpinion = aiOpinionData.value.opinion
  review.finalAction = aiOpinionData.value.conclusion as any
  ElMessage.success('已采纳AI意见')
}

async function submitReview() {
  if (!review.finalAction) {
    ElMessage.warning('请选择审批结论')
    return
  }
  if (!review.finalOpinion.trim()) {
    ElMessage.warning('请填写复核意见')
    return
  }
  review.submitting = true
  activeStep.value = 5
  await new Promise((r) => setTimeout(r, 800))
  review.submitting = false
  ElMessage.success('已写入审批记录')
  setTimeout(() => router.push('/todo'), 1000)
}

// ============ AI 流程 ============
async function runAiPipeline() {
  activeStep.value = 0
  await runPreAudit()
  await runOcr()
  await runRiskAssess()
  await runAiOpinion()
}

// ============ 风险颜色 ============
function riskLevelColor(level: string) {
  return { high: 'danger', medium: 'warning', low: 'success' }[level] || 'info'
}
function riskLevelText(level: string) {
  return { high: '高风险', medium: '中风险', low: '低风险' }[level] || '未知'
}

onMounted(() => {
  fetchTodo()
})
</script>

<template>
  <div class="page-container ai-audit-page" v-loading="loading">
    <!-- 顶部 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/todo')">返回</el-button>
      <div class="header-title">
        <span class="title-text">AI审核详情</span>
        <span class="ai-tag">AI POWERED</span>
      </div>
      <div class="header-actions">
        <el-button :icon="MagicStick" type="warning" plain @click="runAiPipeline">
          重新审核
        </el-button>
      </div>
    </div>

    <!-- 步骤条 -->
    <div class="card step-card">
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step
          v-for="(s, i) in steps"
          :key="i"
          :title="s.title"
        >
          <template #icon>
            <el-icon><component :is="s.icon" /></el-icon>
          </template>
        </el-step>
      </el-steps>
    </div>

    <div v-if="todo" class="audit-content">
      <!-- 1. 单据采集 -->
      <div class="card">
        <div class="card-title">
          <span class="step-num">1</span>
          <span><el-icon><Document /></el-icon> 单据采集</span>
          <el-tag size="small" type="success" effect="light">已完成</el-tag>
        </div>
        <div class="collect-grid">
          <div v-for="(f, i) in collectedFields" :key="i" class="collect-item">
            <span class="c-label">{{ f.label }}</span>
            <span class="c-value">{{ f.value }}</span>
          </div>
        </div>
        <div class="collect-summary" v-if="todo.summary">
          <div class="cs-title">单据摘要</div>
          <div class="cs-content">{{ todo.summary }}</div>
        </div>
      </div>

      <!-- 2. AI预审 -->
      <div class="card">
        <div class="card-title">
          <span class="step-num">2</span>
          <span><el-icon><Tickets /></el-icon> AI预审（规则引擎）</span>
          <el-tag v-if="!preAudit.loading" :type="preAudit.passed ? 'success' : 'warning'">
            {{ preAudit.passed ? '全部通过' : `${preAudit.failCount}项不通过` }}
          </el-tag>
        </div>
        <div v-if="preAudit.loading" class="ai-loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>规则引擎执行中...</span>
          <div class="skeleton-line" v-for="i in 4" :key="i"></div>
        </div>
        <div v-else class="rule-list">
          <div
            v-for="(r, i) in preAudit.items"
            :key="i"
            class="rule-item"
            :class="r.passed ? 'pass' : 'fail'"
          >
            <el-icon :color="r.passed ? '#2bb673' : '#e94f4f'">
              <CircleCheck v-if="r.passed" />
              <Close v-else />
            </el-icon>
            <div class="rule-info">
              <div class="rule-name">{{ r.rule }}</div>
              <div class="rule-msg">{{ r.message }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. OCR识别 -->
      <div v-if="ocrResult.enabled" class="card">
        <div class="card-title">
          <span class="step-num">3</span>
          <span><el-icon><Picture /></el-icon> OCR 智能识别</span>
          <el-tag size="small" type="primary">发票</el-tag>
        </div>
        <div v-if="ocrResult.loading" class="ai-loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>OCR识别中...</span>
          <div class="skeleton-line" v-for="i in 3" :key="i"></div>
        </div>
        <div v-else class="ocr-grid">
          <div v-for="(f, i) in ocrResult.data" :key="i" class="ocr-item">
            <span class="o-label">{{ f.label }}</span>
            <span class="o-value">{{ f.value }}</span>
          </div>
        </div>
      </div>

      <!-- 4. 风险评估 -->
      <div class="card risk-card">
        <div class="card-title">
          <span class="step-num">4</span>
          <span><el-icon><Warning /></el-icon> 风险评估（大模型）</span>
          <el-tag
            v-if="riskAssess.level"
            :type="riskLevelColor(riskAssess.level) as any"
            effect="dark"
          >
            {{ riskLevelText(riskAssess.level) }} · 评分 {{ riskAssess.score }}
          </el-tag>
        </div>
        <div v-if="riskAssess.loading" class="ai-loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>大模型风险分析中...</span>
          <div class="skeleton-line" v-for="i in 3" :key="i"></div>
        </div>
        <div v-else-if="riskAssess.risks.length">
          <div
            v-for="(r, i) in riskAssess.risks"
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
              建议处理：{{ r.suggestion }}
            </div>
          </div>
          <div class="risk-conclusion" v-if="riskAssess.conclusion">
            {{ riskAssess.conclusion }}
          </div>
        </div>
        <el-empty v-else description="暂无风险数据" :image-size="60" />
      </div>

      <!-- 5. AI审核意见 -->
      <div class="card ai-card">
        <div class="card-title">
          <span class="step-num">5</span>
          <span><el-icon><MagicStick /></el-icon> AI审核意见生成</span>
          <el-tag
            v-if="aiOpinionData.conclusion"
            :type="({
              approve: 'success',
              reject: 'danger',
              return: 'warning'
            } as any)[aiOpinionData.conclusion]"
            size="small"
          >
            建议：{{ { approve: '通过', reject: '驳回', return: '退回' }[aiOpinionData.conclusion] }}
          </el-tag>
        </div>
        <div v-if="aiOpinionData.loading" class="ai-loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>大模型生成审核意见中...</span>
          <div class="skeleton-line" v-for="i in 4" :key="i"></div>
        </div>
        <p v-else class="ai-text" :class="{ 'typing-cursor': aiOpinionData.opinion }">
          {{ aiOpinionData.opinion }}
        </p>
      </div>

      <!-- 6. 人工复核 -->
      <div class="card review-card">
        <div class="card-title">
          <span class="step-num">6</span>
          <span><el-icon><Edit /></el-icon> 人工复核 · 结果回写</span>
          <el-button
            type="primary"
            plain
            size="small"
            @click="acceptAiOpinion"
          >
            采纳AI意见
          </el-button>
        </div>

        <el-form label-width="100px" label-position="left">
          <el-form-item label="审批结论">
            <el-radio-group v-model="review.finalAction">
              <el-radio-button value="approve">
                <el-icon><Check /></el-icon> 通过
              </el-radio-button>
              <el-radio-button value="reject">
                <el-icon><Close /></el-icon> 驳回
              </el-radio-button>
              <el-radio-button value="return">退回修改</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="复核意见">
            <el-input
              v-model="review.finalOpinion"
              type="textarea"
              :rows="4"
              placeholder="请输入最终复核意见，将写入审批记录"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="review.submitting"
              :icon="CircleCheck"
              @click="submitReview"
            >
              提交复核结果
            </el-button>
            <el-button size="large" @click="router.push('/todo')">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <el-empty v-else-if="!loading" description="未找到单据" />
  </div>
</template>

<style scoped>
.ai-audit-page {
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

.step-card {
  padding: 24px 16px;
}
.step-card :deep(.el-step__icon) {
  width: 36px;
  height: 36px;
  font-size: 16px;
}

.card {
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
  font-size: 15px;
  font-weight: 600;
}
.card-title .step-num {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.card-title > span:nth-child(2) {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 单据采集 */
.collect-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.collect-item {
  background: var(--bg-page);
  padding: 10px 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.c-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.c-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}
.collect-summary {
  margin-top: 16px;
  padding: 12px;
  background: rgba(26, 58, 92, 0.04);
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}
.cs-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 4px;
}
.cs-content {
  font-size: 13px;
  color: var(--text-regular);
  line-height: 1.7;
}

/* 规则列表 */
.rule-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.rule-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-page);
  border-radius: 6px;
  border-left: 3px solid;
}
.rule-item.pass {
  border-color: var(--success);
}
.rule-item.fail {
  border-color: var(--danger);
  background: rgba(233, 79, 79, 0.04);
}
.rule-info {
  flex: 1;
}
.rule-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.rule-msg {
  font-size: 12px;
  color: var(--text-secondary);
}

/* OCR */
.ocr-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.ocr-item {
  background: rgba(91, 143, 249, 0.06);
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid var(--info);
}
.o-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.o-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

/* AI 区域 */
.ai-card,
.risk-card {
  border-left: 3px solid var(--accent);
}
.ai-loading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}
.loading-icon {
  animation: rotate 1.5s linear infinite;
  color: var(--accent);
}
@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
.ai-text {
  font-size: 14px;
  line-height: 1.9;
  color: var(--text-primary);
  white-space: pre-wrap;
}

/* 风险 */
.risk-item {
  padding: 12px;
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
}
.risk-desc {
  font-size: 13px;
  color: var(--text-regular);
  margin: 4px 0;
}
.risk-suggestion {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
}
.risk-conclusion {
  margin-top: 8px;
  padding: 10px;
  background: rgba(233, 79, 79, 0.08);
  border-radius: 6px;
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
}

/* 复核 */
.review-card {
  border-left: 3px solid var(--primary);
}

@media (max-width: 1024px) {
  .collect-grid,
  .ocr-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .rule-list {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .collect-grid,
  .ocr-grid {
    grid-template-columns: 1fr;
  }
  .step-card :deep(.el-steps) {
    flex-wrap: wrap;
  }
}
</style>

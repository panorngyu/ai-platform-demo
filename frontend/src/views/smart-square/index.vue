<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Delete,
  Promotion,
  Wallet,
  Files,
  Clock,
  Opportunity,
  Check,
  Close,
  Document,
  Connection
} from '@element-plus/icons-vue'
import {
  identifyProcess,
  fillProcessForm,
  type ProcessIdentifyResult,
  type FormField,
  type FormFillResult
} from '@/api/smartSquare'

/* ============ 响应式状态 ============ */
const inputText = ref('')
const sending = ref(false)
const step = ref<'input' | 'identify' | 'fill' | 'confirm'>('input')
const identifiedProcess = ref<ProcessIdentifyResult | null>(null)
const selectedType = ref('')
const formFields = ref<FormField[]>([])
const formTips = ref<string[]>([])
const historyList = ref<Array<{ id: number; type: string; name: string; time: string; status: string }>>([])
const chatAreaRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<any>(null)

// 表单数据（双向绑定）
const formData = reactive<Record<string, string>>({})

/* ============ 可选系统列表 ============ */
interface TargetSystem {
  id: number
  name: string
  code: string
  description: string
  status: string
  processTypes: string[]  // 该系统支持的流程类型
}

const systems = ref<TargetSystem[]>([
  { id: 1, name: 'OA审批系统', code: 'oa', description: '企业OA办公审批平台', status: 'running', processTypes: ['expense', 'leave', 'travel'] },
  { id: 2, name: '合同管理系统', code: 'contract', description: '合同全生命周期管理', status: 'running', processTypes: ['contract'] },
  { id: 3, name: '采购管理系统', code: 'purchase', description: '采购申请与供应商管理', status: 'running', processTypes: ['purchase'] },
  { id: 4, name: '项目管理系统', code: 'project', description: '项目立项与进度管控', status: 'running', processTypes: ['project'] },
  { id: 5, name: 'ERP系统', code: 'erp', description: '企业资源计划综合平台', status: 'running', processTypes: ['expense', 'purchase', 'project'] },
  { id: 6, name: '财务系统', code: 'finance', description: '财务报销与预算管理', status: 'stopped', processTypes: ['expense'] }
])

const selectedSystemId = ref<number | undefined>(undefined)

function currentSystemName() {
  if (!selectedSystemId.value) return 'AI自动匹配'
  return systems.value.find(s => s.id === selectedSystemId.value)?.name || 'AI自动匹配'
}

function systemStatusType(s?: string) {
  if (s === 'running') return 'success'
  if (s === 'error') return 'danger'
  if (s === 'stopped') return 'info'
  return 'success'
}

/* ============ 快捷发起 ============ */
const quickActions = [
  '我要报销出差费用',
  '发起合同审批',
  '申请采购办公设备',
  '我要请假',
  '申请出差',
  '发起项目立项'
]

/* ============ 流程图标映射 ============ */
const iconMap: Record<string, any> = {
  Wallet,
  Files,
  ShoppingCart: Document,
  Flag: Opportunity,
  Clock,
  Position: Opportunity,
  Timer: Clock,
  QuestionFilled: Opportunity
}

function getIcon(iconName: string) {
  return iconMap[iconName] || Opportunity
}

/* ============ 本地兜底 Mock 数据 ============ */
const fallbackProcessTypes: Array<{ type: string; name: string; description: string; icon: string; confidence: number }> = [
  { type: 'expense', name: '报销审批', description: '费用报销申请，支持餐饮、交通、住宿、办公等类型', icon: 'Wallet', confidence: 92 },
  { type: 'contract', name: '合同审批', description: '合同签署审批，支持采购合同、服务合同、租赁合同等', icon: 'Files', confidence: 88 },
  { type: 'purchase', name: '采购审批', description: '物资/服务采购申请，需走招标或比价流程', icon: 'ShoppingCart', confidence: 85 },
  { type: 'project', name: '项目立项审批', description: '新项目立项申请，含预算、人员、计划等要素', icon: 'Flag', confidence: 80 },
  { type: 'leave', name: '请假审批', description: '员工请假申请，支持年假、病假、事假等类型', icon: 'Clock', confidence: 90 },
  { type: 'travel', name: '出差审批', description: '出差申请，含目的地、时间、预算等要素', icon: 'Position', confidence: 87 }
]

function localIdentifyProcess(userInput: string): ProcessIdentifyResult {
  const keywords: Record<string, string[]> = {
    expense: ['报销', '费用', '花销'],
    contract: ['合同', '签约', '协议'],
    purchase: ['采购', '购买', '买东西'],
    project: ['项目', '立项'],
    leave: ['请假', '休假', '事假', '病假', '年假'],
    travel: ['出差', '赴']
  }
  let identifiedType = ''
  for (const [type, words] of Object.entries(keywords)) {
    if (words.some(w => userInput.includes(w))) {
      identifiedType = type
      break
    }
  }
  const matchedProcess = fallbackProcessTypes.find(p => p.type === identifiedType)
  return {
    identified: !!matchedProcess,
    process: matchedProcess || { type: 'unknown', name: '未知流程', description: '未能识别具体流程类型，请手动选择', icon: 'QuestionFilled', confidence: 30 },
    availableTypes: fallbackProcessTypes,
    mock: true
  }
}

function localFillProcessForm(processType: string, userInput: string): FormFillResult {
  const daysMatch = userInput.match(/(\d+)\s*天/)
  const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(?:元|块|万)/)

  const formTemplates: Record<string, { fields: FormField[]; tips: string[] }> = {
    expense: {
      fields: [
        { key: 'type', label: '报销类型', type: 'select', value: '其他', required: true, options: ['餐饮', '交通', '住宿', '办公', '会议', '其他'] },
        { key: 'amount', label: '报销金额(元)', type: 'number', value: amountMatch ? amountMatch[1] : '', required: true },
        { key: 'date', label: '费用发生日期', type: 'date', value: new Date().toISOString().split('T')[0], required: true },
        { key: 'department', label: '所属部门', type: 'select', value: '信息技术部', required: true, options: ['信息技术部', '财务部', '人力资源部', '市场部', '运营部'] },
        { key: 'description', label: '报销说明', type: 'textarea', value: userInput, required: true }
      ],
      tips: ['请确保报销金额与票据一致', '餐饮报销请附上会议通知或出差记录']
    },
    contract: {
      fields: [
        { key: 'contractType', label: '合同类型', type: 'select', value: '其他合同', required: true, options: ['采购合同', '服务合同', '租赁合同', '劳动合同', '其他'] },
        { key: 'partyA', label: '甲方', type: 'text', value: '道一云食品有限公司', required: true },
        { key: 'partyB', label: '乙方', type: 'text', value: '', required: true },
        { key: 'amount', label: '合同金额(元)', type: 'number', value: amountMatch ? amountMatch[1] : '', required: true },
        { key: 'startDate', label: '合同开始日期', type: 'date', value: new Date().toISOString().split('T')[0], required: true },
        { key: 'endDate', label: '合同结束日期', type: 'date', value: '', required: true },
        { key: 'description', label: '合同摘要', type: 'textarea', value: userInput, required: false }
      ],
      tips: ['合同金额超过10万元需走招标流程', '建议先经法务审核再提交']
    },
    purchase: {
      fields: [
        { key: 'itemName', label: '采购项目名称', type: 'text', value: '', required: true },
        { key: 'amount', label: '采购金额(元)', type: 'number', value: amountMatch ? amountMatch[1] : '', required: true },
        { key: 'supplier', label: '供应商', type: 'text', value: '', required: true },
        { key: 'quantity', label: '采购数量', type: 'number', value: '1', required: true },
        { key: 'department', label: '申请部门', type: 'select', value: '信息技术部', required: true, options: ['信息技术部', '财务部', '人力资源部', '市场部', '运营部'] },
        { key: 'reason', label: '采购原因', type: 'textarea', value: userInput, required: true }
      ],
      tips: ['采购金额超过5万元需三家比价', '请确认预算余额充足']
    },
    project: {
      fields: [
        { key: 'projectName', label: '项目名称', type: 'text', value: '', required: true },
        { key: 'budget', label: '项目预算(元)', type: 'number', value: amountMatch ? amountMatch[1] : '', required: true },
        { key: 'manager', label: '项目负责人', type: 'text', value: '', required: true },
        { key: 'startDate', label: '项目开始日期', type: 'date', value: new Date().toISOString().split('T')[0], required: true },
        { key: 'description', label: '项目说明', type: 'textarea', value: userInput, required: true }
      ],
      tips: ['项目立项需经过部门总监审批', '请确保预算已获批准']
    },
    leave: {
      fields: [
        { key: 'leaveType', label: '请假类型', type: 'select', value: userInput.includes('病') ? '病假' : userInput.includes('年') ? '年假' : '事假', required: true, options: ['年假', '病假', '事假', '婚假', '产假', '丧假'] },
        { key: 'startDate', label: '开始日期', type: 'date', value: new Date().toISOString().split('T')[0], required: true },
        { key: 'endDate', label: '结束日期', type: 'date', value: '', required: true },
        { key: 'days', label: '请假天数', type: 'number', value: daysMatch ? daysMatch[1] : '1', required: true },
        { key: 'reason', label: '请假原因', type: 'textarea', value: userInput, required: true }
      ],
      tips: ['年假需提前3天申请', '病假需附医院证明', '连续请假超过3天需部门总监审批']
    },
    travel: {
      fields: [
        { key: 'destination', label: '出差目的地', type: 'text', value: '', required: true },
        { key: 'startDate', label: '出发日期', type: 'date', value: new Date().toISOString().split('T')[0], required: true },
        { key: 'endDate', label: '返回日期', type: 'date', value: '', required: true },
        { key: 'budget', label: '出差预算(元)', type: 'number', value: amountMatch ? amountMatch[1] : '', required: true },
        { key: 'purpose', label: '出差目的', type: 'textarea', value: userInput, required: true }
      ],
      tips: ['出差预算含交通、住宿、餐饮', '出差归来后7天内需提交报销']
    }
  }

  const defaultForm: { fields: FormField[]; tips: string[] } = {
    fields: [
      { key: 'title', label: '流程标题', type: 'text', value: '', required: true },
      { key: 'department', label: '申请部门', type: 'select', value: '信息技术部', required: true, options: ['信息技术部', '财务部', '人力资源部', '市场部', '运营部'] },
      { key: 'description', label: '申请说明', type: 'textarea', value: userInput, required: true }
    ],
    tips: ['请补充详细描述以便AI更好地帮您填写']
  }

  const template = formTemplates[processType] || defaultForm
  return { processType, form: template.fields, tips: template.tips, mock: true }
}

/* ============ 发送需求 ============ */
async function handleSend() {
  const q = inputText.value.trim()
  if (!q || sending.value) return

  sending.value = true
  step.value = 'identify'

  try {
    const res: any = await identifyProcess(q)
    const data: ProcessIdentifyResult = res?.data ?? res
    // 如果后端返回的 identified 为 false，用本地兜底重新识别
    if (!data.identified || !data.process || data.process.type === 'unknown') {
      const fallback = localIdentifyProcess(q)
      identifiedProcess.value = fallback
      if (fallback.identified && fallback.process) {
        selectedType.value = fallback.process.type
        await handleFillForm(fallback.process.type, q)
      }
    } else {
      identifiedProcess.value = data
      if (data.identified && data.process) {
        selectedType.value = data.process.type
        await handleFillForm(data.process.type, q)
      }
    }
  } catch (e) {
    // 后端请求失败，使用本地兜底数据，不弹窗报错
    const fallback = localIdentifyProcess(q)
    identifiedProcess.value = fallback
    if (fallback.identified && fallback.process) {
      selectedType.value = fallback.process.type
      await handleFillForm(fallback.process.type, q)
    }
  } finally {
    sending.value = false
    await scrollToBottom()
  }
}

/* ============ 选择流程类型 ============ */
async function handleSelectType(type: string) {
  selectedType.value = type
  step.value = 'fill'
  sending.value = true
  try {
    await handleFillForm(type, inputText.value)
  } catch (e) {
    // 兜底数据已由 handleFillForm 内部处理
  } finally {
    sending.value = false
    await scrollToBottom()
  }
}

/* ============ AI 填充表单 ============ */
async function handleFillForm(processType: string, userInput: string) {
  try {
    const res: any = await fillProcessForm(processType, userInput)
    const data: FormFillResult = res?.data ?? res
    formFields.value = data.form || []
    formTips.value = data.tips || []
    step.value = 'fill'

    // 初始化表单数据
    for (const f of data.form) {
      formData[f.key] = f.value || ''
    }
  } catch (e) {
    // 后端请求失败，使用本地兜底数据，不弹窗报错
    const fallback = localFillProcessForm(processType, userInput)
    formFields.value = fallback.form
    formTips.value = fallback.tips
    step.value = 'fill'

    for (const f of fallback.form) {
      formData[f.key] = f.value || ''
    }
  }
}

/* ============ 提交流程 ============ */
async function handleSubmit() {
  // 验证必填字段
  const requiredFields = formFields.value.filter(f => f.required)
  for (const f of requiredFields) {
    if (!formData[f.key]) {
      ElMessage.warning(`请填写 ${f.label}`)
      return
    }
  }

  step.value = 'confirm'
  // 添加到历史记录
  const processName = identifiedProcess.value?.process?.name || selectedType.value
  historyList.value.unshift({
    id: Date.now(),
    type: selectedType.value,
    name: processName,
    time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    status: 'submitted'
  })
  ElMessage.success('流程发起成功！')
}

/* ============ 重新开始 ============ */
function handleReset() {
  step.value = 'input'
  inputText.value = ''
  identifiedProcess.value = null
  selectedType.value = ''
  formFields.value = []
  formTips.value = []
  for (const key of Object.keys(formData)) {
    delete formData[key]
  }
  nextTick(() => inputRef.value?.focus?.())
}

/* ============ 删除历史记录 ============ */
function handleDeleteHistory(item: any) {
  historyList.value = historyList.value.filter(h => h.id !== item.id)
}

/* ============ 快捷操作 ============ */
function useQuickAction(action: string) {
  inputText.value = action
  handleSend()
}

/* ============ 回车发送 ============ */
function handleEnter(e: KeyboardEvent) {
  if (e.shiftKey) return
  e.preventDefault()
  if (step.value === 'input') handleSend()
}

/* ============ 滚动 ============ */
async function scrollToBottom() {
  await nextTick()
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
  }
}

/* ============ 生命周期 ============ */
onMounted(() => {
  // 添加一些示例历史记录
  historyList.value = [
    { id: 1, type: 'expense', name: '报销审批', time: '07/07 09:30', status: 'approved' },
    { id: 2, type: 'contract', name: '合同审批', time: '07/06 14:15', status: 'pending' },
    { id: 3, type: 'leave', name: '请假审批', time: '07/05 10:00', status: 'approved' }
  ]
})
</script>

<template>
  <div class="smart-square-page">
    <!-- 左侧栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <el-button type="primary" :icon="Plus" class="new-action-btn" @click="handleReset">
          新建发起
        </el-button>
      </div>

      <div class="sidebar-section-title">发起历史</div>
      <div class="session-list">
        <div
          v-for="h in historyList"
          :key="h.id"
          class="session-item"
        >
          <el-icon class="session-icon"><Document /></el-icon>
          <div class="session-info">
            <div class="session-title">{{ h.name }}</div>
            <div class="session-time">{{ h.time }}</div>
          </div>
          <el-tag
            :type="h.status === 'approved' ? 'success' : h.status === 'pending' ? 'warning' : 'info'"
            size="small"
            effect="light"
          >
            {{ h.status === 'approved' ? '已通过' : h.status === 'pending' ? '待审批' : '已提交' }}
          </el-tag>
          <el-icon class="session-delete" @click="handleDeleteHistory(h)">
            <Delete />
          </el-icon>
        </div>
        <el-empty
          v-if="historyList.length === 0"
          description="暂无发起记录"
          :image-size="60"
        />
      </div>

      <div class="sidebar-footer">
        <div class="system-label">
          <el-icon><Connection /></el-icon>
          <span>发起系统</span>
        </div>
        <el-select
          v-model="selectedSystemId"
          placeholder="AI自动匹配"
          size="small"
          class="system-select"
          clearable
        >
          <el-option :value="undefined" label="AI自动匹配">
            <div class="system-option">
              <span style="color: #e8734a; font-weight: 600;">AI自动匹配</span>
              <el-tag type="warning" size="small" effect="dark">推荐</el-tag>
            </div>
          </el-option>
          <el-option
            v-for="s in systems"
            :key="s.id"
            :label="s.name"
            :value="s.id"
          >
            <div class="system-option">
              <span>{{ s.name }}</span>
              <el-tag
                :type="systemStatusType(s.status)"
                size="small"
                effect="plain"
              >
                {{ s.status === 'running' ? '在线' : s.status === 'stopped' ? '离线' : '未知' }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <section class="main">
      <!-- 顶部标题栏 -->
      <header class="main-header">
        <div class="title-wrap">
          <el-icon class="title-icon"><Opportunity /></el-icon>
          <span class="title-text">
            {{ step === 'input' ? '智能发起流程' : step === 'identify' ? 'AI 正在识别...' : step === 'fill' ? '填写流程表单' : '发起成功' }}
          </span>
          <el-tag v-if="identifiedProcess?.identified" type="warning" effect="dark" size="small" class="ai-tag-badge">
            AI <span v-if="identifiedProcess.process?.confidence">{{ identifiedProcess.process.confidence }}%</span>
          </el-tag>
        </div>
        <div class="header-right">
          <el-tag type="success" effect="light" size="small" class="system-status-tag">
            <el-icon style="margin-right: 4px"><Connection /></el-icon>
            {{ currentSystemName() }}
          </el-tag>
          <el-button v-if="step !== 'input'" text type="primary" @click="handleReset">
            重新发起
          </el-button>
        </div>
      </header>

      <!-- 内容区域 -->
      <div ref="chatAreaRef" class="chat-area">
        <!-- 步骤1：输入需求 -->
        <div v-if="step === 'input'" class="empty-state">
          <el-icon class="empty-icon"><Opportunity /></el-icon>
          <h3>智能发起流程</h3>
          <p>用一句话描述你要发起的流程，AI 自动识别类型并帮你填表</p>
          <div class="empty-suggest">
            <span>试试：</span>
            <el-button
              v-for="q in quickActions.slice(0, 4)"
              :key="q"
              size="small"
              round
              @click="useQuickAction(q)"
            >
              {{ q }}
            </el-button>
          </div>
        </div>

        <!-- 用户输入展示 -->
        <div v-if="step !== 'input' && inputText" class="msg-row">
          <div class="user-msg">
            <div class="user-bubble">{{ inputText }}</div>
          </div>
        </div>

        <!-- 步骤2：AI 识别结果 -->
        <div v-if="step === 'identify' && sending" class="msg-row">
          <div class="ai-msg">
            <div class="ai-avatar">AI</div>
            <div class="ai-card">
              <div class="ai-loading">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="loading-text">AI 正在识别流程类型...</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="identifiedProcess && step !== 'input'" class="msg-row">
          <div class="ai-msg">
            <div class="ai-avatar">AI</div>
            <div class="ai-card">
              <div v-if="identifiedProcess.identified" class="ai-section">
                <div class="section-title">
                  <el-icon><Opportunity /></el-icon>
                  <span>AI 识别结果</span>
                </div>
                <div class="identified-result">
                  <div class="process-badge">
                    <el-icon class="process-icon"><component :is="getIcon(identifiedProcess.process.icon)" /></el-icon>
                    <div class="process-info">
                      <div class="process-name">{{ identifiedProcess.process.name }}</div>
                      <div class="process-desc">{{ identifiedProcess.process.description }}</div>
                    </div>
                    <el-tag type="success" effect="dark" size="small">
                      匹配度 {{ identifiedProcess.process.confidence }}%
                    </el-tag>
                  </div>
                </div>
              </div>

              <div v-if="!identifiedProcess.identified" class="ai-section">
                <div class="section-title">
                  <el-icon><Opportunity /></el-icon>
                  <span>未能自动识别，请选择流程类型</span>
                </div>
                <div class="process-type-grid">
                  <div
                    v-for="pt in identifiedProcess.availableTypes"
                    :key="pt.type"
                    class="process-type-card"
                    :class="{ selected: selectedType === pt.type }"
                    @click="handleSelectType(pt.type)"
                  >
                    <el-icon class="pt-icon"><component :is="getIcon(pt.icon)" /></el-icon>
                    <div class="pt-name">{{ pt.name }}</div>
                    <div class="pt-desc">{{ pt.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤3：表单填充 -->
        <div v-if="step === 'fill' || step === 'confirm'" class="msg-row">
          <div class="ai-msg">
            <div class="ai-avatar">AI</div>
            <div class="ai-card">
              <div class="ai-section">
                <div class="section-title">
                  <el-icon><Document /></el-icon>
                  <span>流程表单 <el-tag type="warning" effect="dark" size="small" class="ai-tag-badge">AI 自动填充</el-tag></span>
                </div>

                <el-form label-width="120px" label-position="right" class="process-form">
                  <el-form-item
                    v-for="f in formFields"
                    :key="f.key"
                    :label="f.label"
                    :required="f.required"
                  >
                    <el-select v-if="f.type === 'select' && f.options" v-model="formData[f.key]" :placeholder="'请选择' + f.label">
                      <el-option v-for="opt in f.options" :key="opt" :label="opt" :value="opt" />
                    </el-select>
                    <el-input v-else-if="f.type === 'textarea'" v-model="formData[f.key]" type="textarea" :rows="3" :placeholder="'请输入' + f.label" />
                    <el-input v-else-if="f.type === 'number'" v-model="formData[f.key]" :placeholder="'请输入' + f.label" />
                    <el-date-picker v-else-if="f.type === 'date'" v-model="formData[f.key]" type="date" value-format="YYYY-MM-DD" :placeholder="'请选择' + f.label" style="width: 100%" />
                    <el-input v-else v-model="formData[f.key]" :placeholder="'请输入' + f.label" />
                  </el-form-item>
                </el-form>

                <!-- AI 提示 -->
                <div v-if="formTips.length" class="form-tips">
                  <div class="tips-title">
                    <el-icon><Opportunity /></el-icon>
                    <span>AI 提示</span>
                  </div>
                  <ul class="tips-list">
                    <li v-for="(tip, i) in formTips" :key="i">{{ tip }}</li>
                  </ul>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div v-if="step === 'fill'" class="form-actions">
                <el-button type="primary" :icon="Check" @click="handleSubmit">
                  提交发起
                </el-button>
                <el-button :icon="Close" @click="handleReset">
                  取消
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤4：发起成功 -->
        <div v-if="step === 'confirm'" class="msg-row">
          <div class="ai-msg">
            <div class="ai-avatar">AI</div>
            <div class="ai-card success-card">
              <div class="success-icon-wrap">
                <el-icon class="success-icon"><Check /></el-icon>
              </div>
              <h4>流程发起成功！</h4>
              <p>您的{{ identifiedProcess?.process?.name || '流程' }}已提交，审批人将在1-3个工作日内处理。</p>
              <div class="success-detail">
                <span>流程编号：SQ-{{ Date.now().toString().slice(-6) }}</span>
                <span>当前节点：部门主管审批</span>
              </div>
              <el-button type="primary" @click="handleReset" style="margin-top: 16px">
                继续发起新流程
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入区域 -->
      <footer class="input-area" v-if="step === 'input'">
        <div class="quick-actions">
          <el-button
            v-for="q in quickActions"
            :key="q"
            size="small"
            round
            @click="useQuickAction(q)"
          >
            {{ q }}
          </el-button>
        </div>
        <div class="input-row">
          <el-input
            ref="inputRef"
            v-model="inputText"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="描述你要发起的流程，例如：我要报销出差费用500元"
            :disabled="sending"
            @keydown.enter="handleEnter"
          />
          <el-button
            type="primary"
            :icon="Promotion"
            :loading="sending"
            :disabled="!inputText.trim()"
            @click="handleSend"
          >
            发起
          </el-button>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.smart-square-page {
  display: flex;
  height: 100%;
  background: #f0f4f8;
}

/* ============ 左侧栏 ============ */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.new-action-btn {
  width: 100%;
  background: linear-gradient(135deg, #e8734a, #c75930);
  border-color: #e8734a;
}
.new-action-btn:hover {
  background: linear-gradient(135deg, #c75930, #e8734a);
  border-color: #c75930;
}

.sidebar-section-title {
  padding: 10px 16px 6px;
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  position: relative;
}
.session-item:hover {
  background: #f5f7fa;
}

.session-icon {
  color: #909399;
  flex-shrink: 0;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.session-time {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.session-delete {
  color: #c0c4cc;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}
.session-item:hover .session-delete {
  opacity: 1;
}
.session-delete:hover {
  color: #e8734a;
}

.sidebar-footer {
  border-top: 1px solid #f0f0f0;
  padding: 12px;
}

.system-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.system-select {
  width: 100%;
}

.system-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* ============ 右侧主区域 ============ */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}

.main-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon {
  color: #e8734a;
  font-size: 18px;
}
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a5c;
}
.ai-tag-badge {
  margin-left: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.system-status-tag {
  flex-shrink: 0;
}

/* ============ 内容区域 ============ */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}
.empty-icon {
  font-size: 60px;
  color: #e8734a;
  margin-bottom: 16px;
}
.empty-state h3 {
  font-size: 20px;
  color: #1a3a5c;
  margin-bottom: 8px;
}
.empty-state p {
  font-size: 14px;
  margin-bottom: 16px;
}
.empty-suggest {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ============ 消息行 ============ */
.msg-row {
  margin-bottom: 20px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}

/* 用户消息 */
.user-msg {
  display: flex;
  justify-content: flex-end;
}
.user-bubble {
  max-width: 70%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #1a3a5c, #2c5a8c);
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(26, 58, 92, 0.15);
}

/* AI 消息 */
.ai-msg {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.ai-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e8734a, #c75930);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.ai-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  min-width: 0;
}

/* AI 加载动画 */
.ai-loading {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
}
.ai-loading .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e8734a;
  animation: dot-bounce 1.2s infinite ease-in-out;
}
.ai-loading .dot:nth-child(2) {
  animation-delay: 0.2s;
}
.ai-loading .dot:nth-child(3) {
  animation-delay: 0.4s;
}
.loading-text {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}
@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 分区块 */
.ai-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #ebeef5;
}
.ai-section:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 10px;
}
.section-title .el-icon {
  color: #e8734a;
}

/* 识别结果 */
.identified-result {
  margin-top: 8px;
}
.process-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fff7f2, #fff);
  border-radius: 10px;
  border: 1px solid rgba(232, 115, 74, 0.2);
}
.process-icon {
  font-size: 28px;
  color: #e8734a;
}
.process-info {
  flex: 1;
}
.process-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a3a5c;
}
.process-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 流程类型网格 */
.process-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 8px;
}
.process-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.process-type-card:hover {
  border-color: #e8734a;
  background: #fff7f2;
}
.process-type-card.selected {
  border-color: #e8734a;
  background: rgba(232, 115, 74, 0.08);
  box-shadow: 0 0 0 2px rgba(232, 115, 74, 0.2);
}
.pt-icon {
  font-size: 24px;
  color: #e8734a;
  margin-bottom: 6px;
}
.pt-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
.pt-desc {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.4;
}

/* 流程表单 */
.process-form {
  margin-top: 8px;
}
.process-form :deep(.el-form-item) {
  margin-bottom: 16px;
}
.process-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

/* AI 提示 */
.form-tips {
  margin-top: 12px;
  background: #fff7f2;
  border-radius: 8px;
  padding: 10px 14px;
  border-left: 3px solid #e8734a;
}
.tips-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #e8734a;
  margin-bottom: 6px;
}
.tips-list {
  padding-left: 16px;
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 成功卡片 */
.success-card {
  text-align: center;
}
.success-icon-wrap {
  margin-bottom: 12px;
}
.success-icon {
  font-size: 48px;
  color: #67c23a;
}
.success-card h4 {
  font-size: 18px;
  color: #1a3a5c;
  margin-bottom: 8px;
}
.success-card p {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}
.success-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  background: #f8fafc;
  padding: 10px;
  border-radius: 6px;
}

/* ============ 底部输入 ============ */
.input-area {
  background: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 12px 20px 16px;
  flex-shrink: 0;
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  max-width: 1100px;
  margin: 0 auto;
}

.input-row :deep(.el-textarea__inner) {
  border-radius: 8px;
  font-size: 14px;
}

.input-row .el-button {
  height: 56px;
  background: linear-gradient(135deg, #e8734a, #c75930);
  border-color: #e8734a;
}
.input-row .el-button:hover {
  background: linear-gradient(135deg, #c75930, #e8734a);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .smart-square-page {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }
  .user-bubble {
    max-width: 90%;
  }
  .process-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

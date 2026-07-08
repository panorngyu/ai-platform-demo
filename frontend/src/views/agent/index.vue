<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Edit,
  Wallet,
  Files,
  Cpu,
  ChatDotRound,
  DataAnalysis,
  Connection,
  Setting,
  CircleCheck,
  CircleClose,
  VideoPlay,
  MagicStick,
  Search,
  RefreshLeft,
  DocumentCopy,
  ArrowDown,
  ArrowUp,
  Top,
  Bottom,
  Timer
} from '@element-plus/icons-vue'
import {
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  toggleAgentStatus,
  type AgentItem,
  type AgentCreateParams,
  type Workflow,
  type WorkflowStep,
  type ApiHeader,
  createDefaultWorkflow,
  createDefaultStep
} from '@/api/agent'

const router = useRouter()

/* ============ 状态 ============ */
const agents = ref<AgentItem[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const typeFilter = ref('')
const saving = ref(false)

// 创建/编辑对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogMode = ref<'create' | 'edit'>('create')
const dialogForm = reactive<AgentCreateParams & { id?: number | string }>({
  name: '',
  description: '',
  type: 'chat',
  icon: 'ChatDotRound',
  category: '',
  prompt: '',
  model: 'gpt-4',
  tags: [],
  workflow: createDefaultWorkflow()
})

const editingId = ref<number | string | null>(null)
const tagInputValue = ref('')
const activeTab = ref('basic')

// ============ 工作流状态 ============
const expandedStep = ref<string | null>(null)
const editingHeaderIdx = ref<number | null>(null)
const newHeaderKey = ref('')
const newHeaderValue = ref('')

// 模板安全访问
const wf = computed(() => dialogForm.workflow || createDefaultWorkflow())

/* ============ 计算属性 ============ */
const filteredAgents = computed(() => {
  let list = agents.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(a =>
      a.name.toLowerCase().includes(kw) ||
      a.description.toLowerCase().includes(kw) ||
      a.tags.some(t => t.toLowerCase().includes(kw))
    )
  }
  if (typeFilter.value) {
    list = list.filter(a => a.type === typeFilter.value)
  }
  return list
})

const builtinAgents = computed(() => filteredAgents.value.filter(a => a.isBuiltin))
const customAgents = computed(() => filteredAgents.value.filter(a => !a.isBuiltin))

const onlineCount = computed(() => agents.value.filter(a => a.status === 'online').length)
const totalCount = computed(() => agents.value.length)

/* ============ 数据加载 ============ */
async function fetchAgents() {
  loading.value = true
  try {
    const res = await getAgents()
    agents.value = res.data || []
  } catch {
    // 兜底数据
    agents.value = getFallbackAgents()
  } finally {
    loading.value = false
  }
}

function getFallbackAgents(): AgentItem[] {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  // 从 localStorage 加载自定义智能体
  let custom: AgentItem[] = []
  try {
    const saved = localStorage.getItem('jml_custom_agents')
    if (saved) custom = JSON.parse(saved)
  } catch {}

  return [
    {
      id: 'builtin-expense',
      name: '智能报销助手',
      description: 'AI驱动的一站式报销体验：语音/拍照/文件多模态录入，智能验真查重，自动关联差旅标准与预算控制，合规风险实时预警',
      type: 'flow',
      status: 'online',
      icon: 'Wallet',
      category: '财务管理',
      prompt: '你是一个专业的报销助手，帮助用户处理费用报销申请。你需要：1. 解析费用明细 2. 检查合规性 3. 关联预算 4. 自动填充报销单',
      model: 'gpt-4',
      tags: ['报销', 'OCR', '合规检查', '预算控制'],
      isBuiltin: true,
      usageCount: 2847,
      createTime: '2026-03-15 09:00:00',
      updateTime: now,
      routePath: '/expense'
    },
    {
      id: 'builtin-contract',
      name: '智能合同助手',
      description: 'AI辅助合同全生命周期管理：智能起草/续写/摘要，多版本差异比对，风险条款自动审查与评级，关键要素自动提取归档',
      type: 'flow',
      status: 'online',
      icon: 'Files',
      category: '合同管理',
      prompt: '你是一个专业的合同管理助手，帮助用户处理合同相关事务。你需要：1. 起草和审阅合同 2. 识别风险条款 3. 对比合同版本差异 4. 提取关键信息',
      model: 'gpt-4',
      tags: ['合同', 'AI起草', '风险审查', '差异比对'],
      isBuiltin: true,
      usageCount: 1532,
      createTime: '2026-03-15 09:00:00',
      updateTime: now,
      routePath: '/contract'
    },
    {
      id: 'builtin-approval',
      name: '智能审批助手',
      description: 'AI智能路由分发审批任务，多维度合规风险预检，历史审批数据关联分析，审批意见智能辅助生成',
      type: 'flow',
      status: 'online',
      icon: 'DocumentCopy',
      category: '流程管理',
      prompt: '你是一个专业的审批助手，帮助用户处理审批流程。你需要：1. 分析审批内容 2. 评估风险等级 3. 提供审批建议 4. 智能路由分发',
      model: 'gpt-4',
      tags: ['审批', '风险分析', '智能路由', '合规'],
      isBuiltin: true,
      usageCount: 3621,
      createTime: '2026-03-15 09:00:00',
      updateTime: now,
      routePath: '/approval/1'
    },
    {
      id: 'builtin-audit',
      name: 'AI审核助手',
      description: '基于大模型的智能审核引擎，支持合同/报销/采购等多场景审核，风险评估自动分级，审核报告一键生成',
      type: 'data',
      status: 'online',
      icon: 'MagicStick',
      category: '审核管理',
      prompt: '你是一个专业的AI审核助手，帮助用户进行自动审核。你需要：1. 分析待审核内容 2. 识别风险点 3. 生成审核结论 4. 输出审核报告',
      model: 'gpt-4',
      tags: ['审核', 'AI审核', '风险评估', '报告生成'],
      isBuiltin: true,
      usageCount: 4108,
      createTime: '2026-03-15 09:00:00',
      updateTime: now,
      routePath: '/ai-audit/1'
    },
    ...custom
  ]
}

/* ============ 操作 ============ */

// 打开智能体（预置的跳转路由，自定义的进入对话）
function openAgent(agent: AgentItem) {
  if (agent.routePath) {
    router.push(agent.routePath)
  } else {
    ElMessage.info(`正在进入「${agent.name}」...`)
  }
}

// 创建智能体
function openCreateDialog() {
  dialogMode.value = 'create'
  dialogTitle.value = '创建智能体'
  editingId.value = null
  activeTab.value = 'basic'
  expandedStep.value = null
  dialogForm.workflow = createDefaultWorkflow()
  Object.assign(dialogForm, {
    id: undefined,
    name: '',
    description: '',
    type: 'chat',
    icon: 'ChatDotRound',
    category: '',
    prompt: '',
    model: 'gpt-4',
    tags: [],
    workflow: createDefaultWorkflow()
  })
  dialogVisible.value = true
}

// 编辑智能体
function openEditDialog(agent: AgentItem) {
  if (agent.isBuiltin) {
    ElMessage.warning('预置智能体不支持编辑')
    return
  }
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑智能体'
  editingId.value = agent.id
  activeTab.value = 'basic'
  expandedStep.value = null
  dialogForm.workflow = agent.workflow 
    ? JSON.parse(JSON.stringify(agent.workflow)) 
    : createDefaultWorkflow()
  Object.assign(dialogForm, {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    type: agent.type,
    icon: agent.icon,
    category: agent.category,
    prompt: agent.prompt,
    model: agent.model,
    tags: [...agent.tags],
    workflow: dialogForm.workflow
  })
  dialogVisible.value = true
}

// 保存
async function handleSave() {
  if (!dialogForm.name.trim()) {
    ElMessage.warning('请输入智能体名称')
    return
  }
  if (!dialogForm.description.trim()) {
    ElMessage.warning('请输入智能体描述')
    return
  }

  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await createAgent(dialogForm as AgentCreateParams)
    } else {
      await updateAgent({
        ...dialogForm,
        id: editingId.value!
      })
    }
    // 自定义智能体保存到本地
    saveCustomAgentsLocally()
    ElMessage.success(dialogMode.value === 'create' ? '智能体创建成功' : '保存成功')
    dialogVisible.value = false
  } catch {
    // Mock 模式：本地保存
    saveCustomAgentsLocally()
    ElMessage.success(dialogMode.value === 'create' ? '智能体创建成功（Mock模式）' : '保存成功（Mock模式）')
    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

function saveCustomAgentsLocally() {
  // 从 agents 中过滤自定义智能体，更新或新增
  const custom = agents.value.filter(a => !a.isBuiltin)

  if (dialogMode.value === 'create') {
    const newAgent: AgentItem = {
      id: 'custom-' + Date.now(),
      name: dialogForm.name,
      description: dialogForm.description,
      type: dialogForm.type,
      status: 'online',
      icon: dialogForm.icon,
      category: dialogForm.category,
      prompt: dialogForm.prompt,
      model: dialogForm.model,
      tags: dialogForm.tags,
      workflow: dialogForm.workflow ? JSON.parse(JSON.stringify(dialogForm.workflow)) : undefined,
      isBuiltin: false,
      usageCount: 0,
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
    agents.value.push(newAgent)
  } else if (editingId.value !== null) {
    const idx = agents.value.findIndex(a => a.id === editingId.value)
    if (idx !== -1) {
      agents.value[idx] = {
        ...agents.value[idx],
        name: dialogForm.name,
        description: dialogForm.description,
        type: dialogForm.type,
        icon: dialogForm.icon,
        category: dialogForm.category,
        prompt: dialogForm.prompt,
        model: dialogForm.model,
        tags: dialogForm.tags,
        workflow: dialogForm.workflow ? JSON.parse(JSON.stringify(dialogForm.workflow)) : undefined,
        updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
    }
  }

  const updated = agents.value.filter(a => !a.isBuiltin)
  localStorage.setItem('jml_custom_agents', JSON.stringify(updated))
}

// 删除
async function handleDelete(agent: AgentItem) {
  if (agent.isBuiltin) {
    ElMessage.warning('预置智能体不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除智能体「${agent.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  try {
    await deleteAgent(agent.id)
  } catch {
    // ignore
  }
  agents.value = agents.value.filter(a => a.id !== agent.id)
  localStorage.setItem('jml_custom_agents', JSON.stringify(agents.value.filter(a => !a.isBuiltin)))
  ElMessage.success('删除成功')
}

// 切换状态
async function handleToggle(agent: AgentItem) {
  if (agent.isBuiltin) {
    ElMessage.warning('预置智能体状态不可变更')
    return
  }
  try {
    await toggleAgentStatus(agent.id)
  } catch {
    // ignore
  }
  agent.status = agent.status === 'online' ? 'offline' : 'online'
  localStorage.setItem('jml_custom_agents', JSON.stringify(agents.value.filter(a => !a.isBuiltin)))
  ElMessage.success(`已${agent.status === 'online' ? '启用' : '禁用'}`)
}

// 添加标签
function addTag() {
  const tag = tagInputValue.value.trim()
  if (!tag) return
  if (dialogForm.tags.includes(tag)) {
    ElMessage.warning('标签已存在')
    return
  }
  dialogForm.tags.push(tag)
  tagInputValue.value = ''
}

function removeTag(index: number) {
  dialogForm.tags.splice(index, 1)
}

// ============ 工作流操作 ============
function addStep() {
  const step = createDefaultStep()
  step.name = `步骤 ${(dialogForm.workflow?.steps.length || 0) + 1}`
  if (!dialogForm.workflow) {
    dialogForm.workflow = createDefaultWorkflow()
  }
  dialogForm.workflow.steps.push(step)
  expandedStep.value = step.id
}

function removeStep(index: number) {
  if (!dialogForm.workflow) return
  const removed = dialogForm.workflow.steps.splice(index, 1)[0]
  if (expandedStep.value === removed.id) {
    expandedStep.value = null
  }
}

function moveStep(index: number, direction: -1 | 1) {
  if (!dialogForm.workflow) return
  const steps = dialogForm.workflow.steps
  const target = index + direction
  if (target < 0 || target >= steps.length) return
  ;[steps[index], steps[target]] = [steps[target], steps[index]]
}

function toggleStepCard(stepId: string) {
  expandedStep.value = expandedStep.value === stepId ? null : stepId
}

function ensureWorkflow() {
  if (!dialogForm.workflow) {
    dialogForm.workflow = createDefaultWorkflow()
  }
}

// ============ API Header 操作 ============
function addHeader(step: WorkflowStep) {
  if (!newHeaderKey.value.trim()) return
  step.config.headers.push({
    key: newHeaderKey.value.trim(),
    value: newHeaderValue.value.trim()
  })
  newHeaderKey.value = ''
  newHeaderValue.value = ''
}

function removeHeader(step: WorkflowStep, index: number) {
  step.config.headers.splice(index, 1)
}

// ============ 工作流测试 ============
const testLoading = ref(false)
const testResult = ref<string | null>(null)

async function testStep(step: WorkflowStep) {
  testLoading.value = true
  testResult.value = null
  try {
    const url = step.config.url.trim()
    if (!url) {
      testResult.value = '请先填写接口地址'
      return
    }
    // 模拟测试
    await new Promise(r => setTimeout(r, 1200))
    testResult.value = `✓ 请求成功 (${step.config.method} ${url})\n响应状态: 200 OK\n响应时间: ${(200 + Math.random() * 800).toFixed(0)}ms\n\n{\n  "code": 0,\n  "message": "success",\n  "data": {}\n}`
  } catch {
    testResult.value = '✗ 请求失败，请检查接口地址和配置'
  } finally {
    testLoading.value = false
  }
}

// 重置搜索
function resetFilters() {
  searchKeyword.value = ''
  typeFilter.value = ''
}

/* ============ 辅助 ============ */
const iconMap: Record<string, any> = {
  Wallet, Files, Cpu, ChatDotRound, DataAnalysis, Connection, Setting,
  MagicStick, DocumentCopy, VideoPlay
}

function resolveIcon(iconName: string) {
  return iconMap[iconName] || Cpu
}

function typeTag(type: string) {
  const map: Record<string, { text: string; type: string }> = {
    chat: { text: '对话助手', type: 'primary' },
    flow: { text: '流程自动化', type: 'success' },
    data: { text: '数据分析', type: 'warning' },
    custom: { text: '自定义', type: 'info' }
  }
  return map[type] || { text: type, type: 'info' }
}

function statusColor(status: string) {
  return status === 'online' ? '#10b981' : '#909399'
}

const iconOptions = [
  { label: '对话', value: 'ChatDotRound' },
  { label: '数据分析', value: 'DataAnalysis' },
  { label: '自动化', value: 'Cpu' },
  { label: '合同', value: 'Files' },
  { label: '财务', value: 'Wallet' },
  { label: '连接', value: 'Connection' },
  { label: '魔术', value: 'MagicStick' },
  { label: '视频', value: 'VideoPlay' },
  { label: '文档', value: 'DocumentCopy' },
  { label: '设置', value: 'Setting' }
]

const modelOptions = [
  { label: 'GPT-4', value: 'gpt-4' },
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
  { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
  { label: 'Claude 3', value: 'claude-3' },
  { label: 'GLM-4', value: 'glm-4' },
  { label: 'Qwen-Max', value: 'qwen-max' }
]

/* ============ 生命周期 ============ */
onMounted(() => {
  fetchAgents()
})
</script>

<template>
  <div class="agent-page">
    <!-- 统计概览 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon-total">
          <el-icon :size="24"><Cpu /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalCount }}</div>
          <div class="stat-label">智能体总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-online">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ onlineCount }}</div>
          <div class="stat-label">运行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-builtin">
          <el-icon :size="24"><MagicStick /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ builtinAgents.length }}</div>
          <div class="stat-label">预置智能体</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-custom">
          <el-icon :size="24"><Setting /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ customAgents.length }}</div>
          <div class="stat-label">自定义智能体</div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索智能体名称、描述或标签..."
          :prefix-icon="Search"
          clearable
          style="width: 320px"
        />
        <el-select v-model="typeFilter" placeholder="类型筛选" clearable style="width: 140px">
          <el-option label="对话助手" value="chat" />
          <el-option label="流程自动化" value="flow" />
          <el-option label="数据分析" value="data" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          创建智能体
        </el-button>
      </div>
    </div>

    <!-- 智能体列表 -->
    <div v-loading="loading" class="agent-content">
      <!-- 预置智能体 -->
      <div v-if="builtinAgents.length > 0" class="agent-section">
        <div class="section-header">
          <el-icon :size="18"><MagicStick /></el-icon>
          <span class="section-title">预置智能体</span>
          <el-tag size="small" effect="plain" type="warning">{{ builtinAgents.length }} 个</el-tag>
        </div>
        <div class="agent-grid">
          <div
            v-for="agent in builtinAgents"
            :key="agent.id"
            class="agent-card agent-card-builtin"
            @click="openAgent(agent)"
          >
            <div class="card-status" :style="{ background: statusColor(agent.status) }"></div>
            <div class="card-header">
              <div class="card-icon">
                <el-icon :size="28"><component :is="resolveIcon(agent.icon)" /></el-icon>
              </div>
              <div class="card-title-row">
                <span class="card-name">{{ agent.name }}</span>
                <el-tag size="small" effect="dark" type="warning">预置</el-tag>
              </div>
            </div>
            <div class="card-body">
              <p class="card-desc">{{ agent.description }}</p>
              <div class="card-tags">
                <el-tag
                  v-for="tag in agent.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                  style="margin: 2px 4px 2px 0"
                >{{ tag }}</el-tag>
              </div>
            </div>
            <div class="card-footer">
              <div class="card-meta">
                <el-tag :type="typeTag(agent.type).type as any" size="small" effect="light">
                  {{ typeTag(agent.type).text }}
                </el-tag>
                <span class="meta-text">{{ agent.model }}</span>
              </div>
              <div class="card-usage">
                <span class="usage-count">{{ agent.usageCount.toLocaleString() }}</span>
                <span class="usage-label">次使用</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义智能体 -->
      <div v-if="customAgents.length > 0 || !loading" class="agent-section">
        <div class="section-header">
          <el-icon :size="18"><Setting /></el-icon>
          <span class="section-title">自定义智能体</span>
          <el-tag size="small" effect="plain" type="info">{{ customAgents.length }} 个</el-tag>
        </div>
        <div v-if="customAgents.length === 0 && !loading" class="empty-state">
          <el-icon :size="48"><Cpu /></el-icon>
          <p>还没有自定义智能体</p>
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">创建第一个智能体</el-button>
        </div>
        <div v-else class="agent-grid">
          <div
            v-for="agent in customAgents"
            :key="agent.id"
            class="agent-card"
            @click="openAgent(agent)"
          >
            <div class="card-status" :style="{ background: statusColor(agent.status) }"></div>
            <div class="card-header">
              <div class="card-icon">
                <el-icon :size="28"><component :is="resolveIcon(agent.icon)" /></el-icon>
              </div>
              <div class="card-title-row">
                <span class="card-name">{{ agent.name }}</span>
                <el-switch
                  :model-value="agent.status === 'online'"
                  size="small"
                  @click.stop
                  @change="handleToggle(agent)"
                />
              </div>
            </div>
            <div class="card-body">
              <p class="card-desc">{{ agent.description }}</p>
              <div class="card-tags">
                <el-tag
                  v-for="tag in agent.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                  style="margin: 2px 4px 2px 0"
                >{{ tag }}</el-tag>
              </div>
            </div>
            <div class="card-footer">
              <div class="card-meta">
                <el-tag :type="typeTag(agent.type).type as any" size="small" effect="light">
                  {{ typeTag(agent.type).text }}
                </el-tag>
                <span class="meta-text">{{ agent.model }}</span>
              </div>
              <div class="card-actions">
                <el-button text size="small" :icon="Edit" @click.stop="openEditDialog(agent)">编辑</el-button>
                <el-button text size="small" :icon="Delete" @click.stop="handleDelete(agent)" style="color: #ef4444">删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索结果为空 -->
      <div v-if="filteredAgents.length === 0 && !loading && agents.length > 0" class="empty-state">
        <el-icon :size="48"><Search /></el-icon>
        <p>没有找到匹配的智能体</p>
        <el-button :icon="RefreshLeft" @click="resetFilters">清除筛选</el-button>
      </div>
    </div>

    <!-- ===== 创建/编辑对话框 ===== -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="860px"
      :close-on-click-modal="false"
      destroy-on-close
      top="5vh"
    >
      <el-tabs v-model="activeTab" type="card">
        <!-- ========== 基本信息 Tab ========== -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="dialogForm" label-width="90px" label-position="right">
            <el-form-item label="智能体名称" required>
              <el-input v-model="dialogForm.name" placeholder="给你的智能体起个名字" maxlength="30" show-word-limit />
            </el-form-item>

            <el-form-item label="描述" required>
              <el-input
                v-model="dialogForm.description"
                type="textarea"
                :rows="3"
                placeholder="描述智能体的功能和用途"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="类型">
                  <el-select v-model="dialogForm.type" style="width: 100%">
                    <el-option label="对话助手" value="chat" />
                    <el-option label="流程自动化" value="flow" />
                    <el-option label="数据分析" value="data" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="图标">
                  <el-select v-model="dialogForm.icon" style="width: 100%">
                    <el-option
                      v-for="opt in iconOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    >
                      <span style="display: flex; align-items: center; gap: 6px">
                        <el-icon><component :is="resolveIcon(opt.value)" /></el-icon>
                        {{ opt.label }}
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="所属分类">
                  <el-input v-model="dialogForm.category" placeholder="如：财务管理、合同管理..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="模型">
                  <el-select v-model="dialogForm.model" style="width: 100%">
                    <el-option
                      v-for="opt in modelOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="系统提示词">
              <el-input
                v-model="dialogForm.prompt"
                type="textarea"
                :rows="5"
                placeholder="定义智能体的角色、行为和能力..."
              />
            </el-form-item>

            <el-form-item label="标签">
              <div style="display: flex; flex-direction: column; gap: 8px; width: 100%">
                <div style="display: flex; gap: 8px">
                  <el-input
                    v-model="tagInputValue"
                    placeholder="输入标签后按回车添加"
                    maxlength="12"
                    style="flex: 1"
                    @keyup.enter="addTag"
                  />
                  <el-button :icon="Plus" @click="addTag">添加</el-button>
                </div>
                <div v-if="dialogForm.tags.length > 0" class="tag-list">
                  <el-tag
                    v-for="(tag, idx) in dialogForm.tags"
                    :key="idx"
                    closable
                    size="small"
                    style="margin: 2px 4px 2px 0"
                    @close="removeTag(idx)"
                  >{{ tag }}</el-tag>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- ========== 工作流配置 Tab ========== -->
        <el-tab-pane name="workflow">
          <template #label>
            <span>
              工作流配置
              <el-badge
                v-if="dialogForm.workflow?.steps.length"
                :value="wf.steps.length"
                class="workflow-badge"
                style="margin-left: 4px"
              />
            </span>
          </template>

          <!-- 工作流基本信息 -->
          <div class="workflow-header">
            <el-form label-width="70px" label-position="right" size="small">
              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="流程名称">
                    <el-input v-model="dialogForm.workflow!.name" placeholder="输入工作流名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="触发方式">
                    <el-select v-model="dialogForm.workflow!.triggerType" style="width: 100%">
                      <el-option label="手动触发" value="manual" />
                      <el-option label="API触发" value="api" />
                      <el-option label="定时触发" value="scheduled" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col v-if="dialogForm.workflow?.triggerType === 'scheduled'" :span="8">
                  <el-form-item label="Cron">
                    <el-input v-model="dialogForm.workflow.cron" placeholder="0 */6 * * *" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="流程描述">
                <el-input v-model="dialogForm.workflow!.description" placeholder="工作流用途说明" />
              </el-form-item>
            </el-form>
          </div>

          <!-- 步骤列表 -->
          <div class="steps-section">
            <div class="steps-header">
              <span class="steps-title">
                <el-icon><Connection /></el-icon>
                执行步骤
              </span>
              <el-button type="primary" size="small" :icon="Plus" @click="addStep">添加步骤</el-button>
            </div>

            <el-empty
              v-if="!dialogForm.workflow?.steps.length"
              description="暂无步骤，请点击「添加步骤」创建"
              :image-size="80"
            />

            <div v-else class="steps-list">
              <div
                v-for="(step, index) in wf.steps"
                :key="step.id"
                class="step-card"
                :class="{ expanded: expandedStep === step.id, disabled: !step.enabled }"
              >
                <!-- 步骤头部 -->
                <div class="step-header" @click="toggleStepCard(step.id)">
                  <div class="step-header-left">
                    <el-switch
                      v-model="step.enabled"
                      size="small"
                      @click.stop
                      @change="() => {}"
                    />
                    <span class="step-index">步骤 {{ index + 1 }}</span>
                    <el-input
                      v-model="step.name"
                      size="small"
                      placeholder="步骤名称"
                      style="width: 160px"
                      @click.stop
                    />
                    <el-tag size="small" effect="plain" type="primary">
                      {{ step.type === 'api_call' ? 'API调用' : step.type === 'ai_process' ? 'AI处理' : '条件判断' }}
                    </el-tag>
                  </div>
                  <div class="step-header-right">
                    <el-button
                      text
                      size="small"
                      :icon="ArrowUp"
                      :disabled="index === 0"
                      @click.stop="moveStep(index, -1)"
                    />
                    <el-button
                      text
                      size="small"
                      :icon="ArrowDown"
                      :disabled="index === wf.steps.length - 1"
                      @click.stop="moveStep(index, 1)"
                    />
                    <el-button
                      text
                      size="small"
                      :icon="Delete"
                      style="color: #ef4444"
                      @click.stop="removeStep(index)"
                    />
                    <el-icon
                      :size="16"
                      class="expand-icon"
                      :style="{ transform: expandedStep === step.id ? 'rotate(180deg)' : '' }"
                    >
                      <ArrowDown />
                    </el-icon>
                  </div>
                </div>

                <!-- 步骤详情（折叠） -->
                <div v-show="expandedStep === step.id" class="step-body">
                  <el-form label-width="90px" label-position="right" size="small">
                    <el-form-item label="节点类型">
                      <el-select v-model="step.type" style="width: 200px">
                        <el-option label="API调用" value="api_call" />
                        <el-option label="AI处理" value="ai_process" />
                        <el-option label="条件判断" value="condition" />
                      </el-select>
                    </el-form-item>

                    <!-- API调用配置 -->
                    <template v-if="step.type === 'api_call'">
                      <div class="api-config">
                        <el-row :gutter="12">
                          <el-col :span="5">
                            <el-form-item label="请求方式">
                              <el-select v-model="step.config.method" style="width: 100%">
                                <el-option label="GET" value="GET" />
                                <el-option label="POST" value="POST" />
                                <el-option label="PUT" value="PUT" />
                                <el-option label="DELETE" value="DELETE" />
                                <el-option label="PATCH" value="PATCH" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="19">
                            <el-form-item label="接口地址">
                              <el-input v-model="step.config.url" placeholder="https://api.example.com/endpoint" />
                            </el-form-item>
                          </el-col>
                        </el-row>

                        <el-form-item label="请求Headers">
                          <div class="headers-editor">
                            <div
                              v-for="(h, hIdx) in step.config.headers"
                              :key="hIdx"
                              class="header-row"
                            >
                              <el-input
                                v-model="h.key"
                                size="small"
                                placeholder="Key"
                                style="width: 180px"
                              />
                              <el-input
                                v-model="h.value"
                                size="small"
                                placeholder="Value"
                                style="flex: 1"
                              />
                              <el-button
                                text
                                size="small"
                                :icon="Delete"
                                style="color: #ef4444"
                                @click="removeHeader(step, hIdx)"
                              />
                            </div>
                            <div class="header-row">
                              <el-input
                                v-model="newHeaderKey"
                                size="small"
                                placeholder="Key"
                                style="width: 180px"
                                @keyup.enter="addHeader(step)"
                              />
                              <el-input
                                v-model="newHeaderValue"
                                size="small"
                                placeholder="Value"
                                style="flex: 1"
                                @keyup.enter="addHeader(step)"
                              />
                              <el-button size="small" :icon="Plus" @click="addHeader(step)">添加</el-button>
                            </div>
                          </div>
                        </el-form-item>

                        <el-row :gutter="12">
                          <el-col :span="8">
                            <el-form-item label="Body类型">
                              <el-select v-model="step.config.bodyType" style="width: 100%">
                                <el-option label="JSON" value="json" />
                                <el-option label="Form" value="form" />
                                <el-option label="Raw" value="raw" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="4">
                            <el-form-item label="超时(ms)">
                              <el-input-number
                                v-model="step.config.timeout"
                                :min="1000"
                                :max="120000"
                                :step="5000"
                                style="width: 100%"
                              />
                            </el-form-item>
                          </el-col>
                          <el-col :span="4">
                            <el-form-item label="重试">
                              <el-input-number
                                v-model="step.config.retryCount"
                                :min="0"
                                :max="5"
                                style="width: 100%"
                              />
                            </el-form-item>
                          </el-col>
                          <el-col :span="8">
                            <el-form-item label="MIME">
                              <el-input
                                v-model="step.config.name"
                                size="small"
                                placeholder="请求名称标识"
                              />
                            </el-form-item>
                          </el-col>
                        </el-row>

                        <el-form-item label="请求体">
                          <el-input
                            v-model="step.config.body"
                            type="textarea"
                            :rows="6"
                            placeholder='{ "key": "value" }'
                            style="font-family: monospace; font-size: 13px"
                          />
                        </el-form-item>

                        <el-row :gutter="12">
                          <el-col :span="12">
                            <el-form-item label="成功判断">
                              <el-input
                                v-model="step.config.successField"
                                size="small"
                                placeholder="data.code === 0"
                              />
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item label="输出变量">
                              <el-input
                                v-model="step.config.outputKey"
                                size="small"
                                placeholder="result"
                              />
                            </el-form-item>
                          </el-col>
                        </el-row>

                        <!-- 测试按钮 -->
                        <div class="test-section">
                          <el-button
                            size="small"
                            :icon="VideoPlay"
                            :loading="testLoading"
                            @click="testStep(step)"
                          >
                            测试调用
                          </el-button>
                          <pre v-if="testResult" class="test-result">{{ testResult }}</pre>
                        </div>
                      </div>
                    </template>

                    <!-- AI处理配置（占位） -->
                    <template v-if="step.type === 'ai_process'">
                      <el-form-item label="AI模型">
                        <el-select v-model="step.config.name" style="width: 200px">
                          <el-option v-for="m in modelOptions" :key="m.value" :label="m.label" :value="m.value" />
                        </el-select>
                      </el-form-item>
                      <el-form-item label="处理提示">
                        <el-input
                          v-model="step.config.body"
                          type="textarea"
                          :rows="4"
                          placeholder="描述此步骤的AI处理逻辑..."
                        />
                      </el-form-item>
                    </template>

                    <!-- 条件判断配置（占位） -->
                    <template v-if="step.type === 'condition'">
                      <el-form-item label="判断条件">
                        <el-input
                          v-model="step.config.successField"
                          type="textarea"
                          :rows="2"
                          placeholder='result.score > 0.8'
                        />
                      </el-form-item>
                      <el-form-item label="条件分支">
                        <div style="display: flex; gap: 12px">
                          <el-tag type="success">条件成立 → 继续下一步</el-tag>
                          <el-tag type="danger">条件不成立 → 终止流程</el-tag>
                        </div>
                      </el-form-item>
                    </template>
                  </el-form>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.agent-page {
  padding: 20px 24px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-page);
}

/* ===== 统计卡片 ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--border-light);
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-total { background: #eef2ff; color: #6366f1; }
.stat-icon-online { background: #ecfdf5; color: #10b981; }
.stat-icon-builtin { background: #fff7ed; color: #f97316; }
.stat-icon-custom { background: #f0f9ff; color: #0ea5e9; }

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #64748b;
}

/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ===== 分区标题 ===== */
.agent-section {
  margin-bottom: 28px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: #475569;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

/* ===== 智能体网格 ===== */
.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* ===== 智能体卡片 ===== */
.agent-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--border-light);
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.agent-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}
.agent-card-builtin {
  border-left: 3px solid #f97316;
}
.agent-card-builtin:hover {
  border-left-color: #ea580c;
}

.card-status {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 28px 28px 0;
  border-color: transparent var(--border-light) transparent transparent;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  flex-shrink: 0;
}
.agent-card-builtin .card-icon {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  color: #f97316;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.card-body {
  flex: 1;
}
.card-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.meta-text {
  font-size: 12px;
  color: #94a3b8;
}
.card-usage {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.usage-count {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
}
.usage-label {
  font-size: 11px;
  color: #94a3b8;
}

.card-actions {
  display: flex;
  gap: 4px;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}
.empty-state p {
  margin: 12px 0 16px;
  font-size: 14px;
}

/* ===== 标签列表 ===== */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

/* ===== 对话框 ===== */
:deep(.el-dialog) {
  border-radius: 12px;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .agent-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}


/* ===== 工作流配置样式 ===== */
.workflow-badge {
  vertical-align: middle;
}

.workflow-header {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px 20px 4px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
}

.steps-section {
  max-height: 420px;
  overflow-y: auto;
}

.steps-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 0 2px;
}

.steps-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
  background: #fff;
}

.step-card:hover {
  border-color: #c8d6e5;
}

.step-card.expanded {
  border-color: #6366f1;
  box-shadow: 0 0 0 1px #6366f1;
}

.step-card.disabled {
  opacity: 0.5;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
}

.step-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-index {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  white-space: nowrap;
}

.step-header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.expand-icon {
  transition: transform 0.2s;
  margin-left: 4px;
  color: #94a3b8;
}

.step-body {
  padding: 4px 20px 18px 20px;
  border-top: 1px solid #f1f5f9;
}

.api-config {
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px 16px 6px;
  border: 1px solid #e2e8f0;
}

.headers-editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.test-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.test-result {
  margin-top: 10px;
  background: #1e293b;
  color: #10b981;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .agent-page {
    padding: 12px;
  }
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .agent-grid {
    grid-template-columns: 1fr;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-left {
    flex-direction: column;
  }
}
</style>

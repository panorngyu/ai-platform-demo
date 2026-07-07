<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, computed, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  Connection,
  Refresh,
  View,
  Document,
  Coin,
  Calendar,
  Money,
  Cpu,
  Setting,
  InfoFilled
} from '@element-plus/icons-vue'
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  testProvider,
  getParams,
  updateParams,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  getUsageOverview,
  getUsageDetail,
  getUsageByFeature,
  type LlmProvider,
  type LlmParams,
  type PromptTemplate,
  type UsageOverview,
  type UsageDetailItem,
  type UsageByFeatureItem
} from '@/api/llm'

/* ===========================================================
 * Tab 切换
 * =========================================================== */
const activeTab = ref('providers')

/* ===========================================================
 * Tab 1: 供应商管理
 * =========================================================== */
const providers = ref<LlmProvider[]>([])
const providersLoading = ref(false)
const providerDialogVisible = ref(false)
const providerDialogMode = ref<'add' | 'edit'>('add')
const providerForm = reactive({
  id: 0,
  name: '',
  provider: 'wenxin',
  apiKey: '',
  model: ''
})
const providerFormRef = ref()
const providerFormRules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择类型', trigger: 'change' }],
  apiKey: [{ required: true, message: '请输入API Key', trigger: 'blur' }],
  model: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
}
const testingIds = ref<Set<number>>(new Set())
const testResults = ref<Record<number, 'success' | 'fail' | undefined>>({})

const providerTypeMap: Record<string, { label: string; tagType: string }> = {
  wenxin: { label: '文心', tagType: 'primary' },
  qianwen: { label: '通义', tagType: 'success' },
  glm: { label: 'GLM', tagType: 'warning' }
}

function maskApiKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '****' + key.slice(-4)
}

async function fetchProviders() {
  providersLoading.value = true
  try {
    const res: any = await getProviders()
    providers.value = res?.data ?? res ?? []
    if (!providers.value.length) providers.value = mockProviders()
  } catch (e) {
    providers.value = mockProviders()
  } finally {
    providersLoading.value = false
  }
}

function mockProviders(): LlmProvider[] {
  return [
    {
      id: 1,
      name: '文心一言生产环境',
      provider: 'wenxin',
      status: 'active',
      apiKey: 'sk-wenxin-abcdefgh1234567890',
      model: 'ernie-bot-4.0',
      createdAt: '2025-06-01 10:00:00'
    },
    {
      id: 2,
      name: '通义千问客服场景',
      provider: 'qianwen',
      status: 'active',
      apiKey: 'sk-qianwen-xyz1234567890abcd',
      model: 'qwen-max',
      createdAt: '2025-06-10 14:30:00'
    },
    {
      id: 3,
      name: 'GLM智能审核',
      provider: 'glm',
      status: 'inactive',
      apiKey: 'sk-glm-1234567890abcdef',
      model: 'glm-4',
      createdAt: '2025-06-15 09:20:00'
    }
  ]
}

function openProviderDialog(mode: 'add' | 'edit', row?: LlmProvider) {
  providerDialogMode.value = mode
  if (mode === 'edit' && row) {
    providerForm.id = row.id
    providerForm.name = row.name
    providerForm.provider = row.provider
    providerForm.apiKey = row.apiKey
    providerForm.model = row.model
  } else {
    providerForm.id = 0
    providerForm.name = ''
    providerForm.provider = 'wenxin'
    providerForm.apiKey = ''
    providerForm.model = ''
  }
  providerDialogVisible.value = true
}

async function submitProvider() {
  if (!providerFormRef.value) return
  await providerFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      const payload = {
        name: providerForm.name,
        provider: providerForm.provider,
        apiKey: providerForm.apiKey,
        model: providerForm.model
      }
      if (providerDialogMode.value === 'add') {
        await addProvider(payload)
        ElMessage.success('添加成功')
      } else {
        await updateProvider(providerForm.id, payload)
        ElMessage.success('更新成功')
      }
      providerDialogVisible.value = false
      fetchProviders()
    } catch (e) {
      // 错误已由拦截器提示
    }
  })
}

async function handleDeleteProvider(row: LlmProvider) {
  try {
    await ElMessageBox.confirm(
      `确定要删除供应商"${row.name}"吗？`,
      '提示',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    await deleteProvider(row.id)
    ElMessage.success('删除成功')
    fetchProviders()
  } catch (e: any) {
    if (e === 'cancel') return
  }
}

async function handleTestProvider(row: LlmProvider) {
  testingIds.value.add(row.id)
  testResults.value[row.id] = undefined
  try {
    await testProvider(row.id)
    testResults.value[row.id] = 'success'
    ElMessage.success(`${row.name} 连接成功`)
  } catch (e) {
    testResults.value[row.id] = 'fail'
    ElMessage.error(`${row.name} 连接失败`)
  } finally {
    testingIds.value.delete(row.id)
  }
}

/* ===========================================================
 * Tab 2: 模型参数配置
 * =========================================================== */
const paramsForm = reactive<LlmParams>({
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  model: 'ernie-bot-4.0',
  systemPrompt: '你是一个专业的企业级AI助手，请准确、严谨地回答用户问题。'
})
const paramsLoading = ref(false)
const paramsSaving = ref(false)
const modelOptions = [
  { label: 'ERNIE Bot 4.0（文心）', value: 'ernie-bot-4.0' },
  { label: 'ERNIE Bot Turbo（文心）', value: 'ernie-bot-turbo' },
  { label: 'Qwen-Max（通义）', value: 'qwen-max' },
  { label: 'Qwen-Plus（通义）', value: 'qwen-plus' },
  { label: 'GLM-4（智谱）', value: 'glm-4' },
  { label: 'GLM-3-Turbo（智谱）', value: 'glm-3-turbo' }
]

async function fetchParams() {
  paramsLoading.value = true
  try {
    const res: any = await getParams()
    const data = res?.data ?? res
    if (data) {
      paramsForm.temperature = data.temperature ?? 0.7
      paramsForm.topP = data.topP ?? 0.9
      paramsForm.maxTokens = data.maxTokens ?? 2048
      paramsForm.model = data.model ?? 'ernie-bot-4.0'
      paramsForm.systemPrompt = data.systemPrompt ?? ''
    }
  } catch (e) {
    // 使用默认值
  } finally {
    paramsLoading.value = false
  }
}

async function saveParams() {
  paramsSaving.value = true
  try {
    await updateParams({ ...paramsForm })
    ElMessage.success('配置已保存')
  } catch (e) {
    // 错误已提示
  } finally {
    paramsSaving.value = false
  }
}

/* ===========================================================
 * Tab 3: Prompt 模板管理
 * =========================================================== */
const templates = ref<PromptTemplate[]>([])
const templatesLoading = ref(false)
const templateDialogVisible = ref(false)
const templateDialogMode = ref<'add' | 'edit'>('add')
const templateForm = reactive({
  id: 0,
  name: '',
  category: 'audit',
  content: '',
  variables: [] as string[]
})
const newVariable = ref('')
const templateFormRef = ref()
const templateFormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}
const templateCategoryMap: Record<string, { label: string; tagType: string }> = {
  audit: { label: '智能审核', tagType: 'primary' },
  expense: { label: '报销解析', tagType: 'success' },
  contract: { label: '合同审查', tagType: 'warning' },
  report: { label: '报告生成', tagType: 'info' },
  other: { label: '其他', tagType: 'info' }
}
const categoryFilter = ref('')

const filteredTemplates = computed(() => {
  if (!categoryFilter.value) return templates.value
  return templates.value.filter((t) => t.category === categoryFilter.value)
})

const previewDialogVisible = ref(false)
const currentPreviewTemplate = ref<PromptTemplate | null>(null)
const previewVariables = reactive<Record<string, string>>({})
const previewResult = ref('')
const previewLoading = ref(false)

async function fetchTemplates() {
  templatesLoading.value = true
  try {
    const res: any = await getTemplates()
    templates.value = res?.data ?? res ?? []
    if (!templates.value.length) templates.value = mockTemplates()
  } catch (e) {
    templates.value = mockTemplates()
  } finally {
    templatesLoading.value = false
  }
}

function mockTemplates(): PromptTemplate[] {
  return [
    {
      id: 1,
      name: '合同风险审查',
      category: 'contract',
      content:
        '你是一位资深法务专家。请审查以下合同内容，识别其中的风险条款，并给出修改建议。\n\n合同名称：{{contractName}}\n合同金额：{{amount}}\n合同正文：\n{{content}}',
      variables: ['contractName', 'amount', 'content'],
      createdAt: '2025-06-01 10:00:00',
      updatedAt: '2025-06-20 15:30:00'
    },
    {
      id: 2,
      name: '报销单据解析',
      category: 'expense',
      content:
        '请解析以下报销单据图片中的关键字段，并按结构化格式输出。\n\n单据类型：{{billType}}\n图片描述：{{imageDesc}}',
      variables: ['billType', 'imageDesc'],
      createdAt: '2025-06-05 11:20:00',
      updatedAt: '2025-06-18 09:45:00'
    },
    {
      id: 3,
      name: '审核意见生成',
      category: 'audit',
      content:
        '请基于以下审批信息生成一段专业、简洁的审核意见。\n\n申请事项：{{subject}}\n申请人：{{applicant}}\n申请金额：{{amount}}\n历史审批意见：{{history}}',
      variables: ['subject', 'applicant', 'amount', 'history'],
      createdAt: '2025-06-10 14:00:00',
      updatedAt: '2025-06-22 16:10:00'
    }
  ]
}

function openTemplateDialog(mode: 'add' | 'edit', row?: PromptTemplate) {
  templateDialogMode.value = mode
  if (mode === 'edit' && row) {
    templateForm.id = row.id
    templateForm.name = row.name
    templateForm.category = row.category
    templateForm.content = row.content
    templateForm.variables = [...(row.variables || [])]
  } else {
    templateForm.id = 0
    templateForm.name = ''
    templateForm.category = 'audit'
    templateForm.content = ''
    templateForm.variables = []
  }
  newVariable.value = ''
  templateDialogVisible.value = true
}

function addVariable() {
  const v = newVariable.value.trim()
  if (!v) return
  if (templateForm.variables.includes(v)) {
    ElMessage.warning('该变量已存在')
    return
  }
  templateForm.variables.push(v)
  newVariable.value = ''
}

function removeVariable(v: string) {
  templateForm.variables = templateForm.variables.filter((x) => x !== v)
}

function insertVariableToContent(v: string) {
  templateForm.content += `{{${v}}}`
}

function varSyntax(v: string) {
  return '{{' + v + '}}'
}

async function submitTemplate() {
  if (!templateFormRef.value) return
  await templateFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      const payload = {
        name: templateForm.name,
        category: templateForm.category,
        content: templateForm.content,
        variables: templateForm.variables
      }
      if (templateDialogMode.value === 'add') {
        await createTemplate(payload)
        ElMessage.success('创建成功')
      } else {
        await updateTemplate(templateForm.id, payload)
        ElMessage.success('更新成功')
      }
      templateDialogVisible.value = false
      fetchTemplates()
    } catch (e) {
      // 错误已提示
    }
  })
}

async function handleDeleteTemplate(row: PromptTemplate) {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板"${row.name}"吗？`,
      '提示',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    await deleteTemplate(row.id)
    ElMessage.success('删除成功')
    fetchTemplates()
  } catch (e: any) {
    if (e === 'cancel') return
  }
}

function openPreviewDialog(row: PromptTemplate) {
  currentPreviewTemplate.value = row
  // 重置变量输入
  Object.keys(previewVariables).forEach((k) => delete previewVariables[k])
  ;(row.variables || []).forEach((v) => {
    previewVariables[v] = ''
  })
  // 本地预览
  previewResult.value = renderPreviewLocal(row.content, previewVariables)
  previewDialogVisible.value = true
}

function renderPreviewLocal(
  content: string,
  vars: Record<string, string>
): string {
  let result = content || ''
  Object.keys(vars).forEach((k) => {
    const val = vars[k] || `{{${k}}}`
    result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), val)
  })
  return result
}

watch(
  previewVariables,
  () => {
    if (currentPreviewTemplate.value) {
      previewResult.value = renderPreviewLocal(
        currentPreviewTemplate.value.content,
        previewVariables
      )
    }
  },
  { deep: true }
)

async function callPreviewApi() {
  if (!currentPreviewTemplate.value) return
  previewLoading.value = true
  try {
    const res: any = await previewTemplate(
      currentPreviewTemplate.value.id,
      { ...previewVariables }
    )
    const data = res?.data ?? res
    if (typeof data === 'string') {
      previewResult.value = data
    } else if (data?.result) {
      previewResult.value = data.result
    } else if (data?.content) {
      previewResult.value = data.content
    }
    ElMessage.success('已通过后端渲染')
  } catch (e) {
    // 失败时使用本地渲染
    previewResult.value = renderPreviewLocal(
      currentPreviewTemplate.value.content,
      previewVariables
    )
  } finally {
    previewLoading.value = false
  }
}

/* ===========================================================
 * Tab 4: Token 用量监控
 * =========================================================== */
const usageOverview = ref<UsageOverview | null>(null)
const usageLoading = ref(false)
const usageDetail = ref<UsageDetailItem[]>([])
const usageTotal = ref(0)
const usageDetailLoading = ref(false)
const usageQuery = reactive({
  page: 1,
  pageSize: 10,
  provider: '',
  feature: '',
  status: ''
})
const usageByFeature = ref<UsageByFeatureItem[]>([])

const featureMap: Record<string, string> = {
  audit_summary: '审核摘要',
  audit_risk: '风险审核',
  audit_opinion: '审核意见',
  expense_parse: '报销解析',
  contract_review: '合同审查'
}

const trendChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const usageCards = computed(() => {
  const o = usageOverview.value
  return [
    {
      label: '总Token消耗',
      value: o?.totalTokens ?? 0,
      unit: 'tokens',
      icon: Coin,
      gradient: 'linear-gradient(135deg, #1a3a5c 0%, #4a7bb0 100%)'
    },
    {
      label: '总费用',
      value: o?.totalCost ?? 0,
      unit: '元',
      icon: Money,
      gradient: 'linear-gradient(135deg, #e8734a 0%, #f29370 100%)'
    },
    {
      label: '今日消耗',
      value: o?.todayTokens ?? 0,
      unit: 'tokens',
      icon: Calendar,
      gradient: 'linear-gradient(135deg, #2bb673 0%, #5fc99a 100%)'
    },
    {
      label: '本月消耗',
      value: o?.monthTokens ?? 0,
      unit: 'tokens',
      icon: Cpu,
      gradient: 'linear-gradient(135deg, #9b6eff 0%, #b89aff 100%)'
    }
  ]
})

async function fetchUsageOverview() {
  usageLoading.value = true
  try {
    const res: any = await getUsageOverview()
    const data = res?.data ?? res
    if (data) {
      usageOverview.value = data
    } else {
      usageOverview.value = mockUsageOverview()
    }
  } catch (e) {
    usageOverview.value = mockUsageOverview()
  } finally {
    usageLoading.value = false
  }
  await nextTick()
  renderTrendChart()
}

function mockUsageOverview(): UsageOverview {
  const days = 15
  const trend = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      tokens: Math.floor(8000 + Math.random() * 12000)
    }
  })
  return {
    totalTokens: 1845623,
    totalCost: 1286.45,
    todayTokens: 32658,
    monthTokens: 542198,
    trend
  }
}

async function fetchUsageDetail() {
  usageDetailLoading.value = true
  try {
    const res: any = await getUsageDetail({
      page: usageQuery.page,
      pageSize: usageQuery.pageSize,
      provider: usageQuery.provider || undefined,
      feature: usageQuery.feature || undefined,
      status: usageQuery.status || undefined
    })
    const data = res?.data ?? res
    if (Array.isArray(data)) {
      usageDetail.value = data
      usageTotal.value = data.length
    } else if (data?.list) {
      usageDetail.value = data.list
      usageTotal.value = data.total ?? data.list.length
    } else {
      const mock = mockUsageDetail()
      usageDetail.value = mock
      usageTotal.value = mock.length
    }
  } catch (e) {
    const mock = mockUsageDetail()
    usageDetail.value = mock
    usageTotal.value = mock.length
  } finally {
    usageDetailLoading.value = false
  }
}

function mockUsageDetail(): UsageDetailItem[] {
  const features = Object.keys(featureMap)
  const providersList = ['wenxin', 'qianwen', 'glm']
  const statuses = ['success', 'success', 'success', 'failed']
  const list: UsageDetailItem[] = []
  for (let i = 0; i < 28; i++) {
    const d = new Date(Date.now() - i * 3600000 * 2)
    list.push({
      id: i + 1,
      time: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
      provider: providersList[i % providersList.length],
      feature: features[i % features.length],
      tokens: Math.floor(500 + Math.random() * 4500),
      cost: +(Math.random() * 4 + 0.5).toFixed(4),
      status: statuses[i % statuses.length]
    })
  }
  return list
}

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n
}

async function fetchUsageByFeature() {
  try {
    const res: any = await getUsageByFeature()
    const data = res?.data ?? res
    if (Array.isArray(data) && data.length) {
      usageByFeature.value = data
    } else {
      usageByFeature.value = mockUsageByFeature()
    }
  } catch (e) {
    usageByFeature.value = mockUsageByFeature()
  }
  await nextTick()
  renderPieChart()
}

function mockUsageByFeature(): UsageByFeatureItem[] {
  return [
    { feature: 'audit_summary', tokens: 458620, cost: 320.15 },
    { feature: 'audit_risk', tokens: 312450, cost: 218.32 },
    { feature: 'audit_opinion', tokens: 268900, cost: 187.66 },
    { feature: 'expense_parse', tokens: 412300, cost: 287.85 },
    { feature: 'contract_review', tokens: 393353, cost: 272.47 }
  ]
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendChartRef.value)
  const trend = usageOverview.value?.trend || []
  trendChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 37, 64, 0.9)',
      borderColor: '#e8734a',
      textStyle: { color: '#fff' }
    },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trend.map((t) => t.date),
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#8492a6', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: 'Token',
      nameTextStyle: { color: '#8492a6' },
      axisLine: { show: false },
      axisLabel: { color: '#8492a6', fontSize: 11 },
      splitLine: { lineStyle: { color: '#ebeef5' } }
    },
    series: [
      {
        name: 'Token消耗',
        type: 'line',
        smooth: true,
        data: trend.map((t) => t.tokens),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#e8734a', width: 2 },
        itemStyle: { color: '#e8734a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(232, 115, 74, 0.4)' },
            { offset: 1, color: 'rgba(232, 115, 74, 0)' }
          ])
        },
        animationDuration: 1200,
        animationEasing: 'cubicOut'
      }
    ]
  })
}

function renderPieChart() {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()
  pieChart = echarts.init(pieChartRef.value)
  const data = usageByFeature.value.map((d) => ({
    name: featureMap[d.feature] || d.feature,
    value: d.tokens
  }))
  pieChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 37, 64, 0.9)',
      borderColor: '#e8734a',
      textStyle: { color: '#fff' },
      formatter: '{b}: {c} tokens ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'middle',
      textStyle: { color: '#4a5568', fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#1f2d3d'
          }
        },
        data: data.map((d, i) => ({
          ...d,
          itemStyle: {
            color: [
              '#1a3a5c',
              '#e8734a',
              '#2bb673',
              '#f5a623',
              '#9b6eff'
            ][i % 5]
          }
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDuration: 1200
      }
    ]
  })
}

function handleUsagePageChange(p: number) {
  usageQuery.page = p
  fetchUsageDetail()
}

function handleUsageFilter() {
  usageQuery.page = 1
  fetchUsageDetail()
}

function featureLabel(f: string) {
  return featureMap[f] || f
}

function statusTagType(s: string) {
  return s === 'success' ? 'success' : 'danger'
}

function statusLabel(s: string) {
  return s === 'success' ? '成功' : '失败'
}

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
}

/* ===========================================================
 * 生命周期
 * =========================================================== */
onMounted(() => {
  fetchProviders()
  fetchParams()
  fetchTemplates()
  fetchUsageOverview()
  fetchUsageByFeature()
  fetchUsageDetail()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
})

// Tab 切换时刷新图表
watch(activeTab, async (val) => {
  if (val === 'usage') {
    await nextTick()
    renderTrendChart()
    renderPieChart()
  }
})
</script>

<template>
  <div class="page-container llm-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon :size="22"><Setting /></el-icon>
        </div>
        <div>
          <h2 class="page-title">大模型服务管理</h2>
          <p class="page-desc">统一管理大模型供应商接入、参数配置、Prompt模板与Token用量</p>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="llm-tabs">
      <!-- ============ Tab 1: 大模型接入管理 ============ -->
      <el-tab-pane label="大模型接入管理" name="providers">
        <div class="tab-toolbar">
          <div class="tab-toolbar-left">
            <span class="tab-stat">共 {{ providers.length }} 个供应商</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="openProviderDialog('add')">
            添加供应商
          </el-button>
        </div>

        <div v-loading="providersLoading" class="provider-grid">
          <div
            v-for="row in providers"
            :key="row.id"
            class="provider-card"
            :class="{ 'is-inactive': row.status !== 'active' }"
          >
            <div class="provider-card-header">
              <div class="provider-name">{{ row.name }}</div>
              <span
                class="status-dot"
                :class="row.status === 'active' ? 'dot-active' : 'dot-inactive'"
              ></span>
            </div>

            <div class="provider-card-body">
              <div class="provider-row">
                <span class="row-label">类型</span>
                <el-tag
                  size="small"
                  :type="(providerTypeMap[row.provider]?.tagType as any) || 'info'"
                  effect="light"
                >
                  {{ providerTypeMap[row.provider]?.label || row.provider }}
                </el-tag>
              </div>
              <div class="provider-row">
                <span class="row-label">API Key</span>
                <span class="row-value mono">{{ maskApiKey(row.apiKey) }}</span>
              </div>
              <div class="provider-row">
                <span class="row-label">模型</span>
                <span class="row-value">{{ row.model }}</span>
              </div>
              <div class="provider-row">
                <span class="row-label">创建时间</span>
                <span class="row-value muted">{{ row.createdAt }}</span>
              </div>
            </div>

            <div class="provider-card-footer">
              <el-button
                text
                size="small"
                :icon="Connection"
                :loading="testingIds.has(row.id)"
                @click="handleTestProvider(row)"
              >
                测试连接
              </el-button>
              <el-button
                text
                size="small"
                :icon="Edit"
                @click="openProviderDialog('edit', row)"
              >
                编辑
              </el-button>
              <el-button
                text
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDeleteProvider(row)"
              >
                删除
              </el-button>
            </div>

            <div
              v-if="testResults[row.id]"
              class="test-result"
              :class="testResults[row.id] === 'success' ? 'test-success' : 'test-fail'"
            >
              <el-icon><Connection /></el-icon>
              {{ testResults[row.id] === 'success' ? '连接成功' : '连接失败' }}
            </div>
          </div>

          <div v-if="!providersLoading && !providers.length" class="empty-state">
            <el-empty description="暂无供应商，请点击右上角添加" />
          </div>
        </div>
      </el-tab-pane>

      <!-- ============ Tab 2: 模型参数配置 ============ -->
      <el-tab-pane label="模型参数配置" name="params">
        <div class="params-layout" v-loading="paramsLoading">
          <div class="params-form-card">
            <div class="section-title">参数配置</div>
            <el-form :model="paramsForm" label-width="120px" label-position="right">
              <el-form-item label="温度 Temperature">
                <div class="slider-row">
                  <el-slider
                    v-model="paramsForm.temperature"
                    :min="0"
                    :max="1"
                    :step="0.1"
                    show-stops
                    style="flex:1"
                  />
                  <span class="slider-value">{{ paramsForm.temperature.toFixed(1) }}</span>
                </div>
              </el-form-item>

              <el-form-item label="Top-P">
                <div class="slider-row">
                  <el-slider
                    v-model="paramsForm.topP"
                    :min="0"
                    :max="1"
                    :step="0.05"
                    show-stops
                    style="flex:1"
                  />
                  <span class="slider-value">{{ paramsForm.topP.toFixed(2) }}</span>
                </div>
              </el-form-item>

              <el-form-item label="最大Token数">
                <el-input-number
                  v-model="paramsForm.maxTokens"
                  :min="100"
                  :max="8192"
                  :step="100"
                  style="width: 220px"
                />
              </el-form-item>

              <el-form-item label="默认模型">
                <el-select
                  v-model="paramsForm.model"
                  placeholder="请选择默认模型"
                  style="width: 320px"
                >
                  <el-option
                    v-for="opt in modelOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="系统提示词">
                <el-input
                  v-model="paramsForm.systemPrompt"
                  type="textarea"
                  :rows="6"
                  placeholder="请输入系统提示词，用于约束大模型的行为与角色"
                  maxlength="2000"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  :icon="Refresh"
                  :loading="paramsSaving"
                  @click="saveParams"
                >
                  保存配置
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="params-tip-card">
            <div class="section-title">参数说明</div>
            <ul class="tip-list">
              <li>
                <div class="tip-title">
                  <el-icon><InfoFilled /></el-icon> 温度 Temperature
                </div>
                <p>控制输出随机性，值越高生成内容越发散、有创造力；值越低越确定、保守。建议审核类场景设置 0.2-0.4，创意类 0.7-0.9。</p>
              </li>
              <li>
                <div class="tip-title">
                  <el-icon><InfoFilled /></el-icon> Top-P 核采样
                </div>
                <p>从概率累积达到 P 的候选词中采样，与 Temperature 配合使用，避免低概率词干扰输出质量。</p>
              </li>
              <li>
                <div class="tip-title">
                  <el-icon><InfoFilled /></el-icon> 最大 Token 数
                </div>
                <p>限制单次响应最大长度。1 Token 约等于 1.5 个汉字，请根据业务场景合理设置，避免成本浪费。</p>
              </li>
              <li>
                <div class="tip-title">
                  <el-icon><InfoFilled /></el-icon> 系统提示词
                </div>
                <p>定义大模型的角色与行为边界，所有对话均会携带此提示词，建议简洁明确、突出业务规则。</p>
              </li>
            </ul>
          </div>
        </div>
      </el-tab-pane>

      <!-- ============ Tab 3: Prompt模板管理 ============ -->
      <el-tab-pane label="Prompt模板管理" name="templates">
        <div class="tab-toolbar">
          <div class="tab-toolbar-left">
            <el-select
              v-model="categoryFilter"
              placeholder="按分类筛选"
              clearable
              style="width: 180px"
              @change="() => {}"
            >
              <el-option
                v-for="(meta, key) in templateCategoryMap"
                :key="key"
                :label="meta.label"
                :value="key"
              />
            </el-select>
          </div>
          <el-button type="primary" :icon="Plus" @click="openTemplateDialog('add')">
            新建模板
          </el-button>
        </div>

        <el-table
          :data="filteredTemplates"
          v-loading="templatesLoading"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="name" label="模板名称" min-width="180" />
          <el-table-column label="分类" width="130">
            <template #default="{ row }">
              <el-tag
                :type="(templateCategoryMap[row.category]?.tagType as any) || 'info'"
                effect="light"
                size="small"
              >
                {{ templateCategoryMap[row.category]?.label || row.category }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="变量数量" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="info" effect="plain" size="small">
                {{ (row.variables || []).length }} 个
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="180" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" :icon="Edit" @click="openTemplateDialog('edit', row)">
                编辑
              </el-button>
              <el-button text size="small" type="primary" :icon="View" @click="openPreviewDialog(row)">
                预览
              </el-button>
              <el-button text size="small" type="danger" :icon="Delete" @click="handleDeleteTemplate(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ============ Tab 4: Token用量监控 ============ -->
      <el-tab-pane label="Token用量监控" name="usage">
        <!-- 顶部统计卡片 -->
        <div class="usage-card-row" v-loading="usageLoading">
          <div
            v-for="card in usageCards"
            :key="card.label"
            class="usage-stat-card"
            :style="{ background: card.gradient }"
          >
            <div class="usage-stat-icon">
              <el-icon :size="26"><component :is="card.icon" /></el-icon>
            </div>
            <div class="usage-stat-info">
              <div class="usage-stat-label">{{ card.label }}</div>
              <div class="usage-stat-value">
                {{ card.value.toLocaleString() }}
                <span class="usage-stat-unit">{{ card.unit }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 图表区 -->
        <div class="usage-chart-row">
          <div class="chart-card">
            <div class="section-title">15天Token消耗趋势</div>
            <div ref="trendChartRef" class="chart-box"></div>
          </div>
          <div class="chart-card">
            <div class="section-title">按功能分布</div>
            <div ref="pieChartRef" class="chart-box"></div>
          </div>
        </div>

        <!-- 用量明细 -->
        <div class="usage-detail-card">
          <div class="section-title">用量明细</div>
          <div class="usage-filter-row">
            <el-select
              v-model="usageQuery.provider"
              placeholder="供应商"
              clearable
              style="width: 140px"
              @change="handleUsageFilter"
            >
              <el-option label="文心" value="wenxin" />
              <el-option label="通义" value="qianwen" />
              <el-option label="GLM" value="glm" />
            </el-select>
            <el-select
              v-model="usageQuery.feature"
              placeholder="功能"
              clearable
              style="width: 160px"
              @change="handleUsageFilter"
            >
              <el-option
                v-for="(label, key) in featureMap"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
            <el-select
              v-model="usageQuery.status"
              placeholder="状态"
              clearable
              style="width: 120px"
              @change="handleUsageFilter"
            >
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
          </div>

          <el-table
            :data="usageDetail"
            v-loading="usageDetailLoading"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="time" label="时间" min-width="180" />
            <el-table-column label="供应商" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">
                  {{ providerTypeMap[row.provider]?.label || row.provider }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="功能" width="130">
              <template #default="{ row }">
                {{ featureLabel(row.feature) }}
              </template>
            </el-table-column>
            <el-table-column label="Token数" width="120" align="right">
              <template #default="{ row }">
                <span class="mono">{{ row.tokens.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column label="费用(元)" width="120" align="right">
              <template #default="{ row }">
                <span class="mono">¥{{ row.cost.toFixed(4) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-row">
            <el-pagination
              v-model:current-page="usageQuery.page"
              :page-size="usageQuery.pageSize"
              :total="usageTotal"
              layout="total, prev, pager, next, jumper"
              background
              @current-change="handleUsagePageChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ============ 供应商弹窗 ============ -->
    <el-dialog
      v-model="providerDialogVisible"
      :title="providerDialogMode === 'add' ? '添加供应商' : '编辑供应商'"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="providerFormRef"
        :model="providerForm"
        :rules="providerFormRules"
        label-width="90px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="providerForm.name" placeholder="如：文心一言生产环境" />
        </el-form-item>
        <el-form-item label="类型" prop="provider">
          <el-select v-model="providerForm.provider" style="width: 100%">
            <el-option label="文心（wenxin）" value="wenxin" />
            <el-option label="通义（qianwen）" value="qianwen" />
            <el-option label="GLM（glm）" value="glm" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="providerForm.apiKey"
            type="password"
            show-password
            placeholder="请输入API Key"
          />
        </el-form-item>
        <el-form-item label="模型名称" prop="model">
          <el-input v-model="providerForm.model" placeholder="如：ernie-bot-4.0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="providerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProvider">确定</el-button>
      </template>
    </el-dialog>

    <!-- ============ Prompt模板弹窗 ============ -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="templateDialogMode === 'add' ? '新建模板' : '编辑模板'"
      width="720px"
      destroy-on-close
    >
      <el-form
        ref="templateFormRef"
        :model="templateForm"
        :rules="templateFormRules"
        label-width="90px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="如：合同风险审查" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="templateForm.category" style="width: 100%">
            <el-option
              v-for="(meta, key) in templateCategoryMap"
              :key="key"
              :label="meta.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="templateForm.content"
            type="textarea"
            :rows="8"
            placeholder="使用双花括号变量名形式声明变量，例如：contractName"
          />
        </el-form-item>
        <el-form-item label="变量列表">
          <div class="var-manager">
            <div class="var-input-row">
              <el-input
                v-model="newVariable"
                placeholder="输入变量名后回车或点击添加"
                @keyup.enter="addVariable"
                style="flex:1"
              />
              <el-button type="primary" :icon="Plus" @click="addVariable">添加</el-button>
            </div>
            <div v-if="templateForm.variables.length" class="var-tags">
              <el-tag
                v-for="v in templateForm.variables"
                :key="v"
                closable
                @close="removeVariable(v)"
                @click="insertVariableToContent(v)"
                class="var-tag"
                effect="plain"
              >
                {{ varSyntax(v) }}
              </el-tag>
            </div>
            <div class="var-tip">点击变量标签可插入到模板内容中</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTemplate">确定</el-button>
      </template>
    </el-dialog>

    <!-- ============ 模板预览弹窗 ============ -->
    <el-dialog
      v-model="previewDialogVisible"
      title="模板预览"
      width="780px"
      destroy-on-close
    >
      <div class="preview-layout" v-if="currentPreviewTemplate">
        <div class="preview-left">
          <div class="preview-section-title">
            <el-icon><Document /></el-icon> 变量输入
          </div>
          <el-form label-position="top" v-if="currentPreviewTemplate.variables?.length">
            <el-form-item
              v-for="v in currentPreviewTemplate.variables"
              :key="v"
              :label="v"
            >
              <el-input
                v-model="previewVariables[v]"
                :placeholder="`请输入 ${v}`"
                type="textarea"
                :rows="2"
              />
            </el-form-item>
          </el-form>
          <el-empty v-else description="该模板没有变量" :image-size="60" />
          <el-button
            type="primary"
            :icon="Refresh"
            :loading="previewLoading"
            @click="callPreviewApi"
            style="margin-top: 8px"
          >
            调用后端预览
          </el-button>
        </div>
        <div class="preview-right">
          <div class="preview-section-title">
            <el-icon><View /></el-icon> 实时预览
          </div>
          <div class="preview-result">{{ previewResult }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ============ 页面头部 ============ */
.llm-page {
  padding: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1a3a5c 0%, #2c5485 100%);
  border-radius: var(--radius-base);
  padding: 18px 24px;
  margin-bottom: 16px;
  color: #fff;
}
.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.page-header-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
.page-desc {
  font-size: 13px;
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.75);
}

/* ============ Tabs ============ */
.llm-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}
.llm-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}
.llm-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--accent);
}
.llm-tabs :deep(.el-tabs__item.is-active) {
  color: var(--accent);
}

/* ============ 通用工具栏 ============ */
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.tab-toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tab-stat {
  font-size: 13px;
  color: var(--text-secondary);
}

/* ============ 供应商卡片 ============ */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  min-height: 200px;
}
.provider-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-card);
  padding: 16px;
  transition: box-shadow 0.25s, transform 0.25s;
  border: 1px solid var(--border-light);
}
.provider-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}
.provider-card.is-inactive {
  opacity: 0.75;
  background: var(--bg-page);
}
.provider-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--border-light);
}
.provider-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-active {
  background: var(--success);
  box-shadow: 0 0 0 4px rgba(43, 182, 115, 0.18);
}
.dot-inactive {
  background: #c0ccda;
  box-shadow: 0 0 0 4px rgba(192, 204, 218, 0.18);
}
.provider-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.provider-row {
  display: flex;
  align-items: center;
  font-size: 13px;
}
.row-label {
  width: 80px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.row-value {
  color: var(--text-primary);
  word-break: break-all;
}
.row-value.mono {
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  font-size: 12px;
}
.row-value.muted {
  color: var(--text-secondary);
  font-size: 12px;
}
.provider-card-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
}
.test-result {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.test-success {
  background: rgba(43, 182, 115, 0.12);
  color: var(--success);
}
.test-fail {
  background: rgba(233, 79, 79, 0.12);
  color: var(--danger);
}
.empty-state {
  grid-column: 1 / -1;
  padding: 40px 0;
}

/* ============ 参数配置 ============ */
.params-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
}
.params-form-card,
.params-tip-card {
  background: var(--bg-card);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-card);
  padding: 20px;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}
.slider-value {
  width: 48px;
  text-align: right;
  font-weight: 600;
  color: var(--accent);
}
.tip-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.tip-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 4px;
  font-size: 13px;
}
.tip-list p {
  font-size: 12px;
  color: var(--text-regular);
  line-height: 1.6;
  margin: 0;
}

/* ============ Prompt模板 ============ */
.var-manager {
  width: 100%;
}
.var-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.var-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.var-tag {
  cursor: pointer;
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
}
.var-tip {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ============ 模板预览 ============ */
.preview-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: 320px;
}
.preview-left,
.preview-right {
  background: var(--bg-page);
  border-radius: var(--radius-base);
  padding: 14px;
}
.preview-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 12px;
  font-size: 14px;
}
.preview-result {
  background: #fff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-primary);
  min-height: 240px;
}

/* ============ Token用量 ============ */
.usage-card-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.usage-stat-card {
  border-radius: var(--radius-base);
  padding: 18px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-card);
  transition: transform 0.25s, box-shadow 0.25s;
}
.usage-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.usage-stat-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.usage-stat-info {
  flex: 1;
  min-width: 0;
}
.usage-stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 4px;
}
.usage-stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.usage-stat-unit {
  font-size: 12px;
  font-weight: 400;
  margin-left: 4px;
  opacity: 0.85;
}

.usage-chart-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.chart-card,
.usage-detail-card {
  background: var(--bg-card);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-card);
  padding: 16px;
}
.chart-box {
  width: 100%;
  height: 300px;
}
.usage-filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.pagination-row {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.mono {
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
}

/* ============ 响应式 ============ */
@media (max-width: 992px) {
  .params-layout {
    grid-template-columns: 1fr;
  }
  .usage-card-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .usage-chart-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .preview-layout {
    grid-template-columns: 1fr;
  }
  .provider-grid {
    grid-template-columns: 1fr;
  }
}
</style>

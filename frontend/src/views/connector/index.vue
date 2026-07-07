<script setup lang="ts">
import {
  onMounted,
  onUnmounted,
  ref,
  reactive,
  computed,
  nextTick,
  watch
} from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  Connection,
  Refresh,
  View,
  Link,
  DataLine,
  Files,
  Cpu,
  Promotion,
  Box,
  Operation,
  VideoPause,
  VideoPlay,
  Loading,
  Setting,
  Warning
} from '@element-plus/icons-vue'
import {
  getConnectors,
  getConnectorById,
  createConnector,
  updateConnector,
  deleteConnector,
  toggleConnector,
  getConnectorTemplates,
  getMonitorOverview,
  getMonitorTrend,
  getMonitorDetail,
  testConnector,
  testConnection,
  type Connector,
  type ConnectorType,
  type ConnectorStatus,
  type ConnectorTemplate,
  type MonitorOverview,
  type MonitorTrendItem,
  type MonitorDetail
} from '@/api/connector'

/* ===========================================================
 * Tab 切换
 * =========================================================== */
const activeTab = ref('manage')

/* ===========================================================
 * 类型 / 状态 映射
 * =========================================================== */
const typeMap: Record<
  ConnectorType,
  { label: string; color: string; icon: any }
> = {
  rest_api: { label: 'REST API', color: '#3b82f6', icon: Promotion },
  database: { label: '数据库直连', color: '#10b981', icon: DataLine },
  message_queue: { label: '消息队列', color: '#f59e0b', icon: Operation },
  file_transfer: { label: '文件传输', color: '#06b6d4', icon: Files },
  esb: { label: 'ESB服务总线', color: '#8b5cf6', icon: Box },
  rpa: { label: 'RPA机器人', color: '#ef4444', icon: VideoPlay }
}

const statusMap: Record<ConnectorStatus, { label: string; color: string }> = {
  running: { label: '运行中', color: '#10b981' },
  stopped: { label: '已停止', color: '#94a3b8' },
  error: { label: '异常', color: '#ef4444' }
}

/* ===========================================================
 * Tab 1: 连接器管理
 * =========================================================== */
const connectors = ref<Connector[]>([])
const listLoading = ref(false)
const filterType = ref('')
const filterStatus = ref('')
const queryForm = reactive({ page: 1, pageSize: 20 })

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const dialogSubmitting = ref(false)
const formRef = ref()
const form = reactive({
  id: 0,
  name: '',
  type: 'rest_api' as ConnectorType,
  targetType: '',
  config: {} as Record<string, any>
})
const formRules = {
  name: [{ required: true, message: '请输入连接器名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  targetType: [{ required: true, message: '请输入目标系统', trigger: 'blur' }]
}

// 模板弹窗
const templateDialogVisible = ref(false)
const templates = ref<ConnectorTemplate[]>([])
const templatesLoading = ref(false)

// 测试中状态
const testingIds = ref<Set<number>>(new Set())
const testingConfig = ref(false)

// 不同类型默认配置
const configFieldMap: Record<
  ConnectorType,
  Array<{ key: string; label: string; type?: string; placeholder?: string }>
> = {
  rest_api: [
    { key: 'baseURL', label: 'Base URL', placeholder: 'https://api.example.com' },
    {
      key: 'method',
      label: '请求方法',
      type: 'select',
      placeholder: '请选择请求方法'
    },
    { key: 'headers', label: '请求头(JSON)', placeholder: '如 {"Content-Type":"application/json"}' },
    { key: 'apiKey', label: 'API Key', placeholder: '请输入API Key' }
  ],
  database: [
    { key: 'host', label: '主机地址', placeholder: '如 127.0.0.1' },
    { key: 'port', label: '端口', placeholder: '如 3306' },
    { key: 'database', label: '数据库名', placeholder: '请输入数据库名' },
    { key: 'username', label: '用户名', placeholder: '请输入用户名' },
    { key: 'password', label: '密码', type: 'password', placeholder: '请输入密码' }
  ],
  message_queue: [
    { key: 'host', label: '主机地址', placeholder: '如 127.0.0.1' },
    { key: 'port', label: '端口', placeholder: '如 5672' },
    { key: 'queueName', label: '队列名', placeholder: '请输入队列名' },
    { key: 'exchange', label: '交换机', placeholder: '请输入交换机名' }
  ],
  file_transfer: [
    { key: 'host', label: '主机地址', placeholder: '如 127.0.0.1' },
    { key: 'port', label: '端口', placeholder: '如 21' },
    { key: 'path', label: '路径', placeholder: '如 /data/files' },
    { key: 'username', label: '用户名', placeholder: '请输入用户名' },
    { key: 'password', label: '密码', type: 'password', placeholder: '请输入密码' }
  ],
  esb: [
    { key: 'wsdlUrl', label: 'WSDL地址', placeholder: '如 http://esb.example.com/ws?wsdl' },
    { key: 'serviceName', label: '服务名称', placeholder: '请输入服务名称' }
  ],
  rpa: [
    { key: 'scriptPath', label: '脚本路径', placeholder: '如 /scripts/rpa_task.py' },
    { key: 'targetApp', label: '目标应用', placeholder: '如 SAP / 用友U8' }
  ]
}

const currentFields = computed(() => configFieldMap[form.type] || [])

const statCards = computed(() => {
  const total = connectors.value.length
  const running = connectors.value.filter((c) => c.status === 'running').length
  const stopped = connectors.value.filter((c) => c.status === 'stopped').length
  const error = connectors.value.filter((c) => c.status === 'error').length
  return [
    { label: '总连接器数', value: total, color: 'linear-gradient(135deg,#1a3a5c,#4a7bb0)', icon: Connection },
    { label: '运行中', value: running, color: 'linear-gradient(135deg,#10b981,#34d399)', icon: VideoPlay },
    { label: '已停止', value: stopped, color: 'linear-gradient(135deg,#94a3b8,#cbd5e1)', icon: VideoPause },
    { label: '异常数', value: error, color: 'linear-gradient(135deg,#ef4444,#f87171)', icon: Warning }
  ]
})

function getDefaultConfig(type: ConnectorType): Record<string, any> {
  const conf: Record<string, any> = {}
  configFieldMap[type].forEach((f) => {
    if (f.key === 'method') conf[f.key] = 'GET'
    else conf[f.key] = ''
  })
  return conf
}

async function fetchConnectors() {
  listLoading.value = true
  try {
    const params: any = {
      page: queryForm.page,
      pageSize: queryForm.pageSize
    }
    if (filterType.value) params.type = filterType.value
    if (filterStatus.value) params.status = filterStatus.value
    const res: any = await getConnectors(params)
    const list = res?.data ?? res ?? []
    if (Array.isArray(list) && list.length) {
      connectors.value = list
    } else {
      connectors.value = mockConnectors()
    }
  } catch (e) {
    connectors.value = mockConnectors()
  } finally {
    listLoading.value = false
  }
}

function mockConnectors(): Connector[] {
  return [
    {
      id: 1,
      name: 'ERP订单接口',
      type: 'rest_api',
      targetType: 'SAP S/4HANA',
      config: {
        baseURL: 'https://erp.jml.com/api',
        method: 'GET',
        headers: '{"Content-Type":"application/json"}',
        apiKey: 'sk-erp-1234'
      },
      status: 'running',
      syncCount: 1280,
      lastSyncTime: '2026-07-06 09:12:33',
      createdAt: '2026-05-01 10:00:00',
      updatedAt: '2026-07-01 14:00:00'
    },
    {
      id: 2,
      name: 'MES生产数据库',
      type: 'database',
      targetType: 'MES系统',
      config: {
        host: '10.0.1.20',
        port: 3306,
        database: 'mes_prod',
        username: 'mes_user',
        password: '******'
      },
      status: 'running',
      syncCount: 860,
      lastSyncTime: '2026-07-06 08:50:11',
      createdAt: '2026-05-10 09:30:00',
      updatedAt: '2026-06-20 15:00:00'
    },
    {
      id: 3,
      name: 'WMS出库消息',
      type: 'message_queue',
      targetType: 'WMS仓储系统',
      config: {
        host: '10.0.1.30',
        port: 5672,
        queueName: 'wms_outbound',
        exchange: 'wms_exchange'
      },
      status: 'stopped',
      syncCount: 320,
      lastSyncTime: '2026-07-05 17:45:00',
      createdAt: '2026-05-15 11:20:00',
      updatedAt: '2026-06-25 10:00:00'
    },
    {
      id: 4,
      name: '财务报表传输',
      type: 'file_transfer',
      targetType: '财务共享中心',
      config: {
        host: 'ftp.jml.com',
        port: 21,
        path: '/finance/reports',
        username: 'fin_user',
        password: '******'
      },
      status: 'error',
      syncCount: 56,
      lastSyncTime: '2026-07-04 22:10:00',
      createdAt: '2026-06-01 08:00:00',
      updatedAt: '2026-07-04 22:10:00'
    },
    {
      id: 5,
      name: 'ESB订单服务',
      type: 'esb',
      targetType: '集团ESB总线',
      config: {
        wsdlUrl: 'http://esb.jml.com/ws/order?wsdl',
        serviceName: 'OrderService'
      },
      status: 'running',
      syncCount: 410,
      lastSyncTime: '2026-07-06 09:00:00',
      createdAt: '2026-06-10 14:00:00',
      updatedAt: '2026-07-01 09:00:00'
    },
    {
      id: 6,
      name: 'RPA对账机器人',
      type: 'rpa',
      targetType: '金蝶K3',
      config: {
        scriptPath: '/scripts/reconcile.py',
        targetApp: '金蝶K3'
      },
      status: 'stopped',
      syncCount: 88,
      lastSyncTime: '2026-07-03 18:00:00',
      createdAt: '2026-06-15 10:00:00',
      updatedAt: '2026-07-03 18:00:00'
    }
  ]
}

function openDialog(mode: 'add' | 'edit', row?: Connector) {
  dialogMode.value = mode
  if (mode === 'edit' && row) {
    form.id = row.id
    form.name = row.name
    form.type = row.type
    form.targetType = row.targetType
    form.config = { ...getDefaultConfig(row.type), ...(row.config || {}) }
  } else {
    form.id = 0
    form.name = ''
    form.type = 'rest_api'
    form.targetType = ''
    form.config = getDefaultConfig('rest_api')
  }
  dialogVisible.value = true
}

// 切换类型时重置配置
watch(
  () => form.type,
  (newType, oldType) => {
    if (!dialogVisible.value) return
    if (newType !== oldType) {
      form.config = getDefaultConfig(newType)
    }
  }
)

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    dialogSubmitting.value = true
    try {
      const payload = {
        name: form.name,
        type: form.type,
        targetType: form.targetType,
        config: form.config
      }
      if (dialogMode.value === 'edit') {
        await updateConnector(form.id, payload)
        ElMessage.success('连接器已更新')
      } else {
        await createConnector(payload)
        ElMessage.success('连接器已创建')
      }
      dialogVisible.value = false
      fetchConnectors()
    } catch (e) {
      // 失败提示由拦截器处理
    } finally {
      dialogSubmitting.value = false
    }
  })
}

async function handleDelete(row: Connector) {
  try {
    await ElMessageBox.confirm(
      `确定要删除连接器「${row.name}」吗？`,
      '提示',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    await deleteConnector(row.id)
    ElMessage.success('已删除')
    fetchConnectors()
  } catch (e) {
    /* 用户取消 */
  }
}

async function handleToggle(row: Connector) {
  const action = row.status === 'running' ? 'stop' : 'start'
  try {
    await toggleConnector(row.id, action)
    ElMessage.success(action === 'start' ? '已启用' : '已停用')
    fetchConnectors()
  } catch (e) {
    /* */
  }
}

async function handleTestRow(row: Connector) {
  testingIds.value.add(row.id)
  try {
    await testConnector(row.id)
    ElMessage.success(`连接器「${row.name}」测试成功`)
  } catch (e) {
    /* */
  } finally {
    testingIds.value.delete(row.id)
  }
}

async function handleTestConfig() {
  testingConfig.value = true
  try {
    await testConnection({
      type: form.type,
      targetType: form.targetType,
      config: form.config
    })
    ElMessage.success('连接测试成功')
  } catch (e) {
    /* */
  } finally {
    testingConfig.value = false
  }
}

function applyTemplate(tpl: ConnectorTemplate) {
  form.name = tpl.name + '副本'
  form.type = tpl.type
  form.targetType = tpl.targetType
  form.config = { ...getDefaultConfig(tpl.type), ...(tpl.config || {}) }
  templateDialogVisible.value = false
  dialogVisible.value = true
}

async function fetchTemplates() {
  templatesLoading.value = true
  try {
    const res: any = await getConnectorTemplates()
    const list = res?.data ?? res ?? []
    if (Array.isArray(list) && list.length) {
      templates.value = list
    } else {
      templates.value = mockTemplates()
    }
  } catch (e) {
    templates.value = mockTemplates()
  } finally {
    templatesLoading.value = false
  }
}

function mockTemplates(): ConnectorTemplate[] {
  return [
    {
      id: 1,
      name: 'SAP订单接口模板',
      type: 'rest_api',
      targetType: 'SAP S/4HANA',
      description: '对接SAP订单查询接口，支持订单列表与详情同步',
      config: {
        baseURL: 'https://erp.jml.com/api/sap/orders',
        method: 'GET',
        headers: '{"Content-Type":"application/json"}',
        apiKey: ''
      }
    },
    {
      id: 2,
      name: 'MES生产数据库模板',
      type: 'database',
      targetType: 'MES系统',
      description: '直连MySQL生产库，同步工单、产量、设备状态数据',
      config: {
        host: '10.0.1.20',
        port: 3306,
        database: 'mes_prod',
        username: '',
        password: ''
      }
    },
    {
      id: 3,
      name: 'RabbitMQ出库消息模板',
      type: 'message_queue',
      targetType: 'WMS仓储系统',
      description: '订阅WMS出库消息队列，实时获取出库单状态变更',
      config: {
        host: '10.0.1.30',
        port: 5672,
        queueName: 'wms_outbound',
        exchange: 'wms_exchange'
      }
    },
    {
      id: 4,
      name: '财务报表FTP模板',
      type: 'file_transfer',
      targetType: '财务共享中心',
      description: '通过FTP定时拉取财务月报、季报、年报Excel文件',
      config: {
        host: 'ftp.jml.com',
        port: 21,
        path: '/finance/reports',
        username: '',
        password: ''
      }
    },
    {
      id: 5,
      name: '集团ESB订单服务模板',
      type: 'esb',
      targetType: '集团ESB总线',
      description: '通过WSDL对接集团ESB总线，调用订单同步Web Service',
      config: {
        wsdlUrl: 'http://esb.jml.com/ws/order?wsdl',
        serviceName: 'OrderService'
      }
    },
    {
      id: 6,
      name: 'RPA对账机器人模板',
      type: 'rpa',
      targetType: '金蝶K3',
      description: 'RPA机器人定时执行银企对账脚本，输出对账结果',
      config: {
        scriptPath: '/scripts/reconcile.py',
        targetApp: '金蝶K3'
      }
    }
  ]
}

function resetFilter() {
  filterType.value = ''
  filterStatus.value = ''
  queryForm.page = 1
  fetchConnectors()
}

/* ===========================================================
 * Tab 2: 监控
 * =========================================================== */
const monitorOverview = ref<MonitorOverview>({
  total: 0,
  running: 0,
  stopped: 0,
  error: 0,
  todaySyncCount: 0,
  avgLatency: 0
})
const monitorLoading = ref(false)
const monitorTrend = ref<MonitorTrendItem[]>([])
const monitorList = ref<Array<MonitorDetail & { loading?: boolean; expanded?: boolean }>>([])

const monitorCards = computed(() => [
  { label: '总连接器', value: monitorOverview.value.total, color: 'linear-gradient(135deg,#1a3a5c,#4a7bb0)', icon: Connection },
  { label: '运行中', value: monitorOverview.value.running, color: 'linear-gradient(135deg,#10b981,#34d399)', icon: VideoPlay },
  { label: '已停止', value: monitorOverview.value.stopped, color: 'linear-gradient(135deg,#94a3b8,#cbd5e1)', icon: VideoPause },
  { label: '异常', value: monitorOverview.value.error, color: 'linear-gradient(135deg,#ef4444,#f87171)', icon: Warning },
  { label: '今日同步次数', value: monitorOverview.value.todaySyncCount, color: 'linear-gradient(135deg,#3b82f6,#60a5fa)', icon: DataLine },
  { label: '平均延迟(ms)', value: monitorOverview.value.avgLatency, color: 'linear-gradient(135deg,#e8734a,#f59e0b)', icon: Cpu }
])

let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
const trendChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)

async function fetchMonitorData() {
  monitorLoading.value = true
  try {
    const [ovRes, trendRes]: any[] = await Promise.all([
      getMonitorOverview(),
      getMonitorTrend()
    ])
    const ov = ovRes?.data ?? ovRes
    if (ov && typeof ov === 'object' && ov.total !== undefined) {
      monitorOverview.value = ov
    } else {
      mockMonitorOverview()
    }
    const trend = trendRes?.data ?? trendRes ?? []
    monitorTrend.value = Array.isArray(trend) && trend.length ? trend : mockTrend()
    initCharts()
    // 监控列表基于现有连接器构造
    loadMonitorListFromConnectors()
  } catch (e) {
    mockMonitorOverview()
    monitorTrend.value = mockTrend()
    initCharts()
    loadMonitorListFromConnectors()
  } finally {
    monitorLoading.value = false
  }
}

function mockMonitorOverview() {
  const list = connectors.value.length ? connectors.value : mockConnectors()
  monitorOverview.value = {
    total: list.length,
    running: list.filter((c) => c.status === 'running').length,
    stopped: list.filter((c) => c.status === 'stopped').length,
    error: list.filter((c) => c.status === 'error').length,
    todaySyncCount: 348,
    avgLatency: 186
  }
}

function mockTrend(): MonitorTrendItem[] {
  const result: MonitorTrendItem[] = []
  const today = new Date('2026-07-06T00:00:00')
  for (let i = 14; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    result.push({
      date,
      successCount: 200 + Math.floor(Math.random() * 200),
      failCount: Math.floor(Math.random() * 30)
    })
  }
  return result
}

function loadMonitorListFromConnectors() {
  const list = connectors.value.length ? connectors.value : mockConnectors()
  monitorList.value = list.map((c) => ({
    connectorId: c.id,
    connectorName: c.name,
    status: c.status,
    syncCount: c.syncCount,
    errorCount: c.status === 'error' ? Math.floor(c.syncCount * 0.05) : Math.floor(c.syncCount * 0.01),
    latency: 80 + Math.floor(Math.random() * 250),
    lastSyncTime: c.lastSyncTime,
    recentRecords: buildMockRecords(),
    loading: false,
    expanded: false
  }))
}

function buildMockRecords() {
  const statuses: Array<'success' | 'fail'> = ['success', 'success', 'success', 'fail', 'success']
  return Array.from({ length: 10 }).map((_, i) => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - i * 17)
    const status = statuses[i % statuses.length]
    return {
      time: formatTime(d),
      status,
      recordCount: 50 + Math.floor(Math.random() * 200),
      duration: 80 + Math.floor(Math.random() * 400),
      message: status === 'success' ? '同步成功' : '连接超时，建议检查网络'
    }
  })
}

function formatTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function initCharts() {
  nextTick(() => {
    if (trendChartRef.value) {
      if (trendChart) trendChart.dispose()
      trendChart = echarts.init(trendChartRef.value)
      trendChart.setOption(buildTrendOption())
    }
    if (pieChartRef.value) {
      if (pieChart) pieChart.dispose()
      pieChart = echarts.init(pieChartRef.value)
      pieChart.setOption(buildPieOption())
    }
  })
}

function buildTrendOption(): echarts.EChartsOption {
  const dates = monitorTrend.value.map((t) => t.date.slice(5))
  const success = monitorTrend.value.map((t) => t.successCount)
  const fail = monitorTrend.value.map((t) => t.failCount)
  return {
    title: { text: '近15天同步趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功次数', '失败次数'], bottom: 0 },
    grid: { left: 40, right: 20, top: 50, bottom: 40 },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#cbd5e1' } } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#cbd5e1' } } },
    series: [
      {
        name: '成功次数',
        type: 'line',
        smooth: true,
        data: success,
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16,185,129,0.35)' },
            { offset: 1, color: 'rgba(16,185,129,0)' }
          ])
        }
      },
      {
        name: '失败次数',
        type: 'line',
        smooth: true,
        data: fail,
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239,68,68,0.35)' },
            { offset: 1, color: 'rgba(239,68,68,0)' }
          ])
        }
      }
    ]
  }
}

function buildPieOption(): echarts.EChartsOption {
  const ov = monitorOverview.value
  return {
    title: { text: '连接器状态分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        name: '状态',
        type: 'pie',
        radius: ['40%', '65%'],
        avoidLabelOverlap: false,
        label: { show: true, formatter: '{b}\n{c}' },
        data: [
          { value: ov.running, name: '运行中', itemStyle: { color: '#10b981' } },
          { value: ov.stopped, name: '已停止', itemStyle: { color: '#94a3b8' } },
          { value: ov.error, name: '异常', itemStyle: { color: '#ef4444' } }
        ]
      }
    ]
  }
}

async function toggleExpand(row: MonitorDetail & { loading?: boolean; expanded?: boolean }) {
  const target = monitorList.value.find((r) => r.connectorId === row.connectorId)
  if (!target) return
  if (target.expanded) {
    target.expanded = false
    return
  }
  target.expanded = true
  if (target.recentRecords && target.recentRecords.length) return
  target.loading = true
  try {
    const res: any = await getMonitorDetail(target.connectorId)
    const detail = res?.data ?? res
    if (detail && Array.isArray(detail.recentRecords)) {
      target.recentRecords = detail.recentRecords
    }
  } catch (e) {
    /* 保留 mock */
  } finally {
    target.loading = false
  }
}

/* ===========================================================
 * Tab 3: 模板库
 * =========================================================== */
const tplLibLoading = ref(false)
const tplList = ref<ConnectorTemplate[]>([])

async function fetchTplLibrary() {
  tplLibLoading.value = true
  try {
    const res: any = await getConnectorTemplates()
    const list = res?.data ?? res ?? []
    tplList.value = Array.isArray(list) && list.length ? list : mockTemplates()
  } catch (e) {
    tplList.value = mockTemplates()
  } finally {
    tplLibLoading.value = false
  }
}

function useTemplate(tpl: ConnectorTemplate) {
  applyTemplate(tpl)
  activeTab.value = 'manage'
}

/* ===========================================================
 * 生命周期
 * =========================================================== */
function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
}

watch(activeTab, (val) => {
  if (val === 'monitor') {
    fetchMonitorData()
  } else if (val === 'library') {
    fetchTplLibrary()
  }
})

onMounted(() => {
  fetchConnectors()
  fetchTemplates()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
})
</script>

<template>
  <div class="connector-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title-wrap">
        <el-icon class="title-icon"><Connection /></el-icon>
        <h2 class="title-text">连接器管理</h2>
        <span class="title-sub">统一管理对外系统集成连接器</span>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="connector-tabs">
      <!-- ============ Tab 1: 连接器管理 ============ -->
      <el-tab-pane label="连接器管理" name="manage">
        <!-- 统计卡片 -->
        <div class="stat-row">
          <div
            v-for="(card, idx) in statCards"
            :key="idx"
            class="stat-card"
            :style="{ background: card.color }"
          >
            <div class="stat-icon">
              <el-icon :size="22"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </div>

        <!-- 筛选 + 操作 -->
        <div class="toolbar">
          <div class="filter-area">
            <el-select
              v-model="filterType"
              placeholder="全部类型"
              clearable
              style="width: 180px"
              @change="fetchConnectors"
            >
              <el-option
                v-for="(item, key) in typeMap"
                :key="key"
                :label="item.label"
                :value="key"
              />
            </el-select>
            <el-select
              v-model="filterStatus"
              placeholder="全部状态"
              clearable
              style="width: 160px"
              @change="fetchConnectors"
            >
              <el-option label="运行中" value="running" />
              <el-option label="已停止" value="stopped" />
              <el-option label="异常" value="error" />
            </el-select>
            <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
          </div>
          <div class="action-area">
            <el-button type="warning" :icon="Files" @click="templateDialogVisible = true">
              从模板创建
            </el-button>
            <el-button type="primary" :icon="Plus" @click="openDialog('add')">
              新建连接器
            </el-button>
          </div>
        </div>

        <!-- 列表 -->
        <el-table
          v-loading="listLoading"
          :data="connectors"
          stripe
          border
          style="width: 100%"
        >
          <el-table-column label="名称" min-width="200">
            <template #default="{ row }">
              <div class="name-cell">
                <el-icon
                  class="type-icon"
                  :style="{ color: typeMap[row.type as ConnectorType]?.color }"
                >
                  <component :is="typeMap[row.type as ConnectorType]?.icon" />
                </el-icon>
                <span class="name-text">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="130">
            <template #default="{ row }">
              <el-tag
                :color="typeMap[row.type as ConnectorType]?.color"
                effect="dark"
                round
              >
                {{ typeMap[row.type as ConnectorType]?.label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetType" label="目标系统" min-width="140" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <div class="status-cell">
                <span
                  class="status-dot"
                  :style="{ background: statusMap[row.status as ConnectorStatus]?.color }"
                ></span>
                <span>{{ statusMap[row.status as ConnectorStatus]?.label }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="syncCount" label="同步次数" width="100" align="right" />
          <el-table-column prop="lastSyncTime" label="最后同步时间" width="170" />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                :type="row.status === 'running' ? 'warning' : 'success'"
                :icon="row.status === 'running' ? VideoPause : VideoPlay"
                link
                @click="handleToggle(row)"
              >
                {{ row.status === 'running' ? '停用' : '启用' }}
              </el-button>
              <el-button
                size="small"
                type="primary"
                :icon="Loading"
                link
                :loading="testingIds.has(row.id)"
                @click="handleTestRow(row)"
              >
                测试
              </el-button>
              <el-button
                size="small"
                type="primary"
                :icon="Edit"
                link
                @click="openDialog('edit', row)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                link
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ============ Tab 2: 监控 ============ -->
      <el-tab-pane label="连接器监控" name="monitor">
        <div v-loading="monitorLoading">
          <!-- 概览卡片 -->
          <div class="stat-row">
            <div
              v-for="(card, idx) in monitorCards"
              :key="idx"
              class="stat-card"
              :style="{ background: card.color }"
            >
              <div class="stat-icon">
                <el-icon :size="22"><component :is="card.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ card.value }}</div>
                <div class="stat-label">{{ card.label }}</div>
              </div>
            </div>
          </div>

          <!-- 图表 -->
          <div class="chart-row">
            <div class="chart-box">
              <div ref="trendChartRef" class="chart-canvas"></div>
            </div>
            <div class="chart-box">
              <div ref="pieChartRef" class="chart-canvas"></div>
            </div>
          </div>

          <!-- 监控列表 -->
          <h3 class="section-title">连接器实时状态</h3>
          <el-table :data="monitorList" stripe border style="width: 100%">
            <el-table-column type="expand" width="50">
              <template #default="{ row }">
                <div class="expand-wrap" v-loading="row.loading">
                  <div v-if="row.recentRecords && row.recentRecords.length" class="record-list">
                    <div class="record-title">最近10条同步记录</div>
                    <el-table :data="row.recentRecords" size="small" border>
                      <el-table-column prop="time" label="时间" width="170" />
                      <el-table-column label="状态" width="100">
                        <template #default="{ row: r }">
                          <el-tag
                            :type="r.status === 'success' ? 'success' : 'danger'"
                            size="small"
                          >
                            {{ r.status === 'success' ? '成功' : '失败' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="recordCount" label="记录数" width="100" align="right" />
                      <el-table-column prop="duration" label="耗时(ms)" width="120" align="right" />
                      <el-table-column prop="message" label="消息" min-width="200" />
                    </el-table>
                  </div>
                  <el-empty v-else description="暂无同步记录" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="connectorName" label="连接器名称" min-width="160" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <div class="status-cell">
                  <span
                    class="status-dot"
                    :style="{ background: statusMap[row.status as ConnectorStatus]?.color }"
                  ></span>
                  <span>{{ statusMap[row.status as ConnectorStatus]?.label }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="syncCount" label="同步次数" width="120" align="right" />
            <el-table-column prop="errorCount" label="错误次数" width="120" align="right">
              <template #default="{ row }">
                <span :class="{ 'err-num': row.errorCount > 0 }">{{ row.errorCount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="latency" label="延迟(ms)" width="120" align="right" />
            <el-table-column prop="lastSyncTime" label="最后同步时间" min-width="170" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  :icon="View"
                  link
                  @click="toggleExpand(row)"
                >
                  {{ row.expanded ? '收起' : '详情' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- ============ Tab 3: 模板库 ============ -->
      <el-tab-pane label="连接器模板库" name="library">
        <div v-loading="tplLibLoading" class="tpl-grid">
          <div
            v-for="tpl in tplList"
            :key="tpl.id"
            class="tpl-card"
          >
            <div class="tpl-card-head" :style="{ background: typeMap[tpl.type]?.color }">
              <el-icon :size="26">
                <component :is="typeMap[tpl.type]?.icon" />
              </el-icon>
            </div>
            <div class="tpl-card-body">
              <div class="tpl-card-title">{{ tpl.name }}</div>
              <div class="tpl-card-tags">
                <el-tag size="small" :color="typeMap[tpl.type]?.color" effect="dark">
                  {{ typeMap[tpl.type]?.label }}
                </el-tag>
                <el-tag size="small" type="info" effect="plain">
                  {{ tpl.targetType }}
                </el-tag>
              </div>
              <div class="tpl-card-desc">{{ tpl.description }}</div>
              <el-button
                type="primary"
                :icon="Link"
                class="tpl-use-btn"
                @click="useTemplate(tpl)"
              >
                使用此模板
              </el-button>
            </div>
          </div>
          <el-empty
            v-if="!tplLibLoading && !tplList.length"
            description="暂无模板"
            class="tpl-empty"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ============ 新建/编辑弹窗 ============ -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'edit' ? '编辑连接器' : '新建连接器'"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入连接器名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option
              v-for="(item, key) in typeMap"
              :key="key"
              :label="item.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标系统" prop="targetType">
          <el-input v-model="form.targetType" placeholder="请输入目标系统名称" />
        </el-form-item>

        <el-divider content-position="left">
          <el-icon><Setting /></el-icon>
          <span style="margin-left: 4px">连接配置</span>
        </el-divider>

        <el-form-item
          v-for="field in currentFields"
          :key="field.key"
          :label="field.label"
        >
          <el-select
            v-if="field.type === 'select' && field.key === 'method'"
            v-model="form.config[field.key]"
            placeholder="请选择请求方法"
            style="width: 100%"
          >
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
          <el-input
            v-else-if="field.type === 'password'"
            v-model="form.config[field.key]"
            type="password"
            show-password
            :placeholder="field.placeholder"
          />
          <el-input
            v-else
            v-model="form.config[field.key]"
            :placeholder="field.placeholder"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            type="success"
            :icon="Loading"
            :loading="testingConfig"
            @click="handleTestConfig"
          >
            测试连接
          </el-button>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="dialogSubmitting"
            @click="submitForm"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 从模板创建弹窗 ============ -->
    <el-dialog
      v-model="templateDialogVisible"
      title="从模板创建连接器"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-loading="templatesLoading" class="template-grid">
        <div
          v-for="tpl in templates"
          :key="tpl.id"
          class="template-card"
          @click="applyTemplate(tpl)"
        >
          <div
            class="template-icon"
            :style="{ background: typeMap[tpl.type]?.color }"
          >
            <el-icon :size="22">
              <component :is="typeMap[tpl.type]?.icon" />
            </el-icon>
          </div>
          <div class="template-info">
            <div class="template-name">{{ tpl.name }}</div>
            <div class="template-meta">
              <el-tag size="small" :color="typeMap[tpl.type]?.color" effect="dark">
                {{ typeMap[tpl.type]?.label }}
              </el-tag>
              <span class="template-target">{{ tpl.targetType }}</span>
            </div>
            <div class="template-desc">{{ tpl.description }}</div>
          </div>
        </div>
        <el-empty
          v-if="!templatesLoading && !templates.length"
          description="暂无模板"
        />
      </div>
      <template #footer>
        <el-button @click="templateDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.connector-page {
  padding: 16px 20px 24px;
}

/* ============ 页头 ============ */
.page-header {
  margin-bottom: 12px;
}
.page-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon {
  font-size: 24px;
  color: #1a3a5c;
  background: rgba(232, 115, 74, 0.1);
  padding: 6px;
  border-radius: 8px;
}
.title-text {
  font-size: 20px;
  font-weight: 600;
  color: #1a3a5c;
  margin: 0;
}
.title-sub {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 6px;
}

.connector-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}
.connector-tabs :deep(.el-tabs__active-bar) {
  background-color: #e8734a;
}
.connector-tabs :deep(.el-tabs__item.is-active) {
  color: #e8734a;
}

/* ============ 统计卡片 ============ */
.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 16px 18px;
  border-radius: 10px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}

/* ============ 工具栏 ============ */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.filter-area,
.action-area {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ============ 表格 ============ */
.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.type-icon {
  font-size: 16px;
}
.name-text {
  font-weight: 500;
  color: #1a3a5c;
}
.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.err-num {
  color: #ef4444;
  font-weight: 600;
}

/* ============ 监控 ============ */
.chart-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.chart-box {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.chart-canvas {
  width: 100%;
  height: 300px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3a5c;
  margin: 16px 0 10px;
  padding-left: 8px;
  border-left: 3px solid #e8734a;
}
.expand-wrap {
  padding: 12px 20px;
  background: #fafafa;
}
.record-title {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 500;
}

/* ============ 模板库 ============ */
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.tpl-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.25s;
  display: flex;
  flex-direction: column;
}
.tpl-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
.tpl-card-head {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.tpl-card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tpl-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a5c;
}
.tpl-card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tpl-card-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  min-height: 42px;
}
.tpl-use-btn {
  align-self: flex-start;
  margin-top: 4px;
}
.tpl-empty {
  grid-column: 1 / -1;
}

/* ============ 模板弹窗 ============ */
.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}
.template-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.template-card:hover {
  border-color: #e8734a;
  box-shadow: 0 4px 12px rgba(232, 115, 74, 0.15);
  transform: translateY(-2px);
}
.template-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.template-info {
  flex: 1;
  min-width: 0;
}
.template-name {
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 4px;
}
.template-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.template-target {
  font-size: 12px;
  color: #64748b;
}
.template-desc {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

/* ============ 弹窗底部 ============ */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ============ 响应式 ============ */
@media (max-width: 1024px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
  .tpl-grid,
  .template-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-area,
  .action-area {
    width: 100%;
  }
  .filter-area .el-select,
  .action-area .el-button {
    flex: 1;
  }
}
</style>

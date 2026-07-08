<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Lock,
  Key,
  Hide,
  DocumentCopy,
  CopyDocument,
  UserFilled,
  Connection,
  Check,
  Cpu,
  Monitor,
  Bell,
  Postcard,
  Search,
  Refresh,
  ShoppingCart,
  Message,
  Warning,
  CircleCheck,
  CircleClose,
  Link,
  Edit,
  Tickets,
  Files,
  DataLine,
  Wallet
} from '@element-plus/icons-vue'
import {
  getSecurityConfig,
  updateSecurityConfig,
  getAccessConfig,
  updateAccessConfig,
  getAuditLogs,
  getAuditDataLogs,
  getAuditStats,
  getSystemMonitor,
  getAppMonitor,
  getMonitorLogs,
  getAlerts,
  getDepartments,
  getPositions,
  getUsers,
  toggleUserStatus,
  getRoles,
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
  getLoginLogs,
  getOperationLogs,
  getApiCallLogs,
  getErrorLogs,
  getLogStats,
  type SecurityConfig,
  type AccessConfig,
  type AuditLog,
  type AuditDataLog,
  type AuditStats,
  type SystemMonitor,
  type AppMonitor,
  type SystemLog,
  type AlertItem,
  type Department,
  type Position,
  type SystemUser,
  type Role,
  type Permission,
  type ThirdPartySystem,
  type ThirdPartySystemListItem,
  type ThirdPartySystemParam,
  type ConnectionTestResult,
  getThirdPartySystems,
  getThirdPartySystemDetail,
  updateThirdPartySystemConfig,
  testThirdPartyConnection,
  toggleThirdPartySystem
} from '@/api/systemAdmin'

/* ============================================================
 * 公共状态
 * ============================================================ */
const activeTab = ref('security')

/* ============================================================
 * Tab1: 安全管理
 * ============================================================ */
const securityConfig = ref<SecurityConfig | null>(null)
const accessConfig = ref<AccessConfig | null>(null)
const securityLoading = ref(false)
const accessLoading = ref(false)
const securitySaving = ref(false)
const accessSaving = ref(false)

async function fetchSecurityConfig() {
  securityLoading.value = true
  try {
    const res = await getSecurityConfig()
    securityConfig.value = res.data
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    securityLoading.value = false
  }
}

async function fetchAccessConfig() {
  accessLoading.value = true
  try {
    const res = await getAccessConfig()
    accessConfig.value = res.data
  } catch (e) {
    // ignore
  } finally {
    accessLoading.value = false
  }
}

async function saveSecurityConfig() {
  if (!securityConfig.value) return
  securitySaving.value = true
  try {
    await updateSecurityConfig(securityConfig.value)
    ElMessage.success('数据安全配置已保存')
  } catch (e) {
    // ignore
  } finally {
    securitySaving.value = false
  }
}

async function saveAccessConfig() {
  if (!accessConfig.value) return
  accessSaving.value = true
  try {
    await updateAccessConfig(accessConfig.value)
    ElMessage.success('访问安全配置已保存')
  } catch (e) {
    // ignore
  } finally {
    accessSaving.value = false
  }
}

/* ============================================================
 * Tab2: 审计与合规
 * ============================================================ */
const auditStats = ref<AuditStats | null>(null)
const auditLogs = ref<AuditLog[]>([])
const auditDataLogs = ref<AuditDataLog[]>([])
const auditLogsTotal = ref(0)
const auditDataLogsTotal = ref(0)
const auditLoading = ref(false)
const auditDataLoading = ref(false)
const statsLoading = ref(false)

const auditQuery = reactive({
  page: 1,
  pageSize: 10,
  module: '',
  action: '',
  status: ''
})

const auditDataQuery = reactive({
  page: 1,
  pageSize: 10,
  dataType: '',
  riskLevel: ''
})

const moduleOptions = [
  { label: '全部', value: '' },
  { label: '用户管理', value: 'user' },
  { label: '审批管理', value: 'approval' },
  { label: '合同管理', value: 'contract' },
  { label: '报销管理', value: 'expense' },
  { label: '系统管理', value: 'system' }
]
const actionOptions = [
  { label: '全部', value: '' },
  { label: '新增', value: 'create' },
  { label: '修改', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '查询', value: 'query' },
  { label: '导出', value: 'export' }
]
const statusOptions = [
  { label: '全部', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' }
]
const riskLevelOptions = [
  { label: '全部', value: '' },
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' }
]
const dataTypeOptions = [
  { label: '全部', value: '' },
  { label: '用户数据', value: 'user' },
  { label: '财务数据', value: 'finance' },
  { label: '合同数据', value: 'contract' },
  { label: '报表数据', value: 'report' }
]

const auditChartRef = ref<HTMLDivElement | null>(null)
let auditChart: echarts.ECharts | null = null

async function fetchAuditStats() {
  statsLoading.value = true
  try {
    const res = await getAuditStats()
    auditStats.value = res.data
    await nextTick()
    renderAuditChart()
  } catch (e) {
    // ignore
  } finally {
    statsLoading.value = false
  }
}

async function fetchAuditLogs() {
  auditLoading.value = true
  try {
    const res = await getAuditLogs(auditQuery)
    auditLogs.value = res.data?.list || []
    auditLogsTotal.value = res.data?.total || 0
  } catch (e) {
    // ignore
  } finally {
    auditLoading.value = false
  }
}

async function fetchAuditDataLogs() {
  auditDataLoading.value = true
  try {
    const res = await getAuditDataLogs(auditDataQuery)
    auditDataLogs.value = res.data?.list || []
    auditDataLogsTotal.value = res.data?.total || 0
  } catch (e) {
    // ignore
  } finally {
    auditDataLoading.value = false
  }
}

function renderAuditChart() {
  if (!auditChartRef.value || !auditStats.value) return
  if (!auditChart) {
    auditChart = echarts.init(auditChartRef.value)
  }
  const rawData = auditStats.value.byModule || auditStats.value.moduleDistribution || []
  const data = rawData.map((item: any) => ({
    name: item.module || item.name || '未知',
    value: item.count || item.value || 0
  }))
  auditChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        name: '操作分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        animationDuration: 1200,
        animationEasing: 'cubicOut',
        data: data.map((item) => ({ name: item.name, value: item.value }))
      }
    ],
    color: ['#1a3a5c', '#e8734a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
  })
}

function handleAuditQueryChange() {
  auditQuery.page = 1
  fetchAuditLogs()
}

function handleAuditDataQueryChange() {
  auditDataQuery.page = 1
  fetchAuditDataLogs()
}

function riskTagType(level: string) {
  const map: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[level] || 'info'
}

function riskText(level: string) {
  const map: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return map[level] || level
}

/* ============================================================
 * Tab3: 运维监控
 * ============================================================ */
const systemMonitor = ref<SystemMonitor | null>(null)
const appMonitor = ref<AppMonitor | null>(null)
const monitorLogs = ref<SystemLog[]>([])
const monitorLogsTotal = ref(0)
const alerts = ref<AlertItem[]>([])
const systemLoading = ref(false)
const appLoading = ref(false)
const logsLoading = ref(false)
const alertsLoading = ref(false)

const logQuery = reactive({
  page: 1,
  pageSize: 10,
  level: ''
})

const logLevelOptions = [
  { label: '全部', value: '' },
  { label: 'DEBUG', value: 'debug' },
  { label: 'INFO', value: 'info' },
  { label: 'WARN', value: 'warn' },
  { label: 'ERROR', value: 'error' }
]

let monitorTimer: any = null

async function fetchSystemMonitor() {
  systemLoading.value = true
  try {
    const res = await getSystemMonitor()
    systemMonitor.value = res.data
  } catch (e) {
    // ignore
  } finally {
    systemLoading.value = false
  }
}

async function fetchAppMonitor() {
  appLoading.value = true
  try {
    const res = await getAppMonitor()
    appMonitor.value = res.data
  } catch (e) {
    // ignore
  } finally {
    appLoading.value = false
  }
}

async function fetchMonitorLogs() {
  logsLoading.value = true
  try {
    const res = await getMonitorLogs(logQuery)
    monitorLogs.value = res.data?.list || []
    monitorLogsTotal.value = res.data?.total || 0
  } catch (e) {
    // ignore
  } finally {
    logsLoading.value = false
  }
}

async function fetchAlerts() {
  alertsLoading.value = true
  try {
    const res = await getAlerts()
    alerts.value = res.data || []
  } catch (e) {
    // ignore
  } finally {
    alertsLoading.value = false
  }
}

function refreshMonitor() {
  fetchSystemMonitor()
  fetchAppMonitor()
  fetchAlerts()
}

function logLevelTagType(level: string) {
  const map: Record<string, string> = {
    debug: 'info',
    info: '',
    warn: 'warning',
    error: 'danger'
  }
  return map[level] || 'info'
}

function alertLevelColor(level: string) {
  const map: Record<string, string> = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  }
  return map[level] || '#3b82f6'
}

function alertLevelText(level: string) {
  const map: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    info: '提示'
  }
  return map[level] || level
}

function sortedAlerts() {
  const order: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  return [...alerts.value].sort((a, b) => {
    const oa = order[a.level] ?? 99
    const ob = order[b.level] ?? 99
    if (oa !== ob) return oa - ob
    return new Date(b.time).getTime() - new Date(a.time).getTime()
  })
}

function handleLogLevelChange() {
  logQuery.page = 1
  fetchMonitorLogs()
}

/* ============================================================
 * Tab4: 组织架构
 * ============================================================ */
const departments = ref<Department[]>([])
const positions = ref<Position[]>([])
const users = ref<SystemUser[]>([])
const usersTotal = ref(0)
const deptLoading = ref(false)
const positionsLoading = ref(false)
const usersLoading = ref(false)
const userKeyword = ref('')
const selectedDeptId = ref<number | null>(null)
const showPositions = ref(false)

const userQuery = reactive({
  page: 1,
  pageSize: 10
})

const deptTreeProps = {
  label: 'name',
  children: 'children'
}

async function fetchDepartments() {
  deptLoading.value = true
  try {
    const res = await getDepartments()
    departments.value = res.data || []
  } catch (e) {
    // ignore
  } finally {
    deptLoading.value = false
  }
}

async function fetchPositions() {
  positionsLoading.value = true
  try {
    const res = await getPositions()
    positions.value = res.data || []
  } catch (e) {
    // ignore
  } finally {
    positionsLoading.value = false
  }
}

async function fetchUsers() {
  usersLoading.value = true
  try {
    const params: any = {
      page: userQuery.page,
      pageSize: userQuery.pageSize
    }
    if (userKeyword.value) params.keyword = userKeyword.value
    if (selectedDeptId.value) params.departmentId = selectedDeptId.value
    const res = await getUsers(params)
    users.value = res.data?.list || []
    usersTotal.value = res.data?.total || 0
  } catch (e) {
    // ignore
  } finally {
    usersLoading.value = false
  }
}

function handleDeptClick(data: any) {
  selectedDeptId.value = data.id
  userQuery.page = 1
  fetchUsers()
}

function handleUserSearch() {
  userQuery.page = 1
  fetchUsers()
}

async function handleToggleUser(row: SystemUser) {
  try {
    await ElMessageBox.confirm(
      `确定要${row.status === 'active' ? '禁用' : '启用'}用户 ${row.realName} 吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await toggleUserStatus(row.id)
    ElMessage.success('操作成功')
    fetchUsers()
  } catch (e) {
    // 用户取消或请求失败
  }
}

/* ============================================================
 * Tab5: 角色权限
 * ============================================================ */
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const selectedRoleId = ref<number | null>(null)
const rolePermissionIds = ref<number[]>([])
const rolesLoading = ref(false)
const permissionsLoading = ref(false)
const rolePermLoading = ref(false)
const permSaving = ref(false)

const permTreeProps = {
  label: 'name',
  children: 'children'
}

async function fetchRoles() {
  rolesLoading.value = true
  try {
    const res = await getRoles()
    roles.value = res.data || []
    if (roles.value.length > 0 && selectedRoleId.value === null) {
      await selectRole(roles.value[0])
    }
  } catch (e) {
    // ignore
  } finally {
    rolesLoading.value = false
  }
}

async function fetchPermissions() {
  permissionsLoading.value = true
  try {
    const res = await getPermissions()
    permissions.value = res.data || []
  } catch (e) {
    // ignore
  } finally {
    permissionsLoading.value = false
  }
}

async function selectRole(role: Role) {
  selectedRoleId.value = role.id
  rolePermLoading.value = true
  try {
    const res = await getRolePermissions(role.id)
    rolePermissionIds.value = res.data || []
    await nextTick()
    syncPermTreeCheck()
  } catch (e) {
    // ignore
  } finally {
    rolePermLoading.value = false
  }
}

const permTreeRef = ref<any>(null)

function syncPermTreeCheck() {
  if (!permTreeRef.value) return
  permTreeRef.value.setCheckedKeys(rolePermissionIds.value)
}

function handlePermCheck(_data: any, info: any) {
  // info: { checkedKeys, checkedNodes, halfCheckedKeys, halfCheckedNodes }
  const checked = info?.checkedKeys || []
  const halfChecked = info?.halfCheckedKeys || []
  rolePermissionIds.value = [...checked, ...halfChecked]
}

async function saveRolePermissions() {
  if (!selectedRoleId.value) {
    ElMessage.warning('请先选择角色')
    return
  }
  permSaving.value = true
  try {
    await updateRolePermissions(selectedRoleId.value, rolePermissionIds.value)
    ElMessage.success('权限保存成功')
  } catch (e) {
    // ignore
  } finally {
    permSaving.value = false
  }
}

function permTypeTagType(type: string) {
  const map: Record<string, string> = {
    menu: '',
    button: 'success',
    api: 'warning'
  }
  return map[type] || 'info'
}

function permTypeText(type: string) {
  const map: Record<string, string> = {
    menu: '菜单',
    button: '按钮',
    api: '接口'
  }
  return map[type] || type
}

/* ============================================================
 * Tab6: 系统日志管理
 * ============================================================ */
const logActiveSubTab = ref('login')
const logStats = ref<any>(null)
const loginLogsData = ref<any[]>([])
const loginLogsTotal = ref(0)
const loginLogsLoading = ref(false)
const operationLogsData = ref<any[]>([])
const operationLogsTotal = ref(0)
const operationLogsLoading = ref(false)
const apiCallLogsData = ref<any[]>([])
const apiCallLogsTotal = ref(0)
const apiCallLogsLoading = ref(false)
const errorLogsData = ref<any[]>([])
const errorLogsTotal = ref(0)
const errorLogsLoading = ref(false)

const loginLogQuery = reactive({ page: 1, pageSize: 10, status: '', action: '', keyword: '' })
const operationLogQuery = reactive({ page: 1, pageSize: 10, module: '', action: '', status: '', keyword: '' })
const apiCallLogQuery = reactive({ page: 1, pageSize: 10, method: '', status: '', keyword: '' })
const errorLogQuery = reactive({ page: 1, pageSize: 10, level: '', module: '', resolved: '', keyword: '' })

async function fetchLogStats() {
  try {
    const res = await getLogStats()
    logStats.value = res.data
  } catch {}
}
async function fetchLoginLogs() {
  loginLogsLoading.value = true
  try {
    const res = await getLoginLogs(loginLogQuery)
    const d = res.data || res
    loginLogsData.value = d.list || []
    loginLogsTotal.value = d.total || 0
  } finally { loginLogsLoading.value = false }
}
async function fetchOperationLogs() {
  operationLogsLoading.value = true
  try {
    const res = await getOperationLogs(operationLogQuery)
    const d = res.data || res
    operationLogsData.value = d.list || []
    operationLogsTotal.value = d.total || 0
  } finally { operationLogsLoading.value = false }
}
async function fetchApiCallLogs() {
  apiCallLogsLoading.value = true
  try {
    const res = await getApiCallLogs(apiCallLogQuery)
    const d = res.data || res
    apiCallLogsData.value = d.list || []
    apiCallLogsTotal.value = d.total || 0
  } finally { apiCallLogsLoading.value = false }
}
async function fetchErrorLogs() {
  errorLogsLoading.value = true
  try {
    const res = await getErrorLogs(errorLogQuery)
    const d = res.data || res
    errorLogsData.value = d.list || []
    errorLogsTotal.value = d.total || 0
  } finally { errorLogsLoading.value = false }
}

function onLogSubTabChange(tab: string) {
  if (tab === 'login' && loginLogsData.value.length === 0) fetchLoginLogs()
  if (tab === 'operation' && operationLogsData.value.length === 0) fetchOperationLogs()
  if (tab === 'apiCall' && apiCallLogsData.value.length === 0) fetchApiCallLogs()
  if (tab === 'error' && errorLogsData.value.length === 0) fetchErrorLogs()
}

function methodTagType(m: string) {
  return { GET: 'info', POST: 'success', PUT: 'warning', DELETE: 'danger' }[m] || 'info'
}
function errorLevelTagType(l: string) {
  return { fatal: 'danger', error: 'danger', warn: 'warning', info: 'info' }[l] || 'info'
}

/* ============================================================
 * Tab7: 第三方系统管理
 * ============================================================ */
const tpSystems = ref<ThirdPartySystemListItem[]>([])
const tpSystemsLoading = ref(false)
const selectedTpSystem = ref<ThirdPartySystem | null>(null)
const tpDetailLoading = ref(false)
const tpConfigSaving = ref(false)
const tpTesting = ref(false)
const tpTestResult = ref<ConnectionTestResult | null>(null)
const tpConfigForm = reactive<Record<string, string>>({})

async function fetchTpSystems() {
  tpSystemsLoading.value = true
  try {
    const res = await getThirdPartySystems()
    tpSystems.value = res.data || []
  } catch (e) {
    // 兜底数据
    tpSystems.value = [
      { id: 1, name: 'OA审批系统', code: 'OA_SYSTEM', type: 'api', category: '审批流程', status: 'online', enabled: true, icon: 'Tickets', description: '企业OA审批流程系统', lastSyncTime: '2026-07-07 10:30', version: 'v3.2.1', apiCount: 28 },
      { id: 2, name: '合同管理系统', code: 'CONTRACT_SYSTEM', type: 'api', category: '合同管理', status: 'online', enabled: true, icon: 'Files', description: '企业合同全生命周期管理系统', lastSyncTime: '2026-07-07 09:15', version: 'v2.8.0', apiCount: 35 },
      { id: 3, name: '采购管理系统', code: 'PURCHASE_SYSTEM', type: 'api', category: '采购管理', status: 'online', enabled: true, icon: 'ShoppingCart', description: '企业采购管理系统', lastSyncTime: '2026-07-07 08:45', version: 'v2.5.3', apiCount: 22 },
      { id: 4, name: '项目管理系统', code: 'PROJECT_SYSTEM', type: 'api', category: '项目管理', status: 'online', enabled: true, icon: 'DataLine', description: '企业项目管理系统', lastSyncTime: '2026-07-06 17:20', version: 'v4.1.0', apiCount: 18 },
      { id: 5, name: 'ERP系统', code: 'ERP_SYSTEM', type: 'database', category: '综合管理', status: 'online', enabled: true, icon: 'Cpu', description: '企业资源计划系统', lastSyncTime: '2026-07-07 06:00', version: 'v8.0.2', apiCount: 120 },
      { id: 6, name: '财务系统', code: 'FINANCE_SYSTEM', type: 'database', category: '财务管理', status: 'offline', enabled: false, icon: 'Wallet', description: '企业财务管理系统', lastSyncTime: '2026-06-30 23:00', version: 'v6.3.1', apiCount: 45 },
      { id: 7, name: 'HR人事系统', code: 'HR_SYSTEM', type: 'api', category: '人事管理', status: 'online', enabled: true, icon: 'UserFilled', description: '企业人力资源管理系统', lastSyncTime: '2026-07-07 07:00', version: 'v3.0.5', apiCount: 32 },
      { id: 8, name: '邮件系统', code: 'MAIL_SYSTEM', type: 'sdk', category: '通信协作', status: 'online', enabled: true, icon: 'Message', description: '企业邮件通知系统', lastSyncTime: '2026-07-07 12:00', version: 'v1.5.0', apiCount: 8 }
    ]
  } finally {
    tpSystemsLoading.value = false
  }
}

async function selectTpSystem(item: ThirdPartySystemListItem) {
  tpDetailLoading.value = true
  tpTestResult.value = null
  try {
    const res = await getThirdPartySystemDetail(item.id)
    selectedTpSystem.value = res.data
    // 初始化表单数据
    for (const p of selectedTpSystem.value?.params || []) {
      tpConfigForm[p.key] = p.value
    }
  } catch (e) {
    // 兜底 - 用列表数据构造详情
    selectedTpSystem.value = { ...item, params: [] } as ThirdPartySystem
  } finally {
    tpDetailLoading.value = false
  }
}

async function saveTpConfig() {
  if (!selectedTpSystem.value) return
  tpConfigSaving.value = true
  try {
    await updateThirdPartySystemConfig(selectedTpSystem.value.id, tpConfigForm)
    ElMessage.success('系统配置已保存')
  } catch (e) {
    ElMessage.success('配置已保存（Mock模式）')
  } finally {
    tpConfigSaving.value = false
  }
}

async function testTpConnection() {
  if (!selectedTpSystem.value) return
  tpTesting.value = true
  tpTestResult.value = null
  try {
    const res = await testThirdPartyConnection(selectedTpSystem.value.id)
    tpTestResult.value = res.data
  } catch (e) {
    tpTestResult.value = {
      systemId: selectedTpSystem.value.id,
      systemName: selectedTpSystem.value.name,
      success: selectedTpSystem.value.enabled,
      message: selectedTpSystem.value.enabled ? '连接测试成功（Mock模式）' : '系统已禁用，无法测试连接',
      responseTime: selectedTpSystem.value.enabled ? 128 : null,
      testTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: {}
    }
  } finally {
    tpTesting.value = false
  }
}

async function toggleTpSystem(item: ThirdPartySystemListItem) {
  try {
    await toggleThirdPartySystem(item.id)
    item.enabled = !item.enabled
    item.status = item.enabled ? 'online' : 'offline'
    ElMessage.success(`${item.name} 已${item.enabled ? '启用' : '禁用'}`)
  } catch (e) {
    item.enabled = !item.enabled
    item.status = item.enabled ? 'online' : 'offline'
    ElMessage.success(`${item.name} 已${item.enabled ? '启用' : '禁用'}（Mock模式）`)
  }
}

function tpTypeTag(type: string) {
  const map: Record<string, { text: string; tagType: string }> = {
    api: { text: 'API对接', tagType: 'primary' },
    sdk: { text: 'SDK集成', tagType: 'success' },
    database: { text: '数据库直连', tagType: 'warning' }
  }
  return map[type] || { text: type, tagType: 'info' }
}

function tpStatusColor(status: string) {
  const map: Record<string, string> = {
    online: '#10b981',
    offline: '#909399',
    error: '#ef4444'
  }
  return map[status] || '#909399'
}

function tpStatusText(status: string) {
  const map: Record<string, string> = { online: '在线', offline: '离线', error: '异常' }
  return map[status] || status
}

const iconMap: Record<string, any> = {
  Tickets, Files, ShoppingCart, DataLine, Cpu, Wallet, UserFilled, Message
}

function resolveIcon(iconName: string) {
  return iconMap[iconName] || Connection
}

/* ============================================================
 * 生命周期
 * ============================================================ */
function handleResize() {
  auditChart?.resize()
}

onMounted(async () => {
  // 默认加载安全配置
  fetchSecurityConfig()
  fetchAccessConfig()

  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (auditChart) {
    auditChart.dispose()
    auditChart = null
  }
  if (monitorTimer) {
    clearInterval(monitorTimer)
    monitorTimer = null
  }
})

function progressColor(p: number) {
  if (p >= 80) return '#ef4444'
  if (p >= 60) return '#f59e0b'
  return '#10b981'
}

function auditRowClass({ row }: { row: AuditDataLog }) {
  if (row.riskLevel === 'high') return 'row-high-risk'
  return ''
}

// Tab 切换时按需加载数据
watch(activeTab, (val) => {
  if (val === 'audit' && !auditStats.value) {
    fetchAuditStats()
    fetchAuditLogs()
    fetchAuditDataLogs()
  } else if (val === 'monitor') {
    refreshMonitor()
    fetchMonitorLogs()
  } else if (val === 'org' && departments.value.length === 0) {
    fetchDepartments()
    fetchPositions()
    fetchUsers()
  } else if (val === 'role' && roles.value.length === 0) {
    fetchRoles()
    fetchPermissions()
  } else if (val === 'logs') {
    fetchLogStats()
    fetchLoginLogs()
  } else if (val === 'third-party' && tpSystems.value.length === 0) {
    fetchTpSystems()
  }
})
</script>

<template>
  <div class="system-admin">
    <el-tabs v-model="activeTab" class="sa-tabs" type="border-card">
      <!-- ============ Tab1: 安全管理 ============ -->
      <el-tab-pane label="安全管理" name="security">
        <div v-loading="securityLoading || accessLoading" class="sa-tab-content">
          <!-- 数据安全 -->
          <el-divider content-position="left">
            <el-icon><Lock /></el-icon>
            <span class="divider-title">数据安全</span>
          </el-divider>

          <div v-if="securityConfig" class="config-grid">
            <!-- 传输加密 -->
            <el-card class="config-card" shadow="hover">
              <div class="config-card-header">
                <div class="config-icon icon-blue">
                  <el-icon><Key /></el-icon>
                </div>
                <div class="config-title">传输加密(TLS 1.3)</div>
                <el-switch v-model="securityConfig.tls.enabled" />
              </div>
              <div class="config-meta">
                <div class="meta-row">
                  <span class="meta-label">加密协议</span>
                  <el-tag size="small" type="success">{{ securityConfig.tls.version }}</el-tag>
                </div>
                <div class="meta-row">
                  <span class="meta-label">证书到期日</span>
                  <span class="meta-value">{{ securityConfig.tls.certExpiry }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">覆盖范围</span>
                  <span class="meta-value">全站HTTPS · API网关 · WebSocket</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">证书签发</span>
                  <span class="meta-value">Let's Encrypt · 自动续期</span>
                </div>
              </div>
            </el-card>

            <!-- 存储加密 -->
            <el-card class="config-card" shadow="hover">
              <div class="config-card-header">
                <div class="config-icon icon-orange">
                  <el-icon><Lock /></el-icon>
                </div>
                <div class="config-title">存储加密(AES-256)</div>
                <el-switch v-model="securityConfig.storage.enabled" />
              </div>
              <div class="config-meta">
                <div class="meta-row">
                  <span class="meta-label">加密算法</span>
                  <el-tag size="small" type="success">{{ securityConfig.storage.algorithm }}</el-tag>
                </div>
                <div class="meta-row">
                  <span class="meta-label">加密表数量</span>
                  <span class="meta-value">{{ securityConfig.storage.encryptedTables.length }} 张</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">加密表列表</span>
                  <div class="tag-list">
                    <el-tag v-for="t in securityConfig.storage.encryptedTables" :key="t" size="small" effect="plain" style="margin: 2px;">{{ t }}</el-tag>
                  </div>
                </div>
                <div class="meta-row">
                  <span class="meta-label">密钥管理</span>
                  <span class="meta-value">KMS托管 · 每季轮换</span>
                </div>
              </div>
            </el-card>

            <!-- 敏感字段脱敏 -->
            <el-card class="config-card config-card-wide" shadow="hover">
              <div class="config-card-header">
                <div class="config-icon icon-green">
                  <el-icon><Hide /></el-icon>
                </div>
                <div class="config-title">敏感字段脱敏</div>
                <el-switch v-model="securityConfig.desensitize.enabled" />
              </div>
              <el-table :data="securityConfig.desensitize.rules" size="small" class="mask-table" border>
                <el-table-column prop="field" label="字段名" min-width="100" />
                <el-table-column prop="type" label="脱敏类型" min-width="90" />
                <el-table-column prop="sample" label="脱敏示例" min-width="160" />
                <el-table-column label="规则说明" min-width="200">
                  <template #default="{ row }">
                    <span v-if="row.type === 'phone'">保留前3后4，中间星号替换</span>
                    <span v-else-if="row.type === 'idCard'">保留前3后4，中间星号替换</span>
                    <span v-else-if="row.type === 'email'">保留首字母+域名，中间星号替换</span>
                    <span v-else-if="row.type === 'bankCard'">保留前4后4，中间星号替换</span>
                    <span v-else-if="row.type === 'name'">保留姓氏，名字星号替换</span>
                    <span v-else-if="row.type === 'address'">保留省市，详细地址星号替换</span>
                    <span v-else>通用脱敏规则</span>
                  </template>
                </el-table-column>
                <el-table-column label="应用场景" min-width="120">
                  <template #default="{ row }">
                    <el-tag size="small" effect="plain">{{ row.scenes?.join(' / ') || '全局' }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>

            <!-- 数据水印 -->
            <el-card class="config-card" shadow="hover">
              <div class="config-card-header">
                <div class="config-icon icon-purple">
                  <el-icon><DocumentCopy /></el-icon>
                </div>
                <div class="config-title">数据水印</div>
                <el-switch v-model="securityConfig.watermark.enabled" />
              </div>
              <div class="config-meta">
                <div class="meta-row">
                  <span class="meta-label">水印文字</span>
                  <span class="meta-value">{{ securityConfig.watermark.text }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">水印位置</span>
                  <span class="meta-value">{{ securityConfig.watermark.position }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">水印类型</span>
                  <span class="meta-value">暗水印 + 明水印</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">应用范围</span>
                  <span class="meta-value">Excel导出 · PDF报告 · 在线预览</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">追溯能力</span>
                  <span class="meta-value">嵌入用户ID+时间戳 · 可追溯泄密源</span>
                </div>
              </div>
            </el-card>

            <!-- 数据备份加密 -->
            <el-card class="config-card" shadow="hover">
              <div class="config-card-header">
                <div class="config-icon icon-cyan">
                  <el-icon><CopyDocument /></el-icon>
                </div>
                <div class="config-title">数据备份加密</div>
                <el-switch v-model="securityConfig.backup.enabled" />
              </div>
              <div class="config-meta">
                <div class="meta-row">
                  <span class="meta-label">加密算法</span>
                  <el-tag size="small" type="success">{{ securityConfig.backup.algorithm }}</el-tag>
                </div>
                <div class="meta-row">
                  <span class="meta-label">备份策略</span>
                  <span class="meta-value">{{ securityConfig.backup.schedule }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">保留周期</span>
                  <span class="meta-value">{{ securityConfig.backup.retention }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">备份方式</span>
                  <span class="meta-value">全量 + 增量 · 异地容灾</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">最近备份</span>
                  <span class="meta-value">2026-07-06 03:18 · 15.2GB · 成功</span>
                </div>
              </div>
            </el-card>
          </div>

          <div class="action-bar">
            <el-button type="primary" :icon="Check" :loading="securitySaving" @click="saveSecurityConfig">保存数据安全配置</el-button>
          </div>

          <!-- 访问安全 -->
          <el-divider content-position="left">
            <el-icon><Key /></el-icon>
            <span class="divider-title">访问安全</span>
          </el-divider>

          <div v-if="accessConfig" class="access-section">
            <el-row :gutter="16">
              <!-- SSO -->
              <el-col :xs="24" :sm="12" :md="8">
                <el-card class="access-card" shadow="hover">
                  <div class="access-card-title">
                    <el-icon><Connection /></el-icon>
                    <span>SSO 单点登录</span>
                    <el-tag :type="accessConfig.sso.enabled ? 'success' : 'info'" size="small" class="status-tag">
                      {{ accessConfig.sso.enabled ? '已启用' : '未启用' }}
                    </el-tag>
                  </div>
                  <div class="access-card-body">
                    <div class="provider-tags">
                      <el-tag v-for="p in accessConfig.sso.providers" :key="p.name" size="small" effect="plain" class="provider-tag">
                        {{ p.name }}
                        <el-icon v-if="p.status === 'active'" style="color:#10b981;margin-left:2px;"><Check /></el-icon>
                      </el-tag>
                    </div>
                    <div class="access-detail">覆盖范围：Web端 · 移动端 · API网关</div>
                  </div>
                </el-card>
              </el-col>

              <!-- MFA -->
              <el-col :xs="24" :sm="12" :md="8">
                <el-card class="access-card" shadow="hover">
                  <div class="access-card-title">
                    <el-icon><Key /></el-icon>
                    <span>MFA 多因素认证</span>
                    <el-tag :type="accessConfig.mfa.enabled ? 'success' : 'info'" size="small" class="status-tag">
                      {{ accessConfig.mfa.enabled ? '已启用' : '未启用' }}
                    </el-tag>
                  </div>
                  <div class="access-card-body">
                    <div class="provider-tags">
                      <el-tag v-for="m in accessConfig.mfa.methods" :key="m" size="small" type="warning" effect="plain" class="provider-tag">{{ m }}</el-tag>
                    </div>
                    <div class="access-detail">触发条件：管理员登录 · 敏感操作 · 异地登录</div>
                  </div>
                </el-card>
              </el-col>

              <!-- RBAC -->
              <el-col :xs="24" :sm="12" :md="8">
                <el-card class="access-card" shadow="hover">
                  <div class="access-card-title">
                    <el-icon><UserFilled /></el-icon>
                    <span>RBAC 权限管理</span>
                    <el-tag :type="accessConfig.rbac.enabled ? 'success' : 'info'" size="small" class="status-tag">
                      {{ accessConfig.rbac.enabled ? '已启用' : '未启用' }}
                    </el-tag>
                  </div>
                  <div class="access-card-body">
                    <div class="stat-line">
                      <span>角色数：<b>{{ accessConfig.rbac.roles }}</b></span>
                      <span>权限数：<b>{{ accessConfig.rbac.permissions }}</b></span>
                    </div>
                    <div class="access-detail">权限粒度：菜单级 · 按钮级 · API级 · 数据级</div>
                  </div>
                </el-card>
              </el-col>

              <!-- IP白名单 -->
              <el-col :xs="24" :sm="12" :md="8">
                <el-card class="access-card" shadow="hover">
                  <div class="access-card-title">
                    <el-icon><Lock /></el-icon>
                    <span>IP 白名单</span>
                    <el-tag :type="accessConfig.ipWhitelist.enabled ? 'success' : 'info'" size="small" class="status-tag">
                      {{ accessConfig.ipWhitelist.enabled ? '已启用' : '未启用' }}
                    </el-tag>
                  </div>
                  <div class="access-card-body">
                    <div class="ip-list">
                      <el-tag v-for="(ip, i) in accessConfig.ipWhitelist.ips" :key="i" size="small" class="ip-tag">{{ ip }}</el-tag>
                      <span v-if="!accessConfig.ipWhitelist.ips.length" class="empty-text">暂无白名单</span>
                    </div>
                    <div class="access-detail">拦截记录：本月拦截 23 次非法访问</div>
                  </div>
                </el-card>
              </el-col>

              <!-- 会话管理 -->
              <el-col :xs="24" :sm="12" :md="8">
                <el-card class="access-card" shadow="hover">
                  <div class="access-card-title">
                    <el-icon><Monitor /></el-icon>
                    <span>会话管理</span>
                  </div>
                  <div class="access-card-body">
                    <div class="stat-grid">
                      <div class="stat-item">
                        <div class="stat-num">{{ accessConfig.session.timeout }}</div>
                        <div class="stat-label">超时(分钟)</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-num">{{ accessConfig.session.maxConcurrent }}</div>
                        <div class="stat-label">最大并发</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-num online">{{ accessConfig.session.currentActive }}</div>
                        <div class="stat-label">当前在线</div>
                      </div>
                    </div>
                    <div class="access-detail">策略：超时自动登出 · 并发踢出旧会话</div>
                  </div>
                </el-card>
              </el-col>

              <!-- 密码策略 -->
              <el-col :xs="24" :sm="12" :md="8">
                <el-card class="access-card" shadow="hover">
                  <div class="access-card-title">
                    <el-icon><Key /></el-icon>
                    <span>密码策略</span>
                  </div>
                  <div class="access-card-body">
                    <div class="pwd-policy">
                      <div class="pwd-row">
                        <span>最小长度</span>
                        <b>{{ accessConfig.passwordPolicy.minLength }} 位</b>
                      </div>
                      <div class="pwd-row">
                        <span>大小写字母</span>
                        <el-tag :type="accessConfig.passwordPolicy.requireUppercase ? 'success' : 'info'" size="small">
                          {{ accessConfig.passwordPolicy.requireUppercase ? '要求' : '不要求' }}
                        </el-tag>
                      </div>
                      <div class="pwd-row">
                        <span>数字</span>
                        <el-tag :type="accessConfig.passwordPolicy.requireNumber ? 'success' : 'info'" size="small">
                          {{ accessConfig.passwordPolicy.requireNumber ? '要求' : '不要求' }}
                        </el-tag>
                      </div>
                      <div class="pwd-row">
                        <span>特殊字符</span>
                        <el-tag :type="accessConfig.passwordPolicy.requireSpecial ? 'success' : 'info'" size="small">
                          {{ accessConfig.passwordPolicy.requireSpecial ? '要求' : '不要求' }}
                        </el-tag>
                      </div>
                      <div class="pwd-row">
                        <span>有效期</span>
                        <b>{{ accessConfig.passwordPolicy.expiry }} 天</b>
                      </div>
                      <div class="pwd-row">
                        <span>历史密码限制</span>
                        <b>最近 {{ accessConfig.passwordPolicy.historyCount }} 次不可重复</b>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <div class="action-bar">
            <el-button type="primary" :icon="Check" :loading="accessSaving" @click="saveAccessConfig">保存访问安全配置</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- ============ Tab2: 审计与合规 ============ -->
      <el-tab-pane label="审计与合规" name="audit">
        <div class="sa-tab-content">
          <!-- 统计卡片 -->
          <el-row :gutter="16" v-loading="statsLoading" class="stat-cards">
            <el-col :xs="12" :sm="6">
              <el-card class="stat-card" shadow="hover">
                <div class="stat-card-num">{{ auditStats?.todayOperations ?? 0 }}</div>
                <div class="stat-card-label">今日操作数</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="stat-card stat-card-red" shadow="hover">
                <div class="stat-card-num">{{ auditStats?.todayFailed ?? 0 }}</div>
                <div class="stat-card-label">今日失败数</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="stat-card" shadow="hover">
                <div class="stat-card-num">{{ auditStats?.weekOperations ?? 0 }}</div>
                <div class="stat-card-label">本周操作数</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="stat-card stat-card-orange" shadow="hover">
                <div class="stat-card-num">{{ auditStats?.highRiskAccess ?? 0 }}</div>
                <div class="stat-card-label">高风险访问数</div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 图表 -->
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="card-title">按模块统计操作分布</span>
            </template>
            <div ref="auditChartRef" class="chart-box"></div>
          </el-card>

          <!-- 操作审计日志 -->
          <el-card shadow="never" class="table-card">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">操作审计日志</span>
                <div class="filter-bar">
                  <el-select v-model="auditQuery.module" placeholder="模块" size="small" style="width: 130px" @change="handleAuditQueryChange">
                    <el-option v-for="o in moduleOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                  <el-select v-model="auditQuery.action" placeholder="操作类型" size="small" style="width: 130px" @change="handleAuditQueryChange">
                    <el-option v-for="o in actionOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                  <el-select v-model="auditQuery.status" placeholder="状态" size="small" style="width: 110px" @change="handleAuditQueryChange">
                    <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                  <el-button :icon="Refresh" size="small" @click="fetchAuditLogs">刷新</el-button>
                </div>
              </div>
            </template>
            <el-table v-loading="auditLoading" :data="auditLogs" stripe size="small" class="mono-table">
              <el-table-column prop="time" label="时间" min-width="160" />
              <el-table-column prop="user" label="用户" min-width="110" />
              <el-table-column prop="action" label="操作" min-width="90" />
              <el-table-column prop="module" label="模块" min-width="110" />
              <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
              <el-table-column prop="ip" label="IP" min-width="130" />
              <el-table-column label="状态" min-width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination
                v-model:current-page="auditQuery.page"
                v-model:page-size="auditQuery.pageSize"
                :total="auditLogsTotal"
                layout="total, prev, pager, next"
                size="small"
                @current-change="fetchAuditLogs"
              />
            </div>
          </el-card>

          <!-- 数据访问审计 -->
          <el-card shadow="never" class="table-card">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">数据访问审计</span>
                <div class="filter-bar">
                  <el-select v-model="auditDataQuery.dataType" placeholder="数据类型" size="small" style="width: 130px" @change="handleAuditDataQueryChange">
                    <el-option v-for="o in dataTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                  <el-select v-model="auditDataQuery.riskLevel" placeholder="风险等级" size="small" style="width: 120px" @change="handleAuditDataQueryChange">
                    <el-option v-for="o in riskLevelOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                  <el-button :icon="Refresh" size="small" @click="fetchAuditDataLogs">刷新</el-button>
                </div>
              </div>
            </template>
            <el-table v-loading="auditDataLoading" :data="auditDataLogs" stripe size="small" class="mono-table" :row-class-name="auditRowClass">
              <el-table-column prop="time" label="时间" min-width="160" />
              <el-table-column prop="user" label="用户" min-width="110" />
              <el-table-column prop="dataType" label="数据类型" min-width="110" />
              <el-table-column prop="operation" label="操作" min-width="100" />
              <el-table-column prop="recordId" label="记录ID" min-width="140" />
              <el-table-column prop="ip" label="IP" min-width="130" />
              <el-table-column label="风险等级" min-width="100">
                <template #default="{ row }">
                  <el-tag :type="riskTagType(row.riskLevel)" size="small">{{ riskText(row.riskLevel) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination
                v-model:current-page="auditDataQuery.page"
                v-model:page-size="auditDataQuery.pageSize"
                :total="auditDataLogsTotal"
                layout="total, prev, pager, next"
                size="small"
                @current-change="fetchAuditDataLogs"
              />
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ============ Tab3: 运维监控 ============ -->
      <el-tab-pane label="运维监控" name="monitor">
        <div class="sa-tab-content">
          <div class="action-bar top-action-bar">
            <el-button :icon="Refresh" type="primary" plain size="small" @click="refreshMonitor">刷新监控</el-button>
          </div>

          <!-- 系统资源 -->
          <el-divider content-position="left">
            <el-icon><Cpu /></el-icon>
            <span class="divider-title">系统资源</span>
          </el-divider>

          <el-row :gutter="16" v-loading="systemLoading">
            <el-col :xs="12" :sm="6">
              <el-card class="gauge-card" shadow="hover">
                <div class="gauge-title">CPU 使用率</div>
                <el-progress type="dashboard" :percentage="systemMonitor?.cpuUsage ?? 0" :width="120" :color="progressColor(systemMonitor?.cpuUsage ?? 0)" />
                <div class="gauge-meta">{{ systemMonitor?.cpuCores ?? '-' }} 核</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="gauge-card" shadow="hover">
                <div class="gauge-title">内存使用率</div>
                <el-progress type="dashboard" :percentage="systemMonitor?.memoryUsage ?? 0" :width="120" :color="progressColor(systemMonitor?.memoryUsage ?? 0)" />
                <div class="gauge-meta">{{ systemMonitor?.memoryTotal ?? '-' }} GB</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="gauge-card" shadow="hover">
                <div class="gauge-title">磁盘使用率</div>
                <el-progress type="dashboard" :percentage="systemMonitor?.diskUsage ?? 0" :width="120" :color="progressColor(systemMonitor?.diskUsage ?? 0)" />
                <div class="gauge-meta">{{ systemMonitor?.diskTotal ?? '-' }} GB</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="gauge-card" shadow="hover">
                <div class="gauge-title">网络 IO</div>
                <el-progress type="dashboard" :percentage="systemMonitor?.networkIO ?? 0" :width="120" :color="progressColor(systemMonitor?.networkIO ?? 0)" />
                <div class="gauge-meta">运行 {{ systemMonitor?.uptime ?? '-' }}</div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 应用性能 -->
          <el-divider content-position="left">
            <el-icon><Monitor /></el-icon>
            <span class="divider-title">应用性能</span>
          </el-divider>

          <el-row :gutter="16" v-loading="appLoading">
            <el-col :xs="12" :sm="6">
              <el-card class="kpi-card" shadow="hover">
                <div class="kpi-num">{{ appMonitor?.totalRequests ?? 0 }}</div>
                <div class="kpi-label">总请求数</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="kpi-card" shadow="hover">
                <div class="kpi-num">{{ appMonitor?.avgResponseTime ?? 0 }} ms</div>
                <div class="kpi-label">平均响应时间</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="kpi-card" shadow="hover">
                <div class="kpi-num" :class="{ 'num-red': (appMonitor?.errorRate ?? 0) > 1 }">{{ appMonitor?.errorRate ?? 0 }}%</div>
                <div class="kpi-label">错误率</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card class="kpi-card" shadow="hover">
                <div class="kpi-num">{{ appMonitor?.qps ?? 0 }}</div>
                <div class="kpi-label">QPS</div>
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="never" class="table-card">
            <template #header><span class="card-title">慢接口列表</span></template>
            <el-table :data="appMonitor?.slowApis || []" stripe size="small">
              <el-table-column prop="api" label="接口" min-width="220" show-overflow-tooltip />
              <el-table-column prop="method" label="方法" min-width="80" />
              <el-table-column prop="avgTime" label="平均耗时(ms)" min-width="120" />
              <el-table-column prop="calls" label="调用次数" min-width="100" />
              <el-table-column prop="lastSlowTime" label="最近慢调用" min-width="160" />
            </el-table>
          </el-card>

          <!-- 告警 -->
          <el-divider content-position="left">
            <el-icon><Bell /></el-icon>
            <span class="divider-title">告警列表</span>
          </el-divider>

          <el-card shadow="never" class="table-card" v-loading="alertsLoading">
            <div class="alert-list">
              <div v-for="a in sortedAlerts()" :key="a.id" class="alert-item" :style="{ borderLeftColor: alertLevelColor(a.level) }">
                <div class="alert-left">
                  <span class="alert-level" :style="{ background: alertLevelColor(a.level) }">{{ alertLevelText(a.level) }}</span>
                  <div class="alert-content">
                    <div class="alert-title">{{ a.title }}</div>
                    <div class="alert-message">{{ a.message }}</div>
                    <div class="alert-meta">
                      <span>来源：{{ a.source }}</span>
                      <span>时间：{{ a.time }}</span>
                    </div>
                  </div>
                </div>
                <el-tag :type="a.status === 'active' ? 'danger' : 'info'" size="small">
                  {{ a.status === 'active' ? '未处理' : '已处理' }}
                </el-tag>
              </div>
              <el-empty v-if="!sortedAlerts().length" description="暂无告警" />
            </div>
          </el-card>

          <!-- 系统日志 -->
          <el-card shadow="never" class="table-card">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">系统日志</span>
                <div class="filter-bar">
                  <el-select v-model="logQuery.level" placeholder="日志级别" size="small" style="width: 120px" @change="handleLogLevelChange">
                    <el-option v-for="o in logLevelOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                  <el-button :icon="Refresh" size="small" @click="fetchMonitorLogs">刷新</el-button>
                </div>
              </div>
            </template>
            <el-table v-loading="logsLoading" :data="monitorLogs" stripe size="small" class="mono-table">
              <el-table-column prop="time" label="时间" min-width="160" />
              <el-table-column label="级别" min-width="80">
                <template #default="{ row }">
                  <el-tag :type="logLevelTagType(row.level)" size="small">{{ row.level.toUpperCase() }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="module" label="模块" min-width="120" />
              <el-table-column prop="message" label="消息" min-width="280" show-overflow-tooltip />
              <el-table-column prop="traceId" label="traceId" min-width="180" />
            </el-table>
            <div class="pager">
              <el-pagination
                v-model:current-page="logQuery.page"
                v-model:page-size="logQuery.pageSize"
                :total="monitorLogsTotal"
                layout="total, prev, pager, next"
                size="small"
                @current-change="fetchMonitorLogs"
              />
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ============ Tab4: 组织架构 ============ -->
      <el-tab-pane label="组织架构" name="org">
        <div class="sa-tab-content org-content">
          <el-row :gutter="16">
            <!-- 部门树 -->
            <el-col :xs="24" :sm="8" :md="6">
              <el-card shadow="never" class="dept-card">
                <template #header>
                  <div class="card-header-flex">
                    <span class="card-title">部门结构</span>
                  </div>
                </template>
                <el-tree
                  v-loading="deptLoading"
                  :data="departments"
                  :props="deptTreeProps"
                  node-key="id"
                  default-expand-all
                  highlight-current
                  @node-click="handleDeptClick"
                />
              </el-card>
            </el-col>

            <!-- 用户列表 -->
            <el-col :xs="24" :sm="16" :md="18">
              <el-card shadow="never" class="table-card">
                <template #header>
                  <div class="card-header-flex">
                    <span class="card-title">用户列表</span>
                    <div class="filter-bar">
                      <el-input
                        v-model="userKeyword"
                        placeholder="搜索用户名/姓名/邮箱"
                        size="small"
                        style="width: 220px"
                        clearable
                        @keyup.enter="handleUserSearch"
                      >
                        <template #prefix>
                          <el-icon><Search /></el-icon>
                        </template>
                      </el-input>
                      <el-button type="primary" size="small" :icon="Search" @click="handleUserSearch">搜索</el-button>
                      <el-button size="small" @click="showPositions = !showPositions">
                        <el-icon><Postcard /></el-icon>
                        岗位列表
                      </el-button>
                    </div>
                  </div>
                </template>

                <el-table v-loading="usersLoading" :data="users" stripe size="small">
                  <el-table-column prop="username" label="用户名" min-width="110" />
                  <el-table-column prop="realName" label="姓名" min-width="100" />
                  <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
                  <el-table-column prop="phone" label="手机" min-width="130" />
                  <el-table-column prop="departmentName" label="部门" min-width="120" />
                  <el-table-column prop="positionName" label="岗位" min-width="110" />
                  <el-table-column label="角色" min-width="140">
                    <template #default="{ row }">
                      <el-tag v-for="(r, i) in row.roles" :key="i" size="small" class="role-tag" type="info" effect="plain">{{ r }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" min-width="80">
                    <template #default="{ row }">
                      <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                        {{ row.status === 'active' ? '启用' : '禁用' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="lastLogin" label="最后登录" min-width="160" />
                  <el-table-column label="操作" min-width="90" fixed="right">
                    <template #default="{ row }">
                      <el-button
                        size="small"
                        link
                        :type="row.status === 'active' ? 'danger' : 'success'"
                        @click="handleToggleUser(row)"
                      >
                        {{ row.status === 'active' ? '禁用' : '启用' }}
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="pager">
                  <el-pagination
                    v-model:current-page="userQuery.page"
                    v-model:page-size="userQuery.pageSize"
                    :total="usersTotal"
                    layout="total, prev, pager, next"
                    size="small"
                    @current-change="fetchUsers"
                  />
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 岗位列表 -->
          <el-card v-if="showPositions" shadow="never" class="table-card">
            <template #header><span class="card-title">岗位列表</span></template>
            <el-table v-loading="positionsLoading" :data="positions" stripe size="small">
              <el-table-column prop="name" label="岗位名称" min-width="140" />
              <el-table-column prop="code" label="岗位编码" min-width="140" />
              <el-table-column prop="departmentName" label="所属部门" min-width="140" />
              <el-table-column prop="level" label="级别" min-width="100" />
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ============ Tab5: 角色权限 ============ -->
      <el-tab-pane label="角色权限" name="role">
        <div class="sa-tab-content role-content">
          <el-row :gutter="16">
            <!-- 角色列表 -->
            <el-col :xs="24" :sm="8" :md="7">
              <el-card shadow="never" class="role-list-card" v-loading="rolesLoading">
                <template #header><span class="card-title">角色列表</span></template>
                <div class="role-list">
                  <div
                    v-for="r in roles"
                    :key="r.id"
                    class="role-item"
                    :class="{ active: selectedRoleId === r.id }"
                    @click="selectRole(r)"
                  >
                    <div class="role-item-main">
                      <div class="role-item-name">
                        {{ r.name }}
                        <el-tag v-if="selectedRoleId === r.id" size="small" type="primary" effect="dark" class="selected-tag">已选</el-tag>
                      </div>
                      <div class="role-item-code">{{ r.code }}</div>
                      <div class="role-item-desc">{{ r.description }}</div>
                    </div>
                    <div class="role-item-meta">
                      <el-icon><UserFilled /></el-icon>
                      <span>{{ r.userCount }} 人</span>
                    </div>
                  </div>
                  <el-empty v-if="!roles.length" description="暂无角色" />
                </div>
              </el-card>
            </el-col>

            <!-- 权限配置 -->
            <el-col :xs="24" :sm="16" :md="17">
              <el-card shadow="never" class="perm-card" v-loading="permissionsLoading || rolePermLoading">
                <template #header>
                  <div class="card-header-flex">
                    <span class="card-title">权限配置</span>
                    <el-button
                      v-if="selectedRoleId"
                      type="primary"
                      size="small"
                      :icon="Check"
                      :loading="permSaving"
                      @click="saveRolePermissions"
                    >
                      保存权限
                    </el-button>
                  </div>
                </template>

                <el-empty v-if="!selectedRoleId" description="请选择左侧角色" />

                <el-tree
                  v-else
                  ref="permTreeRef"
                  :data="permissions"
                  :props="permTreeProps"
                  node-key="id"
                  show-checkbox
                  default-expand-all
                  @check="handlePermCheck"
                >
                  <template #default="{ data }">
                    <span class="perm-node">
                      <span class="perm-node-name">{{ data.name }}</span>
                      <el-tag :type="permTypeTagType(data.type)" size="small" class="perm-type-tag">
                        {{ permTypeText(data.type) }}
                      </el-tag>
                      <span class="perm-node-code">{{ data.code }}</span>
                    </span>
                  </template>
                </el-tree>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- ============ Tab6: 系统日志管理 ============ -->
      <el-tab-pane label="系统日志管理" name="logs">
        <div class="sa-tab-content">
          <!-- 统计卡片 -->
          <el-row :gutter="12" style="margin-bottom: 16px;">
            <el-col :xs="12" :sm="6">
              <el-card shadow="hover" class="log-stat-card">
                <div class="log-stat-num" style="color: #3b82f6;">{{ logStats?.login?.total ?? '-' }}</div>
                <div class="log-stat-label">登录日志</div>
                <div class="log-stat-sub">成功 {{ logStats?.login?.success ?? 0 }} / 失败 {{ logStats?.login?.fail ?? 0 }}</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card shadow="hover" class="log-stat-card">
                <div class="log-stat-num" style="color: #10b981;">{{ logStats?.operation?.total ?? '-' }}</div>
                <div class="log-stat-label">操作日志</div>
                <div class="log-stat-sub">成功 {{ logStats?.operation?.success ?? 0 }} / 失败 {{ logStats?.operation?.fail ?? 0 }}</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card shadow="hover" class="log-stat-card">
                <div class="log-stat-num" style="color: #e8734a;">{{ logStats?.apiCall?.total ?? '-' }}</div>
                <div class="log-stat-label">接口调用日志</div>
                <div class="log-stat-sub">平均 {{ logStats?.apiCall?.avgDuration ?? 0 }}ms / 异常 {{ logStats?.apiCall?.error ?? 0 }}</div>
              </el-card>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-card shadow="hover" class="log-stat-card">
                <div class="log-stat-num" style="color: #ef4444;">{{ logStats?.error?.total ?? '-' }}</div>
                <div class="log-stat-label">异常错误日志</div>
                <div class="log-stat-sub">致命 {{ logStats?.error?.fatal ?? 0 }} / 未解决 {{ logStats?.error?.unresolved ?? 0 }}</div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 子Tab -->
          <el-tabs v-model="logActiveSubTab" @tab-change="onLogSubTabChange">
            <!-- 登录日志 -->
            <el-tab-pane label="登录日志" name="login">
              <div style="margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <el-input v-model="loginLogQuery.keyword" placeholder="搜索用户/IP" clearable size="small" style="width: 180px;" @keyup.enter="loginLogQuery.page = 1; fetchLoginLogs()" />
                <el-select v-model="loginLogQuery.status" placeholder="状态" clearable size="small" style="width: 100px;" @change="loginLogQuery.page = 1; fetchLoginLogs()">
                  <el-option label="成功" value="success" /><el-option label="失败" value="fail" />
                </el-select>
                <el-select v-model="loginLogQuery.action" placeholder="操作" clearable size="small" style="width: 100px;" @change="loginLogQuery.page = 1; fetchLoginLogs()">
                  <el-option label="登录" value="login" /><el-option label="登出" value="logout" />
                </el-select>
                <el-button size="small" type="primary" @click="loginLogQuery.page = 1; fetchLoginLogs()">查询</el-button>
              </div>
              <el-table v-loading="loginLogsLoading" :data="loginLogsData" size="small" border style="width: 100%;">
                <el-table-column prop="timestamp" label="时间" width="160" />
                <el-table-column prop="userName" label="用户" width="100" />
                <el-table-column prop="action" label="操作" width="80">
                  <template #default="{ row }"><el-tag :type="row.action === 'login' ? 'success' : 'info'" size="small">{{ row.action === 'login' ? '登录' : '登出' }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="ip" label="IP地址" width="130" />
                <el-table-column prop="location" label="位置" width="100" />
                <el-table-column prop="browser" label="浏览器" width="110" show-overflow-tooltip />
                <el-table-column prop="os" label="操作系统" width="120" show-overflow-tooltip />
                <el-table-column prop="device" label="设备" width="70" />
                <el-table-column prop="duration" label="在线时长" width="90" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }"><el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status === 'success' ? '成功' : '失败' }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="message" label="详情" min-width="180" show-overflow-tooltip />
              </el-table>
              <el-pagination v-model:current-page="loginLogQuery.page" :page-size="loginLogQuery.pageSize" :total="loginLogsTotal" layout="total, prev, pager, next" small background @current-change="fetchLoginLogs" style="margin-top: 8px; justify-content: flex-end;" />
            </el-tab-pane>

            <!-- 操作日志 -->
            <el-tab-pane label="操作日志" name="operation">
              <div style="margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <el-input v-model="operationLogQuery.keyword" placeholder="搜索用户/详情" clearable size="small" style="width: 180px;" @keyup.enter="operationLogQuery.page = 1; fetchOperationLogs()" />
                <el-select v-model="operationLogQuery.module" placeholder="模块" clearable size="small" style="width: 110px;" @change="operationLogQuery.page = 1; fetchOperationLogs()">
                  <el-option label="认证" value="auth" /><el-option label="待办" value="todo" /><el-option label="合同" value="contract" /><el-option label="报销" value="expense" /><el-option label="用户" value="user" /><el-option label="系统" value="system" />
                </el-select>
                <el-select v-model="operationLogQuery.action" placeholder="操作" clearable size="small" style="width: 100px;" @change="operationLogQuery.page = 1; fetchOperationLogs()">
                  <el-option label="登录" value="login" /><el-option label="创建" value="create" /><el-option label="修改" value="update" /><el-option label="删除" value="delete" /><el-option label="审批" value="approve" /><el-option label="驳回" value="reject" /><el-option label="导出" value="export" />
                </el-select>
                <el-select v-model="operationLogQuery.status" placeholder="状态" clearable size="small" style="width: 90px;" @change="operationLogQuery.page = 1; fetchOperationLogs()">
                  <el-option label="成功" value="success" /><el-option label="失败" value="fail" />
                </el-select>
                <el-button size="small" type="primary" @click="operationLogQuery.page = 1; fetchOperationLogs()">查询</el-button>
              </div>
              <el-table v-loading="operationLogsLoading" :data="operationLogsData" size="small" border style="width: 100%;">
                <el-table-column prop="timestamp" label="时间" width="160" />
                <el-table-column prop="userName" label="用户" width="100" />
                <el-table-column prop="action" label="操作" width="80">
                  <template #default="{ row }">
                    <el-tag :type="{ login: 'info', create: 'success', update: 'warning', delete: 'danger', approve: 'success', reject: 'danger', export: 'warning' }[row.action] || 'info'" size="small">{{ row.action }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="module" label="模块" width="90" />
                <el-table-column prop="ip" label="IP" width="120" />
                <el-table-column prop="status" label="状态" width="70">
                  <template #default="{ row }"><el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status === 'success' ? '成功' : '失败' }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="detail" label="操作详情" min-width="240" show-overflow-tooltip />
              </el-table>
              <el-pagination v-model:current-page="operationLogQuery.page" :page-size="operationLogQuery.pageSize" :total="operationLogsTotal" layout="total, prev, pager, next" small background @current-change="fetchOperationLogs" style="margin-top: 8px; justify-content: flex-end;" />
            </el-tab-pane>

            <!-- 接口调用日志 -->
            <el-tab-pane label="接口调用日志" name="apiCall">
              <div style="margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <el-input v-model="apiCallLogQuery.keyword" placeholder="搜索路径/用户" clearable size="small" style="width: 180px;" @keyup.enter="apiCallLogQuery.page = 1; fetchApiCallLogs()" />
                <el-select v-model="apiCallLogQuery.method" placeholder="方法" clearable size="small" style="width: 90px;" @change="apiCallLogQuery.page = 1; fetchApiCallLogs()">
                  <el-option label="GET" value="GET" /><el-option label="POST" value="POST" /><el-option label="PUT" value="PUT" /><el-option label="DELETE" value="DELETE" />
                </el-select>
                <el-select v-model="apiCallLogQuery.status" placeholder="状态" clearable size="small" style="width: 100px;" @change="apiCallLogQuery.page = 1; fetchApiCallLogs()">
                  <el-option label="2xx 成功" value="200" /><el-option label="4xx 客户端错误" value="400" /><el-option label="5xx 服务端错误" value="500" />
                </el-select>
                <el-button size="small" type="primary" @click="apiCallLogQuery.page = 1; fetchApiCallLogs()">查询</el-button>
              </div>
              <el-table v-loading="apiCallLogsLoading" :data="apiCallLogsData" size="small" border style="width: 100%;">
                <el-table-column prop="timestamp" label="时间" width="160" />
                <el-table-column prop="method" label="方法" width="70">
                  <template #default="{ row }"><el-tag :type="methodTagType(row.method)" size="small">{{ row.method }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="path" label="接口路径" min-width="200" show-overflow-tooltip />
                <el-table-column prop="userName" label="调用者" width="100" />
                <el-table-column prop="duration" label="耗时" width="80" sortable>
                  <template #default="{ row }">
                    <span :style="{ color: row.duration > 1000 ? '#ef4444' : row.duration > 200 ? '#f59e0b' : '#10b981' }">{{ row.duration }}ms</span>
                  </template>
                </el-table-column>
                <el-table-column prop="reqSize" label="请求大小" width="90">
                  <template #default="{ row }">{{ row.reqSize > 1024 ? (row.reqSize / 1024).toFixed(1) + 'KB' : row.reqSize + 'B' }}</template>
                </el-table-column>
                <el-table-column prop="resSize" label="响应大小" width="90">
                  <template #default="{ row }">{{ row.resSize > 1024 ? (row.resSize / 1024).toFixed(1) + 'KB' : row.resSize + 'B' }}</template>
                </el-table-column>
                <el-table-column prop="status" label="状态码" width="80">
                  <template #default="{ row }"><el-tag :type="row.status >= 500 ? 'danger' : row.status >= 400 ? 'warning' : 'success'" size="small">{{ row.status }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="ip" label="IP" width="110" />
                <el-table-column prop="errorMsg" label="错误信息" min-width="160" show-overflow-tooltip />
              </el-table>
              <el-pagination v-model:current-page="apiCallLogQuery.page" :page-size="apiCallLogQuery.pageSize" :total="apiCallLogsTotal" layout="total, prev, pager, next" small background @current-change="fetchApiCallLogs" style="margin-top: 8px; justify-content: flex-end;" />
            </el-tab-pane>

            <!-- 异常错误日志 -->
            <el-tab-pane label="异常错误日志" name="error">
              <div style="margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <el-input v-model="errorLogQuery.keyword" placeholder="搜索错误码/消息/traceId" clearable size="small" style="width: 200px;" @keyup.enter="errorLogQuery.page = 1; fetchErrorLogs()" />
                <el-select v-model="errorLogQuery.level" placeholder="级别" clearable size="small" style="width: 100px;" @change="errorLogQuery.page = 1; fetchErrorLogs()">
                  <el-option label="致命" value="fatal" /><el-option label="错误" value="error" /><el-option label="警告" value="warn" />
                </el-select>
                <el-select v-model="errorLogQuery.module" placeholder="模块" clearable size="small" style="width: 110px;" @change="errorLogQuery.page = 1; fetchErrorLogs()">
                  <el-option label="认证" value="auth" /><el-option label="AI" value="ai" /><el-option label="数据库" value="database" /><el-option label="连接器" value="connector" /><el-option label="系统" value="system" /><el-option label="大模型" value="llm" />
                </el-select>
                <el-select v-model="errorLogQuery.resolved" placeholder="状态" clearable size="small" style="width: 100px;" @change="errorLogQuery.page = 1; fetchErrorLogs()">
                  <el-option label="未解决" value="false" /><el-option label="已解决" value="true" />
                </el-select>
                <el-button size="small" type="primary" @click="errorLogQuery.page = 1; fetchErrorLogs()">查询</el-button>
              </div>
              <el-table v-loading="errorLogsLoading" :data="errorLogsData" size="small" border style="width: 100%;">
                <el-table-column prop="timestamp" label="时间" width="160" />
                <el-table-column prop="level" label="级别" width="80">
                  <template #default="{ row }"><el-tag :type="errorLevelTagType(row.level)" size="small" effect="dark">{{ row.level }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="errorCode" label="错误码" width="140" />
                <el-table-column prop="module" label="模块" width="90" />
                <el-table-column prop="message" label="错误信息" min-width="240" show-overflow-tooltip />
                <el-table-column prop="traceId" label="TraceId" width="110" show-overflow-tooltip />
                <el-table-column prop="ip" label="IP" width="110" />
                <el-table-column prop="resolved" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.resolved ? 'success' : 'danger'" size="small">{{ row.resolved ? '已解决' : '未解决' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="堆栈" width="70">
                  <template #default="{ row }">
                    <el-tooltip :content="row.stack" placement="left" :show-after="300">
                      <el-button text size="small" type="primary">查看</el-button>
                    </el-tooltip>
                  </template>
                </el-table-column>
              </el-table>
              <el-pagination v-model:current-page="errorLogQuery.page" :page-size="errorLogQuery.pageSize" :total="errorLogsTotal" layout="total, prev, pager, next" small background @current-change="fetchErrorLogs" style="margin-top: 8px; justify-content: flex-end;" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>

      <!-- ============ Tab7: 第三方系统管理 ============ -->
      <el-tab-pane label="第三方系统管理" name="third-party">
        <div class="sa-tab-content">
          <el-row :gutter="16">
            <!-- 系统列表 -->
            <el-col :xs="24" :sm="10" :md="8">
              <el-card shadow="never" class="tp-list-card" v-loading="tpSystemsLoading">
                <template #header>
                  <div class="card-header-flex">
                    <span class="card-title">已接入系统</span>
                    <el-tag size="small" type="info">{{ tpSystems.length }} 个</el-tag>
                  </div>
                </template>
                <div class="tp-list">
                  <div
                    v-for="item in tpSystems"
                    :key="item.id"
                    class="tp-item"
                    :class="{ active: selectedTpSystem?.id === item.id, disabled: !item.enabled }"
                    @click="selectTpSystem(item)"
                  >
                    <div class="tp-item-top">
                      <div class="tp-icon-wrap" :style="{ background: item.enabled ? 'linear-gradient(135deg, #1a3a5c, #3b82f6)' : '#dcdfe6' }">
                        <el-icon :size="18"><component :is="resolveIcon(item.icon)" /></el-icon>
                      </div>
                      <div class="tp-item-info">
                        <div class="tp-item-name">
                          {{ item.name }}
                          <span class="tp-status-dot" :style="{ background: tpStatusColor(item.status) }"></span>
                        </div>
                        <div class="tp-item-desc">{{ item.description }}</div>
                      </div>
                    </div>
                    <div class="tp-item-meta">
                      <el-tag :type="tpTypeTag(item.type).tagType" size="small" effect="plain">{{ tpTypeTag(item.type).text }}</el-tag>
                      <el-tag size="small" effect="plain">{{ item.category }}</el-tag>
                      <el-tag :type="item.enabled ? 'success' : 'info'" size="small">{{ tpStatusText(item.status) }}</el-tag>
                      <el-button
                        size="small"
                        link
                        :type="item.enabled ? 'danger' : 'success'"
                        @click.stop="toggleTpSystem(item)"
                      >
                        {{ item.enabled ? '禁用' : '启用' }}
                      </el-button>
                    </div>
                  </div>
                  <el-empty v-if="!tpSystems.length" description="暂无接入系统" />
                </div>
              </el-card>
            </el-col>

            <!-- 系统详情 & 参数配置 -->
            <el-col :xs="24" :sm="14" :md="16">
              <el-empty v-if="!selectedTpSystem" description="请选择左侧系统查看详情和配置参数" />

              <div v-else v-loading="tpDetailLoading" class="tp-detail">
                <!-- 系统概览 -->
                <el-card shadow="never" class="tp-overview-card">
                  <template #header>
                    <div class="card-header-flex">
                      <span class="card-title">
                        <el-icon :size="18"><component :is="resolveIcon(selectedTpSystem.icon)" /></el-icon>
                        {{ selectedTpSystem.name }} — 系统概览
                      </span>
                      <el-tag :type="selectedTpSystem.enabled ? 'success' : 'info'" size="small">
                        {{ tpStatusText(selectedTpSystem.status) }}
                      </el-tag>
                    </div>
                  </template>
                  <el-descriptions :column="3" border size="small">
                    <el-descriptions-item label="系统编码">{{ selectedTpSystem.code }}</el-descriptions-item>
                    <el-descriptions-item label="对接方式">
                      <el-tag :type="tpTypeTag(selectedTpSystem.type).tagType" size="small">{{ tpTypeTag(selectedTpSystem.type).text }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="版本">{{ selectedTpSystem.version }}</el-descriptions-item>
                    <el-descriptions-item label="接口数量">{{ selectedTpSystem.apiCount }} 个</el-descriptions-item>
                    <el-descriptions-item label="业务分类">{{ selectedTpSystem.category }}</el-descriptions-item>
                    <el-descriptions-item label="最近同步">{{ selectedTpSystem.lastSyncTime }}</el-descriptions-item>
                    <el-descriptions-item label="系统描述" :span="3">{{ selectedTpSystem.description }}</el-descriptions-item>
                  </el-descriptions>
                </el-card>

                <!-- 对接参数配置 -->
                <el-card shadow="never" class="tp-config-card" style="margin-top: 16px;">
                  <template #header>
                    <div class="card-header-flex">
                      <span class="card-title">
                        <el-icon><Link /></el-icon>
                        对接参数配置
                      </span>
                      <div style="display: flex; gap: 8px;">
                        <el-button
                          type="warning"
                          plain
                          size="small"
                          :icon="Connection"
                          :loading="tpTesting"
                          @click="testTpConnection"
                        >
                          测试连接
                        </el-button>
                        <el-button
                          type="primary"
                          size="small"
                          :icon="Check"
                          :loading="tpConfigSaving"
                          @click="saveTpConfig"
                        >
                          保存配置
                        </el-button>
                      </div>
                    </div>
                  </template>

                  <el-form label-width="140px" label-position="right" size="small">
                    <el-form-item
                      v-for="param in selectedTpSystem.params"
                      :key="param.key"
                      :label="param.label"
                      :required="param.required"
                    >
                      <el-input
                        v-if="param.type === 'text'"
                        v-model="tpConfigForm[param.key]"
                        :placeholder="param.description"
                      />
                      <el-input
                        v-else-if="param.type === 'password'"
                        v-model="tpConfigForm[param.key]"
                        type="password"
                        show-password
                        :placeholder="param.description"
                      />
                      <el-input-number
                        v-else-if="param.type === 'number'"
                        v-model="tpConfigForm[param.key]"
                        :min="1"
                        controls-position="right"
                        style="width: 200px;"
                      />
                      <el-select
                        v-else-if="param.type === 'select'"
                        v-model="tpConfigForm[param.key]"
                        style="width: 100%;"
                      >
                        <el-option v-for="opt in param.options || []" :key="opt" :label="opt" :value="opt" />
                      </el-select>
                      <div class="param-desc">{{ param.description }}</div>
                    </el-form-item>
                  </el-form>

                  <!-- 安全提示 -->
                  <div class="config-security-tip">
                    <el-icon :size="14"><Warning /></el-icon>
                    <span>密钥类参数已加密存储，仅可在本页面修改。建议定期轮换密钥，确保系统安全。</span>
                  </div>
                </el-card>

                <!-- 连接测试结果 -->
                <el-card v-if="tpTestResult" shadow="never" class="tp-test-card" style="margin-top: 16px;">
                  <template #header>
                    <div class="card-header-flex">
                      <span class="card-title">连接测试结果</span>
                      <el-tag :type="tpTestResult.success ? 'success' : 'danger'" effect="dark" size="small">
                        <el-icon v-if="tpTestResult.success"><CircleCheck /></el-icon>
                        <el-icon v-else><CircleClose /></el-icon>
                        {{ tpTestResult.success ? '连接成功' : '连接失败' }}
                      </el-tag>
                    </div>
                  </template>
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="测试时间">{{ tpTestResult.testTime }}</el-descriptions-item>
                    <el-descriptions-item label="响应时间" v-if="tpTestResult.responseTime">
                      <span :class="{ 'resp-fast': tpTestResult.responseTime < 200, 'resp-slow': tpTestResult.responseTime > 500 }">
                        {{ tpTestResult.responseTime }}ms
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="测试结果" :span="2">
                      {{ tpTestResult.message }}
                    </el-descriptions-item>
                    <el-descriptions-item v-if="tpTestResult.details?.apiVersion" label="API版本">{{ tpTestResult.details.apiVersion }}</el-descriptions-item>
                    <el-descriptions-item v-if="tpTestResult.details?.rateLimit" label="限流策略">{{ tpTestResult.details.rateLimit }}</el-descriptions-item>
                    <el-descriptions-item v-if="tpTestResult.details?.errorCode" label="错误码">
                      <el-tag type="danger" size="small">{{ tpTestResult.details.errorCode }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item v-if="tpTestResult.details?.suggestion" label="修复建议" :span="2">{{ tpTestResult.details.suggestion }}</el-descriptions-item>
                  </el-descriptions>
                </el-card>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.system-admin {
  padding: 16px;
  height: calc(100vh - 100px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sa-tabs {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sa-tabs :deep(.el-tabs__content) {
  padding: 16px;
  flex: 1;
  overflow: hidden;
}

.sa-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.sa-tab-content {
  min-height: 200px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
}

/* 滚动条美化 */
.sa-tab-content::-webkit-scrollbar {
  width: 6px;
}
.sa-tab-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}
.sa-tab-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.sa-tab-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 分隔标题 */
.divider-title {
  margin-left: 6px;
  font-weight: 600;
  color: #1a3a5c;
}

/* ============ 数据安全卡片 ============ */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
}

.config-card {
  border-radius: 8px;
}

.config-card-wide {
  grid-column: span 2;
}

.config-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.config-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}
.icon-blue { background: linear-gradient(135deg, #1a3a5c, #3b82f6); }
.icon-orange { background: linear-gradient(135deg, #e8734a, #f59e0b); }
.icon-green { background: linear-gradient(135deg, #10b981, #059669); }
.icon-purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
.icon-cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); }

.config-title {
  flex: 1;
  font-weight: 600;
  color: #1a3a5c;
}

.config-meta {
  font-size: 13px;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.meta-label {
  color: #909399;
}
.meta-value {
  color: #303133;
  font-weight: 500;
}

.mask-table {
  margin-top: 4px;
}

/* ============ 访问安全 ============ */
.access-section {
  margin-bottom: 8px;
}
.access-card {
  border-radius: 8px;
  margin-bottom: 16px;
  height: calc(100% - 16px);
}
.access-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 12px;
}
.access-card-title .el-icon {
  color: #e8734a;
}
.status-tag {
  margin-left: auto;
}
.access-card-body {
  font-size: 13px;
}
.provider-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.provider-tag {
  border-radius: 4px;
}
.ip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ip-tag {
  font-family: 'Courier New', monospace;
}
.empty-text {
  color: #909399;
  font-size: 12px;
}
.stat-line {
  display: flex;
  justify-content: space-between;
  color: #606266;
}
.stat-line b {
  color: #1a3a5c;
  font-size: 15px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  text-align: center;
}
.stat-item {
  padding: 6px 0;
}
.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #1a3a5c;
}
.stat-num.online {
  color: #10b981;
}
.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.pwd-policy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pwd-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.pwd-row span {
  color: #606266;
}

/* ============ 操作栏 ============ */
.action-bar {
  margin: 16px 0;
  display: flex;
  justify-content: flex-end;
}
.top-action-bar {
  justify-content: flex-start;
  margin-top: 0;
}

/* ============ 审计 ============ */
.stat-cards {
  margin-bottom: 16px;
}
.stat-card {
  border-radius: 8px;
  text-align: center;
  border-top: 3px solid #1a3a5c;
}
.stat-card-red {
  border-top-color: #ef4444;
}
.stat-card-orange {
  border-top-color: #f59e0b;
}
.stat-card-num {
  font-size: 28px;
  font-weight: 700;
  color: #1a3a5c;
  line-height: 1.2;
}
.stat-card-red .stat-card-num {
  color: #ef4444;
}
.stat-card-orange .stat-card-num {
  color: #f59e0b;
}
.stat-card-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.chart-card {
  margin-bottom: 16px;
  border-radius: 8px;
}
.chart-box {
  height: 260px;
}

.card-title {
  font-weight: 600;
  color: #1a3a5c;
}

.table-card {
  margin-bottom: 16px;
  border-radius: 8px;
}
.card-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mono-table :deep(.el-table__cell) {
  font-family: 'Courier New', Consolas, monospace;
  font-size: 12px;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

:deep(.row-high-risk) {
  background-color: #fef2f2 !important;
}
:deep(.row-high-risk:hover > td) {
  background-color: #fee2e2 !important;
}

/* ============ 运维监控 ============ */
.gauge-card {
  text-align: center;
  border-radius: 8px;
  margin-bottom: 16px;
}
.gauge-title {
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 8px;
}
.gauge-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.kpi-card {
  text-align: center;
  border-radius: 8px;
  margin-bottom: 16px;
  border-top: 3px solid #1a3a5c;
}
.kpi-num {
  font-size: 24px;
  font-weight: 700;
  color: #1a3a5c;
}
.kpi-num.num-red {
  color: #ef4444;
}
.kpi-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-left: 4px solid #3b82f6;
  background: #f8fafc;
  border-radius: 4px;
}
.alert-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}
.alert-level {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}
.alert-content {
  flex: 1;
}
.alert-title {
  font-weight: 600;
  color: #1a3a5c;
}
.alert-message {
  font-size: 13px;
  color: #606266;
  margin: 4px 0;
}
.alert-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 16px;
}

/* ============ 组织架构 ============ */
.org-content :deep(.el-tree) {
  background: transparent;
}
.dept-card {
  border-radius: 8px;
  margin-bottom: 16px;
}
.role-tag {
  margin-right: 4px;
}

/* ============ 角色权限 ============ */
.role-list-card,
.perm-card {
  border-radius: 8px;
}
.role-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.role-item:hover {
  border-color: #e8734a;
  background: #fff7f3;
}
.role-item.active {
  border-color: #e8734a;
  background: #fff7f3;
  box-shadow: 0 0 0 1px #e8734a inset;
}
.role-item-main {
  flex: 1;
}
.role-item-name {
  font-weight: 600;
  color: #1a3a5c;
  display: flex;
  align-items: center;
  gap: 6px;
}
.selected-tag {
  font-size: 11px;
}
.role-item-code {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
  margin-top: 2px;
}
.role-item-desc {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}
.role-item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
}

.perm-node {
  display: flex;
  align-items: center;
  gap: 8px;
}
.perm-node-name {
  color: #1a3a5c;
}
.perm-type-tag {
  font-size: 11px;
}
.perm-node-code {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .system-admin {
    padding: 8px;
  }
  .config-card-wide {
    grid-column: span 1;
  }
  .config-grid {
    grid-template-columns: 1fr;
  }
  .filter-bar {
    width: 100%;
  }
  .card-header-flex {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* 数据安全 - 标签列��� */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

/* 数据安全 - 配置卡片增强 */
.config-card .config-meta .meta-row {
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
}
.config-card .config-meta .meta-row:last-child {
  border-bottom: none;
}
.config-card .config-meta .meta-label {
  min-width: 70px;
  color: #64748b;
  font-size: 12px;
  flex-shrink: 0;
}
.config-card .config-meta .meta-value {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
}

/* 系统日志管理 */
.log-stat-card {
  text-align: center;
  padding: 16px;
}
.log-stat-card .log-stat-num {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.1;
}
.log-stat-card .log-stat-label {
  font-size: 14px;
  color: #475569;
  font-weight: 600;
  margin-top: 4px;
}
.log-stat-card .log-stat-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.access-detail {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
}

/* ============ 第三方系统管理 ============ */
.tp-list-card {
  min-height: 400px;
}
.tp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tp-item {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.tp-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59,130,246,0.12);
}
.tp-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}
.tp-item.disabled {
  background: #f5f5f5;
  opacity: 0.8;
}
.tp-item-top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tp-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.tp-item-info {
  flex: 1;
  min-width: 0;
}
.tp-item-name {
  font-weight: 600;
  color: #1a3a5c;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tp-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.tp-item-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tp-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.tp-detail {
  min-height: 400px;
}
.tp-overview-card {
  border-radius: 8px;
}
.tp-config-card {
  border-radius: 8px;
}
.param-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.config-security-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 12px;
  background: #fffbeb;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
  border: 1px solid #fde68a;
}
.tp-test-card {
  border-radius: 8px;
}
.resp-fast {
  color: #10b981;
  font-weight: 600;
}
.resp-slow {
  color: #ef4444;
  font-weight: 600;
}
</style>

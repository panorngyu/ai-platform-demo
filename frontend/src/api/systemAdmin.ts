import { request } from './request'

/* ===========================================================
 * 系统管理 API 封装
 * 包含：数据安全、访问安全、审计、运维监控、组织架构、角色权限
 * =========================================================== */

// ============ 数据安全 ============
export interface SecurityConfig {
  tls: {
    enabled: boolean
    version: string
    certExpiry: string
  }
  storage: {
    enabled: boolean
    algorithm: string
    encryptedTables: string[]
  }
  desensitize: {
    enabled: boolean
    rules: Array<{
      field: string
      type: string
      sample: string
      scenes?: string[]
    }>
  }
  watermark: {
    enabled: boolean
    text: string
    position: string
  }
  backup: {
    enabled: boolean
    algorithm: string
    schedule: string
    retention: string
  }
}

export function getSecurityConfig() {
  return request.get<SecurityConfig>('/system-admin/security/config')
}

export function updateSecurityConfig(data: Partial<SecurityConfig>) {
  return request.put<SecurityConfig>('/system-admin/security/config', data)
}

// ============ 访问安全 ============
export interface AccessConfig {
  sso: {
    enabled: boolean
    providers: Array<{ name: string; status: string }>
  }
  mfa: {
    enabled: boolean
    methods: string[]
  }
  rbac: {
    enabled: boolean
    roles: number
    permissions: number
  }
  ipWhitelist: {
    enabled: boolean
    ips: string[]
  }
  session: {
    timeout: number
    maxConcurrent: number
    currentActive: number
  }
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumber: boolean
    requireSpecial: boolean
    expiry: number
    historyCount: number
  }
}

export function getAccessConfig() {
  return request.get<AccessConfig>('/system-admin/access/config')
}

export function updateAccessConfig(data: Partial<AccessConfig>) {
  return request.put<AccessConfig>('/system-admin/access/config', data)
}

// ============ 审计 ============
export interface AuditLog {
  id: number
  time: string
  user: string
  action: string
  module: string
  detail: string
  ip: string
  status: 'success' | 'failed'
}

export interface AuditDataLog {
  id: number
  time: string
  user: string
  dataType: string
  operation: string
  recordId: string
  ip: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface AuditStats {
  todayOperations: number
  todayFailures: number
  weekOperations: number
  highRiskAccess: number
  moduleDistribution: Array<{ name: string; value: number }>
}

export interface AuditLogQuery {
  page: number
  pageSize: number
  module?: string
  action?: string
  status?: string
}

export interface AuditDataLogQuery {
  page: number
  pageSize: number
  dataType?: string
  riskLevel?: string
}

export interface PageResult<T> {
  list: T[]
  total: number
}

export function getAuditLogs(params: AuditLogQuery) {
  return request.get<PageResult<AuditLog>>('/system-admin/audit/logs', params)
}

export function getAuditDataLogs(params: AuditDataLogQuery) {
  return request.get<PageResult<AuditDataLog>>('/system-admin/audit/data-logs', params)
}

export function getAuditStats() {
  return request.get<AuditStats>('/system-admin/audit/stats')
}

// ============ 运维监控 ============
export interface SystemMonitor {
  cpuUsage: number // CPU使用率 %
  memoryUsage: number // 内存使用率 %
  diskUsage: number // 磁盘使用率 %
  networkIO: number // 网络IO %
  cpuCores: number
  memoryTotal: number // GB
  diskTotal: number // GB
  uptime: string
}

export interface AppMonitor {
  totalRequests: number
  avgResponseTime: number // ms
  errorRate: number // %
  qps: number
  slowApis: Array<{
    id: number
    api: string
    method: string
    avgTime: number
    calls: number
    lastSlowTime: string
  }>
}

export interface SystemLog {
  id: number
  time: string
  level: 'debug' | 'info' | 'warn' | 'error'
  module: string
  message: string
  traceId: string
}

export interface AlertItem {
  id: number
  level: 'critical' | 'warning' | 'info'
  title: string
  message: string
  source: string
  status: 'active' | 'resolved'
  time: string
}

export interface AlertConfig {
  cpuThreshold: number
  memoryThreshold: number
  diskThreshold: number
  errorRateThreshold: number
  notifyEmails: string[]
}

export interface SystemLogQuery {
  page: number
  pageSize: number
  level?: string
}

export function getSystemMonitor() {
  return request.get<SystemMonitor>('/system-admin/monitor/system')
}

export function getAppMonitor() {
  return request.get<AppMonitor>('/system-admin/monitor/app')
}

export function getMonitorLogs(params: SystemLogQuery) {
  return request.get<PageResult<SystemLog>>('/system-admin/monitor/logs', params)
}

export function getAlerts() {
  return request.get<AlertItem[]>('/system-admin/monitor/alerts')
}

export function getAlertConfig() {
  return request.get<AlertConfig>('/system-admin/monitor/alert-config')
}

// ============ 组织架构 ============
export interface Department {
  id: number
  name: string
  parentId: number | null
  leader?: string
  userCount: number
  children?: Department[]
}

export interface Position {
  id: number
  name: string
  code: string
  departmentId: number
  departmentName: string
  level: string
}

export interface SystemUser {
  id: number
  username: string
  realName: string
  email: string
  phone: string
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
  roles: string[]
  status: 'active' | 'disabled'
  lastLogin: string
}

export interface UserQuery {
  page: number
  pageSize: number
  keyword?: string
}

export function getDepartments() {
  return request.get<Department[]>('/system-admin/departments')
}

export function getPositions() {
  return request.get<Position[]>('/system-admin/positions')
}

export function getUsers(params: UserQuery) {
  return request.get<PageResult<SystemUser>>('/system-admin/users', params)
}

export function toggleUserStatus(id: number) {
  return request.put(`/system-admin/users/${id}/toggle`)
}

// ============ 角色权限 ============
export interface Role {
  id: number
  name: string
  code: string
  userCount: number
  description: string
}

export interface Permission {
  id: number
  name: string
  code: string
  type: 'menu' | 'button' | 'api'
  parentId: number | null
  children?: Permission[]
}

export function getRoles() {
  return request.get<Role[]>('/system-admin/roles')
}

export function getPermissions() {
  return request.get<Permission[]>('/system-admin/permissions')
}

export function getRolePermissions(roleId: number) {
  return request.get<number[]>(`/system-admin/roles/${roleId}/permissions`)
}

export function updateRolePermissions(roleId: number, permissionIds: number[]) {
  return request.put(`/system-admin/roles/${roleId}/permissions`, { permissionIds })
}

// ============ 系统日志管理 ============
export function getLoginLogs(params?: any) {
  return request.get('/system-admin/logs/login', params)
}
export function getOperationLogs(params?: any) {
  return request.get('/system-admin/logs/operation', params)
}
export function getApiCallLogs(params?: any) {
  return request.get('/system-admin/logs/api-call', params)
}
export function getErrorLogs(params?: any) {
  return request.get('/system-admin/logs/error', params)
}
export function getLogStats() {
  return request.get('/system-admin/logs/stats')
}

// ============ 第三方系统管理 ============
export interface ThirdPartySystemParam {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'select'
  value: string
  required: boolean
  description: string
  options?: string[]
}

export interface ThirdPartySystem {
  id: number
  name: string
  code: string
  type: 'api' | 'sdk' | 'database'
  category: string
  status: 'online' | 'offline' | 'error'
  enabled: boolean
  icon: string
  description: string
  lastSyncTime: string
  version: string
  apiCount: number
  params: ThirdPartySystemParam[]
}

export interface ThirdPartySystemListItem {
  id: number
  name: string
  code: string
  type: 'api' | 'sdk' | 'database'
  category: string
  status: 'online' | 'offline' | 'error'
  enabled: boolean
  icon: string
  description: string
  lastSyncTime: string
  version: string
  apiCount: number
}

export interface ConnectionTestResult {
  systemId: number
  systemName: string
  success: boolean
  message: string
  responseTime: number | null
  testTime: string
  details: any
}

export function getThirdPartySystems() {
  return request.get<ThirdPartySystemListItem[]>('/system-admin/third-party/list')
}

export function getThirdPartySystemDetail(id: number) {
  return request.get<ThirdPartySystem>(`/system-admin/third-party/${id}`)
}

export function updateThirdPartySystemConfig(id: number, params: Record<string, string>) {
  return request.put(`/system-admin/third-party/${id}/config`, { params })
}

export function testThirdPartyConnection(id: number) {
  return request.post<ConnectionTestResult>(`/system-admin/third-party/${id}/test-connection`)
}

export function toggleThirdPartySystem(id: number) {
  return request.put(`/system-admin/third-party/${id}/toggle`)
}

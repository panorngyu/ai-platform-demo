import { request } from './request'

/* ===========================================================
 * 连接器管理 API 封装
 * =========================================================== */

// ============ 类型定义 ============
export type ConnectorType =
  | 'rest_api'
  | 'database'
  | 'message_queue'
  | 'file_transfer'
  | 'esb'
  | 'rpa'

export type ConnectorStatus = 'running' | 'stopped' | 'error'

export interface Connector {
  id: number
  name: string
  type: ConnectorType
  targetType: string
  config: any
  status: ConnectorStatus
  syncCount: number
  lastSyncTime: string
  createdAt: string
  updatedAt: string
}

export interface ConnectorTemplate {
  id: number
  name: string
  type: ConnectorType
  targetType: string
  description: string
  config: any
}

export interface MonitorOverview {
  total: number
  running: number
  stopped: number
  error: number
  todaySyncCount: number
  avgLatency: number
}

export interface MonitorTrendItem {
  date: string
  successCount: number
  failCount: number
}

export interface MonitorDetail {
  connectorId: number
  connectorName: string
  status: ConnectorStatus
  syncCount: number
  errorCount: number
  latency: number
  lastSyncTime: string
  recentRecords: Array<{
    time: string
    status: 'success' | 'fail'
    recordCount: number
    duration: number
    message: string
  }>
}

// ============ 连接器 CRUD ============
export function getConnectors(params?: any) {
  return request.get<Connector[]>('/connectors', params)
}

export function getConnectorById(id: number) {
  return request.get<Connector>(`/connectors/${id}`)
}

export function createConnector(data: any) {
  return request.post('/connectors', data)
}

export function updateConnector(id: number, data: any) {
  return request.put(`/connectors/${id}`, data)
}

export function deleteConnector(id: number) {
  return request.delete(`/connectors/${id}`)
}

export function toggleConnector(id: number, action: string) {
  return request.put(`/connectors/${id}/toggle`, { action })
}

// ============ 模板库 ============
export function getConnectorTemplates() {
  return request.get<ConnectorTemplate[]>('/connectors/templates')
}

export function getConnectorTemplateById(id: number) {
  return request.get<ConnectorTemplate>(`/connectors/templates/${id}`)
}

// ============ 监控 ============
export function getMonitorOverview() {
  return request.get<MonitorOverview>('/connectors/monitor/overview')
}

export function getMonitorTrend() {
  return request.get<MonitorTrendItem[]>('/connectors/monitor/trend')
}

export function getMonitorDetail(id: number) {
  return request.get<MonitorDetail>(`/connectors/monitor/${id}`)
}

// ============ 测试 ============
export function testConnector(id: number) {
  return request.post(`/connectors/${id}/test`)
}

export function testConnection(config: any) {
  return request.post('/connectors/test', config)
}

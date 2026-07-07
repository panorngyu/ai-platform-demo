import { request } from './request'

export interface OverviewResult {
  totalApprovals: number
  passRate: number
  backlog: number
  timeoutRate: number
  trends?: {
    total?: number
    passRate?: number
    backlog?: number
    timeoutRate?: number
  }
  aiProcessed?: number
  aiProcessingRate?: number
}

export interface EfficiencyResult {
  trend: Array<{ date: string; value: number; passed?: number }>
  typeDistribution: Array<{ name: string; value: number }>
  departmentRank: Array<{ name: string; value: number; avgHours?: number }>
  efficiency: {
    avgProcessTime?: number
    aiRate?: number
    passRate?: number
  }
}

export interface AlertItem {
  id: string | number
  level: 'high' | 'medium' | 'low'
  title: string
  content: string
  source?: string
  time: string
  status?: string
}

export function getOverview() {
  return request.get<OverviewResult>('/dashboard/overview')
}

export function getEfficiency() {
  return request.get<EfficiencyResult>('/dashboard/efficiency')
}

export function getAlerts() {
  return request.get<AlertItem[]>('/dashboard/alerts')
}

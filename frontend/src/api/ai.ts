import { request } from './request'

export interface AuditSummaryResult {
  summary: string
  keyPoints?: string[]
  amount?: number
  parties?: string[]
  date?: string
}

export interface RiskItem {
  level: 'high' | 'medium' | 'low'
  type: string
  description: string
  suggestion?: string
}

export interface AuditRiskResult {
  riskLevel: 'high' | 'medium' | 'low'
  riskScore?: number
  risks: RiskItem[]
  conclusion?: string
}

export interface AuditOpinionResult {
  opinion: string
  suggestion?: string
  conclusion?: 'approve' | 'reject' | 'return'
}

export function auditSummary(content: string) {
  return request.post<AuditSummaryResult>('/ai/audit/summary', { content })
}

export function auditRisk(content: string) {
  return request.post<AuditRiskResult>('/ai/audit/risk', { content })
}

export function auditOpinion(content: string) {
  return request.post<AuditOpinionResult>('/ai/audit/opinion', { content })
}

export function ocrInvoice(file: File) {
  const formData = new FormData()
  formData.append('image', file)
  return request.upload('/ai/ocr/invoice', formData)
}

export function ocrContract(file: File) {
  const formData = new FormData()
  formData.append('image', file)
  return request.upload('/ai/ocr/contract', formData)
}

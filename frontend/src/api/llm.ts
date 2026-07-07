import { request } from './request'

/* ===========================================================
 * 大模型服务管理 API 封装
 * =========================================================== */

// ============ 供应商管理 ============
export interface LlmProvider {
  id: number
  name: string
  provider: string // wenxin | qianwen | glm
  status: string // active | inactive
  apiKey: string
  model: string
  createdAt: string
}

export function getProviders() {
  return request.get<LlmProvider[]>('/llm/providers')
}
export function addProvider(data: Partial<LlmProvider>) {
  return request.post('/llm/providers', data)
}
export function updateProvider(id: number, data: Partial<LlmProvider>) {
  return request.put(`/llm/providers/${id}`, data)
}
export function deleteProvider(id: number) {
  return request.delete(`/llm/providers/${id}`)
}
export function testProvider(id: number) {
  return request.post(`/llm/providers/${id}/test`)
}

// ============ 模型参数 ============
export interface LlmParams {
  temperature: number
  topP: number
  maxTokens: number
  model: string
  systemPrompt: string
}

export function getParams() {
  return request.get<LlmParams>('/llm/params')
}
export function updateParams(data: Partial<LlmParams>) {
  return request.put('/llm/params', data)
}

// ============ Prompt模板 ============
export interface PromptTemplate {
  id: number
  name: string
  category: string
  content: string
  variables: string[]
  createdAt: string
  updatedAt: string
}

export function getTemplates() {
  return request.get<PromptTemplate[]>('/llm/templates')
}
export function getTemplateById(id: number) {
  return request.get<PromptTemplate>(`/llm/templates/${id}`)
}
export function createTemplate(data: Partial<PromptTemplate>) {
  return request.post('/llm/templates', data)
}
export function updateTemplate(id: number, data: Partial<PromptTemplate>) {
  return request.put(`/llm/templates/${id}`, data)
}
export function deleteTemplate(id: number) {
  return request.delete(`/llm/templates/${id}`)
}
export function previewTemplate(id: number, variables: Record<string, any>) {
  return request.post(`/llm/templates/${id}/preview`, { variables })
}

// ============ Token用量 ============
export interface UsageOverview {
  totalTokens: number
  totalCost: number
  todayTokens: number
  monthTokens: number
  trend?: Array<{ date: string; tokens: number }>
}

export interface UsageDetailItem {
  id: number
  time: string
  provider: string
  feature: string
  tokens: number
  cost: number
  status: string
}

export interface UsageDetailResult {
  list: UsageDetailItem[]
  total: number
}

export interface UsageByFeatureItem {
  feature: string
  tokens: number
  cost: number
}

export function getUsageOverview() {
  return request.get<UsageOverview>('/llm/usage/overview')
}
export function getUsageDetail(params: any) {
  return request.get<UsageDetailResult>('/llm/usage/detail', params)
}
export function getUsageByFeature() {
  return request.get<UsageByFeatureItem[]>('/llm/usage/by-feature')
}

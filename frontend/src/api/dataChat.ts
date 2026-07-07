import { request } from './request'

/* ===========================================================
 * 数据智能问答 API 封装
 * =========================================================== */

// ============ 类型定义 ============
export interface ChatChart {
  type: 'bar' | 'line' | 'pie'
  title: string
  xAxis?: string[]
  series?: Array<{ name: string; data: number[]; type?: string }>
  radius?: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  understanding?: string
  sql?: string
  connectorName?: string
  autoMatched?: boolean
  data?: any[]
  columns?: string[]
  summary?: string
  chart?: ChatChart
}

export interface ChatSession {
  id: number
  title: string
  messages: ChatMessage[]
  createdAt: string
}

export interface ChatConnector {
  id: number
  name: string
  type?: string
  status?: 'running' | 'stopped' | 'error'
}

// ============ 会话管理 ============
export function getSessions() {
  return request.get<ChatSession[]>('/data-chat/sessions')
}

export function createSession(title: string) {
  return request.post<ChatSession>('/data-chat/sessions', { title })
}

export function getSessionById(id: number) {
  return request.get<ChatSession>(`/data-chat/sessions/${id}`)
}

export function deleteSession(id: number) {
  return request.delete(`/data-chat/sessions/${id}`)
}

// ============ 问答 ============
export function ask(sessionId: number, question: string, connectorId?: number) {
  return request.post<ChatMessage>('/data-chat/ask', {
    sessionId,
    question,
    connectorId
  })
}

export function getChatConnectors() {
  return request.get<ChatConnector[]>('/data-chat/connectors')
}

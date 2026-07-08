import request from './request'

// ============ 工作流节点类型 ============

export interface ApiHeader {
  key: string
  value: string
}

export interface ApiCallConfig {
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers: ApiHeader[]
  bodyType: 'json' | 'form' | 'raw'
  body: string
  timeout: number
  retryCount: number
  successField: string  // 成功标识字段，如 data.code === 0
  outputKey: string      // 响应存储变量名
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'api_call' | 'ai_process' | 'condition'
  enabled: boolean
  config: ApiCallConfig
}

export interface Workflow {
  name: string
  description: string
  triggerType: 'manual' | 'api' | 'scheduled'
  cron?: string
  steps: WorkflowStep[]
}

// 默认空工作流
export function createDefaultWorkflow(): Workflow {
  return {
    name: '',
    description: '',
    triggerType: 'manual',
    steps: []
  }
}

// 默认空步骤
export function createDefaultStep(): WorkflowStep {
  return {
    id: 'step-' + Date.now(),
    name: '',
    type: 'api_call',
    enabled: true,
    config: {
      name: '',
      url: '',
      method: 'POST',
      headers: [],
      bodyType: 'json',
      body: '{}',
      timeout: 30000,
      retryCount: 0,
      successField: '',
      outputKey: ''
    }
  }
}

// ============ 智能体类型定义 ============

export type AgentType = 'chat' | 'flow' | 'data' | 'custom'
export type AgentStatus = 'online' | 'offline' | 'draft'

export interface AgentItem {
  id: number | string
  name: string
  description: string
  type: AgentType
  status: AgentStatus
  icon: string
  category: string
  prompt: string
  model: string
  tags: string[]
  isBuiltin: boolean
  usageCount: number
  createTime: string
  updateTime: string
  routePath?: string
  workflow?: Workflow
}

export interface AgentCreateParams {
  name: string
  description: string
  type: AgentType
  icon: string
  category: string
  prompt: string
  model: string
  tags: string[]
  workflow?: Workflow
}

export interface AgentUpdateParams extends Partial<AgentCreateParams> {
  id: number | string
}

// ============ API 方法 ============

export function getAgents() {
  return request.get<AgentItem[]>('/agent/list')
}

export function getAgentDetail(id: number | string) {
  return request.get<AgentItem>(`/agent/${id}`)
}

export function createAgent(params: AgentCreateParams) {
  return request.post<AgentItem>('/agent/create', params)
}

export function updateAgent(params: AgentUpdateParams) {
  return request.put<AgentItem>(`/agent/${params.id}`, params)
}

export function deleteAgent(id: number | string) {
  return request.delete(`/agent/${id}`)
}

export function toggleAgentStatus(id: number | string) {
  return request.put(`/agent/${id}/toggle`)
}

import { request } from './request'

export interface TodoQuery {
  page?: number
  pageSize?: number
  type?: string
  status?: string
  keyword?: string
  sortBy?: string
  startDate?: string
  endDate?: string
}

export interface TodoItem {
  id: string | number
  title: string
  type: 'contract' | 'expense' | 'purchase' | 'project' | 'asset' | string
  typeName?: string
  sourceSystem?: string
  amount?: number
  applicant?: string
  department?: string
  submitTime?: string
  status?: string
  statusName?: string
  urgency?: 'high' | 'medium' | 'low' | string
  urgencyName?: string
  isTimeout?: boolean
  description?: string
  summary?: string
}

export interface TodoListResult {
  list: TodoItem[]
  total: number
  page: number
  pageSize: number
  stats?: {
    pending: number
    timeout: number
    todayNew: number
    monthProcessed: number
  }
}

export function getTodos(params: TodoQuery) {
  return request.get<TodoListResult>('/todos', params)
}

export function getTodoById(id: string | number) {
  return request.get<TodoItem>(`/todos/${id}`)
}

export interface BatchApproveParams {
  ids: (string | number)[]
  action: 'approve' | 'reject' | 'transfer'
  opinion?: string
  transferTo?: string
}

export function batchApprove(data: BatchApproveParams) {
  return request.post('/todos/batch-approve', data)
}

// AI 批量审批
export interface AiBatchResultItem {
  id: string | number
  title: string
  type: string
  amount: number
  applicantName: string
  department: string
  riskLevel: 'low' | 'medium' | 'high'
  riskAnalysis: string
  summary: string
  suggestedAction: 'approve' | 'reject'
  aiOpinion: string
  mock: boolean
}

export function aiBatchApprove(ids: (string | number)[], autoExecute = false) {
  return request.post<{ results: AiBatchResultItem[]; executed: any[] | null }>(
    '/todos/ai-batch',
    { ids, autoExecute }
  )
}

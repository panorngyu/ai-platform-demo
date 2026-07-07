import { request } from './request'

export interface ApprovalDetail {
  todoId: string | number
  title: string
  type: string
  status: string
  statusName?: string
  amount?: number
  applicant?: string
  department?: string
  submitTime?: string
  fields?: Array<{ label: string; value: string; type?: string }>
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>
  currentStep?: string
  currentNode?: string
  summary?: string
}

export interface ApproveParams {
  action: 'approve' | 'reject' | 'return' | 'transfer'
  opinion: string
  transferTo?: string
}

export interface ApprovalHistoryItem {
  id: string | number
  nodeName: string
  operator: string
  operatorRole?: string
  action: string
  actionName?: string
  opinion?: string
  time: string
  status: string
}

export interface OpinionTemplate {
  id: string | number
  label: string
  content: string
  type?: string
}

export function getApprovalDetail(todoId: string | number) {
  return request.get<ApprovalDetail>(`/approvals/${todoId}`)
}

export function approve(todoId: string | number, data: ApproveParams) {
  return request.post(`/approvals/${todoId}/approve`, data)
}

export function getHistory(todoId: string | number) {
  return request.get<ApprovalHistoryItem[]>(`/approvals/${todoId}/history`)
}

export function getOpinionTemplates() {
  return request.get<OpinionTemplate[]>('/approvals/opinion-templates')
}

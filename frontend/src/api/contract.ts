import { request } from './request'

export interface ContractItem {
  id: string | number
  title: string
  type: string
  typeName?: string
  amount?: number
  party?: string
  partyA?: string
  partyB?: string
  startDate?: string
  endDate?: string
  status: string
  statusName?: string
  riskLevel?: 'high' | 'medium' | 'low'
  riskLevelName?: string
  signDate?: string
  content?: string
}

export interface DraftParams {
  type: string
  elements: Record<string, any>
}

export interface DraftResult {
  content: string
  clauses?: Array<{ title: string; content: string }>
}

export interface CompareParams {
  version1: string
  version2: string
}

export interface CompareResult {
  diffs: Array<{
    type: 'add' | 'delete' | 'modify'
    line: number
    content1?: string
    content2?: string
  }>
  summary: string
}

export interface ReviewParams {
  content: string
  contractId?: string | number
}

export interface ReviewResult {
  riskLevel: 'high' | 'medium' | 'low'
  riskLevelName?: string
  clauses: Array<{
    title: string
    content: string
    status: 'pass' | 'fail' | 'warn'
    statusName?: string
    suggestion?: string
    riskLevel?: 'high' | 'medium' | 'low'
  }>
  report: string
  conclusion?: string
}

export function getContracts() {
  return request.get<ContractItem[]>('/contracts')
}

export function getContractById(id: string | number) {
  return request.get<ContractItem>(`/contracts/${id}`)
}

export function aiDraft(data: DraftParams) {
  return request.post<DraftResult>('/contracts/draft', data)
}

export function aiCompare(data: CompareParams) {
  return request.post<CompareResult>('/contracts/compare', data)
}

export function aiReview(data: ReviewParams) {
  return request.post<ReviewResult>('/contracts/review', data)
}

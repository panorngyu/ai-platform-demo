import { request } from './request'

export interface ExpenseItem {
  id: string | number
  type: string
  typeName?: string
  amount: number
  date: string
  department?: string
  project?: string
  description?: string
  applicant?: string
  status: string
  statusName?: string
  submitTime?: string
  attachments?: Array<{ name: string; url: string }>
}

export interface ExpenseFormData {
  type?: string
  amount?: number
  date?: string
  department?: string
  project?: string
  description?: string
  [key: string]: any
}

export interface ParseCommandResult {
  fields: ExpenseFormData
  rawCommand?: string
  confidence?: number
}

export interface ComplianceResult {
  passed: boolean
  items: Array<{
    rule: string
    passed: boolean
    message: string
    level?: 'info' | 'warning' | 'danger'
  }>
  suggestion?: string
}

export interface BudgetResult {
  department: string
  category?: string
  total: number
  used: number
  remaining: number
  usageRate: number
}

export function getExpenses() {
  return request.get<ExpenseItem[]>('/expenses')
}

export function createExpense(data: Partial<ExpenseItem>) {
  return request.post<ExpenseItem>('/expenses', data)
}

export function parseCommand(command: string) {
  return request.post<ParseCommandResult>('/expenses/parse', { command })
}

export function autoFill(historyData: any) {
  return request.post<ExpenseFormData>('/expenses/autofill', { historyData })
}

export function checkCompliance(data: any) {
  return request.post<ComplianceResult>('/expenses/compliance', { expenseData: data })
}

export function getBudget(department: string, category?: string) {
  return request.get<BudgetResult>('/expenses/budget', { department, category })
}

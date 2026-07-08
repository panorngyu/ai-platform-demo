import request from './request'

// 智能发起流程 - AI 识别流程类型
export function identifyProcess(input: string) {
  return request.post('/ai/smart/identify', { input })
}

// 智能发起流程 - AI 自动填充表单
export function fillProcessForm(processType: string, userInput: string) {
  return request.post('/ai/smart/fill-form', { processType, userInput })
}

// 流程类型定义
export interface ProcessIdentifyResult {
  identified: boolean
  process: {
    type: string
    name: string
    description: string
    icon: string
    confidence: number
  }
  availableTypes: Array<{
    type: string
    name: string
    description: string
    icon: string
    confidence: number
  }>
  mock?: boolean
}

export interface FormField {
  key: string
  label: string
  type: string
  value: string
  required: boolean
  options?: string[]
}

export interface FormFillResult {
  processType: string
  form: FormField[]
  tips: string[]
  mock?: boolean
}

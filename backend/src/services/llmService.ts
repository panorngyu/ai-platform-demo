// 大模型服务管理 - 供应商接入、参数配置、Prompt模板、Token用量监控
// 全部使用内存 Mock 数据，支持 CRUD 操作

// ============ 类型定义 ============
interface Provider {
  id: number
  name: string
  provider: 'wenxin' | 'qianwen' | 'glm'
  status: 'active' | 'inactive'
  apiKey: string
  model: string
  endpoint?: string
  createdAt: string
  updatedAt?: string
}

interface ModelParams {
  temperature: number
  topP: number
  maxTokens: number
  model: string
  systemPrompt: string
}

interface PromptTemplate {
  id: number
  name: string
  category: 'audit' | 'expense' | 'contract' | 'general'
  content: string
  variables: string[]
  description?: string
  createdAt: string
  updatedAt: string
}

interface UsageRecord {
  id: number
  provider: string
  feature: 'audit_summary' | 'audit_risk' | 'audit_opinion' | 'expense_parse' | 'contract_review'
  tokens: number
  cost: number
  requestTime: string
  status: 'success' | 'fail'
  userId?: number
  userName?: string
}

// ============ 内存数据 ============
let providerIdSeq = 3
let templateIdSeq = 5
let usageIdSeq = 30

const providers: Provider[] = [
  {
    id: 1,
    name: '文心一言',
    provider: 'wenxin',
    status: 'active',
    apiKey: 'sk-wenxin-1a2b3c4d5e6f7g8h9i0j',
    model: 'ERNIE-Bot 4.0',
    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    createdAt: '2025-05-10 09:30:00',
    updatedAt: '2025-06-15 14:20:00'
  },
  {
    id: 2,
    name: '通义千问',
    provider: 'qianwen',
    status: 'active',
    apiKey: 'sk-qianwen-9z8y7x6w5v4u3t2s1r0q',
    model: 'qwen-turbo',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    createdAt: '2025-05-12 11:15:00',
    updatedAt: '2025-06-20 10:00:00'
  },
  {
    id: 3,
    name: '智谱GLM',
    provider: 'glm',
    status: 'inactive',
    apiKey: 'sk-glm-a1b2c3d4e5f6g7h8i9j0',
    model: 'glm-4',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    createdAt: '2025-05-18 16:45:00',
    updatedAt: '2025-06-25 09:10:00'
  }
]

let modelParams: ModelParams = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  model: 'ERNIE-Bot 4.0',
  systemPrompt: '你是道一云AI协同中台的智能助手，专注于企业审批、报销、合同等业务的辅助分析。请以专业、简洁、准确的方式输出结果，并关注合规性。'
}

const templates: PromptTemplate[] = [
  {
    id: 1,
    name: '单据摘要生成',
    category: 'audit',
    content: '请对以下{{documentType}}内容生成结构化摘要，包括关键要素、金额、人员、时间等，并以列表形式输出：\n\n单据内容：\n{{documentContent}}\n\n请重点突出：{{focusPoints}}',
    variables: ['documentType', 'documentContent', 'focusPoints'],
    description: '用于审批单据的AI摘要生成，自动提炼关键信息',
    createdAt: '2025-05-20 10:00:00',
    updatedAt: '2025-06-18 15:30:00'
  },
  {
    id: 2,
    name: '合规风险分析',
    category: 'audit',
    content: '请基于以下规则分析单据的合规风险：\n\n单据内容：\n{{documentContent}}\n\n审查规则：\n{{rules}}\n\n请给出风险等级（low/medium/high）和具体风险点，并说明依据：{{analysisScope}}',
    variables: ['documentContent', 'rules', 'analysisScope'],
    description: '对单据进行合规性风险分析，输出风险等级和风险点',
    createdAt: '2025-05-22 14:20:00',
    updatedAt: '2025-06-22 11:45:00'
  },
  {
    id: 3,
    name: '审核意见生成',
    category: 'audit',
    content: '基于以下单据与风险分析，生成专业的审核意见：\n\n单据：{{documentContent}}\n\n风险等级：{{riskLevel}}\n\n风险分析：{{riskAnalysis}}\n\n请按规范格式输出审核意见，包括建议结论（通过/退回/补充材料）和具体说明。',
    variables: ['documentContent', 'riskLevel', 'riskAnalysis'],
    description: '基于单据和风险分析结果生成AI审核意见',
    createdAt: '2025-05-25 09:40:00',
    updatedAt: '2025-06-25 16:00:00'
  },
  {
    id: 4,
    name: '报销指令解析',
    category: 'expense',
    content: '请将以下自然语言报销指令解析为结构化数据，包含 type(餐饮/交通/住宿/办公/会议)、amount、date、description、department 字段：\n\n"{{naturalLanguage}}"\n\n申请人：{{applicantName}}\n部门：{{department}}\n\n请返回JSON格式结果。',
    variables: ['naturalLanguage', 'applicantName', 'department'],
    description: '将一句话自然语言报销指令解析为结构化报销单数据',
    createdAt: '2025-05-28 11:00:00',
    updatedAt: '2025-06-28 10:15:00'
  },
  {
    id: 5,
    name: '合同合规审查',
    category: 'contract',
    content: '请审查以下合同的合规性：\n\n合同内容：\n{{contractContent}}\n\n合同类型：{{contractType}}\n\n审查规则：\n{{rules}}\n\n请列出风险点、修改建议和综合合规评分（0-100）：{{reviewScope}}',
    variables: ['contractContent', 'contractType', 'rules', 'reviewScope'],
    description: '对合同文本进行合规审查，输出风险点与修改建议',
    createdAt: '2025-06-01 13:30:00',
    updatedAt: '2025-06-30 14:50:00'
  }
]

// 生成30条用量记录（覆盖最近15天）
function generateUsageRecords(): UsageRecord[] {
  const records: UsageRecord[] = []
  const featureList: UsageRecord['feature'][] = [
    'audit_summary', 'audit_risk', 'audit_opinion', 'expense_parse', 'contract_review'
  ]
  const providerList = ['wenxin', 'qianwen', 'glm']
  const userNameList = ['张财务', '李法务', '王采购', '系统管理员', '赵经理']

  const now = new Date()
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(i / 2)
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    date.setHours(9 + (i % 8), (i * 7) % 60, 0, 0)
    const feature = featureList[i % featureList.length]
    const provider = providerList[i % providerList.length]
    const tokens = 800 + Math.floor(Math.random() * 2500)
    const cost = +(tokens * 0.0008).toFixed(4)
    records.push({
      id: i + 1,
      provider,
      feature,
      tokens,
      cost,
      requestTime: date.toISOString().replace('T', ' ').substring(0, 19),
      status: i % 9 === 0 ? 'fail' : 'success',
      userId: 1 + (i % 5),
      userName: userNameList[i % 5]
    })
  }
  return records.reverse() // 最新的在前
}

const usageRecords: UsageRecord[] = generateUsageRecords()

// ============ 工具函数 ============
function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return '****'
  return key.substring(0, 6) + '****' + key.substring(key.length - 4)
}

function nowStr(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19)
}

// ============ Service 对象 ============
export const llmService = {
  // ---------- 大模型供应商管理 ----------

  // 获取所有供应商
  getProviders(): Provider[] {
    return providers.map((p) => ({ ...p, apiKey: maskApiKey(p.apiKey) }))
  },

  // 添加供应商
  addProvider(data: Partial<Provider>): Provider {
    const newProvider: Provider = {
      id: ++providerIdSeq,
      name: data.name || '未命名供应商',
      provider: (data.provider as Provider['provider']) || 'wenxin',
      status: (data.status as Provider['status']) || 'inactive',
      apiKey: data.apiKey || '',
      model: data.model || '',
      endpoint: data.endpoint || '',
      createdAt: nowStr(),
      updatedAt: nowStr()
    }
    providers.push(newProvider)
    return { ...newProvider, apiKey: maskApiKey(newProvider.apiKey) }
  },

  // 更新供应商
  updateProvider(id: number, data: Partial<Provider>): Provider | null {
    const idx = providers.findIndex((p) => p.id === id)
    if (idx === -1) return null
    const updated: Provider = {
      ...providers[idx],
      ...data,
      id: providers[idx].id,
      updatedAt: nowStr()
    }
    providers[idx] = updated
    return { ...updated, apiKey: maskApiKey(updated.apiKey) }
  },

  // 删除供应商
  deleteProvider(id: number): boolean {
    const idx = providers.findIndex((p) => p.id === id)
    if (idx === -1) return false
    providers.splice(idx, 1)
    return true
  },

  // 测试供应商连接（Mock返回成功）
  async testProvider(id: number): Promise<any> {
    const provider = providers.find((p) => p.id === id)
    if (!provider) {
      return { success: false, message: '供应商不存在', latency: 0 }
    }
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500))
    // 模拟根据状态返回
    if (provider.status === 'inactive') {
      return {
        success: false,
        message: `供应商 ${provider.name} 当前为停用状态，无法连接`,
        latency: 0,
        provider: provider.name
      }
    }
    return {
      success: true,
      message: `供应商 ${provider.name} 连接正常`,
      latency: Math.floor(200 + Math.random() * 800),
      provider: provider.name,
      model: provider.model,
      testedAt: nowStr()
    }
  },

  // ---------- 模型参数配置 ----------

  // 获取模型参数
  getParams(): ModelParams {
    return { ...modelParams }
  },

  // 更新模型参数
  updateParams(data: Partial<ModelParams>): ModelParams {
    modelParams = { ...modelParams, ...data }
    return { ...modelParams }
  },

  // ---------- Prompt 模板管理 ----------

  // 获取所有模板
  getTemplates(): PromptTemplate[] {
    return templates.map((t) => ({ ...t }))
  },

  // 获取单个模板
  getTemplateById(id: number): PromptTemplate | null {
    const t = templates.find((t) => t.id === id)
    return t ? { ...t } : null
  },

  // 创建模板
  createTemplate(data: Partial<PromptTemplate>): PromptTemplate {
    const now = nowStr()
    const newTemplate: PromptTemplate = {
      id: ++templateIdSeq,
      name: data.name || '未命名模板',
      category: (data.category as PromptTemplate['category']) || 'general',
      content: data.content || '',
      variables: data.variables || [],
      description: data.description || '',
      createdAt: now,
      updatedAt: now
    }
    templates.push(newTemplate)
    return { ...newTemplate }
  },

  // 更新模板
  updateTemplate(id: number, data: Partial<PromptTemplate>): PromptTemplate | null {
    const idx = templates.findIndex((t) => t.id === id)
    if (idx === -1) return null
    const updated: PromptTemplate = {
      ...templates[idx],
      ...data,
      id: templates[idx].id,
      updatedAt: nowStr()
    }
    templates[idx] = updated
    return { ...updated }
  },

  // 删除模板
  deleteTemplate(id: number): boolean {
    const idx = templates.findIndex((t) => t.id === id)
    if (idx === -1) return false
    templates.splice(idx, 1)
    return true
  },

  // 预览模板（替换变量后返回完整 prompt）
  previewTemplate(id: number, variables: Record<string, string> = {}): any {
    const template = templates.find((t) => t.id === id)
    if (!template) return null
    let content = template.content
    const missing: string[] = []
    for (const varName of template.variables) {
      const placeholder = `{{${varName}}}`
      if (variables[varName] !== undefined && variables[varName] !== null) {
        content = content.split(placeholder).join(String(variables[varName]))
      } else {
        missing.push(varName)
        content = content.split(placeholder).join(`[${varName}]`)
      }
    }
    return {
      templateId: template.id,
      templateName: template.name,
      renderedContent: content,
      missingVariables: missing,
      providedVariables: Object.keys(variables),
      previewedAt: nowStr()
    }
  },

  // ---------- Token 用量监控 ----------

  // Token 用量概览
  getUsageOverview(): any {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const monthPrefix = todayStr.substring(0, 7)

    let totalTokens = 0
    let totalCost = 0
    let todayTokens = 0
    let monthTokens = 0

    const byProvider: Record<string, { tokens: number; cost: number; count: number }> = {}
    const byFeature: Record<string, { tokens: number; cost: number; count: number }> = {}

    for (const r of usageRecords) {
      totalTokens += r.tokens
      totalCost += r.cost
      if (r.requestTime.startsWith(todayStr)) todayTokens += r.tokens
      if (r.requestTime.startsWith(monthPrefix)) monthTokens += r.tokens

      if (!byProvider[r.provider]) byProvider[r.provider] = { tokens: 0, cost: 0, count: 0 }
      byProvider[r.provider].tokens += r.tokens
      byProvider[r.provider].cost += r.cost
      byProvider[r.provider].count += 1

      if (!byFeature[r.feature]) byFeature[r.feature] = { tokens: 0, cost: 0, count: 0 }
      byFeature[r.feature].tokens += r.tokens
      byFeature[r.feature].cost += r.cost
      byFeature[r.feature].count += 1
    }

    // 15天趋势
    const trend: any[] = []
    const featureList: UsageRecord['feature'][] = [
      'audit_summary', 'audit_risk', 'audit_opinion', 'expense_parse', 'contract_review'
    ]
    for (let i = 14; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const dayRecords = usageRecords.filter((r) => r.requestTime.startsWith(dateStr))
      const dayTokens = dayRecords.reduce((sum, r) => sum + r.tokens, 0)
      const dayCost = dayRecords.reduce((sum, r) => sum + r.cost, 0)
      const byFeatureThisDay: Record<string, number> = {}
      for (const f of featureList) {
        byFeatureThisDay[f] = dayRecords
          .filter((r) => r.feature === f)
          .reduce((sum, r) => sum + r.tokens, 0)
      }
      trend.push({
        date: dateStr,
        tokens: dayTokens,
        cost: +dayCost.toFixed(4),
        count: dayRecords.length,
        byFeature: byFeatureThisDay
      })
    }

    return {
      totalTokens,
      totalCost: +totalCost.toFixed(4),
      todayTokens,
      monthTokens,
      byProvider: Object.entries(byProvider).map(([name, v]) => ({
        provider: name,
        tokens: v.tokens,
        cost: +v.cost.toFixed(4),
        count: v.count,
        percentage: +((v.tokens / totalTokens) * 100).toFixed(2)
      })),
      byFeature: Object.entries(byFeature).map(([name, v]) => ({
        feature: name,
        tokens: v.tokens,
        cost: +v.cost.toFixed(4),
        count: v.count,
        percentage: +((v.tokens / totalTokens) * 100).toFixed(2)
      })),
      trend,
      totalRequests: usageRecords.length,
      successCount: usageRecords.filter((r) => r.status === 'success').length,
      failCount: usageRecords.filter((r) => r.status === 'fail').length
    }
  },

  // Token 用量明细（分页）
  getUsageDetail(query: {
    page?: number
    pageSize?: number
    provider?: string
    feature?: string
    status?: string
    startDate?: string
    endDate?: string
  }): any {
    const page = query.page || 1
    const pageSize = query.pageSize || 10

    let list = [...usageRecords]
    if (query.provider) list = list.filter((r) => r.provider === query.provider)
    if (query.feature) list = list.filter((r) => r.feature === query.feature)
    if (query.status) list = list.filter((r) => r.status === query.status)
    if (query.startDate) list = list.filter((r) => r.requestTime >= query.startDate!)
    if (query.endDate) list = list.filter((r) => r.requestTime <= query.endDate! + ' 23:59:59')

    const total = list.length
    const start = (page - 1) * pageSize
    const paged = list.slice(start, start + pageSize)

    return {
      list: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  },

  // 按功能维度统计 Token 用量
  getUsageByFeature(): any {
    const featureNames: Record<string, string> = {
      audit_summary: '单据摘要',
      audit_risk: '风险分析',
      audit_opinion: '审核意见',
      expense_parse: '报销解析',
      contract_review: '合同审查'
    }
    const featureList: UsageRecord['feature'][] = [
      'audit_summary', 'audit_risk', 'audit_opinion', 'expense_parse', 'contract_review'
    ]
    const now = new Date()

    return featureList.map((feature) => {
      const records = usageRecords.filter((r) => r.feature === feature)
      const tokens = records.reduce((sum, r) => sum + r.tokens, 0)
      const cost = records.reduce((sum, r) => sum + r.cost, 0)
      const successCount = records.filter((r) => r.status === 'success').length

      // 7天趋势
      const last7Days: any[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const dayTokens = records
          .filter((r) => r.requestTime.startsWith(dateStr))
          .reduce((sum, r) => sum + r.tokens, 0)
        last7Days.push({ date: dateStr, tokens: dayTokens })
      }

      // 按供应商分布
      const byProvider: Record<string, number> = {}
      for (const r of records) {
        byProvider[r.provider] = (byProvider[r.provider] || 0) + r.tokens
      }

      return {
        feature,
        featureName: featureNames[feature] || feature,
        tokens,
        cost: +cost.toFixed(4),
        count: records.length,
        successCount,
        failCount: records.length - successCount,
        successRate: records.length ? +((successCount / records.length) * 100).toFixed(2) : 0,
        avgTokensPerRequest: records.length ? Math.floor(tokens / records.length) : 0,
        byProvider: Object.entries(byProvider).map(([p, t]) => ({
          provider: p,
          tokens: t,
          percentage: +((t / tokens) * 100).toFixed(2)
        })),
        last7Days
      }
    })
  }
}

export default llmService

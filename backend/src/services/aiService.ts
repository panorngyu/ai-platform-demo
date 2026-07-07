import axios from 'axios'
import { config } from '../config/index.js'

// 判断大模型 API 是否可用
function isLLMConfigured(): boolean {
  if (config.llm.provider === 'wenxin') {
    return !!(config.llm.wenxin.apiKey && config.llm.wenxin.secretKey)
  }
  if (config.llm.provider === 'qianwen') {
    return !!config.llm.qianwen.apiKey
  }
  return false
}

// 文心 Token 缓存
let wenxinToken: { token: string; expireAt: number } | null = null

async function getWenxinToken(): Promise<string> {
  if (wenxinToken && wenxinToken.expireAt > Date.now()) {
    return wenxinToken.token
  }
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.llm.wenxin.apiKey}&client_secret=${config.llm.wenxin.secretKey}`
  const res = await axios.get(url)
  wenxinToken = {
    token: res.data.access_token,
    expireAt: Date.now() + (res.data.expires_in - 300) * 1000
  }
  return wenxinToken.token
}

// 等待函数
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const aiService = {
  // 调用大模型 chat
  async chat(prompt: string, options: any = {}): Promise<any> {
    if (!isLLMConfigured()) {
      return this.mockChat(prompt, options)
    }

    try {
      if (config.llm.provider === 'wenxin') {
        const token = await getWenxinToken()
        const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${token}`
        const res = await axios.post(url, {
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature || 0.7,
          stream: false
        })
        return { content: res.data.result, raw: res.data }
      }
      if (config.llm.provider === 'qianwen') {
        const res = await axios.post(
          'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          {
            model: options.model || 'qwen-turbo',
            input: { messages: [{ role: 'user', content: prompt }] },
            parameters: { temperature: options.temperature || 0.7 }
          },
          {
            headers: {
              Authorization: `Bearer ${config.llm.qianwen.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )
        return { content: res.data.output.text, raw: res.data }
      }
    } catch (error) {
      console.warn('[AI] 大模型调用失败，降级到 Mock:', (error as Error).message)
      return this.mockChat(prompt, options)
    }
  },

  // Mock chat
  async mockChat(prompt: string, _options: any = {}): Promise<any> {
    await sleep(300)
    return {
      content: `【Mock响应】已收到您的请求：${prompt.substring(0, 50)}...，AI协同中台模拟分析完成。建议人工复核相关内容，确保合规性。`,
      mock: true
    }
  },

  // 生成单据摘要
  async generateSummary(documentContent: string): Promise<any> {
    if (!isLLMConfigured()) {
      return this.mockSummary(documentContent)
    }
    const prompt = `请对以下单据内容生成结构化摘要，包括关键要素、金额、人员、时间等：\n\n${documentContent}`
    const result = await this.chat(prompt)
    return {
      summary: result.content,
      mock: result.mock || false
    }
  },

  mockSummary(documentContent: string): any {
    return {
      summary: `AI摘要：该单据为${documentContent.includes('合同') ? '合同' : documentContent.includes('报销') ? '报销' : '审批'}类业务，涉及金额需重点核对，申请人与部门信息已确认，建议关注合规要点与预算占用情况。`,
      mock: true
    }
  },

  // 分析合规风险
  async analyzeRisk(documentContent: string, rules: any[]): Promise<any> {
    if (!isLLMConfigured()) {
      return this.mockRisk(documentContent, rules)
    }
    const rulesText = rules.map((r) => r.name || JSON.stringify(r)).join('\n')
    const prompt = `请基于以下规则分析单据的合规风险：\n\n单据内容：\n${documentContent}\n\n规则：\n${rulesText}\n\n请给出风险等级(low/medium/high)和具体风险点。`
    const result = await this.chat(prompt)
    return {
      riskLevel: 'medium',
      analysis: result.content,
      mock: result.mock || false
    }
  },

  mockRisk(documentContent: string, _rules: any[]): any {
    // 根据单据类型生成差异化的风险评估数据
    const isContract = documentContent.includes('合同')
    const isExpense = documentContent.includes('报销')
    const isPurchase = documentContent.includes('采购')
    const isProject = documentContent.includes('项目')

    const riskTemplates: Record<string, {
      level: 'low' | 'medium' | 'high'
      score: number
      risks: Array<{ level: string; type: string; description: string; suggestion: string }>
      conclusion: string
    }> = {
      contract: {
        level: 'medium',
        score: 62,
        risks: [
          { level: 'high', type: '合规风险', description: '合同条款中违约责任约定不够明确，缺少具体赔偿标准与上限，可能造成公司利益受损', suggestion: '建议补充违约赔偿计算方式与赔偿上限条款，并明确约定管辖法院' },
          { level: 'medium', type: '金额风险', description: '合同金额较大，付款周期较长，预付款比例偏高（30%），存在资金回收风险', suggestion: '建议将预付款比例调整为20%以下，并增加分期付款节点与验收确认机制' },
          { level: 'medium', type: '资质风险', description: '供应商资质文件不完整，缺少近三年财务审计报告和行业资质认证', suggestion: '建议要求供应商补充财务审计报告、行业资质证书及相关经营许可证明' },
          { level: 'low', type: '流程风险', description: '合同签署流程中缺少法务审核环节，合同条款未经专业法律审查', suggestion: '建议在合同签署前增加法务审核节点，确保条款合法合规' },
          { level: 'low', type: '时效风险', description: '合同有效期约定模糊，缺少明确的起止日期和续签条件', suggestion: '建议明确约定合同起止日期、自动续签条款及终止通知期限' }
        ],
        conclusion: '该合同存在中等合规风险，主要问题集中在违约责任条款不明确和付款比例偏高。建议补充违约赔偿细则、降低预付款比例，并完成法务审核后再行审批。'
      },
      expense: {
        level: 'low',
        score: 28,
        risks: [
          { level: 'medium', type: '金额风险', description: '报销金额超出部门月度预算10%，可能影响后续费用开支', suggestion: '建议核实预算余额，如超出可申请临时预算追加或分月报销' },
          { level: 'low', type: '凭证风险', description: '报销附件中发票日期与报销申请日期间隔超过30天，存在时效性疑问', suggestion: '建议附上延迟报销的合理说明，如出差在外等原因' },
          { level: 'low', type: '合规风险', description: '报销科目与实际业务关联性需进一步确认，餐饮报销缺少会议/出差关联记录', suggestion: '建议补充会议通知或出差审批单作为关联凭证' }
        ],
        conclusion: '该报销单风险较低，金额略超预算但整体可控。建议核实预算余额并补充出差关联凭证后可审批通过。'
      },
      purchase: {
        level: 'medium',
        score: 55,
        risks: [
          { level: 'high', type: '合规风险', description: '采购金额超过10万元但未走公开招标流程，不符合公司采购管理制度要求', suggestion: '建议补充三家比价记录或转为公开招标流程，确保采购合规性' },
          { level: 'medium', type: '预算风险', description: '采购金额占部门年度预算的35%，预算占用比例偏高', suggestion: '建议评估年度剩余预算及后续采购计划，避免预算超支' },
          { level: 'medium', type: '供应商风险', description: '指定供应商与申请人部门存在历史合作关系，可能存在利益关联', suggestion: '建议增加供应商筛选透明度，确保至少三家供应商参与比价' },
          { level: 'low', type: '交付风险', description: '采购合同中交付验收标准不够具体，缺少性能指标与验收条件', suggestion: '建议细化验收标准和交付物清单，明确性能指标与验收测试方案' }
        ],
        conclusion: '该采购申请存在中等风险，主要问题是未走招标流程和供应商选择可能存在利益关联。建议补充比价流程、完善验收标准后再行审批。'
      },
      project: {
        level: 'low',
        score: 35,
        risks: [
          { level: 'medium', type: '进度风险', description: '项目里程碑时间节点安排较为紧凑，部分关键节点缺少缓冲时间', suggestion: '建议在关键里程碑间增加5-10天缓冲期，降低延期风险' },
          { level: 'low', type: '人员风险', description: '项目核心团队成员同时参与多个项目，人力投入可能不足', suggestion: '建议确认核心成员工时分配，确保关键角色有足够投入' },
          { level: 'low', type: '预算风险', description: '项目预算中应急预留比例为5%，低于行业建议的10-15%', suggestion: '建议将应急预留比例提高至10%，覆盖潜在需求变更风险' }
        ],
        conclusion: '该项目审批风险较低，建议关注进度安排和人员投入，适当增加应急预算后可审批通过。'
      }
    }

    // 默认模板（无法匹配类型时使用）
    const defaultTemplate = {
      level: 'medium' as const,
      score: 45,
      risks: [
        { level: 'medium', type: '合规风险', description: '单据信息与公司审批制度存在部分不符，需要进一步核实关键要素', suggestion: '建议对照公司审批制度逐条核实，确保合规性' },
        { level: 'low', type: '完整性风险', description: '单据部分字段信息不完整，可能影响审批判断准确性', suggestion: '建议补充缺失信息后再提交审批' },
        { level: 'low', type: '时效风险', description: '单据提交时间与业务发生时间间隔较长，可能影响追溯核实', suggestion: '建议附上延迟提交的合理说明' }
      ],
      conclusion: '该单据存在中等风险，建议核实合规要点和补充必要信息后审批。'
    }

    const template = isContract ? riskTemplates.contract
      : isExpense ? riskTemplates.expense
      : isPurchase ? riskTemplates.purchase
      : isProject ? riskTemplates.project
      : defaultTemplate

    return {
      riskLevel: template.level,
      riskScore: template.score,
      risks: template.risks,
      conclusion: template.conclusion,
      mock: true
    }
  },

  // 生成审核意见
  async generateOpinion(documentContent: string, riskResult: any): Promise<any> {
    if (!isLLMConfigured()) {
      return this.mockOpinion(documentContent, riskResult)
    }
    const prompt = `基于以下单据与风险分析，生成审核意见：\n\n单据：${documentContent}\n\n风险等级：${riskResult.level || 'medium'}\n\n请生成专业的审核意见。`
    const result = await this.chat(prompt)
    return {
      opinion: result.content,
      riskLevel: riskResult.level || 'medium',
      summary: 'AI生成审核意见',
      mock: result.mock || false
    }
  },

  mockOpinion(_documentContent: string, riskResult: any): any {
    const level = riskResult?.level || 'medium'
    const opinions: Record<string, string> = {
      low: 'AI建议：单据信息完整，金额合理，风险较低，建议通过审批。',
      medium: 'AI建议：单据基本符合要求，存在中等风险，建议审批人核实金额与预算后决定。',
      high: 'AI建议：单据存在较高风险，建议补充材料或退回修改。'
    }
    return {
      opinion: opinions[level] || opinions.medium,
      riskLevel: level,
      summary: 'AI生成审核意见（Mock）',
      mock: true
    }
  },

  // 一句话报销 NLP 解析
  async parseExpenseCommand(naturalLanguage: string): Promise<any> {
    if (!isLLMConfigured()) {
      return this.mockParseExpense(naturalLanguage)
    }
    const prompt = `请将以下自然语言报销指令解析为结构化数据，包含 type(餐饮/交通/住宿/办公/会议)、amount、date、description、department 字段：\n\n"${naturalLanguage}"\n\n请返回JSON格式。`
    const result = await this.chat(prompt, { temperature: 0.2 })
    return { parsed: result.content, mock: result.mock || false }
  },

  mockParseExpense(naturalLanguage: string): any {
    // 简单关键词解析
    const result: any = {
      type: '其他',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: naturalLanguage,
      department: '信息技术部'
    }

    if (naturalLanguage.includes('餐') || naturalLanguage.includes('吃饭')) result.type = '餐饮'
    else if (naturalLanguage.includes('车') || naturalLanguage.includes('交通') || naturalLanguage.includes('打车')) result.type = '交通'
    else if (naturalLanguage.includes('住') || naturalLanguage.includes('酒店')) result.type = '住宿'
    else if (naturalLanguage.includes('办公')) result.type = '办公'
    else if (naturalLanguage.includes('会议')) result.type = '会议'

    // 提取金额
    const amountMatch = naturalLanguage.match(/(\d+(?:\.\d+)?)\s*(?:元|块|人民币)?/)
    if (amountMatch) result.amount = parseFloat(amountMatch[1])

    return {
      parsed: result,
      raw: naturalLanguage,
      mock: true,
      message: '已解析报销指令（Mock），请核对信息后提交'
    }
  },

  // AI 起草合同
  async draftContract(contractType: string, elements: any): Promise<any> {
    if (!isLLMConfigured()) {
      return this.mockDraftContract(contractType, elements)
    }
    const prompt = `请起草一份${contractType}合同，关键要素：${JSON.stringify(elements)}。请生成完整的合同条款。`
    const result = await this.chat(prompt)
    return { content: result.content, mock: result.mock || false }
  },

  mockDraftContract(contractType: string, elements: any): any {
    const partyA = elements.partyA || '道一云食品有限公司'
    const partyB = elements.partyB || '乙方公司'
    const amount = elements.amount || '合同金额'
    return {
      content: `【${contractType}】\n\n甲方：${partyA}\n乙方：${partyB}\n\n第一条 合同标的\n本合同为${contractType}，由甲方向乙方采购相关产品/服务。\n\n第二条 合同金额\n本合同总金额为人民币${amount}元。\n\n第三条 付款方式\n合同签订后7个工作日内支付预付款30%，验收合格后支付尾款70%。\n\n第四条 违约责任\n任何一方违约，应承担违约责任，赔偿对方损失。\n\n第五条 合同期限\n本合同自签订之日起生效，有效期至约定事项完成之日止。\n\n（以上为Mock起草内容，请人工完善）`,
      mock: true,
      message: 'AI起草完成（Mock模式）'
    }
  },

  // 合同对比
  async compareContracts(version1: string, version2: string): Promise<any> {
    if (!isLLMConfigured()) {
      return this.mockCompare(version1, version2)
    }
    const prompt = `请对比以下两版合同的差异：\n\n版本1：\n${version1}\n\n版本2：\n${version2}\n\n请列出关键差异点。`
    const result = await this.chat(prompt)
    return { diff: result.content, mock: result.mock || false }
  },

  mockCompare(_v1: string, _v2: string): any {
    return {
      diff: '合同对比结果（Mock）：\n1. 第三条付款方式：版本1预付款30%，版本2调整为20%；\n2. 第五条违约责任：版本2增加了上限条款；\n3. 金额条款一致。',
      changes: [
        { section: '第三条 付款方式', v1: '预付款30%', v2: '预付款20%', type: 'modified' },
        { section: '第五条 违约责任', v1: '无上限', v2: '增加上限条款', type: 'added' }
      ],
      mock: true
    }
  },

  // 合同合规审查
  async reviewContract(content: string, rules: any[]): Promise<any> {
    if (!isLLMConfigured()) {
      return this.mockReview(content, rules)
    }
    const rulesText = rules.map((r) => r.name || JSON.stringify(r)).join('\n')
    const prompt = `请审查以下合同的合规性：\n\n${content}\n\n审查规则：\n${rulesText}\n\n请给出风险点和修改建议。`
    const result = await this.chat(prompt)
    return { review: result.content, mock: result.mock || false }
  },

  mockReview(_content: string, _rules: any[]): any {
    return {
      review: '合同合规审查报告（Mock）：\n1. 付款条款：建议明确付款时间节点；\n2. 违约责任：建议增加具体赔偿标准；\n3. 争议解决：建议约定管辖法院。',
      riskLevel: 'medium',
      issues: [
        { section: '付款条款', risk: 'medium', suggestion: '建议明确付款时间节点' },
        { section: '违约责任', risk: 'low', suggestion: '建议增加具体赔偿标准' },
        { section: '争议解决', risk: 'low', suggestion: '建议约定管辖法院' }
      ],
      mock: true
    }
  }
}

export default aiService

import { Contract, dbConnected } from '../models/index.js'
import { aiService } from './aiService.js'
import { ruleEngineService } from './ruleEngineService.js'

// Mock 合同数据
const mockContracts: any[] = [
  {
    id: 1,
    title: '原材料采购合同（河北某粮油）',
    type: '采购合同',
    partyA: '道一云食品有限公司',
    partyB: '河北某粮油有限公司',
    amount: 1280000,
    signDate: '2026-06-15',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    content: '甲方向乙方采购原材料...',
    status: 'pending',
    riskLevel: 'medium',
    auditResult: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    title: '营销推广服务合同',
    type: '服务合同',
    partyA: '道一云食品有限公司',
    partyB: '北京某广告公司',
    amount: 680000,
    signDate: '2026-06-20',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    content: '乙方为甲方提供营销推广服务...',
    status: 'approved',
    riskLevel: 'low',
    auditResult: { riskLevel: 'low', issues: [] },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const contractService = {
  // 合同列表
  async getContracts(query: any = {}): Promise<any> {
    const page = parseInt(query.page || '1', 10)
    const pageSize = parseInt(query.pageSize || '10', 10)

    if (dbConnected) {
      const { rows, count } = await Contract.findAndCountAll({
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * pageSize,
        limit: pageSize
      })
      return { list: rows, total: count, page, pageSize }
    }
    return { list: mockContracts, total: mockContracts.length, page, pageSize }
  },

  // 合同详情
  async getContractById(id: number): Promise<any> {
    if (dbConnected) {
      return await Contract.findByPk(id)
    }
    return mockContracts.find((c) => c.id === id)
  },

  // 创建合同
  async createContract(data: any): Promise<any> {
    if (dbConnected) {
      return await Contract.create(data)
    }
    const newContract = { id: mockContracts.length + 1, status: 'draft', riskLevel: null, auditResult: null, createdAt: new Date(), updatedAt: new Date(), ...data }
    mockContracts.push(newContract)
    return newContract
  },

  // AI 起草
  async aiDraft(type: string, elements: any): Promise<any> {
    return await aiService.draftContract(type, elements)
  },

  // AI 对比
  async aiCompare(v1: string, v2: string): Promise<any> {
    return await aiService.compareContracts(v1, v2)
  },

  // AI 审查
  async aiReview(contractId: number): Promise<any> {
    const contract = await this.getContractById(contractId)
    if (!contract) throw new Error('合同不存在')

    const rules = await ruleEngineService.getRules('contract')
    const reviewResult = await aiService.reviewContract(contract.content || '', rules)

    // 规则引擎执行
    const ruleResult = await ruleEngineService.executeRules(
      { amount: contract.amount, type: contract.type },
      'contract'
    )

    const auditResult = {
      review: reviewResult.review || reviewResult,
      ruleResult,
      riskLevel: reviewResult.riskLevel || 'medium',
      issues: reviewResult.issues || [],
      mock: reviewResult.mock
    }

    if (dbConnected) {
      await contract.update({ auditResult, riskLevel: auditResult.riskLevel })
    } else {
      contract.auditResult = auditResult
      contract.riskLevel = auditResult.riskLevel
    }

    return auditResult
  },

  // 生成审查报告
  async generateReport(contractId: number): Promise<any> {
    const contract = await this.getContractById(contractId)
    if (!contract) throw new Error('合同不存在')

    const auditResult = contract.auditResult || (await this.aiReview(contractId))

    return {
      contractTitle: contract.title,
      contractType: contract.type,
      partyA: contract.partyA,
      partyB: contract.partyB,
      amount: contract.amount,
      riskLevel: auditResult.riskLevel,
      issues: auditResult.issues || [],
      review: auditResult.review,
      generatedAt: new Date().toISOString(),
      mock: auditResult.mock
    }
  }
}

export default contractService

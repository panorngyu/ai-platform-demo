import { ExpenseReport, Budget, dbConnected } from '../models/index.js'
import { aiService } from './aiService.js'
import { ruleEngineService } from './ruleEngineService.js'

// Mock 报销数据
const mockExpenses: any[] = [
  {
    id: 1,
    applicantId: 4,
    applicantName: '王采购',
    department: '采购部',
    type: '餐饮',
    amount: 58000,
    date: '2026-06-28',
    description: '客户接待餐费',
    invoices: [{ name: 'invoice1.jpg', amount: 58000 }],
    aiParsed: { type: '餐饮', amount: 58000 },
    status: 'pending',
    budgetBefore: 5000000,
    budgetAfter: 4942000,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Mock 预算
const mockBudgets: any[] = [
  { id: 1, department: '采购部', category: '原材料', totalAmount: 5000000, usedAmount: 3120000, period: '2026-Q3' },
  { id: 2, department: '营销中心', category: '广告投放', totalAmount: 2000000, usedAmount: 1680000, period: '2026-Q3' },
  { id: 3, department: '财务部', category: '办公', totalAmount: 500000, usedAmount: 220000, period: '2026-Q3' },
  { id: 4, department: '法务部', category: '法律咨询', totalAmount: 300000, usedAmount: 180000, period: '2026-Q3' }
]

export const expenseService = {
  // 报销列表
  async getExpenses(query: any = {}): Promise<any> {
    const page = parseInt(query.page || '1', 10)
    const pageSize = parseInt(query.pageSize || '10', 10)

    if (dbConnected) {
      const { rows, count } = await ExpenseReport.findAndCountAll({
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * pageSize,
        limit: pageSize
      })
      return { list: rows, total: count, page, pageSize }
    }
    return { list: mockExpenses, total: mockExpenses.length, page, pageSize }
  },

  // 创建报销单
  async createExpense(data: any): Promise<any> {
    if (dbConnected) {
      const budget = await this.getBudget(data.department, data.type)
      const expense = await ExpenseReport.create({
        ...data,
        budgetBefore: budget?.totalAmount - budget?.usedAmount,
        budgetAfter: (budget?.totalAmount - budget?.usedAmount) - data.amount
      })
      return expense
    }
    const newExpense = { id: mockExpenses.length + 1, status: 'pending', createdAt: new Date(), updatedAt: new Date(), ...data }
    mockExpenses.push(newExpense)
    return newExpense
  },

  // 一句话报销解析
  async aiParse(command: string): Promise<any> {
    return await aiService.parseExpenseCommand(command)
  },

  // AI 自动填单
  async aiAutoFill(historyData: any): Promise<any> {
    if (!historyData) {
      return {
        suggestion: {
          type: '餐饮',
          amount: 0,
          department: '信息技术部',
          description: '请补充报销说明'
        },
        mock: true
      }
    }
    return {
      suggestion: {
        ...historyData,
        description: '基于历史数据AI预填（Mock）'
      },
      mock: true
    }
  },

  // 合规风控校验
  async checkCompliance(expenseData: any): Promise<any> {
    // 规则引擎校验
    const ruleResult = await ruleEngineService.executeRules(expenseData, 'expense')

    // 预算校验
    const budget = await this.getBudget(expenseData.department, expenseData.type)
    let overBudget = false
    if (budget) {
      const remaining = budget.totalAmount - budget.usedAmount
      if (expenseData.amount > remaining) overBudget = true
    }

    return {
      passed: ruleResult.triggered.length === 0 && !overBudget,
      rules: ruleResult,
      overBudget,
      budget,
      mock: ruleResult.mock
    }
  },

  // 预算查询
  async getBudget(department: string, category: string): Promise<any> {
    if (dbConnected) {
      return await Budget.findOne({ where: { department, category } })
    }
    return mockBudgets.find((b) => b.department === department && b.category === category)
  },

  // 扣减预算
  async deductBudget(department: string, category: string, amount: number): Promise<any> {
    if (dbConnected) {
      const budget = await Budget.findOne({ where: { department, category } })
      if (!budget) throw new Error('预算不存在')
      const usedAmount = parseFloat(budget.usedAmount.toString()) + amount
      await budget.update({ usedAmount })
      return budget
    }
    const budget = mockBudgets.find((b) => b.department === department && b.category === category)
    if (budget) budget.usedAmount += amount
    return budget
  }
}

export default expenseService

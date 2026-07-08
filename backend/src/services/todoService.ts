import { Op } from 'sequelize'
import { Todo, ApprovalRecord, User, dbConnected } from '../models/index.js'

function fmt(t?: Date): string | undefined {
  if (!t) return undefined
  const s = t.toISOString()
  return s.replace('T', ' ').slice(0, 19)
}

const typeMap: Record<string, string> = {
  expense: '报销',
  contract: '合同',
  purchase: '采购',
  project: '项目',
  asset: '资产'
}

const urgencyMap: Record<string, string> = {
  high: '紧急',
  medium: '一般',
  low: '低'
}

const statusMap: Record<string, string> = {
  pending: '待审批',
  processing: '处理中',
  approved: '已通过',
  rejected: '已驳回',
  transferred: '已转交'
}

function normalizeTodo(t: any): any {
  const type = t.type
  const urgency = t.urgency ?? t.priority
  const status = t.status
  // 将数据库字段名映射为前端期望字段名，自动补充中文名
  return {
    id: t.id,
    title: t.title,
    type,
    typeName: t.typeName || typeMap[type] || type,
    sourceSystem: t.sourceSystem ?? t.source,
    urgency,
    urgencyName: t.urgencyName || urgencyMap[urgency] || urgency,
    amount: t.amount,
    applicant: t.applicant ?? t.applicantName,
    applicantId: t.applicantId,
    department: t.department,
    status,
    statusName: t.statusName || statusMap[status] || status,
    isTimeout: t.isTimeout,
    isUrgent: t.isUrgent,
    submitTime: t.submitTime ?? fmt(t.submittedAt) ?? fmt(t.createdAt),
    dueTime: t.dueTime ?? fmt(t.dueAt),
    description: t.description,
    summary: t.summary,
    createdAt: fmt(t.createdAt),
    updatedAt: fmt(t.updatedAt)
  }
}

// 内存 Mock 待办（数据库不可用时的兜底数据）
// 字段名采用前端期望命名：urgency/sourceSystem/applicant/submitTime
const mockTodos: any[] = [
  {
    id: 1,
    title: '关于2026年Q3营销费用报销审批',
    sourceSystem: '财务系统',
    applicantId: 4,
    applicant: '王采购',
    department: '采购部',
    status: 'pending',
    isTimeout: false,
    isUrgent: true,
    submitTime: fmt(new Date(Date.now() - 24 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 2 * 24 * 3600 * 1000))
  },
  {
    id: 2,
    title: '原材料采购合同审批（供应商：河北某粮油）',
    sourceSystem: '合同管理系统',
    type: 'contract',
    urgency: 'high',
    amount: 1280000,
    applicantId: 4,
    applicant: '王采购',
    department: '采购部',
    status: 'pending',
    isTimeout: true,
    isUrgent: false,
    submitTime: fmt(new Date(Date.now() - 48 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() - 12 * 3600 * 1000))
  },
  {
    id: 3,
    title: '华北区渠道拓展项目立项',
    sourceSystem: '项目管理系统',
    type: 'project',
    urgency: 'medium',
    amount: 350000,
    applicantId: 3,
    applicant: '李法务',
    department: '法务部',
    status: 'pending',
    isTimeout: false,
    isUrgent: false,
    submitTime: fmt(new Date(Date.now() - 6 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 5 * 24 * 3600 * 1000))
  },
  {
    id: 4,
    title: '办公设备采购申请',
    sourceSystem: '采购管理系统',
    type: 'purchase',
    urgency: 'low',
    amount: 36000,
    applicantId: 2,
    applicant: '张财务',
    department: '财务部',
    status: 'pending',
    isTimeout: false,
    isUrgent: false,
    submitTime: fmt(new Date(Date.now() - 72 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 24 * 3600 * 1000))
  },
  // 新增：补充更多紧急程度数据
  {
    id: 5,
    title: '年度服务器扩容预算审批',
    sourceSystem: '资产管理系统',
    type: 'asset',
    urgency: 'high',
    amount: 860000,
    applicantId: 5,
    applicant: '赵运维',
    department: 'IT部',
    status: 'pending',
    isTimeout: false,
    isUrgent: true,
    submitTime: fmt(new Date(Date.now() - 4 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 1 * 24 * 3600 * 1000))
  },
  {
    id: 6,
    title: '新员工办公用品领用申请',
    sourceSystem: '采购管理系统',
    type: 'purchase',
    urgency: 'low',
    amount: 1200,
    applicantId: 6,
    applicant: '孙人事',
    department: '人力资源部',
    status: 'pending',
    isTimeout: false,
    isUrgent: false,
    submitTime: fmt(new Date(Date.now() - 96 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 3 * 24 * 3600 * 1000))
  },
  {
    id: 7,
    title: '客户年度框架协议续签',
    sourceSystem: '合同管理系统',
    type: 'contract',
    urgency: 'high',
    amount: 5200000,
    applicantId: 7,
    applicant: '周销售',
    department: '销售部',
    status: 'processing',
    isTimeout: false,
    isUrgent: true,
    submitTime: fmt(new Date(Date.now() - 12 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 6 * 3600 * 1000))
  },
  {
    id: 8,
    title: '华东区季度差旅报销汇总',
    sourceSystem: '财务系统',
    type: 'expense',
    urgency: 'medium',
    amount: 42000,
    applicantId: 8,
    applicant: '吴市场',
    department: '市场部',
    status: 'pending',
    isTimeout: false,
    isUrgent: false,
    submitTime: fmt(new Date(Date.now() - 18 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 2 * 24 * 3600 * 1000))
  },
  {
    id: 9,
    title: '研发中心实验室装修立项',
    sourceSystem: '项目管理系统',
    type: 'project',
    urgency: 'low',
    amount: 680000,
    applicantId: 9,
    applicant: '郑研发',
    department: '研发部',
    status: 'pending',
    isTimeout: false,
    isUrgent: false,
    submitTime: fmt(new Date(Date.now() - 120 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 7 * 24 * 3600 * 1000))
  },
  {
    id: 10,
    title: '核心供应商付款申请（已逾期）',
    sourceSystem: '财务系统',
    type: 'expense',
    urgency: 'high',
    amount: 2300000,
    applicantId: 10,
    applicant: '冯采购',
    department: '采购部',
    status: 'pending',
    isTimeout: true,
    isUrgent: true,
    submitTime: fmt(new Date(Date.now() - 60 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() - 8 * 3600 * 1000))
  },
  {
    id: 11,
    title: '知识产权代理服务合同审批',
    sourceSystem: '合同管理系统',
    type: 'contract',
    urgency: 'medium',
    amount: 150000,
    applicantId: 3,
    applicant: '李法务',
    department: '法务部',
    status: 'approved',
    isTimeout: false,
    isUrgent: false,
    submitTime: fmt(new Date(Date.now() - 36 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 1 * 24 * 3600 * 1000))
  },
  {
    id: 12,
    title: '中秋礼盒采购方案',
    sourceSystem: '采购管理系统',
    type: 'purchase',
    urgency: 'low',
    amount: 28000,
    applicantId: 11,
    applicant: '陈行政',
    department: '行政部',
    status: 'rejected',
    isTimeout: false,
    isUrgent: false,
    submitTime: fmt(new Date(Date.now() - 168 * 3600 * 1000)),
    dueTime: fmt(new Date(Date.now() + 2 * 24 * 3600 * 1000))
  }
]

export const todoService = {
  // 分页查询待办
  async getTodos(query: any): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
    const page = parseInt(query.page || '1', 10)
    const pageSize = parseInt(query.pageSize || '10', 10)
    const { status, type, priority, keyword, isUrgent } = query

    if (dbConnected) {
      const where: any = {}
      if (status) where.status = status
      if (type) where.type = type
      if (priority) where.priority = priority
      if (isUrgent === 'true') where.isUrgent = true
      if (keyword) where.title = { [Op.like]: `%${keyword}%` }

      const { rows, count } = await Todo.findAndCountAll({
        where,
        order: [['isUrgent', 'DESC'], ['createdAt', 'DESC']],
        offset: (page - 1) * pageSize,
        limit: pageSize
      })
      return { list: rows.map(normalizeTodo), total: count, page, pageSize }
    }

    // Mock 数据筛选
    let list = [...mockTodos]
    if (status) list = list.filter((t) => t.status === status)
    if (type) list = list.filter((t) => t.type === type)
    if (priority) list = list.filter((t) => t.urgency === priority)
    if (isUrgent === 'true') list = list.filter((t) => t.isUrgent)
    if (keyword) list = list.filter((t) => t.title.includes(keyword))

    // 排序：按紧急程度或按时间
    if (query.sortBy === 'urgency') {
      const order = { high: 3, medium: 2, low: 1 }
      list.sort((a, b) => (order[b.urgency as keyof typeof order] || 0) - (order[a.urgency as keyof typeof order] || 0))
    } else {
      list.sort((a, b) => (new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime()))
    }

    const total = list.length
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize).map(normalizeTodo), total, page, pageSize }
  },

  // 获取待办详情
  async getTodoById(id: number): Promise<any> {
    if (dbConnected) {
      const todo = await Todo.findByPk(id, {
        include: [{ model: ApprovalRecord, as: 'records' }]
      })
      return todo ? normalizeTodo(todo) : null
    }
    const todo = mockTodos.find((t) => t.id === id)
    if (!todo) return null
    return normalizeTodo({ ...todo, records: [] })
  },

  // 批量审批
  async batchApprove(ids: number[], action: string, approverId: number, approverName: string, opinion: string): Promise<any> {
    const results: any[] = []

    for (const id of ids) {
      if (dbConnected) {
        const todo = await Todo.findByPk(id)
        if (todo) {
          const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'transferred'
          await todo.update({ status: newStatus })
          await ApprovalRecord.create({
            todoId: id, approverId, approverName, action, opinion
          })
          results.push({ id, success: true })
        } else {
          results.push({ id, success: false, message: '待办不存在' })
        }
      } else {
        const todo = mockTodos.find((t) => t.id === id)
        if (todo) {
          todo.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'transferred'
          results.push({ id, success: true })
        } else {
          results.push({ id, success: false, message: '待办不存在' })
        }
      }
    }

    return { results, total: ids.length, success: results.filter((r) => r.success).length }
  },

  // 更新待办状态
  async updateTodoStatus(id: number, status: string): Promise<any> {
    if (dbConnected) {
      const todo = await Todo.findByPk(id)
      if (!todo) throw new Error('待办不存在')
      await todo.update({ status })
      return normalizeTodo(todo)
    }
    const todo = mockTodos.find((t) => t.id === id)
    if (!todo) throw new Error('待办不存在')
    todo.status = status
    return { ...todo, records: [] }
  },

  // 检查超时待办
  async checkTimeout(): Promise<number> {
    const now = new Date()
    if (dbConnected) {
      const [count] = await Todo.update(
        { isTimeout: true },
        { where: { status: 'pending', dueAt: { [Op.lt]: now }, isTimeout: false } }
      )
      return count
    }
    let count = 0
    mockTodos.forEach((t) => {
      if (t.status === 'pending' && t.dueTime && new Date(t.dueTime) < now && !t.isTimeout) {
        t.isTimeout = true
        count++
      }
    })
    return count
  }
}

export default todoService

import { Op } from 'sequelize'
import { Todo, ApprovalRecord, User, dbConnected } from '../models/index.js'

// 内存 Mock 待办（数据库不可用时的兜底数据）
const mockTodos: any[] = [
  {
    id: 1, title: '关于2026年Q3营销费用报销审批', source: '财务系统', type: 'expense',
    priority: 'high', amount: 58000, applicantId: 4, applicantName: '王采购',
    department: '采购部', status: 'pending', isTimeout: false, isUrgent: true,
    submittedAt: new Date(Date.now() - 24 * 3600 * 1000),
    dueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    createdAt: new Date(Date.now() - 24 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000)
  },
  {
    id: 2, title: '原材料采购合同审批（供应商：河北某粮油）', source: '合同系统', type: 'contract',
    priority: 'high', amount: 1280000, applicantId: 4, applicantName: '王采购',
    department: '采购部', status: 'pending', isTimeout: true, isUrgent: false,
    submittedAt: new Date(Date.now() - 48 * 3600 * 1000),
    dueAt: new Date(Date.now() - 12 * 3600 * 1000),
    createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 48 * 3600 * 1000)
  },
  {
    id: 3, title: '华北区渠道拓展项目立项', source: '项目系统', type: 'project',
    priority: 'normal', amount: 350000, applicantId: 3, applicantName: '李法务',
    department: '法务部', status: 'pending', isTimeout: false, isUrgent: false,
    submittedAt: new Date(Date.now() - 6 * 3600 * 1000),
    dueAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    createdAt: new Date(Date.now() - 6 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000)
  },
  {
    id: 4, title: '办公设备采购申请', source: '采购系统', type: 'procurement',
    priority: 'low', amount: 36000, applicantId: 2, applicantName: '张财务',
    department: '财务部', status: 'pending', isTimeout: false, isUrgent: false,
    submittedAt: new Date(Date.now() - 72 * 3600 * 1000),
    dueAt: new Date(Date.now() + 24 * 3600 * 1000),
    createdAt: new Date(Date.now() - 72 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 72 * 3600 * 1000)
  },
  // ===== 新增模拟数据：让待办中心更丰富，覆盖不同类型/状态/紧急度 =====
  {
    id: 5, title: '旧办公车辆资产处置审批', source: '资产系统', type: 'asset',
    priority: 'normal', urgency: 'medium', amount: 86000, applicantId: 4, applicantName: '王采购',
    department: '采购部', status: 'pending', isTimeout: false, isUrgent: false,
    summary: 'AI摘要：资产账面净值12.3万，处置方式为公开拍卖，预估回收8.6万，残值率约70%。',
    submittedAt: new Date(Date.now() - 2 * 3600 * 1000),
    dueAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000)
  },
  {
    id: 6, title: '2026年度IT设备批量采购申请', source: '采购系统', type: 'purchase',
    priority: 'high', urgency: 'high', amount: 456000, applicantId: 2, applicantName: '张财务',
    department: '财务部', status: 'pending', isTimeout: false, isUrgent: true,
    summary: 'AI摘要：采购清单含笔记本40台、显示器60台，单价均在集采目录内，总额低于年度IT预算上限。',
    submittedAt: new Date(Date.now() - 12 * 3600 * 1000),
    dueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    createdAt: new Date(Date.now() - 12 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000)
  },
  {
    id: 7, title: '华南大区Q3差旅费用报销', source: '财务系统', type: 'expense',
    priority: 'normal', urgency: 'low', amount: 23600, applicantId: 5, applicantName: '陈销售',
    department: '销售部', status: 'processing', isTimeout: false, isUrgent: false,
    summary: 'AI摘要：共12笔差旅，票据齐全，超出标准部分380元已在备注中说明。',
    submittedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    dueAt: new Date(Date.now() + 4 * 24 * 3600 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000)
  },
  {
    id: 8, title: 'IT运维外包服务合同审批（供应商：某科技）', source: '合同系统', type: 'contract',
    priority: 'high', urgency: 'high', amount: 680000, applicantId: 3, applicantName: '李法务',
    department: '法务部', status: 'pending', isTimeout: true, isUrgent: true,
    summary: 'AI摘要：合同期2年，含SLA条款与违约责任，风险点为自动续约条款需补充终止通知期。',
    submittedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    dueAt: new Date(Date.now() - 6 * 3600 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000)
  },
  {
    id: 9, title: '智能制造数字化转型咨询项目立项', source: '项目系统', type: 'project',
    priority: 'normal', urgency: 'medium', amount: 980000, applicantId: 6, applicantName: '赵技术',
    department: '技术部', status: 'pending', isTimeout: false, isUrgent: false,
    summary: 'AI摘要：咨询周期6个月，交付物含现状诊断、蓝图设计与落地路线图，金额接近同类项目均价。',
    submittedAt: new Date(Date.now() - 4 * 3600 * 1000),
    dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    createdAt: new Date(Date.now() - 4 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000)
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
      return { list: rows, total: count, page, pageSize }
    }

    // Mock 数据筛选
    let list = [...mockTodos]
    if (status) list = list.filter((t) => t.status === status)
    if (type) list = list.filter((t) => t.type === type)
    if (priority) list = list.filter((t) => t.priority === priority)
    if (isUrgent === 'true') list = list.filter((t) => t.isUrgent)
    if (keyword) list = list.filter((t) => t.title.includes(keyword))

    const total = list.length
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total, page, pageSize }
  },

  // 获取待办详情
  async getTodoById(id: number): Promise<any> {
    if (dbConnected) {
      const todo = await Todo.findByPk(id, {
        include: [{ model: ApprovalRecord, as: 'records' }]
      })
      return todo
    }
    const todo = mockTodos.find((t) => t.id === id)
    if (!todo) return null
    return { ...todo, records: [] }
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
      return todo
    }
    const todo = mockTodos.find((t) => t.id === id)
    if (!todo) throw new Error('待办不存在')
    todo.status = status
    return todo
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
      if (t.status === 'pending' && t.dueAt && t.dueAt < now && !t.isTimeout) {
        t.isTimeout = true
        count++
      }
    })
    return count
  }
}

export default todoService

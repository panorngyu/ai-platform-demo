import bcrypt from 'bcryptjs'
import { User } from './User.js'
import { Department } from './Department.js'
import { Todo } from './Todo.js'
import { ApprovalRecord } from './ApprovalRecord.js'
import { Workflow } from './Workflow.js'
import { FormTemplate } from './FormTemplate.js'
import { AuditRule } from './AuditRule.js'
import { Contract } from './Contract.js'
import { ExpenseReport } from './ExpenseReport.js'
import { Budget } from './Budget.js'
import { SystemLog } from './SystemLog.js'
import { sequelize, dbConnected } from '../config/database.js'

// 重新导出 dbConnected 供服务层使用
export { dbConnected }

// 关联关系
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' })
Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' })
Department.hasMany(Department, { foreignKey: 'parentId', as: 'children' })
Department.belongsTo(Department, { foreignKey: 'parentId', as: 'parent' })

Todo.hasMany(ApprovalRecord, { foreignKey: 'todoId', as: 'records' })
ApprovalRecord.belongsTo(Todo, { foreignKey: 'todoId', as: 'todo' })
ApprovalRecord.belongsTo(User, { foreignKey: 'approverId', as: 'approver' })

export {
  User,
  Department,
  Todo,
  ApprovalRecord,
  Workflow,
  FormTemplate,
  AuditRule,
  Contract,
  ExpenseReport,
  Budget,
  SystemLog
}

// 同步所有模型到数据库
export async function syncModels(): Promise<void> {
  if (!dbConnected) return
  await sequelize.sync({ alter: false })
  console.log('[Database] 模型同步完成')
}

// 初始化种子数据
export async function seedData(): Promise<void> {
  if (!dbConnected) return

  // 部门
  const deptCount = await Department.count()
  if (deptCount === 0) {
    await Department.bulkCreate([
      { id: 1, name: '道一云集团', parentId: 0, sort: 1 },
      { id: 2, name: '财务部', parentId: 1, sort: 1 },
      { id: 3, name: '法务部', parentId: 1, sort: 2 },
      { id: 4, name: '采购部', parentId: 1, sort: 3 },
      { id: 5, name: '营销中心', parentId: 1, sort: 4 },
      { id: 6, name: '信息技术部', parentId: 1, sort: 5 }
    ])
  }

  // 用户
  const userCount = await User.count()
  if (userCount === 0) {
    const password = await bcrypt.hash('admin123', 10)
    await User.bulkCreate([
      { id: 1, username: 'admin', password, realName: '系统管理员', role: 'admin', departmentId: 6, status: 'active', avatar: '' },
      { id: 2, username: 'caiwu', password: await bcrypt.hash('123456', 10), realName: '张财务', role: 'manager', departmentId: 2, status: 'active' },
      { id: 3, username: 'fawu', password: await bcrypt.hash('123456', 10), realName: '李法务', role: 'manager', departmentId: 3, status: 'active' },
      { id: 4, username: 'caigou', password: await bcrypt.hash('123456', 10), realName: '王采购', role: 'user', departmentId: 4, status: 'active' }
    ])
  }

  // 待办
  const todoCount = await Todo.count()
  if (todoCount === 0) {
    await Todo.bulkCreate([
      {
        id: 1, title: '关于2026年Q3营销费用报销审批', source: '财务系统', type: 'expense',
        priority: 'high', amount: 58000, applicantId: 4, applicantName: '王采购',
        department: '采购部', status: 'pending', isUrgent: true,
        submittedAt: new Date(Date.now() - 24 * 3600 * 1000),
        dueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000)
      },
      {
        id: 2, title: '原材料采购合同审批（供应商：河北某粮油）', source: '合同系统', type: 'contract',
        priority: 'high', amount: 1280000, applicantId: 4, applicantName: '王采购',
        department: '采购部', status: 'pending',
        submittedAt: new Date(Date.now() - 48 * 3600 * 1000),
        dueAt: new Date(Date.now() - 12 * 3600 * 1000)
      },
      {
        id: 3, title: '华北区渠道拓展项目立项', source: '项目系统', type: 'project',
        priority: 'normal', amount: 350000, applicantId: 3, applicantName: '李法务',
        department: '法务部', status: 'pending',
        submittedAt: new Date(Date.now() - 6 * 3600 * 1000),
        dueAt: new Date(Date.now() + 5 * 24 * 3600 * 1000)
      },
      {
        id: 4, title: '办公设备采购申请', source: '采购系统', type: 'procurement',
        priority: 'low', amount: 36000, applicantId: 2, applicantName: '张财务',
        department: '财务部', status: 'pending',
        submittedAt: new Date(Date.now() - 72 * 3600 * 1000),
        dueAt: new Date(Date.now() + 24 * 3600 * 1000)
      }
    ])
    // 标记超时
    await Todo.update({ isTimeout: true }, { where: { id: 2 } })
  }

  // 预算
  const budgetCount = await Budget.count()
  if (budgetCount === 0) {
    await Budget.bulkCreate([
      { id: 1, department: '采购部', category: '原材料', totalAmount: 5000000, usedAmount: 3120000, period: '2026-Q3' },
      { id: 2, department: '营销中心', category: '广告投放', totalAmount: 2000000, usedAmount: 1680000, period: '2026-Q3' },
      { id: 3, department: '财务部', category: '办公', totalAmount: 500000, usedAmount: 220000, period: '2026-Q3' },
      { id: 4, department: '法务部', category: '法律咨询', totalAmount: 300000, usedAmount: 180000, period: '2026-Q3' }
    ])
  }

  // 审核规则
  const ruleCount = await AuditRule.count()
  if (ruleCount === 0) {
    await AuditRule.bulkCreate([
      { id: 1, name: '金额超50万需高管审批', type: 'expense', condition: { all: [{ fact: 'amount', operator: 'greaterThanInclusive', value: 500000 }] }, action: 'require_senior_approval', priority: 1 },
      { id: 2, name: '超预算预警', type: 'expense', condition: { all: [{ fact: 'overBudget', operator: 'equal', value: true }] }, action: 'alert_over_budget', priority: 1 },
      { id: 3, name: '合同金额超100万需法务审查', type: 'contract', condition: { all: [{ fact: 'amount', operator: 'greaterThanInclusive', value: 1000000 }] }, action: 'require_legal_review', priority: 1 }
    ])
  }

  // 流程模板
  const wfCount = await Workflow.count()
  if (wfCount === 0) {
    await Workflow.bulkCreate([
      { id: 1, name: '标准费用报销流程', type: 'expense', status: 'active', version: '1.0.0', nodes: [{ name: '部门经理', role: 'manager' }, { name: '财务审核', role: 'finance' }, { name: '财务总监', role: 'cfo' }], routes: {} },
      { id: 2, name: '合同审批流程', type: 'contract', status: 'active', version: '1.0.0', nodes: [{ name: '部门经理', role: 'manager' }, { name: '法务审核', role: 'legal' }, { name: '总经理', role: 'gm' }], routes: {} }
    ])
  }

  // 表单模板
  const ftCount = await FormTemplate.count()
  if (ftCount === 0) {
    await FormTemplate.bulkCreate([
      { id: 1, name: '费用报销单', type: 'expense', status: 'active', version: '1.0.0', schema: { fields: [{ name: 'type', label: '费用类型', type: 'select' }, { name: 'amount', label: '金额', type: 'number' }] } },
      { id: 2, name: '合同审批单', type: 'contract', status: 'active', version: '1.0.0', schema: { fields: [{ name: 'title', label: '合同标题', type: 'text' }, { name: 'partyA', label: '甲方', type: 'text' }] } }
    ])
  }

  console.log('[Database] 种子数据初始化完成')
}

export default {
  User,
  Department,
  Todo,
  ApprovalRecord,
  Workflow,
  FormTemplate,
  AuditRule,
  Contract,
  ExpenseReport,
  Budget,
  SystemLog,
  syncModels,
  seedData
}

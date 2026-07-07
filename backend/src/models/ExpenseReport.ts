import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class ExpenseReport extends Model {
  declare id: number
  declare applicantId: number
  declare applicantName: string
  declare department: string
  declare type: string
  declare amount: number
  declare date: Date
  declare description: string
  declare invoices: any
  declare aiParsed: any
  declare status: string
  declare budgetBefore: number
  declare budgetAfter: number
  declare createdAt: Date
  declare updatedAt: Date
}

ExpenseReport.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    applicantId: { type: DataTypes.INTEGER, allowNull: true, comment: '申请人ID' },
    applicantName: { type: DataTypes.STRING(64), allowNull: true, comment: '申请人姓名' },
    department: { type: DataTypes.STRING(64), allowNull: true, comment: '部门' },
    type: { type: DataTypes.STRING(32), allowNull: false, comment: '类型: 餐饮/交通/住宿/办公/会议' },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, comment: '金额' },
    date: { type: DataTypes.DATEONLY, allowNull: true, comment: '发生日期' },
    description: { type: DataTypes.TEXT, allowNull: true, comment: '说明' },
    invoices: { type: DataTypes.JSON, allowNull: true, comment: '发票列表' },
    aiParsed: { type: DataTypes.JSON, allowNull: true, comment: 'AI解析结果' },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending', comment: '状态' },
    budgetBefore: { type: DataTypes.DECIMAL(14, 2), allowNull: true, comment: '扣减前预算' },
    budgetAfter: { type: DataTypes.DECIMAL(14, 2), allowNull: true, comment: '扣减后预算' }
  },
  {
    sequelize,
    modelName: 'ExpenseReport',
    tableName: 'expense_reports'
  }
)

export default ExpenseReport

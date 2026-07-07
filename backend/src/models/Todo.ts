import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class Todo extends Model {
  declare id: number
  declare title: string
  declare source: string
  declare type: string
  declare priority: string
  declare amount: number
  declare applicantId: number
  declare applicantName: string
  declare department: string
  declare status: string
  declare isTimeout: boolean
  declare isUrgent: boolean
  declare createdAt: Date
  declare submittedAt: Date
  declare dueAt: Date
  declare updatedAt: Date
}

Todo.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false, comment: '待办标题' },
    source: { type: DataTypes.STRING(64), allowNull: false, comment: '来源系统' },
    type: { type: DataTypes.STRING(32), allowNull: false, comment: '类型: contract/expense/procurement/project/asset' },
    priority: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'normal', comment: '优先级: high/normal/low' },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0, comment: '金额' },
    applicantId: { type: DataTypes.INTEGER, allowNull: true, comment: '申请人ID' },
    applicantName: { type: DataTypes.STRING(64), allowNull: true, comment: '申请人姓名' },
    department: { type: DataTypes.STRING(64), allowNull: true, comment: '申请部门' },
    status: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态: pending/approved/rejected/transferred'
    },
    isTimeout: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: '是否超时' },
    isUrgent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: '是否加急' },
    submittedAt: { type: DataTypes.DATE, allowNull: true, comment: '提交时间' },
    dueAt: { type: DataTypes.DATE, allowNull: true, comment: '截止时间' }
  },
  {
    sequelize,
    modelName: 'Todo',
    tableName: 'todos'
  }
)

export default Todo

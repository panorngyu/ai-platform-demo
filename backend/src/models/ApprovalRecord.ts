import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class ApprovalRecord extends Model {
  declare id: number
  declare todoId: number
  declare approverId: number
  declare approverName: string
  declare action: string
  declare opinion: string
  declare aiOpinion: string
  declare aiRiskLevel: string
  declare aiSummary: string
  declare createdAt: Date
}

ApprovalRecord.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    todoId: { type: DataTypes.INTEGER, allowNull: false, comment: '待办ID' },
    approverId: { type: DataTypes.INTEGER, allowNull: true, comment: '审批人ID' },
    approverName: { type: DataTypes.STRING(64), allowNull: true, comment: '审批人姓名' },
    action: {
      type: DataTypes.STRING(16),
      allowNull: false,
      comment: '动作: approve/reject/return/transfer'
    },
    opinion: { type: DataTypes.TEXT, allowNull: true, comment: '审批意见' },
    aiOpinion: { type: DataTypes.TEXT, allowNull: true, comment: 'AI建议意见' },
    aiRiskLevel: { type: DataTypes.STRING(16), allowNull: true, comment: 'AI风险等级: low/medium/high' },
    aiSummary: { type: DataTypes.TEXT, allowNull: true, comment: 'AI摘要' }
  },
  {
    sequelize,
    modelName: 'ApprovalRecord',
    tableName: 'approval_records'
  }
)

export default ApprovalRecord

import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class AuditRule extends Model {
  declare id: number
  declare name: string
  declare type: string
  declare condition: any
  declare action: string
  declare priority: number
  declare status: string
  declare createdAt: Date
  declare updatedAt: Date
}

AuditRule.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(128), allowNull: false, comment: '规则名称' },
    type: { type: DataTypes.STRING(32), allowNull: false, comment: '规则类型' },
    condition: { type: DataTypes.JSON, allowNull: true, comment: '规则条件' },
    action: { type: DataTypes.STRING(32), allowNull: true, comment: '触发动作' },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: '优先级' },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active', comment: '状态: active/disabled' }
  },
  {
    sequelize,
    modelName: 'AuditRule',
    tableName: 'audit_rules'
  }
)

export default AuditRule

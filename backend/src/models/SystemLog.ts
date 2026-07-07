import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class SystemLog extends Model {
  declare id: number
  declare userId: number
  declare userName: string
  declare action: string
  declare module: string
  declare detail: string
  declare ip: string
  declare createdAt: Date
}

SystemLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, comment: '用户ID' },
    userName: { type: DataTypes.STRING(64), allowNull: true, comment: '用户名' },
    action: { type: DataTypes.STRING(64), allowNull: false, comment: '操作动作' },
    module: { type: DataTypes.STRING(64), allowNull: true, comment: '模块' },
    detail: { type: DataTypes.TEXT, allowNull: true, comment: '详情' },
    ip: { type: DataTypes.STRING(64), allowNull: true, comment: 'IP地址' }
  },
  {
    sequelize,
    modelName: 'SystemLog',
    tableName: 'system_logs',
    updatedAt: false
  }
)

export default SystemLog

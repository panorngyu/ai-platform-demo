import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class Budget extends Model {
  declare id: number
  declare department: string
  declare category: string
  declare totalAmount: number
  declare usedAmount: number
  declare period: string
  declare createdAt: Date
  declare updatedAt: Date
}

Budget.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    department: { type: DataTypes.STRING(64), allowNull: false, comment: '部门' },
    category: { type: DataTypes.STRING(64), allowNull: false, comment: '类别' },
    totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, comment: '预算总额' },
    usedAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, comment: '已使用' },
    period: { type: DataTypes.STRING(16), allowNull: false, comment: '周期: 2026-Q3' }
  },
  {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets'
  }
)

export default Budget

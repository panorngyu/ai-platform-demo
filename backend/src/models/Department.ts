import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class Department extends Model {
  declare id: number
  declare name: string
  declare parentId: number
  declare sort: number
  declare createdAt: Date
  declare updatedAt: Date
}

Department.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(64), allowNull: false, comment: '部门名称' },
    parentId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0, comment: '父部门ID，0为根' },
    sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: '排序' }
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'departments'
  }
)

export default Department

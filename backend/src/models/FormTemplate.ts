import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class FormTemplate extends Model {
  declare id: number
  declare name: string
  declare type: string
  declare schema: any
  declare version: string
  declare status: string
  declare createdAt: Date
  declare updatedAt: Date
}

FormTemplate.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(128), allowNull: false, comment: '表单名称' },
    type: { type: DataTypes.STRING(32), allowNull: false, comment: '表单类型' },
    schema: { type: DataTypes.JSON, allowNull: true, comment: '表单Schema' },
    version: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '1.0.0', comment: '版本号' },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active', comment: '状态: active/disabled' }
  },
  {
    sequelize,
    modelName: 'FormTemplate',
    tableName: 'form_templates'
  }
)

export default FormTemplate

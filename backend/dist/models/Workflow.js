import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
export class Workflow extends Model {
}
Workflow.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(128), allowNull: false, comment: '流程名称' },
    type: { type: DataTypes.STRING(32), allowNull: false, comment: '流程类型' },
    nodes: { type: DataTypes.JSON, allowNull: true, comment: '流程节点' },
    routes: { type: DataTypes.JSON, allowNull: true, comment: '流转路由' },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active', comment: '状态: active/disabled' },
    version: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '1.0.0', comment: '版本号' }
}, {
    sequelize,
    modelName: 'Workflow',
    tableName: 'workflows'
});
export default Workflow;

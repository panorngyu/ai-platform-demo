import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
export class Contract extends Model {
}
Contract.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false, comment: '合同标题' },
    type: { type: DataTypes.STRING(64), allowNull: true, comment: '合同类型' },
    partyA: { type: DataTypes.STRING(128), allowNull: true, comment: '甲方' },
    partyB: { type: DataTypes.STRING(128), allowNull: true, comment: '乙方' },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0, comment: '合同金额' },
    signDate: { type: DataTypes.DATEONLY, allowNull: true, comment: '签订日期' },
    startDate: { type: DataTypes.DATEONLY, allowNull: true, comment: '开始日期' },
    endDate: { type: DataTypes.DATEONLY, allowNull: true, comment: '结束日期' },
    content: { type: DataTypes.TEXT('long'), allowNull: true, comment: '合同内容' },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'draft', comment: '状态' },
    riskLevel: { type: DataTypes.STRING(16), allowNull: true, comment: '风险等级: low/medium/high' },
    auditResult: { type: DataTypes.JSON, allowNull: true, comment: '审查结果' }
}, {
    sequelize,
    modelName: 'Contract',
    tableName: 'contracts'
});
export default Contract;

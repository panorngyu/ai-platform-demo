import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
export class User extends Model {
}
User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(64), allowNull: false, unique: true, comment: '用户名' },
    password: { type: DataTypes.STRING(128), allowNull: false, comment: '密码（bcrypt）' },
    realName: { type: DataTypes.STRING(64), allowNull: true, comment: '真实姓名' },
    avatar: { type: DataTypes.STRING(255), allowNull: true, comment: '头像URL' },
    email: { type: DataTypes.STRING(128), allowNull: true, comment: '邮箱' },
    phone: { type: DataTypes.STRING(20), allowNull: true, comment: '手机号' },
    departmentId: { type: DataTypes.INTEGER, allowNull: true, comment: '部门ID' },
    role: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'user', comment: '角色: admin/manager/user' },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active', comment: '状态: active/disabled' },
    wecomUserId: { type: DataTypes.STRING(64), allowNull: true, comment: '企业微信UserId' }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
});
export default User;

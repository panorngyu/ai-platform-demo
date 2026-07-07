import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User, dbConnected } from '../models/index.js';
// 内存 Mock 用户（数据库不可用时使用）
const mockUsers = [
    {
        id: 1,
        username: 'admin',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqYHnTBCwZJzKHfIvDJSq0gKq.5QQK', // admin123
        realName: '系统管理员',
        role: 'admin',
        departmentId: 6,
        status: 'active',
        avatar: '',
        email: 'admin@jinmailang.com',
        phone: '13800000000'
    }
];
(async () => {
    const hash = await bcrypt.hash('admin123', 10);
    mockUsers[0].password = hash;
})();
// 角色权限映射
const rolePermissions = {
    admin: ['*'],
    manager: ['todo:approve', 'todo:view', 'expense:audit', 'contract:audit', 'dashboard:view'],
    user: ['todo:view', 'expense:create', 'contract:create']
};
export const authService = {
    // 登录
    async login(username, password) {
        let user = null;
        if (dbConnected) {
            user = await User.findOne({ where: { username } });
        }
        else {
            user = mockUsers.find((u) => u.username === username);
        }
        if (!user) {
            throw new Error('用户不存在');
        }
        if (user.status && user.status !== 'active') {
            throw new Error('账号已被禁用');
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new Error('密码错误');
        }
        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role, realName: user.realName }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                realName: user.realName,
                role: user.role,
                avatar: user.avatar,
                email: user.email,
                phone: user.phone
            }
        };
    },
    // 验证 token
    verifyToken(token) {
        return jwt.verify(token, config.jwt.secret);
    },
    // 获取用户信息
    async getUserInfo(userId) {
        let user = null;
        if (dbConnected) {
            user = await User.findByPk(userId);
        }
        else {
            user = mockUsers.find((u) => u.id === userId);
        }
        if (!user) {
            throw new Error('用户不存在');
        }
        return {
            id: user.id,
            username: user.username,
            realName: user.realName,
            role: user.role,
            avatar: user.avatar,
            email: user.email,
            phone: user.phone,
            permissions: rolePermissions[user.role] || []
        };
    },
    // 企业微信 OAuth2 回调（降级处理）
    async wecomCallback(code) {
        // 简化：返回 admin
        return this.login('admin', 'admin123');
    }
};
export default authService;

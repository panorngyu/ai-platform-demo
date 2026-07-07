import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { fail } from '../utils/response.js';
// JWT 验证中间件
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(fail('未提供认证token', 401));
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            realName: decoded.realName
        };
        next();
    }
    catch (error) {
        res.status(401).json(fail('token无效或已过期', 401));
    }
}
// 角色权限校验中间件工厂
export function rbacMiddleware(roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json(fail('未认证', 401));
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json(fail('无权限访问该资源', 403));
            return;
        }
        next();
    };
}
// 统一错误处理中间件
export function errorHandler(err, req, res, next) {
    console.error('[Error]', err.message, err.stack);
    res.status(500).json({
        code: 500,
        success: false,
        message: err.message || '服务器内部错误',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}
export default { authMiddleware, rbacMiddleware, errorHandler };

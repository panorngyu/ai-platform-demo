import { Router } from 'express';
import { authService } from '../services/authService.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware } from '../middlewares/auth.js';
const router = Router();
// 登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.json(fail('用户名和密码不能为空'));
            return;
        }
        const result = await authService.login(username, password);
        res.json(success(result, '登录成功'));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 登出
router.post('/logout', authMiddleware, async (req, res) => {
    res.json(success(null, '登出成功'));
});
// 获取用户信息
router.get('/user-info', authMiddleware, async (req, res) => {
    try {
        const userInfo = await authService.getUserInfo(req.user.userId);
        res.json(success(userInfo));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 企业微信回调（降级处理）
router.post('/wecom-callback', async (req, res) => {
    try {
        const { code } = req.body;
        const result = await authService.wecomCallback(code);
        res.json(success(result, '企业微信登录成功'));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
export default router;

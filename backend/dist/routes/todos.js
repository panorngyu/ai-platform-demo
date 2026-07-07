import { Router } from 'express';
import { todoService } from '../services/todoService.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware } from '../middlewares/auth.js';
const router = Router();
router.use(authMiddleware);
// 待办列表
router.get('/', async (req, res) => {
    try {
        const result = await todoService.getTodos(req.query);
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 待办详情
router.get('/:id', async (req, res) => {
    try {
        const todo = await todoService.getTodoById(parseInt(req.params.id, 10));
        if (!todo) {
            res.json(fail('待办不存在', 404));
            return;
        }
        res.json(success(todo));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 批量审批
router.post('/batch-approve', async (req, res) => {
    try {
        const { ids, action, opinion } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.json(fail('请选择待办'));
            return;
        }
        const result = await todoService.batchApprove(ids, action, req.user.userId, req.user.realName || req.user.username, opinion);
        res.json(success(result, '批量审批完成'));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 更新待办状态
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const todo = await todoService.updateTodoStatus(parseInt(req.params.id, 10), status);
        res.json(success(todo, '状态更新成功'));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
export default router;

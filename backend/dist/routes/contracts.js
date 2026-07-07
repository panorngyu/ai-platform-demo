import { Router } from 'express';
import { contractService } from '../services/contractService.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware } from '../middlewares/auth.js';
const router = Router();
router.use(authMiddleware);
// 合同列表
router.get('/', async (req, res) => {
    try {
        const result = await contractService.getContracts(req.query);
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 合同详情
router.get('/:id', async (req, res) => {
    try {
        const contract = await contractService.getContractById(parseInt(req.params.id, 10));
        if (!contract) {
            res.json(fail('合同不存在', 404));
            return;
        }
        res.json(success(contract));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 创建合同
router.post('/', async (req, res) => {
    try {
        const contract = await contractService.createContract(req.body);
        res.json(success(contract, '创建成功'));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// AI 起草
router.post('/draft', async (req, res) => {
    try {
        const { type, elements } = req.body;
        if (!type) {
            res.json(fail('type不能为空'));
            return;
        }
        const result = await contractService.aiDraft(type, elements || {});
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// AI 对比
router.post('/compare', async (req, res) => {
    try {
        const { v1, v2 } = req.body;
        if (!v1 || !v2) {
            res.json(fail('请提供两个版本的合同内容'));
            return;
        }
        const result = await contractService.aiCompare(v1, v2);
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// AI 审查
router.post('/review', async (req, res) => {
    try {
        const { contractId } = req.body;
        if (!contractId) {
            res.json(fail('contractId不能为空'));
            return;
        }
        const result = await contractService.aiReview(parseInt(contractId, 10));
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 生成审查报告
router.post('/report', async (req, res) => {
    try {
        const { contractId } = req.body;
        if (!contractId) {
            res.json(fail('contractId不能为空'));
            return;
        }
        const result = await contractService.generateReport(parseInt(contractId, 10));
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
export default router;

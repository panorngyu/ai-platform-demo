import { Router } from 'express';
import { dashboardService } from '../services/dashboardService.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware } from '../middlewares/auth.js';
const router = Router();
router.use(authMiddleware);
// 大屏概览
router.get('/overview', async (req, res) => {
    try {
        const data = await dashboardService.getOverview();
        res.json(success(data));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 效率分析
router.get('/efficiency', async (req, res) => {
    try {
        const data = await dashboardService.getEfficiencyAnalysis();
        res.json(success(data));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// 异常预警
router.get('/alerts', async (req, res) => {
    try {
        const data = await dashboardService.getAlerts();
        res.json(success(data));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
export default router;

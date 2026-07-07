import { Router, Request, Response } from 'express'
import { dashboardService } from '../services/dashboardService.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// 大屏概览
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getOverview()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 效率分析
router.get('/efficiency', async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getEfficiencyAnalysis()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 异常预警
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getAlerts()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

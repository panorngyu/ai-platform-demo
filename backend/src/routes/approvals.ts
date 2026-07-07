import { Router, Request, Response } from 'express'
import { approvalService } from '../services/approvalService.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// 审批意见模板
router.get('/opinion-templates', async (req: Request, res: Response) => {
  try {
    const templates = await approvalService.getOpinionTemplates()
    res.json(success(templates))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 审批详情
router.get('/:todoId', async (req: Request, res: Response) => {
  try {
    const detail = await approvalService.getApprovalDetail(parseInt(req.params.todoId, 10))
    if (!detail) {
      res.json(fail('审批详情不存在', 404))
      return
    }
    res.json(success(detail))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 审批操作
router.post('/:todoId/approve', async (req: Request, res: Response) => {
  try {
    const { action, opinion } = req.body
    const result = await approvalService.approve(
      parseInt(req.params.todoId, 10),
      req.user!.userId,
      req.user!.realName || req.user!.username,
      action,
      opinion
    )
    res.json(success(result, '审批成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 审批历史
router.get('/:todoId/history', async (req: Request, res: Response) => {
  try {
    const history = await approvalService.getApprovalHistory(parseInt(req.params.todoId, 10))
    res.json(success(history))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

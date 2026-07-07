import { Router, Request, Response } from 'express'
import { todoService } from '../services/todoService.js'
import { aiService } from '../services/aiService.js'
import { success, fail, paginate } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// 待办列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await todoService.getTodos(req.query)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 待办详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const todo = await todoService.getTodoById(parseInt(req.params.id, 10))
    if (!todo) {
      res.json(fail('待办不存在', 404))
      return
    }
    res.json(success(todo))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 批量审批
router.post('/batch-approve', async (req: Request, res: Response) => {
  try {
    const { ids, action, opinion } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      res.json(fail('请选择待办'))
      return
    }
    const result = await todoService.batchApprove(
      ids,
      action,
      req.user!.userId,
      req.user!.realName || req.user!.username,
      opinion
    )
    res.json(success(result, '批量审批完成'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// AI 批量审批 — 分析选中待办并给出AI建议
router.post('/ai-batch', async (req: Request, res: Response) => {
  try {
    const { ids, autoExecute } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      res.json(fail('请选择待办'))
      return
    }

    // 逐条获取待办并进行AI分析
    const results: any[] = []
    for (const id of ids) {
      const todo = await todoService.getTodoById(id)
      if (!todo) {
        results.push({ id, todoFound: false, message: '待办不存在' })
        continue
      }

      // 构造单据描述内容
      const content = `${todo.title || ''}，类型：${todo.type || ''}，金额：${todo.amount || 0}元，申请人：${todo.applicantName || ''}，部门：${todo.department || ''}`

      // 并行调用AI分析
      const [summaryRes, riskRes] = await Promise.all([
        aiService.generateSummary(content),
        aiService.analyzeRisk(content, [])
      ])

      const riskLevel = riskRes.riskLevel || 'medium'

      // 根据风险等级给出建议操作
      let suggestedAction: string
      let aiOpinion: string
      if (riskLevel === 'low') {
        suggestedAction = 'approve'
        aiOpinion = `AI建议通过：风险等级低，单据信息完整，金额合理。${summaryRes.summary || ''}`
      } else if (riskLevel === 'high') {
        suggestedAction = 'reject'
        aiOpinion = `AI建议驳回：风险等级高，${riskRes.analysis || '存在合规风险，建议退回修改。'}`
      } else {
        suggestedAction = 'approve'
        aiOpinion = `AI建议通过（需关注）：风险等级中等，${riskRes.analysis || '建议核实金额与预算后审批。'}`
      }

      results.push({
        id: todo.id,
        title: todo.title,
        type: todo.type,
        amount: todo.amount,
        applicantName: todo.applicantName,
        department: todo.department,
        riskLevel,
        riskAnalysis: riskRes.analysis || '',
        summary: summaryRes.summary || '',
        suggestedAction,
        aiOpinion,
        mock: summaryRes.mock || riskRes.mock || false
      })
    }

    // 如果自动执行，按AI建议批量处理
    let executed = null
    if (autoExecute) {
      const approveIds = results.filter((r) => r.suggestedAction === 'approve' && r.todoFound !== false).map((r) => r.id)
      const rejectIds = results.filter((r) => r.suggestedAction === 'reject' && r.todoFound !== false).map((r) => r.id)

      const execResults: any[] = []
      if (approveIds.length > 0) {
        const r = await todoService.batchApprove(approveIds, 'approve', req.user!.userId, req.user!.realName || req.user!.username, 'AI批量审批通过')
        execResults.push({ action: 'approve', count: approveIds.length, ids: approveIds })
      }
      if (rejectIds.length > 0) {
        const r = await todoService.batchApprove(rejectIds, 'reject', req.user!.userId, req.user!.realName || req.user!.username, 'AI批量审批驳回')
        execResults.push({ action: 'reject', count: rejectIds.length, ids: rejectIds })
      }
      executed = execResults
    }

    res.json(success({ results, executed }, autoExecute ? 'AI批量审批执行完成' : 'AI批量分析完成'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 更新待办状态
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    const todo = await todoService.updateTodoStatus(parseInt(req.params.id, 10), status)
    res.json(success(todo, '状态更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

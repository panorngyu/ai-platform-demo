import { Router, Request, Response } from 'express'
import { expenseService } from '../services/expenseService.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// 报销列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await expenseService.getExpenses(req.query)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 创建报销单
router.post('/', async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.createExpense(req.body)
    res.json(success(expense, '创建成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 一句话报销解析
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { command } = req.body
    if (!command) {
      res.json(fail('command不能为空'))
      return
    }
    const result = await expenseService.aiParse(command)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// AI 自动填单
router.post('/autofill', async (req: Request, res: Response) => {
  try {
    const result = await expenseService.aiAutoFill(req.body)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 合规风控校验
router.post('/compliance', async (req: Request, res: Response) => {
  try {
    const result = await expenseService.checkCompliance(req.body)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 预算查询
router.get('/budget', async (req: Request, res: Response) => {
  try {
    const { department, category } = req.query
    const budget = await expenseService.getBudget(department as string, category as string)
    res.json(success(budget))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

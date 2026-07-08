import { Router, Request, Response } from 'express'
import { dataChatService } from '../services/dataChatService.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// ==================== 会话管理 ====================

// 获取会话列表
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const list = await dataChatService.getSessions()
    res.json(success(list))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 创建会话
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { title } = req.body
    if (!title || !title.trim()) {
      res.json(fail('title 不能为空'))
      return
    }
    const session = await dataChatService.createSession(title.trim())
    res.json(success(session, '会话创建成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 获取会话详情
router.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    const session = await dataChatService.getSessionById(id)
    if (!session) {
      res.json(fail('会话不存在', 404))
      return
    }
    res.json(success(session))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 删除会话
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    const ok = await dataChatService.deleteSession(id)
    res.json(success(ok, '会话删除成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ==================== 核心问答 ====================

// 提问
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { sessionId, question, connectorId } = req.body
    if (!sessionId) {
      res.json(fail('sessionId 不能为空'))
      return
    }
    if (!question || !question.trim()) {
      res.json(fail('question 不能为空'))
      return
    }
    // connectorId 现在可能是目标系统ID，需要映射为实际的连接器ID
    let actualConnectorId: number | undefined = connectorId ? parseInt(connectorId, 10) : undefined
    if (actualConnectorId) {
      const systems = await dataChatService.getAvailableConnectors()
      const matchedSystem = systems.find((s: any) => s.id === actualConnectorId)
      if (matchedSystem && matchedSystem.connectorId) {
        actualConnectorId = matchedSystem.connectorId
      }
    }

    const answer = await dataChatService.ask(
      parseInt(sessionId, 10),
      question.trim(),
      actualConnectorId
    )
    res.json(success(answer, '问答完成'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ==================== 数据源连接器 ====================

// 获取可用连接器列表
router.get('/connectors', async (req: Request, res: Response) => {
  try {
    const list = await dataChatService.getAvailableConnectors()
    res.json(success(list))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

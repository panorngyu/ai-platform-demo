import { Router, Request, Response } from 'express'
import { connectorService } from '../services/connectorService.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// ==================== 连接器模板库 ====================

// 模板列表
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const list = await connectorService.getTemplates()
    res.json(success(list))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 单个模板
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = await connectorService.getTemplateById(req.params.id)
    if (!template) {
      res.json(fail('模板不存在', 404))
      return
    }
    res.json(success(template))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ==================== 连接器监控 ====================

// 监控概览
router.get('/monitor/overview', async (req: Request, res: Response) => {
  try {
    const overview = await connectorService.getMonitorOverview()
    res.json(success(overview))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 同步趋势
router.get('/monitor/trend', async (req: Request, res: Response) => {
  try {
    const days = parseInt((req.query.days as string) || '15', 10)
    const trend = await connectorService.getSyncTrend(days)
    res.json(success(trend))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 单个连接器监控详情
router.get('/monitor/:id', async (req: Request, res: Response) => {
  try {
    const detail = await connectorService.getMonitorDetail(parseInt(req.params.id, 10))
    res.json(success(detail))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ==================== 连接器测试 ====================

// 测试未保存的配置
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { config } = req.body
    if (!config) {
      res.json(fail('config 不能为空'))
      return
    }
    const result = await connectorService.testConnection(config)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ==================== 连接器 CRUD ====================

// 连接器列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await connectorService.getConnectors(req.query)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 连接器详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const connector = await connectorService.getConnectorById(parseInt(req.params.id, 10))
    if (!connector) {
      res.json(fail('连接器不存在', 404))
      return
    }
    res.json(success(connector))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 创建连接器
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type } = req.body
    if (!name || !type) {
      res.json(fail('name 和 type 不能为空'))
      return
    }
    const connector = await connectorService.createConnector(req.body)
    res.json(success(connector, '创建成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 更新连接器
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const connector = await connectorService.updateConnector(parseInt(req.params.id, 10), req.body)
    res.json(success(connector, '更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 删除连接器
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ok = await connectorService.deleteConnector(parseInt(req.params.id, 10))
    res.json(success(ok, '删除成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 启用/停用连接器
router.put('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { action } = req.body
    if (!action || !['start', 'stop'].includes(action)) {
      res.json(fail('action 参数无效，应为 start 或 stop'))
      return
    }
    const connector = await connectorService.toggleConnector(parseInt(req.params.id, 10), action)
    res.json(success(connector, action === 'start' ? '连接器已启用' : '连接器已停用'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 测试已保存的连接器
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const result = await connectorService.testConnector(parseInt(req.params.id, 10))
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

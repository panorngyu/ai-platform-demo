import { Router, Request, Response } from 'express'
import { llmService } from '../services/llmService.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// ============ 大模型供应商管理 ============

// 获取供应商列表
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const data = llmService.getProviders()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 添加供应商
router.post('/providers', async (req: Request, res: Response) => {
  try {
    const { name, provider, status, apiKey, model, endpoint } = req.body
    if (!name) {
      res.json(fail('供应商名称不能为空'))
      return
    }
    if (!provider) {
      res.json(fail('供应商类型不能为空'))
      return
    }
    const data = llmService.addProvider({ name, provider, status, apiKey, model, endpoint })
    res.json(success(data, '添加供应商成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 更新供应商
router.put('/providers/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.json(fail('无效的供应商ID'))
      return
    }
    const data = llmService.updateProvider(id, req.body)
    if (!data) {
      res.json(fail('供应商不存在'))
      return
    }
    res.json(success(data, '更新供应商成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 删除供应商
router.delete('/providers/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.json(fail('无效的供应商ID'))
      return
    }
    const ok = llmService.deleteProvider(id)
    if (!ok) {
      res.json(fail('供应商不存在'))
      return
    }
    res.json(success(null, '删除供应商成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 测试供应商连接
router.post('/providers/:id/test', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.json(fail('无效的供应商ID'))
      return
    }
    const data = await llmService.testProvider(id)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============ 模型参数配置 ============

// 获取模型参数
router.get('/params', async (req: Request, res: Response) => {
  try {
    const data = llmService.getParams()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 更新模型参数
router.put('/params', async (req: Request, res: Response) => {
  try {
    const { temperature, topP, maxTokens, model, systemPrompt } = req.body
    const data = llmService.updateParams({ temperature, topP, maxTokens, model, systemPrompt })
    res.json(success(data, '更新模型参数成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============ Prompt 模板管理 ============

// 获取模板列表
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const data = llmService.getTemplates()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 获取单个模板
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.json(fail('无效的模板ID'))
      return
    }
    const data = llmService.getTemplateById(id)
    if (!data) {
      res.json(fail('模板不存在'))
      return
    }
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 创建模板
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const { name, category, content, variables, description } = req.body
    if (!name) {
      res.json(fail('模板名称不能为空'))
      return
    }
    if (!content) {
      res.json(fail('模板内容不能为空'))
      return
    }
    const data = llmService.createTemplate({ name, category, content, variables, description })
    res.json(success(data, '创建模板成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 更新模板
router.put('/templates/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.json(fail('无效的模板ID'))
      return
    }
    const data = llmService.updateTemplate(id, req.body)
    if (!data) {
      res.json(fail('模板不存在'))
      return
    }
    res.json(success(data, '更新模板成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 删除模板
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.json(fail('无效的模板ID'))
      return
    }
    const ok = llmService.deleteTemplate(id)
    if (!ok) {
      res.json(fail('模板不存在'))
      return
    }
    res.json(success(null, '删除模板成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 预览模板
router.post('/templates/:id/preview', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.json(fail('无效的模板ID'))
      return
    }
    const variables = req.body.variables || req.body || {}
    const data = llmService.previewTemplate(id, variables)
    if (!data) {
      res.json(fail('模板不存在'))
      return
    }
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============ Token 用量监控 ============

// Token 用量概览
router.get('/usage/overview', async (req: Request, res: Response) => {
  try {
    const data = llmService.getUsageOverview()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// Token 用量明细
router.get('/usage/detail', async (req: Request, res: Response) => {
  try {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10,
      provider: req.query.provider as string | undefined,
      feature: req.query.feature as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined
    }
    const data = llmService.getUsageDetail(query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 按功能统计 Token 用量
router.get('/usage/by-feature', async (req: Request, res: Response) => {
  try {
    const data = llmService.getUsageByFeature()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

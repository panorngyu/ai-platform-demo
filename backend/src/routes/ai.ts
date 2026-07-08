import { Router, Request, Response } from 'express'
import { aiService } from '../services/aiService.js'
import { ocrService } from '../services/ocrService.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'
import multer from 'multer'

const router = Router()
const upload = multer({ dest: 'uploads/' })

router.use(authMiddleware)

// AI 生成摘要
router.post('/audit/summary', async (req: Request, res: Response) => {
  try {
    const documentContent = req.body.documentContent || req.body.content
    if (!documentContent) {
      res.json(fail('documentContent不能为空'))
      return
    }
    const result = await aiService.generateSummary(documentContent)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// AI 风险分析
router.post('/audit/risk', async (req: Request, res: Response) => {
  try {
    const documentContent = req.body.documentContent || req.body.content
    const rules = req.body.rules
    if (!documentContent) {
      res.json(fail('documentContent不能为空'))
      return
    }
    const result = await aiService.analyzeRisk(documentContent, rules || [])
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// AI 生成审核意见
router.post('/audit/opinion', async (req: Request, res: Response) => {
  try {
    const documentContent = req.body.documentContent || req.body.content
    const riskResult = req.body.riskResult
    if (!documentContent) {
      res.json(fail('documentContent不能为空'))
      return
    }
    const result = await aiService.generateOpinion(documentContent, riskResult || {})
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// OCR 发票识别
router.post('/ocr/invoice', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const imagePath = req.file?.path
    if (!imagePath) {
      res.json(fail('请上传图片'))
      return
    }
    const result = await ocrService.recognizeInvoice(imagePath)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// OCR 合同识别
router.post('/ocr/contract', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const imagePath = req.file?.path
    if (!imagePath) {
      res.json(fail('请上传图片'))
      return
    }
    const result = await ocrService.recognizeContract(imagePath)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 智能发起流程 - AI 识别流程类型
router.post('/smart/identify', async (req: Request, res: Response) => {
  try {
    const userInput = req.body.input
    if (!userInput) {
      res.json(fail('input不能为空'))
      return
    }
    const result = aiService.identifyProcess(userInput)
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 智能发起流程 - AI 自动填充表单
router.post('/smart/fill-form', async (req: Request, res: Response) => {
  try {
    const { processType, userInput } = req.body
    if (!processType) {
      res.json(fail('processType不能为空'))
      return
    }
    const result = aiService.fillProcessForm(processType, userInput || '')
    res.json(success(result))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

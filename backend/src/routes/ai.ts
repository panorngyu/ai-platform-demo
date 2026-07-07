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

export default router

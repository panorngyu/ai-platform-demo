import { Router } from 'express';
import { aiService } from '../services/aiService.js';
import { ocrService } from '../services/ocrService.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware } from '../middlewares/auth.js';
import multer from 'multer';
const router = Router();
const upload = multer({ dest: 'uploads/' });
router.use(authMiddleware);
// AI 生成摘要
router.post('/audit/summary', async (req, res) => {
    try {
        const { documentContent } = req.body;
        if (!documentContent) {
            res.json(fail('documentContent不能为空'));
            return;
        }
        const result = await aiService.generateSummary(documentContent);
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// AI 风险分析
router.post('/audit/risk', async (req, res) => {
    try {
        const { documentContent, rules } = req.body;
        if (!documentContent) {
            res.json(fail('documentContent不能为空'));
            return;
        }
        const result = await aiService.analyzeRisk(documentContent, rules || []);
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// AI 生成审核意见
router.post('/audit/opinion', async (req, res) => {
    try {
        const { documentContent, riskResult } = req.body;
        if (!documentContent) {
            res.json(fail('documentContent不能为空'));
            return;
        }
        const result = await aiService.generateOpinion(documentContent, riskResult || {});
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// OCR 发票识别
router.post('/ocr/invoice', upload.single('image'), async (req, res) => {
    try {
        const imagePath = req.file?.path;
        if (!imagePath) {
            res.json(fail('请上传图片'));
            return;
        }
        const result = await ocrService.recognizeInvoice(imagePath);
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
// OCR 合同识别
router.post('/ocr/contract', upload.single('image'), async (req, res) => {
    try {
        const imagePath = req.file?.path;
        if (!imagePath) {
            res.json(fail('请上传图片'));
            return;
        }
        const result = await ocrService.recognizeContract(imagePath);
        res.json(success(result));
    }
    catch (error) {
        res.json(fail(error.message));
    }
});
export default router;

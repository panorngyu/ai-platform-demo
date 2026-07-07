import axios from 'axios'
import { config } from '../config/index.js'

// 判断 OCR 是否配置
function isOCRConfigured(): boolean {
  return !!(config.ocr.baidu.apiKey && config.ocr.baidu.secretKey)
}

// 百度 OCR token
let baiduToken: { token: string; expireAt: number } | null = null

async function getBaiduToken(): Promise<string> {
  if (baiduToken && baiduToken.expireAt > Date.now()) {
    return baiduToken.token
  }
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.ocr.baidu.apiKey}&client_secret=${config.ocr.baidu.secretKey}`
  const res = await axios.get(url)
  baiduToken = {
    token: res.data.access_token,
    expireAt: Date.now() + (res.data.expires_in - 300) * 1000
  }
  return baiduToken.token
}

// 图片转 base64（Node 环境，从文件读取）
async function imageToBase64(imagePath: string): Promise<string> {
  try {
    const fs = await import('fs')
    const buffer = fs.readFileSync(imagePath)
    return buffer.toString('base64')
  } catch {
    return ''
  }
}

export const ocrService = {
  // 发票识别
  async recognizeInvoice(imagePath: string): Promise<any> {
    if (!isOCRConfigured()) {
      return this.mockInvoice(imagePath)
    }

    try {
      const token = await getBaiduToken()
      const image = await imageToBase64(imagePath)
      const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/vat_invoice?access_token=${token}`
      const res = await axios.post(url, `image=${encodeURIComponent(image)}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      return {
        data: res.data,
        mock: false
      }
    } catch (error) {
      console.warn('[OCR] 发票识别失败，降级到 Mock:', (error as Error).message)
      return this.mockInvoice(imagePath)
    }
  },

  // Mock 发票识别
  mockInvoice(imagePath: string): any {
    return {
      data: {
        InvoiceType: '增值税普通发票',
        InvoiceNum: '12345678',
        InvoiceDate: '2026-07-01',
        InvoiceCode: '110002610000',
        TotalAmount: '5000.00',
        TotalTax: '650.00',
        SellerName: '北京某办公用品有限公司',
        SellerRegisterNum: '91110100XXXXXXXXXX',
        PurchaserName: '道一云食品有限公司',
        PurchaserRegisterNum: '91130100XXXXXXXXXX',
        Commodity: [
          { name: '办公耗材', num: '10', price: '500.00', amount: '5000.00' }
        ]
      },
      mock: true,
      message: '发票识别结果（Mock）',
      imagePath
    }
  },

  // 合同识别
  async recognizeContract(imagePath: string): Promise<any> {
    if (!isOCRConfigured()) {
      return this.mockContract(imagePath)
    }

    try {
      const token = await getBaiduToken()
      const image = await imageToBase64(imagePath)
      const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${token}`
      const res = await axios.post(url, `image=${encodeURIComponent(image)}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      const text = (res.data.words_result || []).map((w: any) => w.words).join('\n')
      return {
        data: { text, raw: res.data },
        mock: false
      }
    } catch (error) {
      console.warn('[OCR] 合同识别失败，降级到 Mock:', (error as Error).message)
      return this.mockContract(imagePath)
    }
  },

  // Mock 合同识别
  mockContract(imagePath: string): any {
    return {
      data: {
        text: '采购合同\n\n甲方：道一云食品有限公司\n乙方：河北某粮油有限公司\n\n第一条 合同标的\n甲方向乙方采购原材料，总金额为人民币壹佰贰拾捌万元整（¥1,280,000.00）。\n\n第二条 付款方式\n合同签订后7个工作日内支付预付款30%。\n\n第三条 交货时间\n乙方应于合同签订后30日内完成交货。\n\n（以上为Mock识别内容）'
      },
      mock: true,
      message: '合同识别结果（Mock）',
      imagePath
    }
  }
}

export default ocrService

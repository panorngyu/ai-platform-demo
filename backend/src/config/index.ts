import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    name: process.env.DB_NAME || 'ai_platform_demo'
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'jinmailang_ai_platform_secret_2026',
    expiresIn: process.env.JWT_EXPIRES || '7d'
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'wenxin',
    wenxin: {
      apiKey: process.env.WENXIN_API_KEY || '',
      secretKey: process.env.WENXIN_SECRET_KEY || ''
    },
    qianwen: {
      apiKey: process.env.QIANWEN_API_KEY || ''
    }
  },
  ocr: {
    provider: process.env.OCR_PROVIDER || 'baidu',
    baidu: {
      apiKey: process.env.BAIDU_OCR_API_KEY || '',
      secretKey: process.env.BAIDU_OCR_SECRET_KEY || ''
    }
  },
  wecom: {
    corpId: process.env.WECOM_CORP_ID || '',
    agentId: process.env.WECOM_AGENT_ID || '',
    secret: process.env.WECOM_SECRET || ''
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
  }
}

export default config

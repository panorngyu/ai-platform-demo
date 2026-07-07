import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config/index.js'
import { initDatabase } from './config/database.js'
import routes from './routes/index.js'
import { errorHandler } from './middlewares/auth.js'
import { todoService } from './services/todoService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件（上传的文件）
app.use('/uploads', express.static('uploads'))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ code: 200, success: true, data: { status: 'ok', timestamp: new Date().toISOString() }, message: '服务正常' })
})

// 注册路由（/api 前缀）
app.use('/api', routes)

// 前端静态文件服务（构建后的产物）
const frontendDist = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))

// 前端路由：所有非API、非静态资源请求返回 index.html（SPA路由支持）
app.get('*', (req, res) => {
  // 如果是API请求，返回404 JSON
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
    return res.status(404).json({
      code: 404,
      success: false,
      message: `接口不存在: ${req.method} ${req.path}`
    })
  }
  res.sendFile(path.join(frontendDist, 'index.html'))
})

// 错误处理中间件
app.use(errorHandler)

// 定时任务：每 30 分钟检查超时待办
cron.schedule('*/30 * * * *', async () => {
  try {
    const count = await todoService.checkTimeout()
    if (count > 0) {
      console.log(`[Cron] 检查到 ${count} 条超时待办`)
    }
  } catch (error) {
    console.warn('[Cron] 超时检查失败:', (error as Error).message)
  }
})

// 启动服务器
async function start(): Promise<void> {
  // 初始化数据库（不阻塞启动，连不上用 Mock 数据）
  await initDatabase()

  app.listen(config.port, () => {
    console.log('========================================')
    console.log(`[Server] 道一云AI协同中台后端已启动`)
    console.log(`[Server] 端口: ${config.port}`)
    console.log(`[Server] 地址: http://127.0.0.1:${config.port}`)
    console.log(`[Server] 健康检查: http://127.0.0.1:${config.port}/health`)
    console.log(`[Server] API基础路径: http://127.0.0.1:${config.port}/api`)
    console.log('[Server] 默认账号: admin / admin123')
    console.log('========================================')
  })
}

start().catch((err) => {
  console.error('[Server] 启动失败:', err)
  process.exit(1)
})

export default app

import { Router, Request, Response } from 'express'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// ============ Mock 数据 ============
let customAgents: any[] = []

router.get('/list', async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const builtin = [
      {
        id: 'builtin-expense',
        name: '智能报销助手',
        description: 'AI驱动的一站式报销体验：语音/拍照/文件多模态录入，智能验真查重，自动关联差旅标准与预算控制，合规风险实时预警',
        type: 'flow',
        status: 'online',
        icon: 'Wallet',
        category: '财务管理',
        prompt: '你是一个专业的报销助手...',
        model: 'gpt-4',
        tags: ['报销', 'OCR', '合规检查', '预算控制'],
        isBuiltin: true,
        usageCount: 2847,
        createTime: '2026-03-15 09:00:00',
        updateTime: now,
        routePath: '/expense',
        workflow: {
          name: '智能报销流程',
          description: '自动识别票据、验真、关联预算并提交审批',
          triggerType: 'manual',
          steps: [
            { id: 'step-1', name: 'OCR识别票据', type: 'api_call', enabled: true, config: { name: 'OCR服务', url: 'https://api.example.com/ocr/recognize', method: 'POST', headers: [{ key: 'Content-Type', value: 'application/json' }], bodyType: 'json', body: '{"image": "{{input.image}}"}', timeout: 30000, retryCount: 1, successField: 'code==200', outputKey: 'ocrResult' } },
            { id: 'step-2', name: '验真查重', type: 'api_call', enabled: true, config: { name: '验真服务', url: 'https://api.example.com/verify/invoice', method: 'POST', headers: [{ key: 'Content-Type', value: 'application/json' }], bodyType: 'json', body: '{"invoice": "{{ocrResult.data}}"}', timeout: 20000, retryCount: 0, successField: 'code==200', outputKey: 'verifyResult' } },
            { id: 'step-3', name: 'AI合规判断', type: 'ai_process', enabled: true, config: { name: 'gpt-4', url: '', method: 'POST', headers: [], bodyType: 'json', body: '根据验真结果和报销标准进行合规判断', timeout: 30000, retryCount: 0, successField: '', outputKey: '' } }
          ]
        }
      },
      {
        id: 'builtin-contract',
        name: '智能合同助手',
        description: 'AI辅助合同全生命周期管理：智能起草/续写/摘要，多版本差异比对，风险条款自动审查与评级，关键要素自动提取归档',
        type: 'flow',
        status: 'online',
        icon: 'Files',
        category: '合同管理',
        prompt: '你是一个专业的合同管理助手...',
        model: 'gpt-4',
        tags: ['合同', 'AI起草', '风险审查', '差异比对'],
        isBuiltin: true,
        usageCount: 1532,
        createTime: '2026-03-15 09:00:00',
        updateTime: now,
        routePath: '/contract',
        workflow: {
          name: '合同审查流程',
          description: '合同提交后自动进行条款提取、风险审查和合规检查',
          triggerType: 'manual',
          steps: [
            { id: 'step-1', name: '提取合同关键信息', type: 'api_call', enabled: true, config: { name: '合同解析', url: 'https://api.example.com/contract/parse', method: 'POST', headers: [{ key: 'Content-Type', value: 'application/json' }], bodyType: 'json', body: '{"contract": "{{input.content}}"}', timeout: 30000, retryCount: 1, successField: 'code==200', outputKey: 'contractInfo' } },
            { id: 'step-2', name: '风险条款审查', type: 'ai_process', enabled: true, config: { name: 'gpt-4', url: '', method: 'POST', headers: [], bodyType: 'json', body: '对提取的合同条款进行风险审查，识别不公平条款、法律风险和合规问题', timeout: 30000, retryCount: 0, successField: '', outputKey: '' } },
            { id: 'step-3', name: '生成审查报告', type: 'api_call', enabled: true, config: { name: '报告生成', url: 'https://api.example.com/report/generate', method: 'POST', headers: [{ key: 'Content-Type', value: 'application/json' }], bodyType: 'json', body: '{"review": "{{aiResult}}", "contract": "{{contractInfo}}"}', timeout: 30000, retryCount: 0, successField: 'code==200', outputKey: 'report' } }
          ]
        }
      },
      {
        id: 'builtin-approval',
        name: '智能审批助手',
        description: 'AI智能路由分发审批任务，多维度合规风险预检，历史审批数据关联分析，审批意见智能辅助生成',
        type: 'flow',
        status: 'online',
        icon: 'DocumentCopy',
        category: '流程管理',
        prompt: '你是一个专业的审批助手...',
        model: 'gpt-4',
        tags: ['审批', '风险分析', '智能路由', '合规'],
        isBuiltin: true,
        usageCount: 3621,
        createTime: '2026-03-15 09:00:00',
        updateTime: now,
        routePath: '/approval/1'
      },
      {
        id: 'builtin-audit',
        name: 'AI审核助手',
        description: '基于大模型的智能审核引擎，支持合同/报销/采购等多场景审核，风险评估自动分级，审核报告一键生成',
        type: 'data',
        status: 'online',
        icon: 'MagicStick',
        category: '审核管理',
        prompt: '你是一个专业的AI审核助手...',
        model: 'gpt-4',
        tags: ['审核', 'AI审核', '风险评估', '报告生成'],
        isBuiltin: true,
        usageCount: 4108,
        createTime: '2026-03-15 09:00:00',
        updateTime: now,
        routePath: '/ai-audit/1'
      }
    ]
    res.json(success([...builtin, ...customAgents]))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const all = await getLocalAgents()
    const agent = all.find(a => String(a.id) === id)
    if (agent) {
      res.json(success(agent))
    } else {
      res.json(fail('智能体不存在', 404))
    }
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.post('/create', async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newAgent = {
      id: 'custom-' + Date.now(),
      ...req.body,
      status: 'online',
      isBuiltin: false,
      usageCount: 0,
      createTime: now,
      updateTime: now
    }
    customAgents.push(newAgent)
    res.json(success(newAgent, '智能体创建成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const idx = customAgents.findIndex(a => String(a.id) === id)
    if (idx === -1) {
      res.json(fail('智能体不存在', 404))
      return
    }
    customAgents[idx] = {
      ...customAgents[idx],
      ...req.body,
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
    res.json(success(customAgents[idx], '更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    customAgents = customAgents.filter(a => String(a.id) !== id)
    res.json(success(null, '删除成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const agent = customAgents.find(a => String(a.id) === id)
    if (!agent) {
      res.json(fail('智能体不存在', 404))
      return
    }
    agent.status = agent.status === 'online' ? 'offline' : 'online'
    res.json(success(agent, `已${agent.status === 'online' ? '启用' : '禁用'}`))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

async function getLocalAgents(): Promise<any[]> {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  return [
    {
      id: 'builtin-expense',
      name: '智能报销助手',
      type: 'flow',
      status: 'online',
      icon: 'Wallet',
      category: '财务管理',
      isBuiltin: true,
      usageCount: 2847,
      createTime: '2026-03-15 09:00:00',
      updateTime: now,
      routePath: '/expense'
    },
    {
      id: 'builtin-contract',
      name: '智能合同助手',
      type: 'flow',
      status: 'online',
      icon: 'Files',
      category: '合同管理',
      isBuiltin: true,
      usageCount: 1532,
      createTime: '2026-03-15 09:00:00',
      updateTime: now,
      routePath: '/contract'
    },
    ...customAgents
  ]
}

export default router

// 连接器管理服务 - 内存Mock数据实现

// 连接器类型枚举: rest_api / database / message_queue / file_transfer / esb / rpa
// 连接器状态枚举: running / stopped / error

// ==================== 统一目标系统列表（唯一数据源） ====================
// 待办中心"来源系统"、智能广场"发起系统"、数据智能问答"数据源系统"、连接器"目标系统"均引用此列表

const targetSystems: any[] = [
  { id: 1, code: 'oa', name: 'OA审批系统', description: '企业OA办公审批平台', status: 'running', connectorId: 5 },
  { id: 2, code: 'erp', name: 'ERP系统', description: '企业资源计划综合平台', status: 'running', connectorId: 1 },
  { id: 3, code: 'crm', name: 'CRM系统', description: '客户关系管理系统', status: 'running', connectorId: 2 },
  { id: 4, code: 'finance', name: '财务系统', description: '财务报销与预算管理', status: 'running', connectorId: 3 },
  { id: 5, code: 'contract', name: '合同管理系统', description: '合同全生命周期管理', status: 'stopped', connectorId: 6 },
  { id: 6, code: 'purchase', name: '采购管理系统', description: '采购申请与供应商管理', status: 'running', connectorId: 8 },
  { id: 7, code: 'project', name: '项目管理系统', description: '项目立项与进度管控', status: 'running', connectorId: 7 },
  { id: 8, code: 'asset', name: '资产管理系统', description: '资产登记与变动管理', status: 'running', connectorId: 4 }
]

// ==================== Mock 数据 ====================

const mockConnectors: any[] = [
  {
    id: 1,
    name: 'ERP系统对接',
    type: 'rest_api',
    targetType: 'ERP系统',
    config: {
      host: 'erp.jinmailang.com',
      port: 8443,
      protocol: 'https',
      basePath: '/api/v1',
      username: 'erp_user',
      password: '******',
      authType: 'bearer',
      timeout: 30000,
      retryTimes: 3
    },
    status: 'running',
    syncCount: 1286,
    lastSyncTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    createdAt: '2026-04-10T08:30:00.000Z',
    updatedAt: '2026-07-05T09:20:00.000Z'
  },
  {
    id: 2,
    name: 'CRM系统对接',
    type: 'rest_api',
    targetType: 'CRM系统',
    config: {
      host: 'crm.jinmailang.com',
      port: 443,
      protocol: 'https',
      basePath: '/openapi',
      username: 'crm_api',
      password: '******',
      authType: 'apiKey',
      apiKey: 'ak_******',
      timeout: 15000,
      retryTimes: 2
    },
    status: 'running',
    syncCount: 856,
    lastSyncTime: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    createdAt: '2026-04-15T10:00:00.000Z',
    updatedAt: '2026-07-04T16:45:00.000Z'
  },
  {
    id: 3,
    name: 'MySQL-财务库',
    type: 'database',
    targetType: '财务系统',
    config: {
      host: '10.20.30.11',
      port: 3306,
      database: 'finance_db',
      username: 'fin_reader',
      password: '******',
      charset: 'utf8mb4',
      poolSize: 10,
      timeout: 30000
    },
    status: 'running',
    syncCount: 4520,
    lastSyncTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    createdAt: '2026-03-20T09:00:00.000Z',
    updatedAt: '2026-07-05T08:10:00.000Z'
  },
  {
    id: 4,
    name: 'Oracle-资产库',
    type: 'database',
    targetType: '资产管理系统',
    config: {
      host: '10.20.30.21',
      port: 1521,
      database: 'ORCL',
      serviceName: 'hrsvc',
      username: 'hr_readonly',
      password: '******',
      poolSize: 5,
      timeout: 60000
    },
    status: 'error',
    syncCount: 632,
    lastSyncTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-04-01T14:00:00.000Z',
    updatedAt: '2026-07-05T06:30:00.000Z'
  },
  {
    id: 5,
    name: 'RabbitMQ-OA审批通知',
    type: 'message_queue',
    targetType: 'OA审批系统',
    config: {
      host: 'mq.jinmailang.com',
      port: 5672,
      virtualHost: '/approval',
      username: 'approval_mq',
      password: '******',
      queueName: 'approval_notify_queue',
      exchange: 'approval_exchange',
      routingKey: 'notify.#'
    },
    status: 'running',
    syncCount: 8420,
    lastSyncTime: new Date(Date.now() - 30 * 1000).toISOString(),
    createdAt: '2026-02-18T11:00:00.000Z',
    updatedAt: '2026-07-05T09:25:00.000Z'
  },
  {
    id: 6,
    name: 'SFTP-合同归档',
    type: 'file_transfer',
    targetType: '合同管理系统',
    config: {
      host: 'sftp.jinmailang.com',
      port: 22,
      username: 'sftp_archive',
      password: '******',
      remotePath: '/archive/contracts',
      localPath: '/data/contracts',
      filePattern: '*.pdf',
      schedule: '0 2 * * *'
    },
    status: 'stopped',
    syncCount: 326,
    lastSyncTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-05-05T08:00:00.000Z',
    updatedAt: '2026-07-03T18:00:00.000Z'
  },
  {
    id: 7,
    name: 'WebService-项目系统',
    type: 'esb',
    targetType: '项目管理系统',
    config: {
      wsdlUrl: 'http://oa.jinmailang.com/services/OaService?wsdl',
      namespace: 'http://oa.jinmailang.com',
      username: 'oa_esb',
      password: '******',
      method: 'syncWorkflow',
      timeout: 45000
    },
    status: 'running',
    syncCount: 1543,
    lastSyncTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    createdAt: '2026-03-10T09:30:00.000Z',
    updatedAt: '2026-07-05T09:10:00.000Z'
  },
  {
    id: 8,
    name: 'RPA-采购对账机器人',
    type: 'rpa',
    targetType: '采购管理系统',
    config: {
      robotName: 'MES_Sync_Robot',
      robotIp: '10.20.40.55',
      username: 'rpa_admin',
      password: '******',
      processName: 'MES_Production_Sync',
      schedule: '*/30 * * * *',
      timeout: 120000
    },
    status: 'running',
    syncCount: 2240,
    lastSyncTime: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    createdAt: '2026-04-22T13:00:00.000Z',
    updatedAt: '2026-07-05T09:28:00.000Z'
  }
]

const mockTemplates: any[] = [
  {
    id: 'tpl_001',
    name: 'OA审批接口模板',
    type: 'rest_api',
    targetType: 'OA审批系统',
    description: 'OA审批系统标准对接模板，支持报销、请假、出差等流程同步',
    configTemplate: {
      host: '',
      port: 8080,
      protocol: 'http',
      basePath: '/u8cloud/api',
      username: '',
      password: '',
      authType: 'basic',
      timeout: 30000,
      retryTimes: 3
    },
    icon: 'icon-yonyou'
  },
  {
    id: 'tpl_002',
    name: 'ERP订单接口模板',
    type: 'rest_api',
    targetType: 'ERP系统',
    description: 'ERP系统标准对接模板，支持采购、销售、库存等单据同步',
    configTemplate: {
      host: '',
      port: 8090,
      protocol: 'http',
      basePath: '/k3cloud/api',
      username: '',
      password: '',
      authType: 'session',
      timeout: 30000,
      retryTimes: 3
    },
    icon: 'icon-kingdee'
  },
  {
    id: 'tpl_003',
    name: 'CRM客户接口模板',
    type: 'rest_api',
    targetType: 'CRM系统',
    description: 'CRM系统标准对接模板，支持客户、商机、合同同步',
    configTemplate: {
      host: '',
      port: 443,
      protocol: 'https',
      basePath: '/sap/opu/odata',
      username: '',
      password: '',
      authType: 'basic',
      client: '800',
      timeout: 60000,
      retryTimes: 3
    },
    icon: 'icon-sap'
  },
  {
    id: 'tpl_004',
    name: '财务数据库模板',
    type: 'database',
    targetType: '财务系统',
    description: '财务系统数据库通用连接模板，支持MySQL/Oracle/PostgreSQL',
    configTemplate: {
      host: '',
      port: 3306,
      database: '',
      username: '',
      password: '',
      charset: 'utf8mb4',
      poolSize: 10,
      timeout: 30000
    },
    icon: 'icon-mysql'
  },
  {
    id: 'tpl_005',
    name: '资产数据库模板',
    type: 'database',
    targetType: '资产管理系统',
    description: '资产管理系统数据库通用连接模板，支持主流数据库版本',
    configTemplate: {
      host: '',
      port: 1521,
      database: '',
      serviceName: '',
      username: '',
      password: '',
      poolSize: 5,
      timeout: 60000
    },
    icon: 'icon-oracle'
  },
  {
    id: 'tpl_006',
    name: '采购消息队列模板',
    type: 'message_queue',
    targetType: '采购管理系统',
    description: '采购管理系统消息队列通用对接模板，支持RabbitMQ/Kafka',
    configTemplate: {
      brokers: '',
      topic: '',
      groupId: '',
      saslMechanism: 'PLAIN',
      username: '',
      password: '',
      ssl: true
    },
    icon: 'icon-kafka'
  },
  {
    id: 'tpl_007',
    name: '合同文件传输模板',
    type: 'file_transfer',
    targetType: '合同管理系统',
    description: '合同管理系统文件传输通用对接模板，支持SFTP/FTP',
    configTemplate: {
      host: '',
      port: 22,
      username: '',
      password: '',
      remotePath: '',
      localPath: '',
      filePattern: '*',
      schedule: '0 2 * * *'
    },
    icon: 'icon-sftp'
  },
  {
    id: 'tpl_008',
    name: '项目ESB服务模板',
    type: 'esb',
    targetType: '项目管理系统',
    description: '项目管理系统ESB服务通用对接模板，支持WSDL/REST',
    configTemplate: {
      host: '',
      port: 443,
      protocol: 'https',
      basePath: '/sap/opu/odata',
      username: '',
      password: '',
      authType: 'basic',
      client: '800',
      timeout: 60000,
      retryTimes: 3
    },
    icon: 'icon-sap'
  }
]

// 生成最近10条同步记录
function generateSyncRecords(connectorId: number): any[] {
  const statuses = ['success', 'success', 'success', 'success', 'failed']
  const records: any[] = []
  const now = Date.now()
  for (let i = 0; i < 10; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const records_count = Math.floor(Math.random() * 200) + 50
    const duration = Math.floor(Math.random() * 3000) + 500
    records.push({
      time: new Date(now - i * 30 * 60 * 1000).toISOString(),
      status,
      records: status === 'failed' ? 0 : records_count,
      duration,
      message: status === 'failed' ? '连接超时，已自动重试' : '同步成功'
    })
  }
  return records
}

// ==================== 服务实现 ====================

export const connectorService = {
  // ---------- 统一目标系统列表 ----------

  // 获取目标系统列表（全量）
  async getTargetSystems(): Promise<any[]> {
    return targetSystems
  },

  // ---------- 连接器 CRUD ----------

  // 获取连接器列表（支持分页和类型筛选）
  async getConnectors(query: any = {}): Promise<any> {
    const page = parseInt(query.page || '1', 10)
    const pageSize = parseInt(query.pageSize || '10', 10)
    const { type, status, targetType } = query

    let list = [...mockConnectors]
    if (type) {
      list = list.filter((c) => c.type === type)
    }
    if (status) {
      list = list.filter((c) => c.status === status)
    }
    if (targetType) {
      list = list.filter((c) => c.targetType === targetType)
    }

    const total = list.length
    const start = (page - 1) * pageSize
    const paged = list.slice(start, start + pageSize)

    return { list: paged, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  },

  // 获取单个连接器详情
  async getConnectorById(id: number): Promise<any> {
    return mockConnectors.find((c) => c.id === id) || null
  },

  // 创建连接器
  async createConnector(data: any): Promise<any> {
    const newId = mockConnectors.length > 0 ? Math.max(...mockConnectors.map((c) => c.id)) + 1 : 1
    const now = new Date().toISOString()
    const newConnector = {
      id: newId,
      name: data.name,
      type: data.type,
      targetType: data.targetType || '',
      config: data.config || {},
      status: 'stopped',
      syncCount: 0,
      lastSyncTime: null,
      createdAt: now,
      updatedAt: now
    }
    mockConnectors.push(newConnector)
    return newConnector
  },

  // 更新连接器
  async updateConnector(id: number, data: any): Promise<any> {
    const connector = mockConnectors.find((c) => c.id === id)
    if (!connector) throw new Error('连接器不存在')

    const fields = ['name', 'type', 'targetType', 'config', 'status']
    for (const f of fields) {
      if (data[f] !== undefined) {
        connector[f] = data[f]
      }
    }
    connector.updatedAt = new Date().toISOString()
    return connector
  },

  // 删除连接器
  async deleteConnector(id: number): Promise<boolean> {
    const idx = mockConnectors.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('连接器不存在')
    mockConnectors.splice(idx, 1)
    return true
  },

  // 启用/停用连接器
  async toggleConnector(id: number, action: string): Promise<any> {
    const connector = mockConnectors.find((c) => c.id === id)
    if (!connector) throw new Error('连接器不存在')

    if (action === 'start') {
      connector.status = 'running'
    } else if (action === 'stop') {
      connector.status = 'stopped'
    } else {
      throw new Error('action 参数无效，应为 start 或 stop')
    }
    connector.updatedAt = new Date().toISOString()
    return connector
  },

  // ---------- 连接器模板库 ----------

  // 获取模板列表
  async getTemplates(): Promise<any[]> {
    return mockTemplates
  },

  // 获取单个模板
  async getTemplateById(id: string): Promise<any> {
    return mockTemplates.find((t) => t.id === id) || null
  },

  // ---------- 连接器监控 ----------

  // 监控概览
  async getMonitorOverview(): Promise<any> {
    const total = mockConnectors.length
    const runningCount = mockConnectors.filter((c) => c.status === 'running').length
    const stoppedCount = mockConnectors.filter((c) => c.status === 'stopped').length
    const errorCount = mockConnectors.filter((c) => c.status === 'error').length
    const totalSyncCount = mockConnectors.reduce((s, c) => s + c.syncCount, 0)

    // 今日同步次数（mock：总量的20%左右）
    const todaySyncCount = Math.floor(totalSyncCount * 0.18)

    // 平均延迟（ms）
    const avgLatency = 320

    return {
      totalConnectors: total,
      runningCount,
      stoppedCount,
      errorCount,
      totalSyncCount,
      todaySyncCount,
      avgLatency
    }
  },

  // 单个连接器监控详情
  async getMonitorDetail(id: number): Promise<any> {
    const connector = mockConnectors.find((c) => c.id === id)
    if (!connector) throw new Error('连接器不存在')

    // 错误次数（mock）
    const errorCount = Math.floor(connector.syncCount * 0.02)
    // 延迟（ms）
    const latency = Math.floor(Math.random() * 400) + 100

    return {
      id: connector.id,
      name: connector.name,
      type: connector.type,
      targetType: connector.targetType,
      status: connector.status,
      syncCount: connector.syncCount,
      errorCount,
      lastSyncTime: connector.lastSyncTime,
      latency,
      syncRecords: generateSyncRecords(connector.id)
    }
  },

  // 同步趋势（15天）
  async getSyncTrend(days: number = 15): Promise<any> {
    const trend: any[] = []
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * dayMs)
      const total = Math.floor(Math.random() * 800) + 1200
      const success = Math.floor(total * (0.9 + Math.random() * 0.08))
      const failed = total - success
      trend.push({
        date: date.toISOString().slice(0, 10),
        totalSync: total,
        successCount: success,
        failedCount: failed,
        avgLatency: Math.floor(Math.random() * 200) + 200
      })
    }
    return { days, trend }
  },

  // ---------- 连接器测试 ----------

  // 测试已保存的连接器
  async testConnector(id: number): Promise<any> {
    const connector = mockConnectors.find((c) => c.id === id)
    if (!connector) throw new Error('连接器不存在')

    // 根据状态模拟测试结果
    const isError = connector.status === 'error'
    const latency = isError ? 0 : Math.floor(Math.random() * 300) + 80

    return {
      success: !isError,
      latency,
      message: isError
        ? `连接失败：${connector.targetType} 服务不可达，请检查网络或认证信息`
        : `${connector.name}（${connector.targetType}）连接正常，响应时间 ${latency}ms`
    }
  },

  // 测试未保存的配置
  async testConnection(config: any): Promise<any> {
    if (!config || !config.host) {
      return {
        success: false,
        latency: 0,
        message: '配置无效：host 不能为空'
      }
    }

    // 模拟测试过程
    const latency = Math.floor(Math.random() * 400) + 80
    const success = Math.random() > 0.15

    return {
      success,
      latency,
      message: success
        ? `连接成功，目标服务 ${config.host}:${config.port || ''} 响应正常`
        : `连接失败：无法访问 ${config.host}:${config.port || ''}，请检查地址与端口`
    }
  }
}

export default connectorService

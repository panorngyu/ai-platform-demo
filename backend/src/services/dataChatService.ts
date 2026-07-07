// 数据智能问答服务 - 内存Mock数据实现
// 用户自然语言提问 → AI理解 → 生成SQL/API → 通过连接器执行 → AI总结分析 → 返回答案+图表

import { connectorService } from './connectorService.js'

// ==================== 类型定义 ====================

interface ChartConfig {
  type: 'bar' | 'line' | 'pie'
  title: string
  xAxis?: string[]
  series?: any[]
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  // assistant 消息额外字段
  understanding?: string
  sql?: string
  connectorName?: string
  autoMatched?: boolean  // 是否AI自动匹配的数据源
  data?: any[]
  columns?: string[]
  summary?: string
  chart?: ChartConfig
}

interface ChatSession {
  id: number
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// ==================== Mock 数据 ====================

// 全局消息ID自增
let messageAutoId = 1000

// 预置会话：1. 采购部报销分析 - 2轮对话
// 预置会话：2. 合同审批统计 - 1轮对话
const mockSessions: ChatSession[] = [
  {
    id: 1,
    title: '采购部报销分析',
    createdAt: '2026-07-05T08:30:00.000Z',
    updatedAt: '2026-07-05T09:10:00.000Z',
    messages: [
      {
        id: 1,
        role: 'user',
        content: '查询采购部今年报销总额',
        timestamp: '2026-07-05T08:30:30.000Z'
      },
      {
        id: 2,
        role: 'assistant',
        content:
          '采购部2026年累计报销总额为 1,286,450 元，其中差旅费占比最高（38.5%），建议关注差旅预算执行情况。',
        timestamp: '2026-07-05T08:30:45.000Z',
        understanding: '您想查询采购部本年度（2026年）的报销总额，并按费用类型进行分析。',
        sql: "SELECT fee_type, SUM(amount) AS total FROM expense_reports WHERE department='采购部' AND YEAR(create_time)=2026 GROUP BY fee_type ORDER BY total DESC",
        connectorName: 'MySQL-财务库',
        data: [
          { fee_type: '差旅费', total: 495280, count: 86 },
          { fee_type: '办公费', total: 312400, count: 142 },
          { fee_type: '业务招待费', total: 234600, count: 54 },
          { fee_type: '交通费', total: 158900, count: 98 },
          { fee_type: '通讯费', total: 85270, count: 36 }
        ],
        columns: ['费用类型', '金额(元)', '笔数'],
        summary:
          '采购部2026年累计报销总额为 1,286,450 元，共 416 笔报销。其中差旅费占比最高（38.5%），达 495,280 元；其次为办公费（24.3%）和业务招待费（18.2%）。建议关注差旅费预算执行情况，对比去年同期增长 12.5%。',
        chart: {
          type: 'bar',
          title: '采购部各费用类型报销金额',
          xAxis: ['差旅费', '办公费', '业务招待费', '交通费', '通讯费'],
          series: [
            {
              name: '报销金额(元)',
              type: 'bar',
              data: [495280, 312400, 234600, 158900, 85270],
              itemStyle: { color: '#5470c6' }
            }
          ]
        }
      },
      {
        id: 3,
        role: 'user',
        content: '查看差旅费的明细记录',
        timestamp: '2026-07-05T09:09:50.000Z'
      },
      {
        id: 4,
        role: 'assistant',
        content:
          '已为您查询到采购部差旅费明细共 86 条记录，总金额 495,280 元，人均差旅支出 5,759 元，最高单笔 12,800 元（上海出差）。',
        timestamp: '2026-07-05T09:10:00.000Z',
        understanding: '您希望查看采购部差旅费的具体明细记录，用于核实费用合理性。',
        sql: "SELECT applicant, destination, start_date, end_date, amount, remark FROM expense_reports WHERE department='采购部' AND fee_type='差旅费' AND YEAR(create_time)=2026 ORDER BY amount DESC LIMIT 10",
        connectorName: 'MySQL-财务库',
        data: [
          {
            applicant: '张伟',
            destination: '上海',
            start_date: '2026-06-12',
            end_date: '2026-06-15',
            amount: 12800,
            remark: '客户拜访+合同洽谈'
          },
          {
            applicant: '李娜',
            destination: '广州',
            start_date: '2026-06-08',
            end_date: '2026-06-10',
            amount: 9650,
            remark: '供应商考察'
          },
          {
            applicant: '王强',
            destination: '北京',
            start_date: '2026-05-22',
            end_date: '2026-05-24',
            amount: 8200,
            remark: '总部述职'
          },
          {
            applicant: '赵敏',
            destination: '成都',
            start_date: '2026-05-15',
            end_date: '2026-05-18',
            amount: 7380,
            remark: '区域市场调研'
          },
          {
            applicant: '张伟',
            destination: '深圳',
            start_date: '2026-04-26',
            end_date: '2026-04-28',
            amount: 6920,
            remark: '客户回访'
          }
        ],
        columns: ['申请人', '目的地', '开始日期', '结束日期', '金额(元)', '备注'],
        summary:
          '已查询到采购部差旅费明细共 86 条记录，总金额 495,280 元。展示金额前 5 的记录，其中张伟上海出差单笔 12,800 元为最高，主要用于客户拜访与合同洽谈。整体差旅支出集中在华东、华南区域，建议优化差旅审批流程。',
        chart: {
          type: 'bar',
          title: '差旅费TOP5明细对比',
          xAxis: ['张伟-上海', '李娜-广州', '王强-北京', '赵敏-成都', '张伟-深圳'],
          series: [
            {
              name: '金额(元)',
              type: 'bar',
              data: [12800, 9650, 8200, 7380, 6920],
              itemStyle: { color: '#91cc75' }
            }
          ]
        }
      }
    ]
  },
  {
    id: 2,
    title: '合同审批统计',
    createdAt: '2026-07-05T10:00:00.000Z',
    updatedAt: '2026-07-05T10:15:00.000Z',
    messages: [
      {
        id: 5,
        role: 'user',
        content: '统计本月合同数量分布情况',
        timestamp: '2026-07-05T10:00:20.000Z'
      },
      {
        id: 6,
        role: 'assistant',
        content:
          '2026年7月共归档合同 128 份，采购合同占比最高（42.2%），其次为销售合同（31.3%），整体合同结构合理。',
        timestamp: '2026-07-05T10:00:40.000Z',
        understanding: '您希望统计本月（2026年7月）各类型合同的数量分布情况。',
        sql: "SELECT contract_type, COUNT(*) AS count FROM contracts WHERE MONTH(sign_date)=7 AND YEAR(sign_date)=2026 GROUP BY contract_type",
        connectorName: 'ERP系统对接',
        data: [
          { contract_type: '采购合同', count: 54, total_amount: 23580000 },
          { contract_type: '销售合同', count: 40, total_amount: 38650000 },
          { contract_type: '服务合同', count: 18, total_amount: 4320000 },
          { contract_type: '租赁合同', count: 9, total_amount: 1280000 },
          { contract_type: '其他合同', count: 7, total_amount: 860000 }
        ],
        columns: ['合同类型', '数量(份)', '总金额(元)'],
        summary:
          '2026年7月共归档合同 128 份，总金额 6,870 万元。采购合同数量最多（54份，占比 42.2%），但销售合同金额最高（3,865 万元），表明本月销售回款情况良好。建议关注采购合同的履约进度。',
        chart: {
          type: 'pie',
          title: '本月合同类型数量分布',
          series: [
            {
              name: '合同数量',
              type: 'pie',
              radius: ['40%', '70%'],
              data: [
                { value: 54, name: '采购合同' },
                { value: 40, name: '销售合同' },
                { value: 18, name: '服务合同' },
                { value: 9, name: '租赁合同' },
                { value: 7, name: '其他合同' }
              ]
            }
          ]
        }
      }
    ]
  }
]

// 会话ID自增
let sessionAutoId = 100

// ==================== 辅助函数 ====================

// 生成新消息ID
function nextMessageId(): number {
  return ++messageAutoId
}

// 生成新会话ID
function nextSessionId(): number {
  return ++sessionAutoId
}

// 自动匹配数据源：根据问题内容分析最合适的连接器
function autoMatchConnector(question: string): { id: number, name: string, type: string, targetType: string } | null {
  const q = question.toLowerCase()

  // 关键词 → 连接器映射规则（按匹配优先级排列）
  const rules: { keywords: string[], connectorId: number, connectorName: string, type: string, targetType: string }[] = [
    // 财务/报销/预算/费用 → MySQL-财务库
    { keywords: ['报销', '费用', '预算', '发票', '付款', '财务', '金额', '成本', '支出'], connectorId: 3, connectorName: 'MySQL-财务库', type: 'database', targetType: 'MySQL' },
    // 合同/签约 → ERP系统对接
    { keywords: ['合同', '签约', '履约', '条款'], connectorId: 1, connectorName: 'ERP系统对接', type: 'rest_api', targetType: 'ERP' },
    // 采购/供应商/订单 → ERP系统对接
    { keywords: ['采购', '供应商', '订单', '物料', '入库'], connectorId: 1, connectorName: 'ERP系统对接', type: 'rest_api', targetType: 'ERP' },
    // 客户/销售/营收 → CRM系统对接
    { keywords: ['客户', '销售', '营收', '订单', '渠道'], connectorId: 2, connectorName: 'CRM系统对接', type: 'rest_api', targetType: 'CRM' },
    // 待办/审批/流程 → WebService-OA系统
    { keywords: ['待办', '审批', '流程', '工单', '任务'], connectorId: 7, connectorName: 'WebService-OA系统', type: 'esb', targetType: 'OA' },
    // 员工/人事/考勤/组织 → Oracle-HR库
    { keywords: ['员工', '人事', '考勤', '组织', '部门', '人员', '绩效'], connectorId: 4, connectorName: 'Oracle-HR库', type: 'database', targetType: 'Oracle' },
    // 生产/制造/排产/质量 → RPA-MES系统
    { keywords: ['生产', '制造', '排产', '质量', '工序', '产线'], connectorId: 8, connectorName: 'RPA-MES系统', type: 'rpa', targetType: 'MES' },
  ]

  // 遍历规则，找到第一个匹配的
  for (const rule of rules) {
    if (rule.keywords.some(kw => q.includes(kw))) {
      return { id: rule.connectorId, name: rule.connectorName, type: rule.type, targetType: rule.targetType }
    }
  }

  // 默认返回MySQL-财务库
  return { id: 3, name: 'MySQL-财务库', type: 'database', targetType: 'MySQL' }
}

// 判断问题类型
type QuestionType =
  | 'expense_total'
  | 'contract_count'
  | 'todo_count'
  | 'approval_efficiency'
  | 'budget'
  | 'purchase'
  | 'generic'

function detectQuestionType(question: string): QuestionType {
  const q = question.toLowerCase()
  if ((q.includes('报销')) && (q.includes('总额') || q.includes('金额') || q.includes('总') || q.includes('合计'))) {
    return 'expense_total'
  }
  if (q.includes('合同') && (q.includes('数量') || q.includes('统计') || q.includes('分布') || q.includes('count'))) {
    return 'contract_count'
  }
  if (q.includes('待办') && (q.includes('数量') || q.includes('统计') || q.includes('趋势') || q.includes('count'))) {
    return 'todo_count'
  }
  if (q.includes('审批') && (q.includes('效率') || q.includes('时间') || q.includes('时长') || q.includes('耗时'))) {
    return 'approval_efficiency'
  }
  if (q.includes('预算')) {
    return 'budget'
  }
  if (q.includes('采购')) {
    return 'purchase'
  }
  return 'generic'
}

// 根据问题类型生成Mock问答结果
function generateAnswer(question: string, connectorId?: number, autoConnector?: { id: number, name: string, type: string, targetType: string } | null): Omit<ChatMessage, 'id' | 'role' | 'content' | 'timestamp'> {
  const type = detectQuestionType(question)

  // 选择连接器：优先手动指定 > 自动匹配 > 默认
  let connectorName = 'MySQL-财务库'
  let autoMatched = false

  if (connectorId) {
    // 手动指定的连接器
    const connectorMap: Record<number, string> = {
      1: 'ERP系统对接',
      2: 'CRM系统对接',
      3: 'MySQL-财务库',
      4: 'Oracle-HR库',
      5: 'RabbitMQ-审批通知',
      6: 'SFTP-合同归档',
      7: 'WebService-OA系统',
      8: 'RPA-MES系统'
    }
    connectorName = connectorMap[connectorId] || 'MySQL-财务库'
  } else if (autoConnector) {
    // AI自动匹配的连接器
    connectorName = autoConnector.name
    autoMatched = true
  }

  // 将 autoMatched 信息附加到返回对象
  const baseResult: any = { connectorName, autoMatched }

  switch (type) {
    case 'expense_total':
      return {
        ...baseResult,
        understanding: '您想查询各部门的报销总额情况，并分析各费用类型的占比。',
        sql: "SELECT department, fee_type, SUM(amount) AS total FROM expense_reports WHERE YEAR(create_time)=2026 GROUP BY department, fee_type ORDER BY department, total DESC",
        data: [
          { department: '采购部', total: 1286450, count: 416 },
          { department: '销售部', total: 985200, count: 358 },
          { department: '市场部', total: 762300, count: 287 },
          { department: '研发部', total: 654800, count: 245 },
          { department: '行政部', total: 423600, count: 198 },
          { department: '财务部', total: 312400, count: 156 }
        ],
        columns: ['部门', '报销总额(元)', '报销笔数'],
        summary:
          '2026年累计报销总额 4,424,750 元，共 1,660 笔。采购部报销金额最高（128.6万元，占比 29.1%），其次为销售部（22.3%）和市场部（17.2%）。建议采购部加强差旅费管控，销售部关注业务招待费占比。',
        chart: {
          type: 'bar',
          title: '各部门报销总额对比',
          xAxis: ['采购部', '销售部', '市场部', '研发部', '行政部', '财务部'],
          series: [
            {
              name: '报销总额(元)',
              type: 'bar',
              data: [1286450, 985200, 762300, 654800, 423600, 312400],
              itemStyle: { color: '#5470c6' }
            },
            {
              name: '报销笔数',
              type: 'line',
              yAxisIndex: 1,
              data: [416, 358, 287, 245, 198, 156],
              itemStyle: { color: '#ee6666' }
            }
          ]
        }
      }

    case 'contract_count':
      return {
        ...baseResult,
        understanding: '您希望统计合同的数量分布情况，按合同类型进行分析。',
        sql: "SELECT contract_type, COUNT(*) AS count, SUM(amount) AS total_amount FROM contracts WHERE YEAR(sign_date)=2026 GROUP BY contract_type ORDER BY count DESC",
        data: [
          { contract_type: '采购合同', count: 312, total_amount: 128560000 },
          { contract_type: '销售合同', count: 245, total_amount: 234780000 },
          { contract_type: '服务合同', count: 98, total_amount: 23560000 },
          { contract_type: '租赁合同', count: 56, total_amount: 7820000 },
          { contract_type: '其他合同', count: 34, total_amount: 4350000 }
        ],
        columns: ['合同类型', '数量(份)', '总金额(元)'],
        summary:
          '2026年累计签订合同 745 份，总金额 3.99 亿元。采购合同数量最多（312份，占比 41.9%），但销售合同金额最高（2.35 亿元，占比 58.9%）。合同结构整体合理，建议关注采购合同的履约监控。',
        chart: {
          type: 'pie',
          title: '合同类型数量分布',
          series: [
            {
              name: '合同数量',
              type: 'pie',
              radius: ['40%', '70%'],
              data: [
                { value: 312, name: '采购合同' },
                { value: 245, name: '销售合同' },
                { value: 98, name: '服务合同' },
                { value: 56, name: '租赁合同' },
                { value: 34, name: '其他合同' }
              ]
            }
          ]
        }
      }

    case 'todo_count':
      return {
        ...baseResult,
        understanding: '您想查看近期待办任务的数量变化趋势，掌握工作积压情况。',
        sql: "SELECT DATE(create_time) AS date, COUNT(*) AS count, SUM(CASE WHEN priority='高' THEN 1 ELSE 0 END) AS high_priority FROM todos WHERE status='pending' AND create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(create_time) ORDER BY date",
        data: [
          { date: '2026-06-30', count: 28, high_priority: 5 },
          { date: '2026-07-01', count: 35, high_priority: 8 },
          { date: '2026-07-02', count: 42, high_priority: 6 },
          { date: '2026-07-03', count: 31, high_priority: 4 },
          { date: '2026-07-04', count: 38, high_priority: 7 },
          { date: '2026-07-05', count: 45, high_priority: 9 },
          { date: '2026-07-06', count: 52, high_priority: 11 }
        ],
        columns: ['日期', '待办数量', '高优先级'],
        summary:
          '近 7 天待办任务共 271 件，日均 38.7 件，整体呈上升趋势。今日（7月6日）待办 52 件，其中高优先级 11 件，建议优先处理。高优先级任务集中在合同审批和报销审核环节。',
        chart: {
          type: 'line',
          title: '近7天待办任务数量趋势',
          xAxis: ['06-30', '07-01', '07-02', '07-03', '07-04', '07-05', '07-06'],
          series: [
            {
              name: '待办总数',
              type: 'line',
              smooth: true,
              data: [28, 35, 42, 31, 38, 45, 52],
              itemStyle: { color: '#5470c6' },
              areaStyle: { opacity: 0.3 }
            },
            {
              name: '高优先级',
              type: 'line',
              smooth: true,
              data: [5, 8, 6, 4, 7, 9, 11],
              itemStyle: { color: '#ee6666' },
              areaStyle: { opacity: 0.3 }
            }
          ]
        }
      }

    case 'approval_efficiency':
      return {
        ...baseResult,
        understanding: '您希望分析各环节的审批效率，识别审批瓶颈。',
        sql: "SELECT node_name, AVG(duration_minutes) AS avg_duration, MAX(duration_minutes) AS max_duration, COUNT(*) AS count FROM approval_logs WHERE YEAR(complete_time)=2026 GROUP BY node_name ORDER BY avg_duration DESC",
        data: [
          { node_name: '部门经理审批', avg_duration: 320, max_duration: 1440, count: 386 },
          { node_name: '财务复核', avg_duration: 245, max_duration: 960, count: 342 },
          { node_name: '总监审批', avg_duration: 198, max_duration: 720, count: 218 },
          { node_name: '总经理审批', avg_duration: 156, max_duration: 480, count: 96 },
          { node_name: '出纳付款', avg_duration: 88, max_duration: 240, count: 287 }
        ],
        columns: ['审批环节', '平均时长(分钟)', '最长时长(分钟)', '审批数'],
        summary:
          '2026年审批整体平均时长 161 分钟。部门经理审批环节耗时最长（平均 320 分钟），最长曾达 24 小时，是主要审批瓶颈。建议优化部门经理审批流程，引入移动端审批提醒，预计可缩短 40% 审批时长。',
        chart: {
          type: 'bar',
          title: '各审批环节平均耗时对比',
          xAxis: ['部门经理审批', '财务复核', '总监审批', '总经理审批', '出纳付款'],
          series: [
            {
              name: '平均时长(分钟)',
              type: 'bar',
              data: [320, 245, 198, 156, 88],
              itemStyle: { color: '#fac858' }
            },
            {
              name: '最长时长(分钟)',
              type: 'bar',
              data: [1440, 960, 720, 480, 240],
              itemStyle: { color: '#ee6666' }
            }
          ]
        }
      }

    case 'budget':
      return {
        ...baseResult,
        understanding: '您想了解各部门预算执行情况，分析预算使用率。',
        sql: "SELECT department, budget_amount, used_amount, (used_amount/budget_amount*100) AS usage_rate FROM budget_execution WHERE YEAR=2026 ORDER BY usage_rate DESC",
        data: [
          { department: '市场部', budget_amount: 5000000, used_amount: 4286000, usage_rate: 85.7 },
          { department: '采购部', budget_amount: 8000000, used_amount: 6432000, usage_rate: 80.4 },
          { department: '销售部', budget_amount: 6500000, used_amount: 4972000, usage_rate: 76.5 },
          { department: '研发部', budget_amount: 4500000, used_amount: 3127000, usage_rate: 69.5 },
          { department: '行政部', budget_amount: 3000000, used_amount: 1864000, usage_rate: 62.1 },
          { department: '财务���', budget_amount: 2500000, used_amount: 1342000, usage_rate: 53.7 }
        ],
        columns: ['部门', '预算金额(元)', '已使用(元)', '使用率(%)'],
        summary:
          '2026年总预算 2950 万元，已执行 21.02 万元，整体执行率 71.3%。市场部执行率最高（85.7%），需警惕超支风险；财务部执行率最低（53.7%），进度偏慢。建议市场部加强预算管控，财务部加快项目推进。',
        chart: {
          type: 'bar',
          title: '各部门预算执行率',
          xAxis: ['市场部', '采购部', '销售部', '研发部', '行政部', '财务部'],
          series: [
            {
              name: '预算执行率(%)',
              type: 'bar',
              data: [85.7, 80.4, 76.5, 69.5, 62.1, 53.7],
              itemStyle: {
                color: function (params: any) {
                  const val = params.value
                  return val > 80 ? '#ee6666' : val > 70 ? '#fac858' : '#91cc75'
                }
              },
              markLine: {
                data: [{ yAxis: 80, name: '预警线' }]
              }
            }
          ]
        }
      }

    case 'purchase':
      return {
        ...baseResult,
        understanding: '您希望查询采购相关的统计数据，包括采购金额、供应商分布等。',
        sql: "SELECT supplier_name, COUNT(*) AS order_count, SUM(amount) AS total_amount FROM purchase_orders WHERE YEAR(order_date)=2026 GROUP BY supplier_name ORDER BY total_amount DESC LIMIT 10",
        data: [
          { supplier_name: '中粮集团有限公司', order_count: 28, total_amount: 15680000 },
          { supplier_name: '益海嘉里食品公司', order_count: 24, total_amount: 12350000 },
          { supplier_name: '北京华联供应商', order_count: 35, total_amount: 8960000 },
          { supplier_name: '河北麦源农业公司', order_count: 18, total_amount: 6720000 },
          { supplier_name: '山东鲁花集团', order_count: 15, total_amount: 5430000 },
          { supplier_name: '上海包装材料公司', order_count: 42, total_amount: 4280000 }
        ],
        columns: ['供应商', '订单数', '采购金额(元)'],
        summary:
          '2026年TOP6供应商采购金额合计 5342 万元，占总采购额的 68.5%。中粮集团为最大供应商（1568万元，占比 20.1%），建议关注供应商集中度风险，可适度引入备选供应商。',
        chart: {
          type: 'bar',
          title: 'TOP6供应商采购金额',
          xAxis: ['中粮集团', '益海嘉里', '北京华联', '河北麦源', '山东鲁花', '上海包装'],
          series: [
            {
              name: '采购金额(万元)',
              type: 'bar',
              data: [1568, 1235, 896, 672, 543, 428],
              itemStyle: { color: '#73c0de' }
            }
          ]
        }
      }

    default:
      return {
        ...baseResult,
        understanding: `我理解您的问题：「${question}」。我将基于业务数据进行分析，由于该问题较为开放，我先为您汇总关键业务指标。`,
        sql: `-- AI 根据问题生成的查询语句\nSELECT '业务概览' AS metric, COUNT(*) AS value FROM business_summary WHERE create_date = CURDATE()`,
        data: [
          { metric: '本月报销总额', value: '442.5万元', trend: '+8.3%' },
          { metric: '本月合同数', value: '128份', trend: '+12.5%' },
          { metric: '待办任务', value: '52件', trend: '+15.6%' },
          { metric: '平均审批时长', value: '161分钟', trend: '-12.4%' },
          { metric: '预算执行率', value: '71.3%', trend: '+5.2%' }
        ],
        columns: ['指标', '数值', '环比变化'],
        summary:
          '已为您汇总当前业务关键指标：本月报销总额 442.5 万元（环比+8.3%），合同签订 128 份（环比+12.5%），待办任务 52 件（环比+15.6%），平均审批时长 161 分钟（环比-12.4%），预算执行率 71.3%（环比+5.2%）。整体业务运行平稳，建议关注待办积压情况。如需深入了解某项指标，请进一步提问。',
        chart: {
          type: 'bar',
          title: '本月业务关键指标概览',
          xAxis: ['报销总额', '合同数', '待办任务', '审批时长', '预算执行率'],
          series: [
            {
              name: '指标值(归一化)',
              type: 'bar',
              data: [75, 68, 85, 42, 71],
              itemStyle: { color: '#5470c6' }
            }
          ]
        }
      }
  }
}

// ==================== 服务实现 ====================

export const dataChatService = {
  // ---------- 会话管理 ----------

  // 获取所有会话列表（不含消息体，仅元信息）
  async getSessions(): Promise<any[]> {
    return mockSessions.map((s) => ({
      id: s.id,
      title: s.title,
      messageCount: s.messages.length,
      lastMessage: s.messages.length > 0 ? s.messages[s.messages.length - 1].content.substring(0, 80) : '',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }))
  },

  // 获取会话详情（含完整消息列表）
  async getSessionById(id: number): Promise<ChatSession | null> {
    return mockSessions.find((s) => s.id === id) || null
  },

  // 创建会话
  async createSession(title: string): Promise<ChatSession> {
    const now = new Date().toISOString()
    const newSession: ChatSession = {
      id: nextSessionId(),
      title: title || `新对话-${new Date().toLocaleString('zh-CN')}`,
      messages: [],
      createdAt: now,
      updatedAt: now
    }
    mockSessions.unshift(newSession)
    return newSession
  },

  // 删除会话
  async deleteSession(id: number): Promise<boolean> {
    const idx = mockSessions.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('会话不存在')
    mockSessions.splice(idx, 1)
    return true
  },

  // ---------- 核心问答 ----------

  // 提问：自然语言 → AI理解 → 自动匹配数据源 → 生成SQL → 执行查询 → 总结分析 → 返回答案
  async ask(sessionId: number, question: string, connectorId?: number): Promise<ChatMessage> {
    const session = mockSessions.find((s) => s.id === sessionId)
    if (!session) {
      throw new Error('会话不存在')
    }
    if (!question || !question.trim()) {
      throw new Error('问题不能为空')
    }

    const now = new Date().toISOString()

    // 步骤1：保存用户消息
    const userMessage: ChatMessage = {
      id: nextMessageId(),
      role: 'user',
      content: question.trim(),
      timestamp: now
    }
    session.messages.push(userMessage)
    session.updatedAt = now

    // 步骤2：自动匹配数据源（如果用户未手动指定连接器）
    let autoConnector: { id: number, name: string, type: string, targetType: string } | null = null
    if (!connectorId) {
      autoConnector = autoMatchConnector(question)
    }

    // 步骤3：模拟AI分析流程（理解→生成SQL→执行查询→分析总结）
    const answerPayload = generateAnswer(question, connectorId, autoConnector)

    // 步骤4：构造AI回复消息
    const assistantMessage: ChatMessage = {
      id: nextMessageId(),
      role: 'assistant',
      content: answerPayload.summary || '已为您完成数据分析。',
      timestamp: new Date().toISOString(),
      ...answerPayload
    }

    // 步骤5：保存AI回复到会话
    session.messages.push(assistantMessage)
    session.updatedAt = assistantMessage.timestamp

    return assistantMessage
  },

  // ---------- 连接器选择 ----------

  // 获取可用于问答的连接器列表（status=running）
  async getAvailableConnectors(): Promise<any[]> {
    const result = await connectorService.getConnectors({ status: 'running', pageSize: '100' })
    return result.list.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      targetType: c.targetType
    }))
  }
}

export default dataChatService

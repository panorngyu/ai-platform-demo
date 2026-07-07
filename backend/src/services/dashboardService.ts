// 驾驶舱服务（全部返回 Mock 数据，字段与前端匹配）

export const dashboardService = {
  // 大屏概览
  async getOverview(): Promise<any> {
    return {
      totalApprovals: 12683,
      passRate: 94.6,
      backlog: 237,
      timeoutRate: 2.3,
      trends: { total: 8.5, passRate: 1.2, backlog: -15, timeoutRate: -0.5 },
      aiProcessed: 8456,
      aiProcessingRate: 66.7,
      // 额外统计
      todaySubmitted: 186,
      todayApproved: 152,
      todayRejected: 8,
      avgProcessTime: 4.5,
      avgProcessTimeTrend: -12.4,
      monthlyApproved: 3286,
      monthlyRejected: 178,
      monthlyPending: 237,
      // 待办类型分布（用于饼图）
      todoTypeDistribution: [
        { name: '费用报销', value: 4250 },
        { name: '合同审批', value: 3580 },
        { name: '采购审批', value: 2180 },
        { name: '项目审批', value: 1560 },
        { name: '资产审批', value: 1113 }
      ],
      // 部门待办分布
      departmentDistribution: [
        { department: '销售部', count: 52, total: 2850 },
        { department: '采购部', count: 48, total: 2360 },
        { department: '财务部', count: 35, total: 2180 },
        { department: '生产部', count: 30, total: 1980 },
        { department: '信息中心', count: 22, total: 1520 },
        { department: '人力资源', count: 18, total: 1240 },
        { department: '法务部', count: 15, total: 980 },
        { department: '行政部', count: 12, total: 623 }
      ],
      // AI辅助统计
      aiStats: {
        totalAssisted: 8456,
        summaryGenerated: 5230,
        riskAnalyzed: 2180,
        opinionGenerated: 1046,
        accuracyRate: 94.2,
        tokenConsumed: 56265,
        avgResponseTime: 1.8
      },
      // 合规统计
      complianceStats: {
        totalChecked: 12683,
        blocked: 684,
        blockRate: 5.4,
        riskHigh: 128,
        riskMedium: 356,
        riskLow: 200
      },
      // 预算执行
      budgetExecution: {
        totalBudget: 29500000,
        usedAmount: 21020000,
        usageRate: 71.3,
        departments: [
          { department: '市场部', budget: 5000000, used: 4286000, rate: 85.7 },
          { department: '采购部', budget: 8000000, used: 6432000, rate: 80.4 },
          { department: '销售部', budget: 6500000, used: 4972000, rate: 76.5 },
          { department: '研发部', budget: 4500000, used: 3127000, rate: 69.5 },
          { department: '行政部', budget: 3000000, used: 1864000, rate: 62.1 },
          { department: '财务部', budget: 2500000, used: 1342000, rate: 53.7 }
        ]
      },
      // 15天审批趋势
      trend15Days: Array.from({ length: 15 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (14 - i))
        const base = 350 + Math.sin(i / 3) * 50
        return {
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          submitted: Math.floor(base + Math.random() * 80),
          approved: Math.floor(base * 0.92 + Math.random() * 60),
          rejected: Math.floor(Math.random() * 12 + 3),
          aiProcessed: Math.floor(base * 0.65 + Math.random() * 30)
        }
      })
    }
  },

  // 效率分析
  async getEfficiencyAnalysis(): Promise<any> {
    const days = 15
    const trend = Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      const base = 350 + Math.sin(i / 3) * 50
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        value: Math.floor(base + Math.random() * 80),
        passed: Math.floor(base * 0.92 + Math.random() * 60)
      }
    })

    return {
      trend,
      typeDistribution: [
        { name: '费用报销', value: 4250 },
        { name: '合同审批', value: 3580 },
        { name: '采购审批', value: 2180 },
        { name: '项目审批', value: 1560 },
        { name: '资产审批', value: 1113 }
      ],
      departmentRank: [
        { name: '销售部', value: 2850, avgHours: 4.2 },
        { name: '采购部', value: 2360, avgHours: 5.8 },
        { name: '财务部', value: 2180, avgHours: 3.6 },
        { name: '生产部', value: 1980, avgHours: 6.2 },
        { name: '信息中心', value: 1520, avgHours: 2.8 },
        { name: '人力资源', value: 1240, avgHours: 4.5 },
        { name: '法务部', value: 980, avgHours: 5.1 },
        { name: '行政部', value: 623, avgHours: 3.2 }
      ],
      efficiency: { avgProcessTime: 4.5, aiRate: 66.7, passRate: 94.6 },
      // 额外数据
      processTimeCompare: {
        aiAssisted: { avg: 4.5, median: 3.2, p90: 8.5 },
        traditional: { avg: 12.8, median: 10.2, p90: 24.5 },
        improvement: 64.8
      },
      stageEfficiency: [
        { stage: '提交', avgTime: 0.3, aiAssisted: false },
        { stage: 'AI预审', avgTime: 0.8, aiAssisted: true, aiTime: 0.8 },
        { stage: '初审', avgTime: 1.5, aiAssisted: true, aiTime: 0.6 },
        { stage: '复核', avgTime: 2.0, aiAssisted: true, aiTime: 1.2 },
        { stage: '终审', avgTime: 1.8, aiAssisted: true, aiTime: 0.9 },
        { stage: '归档', avgTime: 0.3, aiAssisted: false }
      ],
      monthlyTrend: [
        { month: '2026-02', avgHours: 8.2, aiRate: 45.2, count: 2856 },
        { month: '2026-03', avgHours: 7.5, aiRate: 52.8, count: 3120 },
        { month: '2026-04', avgHours: 6.8, aiRate: 58.6, count: 3285 },
        { month: '2026-05', avgHours: 5.9, aiRate: 62.3, count: 3402 },
        { month: '2026-06', avgHours: 5.2, aiRate: 65.1, count: 3568 },
        { month: '2026-07', avgHours: 4.5, aiRate: 66.7, count: 3286 }
      ]
    }
  },

  // 异常预警
  async getAlerts(): Promise<any> {
    const now = Date.now()
    const alerts = [
      {
        id: 1,
        level: 'high',
        title: '审批超时告警',
        content: '采购部有 12 笔采购审批已超时 48 小时，涉及金额 386 万元，请立即处理',
        source: '审批监控系统',
        time: new Date(now).toLocaleString('zh-CN'),
        status: '未处理'
      },
      {
        id: 2,
        level: 'high',
        title: '大额合同风险预警',
        content: '与中粮集团签订的采购合同金额 580 万，AI识别存在 3 项高风险条款（违约金过低/付款周期过长/无知识产权条款）',
        source: 'AI风控引擎',
        time: new Date(now - 3600000).toLocaleString('zh-CN'),
        status: '未处理'
      },
      {
        id: 3,
        level: 'high',
        title: '数据库连接池告警',
        content: 'MySQL连接池使用率达到 98%（49/50），可能影响系统响应速度',
        source: '系统监控',
        time: new Date(now - 7200000).toLocaleString('zh-CN'),
        status: '处理中'
      },
      {
        id: 4,
        level: 'medium',
        title: '预算使用率告警',
        content: '市场部 7 月预算使用率已达 85.7%（预算 500 万 / 已用 428.6 万），接近预警线',
        source: '预算管理系统',
        time: new Date(now - 10800000).toLocaleString('zh-CN'),
        status: '未处理'
      },
      {
        id: 5,
        level: 'medium',
        title: '审批效率下降',
        content: '采购部平均审批时长环比上升 23%（5.8h→7.1h），建议优化审批流程',
        source: '效能分析系统',
        time: new Date(now - 14400000).toLocaleString('zh-CN'),
        status: '处理中'
      },
      {
        id: 6,
        level: 'medium',
        title: 'AI审核准确率波动',
        content: '合同审查AI模型近7天准确率 91.2%，低于阈值 93%，建议检查Prompt模板',
        source: 'AI监控服务',
        time: new Date(now - 18000000).toLocaleString('zh-CN'),
        status: '未处理'
      },
      {
        id: 7,
        level: 'low',
        title: '报销单金额异常',
        content: '王采购提交的 58000 元餐费报销单笔金额偏高（部门月均餐费 12000 元），建议人工复核',
        source: 'AI风控引擎',
        time: new Date(now - 21600000).toLocaleString('zh-CN'),
        status: '未处理'
      },
      {
        id: 8,
        level: 'low',
        title: '连接器同步延迟',
        content: 'OA系统连接器同步延迟 15 分钟（正常 < 5 分钟），可能影响待办实时性',
        source: '连接器监控',
        time: new Date(now - 25200000).toLocaleString('zh-CN'),
        status: '已解决'
      },
      {
        id: 9,
        level: 'low',
        title: '系统维护通知',
        content: 'AI审核服务将于本周日 02:00-04:00 进行版本升级，预计影响 2 小时',
        source: '系统通知',
        time: new Date(now - 86400000).toLocaleString('zh-CN'),
        status: '已发布'
      }
    ]

    return {
      alerts,
      stats: {
        total: alerts.length,
        high: alerts.filter(a => a.level === 'high').length,
        medium: alerts.filter(a => a.level === 'medium').length,
        low: alerts.filter(a => a.level === 'low').length,
        resolved: alerts.filter(a => a.status === '已解决' || a.status === '已发布').length,
        pending: alerts.filter(a => a.status === '未处理' || a.status === '处理中').length
      }
    }
  }
}

export default dashboardService

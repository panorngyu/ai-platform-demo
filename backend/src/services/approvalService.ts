import { Todo, ApprovalRecord, dbConnected } from '../models/index.js'
import { aiService } from './aiService.js'

// 审批意见模板
const opinionTemplates = [
  { id: 1, category: 'approve', content: '同意。材料齐全，符合审批要求。' },
  { id: 2, category: 'approve', content: '同意。金额合理，预算充足。' },
  { id: 3, category: 'approve', content: '同意。已核实，符合公司规定。' },
  { id: 4, category: 'reject', content: '不予通过。缺少必要附件，请补充后重提。' },
  { id: 5, category: 'reject', content: '不予通过。金额超出预算，请调整后重提。' },
  { id: 6, category: 'return', content: '退回修改。请补充详细说明。' },
  { id: 7, category: 'transfer', content: '转交相关部门处理。' }
]

// ============ Mock 审批详情数据 ============
function getMockApprovalDetail(todoId: number): any {
  const mockDetails: Record<number, any> = {
    1: {
      todoId: 1,
      title: '关于2026年Q3营销费用报销审批',
      type: 'expense',
      typeName: '报销',
      status: 'pending',
      statusName: '待审批',
      applicant: '王采购',
      department: '采购部',
      submitTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '王采购提交的Q3营销费用报销申请，金额58,000元，涉及市场推广活动及渠道维护费用',
      currentStep: '部门主管审批',
      currentNode: '采购部主管',
      fields: [
        { label: '报销类型', value: '差旅及营销费用' },
        { label: '报销金额', value: '¥58,000.00' },
        { label: '申请人', value: '王采购' },
        { label: '所属部门', value: '采购部' },
        { label: '申请日期', value: new Date(Date.now() - 24 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 10) },
        { label: '费用明细', value: '市场推广活动费用 ¥32,000 + 渠道维护差旅费 ¥26,000' },
        { label: '预算归属', value: '2026年Q3采购部营销预算' },
        { label: '预算余额', value: '¥142,000（预算总额¥200,000）' },
        { label: '紧急程度', value: '紧急' },
        { label: '来源系统', value: '财务系统' }
      ],
      attachments: [
        { name: 'Q3营销费用明细表.xlsx', url: '/files/expense-detail.xlsx', size: 24576, type: 'xlsx' },
        { name: '市场推广活动发票.pdf', url: '/files/marketing-invoice.pdf', size: 156800, type: 'pdf' },
        { name: '差旅报销凭证.jpg', url: '/files/travel-voucher.jpg', size: 89120, type: 'jpg' }
      ]
    },
    2: {
      todoId: 2,
      title: '原材料采购合同审批（供应商：河北某粮油）',
      type: 'contract',
      typeName: '合同',
      status: 'pending',
      statusName: '待审批',
      applicant: '王采购',
      department: '采购部',
      submitTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '王采购提交的原材料采购合同审批，供应商河北某粮油，合同金额1,280,000元，已超过截止日期',
      currentStep: '法务审核',
      currentNode: '法务部主管',
      fields: [
        { label: '合同类型', value: '原材料采购合同' },
        { label: '合同金额', value: '¥1,280,000.00' },
        { label: '供应商', value: '河北某粮油有限公司' },
        { label: '申请人', value: '王采购' },
        { label: '所属部门', value: '采购部' },
        { label: '合同期限', value: '2026年7月1日 - 2026年12月31日' },
        { label: '付款方式', value: '预付30% + 验收后70%' },
        { label: '交付条款', value: '分三批次交付，每批次45天内完成' },
        { label: '紧急程度', value: '紧急（已逾期）' },
        { label: '来源系统', value: '合同系统' }
      ],
      attachments: [
        { name: '采购合同草案.pdf', url: '/files/contract-draft.pdf', size: 312400, type: 'pdf' },
        { name: '供应商资质文件.pdf', url: '/files/supplier-qualification.pdf', size: 198600, type: 'pdf' },
        { name: '比价记录.xlsx', url: '/files/price-comparison.xlsx', size: 15360, type: 'xlsx' }
      ]
    },
    3: {
      todoId: 3,
      title: '华北区渠道拓展项目立项',
      type: 'project',
      typeName: '项目',
      status: 'pending',
      statusName: '待审批',
      applicant: '李法务',
      department: '法务部',
      submitTime: new Date(Date.now() - 6 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '李法务提交的华北区渠道拓展项目立项申请，项目预算350,000元，涉及华北区域新增渠道合作方拓展',
      currentStep: '项目委员会评审',
      currentNode: '项目委员会主席',
      fields: [
        { label: '项目名称', value: '华北区渠道拓展项目' },
        { label: '项目预算', value: '¥350,000.00' },
        { label: '项目负责人', value: '李法务' },
        { label: '所属部门', value: '法务部' },
        { label: '项目周期', value: '2026年7月 - 2026年12月（6个月）' },
        { label: '目标区域', value: '华北区（北京、天津、河北、山东）' },
        { label: '预期收益', value: '新增渠道合作方15家，预计年增收¥2,800,000' },
        { label: '里程碑', value: 'Q3完成5家签约 / Q4完成10家签约 / 年末复盘' },
        { label: '紧急程度', value: '一般' },
        { label: '来源系统', value: '项目系统' }
      ],
      attachments: [
        { name: '项目立项申请书.pdf', url: '/files/project-application.pdf', size: 256000, type: 'pdf' },
        { name: '市场调研报告.pdf', url: '/files/market-research.pdf', size: 420000, type: 'pdf' }
      ]
    },
    4: {
      todoId: 4,
      title: '办公设备采购申请',
      type: 'purchase',
      typeName: '采购',
      status: 'pending',
      statusName: '待审批',
      applicant: '张财务',
      department: '财务部',
      submitTime: new Date(Date.now() - 72 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '张财务提交的办公设备采购申请，金额36,000元，包含笔记本电脑及办公桌椅更新',
      currentStep: '部门主管审批',
      currentNode: '财务部主管',
      fields: [
        { label: '采购类型', value: '办公设备采购' },
        { label: '采购金额', value: '¥36,000.00' },
        { label: '申请人', value: '张财务' },
        { label: '所属部门', value: '财务部' },
        { label: '采购清单', value: '笔记本电脑5台 ¥25,000 + 办公桌椅3套 ¥11,000' },
        { label: '供应商', value: '联想官方授权经销商' },
        { label: '预计交付', value: '下单后7个工作日内' },
        { label: '预算归属', value: '2026年度IT设备更新预算' },
        { label: '紧急程度', value: '低' },
        { label: '来源系统', value: '采购系统' }
      ],
      attachments: [
        { name: '设备采购清单.pdf', url: '/files/equipment-list.pdf', size: 86400, type: 'pdf' },
        { name: '供应商报价单.pdf', url: '/files/supplier-quote.pdf', size: 43200, type: 'pdf' }
      ]
    },
    5: {
      todoId: 5,
      title: '年度服务器扩容预算审批',
      type: 'asset',
      typeName: '资产',
      status: 'pending',
      statusName: '待审批',
      applicant: '赵运维',
      department: 'IT部',
      submitTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '赵运维提交的服务器扩容预算审批，金额860,000元，用于年度服务器集群扩容及存储升级',
      currentStep: 'IT总监审批',
      currentNode: 'IT总监',
      fields: [
        { label: '资产类型', value: '服务器及存储设备' },
        { label: '预算金额', value: '¥860,000.00' },
        { label: '申请人', value: '赵运维' },
        { label: '所属部门', value: 'IT部' },
        { label: '扩容方案', value: '新增4台高性能服务器 + 2TB存储扩容' },
        { label: '现有负载', value: 'CPU平均利用率82%，存储使用率91%' },
        { label: '预期效果', value: 'CPU利用率降至60%以下，存储余量提升至40%' },
        { label: '实施周期', value: '采购30天 + 部署15天' },
        { label: '紧急程度', value: '紧急' },
        { label: '来源系统', value: '资产系统' }
      ],
      attachments: [
        { name: '服务器扩容方案.pdf', url: '/files/server-plan.pdf', size: 356000, type: 'pdf' },
        { name: '负载监控报告.xlsx', url: '/files/load-report.xlsx', size: 28672, type: 'xlsx' }
      ]
    },
    6: {
      todoId: 6,
      title: '新员工办公用品领用申请',
      type: 'purchase',
      typeName: '采购',
      status: 'pending',
      statusName: '待审批',
      applicant: '孙人事',
      department: '人力资源部',
      submitTime: new Date(Date.now() - 96 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '孙人事提交的新员工办公用品领用申请，金额1,200元，为3名新入职员工配置基础办公用品',
      currentStep: '行政部审批',
      currentNode: '行政部主管',
      fields: [
        { label: '申请类型', value: '办公用品领用' },
        { label: '申请金额', value: '¥1,200.00' },
        { label: '申请人', value: '孙人事' },
        { label: '所属部门', value: '人力资源部' },
        { label: '领用人数', value: '3名新入职员工' },
        { label: '物品清单', value: '办公文具套装3套 + 文件夹3套 + 笔记本3本' },
        { label: '新员工姓名', value: '刘开发、钱设计、韩测试' },
        { label: '入职日期', value: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10) },
        { label: '紧急程度', value: '低' },
        { label: '来源系统', value: '采购系统' }
      ],
      attachments: [
        { name: '新员工入职清单.pdf', url: '/files/new-employee-list.pdf', size: 43200, type: 'pdf' }
      ]
    },
    7: {
      todoId: 7,
      title: '客户年度框架协议续签',
      type: 'contract',
      typeName: '合同',
      status: 'processing',
      statusName: '处理中',
      applicant: '周销售',
      department: '销售部',
      submitTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '周销售提交的客户年度框架协议续签审批，合同金额5,200,000元，涉及3家核心客户的年度合作协议续签',
      currentStep: '总经理审批',
      currentNode: '总经理',
      fields: [
        { label: '合同类型', value: '年度框架服务协议' },
        { label: '合同金额', value: '¥5,200,000.00' },
        { label: '申请人', value: '周销售' },
        { label: '所属部门', value: '销售部' },
        { label: '涉及客户', value: 'A集团、B科技、C贸易（3家核心客户）' },
        { label: '协议期限', value: '2026年8月1日 - 2027年7月31日' },
        { label: '服务内容', value: '全年IT运维服务 + 季度巡检 + 应急响应保障' },
        { label: '付款安排', value: '季度付款，每季度¥1,300,000' },
        { label: '紧急程度', value: '紧急' },
        { label: '来源系统', value: '合同系统' }
      ],
      attachments: [
        { name: '框架协议续签草案.pdf', url: '/files/framework-renewal.pdf', size: 486000, type: 'pdf' },
        { name: '历史合作评估报告.pdf', url: '/files/cooperation-evaluation.pdf', size: 320000, type: 'pdf' },
        { name: '客户满意度调查.xlsx', url: '/files/satisfaction-survey.xlsx', size: 35840, type: 'xlsx' }
      ]
    },
    8: {
      todoId: 8,
      title: '华东区季度差旅报销汇总',
      type: 'expense',
      typeName: '报销',
      status: 'pending',
      statusName: '待审批',
      applicant: '吴市场',
      department: '市场部',
      submitTime: new Date(Date.now() - 18 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '吴市场提交的华东区季度差旅报销汇总，金额42,000元，包含Q2华东区客户拜访及市场调研差旅费用',
      currentStep: '部门主管审批',
      currentNode: '市场部主管',
      fields: [
        { label: '报销类型', value: '差旅费用报销' },
        { label: '报销金额', value: '¥42,000.00' },
        { label: '申请人', value: '吴市场' },
        { label: '所属部门', value: '市场部' },
        { label: '差旅区域', value: '华东区（上海、杭州、南京、苏州）' },
        { label: '出差日期', value: '2026年4月15日 - 2026年6月20日' },
        { label: '费用明细', value: '交通费¥18,000 + 住宿费¥16,000 + 餐饮费¥8,000' },
        { label: '出差次数', value: '5次，累计出差天数32天' },
        { label: '紧急程度', value: '一般' },
        { label: '来源系统', value: '财务系统' }
      ],
      attachments: [
        { name: '差旅报销明细.xlsx', url: '/files/travel-detail.xlsx', size: 30720, type: 'xlsx' },
        { name: '出差审批单.pdf', url: '/files/travel-approval.pdf', size: 86400, type: 'pdf' },
        { name: '交通票据汇总.pdf', url: '/files/transport-receipts.pdf', size: 224000, type: 'pdf' }
      ]
    },
    9: {
      todoId: 9,
      title: '研发中心实验室装修立项',
      type: 'project',
      typeName: '项目',
      status: 'pending',
      statusName: '待审批',
      applicant: '郑研发',
      department: '研发部',
      submitTime: new Date(Date.now() - 120 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '郑研发提交的研发中心实验室装修立项申请，项目预算680,000元，涉及实验室安全改造及设备安装区域规划',
      currentStep: '项目委员会评审',
      currentNode: '项目委员会主席',
      fields: [
        { label: '项目名称', value: '研发中心实验室装修项目' },
        { label: '项目预算', value: '¥680,000.00' },
        { label: '项目负责人', value: '郑研发' },
        { label: '所属部门', value: '研发部' },
        { label: '项目周期', value: '2026年8月 - 2026年11月（4个月）' },
        { label: '装修范围', value: '3号实验室整修 + 新设备区规划 + 安全设施升级' },
        { label: '重点事项', value: '防爆电路改造、通风系统升级、消防设施更新' },
        { label: '验收标准', value: '符合国家实验室安全标准GB/T 27406' },
        { label: '紧急程度', value: '低' },
        { label: '来源系统', value: '项目系统' }
      ],
      attachments: [
        { name: '实验室装修方案.pdf', url: '/files/lab-renovation-plan.pdf', size: 512000, type: 'pdf' },
        { name: '安全标准对照表.xlsx', url: '/files/safety-standard.xlsx', size: 20480, type: 'xlsx' }
      ]
    },
    10: {
      todoId: 10,
      title: '核心供应商付款申请（已逾期）',
      type: 'expense',
      typeName: '报销',
      status: 'pending',
      statusName: '待审批',
      applicant: '冯采购',
      department: '采购部',
      submitTime: new Date(Date.now() - 60 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '冯采购提交的核心供应商付款申请，金额2,300,000元，已逾期8小时，涉及关键原材料供应商紧急付款',
      currentStep: '财务总监审批',
      currentNode: '财务总监',
      fields: [
        { label: '付款类型', value: '供应商紧急付款' },
        { label: '付款金额', value: '¥2,300,000.00' },
        { label: '申请人', value: '冯采购' },
        { label: '所属部门', value: '采购部' },
        { label: '供应商', value: '深圳核心材料科技有限公司' },
        { label: '逾期状态', value: '已逾期8小时（截止日期已过）' },
        { label: '合同编号', value: 'PO-2026-0892' },
        { label: '付款原因', value: '原材料紧急到货付款，逾期将影响生产计划' },
        { label: '紧急程度', value: '紧急（已逾期）' },
        { label: '来源系统', value: '财务系统' }
      ],
      attachments: [
        { name: '付款申请单.pdf', url: '/files/payment-application.pdf', size: 128000, type: 'pdf' },
        { name: '采购合同.pdf', url: '/files/purchase-contract.pdf', size: 356000, type: 'pdf' },
        { name: '到货确认书.pdf', url: '/files/delivery-confirmation.pdf', size: 64000, type: 'pdf' }
      ]
    },
    11: {
      todoId: 11,
      title: '知识产权代理服务合同审批',
      type: 'contract',
      typeName: '合同',
      status: 'approved',
      statusName: '已通过',
      applicant: '李法务',
      department: '法务部',
      submitTime: new Date(Date.now() - 36 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '李法务提交的知识产权代理服务合同审批，合同金额150,000元，涉及专利申请及商标注册代理服务',
      currentStep: '已完成',
      currentNode: '',
      fields: [
        { label: '合同类型', value: '知识产权代理服务合同' },
        { label: '合同金额', value: '¥150,000.00' },
        { label: '申请人', value: '李法务' },
        { label: '所属部门', value: '法务部' },
        { label: '服务方', value: '北京知产代理有限公司' },
        { label: '服务内容', value: '10项专利申请代理 + 5项商标注册代理' },
        { label: '合同期限', value: '2026年7月1日 - 2027年6月30日' },
        { label: '付款方式', value: '签约付50% + 完成付50%' },
        { label: '紧急程度', value: '一般' },
        { label: '来源系统', value: '合同系统' }
      ],
      attachments: [
        { name: '知识产权代理合同.pdf', url: '/files/ip-agent-contract.pdf', size: 198000, type: 'pdf' },
        { name: '代理公司资质.pdf', url: '/files/agent-qualification.pdf', size: 86400, type: 'pdf' }
      ]
    },
    12: {
      todoId: 12,
      title: '中秋礼盒采购方案',
      type: 'purchase',
      typeName: '采购',
      status: 'rejected',
      statusName: '已驳回',
      applicant: '陈行政',
      department: '行政部',
      submitTime: new Date(Date.now() - 168 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      summary: '陈行政提交的中秋礼盒采购方案，金额28,000元，已被驳回（预算超出及供应商资质不合规）',
      currentStep: '已驳回',
      currentNode: '',
      fields: [
        { label: '采购类型', value: '节日礼品采购' },
        { label: '采购金额', value: '¥28,000.00' },
        { label: '申请人', value: '陈行政' },
        { label: '所属部门', value: '行政部' },
        { label: '采购内容', value: '中秋礼盒200份（¥140/份）' },
        { label: '供应商', value: '某礼品定制公司' },
        { label: '驳回原因', value: '1.金额超出节日礼品预算上限；2.供应商缺少食品经营许可证' },
        { label: '预算上限', value: '¥20,000（年度节日礼品预算）' },
        { label: '紧急程度', value: '低' },
        { label: '来源系统', value: '采购系统' }
      ],
      attachments: [
        { name: '礼盒采购方案.pdf', url: '/files/gift-plan.pdf', size: 64000, type: 'pdf' },
        { name: '供应商报价.pdf', url: '/files/gift-quote.pdf', size: 32000, type: 'pdf' }
      ]
    }
  }

  return mockDetails[todoId] || null
}

// ============ Mock 审批历史数据 ============
function getMockApprovalHistory(todoId: number): any[] {
  const now = Date.now()
  const baseHistories: Record<number, any[]> = {
    1: [
      { id: 'h1-1', nodeName: '提交申请', operator: '王采购', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 24 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '提交Q3营销费用报销申请，请主管审批' }
    ],
    2: [
      { id: 'h2-1', nodeName: '提交申请', operator: '王采购', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '提交原材料采购合同审批，合同金额128万' },
      { id: 'h2-2', nodeName: '采购部主管审核', operator: '张主任', operatorRole: '采购部主管', action: 'approve', actionName: '同意', time: new Date(now - 36 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '同意。供应商资质齐全，价格合理。' }
    ],
    3: [
      { id: 'h3-1', nodeName: '提交申请', operator: '李法务', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 6 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '提交华北区渠道拓展项目立项申请' }
    ],
    4: [
      { id: 'h4-1', nodeName: '提交申请', operator: '张财务', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 72 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '提交办公设备采购申请，需更新部门设备' }
    ],
    7: [
      { id: 'h7-1', nodeName: '提交申请', operator: '周销售', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 12 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '提交3家核心客户年度框架协议续签' },
      { id: 'h7-2', nodeName: '销售部总监审核', operator: '钱总监', operatorRole: '销售总监', action: 'approve', actionName: '同意', time: new Date(now - 8 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '同意。3家客户均为核心客户，续签优先级高。' },
      { id: 'h7-3', nodeName: '法务审核', operator: '李法务', operatorRole: '法务主管', action: 'approve', actionName: '同意', time: new Date(now - 4 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '同意。合同条款合规，建议增加违约条款细化。' }
    ],
    10: [
      { id: 'h10-1', nodeName: '提交申请', operator: '冯采购', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 60 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '紧急付款申请，已逾期，请尽快审批' },
      { id: 'h10-2', nodeName: '采购部主管审核', operator: '张主任', operatorRole: '采购部主管', action: 'approve', actionName: '同意', time: new Date(now - 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '同意。供应商为核心合作伙伴，付款不可延迟。' }
    ],
    11: [
      { id: 'h11-1', nodeName: '提交申请', operator: '李法务', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 36 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '提交知识产权代理服务合同' },
      { id: 'h11-2', nodeName: '法务部主管审核', operator: '赵主管', operatorRole: '法务主管', action: 'approve', actionName: '同意', time: new Date(now - 24 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '同意。代理公司资质合规，服务内容明确。' },
      { id: 'h11-3', nodeName: '总经理审批', operator: '陈总经理', operatorRole: '总经理', action: 'approve', actionName: '同意', time: new Date(now - 12 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '同意。金额合理，已审批通过。' }
    ],
    12: [
      { id: 'h12-1', nodeName: '提交申请', operator: '陈行政', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 168 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '提交中秋礼盒采购方案' },
      { id: 'h12-2', nodeName: '行政部主管审核', operator: '吴主管', operatorRole: '行政主管', action: 'reject', actionName: '驳回', time: new Date(now - 144 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '驳回。1.金额超出预算上限¥20,000；2.供应商缺少食品经营许可证。请调整后重提。' }
    ]
  }

  return baseHistories[todoId] || [
    { id: `h${todoId}-1`, nodeName: '提交申请', operator: '系统', operatorRole: '申请人', action: 'submit', actionName: '提交', time: new Date(now - 24 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), status: 'completed', opinion: '提交审批申请' }
  ]
}

export const approvalService = {
  // 获取审批详情
  async getApprovalDetail(todoId: number): Promise<any> {
    if (dbConnected) {
      const todo = await Todo.findByPk(todoId, {
        include: [{ model: ApprovalRecord, as: 'records', order: [['createdAt', 'DESC']] }]
      })
      if (!todo) return null

      // 生成 AI 摘要与风险分析
      const summary = await aiService.generateSummary(this.buildDocumentContent(todo))
      const risk = await aiService.analyzeRisk(this.buildDocumentContent(todo), [])

      return {
        todo,
        aiSummary: summary,
        aiRisk: risk,
        opinionTemplates: opinionTemplates.slice(0, 3)
      }
    }

    // Mock 模式：返回完整审批详情
    const mockDetail = getMockApprovalDetail(todoId)
    if (!mockDetail) return null
    return mockDetail
  },

  buildDocumentContent(todo: any): string {
    return `标题：${todo.title}\n类型：${todo.type}\n金额：${todo.amount}\n申请人：${todo.applicantName}\n部门：${todo.department}`
  },

  // 审批操作
  async approve(todoId: number, approverId: number, approverName: string, action: string, opinion: string): Promise<any> {
    if (dbConnected) {
      const todo = await Todo.findByPk(todoId)
      if (!todo) throw new Error('待办不存在')

      // 生成 AI 意见
      const aiResult = await aiService.generateOpinion(this.buildDocumentContent(todo), { level: 'low' })

      // 创建审批记录
      const record = await ApprovalRecord.create({
        todoId,
        approverId,
        approverName,
        action,
        opinion,
        aiOpinion: aiResult.opinion,
        aiRiskLevel: aiResult.riskLevel,
        aiSummary: aiResult.summary
      })

      // 更新待办状态
      const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'transferred'
      await todo.update({ status: newStatus })

      return { record, todo }
    }

    // Mock 模式：模拟审批操作成功
    return {
      success: true,
      message: '审批操作成功（Mock模式）',
      todoId,
      action,
      opinion
    }
  },

  // 获取审批历史
  async getApprovalHistory(todoId: number): Promise<any[]> {
    if (dbConnected) {
      return await ApprovalRecord.findAll({
        where: { todoId },
        order: [['createdAt', 'DESC']]
      })
    }

    // Mock 模式：返回模拟审批历史
    return getMockApprovalHistory(todoId)
  },

  // 获取审批意见模板
  async getOpinionTemplates(): Promise<any[]> {
    return opinionTemplates
  }
}

export default approvalService

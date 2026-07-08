// 系统管理服务（全部使用内存 Mock 数据）
// 包含：数据安全、访问安全、审计与合规、运维监控、组织架构、角色权限 6 大模块

// ============================================================
// 内部 Mock 数据
// ============================================================

// 数据安全配置
let securityConfig = {
  tls: {
    enabled: true,
    version: 'TLS1.3',
    certExpiry: '2026-12-31'
  },
  storage: {
    enabled: true,
    algorithm: 'AES-256',
    encryptedTables: ['users', 'contracts', 'expense_reports', 'salary_records', 'bank_accounts', 'customer_info', 'supplier_info']
  },
  desensitize: {
    enabled: true,
    rules: [
      { field: 'phone', type: 'phone', sample: '138****0000', scenes: ['列表页', '详情页', '导出'] },
      { field: 'idCard', type: 'idCard', sample: '110***********1234', scenes: ['列表页', '详情页', '导出'] },
      { field: 'email', type: 'email', sample: 'a***@jinmailang.com', scenes: ['列表页', '详情页'] },
      { field: 'bankCard', type: 'bankCard', sample: '6222 **** **** 1234', scenes: ['详情页', '导出'] },
      { field: 'realName', type: 'name', sample: '张*', scenes: ['列表页', '导出'] },
      { field: 'address', type: 'address', sample: '河北省邢台市****', scenes: ['导出'] }
    ]
  },
  watermark: {
    enabled: true,
    text: '道一云AI平台-机密',
    position: 'diagonal'
  },
  backup: {
    enabled: true,
    algorithm: 'AES-256',
    schedule: '每日3:00',
    retention: '30天'
  }
}

// 访问安全配置
let accessConfig = {
  sso: {
    enabled: true,
    providers: [
      { name: '企业微信', status: 'active' },
      { name: 'AD/LDAP', status: 'active' }
    ]
  },
  mfa: {
    enabled: true,
    methods: ['短信', '邮件', 'OTP(Google Authenticator)']
  },
  rbac: {
    enabled: true,
    roles: 5,
    permissions: 48
  },
  ipWhitelist: {
    enabled: true,
    ips: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']
  },
  session: {
    timeout: 30,
    maxConcurrent: 3,
    currentActive: 1
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true,
    expiry: 90,
    historyCount: 5
  }
}

// 操作审计日志
const auditLogs = [
  { id: 1, userId: 1, userName: '系统管理员', action: 'login', module: 'auth', detail: '登录系统', ip: '10.0.1.5', status: 'success', timestamp: '2026-07-06 09:15:23' },
  { id: 2, userId: 2, userName: '张财务', action: 'login', module: 'auth', detail: '登录系统', ip: '10.0.1.12', status: 'success', timestamp: '2026-07-06 09:18:45' },
  { id: 3, userId: 3, userName: '李法务', action: 'login', module: 'auth', detail: '密码错误3次', ip: '10.0.1.18', status: 'fail', timestamp: '2026-07-06 09:22:10' },
  { id: 4, userId: 2, userName: '张财务', action: 'create', module: 'expense', detail: '创建报销单 EXP-2026-0156，金额 5800 元', ip: '10.0.1.12', status: 'success', timestamp: '2026-07-06 09:35:18' },
  { id: 5, userId: 4, userName: '王采购', action: 'create', module: 'contract', detail: '创建合同审批 CT-2026-0089，金额 128 万元', ip: '10.0.2.6', status: 'success', timestamp: '2026-07-06 09:42:55' },
  { id: 6, userId: 5, userName: '赵销售', action: 'approve', module: 'todo', detail: '审批通过 待办 TODO-1024', ip: '10.0.3.22', status: 'success', timestamp: '2026-07-06 09:51:30' },
  { id: 7, userId: 2, userName: '张财务', action: 'approve', module: 'expense', detail: '审批通过报销单 EXP-2026-0156', ip: '10.0.1.12', status: 'success', timestamp: '2026-07-06 10:05:12' },
  { id: 8, userId: 3, userName: '李法务', action: 'reject', module: 'contract', detail: '驳回合同 CT-2026-0089，原因：条款不清晰', ip: '10.0.1.18', status: 'success', timestamp: '2026-07-06 10:18:42' },
  { id: 9, userId: 1, userName: '系统管理员', action: 'update', module: 'user', detail: '修改用户[caiwu]角色为 manager', ip: '10.0.1.5', status: 'success', timestamp: '2026-07-06 10:25:08' },
  { id: 10, userId: 6, userName: '孙研发', action: 'export', module: 'expense', detail: '导出 7 月报销明细 Excel', ip: '10.0.4.11', status: 'success', timestamp: '2026-07-06 10:32:55' },
  { id: 11, userId: 4, userName: '王采购', action: 'login', module: 'auth', detail: '登录系统', ip: '10.0.2.6', status: 'success', timestamp: '2026-07-06 10:45:20' },
  { id: 12, userId: 7, userName: '周行政', action: 'create', module: 'todo', detail: '创建资产采购待办', ip: '10.0.5.7', status: 'success', timestamp: '2026-07-06 10:58:33' },
  { id: 13, userId: 5, userName: '赵销售', action: 'delete', module: 'todo', detail: '删除草稿待办 TODO-0998', ip: '10.0.3.22', status: 'success', timestamp: '2026-07-06 11:12:46' },
  { id: 14, userId: 2, userName: '张财务', action: 'export', module: 'contract', detail: '导出合同台账 PDF', ip: '10.0.1.12', status: 'success', timestamp: '2026-07-06 11:25:09' },
  { id: 15, userId: 8, userName: '吴经理', action: 'approve', module: 'contract', detail: '审批通过合同 CT-2026-0085', ip: '10.0.6.3', status: 'success', timestamp: '2026-07-06 11:38:52' },
  { id: 16, userId: 3, userName: '李法务', action: 'login', module: 'auth', detail: '账号被锁定（连续密码错误）', ip: '10.0.1.18', status: 'fail', timestamp: '2026-07-06 11:45:17' },
  { id: 17, userId: 1, userName: '系统管理员', action: 'update', module: 'auth', detail: '解锁用户[fawu]账号', ip: '10.0.1.5', status: 'success', timestamp: '2026-07-06 11:52:34' },
  { id: 18, userId: 6, userName: '孙研发', action: 'create', module: 'contract', detail: '创建研发服务合同 CT-2026-0092', ip: '10.0.4.11', status: 'success', timestamp: '2026-07-06 13:05:21' },
  { id: 19, userId: 7, userName: '周行政', action: 'update', module: 'user', detail: '修改个人邮箱信息', ip: '10.0.5.7', status: 'success', timestamp: '2026-07-06 13:18:45' },
  { id: 20, userId: 4, userName: '王采购', action: 'approve', module: 'todo', detail: '审批通过采购申请 TODO-1056', ip: '10.0.2.6', status: 'success', timestamp: '2026-07-06 13:32:08' },
  { id: 21, userId: 8, userName: '吴经理', action: 'login', module: 'auth', detail: '登录系统', ip: '10.0.6.3', status: 'success', timestamp: '2026-07-06 13:45:30' },
  { id: 22, userId: 2, userName: '张财务', action: 'reject', module: 'expense', detail: '驳回报销单 EXP-2026-0160，原因：单据不全', ip: '10.0.1.12', status: 'success', timestamp: '2026-07-06 13:58:14' },
  { id: 23, userId: 5, userName: '赵销售', action: 'create', module: 'contract', detail: '创建销售合同 CT-2026-0093，金额 86 万元', ip: '10.0.3.22', status: 'success', timestamp: '2026-07-06 14:05:33' },
  { id: 24, userId: 1, userName: '系统管理员', action: 'update', module: 'system', detail: '修改大模型参数 temperature 0.7→0.5', ip: '10.0.1.5', status: 'success', timestamp: '2026-07-06 14:12:18' },
  { id: 25, userId: 6, userName: '孙研发', action: 'create', module: 'todo', detail: '创建系统优化待办 TODO-1078', ip: '10.0.4.11', status: 'success', timestamp: '2026-07-06 14:20:45' },
  { id: 26, userId: 8, userName: '吴经理', action: 'approve', module: 'contract', detail: '审批通过合同 CT-2026-0093', ip: '10.0.6.3', status: 'success', timestamp: '2026-07-06 14:35:12' },
  { id: 27, userId: 4, userName: '王采购', action: 'export', module: 'contract', detail: '导出采购合同汇总表', ip: '10.0.2.6', status: 'success', timestamp: '2026-07-06 14:48:30' },
  { id: 28, userId: 3, userName: '李法务', action: 'login', module: 'auth', detail: '登录系统', ip: '10.0.1.18', status: 'success', timestamp: '2026-07-06 15:02:15' },
  { id: 29, userId: 7, userName: '周行政', action: 'create', module: 'todo', detail: '创建资产盘点待办 TODO-1082', ip: '10.0.5.7', status: 'success', timestamp: '2026-07-06 15:15:42' },
  { id: 30, userId: 2, userName: '张财务', action: 'approve', module: 'expense', detail: '审批通过报销单 EXP-2026-0162', ip: '10.0.1.12', status: 'success', timestamp: '2026-07-06 15:28:55' },
  { id: 31, userId: 5, userName: '赵销售', action: 'update', module: 'user', detail: '修改个人手机号', ip: '10.0.3.22', status: 'success', timestamp: '2026-07-06 15:42:08' },
  { id: 32, userId: 1, userName: '系统管理员', action: 'create', module: 'system', detail: '创建连接器「SFTP-报表归档」', ip: '10.0.1.5', status: 'success', timestamp: '2026-07-06 15:55:33' },
  { id: 33, userId: 6, userName: '孙研发', action: 'login', module: 'auth', detail: 'Token 过期，重新登录', ip: '10.0.4.11', status: 'fail', timestamp: '2026-07-06 16:08:20' },
  { id: 34, userId: 8, userName: '吴经理', action: 'query', module: 'dashboard', detail: '查看管理驾驶舱数据', ip: '10.0.6.3', status: 'success', timestamp: '2026-07-06 16:15:45' },
  { id: 35, userId: 4, userName: '王采购', action: 'approve', module: 'todo', detail: '审批通过采购申请 TODO-1085', ip: '10.0.2.6', status: 'success', timestamp: '2026-07-06 16:28:12' },
  { id: 36, userId: 3, userName: '李法务', action: 'reject', module: 'contract', detail: '驳回合同 CT-2026-0095，原因：违约条款不合理', ip: '10.0.1.18', status: 'success', timestamp: '2026-07-06 16:42:30' },
  { id: 37, userId: 2, userName: '张财务', action: 'export', module: 'system', detail: '导出审计日志报表', ip: '10.0.1.12', status: 'success', timestamp: '2026-07-06 16:55:18' },
  { id: 38, userId: 7, userName: '周行政', action: 'update', module: 'todo', detail: '修改待办 TODO-1082 优先级为高', ip: '10.0.5.7', status: 'success', timestamp: '2026-07-06 17:08:42' },
  { id: 39, userId: 1, userName: '系统管理员', action: 'delete', module: 'system', detail: '删除失效连接器「旧版ERP」', ip: '10.0.1.5', status: 'success', timestamp: '2026-07-06 17:22:15' },
  { id: 40, userId: 5, userName: '赵销售', action: 'login', module: 'auth', detail: '退出系统', ip: '10.0.3.22', status: 'success', timestamp: '2026-07-06 17:35:50' }
]

// 数据访问审计日志
const dataAccessLogs = [
  { id: 1, userId: 1, userName: '系统管理员', dataType: 'user_info', operation: 'read', recordId: 'U-0002', ip: '10.0.1.5', riskLevel: 'low', timestamp: '2026-07-06 09:20:11' },
  { id: 2, userId: 2, userName: '张财务', dataType: 'expense', operation: 'read', recordId: 'EXP-2026-0156', ip: '10.0.1.12', riskLevel: 'low', timestamp: '2026-07-06 09:36:45' },
  { id: 3, userId: 4, userName: '王采购', dataType: 'contract', operation: 'read', recordId: 'CT-2026-0089', ip: '10.0.2.6', riskLevel: 'low', timestamp: '2026-07-06 09:44:20' },
  { id: 4, userId: 6, userName: '孙研发', dataType: 'expense', operation: 'export', recordId: 'EXP-2026-07', ip: '10.0.4.11', riskLevel: 'medium', timestamp: '2026-07-06 10:33:30' },
  { id: 5, userId: 2, userName: '张财务', dataType: 'contract', operation: 'export', recordId: 'CT-2026-H1', ip: '10.0.1.12', riskLevel: 'medium', timestamp: '2026-07-06 11:26:02' },
  { id: 6, userId: 3, userName: '李法务', dataType: 'salary', operation: 'read', recordId: 'SAL-2026-06', ip: '10.0.1.18', riskLevel: 'high', timestamp: '2026-07-06 11:48:55' },
  { id: 7, userId: 1, userName: '系统管理员', dataType: 'user_info', operation: 'read', recordId: 'U-0003', ip: '10.0.1.5', riskLevel: 'low', timestamp: '2026-07-06 11:53:12' },
  { id: 8, userId: 7, userName: '周行政', dataType: 'user_info', operation: 'read', recordId: 'U-0007', ip: '10.0.5.7', riskLevel: 'low', timestamp: '2026-07-06 13:20:33' },
  { id: 9, userId: 5, userName: '赵销售', dataType: 'contract', operation: 'print', recordId: 'CT-2026-0080', ip: '10.0.3.22', riskLevel: 'medium', timestamp: '2026-07-06 13:28:50' },
  { id: 10, userId: 8, userName: '吴经理', dataType: 'expense', operation: 'read', recordId: 'EXP-2026-0158', ip: '10.0.6.3', riskLevel: 'low', timestamp: '2026-07-06 13:46:15' },
  { id: 11, userId: 2, userName: '张财务', dataType: 'salary', operation: 'export', recordId: 'SAL-2026-06', ip: '10.0.1.12', riskLevel: 'high', timestamp: '2026-07-06 13:55:42' },
  { id: 12, userId: 4, userName: '王采购', dataType: 'contract', operation: 'read', recordId: 'CT-2026-0091', ip: '10.0.2.6', riskLevel: 'low', timestamp: '2026-07-06 14:02:18' },
  { id: 13, userId: 6, userName: '孙研发', dataType: 'user_info', operation: 'export', recordId: 'U-LIST-ALL', ip: '10.0.4.11', riskLevel: 'high', timestamp: '2026-07-06 14:12:30' },
  { id: 14, userId: 3, userName: '李法务', dataType: 'contract', operation: 'print', recordId: 'CT-2026-0089', ip: '10.0.1.18', riskLevel: 'medium', timestamp: '2026-07-06 14:25:08' },
  { id: 15, userId: 1, userName: '系统管理员', dataType: 'expense', operation: 'export', recordId: 'EXP-2026-H1', ip: '10.0.1.5', riskLevel: 'medium', timestamp: '2026-07-06 14:38:52' },
  { id: 16, userId: 7, userName: '周行政', dataType: 'user_info', operation: 'read', recordId: 'U-0001', ip: '10.0.5.7', riskLevel: 'low', timestamp: '2026-07-06 14:50:21' }
]

// 系统日志
const systemLogs = [
  { id: 1, level: 'info', module: 'auth', message: '用户 admin 登录成功', traceId: 'trace-001', timestamp: '2026-07-06 09:15:23' },
  { id: 2, level: 'info', module: 'todo', message: '待办任务 TODO-1024 创建成功', traceId: 'trace-002', timestamp: '2026-07-06 09:25:11' },
  { id: 3, level: 'warn', module: 'auth', message: '用户 fawu 连续3次密码错误', traceId: 'trace-003', timestamp: '2026-07-06 09:22:10' },
  { id: 4, level: 'info', module: 'expense', message: '报销单 EXP-2026-0156 创建成功', traceId: 'trace-004', timestamp: '2026-07-06 09:35:18' },
  { id: 5, level: 'error', module: 'ai', message: 'AI 审计接口调用超时', traceId: 'trace-005', timestamp: '2026-07-06 09:48:30' },
  { id: 6, level: 'info', module: 'contract', message: '合同 CT-2026-0089 创建成功', traceId: 'trace-006', timestamp: '2026-07-06 09:42:55' },
  { id: 7, level: 'info', module: 'approval', message: '审批流程 WORKFLOW-205 完成', traceId: 'trace-007', timestamp: '2026-07-06 10:05:12' },
  { id: 8, level: 'warn', module: 'system', message: 'CPU 使用率超过 70%', traceId: 'trace-008', timestamp: '2026-07-06 10:15:42' },
  { id: 9, level: 'info', module: 'connector', message: 'SAP 连接器同步完成，处理 128 条记录', traceId: 'trace-009', timestamp: '2026-07-06 10:22:08' },
  { id: 10, level: 'error', module: 'database', message: '数据库慢查询：SELECT * FROM contracts 耗时 3.2s', traceId: 'trace-010', timestamp: '2026-07-06 10:30:55' },
  { id: 11, level: 'info', module: 'llm', message: 'GLM-4 模型调用成功，耗时 1.8s', traceId: 'trace-011', timestamp: '2026-07-06 10:38:21' },
  { id: 12, level: 'fatal', module: 'auth', message: '用户 fawu 账号被锁定', traceId: 'trace-012', timestamp: '2026-07-06 11:45:17' },
  { id: 13, level: 'info', module: 'user', message: '用户 fawu 账号已被管理员解锁', traceId: 'trace-013', timestamp: '2026-07-06 11:52:34' },
  { id: 14, level: 'warn', module: 'system', message: '内存使用率达到 75%', traceId: 'trace-014', timestamp: '2026-07-06 12:05:18' },
  { id: 15, level: 'info', module: 'dashboard', message: '驾驶舱数据刷新完成', traceId: 'trace-015', timestamp: '2026-07-06 12:18:45' },
  { id: 16, level: 'error', module: 'connector', message: 'OA 连接器认证失败', traceId: 'trace-016', timestamp: '2026-07-06 12:32:10' },
  { id: 17, level: 'info', module: 'todo', message: '批量同步待办 28 条', traceId: 'trace-017', timestamp: '2026-07-06 13:05:21' },
  { id: 18, level: 'warn', module: 'ai', message: 'AI 风险识别置信度偏低 62%', traceId: 'trace-018', timestamp: '2026-07-06 13:22:55' },
  { id: 19, level: 'info', module: 'expense', message: '报销单 EXP-2026-0156 审批通过', traceId: 'trace-019', timestamp: '2026-07-06 13:35:30' },
  { id: 20, level: 'error', module: 'system', message: '磁盘空间使用率超过 80%', traceId: 'trace-020', timestamp: '2026-07-06 13:48:12' },
  { id: 21, level: 'info', module: 'contract', message: '合同 CT-2026-0085 归档完成', traceId: 'trace-021', timestamp: '2026-07-06 13:58:42' },
  { id: 22, level: 'info', module: 'dataChat', message: '数据问答会话创建成功', traceId: 'trace-022', timestamp: '2026-07-06 14:12:08' },
  { id: 23, level: 'info', module: 'connector', message: 'SFTP-报表归档 连接器创建成功', traceId: 'trace-023', timestamp: '2026-07-06 15:55:33' },
  { id: 24, level: 'warn', module: 'auth', message: '用户 yanfa Token 过期', traceId: 'trace-024', timestamp: '2026-07-06 16:08:20' },
  { id: 25, level: 'info', module: 'dashboard', message: '驾驶舱数据缓存刷新', traceId: 'trace-025', timestamp: '2026-07-06 16:15:45' },
  { id: 26, level: 'error', module: 'contract', message: '合同 CT-2026-0095 审查失败，大模型返回格式异常', traceId: 'trace-026', timestamp: '2026-07-06 16:42:30' },
  { id: 27, level: 'info', module: 'audit', message: '审计日志报表导出完成', traceId: 'trace-027', timestamp: '2026-07-06 16:55:18' },
  { id: 28, level: 'warn', module: 'system', message: 'Redis 内存使用率 72%', traceId: 'trace-028', timestamp: '2026-07-06 17:00:12' },
  { id: 29, level: 'info', module: 'connector', message: '旧版ERP连接器已删除', traceId: 'trace-029', timestamp: '2026-07-06 17:22:15' },
  { id: 30, level: 'info', module: 'llm', message: 'Prompt模板「合同审查」更新成功', traceId: 'trace-030', timestamp: '2026-07-06 17:30:45' },
  { id: 31, level: 'debug', module: 'todo', message: '定时任务执行：检查超时待办，发现 3 条', traceId: 'trace-031', timestamp: '2026-07-06 17:35:00' },
  { id: 32, level: 'error', module: 'database', message: 'MySQL 连接池达到上限 50/50', traceId: 'trace-032', timestamp: '2026-07-06 17:42:18' },
  { id: 33, level: 'info', module: 'auth', message: '用户 xiaoshou 退出系统', traceId: 'trace-033', timestamp: '2026-07-06 17:35:50' },
  { id: 34, level: 'warn', module: 'ai', message: '大模型API响应延迟 1.8s，接近超时阈值', traceId: 'trace-034', timestamp: '2026-07-06 17:50:22' },
  { id: 35, level: 'info', module: 'connector', message: 'CRM系统对接 同步完成，处理 256 条记录', traceId: 'trace-035', timestamp: '2026-07-06 18:00:00' },
  { id: 36, level: 'info', module: 'system', message: '每日数据备份任务启动', traceId: 'trace-036', timestamp: '2026-07-06 03:00:00' },
  { id: 37, level: 'info', module: 'system', message: '每日数据备份完成，大小 15.2GB', traceId: 'trace-037', timestamp: '2026-07-06 03:18:42' },
  { id: 38, level: 'warn', module: 'expense', message: '报销单 EXP-2026-0165 金额异常，超出部门预算 20%', traceId: 'trace-038', timestamp: '2026-07-06 18:15:30' },
  { id: 39, level: 'debug', module: 'llm', message: 'Token 用量统计：今日消耗 45,280 tokens', traceId: 'trace-039', timestamp: '2026-07-06 18:30:00' },
  { id: 40, level: 'info', module: 'dataChat', message: '数据问答「采购分析」会话完成 5 轮对话', traceId: 'trace-040', timestamp: '2026-07-06 18:45:15' }
]

// 告警列表
const alerts = [
  { id: 1, level: 'critical', title: 'AI 审计接口超时', message: '/api/ai/audit/summary 接口平均响应时间 2.3s，超过阈值 1s', source: 'APM监控', status: 'active', timestamp: '2026-07-06 09:48:30' },
  { id: 2, level: 'warning', title: 'CPU 使用率偏高', message: '服务器 prod-app-01 CPU 使用率达到 76%', source: '系统监控', status: 'active', timestamp: '2026-07-06 10:15:42' },
  { id: 3, level: 'warning', title: '内存使用率告警', message: '服务器内存使用率 75%，接近阈值 85%', source: '系统监控', status: 'active', timestamp: '2026-07-06 12:05:18' },
  { id: 4, level: 'critical', title: 'OA 连接器认证失败', message: 'OA 系统 API 鉴权失败，连接器已暂停', source: '连接器', status: 'active', timestamp: '2026-07-06 12:32:10' },
  { id: 5, level: 'warning', title: '数据库慢查询', message: '检测到 3 条慢查询，最长耗时 3.2s', source: '数据库监控', status: 'resolved', timestamp: '2026-07-06 10:30:55' },
  { id: 6, level: 'warning', title: 'AI 风险识别置信度偏低', message: '报销单 EXP-2026-0160 风险识别置信度仅 62%', source: 'AI 服务', status: 'active', timestamp: '2026-07-06 13:22:55' },
  { id: 7, level: 'critical', title: '磁盘空间不足', message: '/data 分区使用率 82%，剩余 90GB', source: '系统监控', status: 'active', timestamp: '2026-07-06 13:48:12' },
  { id: 8, level: 'info', title: '数据备份完成', message: '每日 3:00 数据备份已完成，备份大小 12.8GB', source: '备份服务', status: 'resolved', timestamp: '2026-07-06 03:15:22' },
  { id: 9, level: 'warning', title: 'API 错误率上升', message: '/api/connectors/sync 错误率 1.2%，超过阈值 1%', source: 'APM监控', status: 'active', timestamp: '2026-07-06 14:02:30' },
  { id: 10, level: 'warning', title: 'Redis 内存告警', message: 'Redis 内存使用率 72%，接近阈值 80%', source: '系统监控', status: 'active', timestamp: '2026-07-06 17:00:12' },
  { id: 11, level: 'critical', title: 'MySQL 连接池耗尽', message: '数据库连接池达到上限 50/50，新请求被拒绝', source: '数据库监控', status: 'active', timestamp: '2026-07-06 17:42:18' },
  { id: 12, level: 'warning', title: '大模型响应延迟', message: '文心大模型API响应延迟 1.8s，接近超时阈值 2s', source: 'AI 服务', status: 'active', timestamp: '2026-07-06 17:50:22' },
  { id: 13, level: 'info', title: 'CRM 连接器同步完成', message: 'CRM系统对接 同步 256 条记录，耗时 12s', source: '连接器', status: 'resolved', timestamp: '2026-07-06 18:00:00' },
  { id: 14, level: 'warning', title: '报销金额异常', message: '报销单 EXP-2026-0165 金额超出部门预算 20%', source: '业务监控', status: 'active', timestamp: '2026-07-06 18:15:30' },
  { id: 15, level: 'info', title: '数据备份完成', message: '每日 3:00 数据备份完成，大小 15.2GB，耗时 18 分钟', source: '备份服务', status: 'resolved', timestamp: '2026-07-06 03:18:42' }
]

// ==================== 系统日志管理 ====================

// 登录日志
const loginLogs = [
  { id: 1, userId: 1, userName: '系统管理员', action: 'login', ip: '10.0.1.5', location: '内网', browser: 'Chrome 126', os: 'Windows 11', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 09:15:23', duration: '8h32m' },
  { id: 2, userId: 2, userName: '张财务', action: 'login', ip: '10.0.1.12', location: '内网', browser: 'Chrome 126', os: 'Windows 10', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 09:18:45', duration: '6h15m' },
  { id: 3, userId: 3, userName: '李法务', action: 'login', ip: '10.0.1.18', location: '内网', browser: 'Edge 126', os: 'Windows 10', device: 'PC', status: 'fail', message: '密码错误（第1次）', timestamp: '2026-07-06 09:20:10', duration: '-' },
  { id: 4, userId: 3, userName: '李法务', action: 'login', ip: '10.0.1.18', location: '内网', browser: 'Edge 126', os: 'Windows 10', device: 'PC', status: 'fail', message: '密码错误（第2次）', timestamp: '2026-07-06 09:21:15', duration: '-' },
  { id: 5, userId: 3, userName: '李法务', action: 'login', ip: '10.0.1.18', location: '内网', browser: 'Edge 126', os: 'Windows 10', device: 'PC', status: 'fail', message: '密码错误（第3次），账号锁定', timestamp: '2026-07-06 09:22:10', duration: '-' },
  { id: 6, userId: 5, userName: '赵销售', action: 'login', ip: '10.0.3.22', location: '内网', browser: 'Chrome 126', os: 'macOS 14', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 08:55:11', duration: '8h40m' },
  { id: 7, userId: 4, userName: '王采购', action: 'login', ip: '10.0.2.6', location: '内网', browser: 'Chrome 125', os: 'Windows 11', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 10:45:20', duration: '5h20m' },
  { id: 8, userId: 6, userName: '孙研发', action: 'login', ip: '10.0.4.11', location: '内网', browser: 'Chrome 126', os: 'Ubuntu 22.04', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 09:02:35', duration: '7h45m' },
  { id: 9, userId: 7, userName: '周行政', action: 'login', ip: '10.0.5.7', location: '内网', browser: 'Chrome 126', os: 'Windows 10', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 09:30:18', duration: '7h10m' },
  { id: 10, userId: 8, userName: '吴经理', action: 'login', ip: '10.0.6.3', location: '内网', browser: 'Safari 17', os: 'macOS 14', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 13:45:30', duration: '3h20m' },
  { id: 11, userId: 6, userName: '孙研发', action: 'login', ip: '10.0.4.11', location: '内网', browser: 'Chrome 126', os: 'Ubuntu 22.04', device: 'PC', status: 'fail', message: 'Token过期，重新登录', timestamp: '2026-07-06 16:08:20', duration: '-' },
  { id: 12, userId: 5, userName: '赵销售', action: 'logout', ip: '10.0.3.22', location: '内网', browser: 'Chrome 126', os: 'macOS 14', device: 'PC', status: 'success', message: '退出登录', timestamp: '2026-07-06 17:35:50', duration: '-' },
  { id: 13, userId: 11, userName: '陈算法', action: 'login', ip: '10.0.4.15', location: '内网', browser: 'Chrome 126', os: 'Windows 11', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 08:40:15', duration: '8h55m' },
  { id: 14, userId: 2, userName: '张财务', action: 'logout', ip: '10.0.1.12', location: '内网', browser: 'Chrome 126', os: 'Windows 10', device: 'PC', status: 'success', message: '退出登录', timestamp: '2026-07-06 17:30:22', duration: '-' },
  { id: 15, userId: 9, userName: '钱前端', action: 'login', ip: '192.168.1.88', location: 'VPN', browser: 'Chrome 126', os: 'macOS 14', device: 'PC', status: 'success', message: 'VPN登录成功', timestamp: '2026-07-05 18:22:45', duration: '2h15m' },
  { id: 16, userId: 15, userName: '吴华北', action: 'login', ip: '114.252.66.33', location: '外网-北京', browser: 'Chrome 125', os: 'Android 14', device: '手机', status: 'fail', message: 'IP不在白名单，拒绝访问', timestamp: '2026-07-06 14:20:33', duration: '-' },
  { id: 17, userId: 1, userName: '系统管理员', action: 'login', ip: '10.0.1.5', location: '内网', browser: 'Chrome 126', os: 'Windows 11', device: 'PC', status: 'success', message: 'MFA验证通过', timestamp: '2026-07-06 09:15:20', duration: '-' },
  { id: 18, userId: 4, userName: '王采购', action: 'logout', ip: '10.0.2.6', location: '内网', browser: 'Chrome 125', os: 'Windows 11', device: 'PC', status: 'success', message: '退出登录', timestamp: '2026-07-06 17:45:00', duration: '-' },
  { id: 19, userId: 12, userName: '王会计', action: 'login', ip: '10.0.1.25', location: '内网', browser: 'Chrome 126', os: 'Windows 10', device: 'PC', status: 'success', message: '登录成功', timestamp: '2026-07-06 09:05:22', duration: '8h30m' },
  { id: 20, userId: 8, userName: '吴经理', action: 'logout', ip: '10.0.6.3', location: '内网', browser: 'Safari 17', os: 'macOS 14', device: 'PC', status: 'success', message: '退出登录', timestamp: '2026-07-06 17:10:15', duration: '-' }
]

// 接口调用日志
const apiCallLogs = [
  { id: 1, method: 'POST', path: '/api/auth/login', userId: 1, userName: '系统管理员', reqSize: 52, resSize: 1248, duration: 85, status: 200, ip: '10.0.1.5', timestamp: '2026-07-06 09:15:23' },
  { id: 2, method: 'GET', path: '/api/todos', userId: 1, userName: '系统管理员', reqSize: 0, resSize: 8520, duration: 42, status: 200, ip: '10.0.1.5', timestamp: '2026-07-06 09:15:28' },
  { id: 3, method: 'POST', path: '/api/ai/audit/summary', userId: 1, userName: '系统管理员', reqSize: 256, resSize: 3200, duration: 2300, status: 200, ip: '10.0.1.5', timestamp: '2026-07-06 09:20:15' },
  { id: 4, method: 'GET', path: '/api/todos', userId: 2, userName: '张财务', reqSize: 0, resSize: 7820, duration: 38, status: 200, ip: '10.0.1.12', timestamp: '2026-07-06 09:19:02' },
  { id: 5, method: 'POST', path: '/api/expenses', userId: 2, userName: '张财务', reqSize: 512, resSize: 256, duration: 125, status: 200, ip: '10.0.1.12', timestamp: '2026-07-06 09:35:18' },
  { id: 6, method: 'POST', path: '/api/ai/ocr/invoice', userId: 2, userName: '张财务', reqSize: 1024000, resSize: 1856, duration: 1850, status: 200, ip: '10.0.1.12', timestamp: '2026-07-06 09:36:45' },
  { id: 7, method: 'GET', path: '/api/contracts', userId: 4, userName: '王采购', reqSize: 0, resSize: 6240, duration: 55, status: 200, ip: '10.0.2.6', timestamp: '2026-07-06 10:45:30' },
  { id: 8, method: 'POST', path: '/api/ai/audit/risk', userId: 1, userName: '系统管理员', reqSize: 380, resSize: 2840, duration: 1950, status: 200, ip: '10.0.1.5', timestamp: '2026-07-06 10:22:08' },
  { id: 9, method: 'POST', path: '/api/todos/batch-approve', userId: 5, userName: '赵销售', reqSize: 128, resSize: 320, duration: 95, status: 200, ip: '10.0.3.22', timestamp: '2026-07-06 09:51:30' },
  { id: 10, method: 'POST', path: '/api/ai/audit/summary', userId: 1, userName: '系统管理员', reqSize: 280, resSize: 0, duration: 10000, status: 504, ip: '10.0.1.5', timestamp: '2026-07-06 09:48:30', errorMsg: '大模型API调用超时' },
  { id: 11, method: 'GET', path: '/api/dashboard/overview', userId: 8, userName: '吴经理', reqSize: 0, resSize: 4200, duration: 68, status: 200, ip: '10.0.6.3', timestamp: '2026-07-06 13:46:00' },
  { id: 12, method: 'POST', path: '/api/expenses/parse', userId: 2, userName: '张财务', reqSize: 120, resSize: 580, duration: 320, status: 200, ip: '10.0.1.12', timestamp: '2026-07-06 10:05:12' },
  { id: 13, method: 'PUT', path: '/api/connectors/3/toggle', userId: 1, userName: '系统管理员', reqSize: 32, resSize: 128, duration: 45, status: 200, ip: '10.0.1.5', timestamp: '2026-07-06 15:55:33' },
  { id: 14, method: 'GET', path: '/api/system-admin/audit/logs', userId: 1, userName: '系统管理员', reqSize: 0, resSize: 12400, duration: 82, status: 200, ip: '10.0.1.5', timestamp: '2026-07-06 16:55:18' },
  { id: 15, method: 'POST', path: '/api/data-chat/ask', userId: 8, userName: '吴经理', reqSize: 180, resSize: 8200, duration: 1250, status: 200, ip: '10.0.6.3', timestamp: '2026-07-06 14:12:08' },
  { id: 16, method: 'POST', path: '/api/contracts/review', userId: 3, userName: '李法务', reqSize: 560, resSize: 4200, duration: 2800, status: 200, ip: '10.0.1.18', timestamp: '2026-07-06 14:25:08' },
  { id: 17, method: 'GET', path: '/api/todos/ai-batch', userId: 1, userName: '系统管理员', reqSize: 0, resSize: 0, duration: 5000, status: 500, ip: '10.0.1.5', timestamp: '2026-07-06 11:30:22', errorMsg: 'AI批量分析服务内部错误' },
  { id: 18, method: 'POST', path: '/api/auth/login', userId: 3, userName: '李法务', reqSize: 48, resSize: 0, duration: 15, status: 401, ip: '10.0.1.18', timestamp: '2026-07-06 09:20:10', errorMsg: '密码错误' },
  { id: 19, method: 'GET', path: '/api/llm/providers', userId: 1, userName: '系统管理员', reqSize: 0, resSize: 2400, duration: 35, status: 200, ip: '10.0.1.5', timestamp: '2026-07-06 14:12:18' },
  { id: 20, method: 'DELETE', path: '/api/system-admin/roles/3', userId: 1, userName: '系统管理员', reqSize: 0, resSize: 64, duration: 28, status: 200, ip: '10.0.1.5', timestamp: '2026-07-06 17:22:15' }
]

// 异常错误日志
const errorLogs = [
  { id: 1, level: 'fatal', module: 'auth', errorCode: 'AUTH_001', message: '用户[fawu]连续3次密码错误，账号已锁定', stack: 'at AuthService.login (authService.ts:45)\n at AuthRouter.login (auth.ts:12)', traceId: 'trace-012', ip: '10.0.1.18', userId: 3, timestamp: '2026-07-06 09:22:10', resolved: false },
  { id: 2, level: 'error', module: 'ai', errorCode: 'AI_TIMEOUT', message: '大模型API调用超时（10s），请求已终止', stack: 'at AiService.chat (aiService.ts:58)\n at AiService.generateSummary (aiService.ts:92)', traceId: 'trace-005', ip: '10.0.1.5', userId: 1, timestamp: '2026-07-06 09:48:30', resolved: false },
  { id: 3, level: 'error', module: 'database', errorCode: 'DB_SLOW_QUERY', message: '慢查询: SELECT * FROM contracts WHERE... 耗时3.2s', stack: 'at Sequelize.query (database.ts:120)\n at ContractService.getContracts (contractService.ts:34)', traceId: 'trace-010', ip: '-', userId: 0, timestamp: '2026-07-06 10:30:55', resolved: true },
  { id: 4, level: 'error', module: 'connector', errorCode: 'CONN_AUTH_FAIL', message: 'OA系统API鉴权失败，连接器已暂停', stack: 'at ConnectorService.testConnection (connectorService.ts:78)\n at ConnectorRoute.test (connectors.ts:45)', traceId: 'trace-016', ip: '-', userId: 1, timestamp: '2026-07-06 12:32:10', resolved: false },
  { id: 5, level: 'fatal', module: 'database', errorCode: 'DB_POOL_EXHAUSTED', message: 'MySQL连接池耗尽(50/50)，新请求被拒绝', stack: 'at Pool.acquire (sequelize-pool:85)\n at Sequelize.query (database.ts:115)', traceId: 'trace-032', ip: '-', userId: 0, timestamp: '2026-07-06 17:42:18', resolved: false },
  { id: 6, level: 'error', module: 'system', errorCode: 'DISK_FULL', message: '磁盘/data分区使用率82%，剩余90GB', stack: 'at DiskMonitor.check (monitor.ts:42)', traceId: 'trace-020', ip: '-', userId: 0, timestamp: '2026-07-06 13:48:12', resolved: false },
  { id: 7, level: 'error', module: 'contract', errorCode: 'AI_PARSE_ERROR', message: '合同CT-2026-0095审查失败，大模型返回格式异常', stack: 'at AiService.reviewContract (aiService.ts:248)\n at ContractService.aiReview (contractService.ts:89)', traceId: 'trace-026', ip: '10.0.1.18', userId: 3, timestamp: '2026-07-06 16:42:30', resolved: true },
  { id: 8, level: 'warn', module: 'ai', errorCode: 'AI_LOW_CONFIDENCE', message: '报销单EXP-2026-0160风险识别置信度仅62%', stack: 'at AiService.analyzeRisk (aiService.ts:118)', traceId: 'trace-018', ip: '10.0.1.12', userId: 2, timestamp: '2026-07-06 13:22:55', resolved: false },
  { id: 9, level: 'error', module: 'llm', errorCode: 'LLM_RATE_LIMIT', message: '文心大模型API调用频率超限(60次/分)', stack: 'at AiService.getWenxinToken (aiService.ts:22)\n at AiService.chat (aiService.ts:46)', traceId: 'trace-034', ip: '-', userId: 0, timestamp: '2026-07-06 17:50:22', resolved: false },
  { id: 10, level: 'warn', module: 'system', errorCode: 'MEM_HIGH', message: 'Redis内存使用率72%，接近阈值80%', stack: 'at RedisMonitor.check (monitor.ts:68)', traceId: 'trace-028', ip: '-', userId: 0, timestamp: '2026-07-06 17:00:12', resolved: false },
  { id: 11, level: 'error', module: 'auth', errorCode: 'AUTH_IP_BLOCKED', message: 'IP[114.252.66.33]不在白名单，拒绝访问', stack: 'at AuthMiddleware.checkIp (auth.ts:88)', traceId: 'trace-029', ip: '114.252.66.33', userId: 15, timestamp: '2026-07-06 14:20:33', resolved: true },
  { id: 12, level: 'fatal', module: 'system', errorCode: 'SYS_OOM', message: 'Node.js进程内存溢出(OOM)，已自动重启', stack: 'at process.on(memoryWarning) (app.ts:15)\n at HeapStats.check (monitor.ts:95)', traceId: 'trace-035', ip: '-', userId: 0, timestamp: '2026-07-05 23:15:00', resolved: true },
  { id: 13, level: 'warn', module: 'expense', errorCode: 'BUDGET_EXCEED', message: '报销单EXP-2026-0165金额超出部门预算20%', stack: 'at ExpenseService.checkCompliance (expenseService.ts:156)', traceId: 'trace-038', ip: '10.0.1.12', userId: 2, timestamp: '2026-07-06 18:15:30', resolved: false },
  { id: 14, level: 'error', module: 'connector', errorCode: 'CONN_TIMEOUT', message: 'SAP连接器同步超时(30s)，数据可能不完整', stack: 'at ConnectorService.syncData (connectorService.ts:112)', traceId: 'trace-040', ip: '-', userId: 0, timestamp: '2026-07-06 18:30:00', resolved: false },
  { id: 15, level: 'warn', module: 'todo', errorCode: 'TODO_BATCH_FAIL', message: 'AI批量分析服务内部错误，3条待办未处理', stack: 'at TodoService.aiBatch (todoService.ts:95)', traceId: 'trace-017', ip: '10.0.1.5', userId: 1, timestamp: '2026-07-06 11:30:22', resolved: true }
]

// 告警通知配置
let alertConfig = {
  channels: [
    { name: '企业微信', enabled: true },
    { name: '邮件', enabled: true },
    { name: '钉钉', enabled: false }
  ],
  rules: [
    { metric: 'CPU使用率', threshold: 80, action: '告警' },
    { metric: '内存使用率', threshold: 85, action: '告警' },
    { metric: 'API错误率', threshold: 1, action: '告警' },
    { metric: 'AI准确率', threshold: 90, action: '告警' }
  ]
}

// 第三方系统列表
const thirdPartySystems = [
  {
    id: 1,
    name: 'OA审批系统',
    code: 'OA_SYSTEM',
    type: 'api',
    category: '审批流程',
    status: 'online',
    enabled: true,
    icon: 'Tickets',
    description: '企业OA审批流程系统，支持报销、请假、出差等审批流程发起与查询',
    lastSyncTime: '2026-07-07 10:30:00',
    version: 'v3.2.1',
    apiCount: 28,
    params: [
      { key: 'apiBaseUrl', label: 'API地址', type: 'text', value: 'https://oa.example.com/api/v3', required: true, description: 'OA系统API基础地址' },
      { key: 'apiKey', label: 'API密钥', type: 'password', value: 'oa_sk_8f3a2b1c', required: true, description: '接口认证密钥' },
      { key: 'appSecret', label: '应用密钥', type: 'password', value: 'app_secret_x9y7z', required: true, description: '应用级别密钥，用于签名验证' },
      { key: 'callbackUrl', label: '回调地址', type: 'text', value: 'https://ai-platform.example.com/callback/oa', required: false, description: '审批结果回调通知地址' },
      { key: 'timeout', label: '超时时间(ms)', type: 'number', value: '5000', required: false, description: '请求超时时间，默认5000ms' },
      { key: 'rateLimit', label: '限流策略', type: 'select', value: '100/min', required: false, description: '接口调用限流策略', options: ['50/min', '100/min', '200/min', '500/min'] },
      { key: 'syncMode', label: '同步模式', type: 'select', value: 'realtime', required: false, description: '数据同步模式', options: ['realtime', 'batch', 'schedule'] }
    ]
  },
  {
    id: 2,
    name: '合同管理系统',
    code: 'CONTRACT_SYSTEM',
    type: 'api',
    category: '合同管理',
    status: 'online',
    enabled: true,
    icon: 'Files',
    description: '企业合同全生命周期管理系统，支持合同起草、审批、签署、归档',
    lastSyncTime: '2026-07-07 09:15:00',
    version: 'v2.8.0',
    apiCount: 35,
    params: [
      { key: 'apiBaseUrl', label: 'API地址', type: 'text', value: 'https://contract.example.com/api/v2', required: true, description: '合同系统API基础地址' },
      { key: 'apiKey', label: 'API密钥', type: 'password', value: 'ct_sk_4d5e6f7g', required: true, description: '接口认证密钥' },
      { key: 'oauthClientId', label: 'OAuth Client ID', type: 'text', value: 'contract_client_001', required: true, description: 'OAuth2.0 客户端ID' },
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', type: 'password', value: 'oauth_cs_h8i9j0k', required: true, description: 'OAuth2.0 客户端密钥' },
      { key: 'signProvider', label: '签署平台', type: 'select', value: 'esign', required: false, description: '电子签署平台选择', options: ['esign', 'fadada', 'docsign'] },
      { key: 'callbackUrl', label: '回调地址', type: 'text', value: 'https://ai-platform.example.com/callback/contract', required: false, description: '合同状态变更回调地址' },
      { key: 'timeout', label: '超时时间(ms)', type: 'number', value: '8000', required: false, description: '请求超时时间' },
      { key: 'syncMode', label: '同步模式', type: 'select', value: 'batch', required: false, description: '数据同步模式', options: ['realtime', 'batch', 'schedule'] }
    ]
  },
  {
    id: 3,
    name: '采购管理系统',
    code: 'PURCHASE_SYSTEM',
    type: 'api',
    category: '采购管理',
    status: 'online',
    enabled: true,
    icon: 'ShoppingCart',
    description: '企业采购管理系统，支持采购需求、询价比价、订单管理、供应商管理',
    lastSyncTime: '2026-07-07 08:45:00',
    version: 'v2.5.3',
    apiCount: 22,
    params: [
      { key: 'apiBaseUrl', label: 'API地址', type: 'text', value: 'https://purchase.example.com/api/v2', required: true, description: '采购系统API基础地址' },
      { key: 'apiKey', label: 'API密钥', type: 'password', value: 'pu_sk_1a2b3c4d', required: true, description: '接口认证密钥' },
      { key: 'supplierDbHost', label: '供应商数据库地址', type: 'text', value: '10.0.1.50:3306', required: false, description: '供应商数据库连接地址' },
      { key: 'supplierDbName', label: '供应商数据库名', type: 'text', value: 'supplier_db', required: false, description: '供应商数据库名称' },
      { key: 'supplierDbPassword', label: '数据库密码', type: 'password', value: 'db_pwd_encrypted', required: false, description: '数据库连接密码' },
      { key: 'timeout', label: '超时时间(ms)', type: 'number', value: '6000', required: false, description: '请求超时时间' },
      { key: 'syncMode', label: '同步模式', type: 'select', value: 'schedule', required: false, description: '数据同步模式（建议定时同步）', options: ['realtime', 'batch', 'schedule'] }
    ]
  },
  {
    id: 4,
    name: '项目管理系统',
    code: 'PROJECT_SYSTEM',
    type: 'api',
    category: '项目管理',
    status: 'online',
    enabled: true,
    icon: 'DataLine',
    description: '企业项目管理系统，支持项目立项、进度跟踪、资源分配、里程碑管理',
    lastSyncTime: '2026-07-06 17:20:00',
    version: 'v4.1.0',
    apiCount: 18,
    params: [
      { key: 'apiBaseUrl', label: 'API地址', type: 'text', value: 'https://project.example.com/api/v4', required: true, description: '项目系统API基础地址' },
      { key: 'apiKey', label: 'API密钥', type: 'password', value: 'pj_sk_5e6f7g8h', required: true, description: '接口认证密钥' },
      { key: 'webhookUrl', label: 'Webhook地址', type: 'text', value: 'https://project.example.com/webhook/events', required: false, description: '项目事件推送地址' },
      { key: 'callbackUrl', label: '回调地址', type: 'text', value: 'https://ai-platform.example.com/callback/project', required: false, description: '项目状态变更回调地址' },
      { key: 'timeout', label: '超时时间(ms)', type: 'number', value: '5000', required: false, description: '请求超时时间' },
      { key: 'syncMode', label: '同步模式', type: 'select', value: 'realtime', required: false, description: '数据同步模式', options: ['realtime', 'batch', 'schedule'] }
    ]
  },
  {
    id: 5,
    name: 'ERP系统',
    code: 'ERP_SYSTEM',
    type: 'database',
    category: '综合管理',
    status: 'online',
    enabled: true,
    icon: 'Cpu',
    description: '企业资源计划系统，覆盖财务、供应链、生产制造、人力资源等核心业务',
    lastSyncTime: '2026-07-07 06:00:00',
    version: 'v8.0.2',
    apiCount: 120,
    params: [
      { key: 'dbHost', label: '数据库地址', type: 'text', value: '10.0.0.100', required: true, description: 'ERP数据库服务器地址' },
      { key: 'dbPort', label: '数据库端口', type: 'number', value: '1521', required: true, description: '数据库端口（Oracle默认1521）' },
      { key: 'dbUser', label: '数据库用户', type: 'text', value: 'erp_reader', required: true, description: '数据库只读账号' },
      { key: 'dbPassword', label: '数据库密码', type: 'password', value: 'erp_pwd_encrypted', required: true, description: '数据库连接密码' },
      { key: 'dbName', label: '数据库实例名', type: 'text', value: 'ERP_PROD', required: true, description: '数据库实例名/SID' },
      { key: 'dbType', label: '数据库类型', type: 'select', value: 'oracle', required: true, description: '数据库引擎类型', options: ['oracle', 'mysql', 'postgresql', 'sqlserver'] },
      { key: 'syncInterval', label: '同步间隔(分钟)', type: 'number', value: '30', required: false, description: '定时数据同步间隔' },
      { key: 'readOnly', label: '只读模式', type: 'select', value: 'true', required: false, description: '是否仅读取数据（建议只读）', options: ['true', 'false'] }
    ]
  },
  {
    id: 6,
    name: '财务系统',
    code: 'FINANCE_SYSTEM',
    type: 'database',
    category: '财务管理',
    status: 'offline',
    enabled: false,
    icon: 'Wallet',
    description: '企业财务管理系统，涵盖总账、应收应付、固定资产、成本核算等',
    lastSyncTime: '2026-06-30 23:00:00',
    version: 'v6.3.1',
    apiCount: 45,
    params: [
      { key: 'dbHost', label: '数据库地址', type: 'text', value: '10.0.0.200', required: true, description: '财务数据库服务器地址' },
      { key: 'dbPort', label: '数据库端口', type: 'number', value: '3306', required: true, description: '数据库端口' },
      { key: 'dbUser', label: '数据库用户', type: 'text', value: 'finance_reader', required: true, description: '数据库只读账号' },
      { key: 'dbPassword', label: '数据库密码', type: 'password', value: 'fin_pwd_encrypted', required: true, description: '数据库连接密码' },
      { key: 'dbName', label: '数据库名', type: 'text', value: 'finance_db', required: true, description: '数据库库名' },
      { key: 'dbType', label: '数据库类型', type: 'select', value: 'mysql', required: true, description: '数据库引擎类型', options: ['oracle', 'mysql', 'postgresql', 'sqlserver'] },
      { key: 'syncInterval', label: '同步间隔(分钟)', type: 'number', value: '60', required: false, description: '定时数据同步间隔' },
      { key: 'readOnly', label: '只读模式', type: 'select', value: 'true', required: false, description: '是否仅读取数据', options: ['true', 'false'] }
    ]
  },
  {
    id: 7,
    name: 'CRM系统',
    code: 'CRM_SYSTEM',
    type: 'api',
    category: '客户管理',
    status: 'online',
    enabled: true,
    icon: 'UserFilled',
    description: '企业客户关系管理系统，支持客户信息、商机、合同、销售线索管理',
    lastSyncTime: '2026-07-07 07:00:00',
    version: 'v3.0.5',
    apiCount: 32,
    params: [
      { key: 'apiBaseUrl', label: 'API地址', type: 'text', value: 'https://crm.example.com/api/v3', required: true, description: 'CRM系统API基础地址' },
      { key: 'apiKey', label: 'API密钥', type: 'password', value: 'crm_sk_9i0j1k2l', required: true, description: '接口认证密钥' },
      { key: 'tenantId', label: '租户ID', type: 'text', value: 'tenant_001', required: true, description: '多租户模式下的租户标识' },
      { key: 'callbackUrl', label: '回调地址', type: 'text', value: 'https://ai-platform.example.com/callback/crm', required: false, description: '客户变动回调地址' },
      { key: 'timeout', label: '超时时间(ms)', type: 'number', value: '5000', required: false, description: '请求超时时间' },
      { key: 'syncMode', label: '同步模式', type: 'select', value: 'realtime', required: false, description: '数据同步模式', options: ['realtime', 'batch', 'schedule'] }
    ]
  },
  {
    id: 8,
    name: '资产管理系统',
    code: 'ASSET_SYSTEM',
    type: 'api',
    category: '资产管理',
    status: 'online',
    enabled: true,
    icon: 'Message',
    description: '企业资产管理系统，支持资产登记、盘点、调拨、报废全生命周期管理',
    lastSyncTime: '2026-07-07 12:00:00',
    version: 'v1.5.0',
    apiCount: 8,
    params: [
      { key: 'apiBaseUrl', label: 'API地址', type: 'text', value: 'https://asset.example.com/api/v1', required: true, description: '资产系统API基础地址' },
      { key: 'apiKey', label: 'API密钥', type: 'password', value: 'asset_sk_m3n4o5p6', required: true, description: '接口认证密钥' },
      { key: 'depreciationMethod', label: '折旧方法', type: 'select', value: 'straight_line', required: false, description: '资产折旧计算方法', options: ['straight_line', 'double_declining', 'sum_of_years'] },
      { key: 'callbackUrl', label: '回调地址', type: 'text', value: 'https://ai-platform.example.com/callback/asset', required: false, description: '资产状态变更回调地址' },
      { key: 'timeout', label: '超时时间(ms)', type: 'number', value: '5000', required: false, description: '请求超时时间' },
      { key: 'syncMode', label: '同步模式', type: 'select', value: 'batch', required: false, description: '数据同步模式', options: ['realtime', 'batch', 'schedule'] }
    ]
  }
]

// 部门树
let departments = [
  {
    id: 1, name: '总经办', parentId: 0, sort: 1, leader: '徐总', memberCount: 5,
    children: [
      { id: 2, name: '财务部', parentId: 1, sort: 1, leader: '张财务', memberCount: 12, children: [
        { id: 21, name: '会计组', parentId: 2, sort: 1, leader: '王会计', memberCount: 6, children: [] },
        { id: 22, name: '出纳组', parentId: 2, sort: 2, leader: '李出纳', memberCount: 3, children: [] }
      ]},
      { id: 3, name: '采购部', parentId: 1, sort: 2, leader: '王采购', memberCount: 18, children: [] },
      { id: 4, name: '销售部', parentId: 1, sort: 3, leader: '赵销售', memberCount: 35, children: [
        { id: 41, name: '华东大区', parentId: 4, sort: 1, leader: '周华东', memberCount: 12, children: [] },
        { id: 42, name: '华北大区', parentId: 4, sort: 2, leader: '吴华北', memberCount: 10, children: [] },
        { id: 43, name: '华南大区', parentId: 4, sort: 3, leader: '郑华南', memberCount: 8, children: [] }
      ]},
      { id: 5, name: '研发部', parentId: 1, sort: 4, leader: '孙研发', memberCount: 22, children: [
        { id: 51, name: '前端组', parentId: 5, sort: 1, leader: '钱前端', memberCount: 6, children: [] },
        { id: 52, name: '后端组', parentId: 5, sort: 2, leader: '冯后端', memberCount: 8, children: [] },
        { id: 53, name: 'AI算法组', parentId: 5, sort: 3, leader: '陈算法', memberCount: 5, children: [] }
      ]},
      { id: 6, name: '行政部', parentId: 1, sort: 5, leader: '周行政', memberCount: 8, children: [] },
      { id: 7, name: '法务部', parentId: 1, sort: 6, leader: '李法务', memberCount: 6, children: [] }
    ]
  }
]

// 岗位列表
const positions = [
  { id: 1, name: '总经理', departmentId: 1, departmentName: '总经办', level: 1, permissions: ['*'] },
  { id: 2, name: '财务经理', departmentId: 2, departmentName: '财务部', level: 2, permissions: ['expense:audit', 'expense:approve', 'contract:audit'] },
  { id: 3, name: '会计', departmentId: 21, departmentName: '会计组', level: 3, permissions: ['expense:create', 'expense:read'] },
  { id: 4, name: '出纳', departmentId: 22, departmentName: '出纳组', level: 3, permissions: ['expense:pay', 'expense:read'] },
  { id: 5, name: '采购经理', departmentId: 3, departmentName: '采购部', level: 2, permissions: ['contract:approve', 'procurement:approve'] },
  { id: 6, name: '采购专员', departmentId: 3, departmentName: '采购部', level: 3, permissions: ['contract:create', 'procurement:create'] },
  { id: 7, name: '销售经理', departmentId: 4, departmentName: '销售部', level: 2, permissions: ['contract:approve', 'sale:read'] },
  { id: 8, name: '销售代表', departmentId: 4, departmentName: '销售部', level: 3, permissions: ['contract:create', 'sale:create'] },
  { id: 9, name: '研发经理', departmentId: 5, departmentName: '研发部', level: 2, permissions: ['system:manage', 'llm:manage'] },
  { id: 10, name: '前端工程师', departmentId: 51, departmentName: '前端组', level: 3, permissions: ['system:read'] },
  { id: 11, name: '后端工程师', departmentId: 52, departmentName: '后端组', level: 3, permissions: ['system:read'] },
  { id: 12, name: '行政经理', departmentId: 6, departmentName: '行政部', level: 2, permissions: ['asset:approve', 'user:read'] },
  { id: 13, name: '法务经理', departmentId: 7, departmentName: '法务部', level: 2, permissions: ['contract:audit', 'contract:approve'] }
]

// 用户列表
let users = [
  { id: 1, username: 'admin', realName: '系统管理员', email: 'admin@jinmailang.com', phone: '13800000001', department: '研发部', departmentId: 5, position: '研发经理', role: 'admin', status: 'active', lastLogin: '2026-07-06 09:15:23', createdAt: '2025-01-01 10:00:00' },
  { id: 2, username: 'caiwu', realName: '张财务', email: 'zhangcw@jinmailang.com', phone: '13800000002', department: '财务部', departmentId: 2, position: '财务经理', role: 'manager', status: 'active', lastLogin: '2026-07-06 09:18:45', createdAt: '2025-01-05 10:00:00' },
  { id: 3, username: 'fawu', realName: '李法务', email: 'lifw@jinmailang.com', phone: '13800000003', department: '法务部', departmentId: 7, position: '法务经理', role: 'manager', status: 'active', lastLogin: '2026-07-06 11:52:34', createdAt: '2025-01-08 10:00:00' },
  { id: 4, username: 'caigou', realName: '王采购', email: 'wangcg@jinmailang.com', phone: '13800000004', department: '采购部', departmentId: 3, position: '采购专员', role: 'user', status: 'active', lastLogin: '2026-07-06 10:45:20', createdAt: '2025-01-10 10:00:00' },
  { id: 5, username: 'xiaoshou', realName: '赵销售', email: 'zhaos@jinmailang.com', phone: '13800000005', department: '销售部', departmentId: 4, position: '销售经理', role: 'manager', status: 'active', lastLogin: '2026-07-06 08:55:11', createdAt: '2025-01-12 10:00:00' },
  { id: 6, username: 'yanfa', realName: '孙研发', email: 'sunyf@jinmailang.com', phone: '13800000006', department: '研发部', departmentId: 5, position: '后端工程师', role: 'user', status: 'active', lastLogin: '2026-07-06 09:02:35', createdAt: '2025-01-15 10:00:00' },
  { id: 7, username: 'xingzheng', realName: '周行政', email: 'zhouxz@jinmailang.com', phone: '13800000007', department: '行政部', departmentId: 6, position: '行政经理', role: 'manager', status: 'active', lastLogin: '2026-07-06 09:30:18', createdAt: '2025-01-18 10:00:00' },
  { id: 8, username: 'jingli', realName: '吴经理', email: 'wujl@jinmailang.com', phone: '13800000008', department: '总经办', departmentId: 1, position: '总经理', role: 'admin', status: 'active', lastLogin: '2026-07-06 13:45:30', createdAt: '2025-01-01 10:00:00' },
  { id: 9, username: 'qianqianduan', realName: '钱前端', email: 'qianqd@jinmailang.com', phone: '13800000009', department: '研发部', departmentId: 5, position: '前端工程师', role: 'user', status: 'active', lastLogin: '2026-07-05 18:22:45', createdAt: '2025-02-01 10:00:00' },
  { id: 10, username: 'fenghouduan', realName: '冯后端', email: 'fenghd@jinmailang.com', phone: '13800000010', department: '研发部', departmentId: 5, position: '后端工程师', role: 'user', status: 'active', lastLogin: '2026-07-05 19:10:33', createdAt: '2025-02-03 10:00:00' },
  { id: 11, username: 'chensuanfa', realName: '陈算法', email: 'chensf@jinmailang.com', phone: '13800000011', department: '研发部', departmentId: 5, position: 'AI算法工程师', role: 'user', status: 'active', lastLogin: '2026-07-06 08:40:15', createdAt: '2025-02-10 10:00:00' },
  { id: 12, username: 'wangkuaiji', realName: '王会计', email: 'wangkj@jinmailang.com', phone: '13800000012', department: '财务部', departmentId: 2, position: '会计', role: 'user', status: 'active', lastLogin: '2026-07-06 09:05:22', createdAt: '2025-02-15 10:00:00' },
  { id: 13, username: 'lichuna', realName: '李出纳', email: 'licn@jinmailang.com', phone: '13800000013', department: '财务部', departmentId: 2, position: '出纳', role: 'user', status: 'active', lastLogin: '2026-07-06 09:12:08', createdAt: '2025-02-18 10:00:00' },
  { id: 14, username: 'zhouhuadong', realName: '周华东', email: 'zhouhd@jinmailang.com', phone: '13800000014', department: '销售部', departmentId: 4, position: '销售代表', role: 'user', status: 'active', lastLogin: '2026-07-06 08:32:55', createdAt: '2025-03-01 10:00:00' },
  { id: 15, username: 'wuhuabei', realName: '吴华北', email: 'wuhb@jinmailang.com', phone: '13800000015', department: '销售部', departmentId: 4, position: '销售代表', role: 'user', status: 'disabled', lastLogin: '2026-06-28 17:45:30', createdAt: '2025-03-05 10:00:00' },
  { id: 16, username: 'zhenghuanan', realName: '郑华南', email: 'zhenghn@jinmailang.com', phone: '13800000016', department: '销售部', departmentId: 4, position: '销售代表', role: 'user', status: 'active', lastLogin: '2026-07-05 17:20:18', createdAt: '2025-03-10 10:00:00' },
  { id: 17, username: 'chenfangan', realName: '陈方案', email: 'chenfa@jinmailang.com', phone: '13800000017', department: '研发部', departmentId: 5, position: '产品经理', role: 'user', status: 'active', lastLogin: '2026-07-06 09:22:15', createdAt: '2025-03-15 10:00:00' },
  { id: 18, username: 'weicaiwu', realName: '魏财务', email: 'weicw@jinmailang.com', phone: '13800000018', department: '财务部', departmentId: 2, position: '会计', role: 'user', status: 'active', lastLogin: '2026-07-06 08:50:33', createdAt: '2025-03-20 10:00:00' },
  { id: 19, username: 'huangcg', realName: '黄采购', email: 'huangcg@jinmailang.com', phone: '13800000019', department: '采购部', departmentId: 3, position: '采购专员', role: 'user', status: 'active', lastLogin: '2026-07-06 09:15:08', createdAt: '2025-04-01 10:00:00' },
  { id: 20, username: 'linxiao', realName: '林销售', email: 'linxs@jinmailang.com', phone: '13800000020', department: '销售部', departmentId: 43, position: '销售代表', role: 'user', status: 'active', lastLogin: '2026-07-06 08:35:42', createdAt: '2025-04-10 10:00:00' },
  { id: 21, username: 'hezhaoli', realName: '何助理', email: 'hezl@jinmailang.com', phone: '13800000021', department: '行政部', departmentId: 6, position: '行政助理', role: 'user', status: 'active', lastLogin: '2026-07-05 18:10:25', createdAt: '2025-04-15 10:00:00' },
  { id: 22, username: 'yangfawu', realName: '杨法务', email: 'yangfw@jinmailang.com', phone: '13800000022', department: '法务部', departmentId: 7, position: '法务专员', role: 'user', status: 'disabled', lastLogin: '2026-06-30 17:30:15', createdAt: '2025-05-01 10:00:00' }
]

// 角色列表
let roles = [
  {
    id: 1, name: '系统管理员', code: 'admin', description: '拥有系统所有权限，可管理用户、角色、配置等',
    userCount: 2, dataScope: 'all',
    permissions: ['*']
  },
  {
    id: 2, name: '审批人', code: 'approver', description: '负责审批待办、报销、合同等业务',
    userCount: 4, dataScope: 'department',
    permissions: ['todo:approve', 'todo:read', 'expense:audit', 'expense:approve', 'contract:audit', 'contract:approve', 'dashboard:read']
  },
  {
    id: 3, name: '申请人', code: 'applicant', description: '普通业务发起人，可创建报销、合同等',
    userCount: 8, dataScope: 'self',
    permissions: ['todo:read', 'todo:create', 'expense:create', 'expense:read', 'contract:create', 'contract:read']
  },
  {
    id: 4, name: '财务', code: 'finance', description: '财务专属角色，可管理报销、付款等',
    userCount: 3, dataScope: 'department',
    permissions: ['expense:audit', 'expense:approve', 'expense:pay', 'expense:read', 'expense:export', 'dashboard:read']
  },
  {
    id: 5, name: '法务', code: 'legal', description: '法务专属角色，负责合同审核与归档',
    userCount: 2, dataScope: 'department',
    permissions: ['contract:audit', 'contract:approve', 'contract:read', 'contract:export', 'contract:archive', 'dashboard:read']
  }
]

// 权限树
const permissionsTree = [
  {
    id: 100, name: '待办中心', code: 'todo', type: 'menu',
    children: [
      { id: 101, name: '查看待办', code: 'todo:read', type: 'api' },
      { id: 102, name: '创建待办', code: 'todo:create', type: 'api' },
      { id: 103, name: '审批待办', code: 'todo:approve', type: 'button' },
      { id: 104, name: '驳回待办', code: 'todo:reject', type: 'button' },
      { id: 105, name: '导出待办', code: 'todo:export', type: 'button' }
    ]
  },
  {
    id: 200, name: '审批台', code: 'approval', type: 'menu',
    children: [
      { id: 201, name: '查看审批', code: 'approval:read', type: 'api' },
      { id: 202, name: '审批通过', code: 'approval:approve', type: 'button' },
      { id: 203, name: '审批驳回', code: 'approval:reject', type: 'button' },
      { id: 204, name: '转交审批', code: 'approval:transfer', type: 'button' }
    ]
  },
  {
    id: 300, name: 'AI审核', code: 'ai', type: 'menu',
    children: [
      { id: 301, name: 'AI摘要生成', code: 'ai:summary', type: 'api' },
      { id: 302, name: 'AI风险识别', code: 'ai:risk', type: 'api' },
      { id: 303, name: 'AI意见生成', code: 'ai:opinion', type: 'api' },
      { id: 304, name: 'AI准确率查看', code: 'ai:accuracy', type: 'button' }
    ]
  },
  {
    id: 400, name: '报销管理', code: 'expense', type: 'menu',
    children: [
      { id: 401, name: '查看报销', code: 'expense:read', type: 'api' },
      { id: 402, name: '创建报销', code: 'expense:create', type: 'api' },
      { id: 403, name: '审核报销', code: 'expense:audit', type: 'button' },
      { id: 404, name: '审批报销', code: 'expense:approve', type: 'button' },
      { id: 405, name: '付款', code: 'expense:pay', type: 'button' },
      { id: 406, name: '导出报销', code: 'expense:export', type: 'button' }
    ]
  },
  {
    id: 500, name: '合同管理', code: 'contract', type: 'menu',
    children: [
      { id: 501, name: '查看合同', code: 'contract:read', type: 'api' },
      { id: 502, name: '创建合同', code: 'contract:create', type: 'api' },
      { id: 503, name: '审核合同', code: 'contract:audit', type: 'button' },
      { id: 504, name: '审批合同', code: 'contract:approve', type: 'button' },
      { id: 505, name: '归档合同', code: 'contract:archive', type: 'button' },
      { id: 506, name: '导出合同', code: 'contract:export', type: 'button' }
    ]
  },
  {
    id: 600, name: '驾驶舱', code: 'dashboard', type: 'menu',
    children: [
      { id: 601, name: '查看驾驶舱', code: 'dashboard:read', type: 'api' },
      { id: 602, name: '导出报表', code: 'dashboard:export', type: 'button' }
    ]
  },
  {
    id: 700, name: '大模型管理', code: 'llm', type: 'menu',
    children: [
      { id: 701, name: '查看模型', code: 'llm:read', type: 'api' },
      { id: 702, name: '新增模型', code: 'llm:create', type: 'button' },
      { id: 703, name: '修改模型', code: 'llm:update', type: 'button' },
      { id: 704, name: '删除模型', code: 'llm:delete', type: 'button' },
      { id: 705, name: '调用测试', code: 'llm:test', type: 'button' }
    ]
  },
  {
    id: 800, name: '连接器管理', code: 'connector', type: 'menu',
    children: [
      { id: 801, name: '查看连接器', code: 'connector:read', type: 'api' },
      { id: 802, name: '新增连接器', code: 'connector:create', type: 'button' },
      { id: 803, name: '修改连接器', code: 'connector:update', type: 'button' },
      { id: 804, name: '删除连接器', code: 'connector:delete', type: 'button' },
      { id: 805, name: '同步数据', code: 'connector:sync', type: 'button' }
    ]
  },
  {
    id: 900, name: '数据问答', code: 'dataChat', type: 'menu',
    children: [
      { id: 901, name: '发起问答', code: 'dataChat:ask', type: 'api' },
      { id: 902, name: '查看历史', code: 'dataChat:history', type: 'api' },
      { id: 903, name: '导出结果', code: 'dataChat:export', type: 'button' }
    ]
  },
  {
    id: 1000, name: '系统管理', code: 'system', type: 'menu',
    children: [
      { id: 1001, name: '数据安全配置', code: 'system:security', type: 'button' },
      { id: 1002, name: '访问安全配置', code: 'system:access', type: 'button' },
      { id: 1003, name: '审计日志查看', code: 'system:audit', type: 'button' },
      { id: 1004, name: '运维监控查看', code: 'system:monitor', type: 'button' },
      { id: 1005, name: '部门管理', code: 'system:department', type: 'button' },
      { id: 1006, name: '用户管理', code: 'system:user', type: 'button' },
      { id: 1007, name: '角色管理', code: 'system:role', type: 'button' },
      { id: 1008, name: '权限分配', code: 'system:permission', type: 'button' }
    ]
  }
]

// 角色权限映射
let rolePermissionsMap: Record<number, number[]> = {
  1: [101, 102, 103, 104, 105, 201, 202, 203, 204, 301, 302, 303, 304, 401, 402, 403, 404, 405, 406, 501, 502, 503, 504, 505, 506, 601, 602, 701, 702, 703, 704, 705, 801, 802, 803, 804, 805, 901, 902, 903, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008],
  2: [101, 103, 104, 105, 201, 202, 203, 204, 301, 302, 303, 401, 403, 404, 501, 503, 504, 601],
  3: [101, 102, 401, 402, 501, 502],
  4: [101, 401, 403, 404, 405, 406, 601],
  5: [101, 501, 503, 504, 505, 506, 601]
}

// ============================================================
// 工具函数
// ============================================================

function paginate<T>(list: T[], query: any): { list: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const page = parseInt(query?.page) || 1
  const pageSize = parseInt(query?.pageSize) || 10
  const start = (page - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
    totalPages: Math.ceil(list.length / pageSize)
  }
}

// ============================================================
// systemAdminService 对象
// ============================================================

export const systemAdminService = {
  // ----------------------------------------------------------
  // A. 数据安全
  // ----------------------------------------------------------
  async getSecurityConfig(): Promise<any> {
    return JSON.parse(JSON.stringify(securityConfig))
  },

  async updateSecurityConfig(data: any): Promise<any> {
    securityConfig = { ...securityConfig, ...data }
    return JSON.parse(JSON.stringify(securityConfig))
  },

  // ----------------------------------------------------------
  // B. 访问安全
  // ----------------------------------------------------------
  async getAccessConfig(): Promise<any> {
    return JSON.parse(JSON.stringify(accessConfig))
  },

  async updateAccessConfig(data: any): Promise<any> {
    accessConfig = { ...accessConfig, ...data }
    return JSON.parse(JSON.stringify(accessConfig))
  },

  // ----------------------------------------------------------
  // C. 审计与合规
  // ----------------------------------------------------------
  async getAuditLogs(query: any): Promise<any> {
    let list = [...auditLogs]
    // 支持按 action / module / status 过滤
    if (query?.action) list = list.filter(item => item.action === query.action)
    if (query?.module) list = list.filter(item => item.module === query.module)
    if (query?.status) list = list.filter(item => item.status === query.status)
    if (query?.userName) list = list.filter(item => item.userName.includes(query.userName))
    return paginate(list, query)
  },

  async getDataAccessLogs(query: any): Promise<any> {
    let list = [...dataAccessLogs]
    if (query?.dataType) list = list.filter(item => item.dataType === query.dataType)
    if (query?.operation) list = list.filter(item => item.operation === query.operation)
    if (query?.riskLevel) list = list.filter(item => item.riskLevel === query.riskLevel)
    if (query?.userName) list = list.filter(item => item.userName.includes(query.userName))
    return paginate(list, query)
  },

  async getAuditStats(): Promise<any> {
    const today = '2026-07-06'
    const todayOperations = auditLogs.filter(l => l.timestamp.startsWith(today)).length
    const todayFailed = auditLogs.filter(l => l.timestamp.startsWith(today) && l.status === 'fail').length

    // 计算近7天操作数（Mock 简化：用总数近似）
    const weekOperations = auditLogs.length + 128

    const highRiskAccess = dataAccessLogs.filter(l => l.riskLevel === 'high').length

    // 按模块统计
    const moduleMap: Record<string, number> = {}
    auditLogs.forEach(l => {
      moduleMap[l.module] = (moduleMap[l.module] || 0) + 1
    })
    const byModule = Object.keys(moduleMap).map(k => ({ module: k, count: moduleMap[k] }))

    // 按操作类型统计
    const actionMap: Record<string, number> = {}
    auditLogs.forEach(l => {
      actionMap[l.action] = (actionMap[l.action] || 0) + 1
    })
    const byAction = Object.keys(actionMap).map(k => ({ action: k, count: actionMap[k] }))

    return {
      todayOperations,
      todayFailed,
      weekOperations,
      highRiskAccess,
      byModule,
      byAction
    }
  },

  // ----------------------------------------------------------
  // D. 运维监控
  // ----------------------------------------------------------
  async getSystemMonitor(): Promise<any> {
    return {
      cpu: { usage: 35.6, cores: 8, model: 'Intel Xeon E5' },
      memory: { total: 32, used: 18.5, usage: 57.8 },
      disk: { total: 500, used: 234, usage: 46.8 },
      network: { inSpeed: 12.5, outSpeed: 8.3 },
      container: { total: 12, running: 10, stopped: 2 }
    }
  },

  async getAppMonitor(): Promise<any> {
    return {
      api: {
        totalRequests: 15420,
        avgResponse: 125,
        errorRate: 0.3,
        qps: 42
      },
      slowApis: [
        { path: '/api/ai/audit/summary', avgTime: '2.3s', calls: 156 },
        { path: '/api/todos', avgTime: '45ms', calls: 3420 },
        { path: '/api/contracts/list', avgTime: '320ms', calls: 856 },
        { path: '/api/expenses/export', avgTime: '1.8s', calls: 42 }
      ],
      topApis: [
        { path: '/api/todos', calls: 3420, avgTime: '45ms' },
        { path: '/api/dashboard/overview', calls: 2180, avgTime: '120ms' },
        { path: '/api/approvals/list', calls: 1850, avgTime: '85ms' },
        { path: '/api/auth/info', calls: 1620, avgTime: '32ms' },
        { path: '/api/expenses/list', calls: 1340, avgTime: '110ms' }
      ]
    }
  },

  async getLogs(query: any): Promise<any> {
    let list = [...systemLogs]
    if (query?.level) list = list.filter(item => item.level === query.level)
    if (query?.module) list = list.filter(item => item.module === query.module)
    if (query?.keyword) list = list.filter(item => item.message.includes(query.keyword))
    return paginate(list, query)
  },

  async getAlerts(): Promise<any> {
    return alerts
  },

  async getAlertConfig(): Promise<any> {
    return JSON.parse(JSON.stringify(alertConfig))
  },

  // ----------------------------------------------------------
  // E. 组织架构管理
  // ----------------------------------------------------------
  async getDepartments(): Promise<any> {
    return JSON.parse(JSON.stringify(departments))
  },

  async createDepartment(data: any): Promise<any> {
    const newId = Date.now()
    const newDept: any = {
      id: newId,
      name: data.name,
      parentId: data.parentId || 0,
      sort: data.sort || 99,
      leader: data.leader || '',
      memberCount: 0,
      children: []
    }
    if (data.parentId && data.parentId !== 0) {
      // 找到父节点
      const findAndPush = (nodes: any[]): boolean => {
        for (const node of nodes) {
          if (node.id === data.parentId) {
            node.children = node.children || []
            node.children.push(newDept)
            return true
          }
          if (node.children && node.children.length > 0) {
            if (findAndPush(node.children)) return true
          }
        }
        return false
      }
      findAndPush(departments)
    } else {
      departments.push(newDept)
    }
    return newDept
  },

  async updateDepartment(id: number, data: any): Promise<any> {
    let updated: any = null
    const findAndUpdate = (nodes: any[]): boolean => {
      for (const node of nodes) {
        if (node.id === id) {
          Object.assign(node, data)
          updated = node
          return true
        }
        if (node.children && node.children.length > 0) {
          if (findAndUpdate(node.children)) return true
        }
      }
      return false
    }
    findAndUpdate(departments)
    return updated
  },

  async deleteDepartment(id: number): Promise<any> {
    const findAndDelete = (nodes: any[]): boolean => {
      const idx = nodes.findIndex(n => n.id === id)
      if (idx !== -1) {
        nodes.splice(idx, 1)
        return true
      }
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          if (findAndDelete(node.children)) return true
        }
      }
      return false
    }
    findAndDelete(departments)
    return { id }
  },

  async getPositions(): Promise<any> {
    return positions
  },

  async getUsers(query: any): Promise<any> {
    let list = [...users]
    if (query?.department) list = list.filter(u => u.department === query.department)
    if (query?.role) list = list.filter(u => u.role === query.role)
    if (query?.status) list = list.filter(u => u.status === query.status)
    if (query?.keyword) {
      const kw = query.keyword
      list = list.filter(u => u.username.includes(kw) || u.realName.includes(kw) || u.email.includes(kw))
    }
    return paginate(list, query)
  },

  async createUser(data: any): Promise<any> {
    const newId = Math.max(...users.map(u => u.id)) + 1
    const newUser = {
      id: newId,
      username: data.username,
      realName: data.realName,
      email: data.email || '',
      phone: data.phone || '',
      department: data.department || '',
      departmentId: data.departmentId || 0,
      position: data.position || '',
      role: data.role || 'user',
      status: 'active',
      lastLogin: '',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
    users.push(newUser)
    return newUser
  },

  async updateUser(id: number, data: any): Promise<any> {
    const user = users.find(u => u.id === id)
    if (!user) return null
    Object.assign(user, data)
    return user
  },

  async toggleUserStatus(id: number): Promise<any> {
    const user = users.find(u => u.id === id)
    if (!user) return null
    user.status = user.status === 'active' ? 'disabled' : 'active'
    return user
  },

  // ----------------------------------------------------------
  // F. 角色权限管理
  // ----------------------------------------------------------
  async getRoles(): Promise<any> {
    return JSON.parse(JSON.stringify(roles))
  },

  async createRole(data: any): Promise<any> {
    const newId = Math.max(...roles.map(r => r.id)) + 1
    const newRole = {
      id: newId,
      name: data.name,
      code: data.code,
      description: data.description || '',
      userCount: 0,
      dataScope: data.dataScope || 'self',
      permissions: data.permissions || []
    }
    roles.push(newRole)
    rolePermissionsMap[newId] = []
    return newRole
  },

  async updateRole(id: number, data: any): Promise<any> {
    const role = roles.find(r => r.id === id)
    if (!role) return null
    Object.assign(role, data)
    return role
  },

  async deleteRole(id: number): Promise<any> {
    const idx = roles.findIndex(r => r.id === id)
    if (idx === -1) return null
    roles.splice(idx, 1)
    delete rolePermissionsMap[id]
    return { id }
  },

  async getPermissions(): Promise<any> {
    return JSON.parse(JSON.stringify(permissionsTree))
  },

  async getRolePermissions(roleId: number): Promise<any> {
    return rolePermissionsMap[roleId] || []
  },

  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<any> {
    rolePermissionsMap[roleId] = permissionIds
    // 同步更新角色 permissions 字段
    const role = roles.find(r => r.id === roleId)
    if (role) {
      // 把权限 ID 翻译成 code
      const flatCodes: string[] = []
      const collectCodes = (nodes: any[]) => {
        nodes.forEach(n => {
          if (permissionIds.includes(n.id) && n.code) {
            flatCodes.push(n.code)
          }
          if (n.children && n.children.length > 0) collectCodes(n.children)
        })
      }
      collectCodes(permissionsTree)
      role.permissions = flatCodes
    }
    return { roleId, permissionIds }
  },

  // ----------------------------------------------------------
  // 系统日志管理
  // ----------------------------------------------------------

  // 登录日志
  async getLoginLogs(query: any = {}): Promise<any> {
    let list = [...loginLogs]
    const page = parseInt(query.page || '1', 10)
    const pageSize = parseInt(query.pageSize || '10', 10)
    if (query.status) list = list.filter(l => l.status === query.status)
    if (query.action) list = list.filter(l => l.action === query.action)
    if (query.keyword) {
      const kw = String(query.keyword).toLowerCase()
      list = list.filter(l => l.userName.toLowerCase().includes(kw) || l.ip.includes(kw))
    }
    list.sort((a, b) => b.id - a.id)
    const total = list.length
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total, page, pageSize }
  },

  // 操作日志
  async getOperationLogs(query: any = {}): Promise<any> {
    let list = [...auditLogs]
    const page = parseInt(query.page || '1', 10)
    const pageSize = parseInt(query.pageSize || '10', 10)
    if (query.module) list = list.filter(l => l.module === query.module)
    if (query.action) list = list.filter(l => l.action === query.action)
    if (query.status) list = list.filter(l => l.status === query.status)
    if (query.keyword) {
      const kw = String(query.keyword).toLowerCase()
      list = list.filter(l => l.userName.toLowerCase().includes(kw) || l.detail.toLowerCase().includes(kw))
    }
    const total = list.length
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total, page, pageSize }
  },

  // 接口调用日志
  async getApiCallLogs(query: any = {}): Promise<any> {
    let list = [...apiCallLogs]
    const page = parseInt(query.page || '1', 10)
    const pageSize = parseInt(query.pageSize || '10', 10)
    if (query.method) list = list.filter(l => l.method === query.method)
    if (query.status) {
      const s = parseInt(query.status, 10)
      if (s === 200) list = list.filter(l => l.status === 200)
      else if (s === 500) list = list.filter(l => l.status >= 500)
      else if (s === 400) list = list.filter(l => l.status >= 400 && l.status < 500)
    }
    if (query.keyword) {
      const kw = String(query.keyword).toLowerCase()
      list = list.filter(l => l.path.toLowerCase().includes(kw) || l.userName.toLowerCase().includes(kw))
    }
    list.sort((a, b) => b.id - a.id)
    const total = list.length
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total, page, pageSize }
  },

  // 异常错误日志
  async getErrorLogs(query: any = {}): Promise<any> {
    let list = [...errorLogs]
    const page = parseInt(query.page || '1', 10)
    const pageSize = parseInt(query.pageSize || '10', 10)
    if (query.level) list = list.filter(l => l.level === query.level)
    if (query.module) list = list.filter(l => l.module === query.module)
    if (query.resolved !== undefined && query.resolved !== '') {
      const r = query.resolved === 'true' || query.resolved === true
      list = list.filter(l => l.resolved === r)
    }
    if (query.keyword) {
      const kw = String(query.keyword).toLowerCase()
      list = list.filter(l => l.message.toLowerCase().includes(kw) || l.errorCode.toLowerCase().includes(kw) || l.traceId.toLowerCase().includes(kw))
    }
    list.sort((a, b) => b.id - a.id)
    const total = list.length
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total, page, pageSize }
  },

  // 日志统计
  async getLogStats(): Promise<any> {
    return {
      login: { total: loginLogs.length, success: loginLogs.filter(l => l.status === 'success').length, fail: loginLogs.filter(l => l.status === 'fail').length },
      operation: { total: auditLogs.length, success: auditLogs.filter(l => l.status === 'success').length, fail: auditLogs.filter(l => l.status === 'fail').length },
      apiCall: { total: apiCallLogs.length, success: apiCallLogs.filter(l => l.status === 200).length, error: apiCallLogs.filter(l => l.status >= 400).length, avgDuration: Math.round(apiCallLogs.reduce((s, l) => s + l.duration, 0) / apiCallLogs.length) },
      error: { total: errorLogs.length, fatal: errorLogs.filter(l => l.level === 'fatal').length, error: errorLogs.filter(l => l.level === 'error').length, warn: errorLogs.filter(l => l.level === 'warn').length, unresolved: errorLogs.filter(l => !l.resolved).length }
    }
  },

  // ============================================================
  // G. 第三方系统管理
  // ============================================================

  getThirdPartySystems() {
    return thirdPartySystems.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      type: s.type,
      category: s.category,
      status: s.status,
      enabled: s.enabled,
      icon: s.icon,
      description: s.description,
      lastSyncTime: s.lastSyncTime,
      version: s.version,
      apiCount: s.apiCount
    }))
  },

  getThirdPartySystemDetail(id: number) {
    const system = thirdPartySystems.find(s => s.id === id)
    if (!system) throw new Error('系统不存在')
    return system
  },

  updateThirdPartySystemConfig(id: number, config: any) {
    const system = thirdPartySystems.find(s => s.id === id)
    if (!system) throw new Error('系统不存在')
    // 更新参数
    if (config.params) {
      for (const [key, value] of Object.entries(config.params)) {
        const param = system.params.find(p => p.key === key)
        if (param) param.value = value as string
      }
    }
    return system
  },

  testThirdPartyConnection(id: number) {
    const system = thirdPartySystems.find(s => s.id === id)
    if (!system) throw new Error('系统不存在')
    // Mock 测试结果
    const success = system.enabled && Math.random() > 0.15
    return {
      systemId: id,
      systemName: system.name,
      success,
      message: success ? `连接 ${system.name} 成功，响应时间 ${(Math.floor(Math.random() * 200) + 50)}ms` : `连接 ${system.name} 失败：超时或认证错误`,
      responseTime: success ? Math.floor(Math.random() * 200) + 50 : null,
      testTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: success ? {
        apiVersion: system.version,
        supportedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        rateLimit: system.params.find(p => p.key === 'rateLimit')?.value || '100/min'
      } : {
        errorCode: 'ETIMEDOUT',
        suggestion: '请检查API地址和认证参数是否正确'
      }
    }
  },

  createThirdPartySystem(data: {
    name: string
    code: string
    type: 'api' | 'sdk' | 'database'
    category: string
    icon: string
    description: string
    version?: string
    params?: Array<{
      key: string
      label: string
      type: 'text' | 'password' | 'number' | 'select'
      value: string
      required: boolean
      description: string
      options?: string[]
    }>
  }) {
    const newId = thirdPartySystems.length > 0
      ? Math.max(...thirdPartySystems.map(s => s.id)) + 1
      : 1
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newSystem = {
      id: newId,
      name: data.name,
      code: data.code,
      type: data.type,
      category: data.category,
      status: 'offline' as const,
      enabled: false,
      icon: data.icon || 'Connection',
      description: data.description,
      lastSyncTime: now,
      version: data.version || 'v1.0.0',
      apiCount: 0,
      params: data.params || []
    }
    thirdPartySystems.push(newSystem)
    return newSystem
  },

  toggleThirdPartySystem(id: number) {
    const system = thirdPartySystems.find(s => s.id === id)
    if (!system) throw new Error('系统不存在')
    system.enabled = !system.enabled
    system.status = system.enabled ? 'online' : 'offline'
    return { id, enabled: system.enabled, status: system.status }
  }
}

export default systemAdminService

-- =============================================================================
-- 道一云 AI 协同中台 Demo - 种子数据
-- Database: ai_platform_demo
-- 说明: 所有用户密码均为 admin123
--       bcrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- =============================================================================

USE ai_platform_demo;

-- 关闭外键检查避免依赖顺序问题
SET FOREIGN_KEY_CHECKS = 0;

-- 清空表数据(便于重复执行)
TRUNCATE TABLE system_logs;
TRUNCATE TABLE budgets;
TRUNCATE TABLE expense_reports;
TRUNCATE TABLE contracts;
TRUNCATE TABLE audit_rules;
TRUNCATE TABLE form_templates;
TRUNCATE TABLE workflows;
TRUNCATE TABLE approval_records;
TRUNCATE TABLE todos;
TRUNCATE TABLE users;
TRUNCATE TABLE departments;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. 部门数据
-- -----------------------------------------------------------------------------
INSERT INTO `departments` (`id`, `name`, `parent_id`, `sort`) VALUES
  (1, '总经办',  0, 1),
  (2, '财务部',  0, 2),
  (3, '采购部',  0, 3),
  (4, '法务部',  0, 4);

-- -----------------------------------------------------------------------------
-- 2. 用户数据 (密码统一为 admin123)
-- -----------------------------------------------------------------------------
INSERT INTO `users`
  (`id`, `username`, `password`, `real_name`, `avatar`, `email`, `phone`, `department_id`, `role`, `status`, `wecom_user_id`)
VALUES
  (1, 'admin',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '管理员',   '/avatars/admin.png',    'admin@jinmailang.com',    '13800000001', 1, 'admin',     1, 'wecom_admin'),
  (2, 'zhangsan', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '张三',     '/avatars/zhangsan.png', 'zhangsan@jinmailang.com', '13800000002', 2, 'approver',  1, 'wecom_zhangsan'),
  (3, 'lisi',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '李四',     '/avatars/lisi.png',     'lisi@jinmailang.com',     '13800000003', 3, 'applicant', 1, 'wecom_lisi'),
  (4, 'wangwu',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '王五',     '/avatars/wangwu.png',   'wangwu@jinmailang.com',   '13800000004', 4, 'legal',     1, 'wecom_wangwu'),
  (5, 'zhaoliu',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '赵六',     '/avatars/zhaoliu.png',  'zhaoliu@jinmailang.com',  '13800000005', 2, 'finance',   1, 'wecom_zhaoliu');

-- -----------------------------------------------------------------------------
-- 3. 待办数据 (20条, 覆盖5种类型, 含超时/紧急标记)
--    类型: contract/expense/procurement/project/asset
-- -----------------------------------------------------------------------------
INSERT INTO `todos`
  (`id`, `title`, `source`, `type`, `priority`, `amount`, `applicant_id`, `applicant_name`, `department`, `status`, `is_timeout`, `is_urgent`, `submitted_at`, `due_at`)
VALUES
  -- 合同审批 4 条
  (1,  '华北大区面粉采购合同审批',          'ERP',  'contract',     'urgent', 1280000.00, 3, '李四', '采购部', 'pending',    1, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (2,  '物流运输服务外包合同审批',          'OA',   'contract',     'high',   680000.00,  3, '李四', '采购部', 'pending',    0, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY)),
  (3,  '办公场地租赁合同续签审批',          'OA',   'contract',     'normal', 360000.00,  2, '张三', '财务部', 'approved',   0, 0, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (4,  '设备维保服务合同审批',              'ERP',  'contract',     'low',    120000.00,  3, '李四', '采购部', 'rejected',   0, 0, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

  -- 费用报销 4 条
  (5,  '市场部三季度客户答谢宴报销',        '财务', 'expense',      'high',   18600.00,   3, '李四', '采购部', 'pending',    1, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (6,  '差旅费报销-上海供应商拜访',         'OA',   'expense',      'normal',  8320.50,   3, '李四', '采购部', 'pending',    0, 0, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY)),
  (7,  '办公用品采购报销',                  'OA',   'expense',      'low',     2360.00,   3, '李四', '采购部', 'approved',   0, 0, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (8,  '行业峰会参会费用报销',              'OA',   'expense',      'urgent', 45800.00,   2, '张三', '财务部', 'transferred',0, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY)),

  -- 采购申请 4 条
  (9,  '生产线自动化改造设备采购申请',      'ERP',  'procurement',  'urgent', 2680000.00, 3, '李四', '采购部', 'pending',    1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY)),
  (10, '包装材料季度采购申请',              'ERP',  'procurement',  'high',   856000.00,  3, '李四', '采购部', 'pending',    0, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY)),
  (11, 'IT机房服务器扩容采购申请',          'OA',   'procurement',  'normal', 326000.00,  2, '张三', '财务部', 'approved',   0, 0, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (12, '员工食堂食材采购申请',              'OA',   'procurement',  'low',     88000.00,  3, '李四', '采购部', 'rejected',   0, 0, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),

  -- 项目立项 4 条
  (13, '2026春节营销活动项目立项',          'CRM',  'project',      'high',   1280000.00, 2, '张三', '财务部', 'pending',    0, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY)),
  (14, '智能仓储系统建设项目立项',          'OA',   'project',      'normal', 960000.00,  3, '李四', '采购部', 'pending',    0, 0, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 6 DAY)),
  (15, '电商渠道拓展项目立项',              'CRM',  'project',      'urgent', 580000.00,  2, '张三', '财务部', 'approved',   0, 1, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (16, 'ISO9001质量体系认证项目立项',       'OA',   'project',      'low',    180000.00,  3, '李四', '采购部', 'rejected',   0, 0, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),

  -- 资产处置 4 条
  (17, '旧生产线设备报废处置审批',          'MES',  'asset',        'normal',  64000.00,  3, '李四', '采购部', 'pending',    0, 0, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY)),
  (18, '办公电脑资产调拨审批',              'OA',   'asset',        'low',     18600.00,  2, '张三', '财务部', 'pending',    0, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY)),
  (19, '闲置叉车资产出售审批',              'MES',  'asset',        'high',    96000.00,  3, '李四', '采购部', 'approved',   0, 0, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (20, '报废锅炉资产核销审批',              'MES',  'asset',        'urgent',  120000.00, 3, '李四', '采购部', 'pending',    1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- -----------------------------------------------------------------------------
-- 4. 审批记录 (已审批的待办对应的记录)
-- -----------------------------------------------------------------------------
INSERT INTO `approval_records`
  (`id`, `todo_id`, `approver_id`, `approver_name`, `action`, `opinion`, `ai_opinion`, `ai_risk_level`, `ai_summary`)
VALUES
  (1, 3,  2, '张三', 'approve',  '租赁合同条款合规,同意续签。',                  '合同期限3年,租金按年递增5%,无异常条款。',         'low',    '甲方为业主方,乙方为本公司,合同金额36万元,租期3年,无重大风险条款。'),
  (2, 4,  4, '王五', 'reject',   '违约责任条款过于倾向乙方,建议修改后重新提交。', '违约金条款未明确上限,存在隐性风险。',             'high',   '合同中违约责任条款对乙方约束不足,建议补充违约金上限及赔偿责任细则。'),
  (3, 7,  2, '张三', 'approve',  '办公用品采购合规,发票齐全,同意报销。',         '发票3张,金额与申请一致,符合报销标准。',           'low',    '报销金额2360元,3张发票核验通过,预算充足。'),
  (4, 8,  5, '赵六', 'transfer', '金额较大,转交财务经理复核。',                  '参会费用超部门月度预算30%,建议复核预算来源。',     'medium', '报销金额45800元,超部门月度预算,需关注预算执行情况。'),
  (5, 11, 2, '张三', 'approve',  '符合IT年度预算计划,同意采购。',                '采购需求与年度IT规划一致,供应商资质合规。',        'low',    '采购金额32.6万元,在IT年度预算范围内,供应商三证齐全。'),
  (6, 12, 2, '张三', 'reject',   '采购单价高于市场均价15%,建议重新询价。',       '供应商报价偏高,建议引入比价机制。',              'medium', '食材采购单价高于市场均价,建议三家比价后重新提交。'),
  (7, 15, 2, '张三', 'approve',  '项目ROI预期良好,同意立项。',                   '电商渠道增长趋势明确,ROI预期1.8倍。',            'low',    '项目预算58万元,预期ROI 1.8,市场调研充分。'),
  (8, 16, 2, '张三', 'reject',   '已有同类认证有效期未到期,无需重复立项。',       'ISO9001认证当前有效期至2027年6月。',             'low',    '当前ISO9001认证仍在有效期内,建议暂缓立项。'),
  (9, 19, 2, '张三', 'approve',  '资产评估合理,同意出售。',                      '评估价与市场价一致,处置流程合规。',              'low',    '闲置叉车评估价9.6万元,与市场行情一致。');

-- -----------------------------------------------------------------------------
-- 5. 合同数据 (3份, 含风险条款)
-- -----------------------------------------------------------------------------
INSERT INTO `contracts`
  (`id`, `title`, `type`, `party_a`, `party_b`, `amount`, `sign_date`, `start_date`, `end_date`, `content`, `status`, `risk_level`, `audit_result`)
VALUES
  (1,
   '华北大区面粉采购合同',
   'purchase',
   '道一云食品股份有限公司',
   '五得利面粉集团有限公司',
   1280000.00,
   '2026-07-10', '2026-08-01', '2027-07-31',
   '第一条 采购标的:面粉500吨,规格50kg/袋。\n第二条 采购金额:人民币壹佰贰拾捌万元整(¥1,280,000.00)。\n第三条 交货方式:乙方负责运输至甲方指定仓库,运费由乙方承担。\n第四条 结算方式:货到验收合格后30日内付款。\n第五条 违约责任:任何一方违约,违约方应向守约方支付合同金额10%的违约金；如违约金不足以弥补损失,守约方有权要求赔偿实际损失,但赔偿总额不超过合同金额的30%。\n第六条 不可抗力:因不可抗力导致合同无法履行的,双方互不承担违约责任,但应及时通知对方并提供证明。\n第七条 争议解决:本合同履行过程中发生争议,双方应友好协商解决；协商不成的,提交甲方所在地人民法院诉讼解决。',
   'pending',
   'medium',
   JSON_OBJECT(
     'risk_score', 65,
     'risk_items', JSON_ARRAY(
       JSON_OBJECT('clause', '第五条 违约责任', 'risk', '违约金10%偏低,建议提高至15-20%', 'level', 'medium'),
       JSON_OBJECT('clause', '第四条 结算方式', 'risk', '30日账期较长,建议缩短至15日', 'level', 'low')
     ),
     'summary', '合同整体风险中等,违约金比例偏低,建议协商提高。'
   )),
  (2,
   '物流运输服务外包合同',
   'service',
   '道一云食品股份有限公司',
   '顺丰速运股份有限公司',
   680000.00,
   '2026-07-05', '2026-07-15', '2027-07-14',
   '第一条 服务内容:乙方为甲方提供全国范围内成品运输服务。\n第二条 服务期限:2026年7月15日至2027年7月14日。\n第三条 服务费用:年度运输服务费人民币陆拾捌万元整(¥680,000.00),按月结算。\n第四条 服务标准:乙方应在接单后48小时内送达,延迟送达按运费10%扣减。\n第五条 货物损毁:运输途中货物损毁、灭失的,乙方按货物实际价值赔偿,单次事故赔偿上限为5万元。\n第六条 合同终止:任何一方提前30日书面通知可终止合同,无需承担违约责任。\n第七条 争议解决:提交北京仲裁委员会仲裁。',
   'pending',
   'high',
   JSON_OBJECT(
     'risk_score', 82,
     'risk_items', JSON_ARRAY(
       JSON_OBJECT('clause', '第五条 货物损毁', 'risk', '单次事故赔偿上限5万元过低,食品货值可能远超此金额', 'level', 'high'),
       JSON_OBJECT('clause', '第六条 合同终止', 'risk', '任意终止条款对甲方不利,可能导致服务中断', 'level', 'high'),
       JSON_OBJECT('clause', '第四条 服务标准', 'risk', '48小时送达时限偏长,建议细化区域差异化标准', 'level', 'medium')
     ),
     'summary', '合同风险较高,赔偿上限过低且终止条款不利,建议重大修改后再签。'
   )),
  (3,
   '北京办公场地租赁合同',
   'lease',
   '北京华联商业地产有限公司',
   '道一云食品股份有限公司',
   360000.00,
   '2026-06-20', '2026-07-01', '2029-06-30',
   '第一条 租赁标的:北京市朝阳区建国路88号现代城SOHO 16层,建筑面积300平方米。\n第二条 租赁期限:3年,自2026年7月1日至2029年6月30日。\n第三条 租金标准:年租金人民币叁拾陆万元整(¥360,000.00),按季度支付,首年租金自第二年起每年递增5%。\n第四条 押金:乙方于合同签订之日支付押金3万元,租赁期满或合同解除后无息退还。\n第五条 物业费:物业费由甲方承担,水电费按实际使用量由乙方承担。\n第六条 装修:乙方可根据需要自行装修,但不得改变房屋主体结构。\n第七条 违约责任:乙方逾期支付租金超过30日的,甲方有权解除合同并没收押金。\n第八条 争议解决:提交甲方所在地人民法院诉讼解决。',
   'approved',
   'low',
   JSON_OBJECT(
     'risk_score', 35,
     'risk_items', JSON_ARRAY(
       JSON_OBJECT('clause', '第七条 违约责任', 'risk', '逾期30日即解除合同并没收押金,建议协商宽限期', 'level', 'low')
     ),
     'summary', '合同风险较低,条款较为常规,已审批通过。'
   ));

-- -----------------------------------------------------------------------------
-- 6. 报销单数据 (5条)
-- -----------------------------------------------------------------------------
INSERT INTO `expense_reports`
  (`id`, `applicant_id`, `applicant_name`, `department`, `type`, `amount`, `expense_date`, `description`, `invoices`, `ai_parsed`, `status`, `budget_before`, `budget_after`)
VALUES
  (1, 3, '李四', '采购部', 'meal',     18600.00,  '2026-06-28',
   '市场部三季度客户答谢宴,参与客户12人,共计消费18600元。',
   JSON_ARRAY(
     JSON_OBJECT('code', '1100020260628001234', 'amount', 18600.00, 'type', '增值税普通发票', 'date', '2026-06-28', 'seller', '北京全聚德餐饮有限公司')
   ),
   JSON_OBJECT(
     'invoice_count', 1,
     'total_amount', 18600.00,
     'matches', TRUE,
     'risk', '人均消费1550元,超商务用餐标准(800元/人)',
     'ocr_confidence', 0.98
   ),
   'pending', 250000.00, 231400.00),

  (2, 3, '李四', '采购部', 'transport', 8320.50, '2026-06-30',
   '上海供应商拜访差旅费,含机票2张、住宿2晚、市内交通。',
   JSON_ARRAY(
     JSON_OBJECT('code', '1100020260630005678', 'amount', 3200.00, 'type', '电子客票行程单', 'date', '2026-06-29', 'seller', '中国国航'),
     JSON_OBJECT('code', '1100020260630009012', 'amount', 3800.00, 'type', '增值税专用发票', 'date', '2026-06-29', 'seller', '上海锦江饭店'),
     JSON_OBJECT('code', '1100020260630003456', 'amount', 1320.50, 'type', '电子发票', 'date', '2026-06-30', 'seller', '滴滴出行')
   ),
   JSON_OBJECT(
     'invoice_count', 3,
     'total_amount', 8320.50,
     'matches', TRUE,
     'risk', '住宿费超标,标准400元/晚,实际540元/晚',
     'ocr_confidence', 0.96
   ),
   'pending', 231400.00, 223079.50),

  (3, 3, '李四', '采购部', 'office',    2360.00, '2026-06-25',
   '6月份办公用品采购:打印纸、笔记本、签字笔等。',
   JSON_ARRAY(
     JSON_OBJECT('code', '1100020260625007890', 'amount', 2360.00, 'type', '增值税普通发票', 'date', '2026-06-25', 'seller', '京东企业购')
   ),
   JSON_OBJECT(
     'invoice_count', 1,
     'total_amount', 2360.00,
     'matches', TRUE,
     'risk', '无风险',
     'ocr_confidence', 0.99
   ),
   'approved', 250000.00, 247640.00),

  (4, 2, '张三', '财务部', 'meeting',  45800.00, '2026-06-20',
   '2026中国食品行业峰会参会费用,含会议注册费、住宿、交通。',
   JSON_ARRAY(
     JSON_OBJECT('code', '1100020260620002345', 'amount', 28000.00, 'type', '增值税专用发票', 'date', '2026-06-20', 'seller', '中国食品工业协会'),
     JSON_OBJECT('code', '1100020260620006789', 'amount', 15600.00, 'type', '增值税专用发票', 'date', '2026-06-21', 'seller', '北京国际饭店'),
     JSON_OBJECT('code', '1100020260620001357', 'amount', 2200.00, 'type', '电子客票行程单', 'date', '2026-06-20', 'seller', '中国国航')
   ),
   JSON_OBJECT(
     'invoice_count', 3,
     'total_amount', 45800.00,
     'matches', TRUE,
     'risk', '会议费超部门月度预算30%,建议复核预算来源',
     'ocr_confidence', 0.97
   ),
   'transferred', 200000.00, 154200.00),

  (5, 3, '李四', '采购部', 'lodging',  12600.00, '2026-07-01',
   '广州工厂考察出差住宿费3晚。',
   JSON_ARRAY(
     JSON_OBJECT('code', '1100020260701002468', 'amount', 12600.00, 'type', '增值税专用发票', 'date', '2026-07-01', 'seller', '广州花园酒店')
   ),
   JSON_OBJECT(
     'invoice_count', 1,
     'total_amount', 12600.00,
     'matches', TRUE,
     'risk', '住宿费超标,标准400元/晚,实际4200元/晚',
     'ocr_confidence', 0.95
   ),
   'pending', 223079.50, 210479.50);

-- -----------------------------------------------------------------------------
-- 7. 预算数据 (4个部门 × 5个类别)
--    类别: meal/transport/lodging/office/meeting
-- -----------------------------------------------------------------------------
INSERT INTO `budgets`
  (`id`, `department`, `category`, `total_amount`, `used_amount`, `period`)
VALUES
  -- 总经办
  (1,  '总经办', 'meal',      200000.00,  86000.00,  '2026-Q3'),
  (2,  '总经办', 'transport', 150000.00,  62000.00,  '2026-Q3'),
  (3,  '总经办', 'lodging',   120000.00,  45000.00,  '2026-Q3'),
  (4,  '总经办', 'office',     80000.00,  28000.00,  '2026-Q3'),
  (5,  '总经办', 'meeting',   300000.00, 186000.00,  '2026-Q3'),
  -- 财务部
  (6,  '财务部', 'meal',      150000.00,  52000.00,  '2026-Q3'),
  (7,  '财务部', 'transport', 120000.00,  48000.00,  '2026-Q3'),
  (8,  '财务部', 'lodging',   100000.00,  36000.00,  '2026-Q3'),
  (9,  '财务部', 'office',     60000.00,  21000.00,  '2026-Q3'),
  (10, '财务部', 'meeting',   200000.00, 154200.00,  '2026-Q3'),
  -- 采购部
  (11, '采购部', 'meal',      250000.00, 231400.00,  '2026-Q3'),
  (12, '采购部', 'transport', 180000.00, 223079.50,  '2026-Q3'),
  (13, '采购部', 'lodging',   150000.00, 210479.50,  '2026-Q3'),
  (14, '采购部', 'office',    100000.00,  24760.00,  '2026-Q3'),
  (15, '采购部', 'meeting',   220000.00,  96000.00,  '2026-Q3'),
  -- 法务部
  (16, '法务部', 'meal',       80000.00,  22000.00,  '2026-Q3'),
  (17, '法务部', 'transport',  60000.00,  18000.00,  '2026-Q3'),
  (18, '法务部', 'lodging',    50000.00,  12000.00,  '2026-Q3'),
  (19, '法务部', 'office',     40000.00,  15000.00,  '2026-Q3'),
  (20, '法务部', 'meeting',   100000.00,  35000.00,  '2026-Q3');

-- -----------------------------------------------------------------------------
-- 8. 审核规则 (5条常见规则)
-- -----------------------------------------------------------------------------
INSERT INTO `audit_rules`
  (`id`, `name`, `type`, `condition`, `action`, `priority`, `status`)
VALUES
  (1, '报销金额超标规则',
   'expense',
   JSON_OBJECT('field', 'amount', 'operator', '>', 'value', 50000, 'logic', '单笔报销金额超过5万元需财务经理复核'),
   'warn', 100, 'active'),

  (2, '住宿费超标规则',
   'expense',
   JSON_OBJECT('field', 'type', 'operator', '=', 'value', 'lodging', 'extra', JSON_OBJECT('per_night_limit', 400, 'logic', '住宿费单晚超过400元需说明原因')),
   'warn', 90, 'active'),

  (3, '合同金额超百万规则',
   'contract',
   JSON_OBJECT('field', 'amount', 'operator', '>', 'value', 1000000, 'logic', '合同金额超100万需法务审核'),
   'warn', 100, 'active'),

  (4, '违约金条款缺失规则',
   'contract',
   JSON_OBJECT('keyword', '违约金', 'required', TRUE, 'logic', '合同必须包含违约金条款'),
   'reject', 95, 'active'),

  (5, '采购报价偏高规则',
   'procurement',
   JSON_OBJECT('field', 'price_deviation', 'operator', '>', 'value', 0.10, 'logic', '采购单价高于市场均价10%需三家比价'),
   'warn', 80, 'active');

-- -----------------------------------------------------------------------------
-- 9. 流程模板 (3个)
-- -----------------------------------------------------------------------------
INSERT INTO `workflows`
  (`id`, `name`, `type`, `nodes`, `routes`, `status`, `version`)
VALUES
  (1, '费用报销审批流程', 'expense',
   JSON_ARRAY(
     JSON_OBJECT('id', 1, 'name', '部门经理审批',  'type', 'approval', 'approver_role', 'approver'),
     JSON_OBJECT('id', 2, 'name', '财务复核',      'type', 'approval', 'approver_role', 'finance',   'condition', 'amount > 10000'),
     JSON_OBJECT('id', 3, 'name', '总经理审批',    'type', 'approval', 'approver_role', 'admin',     'condition', 'amount > 50000'),
     JSON_OBJECT('id', 4, 'name', '财务打款',      'type', 'execute',  'approver_role', 'finance')
   ),
   JSON_ARRAY(
     JSON_OBJECT('from', 1, 'to', 2, 'condition', 'amount > 10000'),
     JSON_OBJECT('from', 1, 'to', 4, 'condition', 'amount <= 10000 AND status = approved'),
     JSON_OBJECT('from', 2, 'to', 3, 'condition', 'amount > 50000 AND status = approved'),
     JSON_OBJECT('from', 2, 'to', 4, 'condition', 'amount <= 50000 AND status = approved'),
     JSON_OBJECT('from', 3, 'to', 4, 'condition', 'status = approved')
   ),
   'active', 1),

  (2, '合同审批流程', 'contract',
   JSON_ARRAY(
     JSON_OBJECT('id', 1, 'name', '部门经理审批',  'type', 'approval', 'approver_role', 'approver'),
     JSON_OBJECT('id', 2, 'name', '法务审核',      'type', 'approval', 'approver_role', 'legal',     'condition', 'always'),
     JSON_OBJECT('id', 3, 'name', '财务审核',      'type', 'approval', 'approver_role', 'finance',   'condition', 'amount > 100000'),
     JSON_OBJECT('id', 4, 'name', '总经理审批',    'type', 'approval', 'approver_role', 'admin',     'condition', 'amount > 1000000'),
     JSON_OBJECT('id', 5, 'name', '合同归档',      'type', 'execute',  'approver_role', 'admin')
   ),
   JSON_ARRAY(
     JSON_OBJECT('from', 1, 'to', 2, 'condition', 'status = approved'),
     JSON_OBJECT('from', 2, 'to', 3, 'condition', 'amount > 100000 AND status = approved'),
     JSON_OBJECT('from', 2, 'to', 5, 'condition', 'amount <= 100000 AND status = approved'),
     JSON_OBJECT('from', 3, 'to', 4, 'condition', 'amount > 1000000 AND status = approved'),
     JSON_OBJECT('from', 3, 'to', 5, 'condition', 'amount <= 1000000 AND status = approved'),
     JSON_OBJECT('from', 4, 'to', 5, 'condition', 'status = approved')
   ),
   'active', 1),

  (3, '采购申请审批流程', 'procurement',
   JSON_ARRAY(
     JSON_OBJECT('id', 1, 'name', '部门经理审批',  'type', 'approval', 'approver_role', 'approver'),
     JSON_OBJECT('id', 2, 'name', '采购总监审批',  'type', 'approval', 'approver_role', 'approver', 'condition', 'amount > 100000'),
     JSON_OBJECT('id', 3, 'name', '财务审批',      'type', 'approval', 'approver_role', 'finance',   'condition', 'amount > 500000'),
     JSON_OBJECT('id', 4, 'name', '总经理审批',    'type', 'approval', 'approver_role', 'admin',     'condition', 'amount > 2000000'),
     JSON_OBJECT('id', 5, 'name', '采购执行',      'type', 'execute',  'approver_role', 'applicant')
   ),
   JSON_ARRAY(
     JSON_OBJECT('from', 1, 'to', 2, 'condition', 'amount > 100000 AND status = approved'),
     JSON_OBJECT('from', 1, 'to', 5, 'condition', 'amount <= 100000 AND status = approved'),
     JSON_OBJECT('from', 2, 'to', 3, 'condition', 'amount > 500000 AND status = approved'),
     JSON_OBJECT('from', 2, 'to', 5, 'condition', 'amount <= 500000 AND status = approved'),
     JSON_OBJECT('from', 3, 'to', 4, 'condition', 'amount > 2000000 AND status = approved'),
     JSON_OBJECT('from', 3, 'to', 5, 'condition', 'amount <= 2000000 AND status = approved'),
     JSON_OBJECT('from', 4, 'to', 5, 'condition', 'status = approved')
   ),
   'active', 1);

-- -----------------------------------------------------------------------------
-- 10. 表单模板 (3个)
-- -----------------------------------------------------------------------------
INSERT INTO `form_templates`
  (`id`, `name`, `type`, `schema`, `version`, `status`)
VALUES
  (1, '费用报销单', 'expense',
   JSON_OBJECT(
     'fields', JSON_ARRAY(
       JSON_OBJECT('name', 'type',         'label', '费用类型',    'type', 'select',   'required', TRUE,  'options', JSON_ARRAY('meal','transport','lodging','office','meeting')),
       JSON_OBJECT('name', 'amount',       'label', '报销金额',    'type', 'number',   'required', TRUE,  'min', 0),
       JSON_OBJECT('name', 'expense_date', 'label', '费用日期',    'type', 'date',     'required', TRUE),
       JSON_OBJECT('name', 'description',  'label', '费用说明',    'type', 'textarea', 'required', TRUE,  'max', 500),
       JSON_OBJECT('name', 'invoices',     'label', '发票附件',    'type', 'upload',   'required', TRUE,  'accept', '.jpg,.png,.pdf')
     )
   ),
   1, 'active'),

  (2, '合同审批单', 'contract',
   JSON_OBJECT(
     'fields', JSON_ARRAY(
       JSON_OBJECT('name', 'title',      'label', '合同名称',  'type', 'text',     'required', TRUE, 'max', 200),
       JSON_OBJECT('name', 'type',       'label', '合同类型',  'type', 'select',   'required', TRUE, 'options', JSON_ARRAY('purchase','service','lease')),
       JSON_OBJECT('name', 'party_a',    'label', '甲方',      'type', 'text',     'required', TRUE),
       JSON_OBJECT('name', 'party_b',    'label', '乙方',      'type', 'text',     'required', TRUE),
       JSON_OBJECT('name', 'amount',     'label', '合同金额',  'type', 'number',   'required', TRUE, 'min', 0),
       JSON_OBJECT('name', 'sign_date',  'label', '签订日期',  'type', 'date',     'required', TRUE),
       JSON_OBJECT('name', 'start_date', 'label', '生效日期',  'type', 'date',     'required', TRUE),
       JSON_OBJECT('name', 'end_date',   'label', '到期日期',  'type', 'date',     'required', TRUE),
       JSON_OBJECT('name', 'content',    'label', '合同正文',  'type', 'file',     'required', TRUE, 'accept', '.pdf,.doc,.docx')
     )
   ),
   1, 'active'),

  (3, '采购申请单', 'procurement',
   JSON_OBJECT(
     'fields', JSON_ARRAY(
       JSON_OBJECT('name', 'title',         'label', '采购名称',   'type', 'text',     'required', TRUE, 'max', 200),
       JSON_OBJECT('name', 'amount',        'label', '采购金额',   'type', 'number',   'required', TRUE, 'min', 0),
       JSON_OBJECT('name', 'items',         'label', '采购明细',   'type', 'table',    'required', TRUE,
         'columns', JSON_ARRAY(
           JSON_OBJECT('name','item_name','label','品名','type','text'),
           JSON_OBJECT('name','spec','label','规格','type','text'),
           JSON_OBJECT('name','qty','label','数量','type','number'),
           JSON_OBJECT('name','unit','label','单位','type','text'),
           JSON_OBJECT('name','price','label','单价','type','number')
         )
       ),
       JSON_OBJECT('name', 'reason',        'label', '采购事由',   'type', 'textarea', 'required', TRUE, 'max', 500),
       JSON_OBJECT('name', 'expected_date', 'label', '期望到货日期','type', 'date',     'required', TRUE)
     )
   ),
   1, 'active');

-- -----------------------------------------------------------------------------
-- 11. 操作日志 (示例)
-- -----------------------------------------------------------------------------
INSERT INTO `system_logs`
  (`id`, `user_id`, `user_name`, `action`, `module`, `detail`, `ip`)
VALUES
  (1, 2, '张三', 'login',    'auth',       '用户登录',                              '192.168.1.10'),
  (2, 2, '张三', 'approve',  'todos',      '审批通过待办: 办公场地租赁合同续签审批',  '192.168.1.10'),
  (3, 3, '李四', 'submit',   'todos',      '提交待办: 华北大区面粉采购合同审批',      '192.168.1.20'),
  (4, 4, '王五', 'reject',   'todos',      '驳回待办: 设备维保服务合同审批',          '192.168.1.30'),
  (5, 1, '管理员','login',   'auth',       '管理员登录',                            '192.168.1.1'),
  (6, 5, '赵六', 'transfer', 'todos',      '转交待办: 行业峰会参会费用报销',          '192.168.1.40');

-- =============================================================================
-- 种子数据导入完成
-- =============================================================================

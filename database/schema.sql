-- =============================================================================
-- 道一云 AI 协同中台 Demo - 数据库建表脚本
-- Database: ai_platform_demo
-- Engine : MySQL 8.0
-- Charset: utf8mb4
-- =============================================================================

CREATE DATABASE IF NOT EXISTS ai_platform_demo
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE ai_platform_demo;

-- -----------------------------------------------------------------------------
-- 部门表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL COMMENT '部门名称',
  `parent_id`  INT DEFAULT 0 COMMENT '上级部门ID, 0为顶级',
  `sort`       INT DEFAULT 0 COMMENT '排序',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- -----------------------------------------------------------------------------
-- 用户表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`             INT PRIMARY KEY AUTO_INCREMENT,
  `username`       VARCHAR(50) UNIQUE NOT NULL COMMENT '登录名',
  `password`       VARCHAR(255) NOT NULL COMMENT 'bcrypt加密',
  `real_name`      VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `avatar`         VARCHAR(255) COMMENT '头像URL',
  `email`          VARCHAR(100),
  `phone`          VARCHAR(20),
  `department_id`  INT COMMENT '所属部门ID',
  `role`           VARCHAR(20) DEFAULT 'user' COMMENT 'admin/approver/applicant/finance/legal',
  `status`         TINYINT DEFAULT 1 COMMENT '1启用 0禁用',
  `wecom_user_id`  VARCHAR(100) COMMENT '企业微信UserID',
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_department (department_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- -----------------------------------------------------------------------------
-- 待办表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `todos`;
CREATE TABLE `todos` (
  `id`             INT PRIMARY KEY AUTO_INCREMENT,
  `title`          VARCHAR(200) NOT NULL COMMENT '待办标题',
  `source`         VARCHAR(50) COMMENT '来源系统: ERP/CRM/OA/财务/MES/HR',
  `type`           VARCHAR(20) COMMENT 'contract/expense/procurement/project/asset',
  `priority`       VARCHAR(10) DEFAULT 'normal' COMMENT 'urgent/high/normal/low',
  `amount`         DECIMAL(12,2) DEFAULT 0 COMMENT '金额',
  `applicant_id`   INT COMMENT '申请人ID',
  `applicant_name` VARCHAR(50) COMMENT '申请人姓名',
  `department`     VARCHAR(100) COMMENT '申请部门',
  `status`         VARCHAR(20) DEFAULT 'pending' COMMENT 'pending/approved/rejected/transferred',
  `is_timeout`     TINYINT DEFAULT 0 COMMENT '是否超时 1是 0否',
  `is_urgent`      TINYINT DEFAULT 0 COMMENT '是否紧急 1是 0否',
  `submitted_at`   TIMESTAMP NULL COMMENT '提交时间',
  `due_at`         TIMESTAMP NULL COMMENT '截止时间',
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_applicant (applicant_id),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待办表';

-- -----------------------------------------------------------------------------
-- 审批记录表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `approval_records`;
CREATE TABLE `approval_records` (
  `id`            INT PRIMARY KEY AUTO_INCREMENT,
  `todo_id`       INT NOT NULL COMMENT '待办ID',
  `approver_id`   INT COMMENT '审批人ID',
  `approver_name` VARCHAR(50) COMMENT '审批人姓名',
  `action`        VARCHAR(20) COMMENT 'approve/reject/return/transfer',
  `opinion`       TEXT COMMENT '审批意见',
  `ai_opinion`    TEXT COMMENT 'AI辅助意见',
  `ai_risk_level` VARCHAR(10) COMMENT 'AI风险等级 high/medium/low',
  `ai_summary`    TEXT COMMENT 'AI摘要',
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_todo (todo_id),
  INDEX idx_approver (approver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批记录表';

-- -----------------------------------------------------------------------------
-- 流程模板表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `workflows`;
CREATE TABLE `workflows` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL COMMENT '流程名称',
  `type`       VARCHAR(20) COMMENT '流程类型',
  `nodes`      JSON COMMENT '流程节点配置',
  `routes`     JSON COMMENT '路由规则',
  `status`     VARCHAR(10) DEFAULT 'active' COMMENT 'active/inactive',
  `version`    INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程模板表';

-- -----------------------------------------------------------------------------
-- 表单模板表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `form_templates`;
CREATE TABLE `form_templates` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL COMMENT '表单名称',
  `type`       VARCHAR(20) COMMENT '表单类型',
  `schema`     JSON COMMENT '表单JSON Schema',
  `version`    INT DEFAULT 1,
  `status`     VARCHAR(10) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='表单模板表';

-- -----------------------------------------------------------------------------
-- 审核规则表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_rules`;
CREATE TABLE `audit_rules` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL COMMENT '规则名称',
  `type`       VARCHAR(20) COMMENT 'expense/contract/procurement',
  `condition`  JSON COMMENT '规则条件',
  `action`     VARCHAR(20) COMMENT 'pass/reject/warn',
  `priority`   INT DEFAULT 0 COMMENT '优先级, 越大越优先',
  `status`     VARCHAR(10) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核规则表';

-- -----------------------------------------------------------------------------
-- 合同表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `contracts`;
CREATE TABLE `contracts` (
  `id`           INT PRIMARY KEY AUTO_INCREMENT,
  `title`        VARCHAR(200) NOT NULL COMMENT '合同标题',
  `type`         VARCHAR(20) COMMENT 'purchase/service/lease',
  `party_a`      VARCHAR(100) COMMENT '甲方',
  `party_b`      VARCHAR(100) COMMENT '乙方',
  `amount`       DECIMAL(12,2) COMMENT '合同金额',
  `sign_date`    DATE COMMENT '签订日期',
  `start_date`   DATE COMMENT '生效日期',
  `end_date`     DATE COMMENT '到期日期',
  `content`      TEXT COMMENT '合同正文',
  `status`       VARCHAR(20) DEFAULT 'draft' COMMENT 'draft/pending/approved/active/completed',
  `risk_level`   VARCHAR(10) COMMENT 'high/medium/low',
  `audit_result` JSON COMMENT 'AI审核结果',
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同表';

-- -----------------------------------------------------------------------------
-- 报销单表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `expense_reports`;
CREATE TABLE `expense_reports` (
  `id`            INT PRIMARY KEY AUTO_INCREMENT,
  `applicant_id`  INT COMMENT '申请人ID',
  `applicant_name` VARCHAR(50),
  `department`    VARCHAR(100),
  `type`          VARCHAR(20) COMMENT 'meal/transport/lodging/office/meeting',
  `amount`        DECIMAL(12,2),
  `expense_date`  DATE COMMENT '费用发生日期',
  `description`   TEXT COMMENT '说明',
  `invoices`      JSON COMMENT '发票信息数组',
  `ai_parsed`     JSON COMMENT 'AI解析结果',
  `status`        VARCHAR(20) DEFAULT 'draft' COMMENT 'draft/pending/approved/rejected',
  `budget_before` DECIMAL(12,2) COMMENT '审批前预算余额',
  `budget_after`  DECIMAL(12,2) COMMENT '审批后预算余额',
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_applicant (applicant_id),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报销单表';

-- -----------------------------------------------------------------------------
-- 预算表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `budgets`;
CREATE TABLE `budgets` (
  `id`          INT PRIMARY KEY AUTO_INCREMENT,
  `department`  VARCHAR(100) COMMENT '部门',
  `category`    VARCHAR(50) COMMENT '预算类别',
  `total_amount` DECIMAL(12,2) COMMENT '预算总额',
  `used_amount` DECIMAL(12,2) DEFAULT 0 COMMENT '已使用金额',
  `period`      VARCHAR(10) COMMENT '预算周期, 如 2026-Q3',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dept_period (department, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预算表';

-- -----------------------------------------------------------------------------
-- 操作日志表
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `user_id`    INT,
  `user_name`  VARCHAR(50),
  `action`     VARCHAR(50) COMMENT '操作动作',
  `module`     VARCHAR(50) COMMENT '功能模块',
  `detail`     TEXT COMMENT '详情',
  `ip`         VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

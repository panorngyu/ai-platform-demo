# 道一云 AI 协同中台 Demo

> 面向食品饮料行业的 AI 驱动协同审批中台，集成待办聚合、智能审批、合同风控、费用稽核、预算管控等能力，通过 AI 辅助决策提升企业审批效率与合规水平。

## 项目简介

本项目为道一云食品股份有限公司 AI 协同中台的演示版本（Demo），旨在展示 AI 技术在企业审批协同场景中的落地能力。系统对接 ERP / CRM / OA / 财务 / MES / HR 等多个业务系统，统一汇聚待办，借助 AI 完成合同条款风险识别、报销发票稽核、审批意见智能生成等，帮助企业将审批效率提升 60% 以上。

### 核心能力

- **待办聚合**：跨系统统一待办列表，支持按类型、优先级、超时、紧急等维度筛选
- **AI 智能审批**：自动生成审批意见、风险摘要、风险等级建议
- **合同风控**：AI 识别合同条款风险点，输出风险评分与修改建议
- **费用稽核**：发票 OCR 识别、自动核验、超标预警
- **预算管控**：实时预算余额查询，审批前自动扣减、驳回自动回滚
- **流程引擎**：可配置的审批流程模板，支持条件路由与多级审批

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | Vue 3 + Vite + Element Plus + Pinia | SPA 单页应用 |
| 后端 | Node.js + Express / Koa | RESTful API |
| 数据库 | MySQL 8.0 | 业务数据存储，支持 JSON 字段 |
| 缓存 | Redis 7 | 会话、热点数据缓存 |
| 对象存储 | MinIO | 发票、合同附件等文件存储 |
| AI 能力 | GLM / OpenAI 兼容接口 | 合同审核、报销稽核、意见生成 |
| 容器化 | Docker + Docker Compose | 一键部署 |

## 项目结构

```
jinmailang-ai-platform/
├── database/                  # 数据库脚本
│   ├── schema.sql             # 建表脚本 (11张表)
│   └── seed.sql               # 种子数据 (部门/用户/待办/合同/报销/预算等)
├── backend/                   # 后端服务
│   ├── src/
│   │   ├── config/            # 配置 (数据库/Redis/MinIO/AI)
│   │   ├── controllers/       # 控制器
│   │   ├── services/          # 业务逻辑
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由
│   │   ├── middlewares/       # 中间件 (鉴权/日志)
│   │   └── utils/             # 工具函数
│   └── package.json
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── views/             # 页面
│   │   ├── components/        # 组件
│   │   ├── api/               # 接口封装
│   │   ├── store/             # Pinia 状态管理
│   │   ├── router/            # 路由
│   │   └── utils/             # 工具函数
│   └── package.json
├── docker-compose.yml         # 基础服务编排 (MySQL+Redis+MinIO)
└── README.md                  # 项目文档
```

## 快速启动

### 方式零：一键启动（最快）

> 前置条件：已安装 Node.js 20+，无需 Docker / MySQL

```bash
# 在项目根目录执行
./start.sh
```

脚本会自动启动前后端服务。无需数据库，后端自动降级使用 Mock 数据。
启动后访问 http://localhost:5173 ，使用 `admin / admin123` 登录。

### 方式一：Docker 一键启动（推荐）

> 前置条件：已安装 Docker 与 Docker Compose

```bash
# 1. 启动基础服务 (MySQL + Redis + MinIO)
docker-compose up -d

# 2. 查看服务状态
docker-compose ps

# 3. 查看 MySQL 初始化日志 (确认 schema.sql / seed.sql 已自动执行)
docker-compose logs -f mysql

# 4. 启动后端服务
cd backend
npm install
npm run dev

# 5. 启动前端服务 (新终端)
cd frontend
npm install
npm run dev
```

启动完成后：
- 前端访问：http://localhost:5173
- 后端 API：http://localhost:3000
- MySQL：localhost:3306
- Redis：localhost:6379
- MinIO 控制台：http://localhost:9001

### 方式二：手动启动

若不便使用 Docker，可本地安装 MySQL 8.0、Redis 7、MinIO，然后手动导入数据：

```bash
# 1. 创建数据库并导入表结构
mysql -uroot -p < database/schema.sql

# 2. 导入种子数据
mysql -uroot -p < database/seed.sql

# 3. 修改后端配置 (database/redis/minio 连接信息)
cd backend
cp .env.example .env
# 编辑 .env 修改连接配置

# 4. 启动后端
npm install && npm run dev

# 5. 启动前端
cd ../frontend
npm install && npm run dev
```

## 默认账号

所有账号密码均为 **admin123**，bcrypt 加密存储。

| 用户名 | 密码 | 真实姓名 | 角色 | 部门 | 用途 |
|--------|------|----------|------|------|------|
| admin | admin123 | 管理员 | admin | 总经办 | 系统管理、终审 |
| zhangsan | admin123 | 张三 | approver | 财务部 | 部门经理审批 |
| lisi | admin123 | 李四 | applicant | 采购部 | 申请人提交单据 |
| wangwu | admin123 | 王五 | legal | 法务部 | 合同法务审核 |
| zhaoliu | admin123 | 赵六 | finance | 财务部 | 财务复核打款 |

> bcrypt hash：`$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`

## 服务连接信息

### MySQL

| 项 | 值 |
|----|-----|
| Host | localhost |
| Port | 3306 |
| Database | ai_platform_demo |
| Username | root |
| Password | root123 |

### Redis

| 项 | 值 |
|----|-----|
| Host | localhost |
| Port | 6379 |
| Password | redis123 |

### MinIO

| 项 | 值 |
|----|-----|
| API Endpoint | http://localhost:9000 |
| Console | http://localhost:9001 |
| Access Key | minioadmin |
| Secret Key | minioadmin |

## 数据库表结构

共 11 张表：

| 表名 | 说明 |
|------|------|
| `departments` | 部门表 |
| `users` | 用户表 |
| `todos` | 待办表（跨系统聚合） |
| `approval_records` | 审批记录表（含 AI 意见） |
| `workflows` | 流程模板表（节点配置 JSON） |
| `form_templates` | 表单模板表（JSON Schema） |
| `audit_rules` | 审核规则表 |
| `contracts` | 合同表（含 AI 审核结果 JSON） |
| `expense_reports` | 报销单表（含发票/ AI 解析 JSON） |
| `budgets` | 预算表 |
| `system_logs` | 操作日志表 |

## API 文档简要说明

### 鉴权

```
POST /api/auth/login     # 登录, 返回 JWT Token
GET  /api/auth/me        # 获取当前用户信息
POST /api/auth/logout    # 登出
```

### 待办

```
GET    /api/todos                # 待办列表 (支持 type/status/priority 筛选)
GET    /api/todos/:id            # 待办详情
POST   /api/todos/:id/approve    # 审批通过 (AI 辅助生成意见)
POST   /api/todos/:id/reject     # 驳回
POST   /api/todos/:id/transfer   # 转交
GET    /api/todos/stats          # 待办统计 (待审/超时/紧急数量)
```

### 合同

```
GET    /api/contracts            # 合同列表
GET    /api/contracts/:id        # 合同详情
POST   /api/contracts            # 新建合同
POST   /api/contracts/:id/audit  # AI 合同审核 (返回风险点+评分)
```

### 报销

```
GET    /api/expenses             # 报销单列表
POST   /api/expenses             # 提交报销单
POST   /api/expenses/:id/ocr     # 发票 OCR 识别
GET    /api/expenses/:id/budget  # 查询预算余额
```

### AI 能力

```
POST /api/ai/contract-audit      # 合同条款风险审核
POST /api/ai/expense-parse       # 报销单智能解析
POST /api/ai/approval-suggest    # 审批意见智能生成
POST /api/ai/summary             # 内容摘要生成
```

### 基础数据

```
GET /api/departments             # 部门列表
GET /api/users                   # 用户列表
GET /api/workflows               # 流程模板
GET /api/form-templates          # 表单模板
GET /api/audit-rules             # 审核规则
GET /api/budgets                 # 预算查询
```

> 详细接口字段请参考后端代码 `backend/src/routes/`。

## Demo 演示动线

建议按以下顺序演示，完整呈现 AI 协同中台价值：

### 场景一：申请人提交（角色：李四）

1. 以 `lisi / admin123` 登录
2. 进入「待办提交」→ 选择「合同审批」
3. 上传一份采购合同 PDF
4. 点击「AI 预审」→ 展示 AI 识别的风险条款、风险评分、修改建议
5. 提交审批，流程进入部门经理节点

### 场景二：审批人处理待办（角色：张三）

1. 以 `zhangsan / admin123` 登录
2. 进入「待办中心」→ 看到来自 ERP/OA/财务等系统的聚合待办
3. 筛选「超时」标记，优先处理
4. 打开「华北大区面粉采购合同审批」
5. 查看 AI 风险摘要、AI 建议审批意见
6. 点击「一键采纳 AI 意见」→ 提交审批通过
7. 系统自动扣减预算，进入下一节点

### 场景三：费用报销稽核（角色：李四 → 张三）

1. `lisi` 登录 → 提交一笔客户答谢宴报销（18600 元）
2. 上传发票 → AI 自动 OCR 识别金额、税号、开票方
3. AI 预警：人均消费 1550 元，超商务用餐标准（800 元/人）
4. 提交后切换 `zhangsan` 审批
5. 审批页面展示预算余额、超标预警、AI 建议
6. 审批通过 → 预算自动扣减

### 场景四：合同风控深度演示（角色：王五）

1. 以 `wangwu / admin123`（法务）登录
2. 打开「物流运输服务外包合同」
3. 查看 AI 审核结果：风险评分 82（高风险）
4. 展示三个风险点：赔偿上限过低、任意终止条款、送达时限偏长
5. 法务补充意见后驳回，要求修改条款

### 场景五：管理视角（角色：admin）

1. 以 `admin / admin123` 登录
2. 进入「数据看板」→ 查看待办处理时效、AI 采纳率、预算执行率
3. 查看操作日志、流程配置、审核规则维护

## 注意事项

1. **数据安全**：本 Demo 密码统一为 `admin123`，生产环境必须使用强密码并配合企业微信 SSO。
2. **AI 接口**：Demo 中 AI 能力依赖外部大模型 API，需在 `backend/.env` 中配置 `AI_API_KEY` 与 `AI_API_BASE`，未配置时 AI 相关接口将返回 Mock 数据。
3. **数据重置**：执行 `docker-compose down -v` 可清空所有数据重新初始化；注意会丢失业务数据。
4. **MySQL 初始化**：`schema.sql` 与 `seed.sql` 仅在 MySQL 容器**首次启动**（数据卷为空）时自动执行，修改后需 `down -v` 重建。
5. **字符集**：数据库统一使用 `utf8mb4`，支持 Emoji 与特殊字符。
6. **生产部署**：Demo 未包含网关、限流、监控等生产级组件，请勿直接用于生产环境。
7. **许可**：仅用于内部演示，请勿对外发布。

## 常见问题

### Q1: MySQL 容器启动后 seed.sql 没有执行？

A: `docker-entrypoint-initdb.d/` 下的脚本仅在数据卷为空时执行一次。若已存在数据，需先 `docker-compose down -v` 清除数据卷再重新启动。

### Q2: 忘记密码怎么办？

A: Demo 账号密码统一为 `admin123`；也可直接连库更新 `users.password` 为新的 bcrypt hash。

### Q3: AI 接口报错？

A: 检查后端 `.env` 中 `AI_API_KEY` 是否配置；Demo 也提供 Mock 模式，设置 `AI_MOCK=true` 即可。

### Q4: 如何查看 MinIO 中的文件？

A: 访问 http://localhost:9001，使用 `minioadmin / minioadmin` 登录控制台。

---

© 2026 道一云食品股份有限公司 · AI 协同中台 Demo

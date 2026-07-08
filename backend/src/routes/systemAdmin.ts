import { Router, Request, Response } from 'express'
import { systemAdminService } from '../services/systemAdminService.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// ============================================================
// A. 数据安全
// ============================================================

router.get('/security/config', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getSecurityConfig()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/security/config', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.updateSecurityConfig(req.body)
    res.json(success(data, '安全配置更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============================================================
// B. 访问安全
// ============================================================

router.get('/access/config', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getAccessConfig()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/access/config', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.updateAccessConfig(req.body)
    res.json(success(data, '访问安全配置更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============================================================
// C. 审计与合规
// ============================================================

router.get('/audit/logs', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getAuditLogs(req.query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/audit/data-logs', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getDataAccessLogs(req.query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/audit/stats', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getAuditStats()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============================================================
// D. 运维监控
// ============================================================

router.get('/monitor/system', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getSystemMonitor()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/monitor/app', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getAppMonitor()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/monitor/logs', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getLogs(req.query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/monitor/alerts', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getAlerts()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/monitor/alert-config', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getAlertConfig()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============================================================
// E. 组织架构管理
// ============================================================

router.get('/departments', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getDepartments()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.post('/departments', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.createDepartment(req.body)
    res.json(success(data, '部门创建成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/departments/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.updateDepartment(id, req.body)
    if (!data) {
      res.json(fail('部门不存在', 404))
      return
    }
    res.json(success(data, '部门更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.delete('/departments/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.deleteDepartment(id)
    res.json(success(data, '部门删除成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/positions', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getPositions()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/users', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getUsers(req.query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.post('/users', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.createUser(req.body)
    res.json(success(data, '用户创建成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.updateUser(id, req.body)
    if (!data) {
      res.json(fail('用户不存在', 404))
      return
    }
    res.json(success(data, '用户更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/users/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.toggleUserStatus(id)
    if (!data) {
      res.json(fail('用户不存在', 404))
      return
    }
    res.json(success(data, `用户已${data.status === 'active' ? '启用' : '禁用'}`))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============================================================
// F. 角色权限管理
// ============================================================

router.get('/roles', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getRoles()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.post('/roles', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.createRole(req.body)
    res.json(success(data, '角色创建成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/roles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.updateRole(id, req.body)
    if (!data) {
      res.json(fail('角色不存在', 404))
      return
    }
    res.json(success(data, '角色更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.delete('/roles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.deleteRole(id)
    if (!data) {
      res.json(fail('角色不存在', 404))
      return
    }
    res.json(success(data, '角色删除成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.get('/permissions', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getPermissions()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 注意：以下两条路由为 /roles/:id/permissions，需在 /roles/:id 静态路由之后
router.get('/roles/:id/permissions', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.getRolePermissions(id)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

router.put('/roles/:id/permissions', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const permissionIds = req.body.permissionIds || []
    const data = await systemAdminService.updateRolePermissions(id, permissionIds)
    res.json(success(data, '权限更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============================================================
// 系统日志管理
// ============================================================

// 登录日志
router.get('/logs/login', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getLoginLogs(req.query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 操作日志
router.get('/logs/operation', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getOperationLogs(req.query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 接口调用日志
router.get('/logs/api-call', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getApiCallLogs(req.query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 异常错误日志
router.get('/logs/error', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getErrorLogs(req.query)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 日志统计
router.get('/logs/stats', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getLogStats()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// ============================================================
// G. 第三方系统管理
// ============================================================

// 获取系统列表
router.get('/third-party/list', async (req: Request, res: Response) => {
  try {
    const data = await systemAdminService.getThirdPartySystems()
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 获取单个系统详情
router.get('/third-party/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.getThirdPartySystemDetail(id)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 更新系统配置参数
router.put('/third-party/:id/config', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.updateThirdPartySystemConfig(id, req.body)
    res.json(success(data, '系统配置更新成功'))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 测试系统连接
router.post('/third-party/:id/test-connection', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.testThirdPartyConnection(id)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 切换系统启用/禁用
router.put('/third-party/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const data = await systemAdminService.toggleThirdPartySystem(id)
    res.json(success(data))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

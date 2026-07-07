import { Router, Request, Response } from 'express'
import { User, Department, dbConnected } from '../models/index.js'
import { success, fail } from '../utils/response.js'
import { authMiddleware, rbacMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

// 用户列表（admin/manager 可访问）
router.get('/users', rbacMiddleware(['admin', 'manager']), async (req: Request, res: Response) => {
  try {
    if (dbConnected) {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      })
      res.json(success(users))
      return
    }
    // Mock
    res.json(success([
      { id: 1, username: 'admin', realName: '系统管理员', role: 'admin', departmentId: 6, status: 'active' },
      { id: 2, username: 'caiwu', realName: '张财务', role: 'manager', departmentId: 2, status: 'active' },
      { id: 3, username: 'fawu', realName: '李法务', role: 'manager', departmentId: 3, status: 'active' },
      { id: 4, username: 'caigou', realName: '王采购', role: 'user', departmentId: 4, status: 'active' }
    ]))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 角色列表
router.get('/roles', async (req: Request, res: Response) => {
  try {
    res.json(success([
      { id: 1, code: 'admin', name: '系统管理员', permissions: ['*'] },
      { id: 2, code: 'manager', name: '部门经理', permissions: ['todo:approve', 'todo:view', 'expense:audit', 'contract:audit', 'dashboard:view'] },
      { id: 3, code: 'user', name: '普通用户', permissions: ['todo:view', 'expense:create', 'contract:create'] }
    ]))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

// 部门列表
router.get('/departments', async (req: Request, res: Response) => {
  try {
    if (dbConnected) {
      const departments = await Department.findAll({ order: [['sort', 'ASC']] })
      res.json(success(departments))
      return
    }
    res.json(success([
      { id: 1, name: '道一云集团', parentId: 0, sort: 1 },
      { id: 2, name: '财务部', parentId: 1, sort: 1 },
      { id: 3, name: '法务部', parentId: 1, sort: 2 },
      { id: 4, name: '采购部', parentId: 1, sort: 3 },
      { id: 5, name: '营销中心', parentId: 1, sort: 4 },
      { id: 6, name: '信息技术部', parentId: 1, sort: 5 }
    ]))
  } catch (error) {
    res.json(fail((error as Error).message))
  }
})

export default router

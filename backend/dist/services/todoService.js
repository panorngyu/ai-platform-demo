import { Op } from 'sequelize';
import { Todo, ApprovalRecord, dbConnected } from '../models/index.js';
// 内存 Mock 待办（数据库不可用时的兜底数据）
const mockTodos = [
    {
        id: 1, title: '关于2026年Q3营销费用报销审批', source: '财务系统', type: 'expense',
        priority: 'high', amount: 58000, applicantId: 4, applicantName: '王采购',
        department: '采购部', status: 'pending', isTimeout: false, isUrgent: true,
        submittedAt: new Date(Date.now() - 24 * 3600 * 1000),
        dueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        createdAt: new Date(Date.now() - 24 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 24 * 3600 * 1000)
    },
    {
        id: 2, title: '原材料采购合同审批（供应商：河北某粮油）', source: '合同系统', type: 'contract',
        priority: 'high', amount: 1280000, applicantId: 4, applicantName: '王采购',
        department: '采购部', status: 'pending', isTimeout: true, isUrgent: false,
        submittedAt: new Date(Date.now() - 48 * 3600 * 1000),
        dueAt: new Date(Date.now() - 12 * 3600 * 1000),
        createdAt: new Date(Date.now() - 48 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 48 * 3600 * 1000)
    },
    {
        id: 3, title: '华北区渠道拓展项目立项', source: '项目系统', type: 'project',
        priority: 'normal', amount: 350000, applicantId: 3, applicantName: '李法务',
        department: '法务部', status: 'pending', isTimeout: false, isUrgent: false,
        submittedAt: new Date(Date.now() - 6 * 3600 * 1000),
        dueAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        createdAt: new Date(Date.now() - 6 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 6 * 3600 * 1000)
    },
    {
        id: 4, title: '办公设备采购申请', source: '采购系统', type: 'procurement',
        priority: 'low', amount: 36000, applicantId: 2, applicantName: '张财务',
        department: '财务部', status: 'pending', isTimeout: false, isUrgent: false,
        submittedAt: new Date(Date.now() - 72 * 3600 * 1000),
        dueAt: new Date(Date.now() + 24 * 3600 * 1000),
        createdAt: new Date(Date.now() - 72 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 72 * 3600 * 1000)
    }
];
export const todoService = {
    // 分页查询待办
    async getTodos(query) {
        const page = parseInt(query.page || '1', 10);
        const pageSize = parseInt(query.pageSize || '10', 10);
        const { status, type, priority, keyword, isUrgent } = query;
        if (dbConnected) {
            const where = {};
            if (status)
                where.status = status;
            if (type)
                where.type = type;
            if (priority)
                where.priority = priority;
            if (isUrgent === 'true')
                where.isUrgent = true;
            if (keyword)
                where.title = { [Op.like]: `%${keyword}%` };
            const { rows, count } = await Todo.findAndCountAll({
                where,
                order: [['isUrgent', 'DESC'], ['createdAt', 'DESC']],
                offset: (page - 1) * pageSize,
                limit: pageSize
            });
            return { list: rows, total: count, page, pageSize };
        }
        // Mock 数据筛选
        let list = [...mockTodos];
        if (status)
            list = list.filter((t) => t.status === status);
        if (type)
            list = list.filter((t) => t.type === type);
        if (priority)
            list = list.filter((t) => t.priority === priority);
        if (isUrgent === 'true')
            list = list.filter((t) => t.isUrgent);
        if (keyword)
            list = list.filter((t) => t.title.includes(keyword));
        const total = list.length;
        const start = (page - 1) * pageSize;
        return { list: list.slice(start, start + pageSize), total, page, pageSize };
    },
    // 获取待办详情
    async getTodoById(id) {
        if (dbConnected) {
            const todo = await Todo.findByPk(id, {
                include: [{ model: ApprovalRecord, as: 'records' }]
            });
            return todo;
        }
        const todo = mockTodos.find((t) => t.id === id);
        if (!todo)
            return null;
        return { ...todo, records: [] };
    },
    // 批量审批
    async batchApprove(ids, action, approverId, approverName, opinion) {
        const results = [];
        for (const id of ids) {
            if (dbConnected) {
                const todo = await Todo.findByPk(id);
                if (todo) {
                    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'transferred';
                    await todo.update({ status: newStatus });
                    await ApprovalRecord.create({
                        todoId: id, approverId, approverName, action, opinion
                    });
                    results.push({ id, success: true });
                }
                else {
                    results.push({ id, success: false, message: '待办不存在' });
                }
            }
            else {
                const todo = mockTodos.find((t) => t.id === id);
                if (todo) {
                    todo.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'transferred';
                    results.push({ id, success: true });
                }
                else {
                    results.push({ id, success: false, message: '待办不存在' });
                }
            }
        }
        return { results, total: ids.length, success: results.filter((r) => r.success).length };
    },
    // 更新待办状态
    async updateTodoStatus(id, status) {
        if (dbConnected) {
            const todo = await Todo.findByPk(id);
            if (!todo)
                throw new Error('待办不存在');
            await todo.update({ status });
            return todo;
        }
        const todo = mockTodos.find((t) => t.id === id);
        if (!todo)
            throw new Error('待办不存在');
        todo.status = status;
        return todo;
    },
    // 检查超时待办
    async checkTimeout() {
        const now = new Date();
        if (dbConnected) {
            const [count] = await Todo.update({ isTimeout: true }, { where: { status: 'pending', dueAt: { [Op.lt]: now }, isTimeout: false } });
            return count;
        }
        let count = 0;
        mockTodos.forEach((t) => {
            if (t.status === 'pending' && t.dueAt && t.dueAt < now && !t.isTimeout) {
                t.isTimeout = true;
                count++;
            }
        });
        return count;
    }
};
export default todoService;

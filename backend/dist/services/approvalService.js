import { Todo, ApprovalRecord, dbConnected } from '../models/index.js';
import { aiService } from './aiService.js';
// 审批意见模板
const opinionTemplates = [
    { id: 1, category: 'approve', content: '同意。材料齐全，符合审批要求。' },
    { id: 2, category: 'approve', content: '同意。金额合理，预算充足。' },
    { id: 3, category: 'approve', content: '同意。已核实，符合公司规定。' },
    { id: 4, category: 'reject', content: '不予通过。缺少必要附件，请补充后重提。' },
    { id: 5, category: 'reject', content: '不予通过。金额超出预算，请调整后重提。' },
    { id: 6, category: 'return', content: '退回修改。请补充详细说明。' },
    { id: 7, category: 'transfer', content: '转交相关部门处理。' }
];
export const approvalService = {
    // 获取审批详情
    async getApprovalDetail(todoId) {
        if (dbConnected) {
            const todo = await Todo.findByPk(todoId, {
                include: [{ model: ApprovalRecord, as: 'records', order: [['createdAt', 'DESC']] }]
            });
            if (!todo)
                return null;
            // 生成 AI 摘要与风险分析
            const summary = await aiService.generateSummary(this.buildDocumentContent(todo));
            const risk = await aiService.analyzeRisk(this.buildDocumentContent(todo), []);
            return {
                todo,
                aiSummary: summary,
                aiRisk: risk,
                opinionTemplates: opinionTemplates.slice(0, 3)
            };
        }
        return { todo: null, message: 'Mock 模式下无法获取详情' };
    },
    buildDocumentContent(todo) {
        return `标题：${todo.title}\n类型：${todo.type}\n金额：${todo.amount}\n申请人：${todo.applicantName}\n部门：${todo.department}`;
    },
    // 审批操作
    async approve(todoId, approverId, approverName, action, opinion) {
        if (dbConnected) {
            const todo = await Todo.findByPk(todoId);
            if (!todo)
                throw new Error('待办不存在');
            // 生成 AI 意见
            const aiResult = await aiService.generateOpinion(this.buildDocumentContent(todo), { level: 'low' });
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
            });
            // 更新待办状态
            const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'transferred';
            await todo.update({ status: newStatus });
            return { record, todo };
        }
        throw new Error('Mock 模式下不支持审批操作');
    },
    // 获取审批历史
    async getApprovalHistory(todoId) {
        if (dbConnected) {
            return await ApprovalRecord.findAll({
                where: { todoId },
                order: [['createdAt', 'DESC']]
            });
        }
        return [];
    },
    // 获取审批意见模板
    async getOpinionTemplates() {
        return opinionTemplates;
    }
};
export default approvalService;

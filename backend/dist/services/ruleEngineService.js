import { Engine, Rule } from 'json-rules-engine';
import { AuditRule, dbConnected } from '../models/index.js';
// 内存 Mock 规则
const mockRules = [
    {
        id: 1,
        name: '金额超50万需高管审批',
        type: 'expense',
        condition: {
            all: [{ fact: 'amount', operator: 'greaterThanInclusive', value: 500000 }]
        },
        action: 'require_senior_approval',
        priority: 1,
        status: 'active'
    },
    {
        id: 2,
        name: '超预算预警',
        type: 'expense',
        condition: {
            all: [{ fact: 'overBudget', operator: 'equal', value: true }]
        },
        action: 'alert_over_budget',
        priority: 1,
        status: 'active'
    },
    {
        id: 3,
        name: '合同金额超100万需法务审查',
        type: 'contract',
        condition: {
            all: [{ fact: 'amount', operator: 'greaterThanInclusive', value: 1000000 }]
        },
        action: 'require_legal_review',
        priority: 1,
        status: 'active'
    },
    {
        id: 4,
        name: '餐饮单笔超2000元预警',
        type: 'expense',
        condition: {
            all: [
                { fact: 'type', operator: 'equal', value: '餐饮' },
                { fact: 'amount', operator: 'greaterThan', value: 2000 }
            ]
        },
        action: 'alert_high_dining',
        priority: 2,
        status: 'active'
    }
];
export const ruleEngineService = {
    // 执行审核规则
    async executeRules(data, ruleType) {
        const rules = await this.getRules(ruleType);
        const engine = new Engine();
        rules.forEach((ruleData) => {
            const rule = new Rule({
                conditions: ruleData.condition,
                event: {
                    type: ruleData.action,
                    params: { ruleName: ruleData.name, ruleId: ruleData.id }
                },
                priority: ruleData.priority || 1
            });
            engine.addRule(rule);
        });
        // 注入 facts（直接传入数据对象）
        try {
            const results = await engine.run(data);
            return {
                triggered: results.events.map((e) => ({
                    action: e.type,
                    ruleName: e.params?.ruleName,
                    ruleId: e.params?.ruleId
                })),
                allRules: rules.length,
                mock: !dbConnected
            };
        }
        catch (error) {
            console.warn('[RuleEngine] 规则执行失败:', error.message);
            return { triggered: [], allRules: rules.length, error: error.message, mock: !dbConnected };
        }
    },
    // 获取规则列表
    async getRules(type) {
        if (dbConnected) {
            const where = { status: 'active' };
            if (type)
                where.type = type;
            return await AuditRule.findAll({ where, order: [['priority', 'ASC']] });
        }
        if (type)
            return mockRules.filter((r) => r.type === type && r.status === 'active');
        return mockRules.filter((r) => r.status === 'active');
    },
    // 创建规则
    async createRule(ruleData) {
        if (dbConnected) {
            return await AuditRule.create(ruleData);
        }
        const newRule = { id: mockRules.length + 1, status: 'active', priority: 1, ...ruleData };
        mockRules.push(newRule);
        return newRule;
    }
};
export default ruleEngineService;

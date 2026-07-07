// 驾驶舱服务（全部返回 Mock 数据）
export const dashboardService = {
    // 大屏概览
    async getOverview() {
        return {
            // 核心指标
            kpi: {
                pendingCount: 28,
                todayApproved: 15,
                todayRejected: 3,
                avgProcessHours: 4.2,
                timeoutRate: 8.5,
                aiAssistRate: 92.3
            },
            // 待办类型分布
            todoTypeDistribution: [
                { type: 'expense', name: '费用报销', count: 12, percentage: 42.9 },
                { type: 'contract', name: '合同审批', count: 8, percentage: 28.6 },
                { type: 'procurement', name: '采购审批', count: 5, percentage: 17.9 },
                { type: 'project', name: '项目审批', count: 2, percentage: 7.1 },
                { type: 'asset', name: '资产审批', count: 1, percentage: 3.5 }
            ],
            // 部门待办分布
            departmentDistribution: [
                { department: '采购部', count: 10 },
                { department: '营销中心', count: 8 },
                { department: '财务部', count: 6 },
                { department: '法务部', count: 3 },
                { department: '信息技术部', count: 1 }
            ],
            // 近7天趋势
            weeklyTrend: Array.from({ length: 7 }, (_, i) => {
                const date = new Date(Date.now() - (6 - i) * 24 * 3600 * 1000);
                return {
                    date: date.toISOString().split('T')[0],
                    submitted: Math.floor(Math.random() * 20) + 10,
                    approved: Math.floor(Math.random() * 15) + 8,
                    rejected: Math.floor(Math.random() * 3)
                };
            }),
            // AI 辅助统计
            aiStats: {
                totalAssisted: 156,
                summaryGenerated: 89,
                riskAnalyzed: 45,
                opinionGenerated: 22,
                accuracyRate: 94.2
            }
        };
    },
    // 效率分析
    async getEfficiencyAnalysis() {
        return {
            // 处理时长对比（AI辅助 vs 传统）
            processTimeCompare: {
                aiAssisted: { avg: 4.2, median: 3.5, p90: 8.5 },
                traditional: { avg: 12.8, median: 10.2, p90: 24.5 },
                improvement: 67.2
            },
            // 各环节效率
            stageEfficiency: [
                { stage: '提交', avgTime: 0.5, aiAssisted: false },
                { stage: '初审', avgTime: 2.1, aiAssisted: true, aiTime: 0.8 },
                { stage: '复核', avgTime: 3.5, aiAssisted: true, aiTime: 1.5 },
                { stage: '终审', avgTime: 4.2, aiAssisted: true, aiTime: 2.0 },
                { stage: '归档', avgTime: 0.5, aiAssisted: false }
            ],
            // 部门效率排名
            departmentRanking: [
                { department: '信息技术部', avgHours: 3.2, count: 15 },
                { department: '财务部', avgHours: 4.5, count: 28 },
                { department: '法务部', avgHours: 5.1, count: 12 },
                { department: '采购部', avgHours: 6.8, count: 35 },
                { department: '营销中心', avgHours: 7.2, count: 22 }
            ],
            // 月度趋势
            monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
                month: `2026-0${i + 2}`,
                avgHours: Math.random() * 5 + 3,
                aiRate: Math.random() * 20 + 75
            }))
        };
    },
    // 异常预警
    async getAlerts() {
        return {
            // 待处理预警
            alerts: [
                {
                    id: 1,
                    level: 'high',
                    type: 'timeout',
                    title: '原材料采购合同审批超时',
                    description: '合同金额128万，已超时12小时，需立即处理',
                    todoId: 2,
                    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
                },
                {
                    id: 2,
                    level: 'medium',
                    type: 'budget',
                    title: '营销中心广告投放预算使用率84%',
                    description: '预算200万，已使用168万，剩余32万',
                    department: '营销中心',
                    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
                },
                {
                    id: 3,
                    level: 'low',
                    type: 'ai_risk',
                    title: 'AI识别报销单存在合规风险',
                    description: '王采购提交的58000元餐费报销，单笔金额偏高',
                    todoId: 1,
                    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
                }
            ],
            // 统计
            stats: {
                total: 3,
                high: 1,
                medium: 1,
                low: 1,
                resolved: 12,
                pending: 3
            }
        };
    }
};
export default dashboardService;

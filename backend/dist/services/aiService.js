import axios from 'axios';
import { config } from '../config/index.js';
// 判断大模型 API 是否可用
function isLLMConfigured() {
    if (config.llm.provider === 'wenxin') {
        return !!(config.llm.wenxin.apiKey && config.llm.wenxin.secretKey);
    }
    if (config.llm.provider === 'qianwen') {
        return !!config.llm.qianwen.apiKey;
    }
    return false;
}
// 文心 Token 缓存
let wenxinToken = null;
async function getWenxinToken() {
    if (wenxinToken && wenxinToken.expireAt > Date.now()) {
        return wenxinToken.token;
    }
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.llm.wenxin.apiKey}&client_secret=${config.llm.wenxin.secretKey}`;
    const res = await axios.get(url);
    wenxinToken = {
        token: res.data.access_token,
        expireAt: Date.now() + (res.data.expires_in - 300) * 1000
    };
    return wenxinToken.token;
}
// 等待函数
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export const aiService = {
    // 调用大模型 chat
    async chat(prompt, options = {}) {
        if (!isLLMConfigured()) {
            return this.mockChat(prompt, options);
        }
        try {
            if (config.llm.provider === 'wenxin') {
                const token = await getWenxinToken();
                const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${token}`;
                const res = await axios.post(url, {
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options.temperature || 0.7,
                    stream: false
                });
                return { content: res.data.result, raw: res.data };
            }
            if (config.llm.provider === 'qianwen') {
                const res = await axios.post('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
                    model: options.model || 'qwen-turbo',
                    input: { messages: [{ role: 'user', content: prompt }] },
                    parameters: { temperature: options.temperature || 0.7 }
                }, {
                    headers: {
                        Authorization: `Bearer ${config.llm.qianwen.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                return { content: res.data.output.text, raw: res.data };
            }
        }
        catch (error) {
            console.warn('[AI] 大模型调用失败，降级到 Mock:', error.message);
            return this.mockChat(prompt, options);
        }
    },
    // Mock chat
    async mockChat(prompt, _options = {}) {
        await sleep(300);
        return {
            content: `【Mock响应】已收到您的请求：${prompt.substring(0, 50)}...，AI协同中台模拟分析完成。建议人工复核相关内容，确保合规性。`,
            mock: true
        };
    },
    // 生成单据摘要
    async generateSummary(documentContent) {
        if (!isLLMConfigured()) {
            return this.mockSummary(documentContent);
        }
        const prompt = `请对以下单据内容生成结构化摘要，包括关键要素、金额、人员、时间等：\n\n${documentContent}`;
        const result = await this.chat(prompt);
        return {
            summary: result.content,
            mock: result.mock || false
        };
    },
    mockSummary(documentContent) {
        return {
            summary: `AI摘要：该单据为${documentContent.includes('合同') ? '合同' : documentContent.includes('报销') ? '报销' : '审批'}类业务，涉及金额需重点核对，申请人与部门信息已确认，建议关注合规要点与预算占用情况。`,
            mock: true
        };
    },
    // 分析合规风险
    async analyzeRisk(documentContent, rules) {
        if (!isLLMConfigured()) {
            return this.mockRisk(documentContent, rules);
        }
        const rulesText = rules.map((r) => r.name || JSON.stringify(r)).join('\n');
        const prompt = `请基于以下规则分析单据的合规风险：\n\n单据内容：\n${documentContent}\n\n规则：\n${rulesText}\n\n请给出风险等级(low/medium/high)和具体风险点。`;
        const result = await this.chat(prompt);
        return {
            riskLevel: 'medium',
            analysis: result.content,
            mock: result.mock || false
        };
    },
    mockRisk(_documentContent, _rules) {
        return {
            riskLevel: 'medium',
            analysis: '风险分析：1. 金额接近预算阈值，建议核实；2. 单据附件完整性需确认；3. 申请人资质符合要求。整体风险等级为中等，建议审批人重点关注金额与预算科目。',
            points: [
                { level: 'medium', description: '金额接近预算阈值' },
                { level: 'low', description: '附件完整性需确认' },
                { level: 'low', description: '申请人资质符合要求' }
            ],
            mock: true
        };
    },
    // 生成审核意见
    async generateOpinion(documentContent, riskResult) {
        if (!isLLMConfigured()) {
            return this.mockOpinion(documentContent, riskResult);
        }
        const prompt = `基于以下单据与风险分析，生成审核意见：\n\n单据：${documentContent}\n\n风险等级：${riskResult.level || 'medium'}\n\n请生成专业的审核意见。`;
        const result = await this.chat(prompt);
        return {
            opinion: result.content,
            riskLevel: riskResult.level || 'medium',
            summary: 'AI生成审核意见',
            mock: result.mock || false
        };
    },
    mockOpinion(_documentContent, riskResult) {
        const level = riskResult?.level || 'medium';
        const opinions = {
            low: 'AI建议：单据信息完整，金额合理，风险较低，建议通过审批。',
            medium: 'AI建议：单据基本符合要求，存在中等风险，建议审批人核实金额与预算后决定。',
            high: 'AI建议：单据存在较高风险，建议补充材料或退回修改。'
        };
        return {
            opinion: opinions[level] || opinions.medium,
            riskLevel: level,
            summary: 'AI生成审核意见（Mock）',
            mock: true
        };
    },
    // 一句话报销 NLP 解析
    async parseExpenseCommand(naturalLanguage) {
        if (!isLLMConfigured()) {
            return this.mockParseExpense(naturalLanguage);
        }
        const prompt = `请将以下自然语言报销指令解析为结构化数据，包含 type(餐饮/交通/住宿/办公/会议)、amount、date、description、department 字段：\n\n"${naturalLanguage}"\n\n请返回JSON格式。`;
        const result = await this.chat(prompt, { temperature: 0.2 });
        return { parsed: result.content, mock: result.mock || false };
    },
    mockParseExpense(naturalLanguage) {
        // 简单关键词解析
        const result = {
            type: '其他',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            description: naturalLanguage,
            department: '信息技术部'
        };
        if (naturalLanguage.includes('餐') || naturalLanguage.includes('吃饭'))
            result.type = '餐饮';
        else if (naturalLanguage.includes('车') || naturalLanguage.includes('交通') || naturalLanguage.includes('打车'))
            result.type = '交通';
        else if (naturalLanguage.includes('住') || naturalLanguage.includes('酒店'))
            result.type = '住宿';
        else if (naturalLanguage.includes('办公'))
            result.type = '办公';
        else if (naturalLanguage.includes('会议'))
            result.type = '会议';
        // 提取金额
        const amountMatch = naturalLanguage.match(/(\d+(?:\.\d+)?)\s*(?:元|块|人民币)?/);
        if (amountMatch)
            result.amount = parseFloat(amountMatch[1]);
        return {
            parsed: result,
            raw: naturalLanguage,
            mock: true,
            message: '已解析报销指令（Mock），请核对信息后提交'
        };
    },
    // AI 起草合同
    async draftContract(contractType, elements) {
        if (!isLLMConfigured()) {
            return this.mockDraftContract(contractType, elements);
        }
        const prompt = `请起草一份${contractType}合同，关键要素：${JSON.stringify(elements)}。请生成完整的合同条款。`;
        const result = await this.chat(prompt);
        return { content: result.content, mock: result.mock || false };
    },
    mockDraftContract(contractType, elements) {
        const partyA = elements.partyA || '今麦郎食品有限公司';
        const partyB = elements.partyB || '乙方公司';
        const amount = elements.amount || '合同金额';
        return {
            content: `【${contractType}】\n\n甲方：${partyA}\n乙方：${partyB}\n\n第一条 合同标的\n本合同为${contractType}，由甲方向乙方采购相关产品/服务。\n\n第二条 合同金额\n本合同总金额为人民币${amount}元。\n\n第三条 付款方式\n合同签订后7个工作日内支付预付款30%，验收合格后支付尾款70%。\n\n第四条 违约责任\n任何一方违约，应承担违约责任，赔偿对方损失。\n\n第五条 合同期限\n本合同自签订之日起生效，有效期至约定事项完成之日止。\n\n（以上为Mock起草内容，请人工完善）`,
            mock: true,
            message: 'AI起草完成（Mock模式）'
        };
    },
    // 合同对比
    async compareContracts(version1, version2) {
        if (!isLLMConfigured()) {
            return this.mockCompare(version1, version2);
        }
        const prompt = `请对比以下两版合同的差异：\n\n版本1：\n${version1}\n\n版本2：\n${version2}\n\n请列出关键差异点。`;
        const result = await this.chat(prompt);
        return { diff: result.content, mock: result.mock || false };
    },
    mockCompare(_v1, _v2) {
        return {
            diff: '合同对比结果（Mock）：\n1. 第三条付款方式：版本1预付款30%，版本2调整为20%；\n2. 第五条违约责任：版本2增加了上限条款；\n3. 金额条款一致。',
            changes: [
                { section: '第三条 付款方式', v1: '预付款30%', v2: '预付款20%', type: 'modified' },
                { section: '第五条 违约责任', v1: '无上限', v2: '增加上限条款', type: 'added' }
            ],
            mock: true
        };
    },
    // 合同合规审查
    async reviewContract(content, rules) {
        if (!isLLMConfigured()) {
            return this.mockReview(content, rules);
        }
        const rulesText = rules.map((r) => r.name || JSON.stringify(r)).join('\n');
        const prompt = `请审查以下合同的合规性：\n\n${content}\n\n审查规则：\n${rulesText}\n\n请给出风险点和修改建议。`;
        const result = await this.chat(prompt);
        return { review: result.content, mock: result.mock || false };
    },
    mockReview(_content, _rules) {
        return {
            review: '合同合规审查报告（Mock）：\n1. 付款条款：建议明确付款时间节点；\n2. 违约责任：建议增加具体赔偿标准；\n3. 争议解决：建议约定管辖法院。',
            riskLevel: 'medium',
            issues: [
                { section: '付款条款', risk: 'medium', suggestion: '建议明确付款时间节点' },
                { section: '违约责任', risk: 'low', suggestion: '建议增加具体赔偿标准' },
                { section: '争议解决', risk: 'low', suggestion: '建议约定管辖法院' }
            ],
            mock: true
        };
    }
};
export default aiService;

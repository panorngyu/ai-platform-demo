<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Files,
  MagicStick,
  Loading,
  Check,
  Close,
  Warning,
  Document,
  Plus,
  Download,
  Printer
} from '@element-plus/icons-vue'
import {
  getContracts,
  aiDraft,
  aiCompare,
  aiReview,
  type ContractItem,
  type ReviewResult
} from '@/api/contract'

const activeTab = ref('list')

// ============ 合同列表 ============
const list = ref<ContractItem[]>([])
const listLoading = ref(false)

async function fetchList() {
  listLoading.value = true
  try {
    const res: any = await getContracts()
    list.value = res?.data ?? res ?? []
  } catch (e) {
    list.value = []
  } finally {
    listLoading.value = false
  }
}

function riskTag(level?: string) {
  const map: Record<string, { type: string; text: string }> = {
    high: { type: 'danger', text: '高风险' },
    medium: { type: 'warning', text: '中风险' },
    low: { type: 'success', text: '低风险' }
  }
  return level ? map[level] : { type: 'info', text: '未评估' }
}

function statusTag(s: string) {
  return (
    {
      draft: { type: 'info', text: '草稿' },
      reviewing: { type: 'warning', text: '审核中' },
      signed: { type: 'success', text: '已签订' },
      expired: { type: 'danger', text: '已失效' }
    } as any
  )[s] || { type: 'info', text: s }
}

// ============ AI 起草 ============
const draftForm = reactive({
  type: 'purchase',
  partyA: '道一云食品集团有限公司',
  partyB: '',
  amount: undefined as number | undefined,
  startDate: '',
  endDate: '',
  subject: '',
  paymentTerms: '',
  otherRequirements: ''
})

const contractTypes = [
  { label: '采购合同', value: 'purchase' },
  { label: '服务合同', value: 'service' },
  { label: '租赁合同', value: 'rent' },
  { label: '销售合同', value: 'sale' },
  { label: '合作协议', value: 'cooperation' }
]

const draftLoading = ref(false)
const draftContent = ref('')

async function handleDraft() {
  if (!draftForm.partyB) {
    ElMessage.warning('请填写签约对方')
    return
  }
  draftLoading.value = true
  draftContent.value = ''
  try {
    const res: any = await aiDraft({
      type: draftForm.type,
      elements: { ...draftForm }
    })
    const data = res?.data ?? res
    draftContent.value = data.content || ''
    ElMessage.success('AI起草完成')
  } catch (e) {
    // ignore
  } finally {
    draftLoading.value = false
  }
}

// ============ 合同审查 ============
const reviewForm = reactive({
  content: '',
  contractId: '' as string | number
})

const reviewLoading = ref(false)
const reviewResult = ref<ReviewResult | null>(null)
const compareLoading = ref(false)
const compareResult = ref<any>(null)
const compareV2 = ref('')

async function handleReview() {
  if (!reviewForm.content.trim()) {
    ElMessage.warning('请输入或粘贴合同文本')
    return
  }
  reviewLoading.value = true
  reviewResult.value = null
  try {
    const res: any = await aiReview({
      content: reviewForm.content,
      contractId: reviewForm.contractId || undefined
    })
    reviewResult.value = res?.data ?? res
    ElMessage.success('AI审查完成')
  } catch (e) {
    // ignore
  } finally {
    reviewLoading.value = false
  }
}

async function handleCompare() {
  if (!reviewForm.content || !compareV2.value) {
    ElMessage.warning('请填写两个版本的合同文本')
    return
  }
  compareLoading.value = true
  compareResult.value = null
  try {
    const res: any = await aiCompare({
      version1: reviewForm.content,
      version2: compareV2.value
    })
    compareResult.value = res?.data ?? res
    ElMessage.success('对比完成')
  } catch (e) {
    // ignore
  } finally {
    compareLoading.value = false
  }
}

function clauseStatus(s: string) {
  return (
    {
      pass: { type: 'success', text: '通过', icon: Check },
      fail: { type: 'danger', text: '不通过', icon: Close },
      warn: { type: 'warning', text: '需关注', icon: Warning }
    } as any
  )[s] || { type: 'info', text: s, icon: Warning }
}

function exportReport() {
  if (!reviewResult.value) return
  const w = window.open('', '_blank')
  if (!w) return
  const r = reviewResult.value
  w.document.write(`
    <html><head><title>合同审查报告</title>
    <style>
      body { font-family: 'Microsoft YaHei'; padding: 24px; color: #1f2d3d; }
      h1 { color: #1a3a5c; border-bottom: 2px solid #e8734a; padding-bottom: 8px; }
      .summary { background: #f5f7fa; padding: 12px; border-radius: 6px; margin: 16px 0; }
      .clause { border: 1px solid #ebeef5; padding: 12px; margin: 8px 0; border-radius: 4px; }
      .pass { color: #2bb673; font-weight: 600; }
      .fail { color: #e94f4f; font-weight: 600; }
      .warn { color: #f5a623; font-weight: 600; }
    </style></head><body>
    <h1>合同AI审查报告</h1>
    <div class="summary">
      <p><strong>风险等级：</strong><span class="${r.riskLevel}">${r.riskLevelName || r.riskLevel}</span></p>
      <p><strong>审查结论：</strong>${r.conclusion || '—'}</p>
    </div>
    <h2>逐条款审查</h2>
    ${r.clauses
      .map(
        (c) => `
      <div class="clause">
        <p><strong>${c.title}</strong> <span class="${c.status}">[${c.statusName || c.status}]</span></p>
        <p>${c.content}</p>
        ${c.suggestion ? `<p><em>建议：${c.suggestion}</em></p>` : ''}
      </div>
    `
      )
      .join('')}
    <h2>审查报告</h2>
    <pre style="white-space: pre-wrap;">${r.report}</pre>
    </body></html>
  `)
  w.document.close()
  w.print()
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="page-container contract-page">
    <div class="card">
      <el-tabs v-model="activeTab" class="contract-tabs">
        <!-- 合同列表 -->
        <el-tab-pane label="合同列表" name="list">
          <div v-loading="listLoading">
            <el-table :data="list" empty-text="暂无合同">
              <el-table-column label="合同标题" prop="title" min-width="200" show-overflow-tooltip />
              <el-table-column label="类型" prop="typeName" width="110">
                <template #default="{ row }">{{ row.typeName || row.type }}</template>
              </el-table-column>
              <el-table-column label="签约方" prop="party" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">{{ row.partyB || row.party }}</template>
              </el-table-column>
              <el-table-column label="金额" width="130" align="right">
                <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column label="签订日期" prop="signDate" width="120" />
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="statusTag(row.status).type" size="small">
                    {{ statusTag(row.status).text }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="风险等级" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="riskTag(row.riskLevel).type" size="small" effect="dark">
                    {{ riskTag(row.riskLevel).text }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link size="small">查看</el-button>
                  <el-button type="warning" link size="small" @click="activeTab = 'review'; reviewForm.content = row.content || ''">
                    AI审查
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- AI 起草 -->
        <el-tab-pane label="AI 起草" name="draft">
          <div class="draft-section">
            <div class="section-title">
              <el-icon><MagicStick /></el-icon> AI 合同起草
            </div>
            <div class="draft-layout">
              <div class="draft-form">
                <el-form :model="draftForm" label-width="100px">
                  <el-form-item label="合同类型" required>
                    <el-select v-model="draftForm.type" style="width: 100%">
                      <el-option
                        v-for="t in contractTypes"
                        :key="t.value"
                        :label="t.label"
                        :value="t.value"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="甲方">
                    <el-input v-model="draftForm.partyA" />
                  </el-form-item>
                  <el-form-item label="乙方" required>
                    <el-input v-model="draftForm.partyB" placeholder="请输入签约对方" />
                  </el-form-item>
                  <el-form-item label="合同金额">
                    <el-input-number
                      v-model="draftForm.amount"
                      :min="0"
                      :step="10000"
                      style="width: 100%"
                    />
                  </el-form-item>
                  <el-form-item label="合同期限">
                    <el-date-picker
                      v-model="draftForm.startDate"
                      type="date"
                      value-format="YYYY-MM-DD"
                      placeholder="开始日期"
                      style="width: 48%"
                    />
                    <span style="margin: 0 2%">至</span>
                    <el-date-picker
                      v-model="draftForm.endDate"
                      type="date"
                      value-format="YYYY-MM-DD"
                      placeholder="结束日期"
                      style="width: 48%"
                    />
                  </el-form-item>
                  <el-form-item label="标的物">
                    <el-input
                      v-model="draftForm.subject"
                      type="textarea"
                      :rows="2"
                      placeholder="合同标的物描述"
                    />
                  </el-form-item>
                  <el-form-item label="付款方式">
                    <el-input v-model="draftForm.paymentTerms" placeholder="如：分期付款/月结30天" />
                  </el-form-item>
                  <el-form-item label="其他要求">
                    <el-input
                      v-model="draftForm.otherRequirements"
                      type="textarea"
                      :rows="3"
                      placeholder="其他AI需要考虑的要素"
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button
                      type="primary"
                      :icon="MagicStick"
                      :loading="draftLoading"
                      @click="handleDraft"
                    >
                      AI 生成合同
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <div class="draft-result">
                <div class="dr-title">
                  <span><el-icon><Document /></el-icon> 生成的合同文本</span>
                  <el-button v-if="draftContent" type="primary" plain size="small" :icon="Plus">
                    保存
                  </el-button>
                </div>
                <div v-if="draftLoading" class="ai-loading">
                  <el-icon class="loading-icon"><Loading /></el-icon>
                  <span>AI 正在生成合同文本...</span>
                  <div class="skeleton-line" v-for="i in 8" :key="i"></div>
                </div>
                <el-input
                  v-else-if="draftContent"
                  v-model="draftContent"
                  type="textarea"
                  :rows="22"
                  class="draft-textarea"
                />
                <el-empty v-else description="填写要素后点击「AI生成合同」" :image-size="80" />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 合同审查 -->
        <el-tab-pane label="合同审查" name="review">
          <div class="review-section">
            <div class="section-title">
              <el-icon><MagicStick /></el-icon> AI 合同审查与对比
            </div>

            <!-- 对比区 -->
            <div class="compare-area">
              <div class="compare-col">
                <div class="cc-title">原版本</div>
                <el-input
                  v-model="reviewForm.content"
                  type="textarea"
                  :rows="10"
                  placeholder="粘贴合同版本1"
                />
              </div>
              <div class="compare-col">
                <div class="cc-title">对比版本</div>
                <el-input
                  v-model="compareV2"
                  type="textarea"
                  :rows="10"
                  placeholder="粘贴合同版本2（可选，用于对比）"
                />
              </div>
            </div>

            <div class="review-actions">
              <el-button
                type="success"
                :icon="Check"
                :loading="compareLoading"
                @click="handleCompare"
              >
                AI 版本对比
              </el-button>
              <el-button
                type="warning"
                :icon="MagicStick"
                :loading="reviewLoading"
                @click="handleReview"
              >
                AI 合同审查
              </el-button>
            </div>

            <!-- 对比结果 -->
            <div v-if="compareLoading" class="ai-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>AI 对比中...</span>
              <div class="skeleton-line" v-for="i in 3" :key="i"></div>
            </div>
            <div v-else-if="compareResult" class="compare-result">
              <div class="cr-summary">{{ compareResult.summary }}</div>
              <div class="diff-list">
                <div
                  v-for="(d, i) in compareResult.diffs"
                  :key="i"
                  class="diff-item"
                  :class="`diff-${d.type}`"
                >
                  <el-tag :type="d.type === 'add' ? 'success' : d.type === 'delete' ? 'danger' : 'warning'" size="small">
                    {{ d.type === 'add' ? '新增' : d.type === 'delete' ? '删除' : '修改' }}
                  </el-tag>
                  <span class="diff-line">第{{ d.line }}行</span>
                  <span class="diff-content">
                    <span v-if="d.content1" class="line-old">{{ d.content1 }}</span>
                    <span v-if="d.content2" class="line-new">→ {{ d.content2 }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 审查结果 -->
            <div v-if="reviewLoading" class="ai-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>AI 审查中...</span>
              <div class="skeleton-line" v-for="i in 5" :key="i"></div>
            </div>
            <div v-else-if="reviewResult" class="review-result">
              <div class="rr-header">
                <div class="rr-level">
                  风险等级：
                  <el-tag :type="riskTag(reviewResult.riskLevel).type" effect="dark">
                    {{ reviewResult.riskLevelName || riskTag(reviewResult.riskLevel).text }}
                  </el-tag>
                </div>
                <div class="rr-actions">
                  <el-button :icon="Download" size="small" @click="exportReport">导出PDF</el-button>
                  <el-button :icon="Printer" size="small" @click="exportReport">打印</el-button>
                </div>
              </div>

              <div class="rr-clauses">
                <div class="rr-section-title">逐条款审查</div>
                <div
                  v-for="(c, i) in reviewResult.clauses"
                  :key="i"
                  class="clause-item"
                  :class="`clause-${c.status}`"
                >
                  <div class="clause-head">
                    <el-icon :color="clauseStatus(c.status).type === 'danger' ? '#e94f4f' : clauseStatus(c.status).type === 'success' ? '#2bb673' : '#f5a623'">
                      <component :is="clauseStatus(c.status).icon" />
                    </el-icon>
                    <span class="clause-title">{{ c.title }}</span>
                    <el-tag :type="clauseStatus(c.status).type" size="small">
                      {{ c.statusName || clauseStatus(c.status).text }}
                    </el-tag>
                  </div>
                  <div class="clause-content">{{ c.content }}</div>
                  <div class="clause-suggestion" v-if="c.suggestion">
                    <el-icon><Warning /></el-icon>
                    <span>{{ c.suggestion }}</span>
                  </div>
                </div>
              </div>

              <div class="rr-report">
                <div class="rr-section-title">审查报告</div>
                <pre class="report-text">{{ reviewResult.report }}</pre>
              </div>

              <div class="rr-conclusion" v-if="reviewResult.conclusion">
                <el-icon><Check /></el-icon>
                <span>{{ reviewResult.conclusion }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.contract-page {
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 16px 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 起草 */
.draft-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
}
.draft-result {
  background: var(--bg-page);
  border-radius: 8px;
  padding: 12px;
  min-height: 480px;
}
.dr-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}
.dr-title span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.draft-textarea :deep(.el-textarea__inner) {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
}

/* 审查 */
.compare-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}
.cc-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-secondary);
}
.review-actions {
  display: flex;
  gap: 10px;
  margin: 16px 0;
}

.compare-result {
  background: var(--bg-page);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}
.cr-summary {
  font-size: 14px;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--border-color);
}
.diff-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.diff-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
}
.diff-add {
  border-left: 3px solid var(--success);
}
.diff-delete {
  border-left: 3px solid var(--danger);
}
.diff-modify {
  border-left: 3px solid var(--warning);
}
.diff-line {
  color: var(--text-secondary);
  flex-shrink: 0;
}
.diff-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.line-old {
  color: var(--danger);
  text-decoration: line-through;
}
.line-new {
  color: var(--success);
}

.review-result {
  background: var(--bg-page);
  padding: 16px;
  border-radius: 8px;
}
.rr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}
.rr-level {
  font-size: 15px;
  font-weight: 600;
}
.rr-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 12px 0;
}
.rr-clauses {
  margin-bottom: 16px;
}
.clause-item {
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 3px solid;
}
.clause-pass {
  border-color: var(--success);
}
.clause-fail {
  border-color: var(--danger);
  background: rgba(233, 79, 79, 0.04);
}
.clause-warn {
  border-color: var(--warning);
}
.clause-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.clause-title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}
.clause-content {
  font-size: 13px;
  color: var(--text-regular);
  margin: 4px 0;
  line-height: 1.7;
}
.clause-suggestion {
  display: flex;
  gap: 4px;
  font-size: 12px;
  color: var(--warning);
  background: rgba(245, 166, 35, 0.08);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.report-text {
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  color: var(--text-regular);
}

.rr-conclusion {
  margin-top: 16px;
  padding: 12px;
  background: rgba(43, 182, 115, 0.08);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--success);
  font-weight: 500;
}

/* AI loading */
.ai-loading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 20px;
  background: var(--bg-page);
  border-radius: 6px;
  margin: 10px 0;
}
.loading-icon {
  animation: rotate 1.5s linear infinite;
  color: var(--accent);
}
@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .draft-layout,
  .compare-area {
    grid-template-columns: 1fr;
  }
}
</style>

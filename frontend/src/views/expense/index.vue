<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Microphone,
  Upload,
  Camera,
  MagicStick,
  Loading,
  Check,
  Close,
  Warning,
  Wallet,
  Coin
} from '@element-plus/icons-vue'
import {
  parseCommand,
  autoFill,
  checkCompliance,
  getBudget,
  createExpense,
  getExpenses,
  type ExpenseItem,
  type ComplianceResult,
  type BudgetResult
} from '@/api/expense'
import { ocrInvoice } from '@/api/ai'

const router = useRouter()
const activeTab = ref('voice')

// ============ 一句话报销 ============
const command = ref('')
const parseLoading = ref(false)
const parsedResult = ref<any>(null)

const examples = [
  '昨天请客户吃饭花了800元',
  '打车去机场50元',
  '6月15日购买办公电脑一台5800元',
  '上周末出差住宿费450元 项目A'
]

async function handleParse() {
  if (!command.value.trim()) {
    ElMessage.warning('请输入报销描述')
    return
  }
  parseLoading.value = true
  parsedResult.value = null
  try {
    const res: any = await parseCommand(command.value)
    const data = res?.data ?? res
    parsedResult.value = data
    if (data?.fields) {
      Object.keys(data.fields).forEach((k) => {
        if (data.fields[k] !== undefined && data.fields[k] !== null) {
          ;(form as any)[k] = data.fields[k]
        }
      })
    }
    ElMessage.success('解析成功，已自动填入表单')
  } catch (e) {
    // ignore
  } finally {
    parseLoading.value = false
  }
}

// 语音输入（Web Speech API）
const speeching = ref(false)
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

function toggleSpeech() {
  if (!SpeechRecognition) {
    ElMessage.info('当前浏览器不支持语音输入，请使用Chrome')
    return
  }
  if (speeching.value) {
    speeching.value = false
    return
  }
  const rec = new SpeechRecognition()
  rec.lang = 'zh-CN'
  rec.continuous = false
  rec.interimResults = false
  rec.onstart = () => {
    speeching.value = true
    ElMessage.info('开始录音，请说话...')
  }
  rec.onresult = (e: any) => {
    command.value = e.results[0][0].transcript
  }
  rec.onerror = () => {
    ElMessage.error('语音识别失败')
  }
  rec.onend = () => {
    speeching.value = false
  }
  rec.start()
}

// ============ 拍照报销 ============
const fileList = ref<any[]>([])
const ocrLoading = ref(false)

async function handleFileChange(file: any, files: any[]) {
  fileList.value = files
  if (file.status === 'ready') {
    await runOcr(file.raw)
  }
}

async function runOcr(file: File) {
  ocrLoading.value = true
  try {
    const res: any = await ocrInvoice(file)
    const data = res?.data ?? res
    if (data?.amount) form.amount = data.amount
    if (data?.date) form.date = data.date
    if (data?.description) form.description = data.description
    if (data?.type) form.type = data.type
    ElMessage.success('OCR识别完成，已自动填入表单')
  } catch (e) {
    // ignore
  } finally {
    ocrLoading.value = false
  }
}

// ============ 报销表单 ============
const form = reactive({
  type: '',
  amount: undefined as number | undefined,
  date: '',
  department: '信息中心',
  project: '',
  description: '',
  attachments: [] as any[]
})

const expenseTypes = [
  { label: '差旅费', value: 'travel' },
  { label: '餐饮费', value: 'meal' },
  { label: '交通费', value: 'traffic' },
  { label: '办公用品', value: 'office' },
  { label: '通讯费', value: 'communication' },
  { label: '业务招待', value: 'entertain' },
  { label: '会议费', value: 'meeting' },
  { label: '培训费', value: 'training' },
  { label: '其他', value: 'other' }
]

const autofillLoading = ref(false)
async function handleAutoFill() {
  autofillLoading.value = true
  try {
    const res: any = await autoFill({ department: form.department, type: form.type })
    const data = res?.data ?? res
    Object.keys(data || {}).forEach((k) => {
      if (data[k] !== undefined && data[k] !== null && (form as any)[k] !== undefined) {
        ;(form as any)[k] = data[k]
      }
    })
    ElMessage.success('AI智能填单完成')
  } catch (e) {
    // ignore
  } finally {
    autofillLoading.value = false
  }
}

// ============ 合规校验 ============
const compliance = ref<ComplianceResult | null>(null)
const complianceLoading = ref(false)

async function handleCompliance() {
  complianceLoading.value = true
  try {
    const res: any = await checkCompliance({ ...form })
    compliance.value = res?.data ?? res
    if (compliance.value?.passed) {
      ElMessage.success('合规校验通过')
    } else {
      ElMessage.warning('存在不合规项，请检查')
    }
  } catch (e) {
    // ignore
  } finally {
    complianceLoading.value = false
  }
}

// ============ 预算查询 ============
const budget = ref<BudgetResult | null>(null)
const budgetLoading = ref(false)

async function handleBudget() {
  budgetLoading.value = true
  try {
    const res: any = await getBudget(form.department, form.type)
    budget.value = res?.data ?? res
  } catch (e) {
    // ignore
  } finally {
    budgetLoading.value = false
  }
}

// ============ 提交 ============
const submitting = ref(false)
async function handleSubmit() {
  if (!form.type) {
    ElMessage.warning('请选择费用类型')
    return
  }
  if (!form.amount || form.amount <= 0) {
    ElMessage.warning('请输入金额')
    return
  }
  submitting.value = true
  try {
    await createExpense({ ...form })
    ElMessage.success('报销单提交成功')
    setTimeout(() => router.push('/todo'), 1000)
  } catch (e) {
    // ignore
  } finally {
    submitting.value = false
  }
}

// ============ 历史报销 ============
const history = ref<ExpenseItem[]>([])
const historyLoading = ref(false)
async function fetchHistory() {
  historyLoading.value = true
  try {
    const res: any = await getExpenses()
    history.value = res?.data ?? res ?? []
  } catch (e) {
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

function statusTag(s: string) {
  return (
    {
      pending: { type: 'warning', text: '待审批' },
      approved: { type: 'success', text: '已通过' },
      rejected: { type: 'danger', text: '已驳回' }
    } as any
  )[s] || { type: 'info', text: s }
}

function typeName(v: string) {
  return expenseTypes.find((t) => t.value === v)?.label || v
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="page-container expense-page">
    <div class="card">
      <el-tabs v-model="activeTab" class="expense-tabs">
        <!-- 一句话报销 -->
        <el-tab-pane label="一句话报销" name="voice">
          <div class="voice-section">
            <div class="section-title">
              <el-icon><Microphone /></el-icon> 智能语音/文字报销
            </div>
            <el-input
              v-model="command"
              type="textarea"
              :rows="4"
              placeholder="请输入或说出报销内容，例如：昨天请客户吃饭花了800元"
              maxlength="200"
              show-word-limit
            />
            <div class="example-row">
              <span class="ex-label">示例：</span>
              <el-tag
                v-for="(ex, i) in examples"
                :key="i"
                class="example-tag"
                effect="plain"
                @click="command = ex"
              >
                {{ ex }}
              </el-tag>
            </div>
            <div class="voice-actions">
              <el-button
                :type="speeching ? 'danger' : 'default'"
                :icon="Microphone"
                @click="toggleSpeech"
              >
                {{ speeching ? '停止录音' : '语音输入' }}
              </el-button>
              <el-button
                type="primary"
                :icon="MagicStick"
                :loading="parseLoading"
                @click="handleParse"
              >
                AI 解析
              </el-button>
            </div>

            <div v-if="parsedResult" class="parsed-result">
              <div class="pr-title">
                <el-icon><Check /></el-icon> AI解析结果
                <el-tag size="small" type="success">置信度 {{ (parsedResult.confidence || 0.9) * 100 }}%</el-tag>
              </div>
              <div class="pr-fields" v-if="parsedResult.fields">
                <div v-for="(v, k) in parsedResult.fields" :key="k" class="pr-field">
                  <span class="pr-label">{{ k }}</span>
                  <span class="pr-value">{{ v }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 拍照报销 -->
        <el-tab-pane label="拍照报销" name="photo">
          <div class="photo-section">
            <div class="section-title">
              <el-icon><Camera /></el-icon> 拍照/上传报销单据
            </div>
            <el-upload
              drag
              multiple
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="fileList"
              accept="image/*"
              list-type="picture"
            >
              <el-icon class="upload-icon"><Upload /></el-icon>
              <div class="upload-text">将发票/单据拖到此处，或<em>点击上传</em></div>
              <template #tip>
                <div class="upload-tip">支持 JPG/PNG 格式，单文件不超过 10MB，支持摄像头拍照</div>
              </template>
            </el-upload>

            <div v-if="ocrLoading" class="ocr-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>OCR 识别中...</span>
            </div>
          </div>
        </el-tab-pane>

        <!-- 历史报销单 -->
        <el-tab-pane label="历史报销单" name="history">
          <div v-loading="historyLoading">
            <el-table :data="history" empty-text="暂无历史报销单">
              <el-table-column label="费用类型" width="120">
                <template #default="{ row }">{{ typeName(row.type) }}</template>
              </el-table-column>
              <el-table-column label="金额" width="130" align="right">
                <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column label="部门" prop="department" width="120" />
              <el-table-column label="项目" prop="project" width="120" />
              <el-table-column label="描述" prop="description" min-width="180" show-overflow-tooltip />
              <el-table-column label="提交时间" prop="submitTime" width="160" />
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="statusTag(row.status).type" size="small">
                    {{ statusTag(row.status).text }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 报销表单 -->
    <div class="card form-card" v-if="activeTab === 'voice' || activeTab === 'photo'">
      <div class="card-title">
        <span><el-icon><Wallet /></el-icon> 报销单信息</span>
        <div class="title-actions">
          <el-button
            type="warning"
            plain
            size="small"
            :icon="MagicStick"
            :loading="autofillLoading"
            @click="handleAutoFill"
          >
            AI 智能填单
          </el-button>
        </div>
      </div>

      <el-form :model="form" label-width="100px" label-position="right">
        <div class="form-grid">
          <el-form-item label="费用类型" required>
            <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
              <el-option
                v-for="t in expenseTypes"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="金额" required>
            <el-input-number
              v-model="form.amount"
              :min="0"
              :precision="2"
              :step="100"
              style="width: 100%"
              placeholder="请输入金额"
            />
          </el-form-item>
          <el-form-item label="发生日期">
            <el-date-picker
              v-model="form.date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="所属部门">
            <el-input v-model="form.department" />
          </el-form-item>
          <el-form-item label="所属项目">
            <el-input v-model="form.project" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="费用描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入费用描述"
            />
          </el-form-item>
        </div>

        <!-- 合规 + 预算 -->
        <div class="extra-row">
          <el-button
            type="primary"
            plain
            :icon="Check"
            :loading="complianceLoading"
            @click="handleCompliance"
          >
            合规风控校验
          </el-button>
          <el-button
            type="success"
            plain
            :icon="Coin"
            :loading="budgetLoading"
            @click="handleBudget"
          >
            查询预算余额
          </el-button>
        </div>

        <!-- 合规结果 -->
        <div v-if="compliance" class="compliance-result" :class="compliance.passed ? 'pass' : 'fail'">
          <div class="cr-head">
            <el-icon :color="compliance.passed ? '#2bb673' : '#e94f4f'">
              <Check v-if="compliance.passed" />
              <Warning v-else />
            </el-icon>
            <span>{{ compliance.passed ? '合规校验通过' : '存在不合规项' }}</span>
          </div>
          <div class="cr-items">
            <div
              v-for="(it, i) in compliance.items"
              :key="i"
              class="cr-item"
              :class="{ 'is-fail': !it.passed }"
            >
              <el-icon :color="it.passed ? '#2bb673' : '#e94f4f'">
                <Check v-if="it.passed" />
                <Close v-else />
              </el-icon>
              <div>
                <div class="cr-rule">{{ it.rule }}</div>
                <div class="cr-msg">{{ it.message }}</div>
              </div>
            </div>
          </div>
          <div class="cr-suggestion" v-if="compliance.suggestion">
            建议：{{ compliance.suggestion }}
          </div>
        </div>

        <!-- 预算结果 -->
        <div v-if="budget" class="budget-result">
          <div class="br-title">
            <el-icon><Coin /></el-icon> {{ budget.department }} 预算余额
          </div>
          <div class="br-grid">
            <div class="br-item">
              <div class="br-label">总预算</div>
              <div class="br-value">¥{{ budget.total.toLocaleString() }}</div>
            </div>
            <div class="br-item">
              <div class="br-label">已使用</div>
              <div class="br-value warning">¥{{ budget.used.toLocaleString() }}</div>
            </div>
            <div class="br-item">
              <div class="br-label">剩余</div>
              <div class="br-value success">¥{{ budget.remaining.toLocaleString() }}</div>
            </div>
            <div class="br-item">
              <div class="br-label">使用率</div>
              <div class="br-value" :class="budget.usageRate > 80 ? 'danger' : ''">
                {{ budget.usageRate }}%
              </div>
            </div>
          </div>
          <el-progress
            :percentage="budget.usageRate"
            :color="budget.usageRate > 80 ? '#e94f4f' : '#2bb673'"
            :stroke-width="8"
          />
        </div>

        <!-- 提交 -->
        <div class="submit-row">
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            :icon="Check"
            @click="handleSubmit"
          >
            提交报销单
          </el-button>
          <el-button size="large" @click="router.push('/todo')">取消</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.expense-page {
  padding: 16px;
}

.expense-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.expense-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
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

.example-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
}
.ex-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.example-tag {
  cursor: pointer;
}

.voice-actions {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.parsed-result {
  margin-top: 16px;
  padding: 12px;
  background: rgba(232, 115, 74, 0.06);
  border-left: 3px solid var(--accent);
  border-radius: 6px;
}
.pr-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 10px;
}
.pr-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.pr-field {
  background: #fff;
  padding: 8px 12px;
  border-radius: 4px;
}
.pr-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}
.pr-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

/* 拍照 */
.upload-icon {
  font-size: 48px;
  color: var(--primary);
  margin-bottom: 12px;
}
.upload-text {
  color: var(--text-regular);
  font-size: 14px;
}
.upload-text em {
  color: var(--primary);
  font-style: normal;
}
.upload-tip {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}
.ocr-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(91, 143, 249, 0.06);
  border-radius: 6px;
  color: var(--info);
  font-size: 13px;
}

/* 表单 */
.form-card {
  margin-top: 16px;
}
.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}
.card-title span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 24px;
}
.form-grid > .el-form-item:last-child {
  grid-column: 1 / -1;
}

.extra-row {
  display: flex;
  gap: 12px;
  margin: 20px 0 16px;
  padding: 12px 0;
  border-top: 1px dashed var(--border-light);
  border-bottom: 1px dashed var(--border-light);
}

/* 合规 */
.compliance-result {
  padding: 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  border-left: 3px solid;
}
.compliance-result.pass {
  background: rgba(43, 182, 115, 0.06);
  border-color: var(--success);
}
.compliance-result.fail {
  background: rgba(233, 79, 79, 0.06);
  border-color: var(--danger);
}
.cr-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 10px;
}
.cr-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.cr-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
}
.cr-item.is-fail {
  background: rgba(233, 79, 79, 0.05);
}
.cr-rule {
  font-size: 13px;
  font-weight: 600;
}
.cr-msg {
  font-size: 12px;
  color: var(--text-secondary);
}
.cr-suggestion {
  margin-top: 10px;
  padding: 8px;
  background: rgba(245, 166, 35, 0.08);
  border-radius: 4px;
  font-size: 13px;
  color: var(--warning);
}

/* 预算 */
.budget-result {
  padding: 14px;
  background: rgba(43, 182, 115, 0.06);
  border-radius: 6px;
  margin-bottom: 16px;
  border-left: 3px solid var(--success);
}
.br-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 10px;
}
.br-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.br-item {
  background: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: center;
}
.br-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.br-value {
  font-size: 16px;
  font-weight: 600;
}
.br-value.warning {
  color: var(--warning);
}
.br-value.success {
  color: var(--success);
}
.br-value.danger {
  color: var(--danger);
}

.submit-row {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .pr-fields,
  .cr-items,
  .br-grid {
    grid-template-columns: 1fr;
  }
}
</style>

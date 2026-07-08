<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Warning,
  Clock,
  Document,
  Check,
  Close,
  Share,
  Tickets,
  Calendar,
  TrendCharts,
  Coin,
  MagicStick,
  Loading
} from '@element-plus/icons-vue'
import { useTodoStore } from '@/stores/todo'
import { batchApprove as batchApproveApi, aiBatchApprove } from '@/api/todo'
import type { TodoItem, AiBatchResultItem } from '@/api/todo'

const router = useRouter()
const store = useTodoStore()

// ============ 类型 / 状态 / 排序选项 ============
const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '合同审批', value: 'contract' },
  { label: '报销审批', value: 'expense' },
  { label: '采购审批', value: 'purchase' },
  { label: '项目审批', value: 'project' },
  { label: '资产审批', value: 'asset' }
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待审批', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' }
]

const sortOptions = [
  { label: '按时间', value: 'time' },
  { label: '按紧急程度', value: 'urgency' }
]

// ============ 统计卡片 ============
const statsCards = computed(() => [
  {
    label: '待处理',
    value: store.stats.pending,
    icon: Clock,
    color: '#1a3a5c',
    bg: 'rgba(26, 58, 92, 0.1)'
  },
  {
    label: '已超时',
    value: store.stats.timeout,
    icon: Warning,
    color: '#e94f4f',
    bg: 'rgba(233, 79, 79, 0.1)'
  },
  {
    label: '今日新增',
    value: store.stats.todayNew,
    icon: Tickets,
    color: '#2bb673',
    bg: 'rgba(43, 182, 115, 0.1)'
  },
  {
    label: '本月处理',
    value: store.stats.monthProcessed,
    icon: TrendCharts,
    color: '#e8734a',
    bg: 'rgba(232, 115, 74, 0.1)'
  }
])

// ============ 表格 ============
const tableData = computed(() => store.todoList)

function typeTag(type?: string) {
  const map: Record<string, { type: string; text: string }> = {
    contract: { type: 'primary', text: '合同' },
    expense: { type: 'success', text: '报销' },
    purchase: { type: 'warning', text: '采购' },
    project: { type: 'info', text: '项目' },
    asset: { type: 'danger', text: '资产' }
  }
  return type ? map[type] || { type: 'info', text: type } : { type: 'info', text: '—' }
}

function statusTag(status?: string) {
  const map: Record<string, { type: string; text: string }> = {
    pending: { type: 'warning', text: '待审批' },
    processing: { type: 'primary', text: '处理中' },
    approved: { type: 'success', text: '已通过' },
    rejected: { type: 'danger', text: '已驳回' }
  }
  return status ? map[status] || { type: 'info', text: status } : { type: 'info', text: '—' }
}

function urgencyTag(u?: string) {
  const map: Record<string, { type: string; text: string }> = {
    high: { type: 'danger', text: '紧急' },
    medium: { type: 'warning', text: '一般' },
    low: { type: 'info', text: '低' }
  }
  return u ? map[u] || { type: 'info', text: u } : null
}

function formatTime(t?: string) {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}

// 表格行 class
function rowClass({ row }: { row: TodoItem }) {
  return row.isTimeout ? 'timeout-row' : ''
}

// ============ 选择 ============
const allIds = computed(() => tableData.value.map((t) => t.id))
const isAllSelected = computed(
  () =>
    allIds.value.length > 0 &&
    allIds.value.every((id) => store.selectedIds.includes(id))
)
const isIndeterminate = computed(() => {
  const sel = store.selectedIds.length
  return sel > 0 && sel < allIds.value.length
})

function handleSelectAll(val: any) {
  if (val) {
    store.selectedIds = [...allIds.value]
  } else {
    store.selectedIds = []
  }
}

function handleSelect(id: string | number) {
  store.selectTodo(id)
}

// ============ 筛选 / 排序 ============
function handleSearch() {
  store.page = 1
  store.fetchTodos()
}

function handleReset() {
  store.resetFilters()
  store.fetchTodos()
}

function handleSortChange() {
  store.page = 1
  store.fetchTodos()
}

function handlePageChange(p: number) {
  store.page = p
  store.fetchTodos()
}

function handleSizeChange(s: number) {
  store.pageSize = s
  store.page = 1
  store.fetchTodos()
}

// ============ 行点击 / 跳转 ============
function handleRowClick(row: TodoItem) {
  router.push(`/approval/${row.id}?from=todo`)
}

function goApproval(row: TodoItem) {
  router.push(`/approval/${row.id}?from=todo`)
}

function goAiAudit(row: TodoItem) {
  router.push(`/ai-audit/${row.id}?from=todo`)
}

// ============ 批量操作 ============
const batchDialog = reactive({
  visible: false,
  action: 'approve' as 'approve' | 'reject' | 'transfer',
  opinion: '',
  transferTo: ''
})

function openBatchDialog(action: 'approve' | 'reject' | 'transfer') {
  if (!store.hasSelection) {
    ElMessage.warning('请先选择待办项')
    return
  }
  batchDialog.action = action
  batchDialog.opinion = ''
  batchDialog.transferTo = ''
  batchDialog.visible = true
}

async function submitBatch() {
  if (
    batchDialog.action === 'reject' &&
    !batchDialog.opinion.trim()
  ) {
    ElMessage.warning('请输入驳回意见')
    return
  }
  if (
    batchDialog.action === 'transfer' &&
    !batchDialog.transferTo.trim()
  ) {
    ElMessage.warning('请输入转交人')
    return
  }

  try {
    await batchApproveApi({
      ids: store.selectedIds,
      action: batchDialog.action,
      opinion: batchDialog.opinion,
      transferTo: batchDialog.transferTo
    })
    ElMessage.success('批量操作成功')
    batchDialog.visible = false
    store.clearSelection()
    store.fetchTodos()
  } catch (e) {
    // 错误已统一处理
  }
}

const batchActionText = computed(() => {
  return {
    approve: '批量通过',
    reject: '批量驳回',
    transfer: '批量转交'
  }[batchDialog.action]
})

// ============ AI 批量审批 ============
const aiBatchDialog = reactive({
  visible: false,
  loading: false,
  results: [] as AiBatchResultItem[],
  executed: false
})

async function openAiBatch() {
  if (!store.hasSelection) {
    ElMessage.warning('请先选择待办项')
    return
  }
  aiBatchDialog.visible = true
  aiBatchDialog.loading = true
  aiBatchDialog.results = []
  aiBatchDialog.executed = false

  try {
    const res = await aiBatchApprove([...store.selectedIds], false)
    aiBatchDialog.results = res.data?.results || []
  } catch (e) {
    ElMessage.error('AI分析失败，请重试')
    aiBatchDialog.visible = false
  } finally {
    aiBatchDialog.loading = false
  }
}

async function executeAiBatch() {
  const approveIds = aiBatchDialog.results
    .filter((r) => r.suggestedAction === 'approve')
    .map((r) => r.id)
  const rejectIds = aiBatchDialog.results
    .filter((r) => r.suggestedAction === 'reject')
    .map((r) => r.id)

  try {
    const res = await aiBatchApprove([...store.selectedIds], true)
    aiBatchDialog.executed = true
    const exec = res.data?.executed || []
    const approved = exec.find((e: any) => e.action === 'approve')?.count || 0
    const rejected = exec.find((e: any) => e.action === 'reject')?.count || 0
    ElMessage.success(`AI批量审批完成：通过 ${approved} 项，驳回 ${rejected} 项`)
    store.clearSelection()
    store.fetchTodos()
  } catch (e) {
    ElMessage.error('AI批量执行失败')
  }
}

function riskTagType(level: string) {
  return { low: 'success', medium: 'warning', high: 'danger' }[level] || 'info'
}

function riskTagText(level: string) {
  return { low: '低风险', medium: '中风险', high: '高风险' }[level] || level
}

function actionText(action: string) {
  return { approve: '建议通过', reject: '建议驳回' }[action] || action
}

// ============ 移动端：选中 ============
const mobileSelected = ref<Set<string | number>>(new Set())

function toggleMobileSelect(id: string | number) {
  if (mobileSelected.value.has(id)) {
    mobileSelected.value.delete(id)
  } else {
    mobileSelected.value.add(id)
  }
}

// ============ 初始化 ============
onMounted(() => {
  store.fetchTodos()
})
</script>

<template>
  <div class="page-container todo-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-row">
      <div
        v-for="(card, i) in statsCards"
        :key="i"
        class="stat-card"
      >
        <div class="stat-icon" :style="{ background: card.bg, color: card.color }">
          <el-icon :size="22"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value" :style="{ color: card.color }">
            {{ card.value }}
          </div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="card filter-card">
      <div class="filter-row">
        <el-input
          v-model="store.filters.keyword"
          placeholder="搜索标题/申请人/单号"
          :prefix-icon="Search"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="store.filters.type"
          placeholder="类型"
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option
            v-for="opt in typeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="store.filters.status"
          placeholder="状态"
          style="width: 130px"
          @change="handleSearch"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-date-picker
          v-model="store.filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 240px"
          @change="handleSearch"
        />
        <el-select
          v-model="store.filters.sortBy"
          placeholder="排序"
          style="width: 130px"
          @change="handleSortChange"
        >
          <el-option
            v-for="opt in sortOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="store.hasSelection" class="batch-bar">
      <div class="batch-info">
        已选择 <strong>{{ store.selectedCount }}</strong> 项
        <el-button text @click="store.clearSelection()">取消</el-button>
      </div>
      <div class="batch-actions">
        <el-button
          type="warning"
          :icon="MagicStick"
          @click="openAiBatch"
          style="background: linear-gradient(135deg, #e8734a, #f5a27a); border: none;"
        >
          AI批量审批
        </el-button>
        <el-button type="primary" :icon="Check" @click="openBatchDialog('approve')">
          批量通过
        </el-button>
        <el-button type="danger" :icon="Close" @click="openBatchDialog('reject')">
          批量驳回
        </el-button>
        <el-button :icon="Share" @click="openBatchDialog('transfer')">
          批量转交
        </el-button>
      </div>
    </div>

    <!-- 桌面端表格 -->
    <div class="card table-card">
      <el-table
        v-loading="store.loading"
        :data="tableData"
        :row-class-name="rowClass"
        style="width: 100%"
        @row-click="handleRowClick"
        empty-text="暂无待办数据"
        class="todo-table"
      >
        <el-table-column width="50" align="center">
          <template #header>
            <el-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="handleSelectAll"
            />
          </template>
          <template #default="{ row }">
            <el-checkbox
              :model-value="store.selectedIds.includes(row.id)"
              @click.stop
              @change="handleSelect(row.id)"
            />
          </template>
        </el-table-column>

        <el-table-column label="标题" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="todo-title">
              <el-icon v-if="row.isTimeout" color="#e94f4f" :size="14">
                <Warning />
              </el-icon>
              <span class="title-text">{{ row.title }}</span>
              <el-icon v-if="row.summary" class="ai-icon" :size="14">
                <Coin />
              </el-icon>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type).type as any" effect="light" size="small">
              {{ typeTag(row.type).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="来源系统" prop="sourceSystem" width="120" show-overflow-tooltip />

        <el-table-column label="紧急度" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="urgencyTag(row.urgency)"
              :type="urgencyTag(row.urgency)!.type as any"
              size="small"
              effect="plain"
            >
              {{ urgencyTag(row.urgency)!.text }}
            </el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>

        <el-table-column label="申请人" prop="applicant" width="100" show-overflow-tooltip />

        <el-table-column label="部门" prop="department" width="120" show-overflow-tooltip />

        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.submitTime) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status).type as any" size="small">
              {{ statusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="goApproval(row)"
            >
              审批
            </el-button>
            <el-button
              type="warning"
              link
              size="small"
              @click.stop="goAiAudit(row)"
            >
              AI审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="store.page"
          v-model:page-size="store.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="store.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 移动端卡片列表 -->
    <div class="mobile-list">
      <div v-if="store.loading" class="mobile-loading">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="tableData.length === 0" class="empty-state">
        <el-empty description="暂无待办" />
      </div>
      <div v-else>
        <div
          v-for="item in tableData"
          :key="item.id"
          class="mobile-todo-card"
          :class="{ 'is-timeout': item.isTimeout }"
          @click="handleRowClick(item)"
        >
          <div class="m-card-header">
            <el-checkbox
              :model-value="mobileSelected.has(item.id)"
              @click.stop
              @change="toggleMobileSelect(item.id)"
            />
            <span class="m-title">{{ item.title }}</span>
            <el-icon v-if="item.isTimeout" color="#e94f4f"><Warning /></el-icon>
          </div>
          <div class="m-card-body">
            <div class="m-row">
              <span class="m-label">类型</span>
              <el-tag :type="typeTag(item.type).type as any" size="small">
                {{ typeTag(item.type).text }}
              </el-tag>
            </div>
            <div class="m-row">
              <span class="m-label">紧急度</span>
              <el-tag
                v-if="urgencyTag(item.urgency)"
                :type="urgencyTag(item.urgency)!.type as any"
                size="small"
                effect="plain"
              >
                {{ urgencyTag(item.urgency)!.text }}
              </el-tag>
              <span v-else>—</span>
            </div>
            <div class="m-row">
              <span class="m-label">申请人</span>
              <span>{{ item.applicant }} · {{ item.department }}</span>
            </div>
            <div class="m-row">
              <span class="m-label">时间</span>
              <span>{{ formatTime(item.submitTime) }}</span>
            </div>
          </div>
          <div class="m-card-footer">
            <el-tag :type="statusTag(item.status).type as any" size="small">
              {{ statusTag(item.status).text }}
            </el-tag>
            <el-button type="primary" size="small" @click.stop="goApproval(item)">
              去审批
            </el-button>
          </div>
        </div>

        <div class="m-pagination">
          <el-pagination
            v-model:current-page="store.page"
            :page-size="store.pageSize"
            :total="store.total"
            layout="prev, pager, next"
            small
            background
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 批量操作弹窗 -->
    <el-dialog
      v-model="batchDialog.visible"
      :title="batchActionText"
      width="480px"
    >
      <el-form label-width="80px">
        <el-form-item label="已选数量">
          <strong>{{ store.selectedCount }} 项</strong>
        </el-form-item>
        <el-form-item v-if="batchDialog.action === 'transfer'" label="转交人">
          <el-input
            v-model="batchDialog.transferTo"
            placeholder="请输入转交人姓名/工号"
          />
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="batchDialog.opinion"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitBatch">确定</el-button>
      </template>
    </el-dialog>

    <!-- AI批量审批弹窗 -->
    <el-dialog
      v-model="aiBatchDialog.visible"
      title="AI批量审批"
      width="800px"
      :close-on-click-modal="false"
    >
      <!-- Loading 状态 -->
      <div v-if="aiBatchDialog.loading" class="ai-batch-loading">
        <el-icon class="loading-icon" :size="40"><Loading /></el-icon>
        <p class="loading-title">AI 正在分析 {{ store.selectedCount }} 条待办...</p>
        <p class="loading-desc">系统正在逐条调用AI审核引擎，分析风险等级并生成审批建议</p>
        <el-progress :percentage="100" :indeterminate="true" :show-text="false" color="#e8734a" />
      </div>

      <!-- 分析结果 -->
      <div v-else-if="aiBatchDialog.results.length > 0" class="ai-batch-results">
        <!-- 汇总统计 -->
        <div class="ai-batch-summary">
          <div class="summary-item">
            <span class="summary-num">{{ aiBatchDialog.results.length }}</span>
            <span class="summary-label">总分析</span>
          </div>
          <div class="summary-item approve">
            <span class="summary-num">{{ aiBatchDialog.results.filter(r => r.suggestedAction === 'approve').length }}</span>
            <span class="summary-label">建议通过</span>
          </div>
          <div class="summary-item reject">
            <span class="summary-num">{{ aiBatchDialog.results.filter(r => r.suggestedAction === 'reject').length }}</span>
            <span class="summary-label">建议驳回</span>
          </div>
          <div class="summary-item high-risk">
            <span class="summary-num">{{ aiBatchDialog.results.filter(r => r.riskLevel === 'high').length }}</span>
            <span class="summary-label">高风险</span>
          </div>
        </div>

        <!-- 结果表格 -->
        <el-table :data="aiBatchDialog.results" max-height="360" size="small" style="width: 100%">
          <el-table-column label="标题" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="ai-result-title">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="风险等级" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="riskTagType(row.riskLevel) as any" size="small" effect="dark">
                {{ riskTagText(row.riskLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="AI建议" width="90" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.suggestedAction === 'approve' ? 'success' : 'danger'"
                size="small"
              >
                {{ actionText(row.suggestedAction) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="AI分析意见" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="ai-opinion-text">{{ row.aiOpinion }}</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- Mock 提示 -->
        <el-alert
          v-if="aiBatchDialog.results.some(r => r.mock)"
          title="当前为 Mock 模式（未配置大模型 API Key），配置后将使用真实 AI 分析"
          type="info"
          :closable="false"
          show-icon
          style="margin-top: 12px;"
        />

        <!-- 执行结果提示 -->
        <el-alert
          v-if="aiBatchDialog.executed"
          title="AI批量审批已执行完成，请查看待办列表"
          type="success"
          :closable="false"
          show-icon
          style="margin-top: 12px;"
        />
      </div>

      <template #footer>
        <el-button @click="aiBatchDialog.visible = false">关闭</el-button>
        <el-button
          v-if="aiBatchDialog.results.length > 0 && !aiBatchDialog.executed"
          type="warning"
          :icon="MagicStick"
          style="background: linear-gradient(135deg, #e8734a, #f5a27a); border: none;"
          @click="executeAiBatch"
        >
          一键执行AI建议
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.todo-page {
  padding: 16px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-card);
  transition: all 0.3s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 筛选 */
.filter-card {
  padding: 16px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

/* 批量栏 */
.batch-bar {
  background: linear-gradient(135deg, #1a3a5c, #2c5485);
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-card);
}
.batch-info {
  font-size: 14px;
}
.batch-info strong {
  color: var(--accent);
  margin: 0 4px;
  font-size: 16px;
}
.batch-info .el-button {
  color: #fff;
  margin-left: 12px;
}
.batch-actions {
  display: flex;
  gap: 8px;
}

/* 表格 */
.table-card {
  padding: 8px 16px 16px;
}
.todo-table :deep(.el-table__row) {
  cursor: pointer;
}
.todo-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.title-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-icon {
  color: var(--accent);
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
}

/* 移动端 */
.mobile-list {
  display: none;
}
.mobile-loading,
.mobile-todo-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-base);
}
.mobile-todo-card.is-timeout {
  border-left: 3px solid var(--danger);
}
.m-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.m-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-card-body {
  font-size: 13px;
  color: var(--text-regular);
}
.m-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}
.m-label {
  color: var(--text-secondary);
}
.m-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
}
.m-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .stat-card {
    padding: 12px;
  }
  .stat-value {
    font-size: 22px;
  }
  .stat-icon {
    width: 38px;
    height: 38px;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-row .el-input,
  .filter-row .el-select,
  .filter-row .el-date-editor {
    width: 100% !important;
  }
  .filter-actions {
    margin-left: 0;
    justify-content: stretch;
  }
  .filter-actions .el-button {
    flex: 1;
  }
  .table-card,
  .batch-bar {
    display: none;
  }
  .mobile-list {
    display: block;
  }
}

/* AI批量审批弹窗 */
.ai-batch-loading {
  text-align: center;
  padding: 40px 20px;
}
.ai-batch-loading .loading-icon {
  animation: rotate 1.5s linear infinite;
  color: #e8734a;
}
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.ai-batch-loading .loading-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a3a5c;
  margin: 16px 0 8px;
}
.ai-batch-loading .loading-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 24px;
}
.ai-batch-loading .el-progress {
  width: 300px;
  margin: 0 auto;
}

.ai-batch-results {
  /* results container */
}
.ai-batch-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.ai-batch-summary .summary-item {
  flex: 1;
  text-align: center;
  padding: 14px 8px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.ai-batch-summary .summary-item.approve {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.ai-batch-summary .summary-item.reject {
  background: #fef2f2;
  border-color: #fecaca;
}
.ai-batch-summary .summary-item.high-risk {
  background: #fffbeb;
  border-color: #fde68a;
}
.ai-batch-summary .summary-num {
  display: block;
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  color: #1a3a5c;
}
.ai-batch-summary .summary-item.approve .summary-num { color: #16a34a; }
.ai-batch-summary .summary-item.reject .summary-num { color: #dc2626; }
.ai-batch-summary .summary-item.high-risk .summary-num { color: #d97706; }
.ai-batch-summary .summary-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}
.ai-result-title {
  font-size: 13px;
  font-weight: 500;
}
.ai-opinion-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}
</style>

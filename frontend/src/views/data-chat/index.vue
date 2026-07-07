<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Promotion,
  CopyDocument,
  Connection,
  DataAnalysis,
  ChatLineRound
} from '@element-plus/icons-vue'
import {
  getSessions,
  createSession,
  getSessionById,
  deleteSession,
  ask,
  getChatConnectors,
  type ChatSession,
  type ChatMessage,
  type ChatConnector,
  type ChatChart
} from '@/api/dataChat'

/* ============ 响应式状态 ============ */
const sessions = ref<ChatSession[]>([])
const currentSession = ref<ChatSession | null>(null)
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const sending = ref(false)
const loadingSessions = ref(false)
const loadingMessages = ref(false)
const connectors = ref<ChatConnector[]>([])
const selectedConnectorId = ref<number | undefined>(undefined)

const chatAreaRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<any>(null)

// 图表实例 & 容器映射
const chartInstances = new Map<number, echarts.ECharts>()
const chartElements = new Map<number, HTMLElement>()

/* ============ 快捷问题 ============ */
const quickQuestions = [
  '查询本月报销总额',
  '统计合同数量分布',
  '分析审批效率',
  '查询待办任务总数',
  '本月各部门报销对比'
]

/* ============ 会话列表 ============ */
async function fetchSessions() {
  loadingSessions.value = true
  try {
    const res = await getSessions()
    sessions.value = res.data || []
    if (sessions.value.length > 0 && !currentSession.value) {
      await selectSession(sessions.value[0])
    }
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    loadingSessions.value = false
  }
}

/* ============ 连接器列表 ============ */
async function fetchConnectors() {
  try {
    const res = await getChatConnectors()
    connectors.value = res.data || []
    // 默认不选连接器，使用自动匹配
    // selectedConnectorId.value 保持 undefined 表示自动匹配
  } catch (e) {
    // ignore
  }
}

/* ============ 选择会话 ============ */
async function selectSession(s: ChatSession) {
  if (currentSession.value?.id === s.id) return
  // 切换前清理图表
  disposeAllCharts()
  currentSession.value = s
  loadingMessages.value = true
  messages.value = []
  try {
    const res = await getSessionById(s.id)
    const detail = res.data || s
    currentSession.value = detail
    messages.value = detail.messages || []
    await nextTick()
    initAllCharts()
    await scrollToBottom()
  } catch (e) {
    messages.value = s.messages || []
  } finally {
    loadingMessages.value = false
  }
}

/* ============ 新建会话 ============ */
async function handleNewSession() {
  try {
    const now = new Date()
    const title =
      '新对话 ' +
      now.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    const res = await createSession(title)
    const newSession = res.data
    if (newSession) {
      sessions.value.unshift(newSession)
      await selectSession(newSession)
      await nextTick()
      inputRef.value?.focus?.()
    }
  } catch (e) {
    // ignore
  }
}

/* ============ 删除会话 ============ */
async function handleDeleteSession(s: ChatSession, e: Event) {
  e.stopPropagation()
  try {
    await ElMessageBox.confirm(`确定删除会话 "${s.title}" 吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteSession(s.id)
    sessions.value = sessions.value.filter((item) => item.id !== s.id)
    if (currentSession.value?.id === s.id) {
      currentSession.value = null
      messages.value = []
      disposeAllCharts()
      if (sessions.value.length > 0) {
        await selectSession(sessions.value[0])
      }
    }
    ElMessage.success('已删除')
  } catch (e) {
    // 取消或失败
  }
}

/* ============ 发送问题 ============ */
async function handleSend() {
  const q = inputText.value.trim()
  if (!q || sending.value) return
  if (!currentSession.value) {
    await handleNewSession()
    if (!currentSession.value) return
  }

  // 用户消息
  const userMsg: ChatMessage = {
    id: Date.now(),
    role: 'user',
    content: q,
    timestamp: new Date().toISOString()
  }
  messages.value.push(userMsg)
  inputText.value = ''
  sending.value = true
  await scrollToBottom()

  // AI 占位消息（逐步渲染）
  const aiMsgId = Date.now() + 1
  const aiMsg: ChatMessage = reactive({
    id: aiMsgId,
    role: 'assistant',
    content: '',
    timestamp: new Date().toISOString()
  }) as ChatMessage
  messages.value.push(aiMsg)
  await scrollToBottom()

  try {
    const res = await ask(currentSession.value!.id, q, selectedConnectorId.value)
    const data = res.data

    // 1. AI 理解
    if (data.understanding) {
      await delay(180)
      aiMsg.understanding = data.understanding
      await scrollToBottom()
    }
    // 2. SQL
    if (data.sql) {
      await delay(180)
      aiMsg.sql = data.sql
      aiMsg.connectorName = data.connectorName
      aiMsg.autoMatched = data.autoMatched
      await scrollToBottom()
    }
    // 3. 数据表格
    if (data.columns && data.data) {
      await delay(180)
      aiMsg.columns = data.columns
      aiMsg.data = data.data
      await scrollToBottom()
    }
    // 4. 图表
    if (data.chart) {
      await delay(180)
      aiMsg.chart = data.chart
      await nextTick()
      initChartForMessage(aiMsgId)
      await scrollToBottom()
    }
    // 5. 总结
    if (data.summary) {
      await delay(180)
      aiMsg.summary = data.summary
    }
    aiMsg.content = data.content || data.summary || '回答完成'
    await scrollToBottom()
  } catch (e) {
    aiMsg.content = '回答失败，请稍后重试'
    ElMessage.error('回答失败')
  } finally {
    sending.value = false
    // 刷新会话列表（标题可能更新）
    fetchSessions().catch(() => {})
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function handleEnter(e: KeyboardEvent) {
  if (e.shiftKey) return // 允许换行
  e.preventDefault()
  handleSend()
}

function useQuickQuestion(q: string) {
  inputText.value = q
  handleSend()
}

/* ============ 滚动 ============ */
async function scrollToBottom() {
  await nextTick()
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
  }
}

/* ============ 图表 ============ */
function setChartRef(el: any, msgId: number) {
  if (el) {
    const prev = chartElements.get(msgId)
    if (prev !== el) {
      chartElements.set(msgId, el as HTMLElement)
    }
  } else {
    // 元素卸载
    const inst = chartInstances.get(msgId)
    if (inst) {
      inst.dispose()
      chartInstances.delete(msgId)
    }
    chartElements.delete(msgId)
  }
}

function initChartForMessage(msgId: number) {
  const msg = messages.value.find((m) => m.id === msgId)
  if (!msg || !msg.chart) return
  const el = chartElements.get(msgId)
  if (!el) return

  // 已存在则先销毁
  const existing = chartInstances.get(msgId)
  if (existing) {
    existing.dispose()
    chartInstances.delete(msgId)
  }
  const instance = echarts.init(el)
  instance.setOption(buildChartOption(msg.chart))
  chartInstances.set(msgId, instance)
}

function initAllCharts() {
  messages.value.forEach((m) => {
    if (m.chart) {
      nextTick(() => initChartForMessage(m.id))
    }
  })
}

function disposeAllCharts() {
  chartInstances.forEach((inst) => inst.dispose())
  chartInstances.clear()
  chartElements.clear()
}

function buildChartOption(chart: ChatChart) {
  const baseOption: any = {
    title: {
      text: chart.title,
      left: 'center',
      textStyle: { fontSize: 14, color: '#1a3a5c' }
    },
    tooltip: { trigger: chart.type === 'pie' ? 'item' : 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
  }

  if (chart.type === 'bar') {
    return {
      ...baseOption,
      xAxis: {
        type: 'category',
        data: chart.xAxis || [],
        axisLabel: {
          interval: 0,
          rotate: chart.xAxis && chart.xAxis.length > 6 ? 30 : 0
        }
      },
      yAxis: { type: 'value' },
      legend: { top: 28 },
      series: (chart.series || []).map((s) => ({
        name: s.name,
        type: 'bar',
        data: s.data,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#e8734a' },
            { offset: 1, color: '#c75930' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 40
      }))
    }
  }

  if (chart.type === 'line') {
    return {
      ...baseOption,
      xAxis: { type: 'category', data: chart.xAxis || [], boundaryGap: false },
      yAxis: { type: 'value' },
      legend: { top: 28 },
      series: (chart.series || []).map((s) => ({
        name: s.name,
        type: 'line',
        smooth: true,
        data: s.data,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(232,115,74,0.35)' },
            { offset: 1, color: 'rgba(232,115,74,0.02)' }
          ])
        },
        lineStyle: { color: '#e8734a', width: 2 },
        itemStyle: { color: '#e8734a' }
      }))
    }
  }

  if (chart.type === 'pie') {
    const series = chart.series || []
    const pieData = (series[0]?.data || []).map((v, i) => ({
      name: chart.xAxis?.[i] || `项${i + 1}`,
      value: v
    }))
    return {
      ...baseOption,
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [
        {
          name: series[0]?.name || '分布',
          type: 'pie',
          radius: chart.radius || '62%',
          center: ['62%', '55%'],
          data: pieData,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { formatter: '{b}: {d}%' }
        }
      ]
    }
  }

  return baseOption
}

/* ============ 工具方法 ============ */
async function copySql(sql: string) {
  try {
    await navigator.clipboard.writeText(sql)
    ElMessage.success('SQL 已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

function currentConnectorName() {
  if (!selectedConnectorId.value) return 'AI自动匹配'
  return (
    connectors.value.find((c) => c.id === selectedConnectorId.value)?.name ||
    'AI自动匹配'
  )
}

function connectorStatusType(s?: string) {
  if (s === 'running') return 'success'
  if (s === 'error') return 'danger'
  if (s === 'stopped') return 'info'
  return 'success'
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleResize() {
  chartInstances.forEach((inst) => inst.resize())
}

/* ============ 生命周期 ============ */
onMounted(() => {
  fetchSessions()
  fetchConnectors()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  disposeAllCharts()
})
</script>

<template>
  <div class="data-chat-page">
    <!-- 左侧栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <el-button
          type="primary"
          :icon="Plus"
          class="new-chat-btn"
          @click="handleNewSession"
        >
          新建对话
        </el-button>
      </div>

      <div class="session-list" v-loading="loadingSessions">
        <div
          v-for="s in sessions"
          :key="s.id"
          class="session-item"
          :class="{ active: currentSession?.id === s.id }"
          @click="selectSession(s)"
        >
          <el-icon class="session-icon"><ChatLineRound /></el-icon>
          <div class="session-info">
            <div class="session-title">{{ s.title }}</div>
            <div class="session-time">{{ formatTime(s.createdAt) }}</div>
          </div>
          <el-icon
            class="session-delete"
            @click="handleDeleteSession(s, $event)"
          >
            <Delete />
          </el-icon>
        </div>
        <el-empty
          v-if="!loadingSessions && sessions.length === 0"
          description="暂无会话"
          :image-size="60"
        />
      </div>

      <div class="sidebar-footer">
        <div class="connector-label">
          <el-icon><Connection /></el-icon>
          <span>数据源</span>
        </div>
        <el-select
          v-model="selectedConnectorId"
          placeholder="AI自动匹配"
          size="small"
          class="connector-select"
          clearable
        >
          <el-option :value="undefined" label="AI自动匹配">
            <div class="connector-option">
              <span style="color: #e8734a; font-weight: 600;">AI自动匹配</span>
              <el-tag type="warning" size="small" effect="dark">推荐</el-tag>
            </div>
          </el-option>
          <el-option
            v-for="c in connectors"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          >
            <div class="connector-option">
              <span>{{ c.name }}</span>
              <el-tag
                :type="connectorStatusType(c.status)"
                size="small"
                effect="plain"
              >
                {{ c.status === 'running' ? '在线' : c.status || '未知' }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <section class="main">
      <!-- 顶部标题栏 -->
      <header class="main-header">
        <div class="title-wrap">
          <el-icon class="title-icon"><DataAnalysis /></el-icon>
          <span class="title-text">
            {{ currentSession?.title || '数据智能问答' }}
          </span>
        </div>
        <div class="connector-status">
          <el-tag type="success" effect="light" size="small">
            <el-icon style="margin-right: 4px"><Connection /></el-icon>
            {{ currentConnectorName() }}
          </el-tag>
        </div>
      </header>

      <!-- 聊天区域 -->
      <div ref="chatAreaRef" class="chat-area" v-loading="loadingMessages">
        <div v-if="messages.length === 0 && !loadingMessages" class="empty-state">
          <el-icon class="empty-icon"><ChatLineRound /></el-icon>
          <h3>数据智能问答</h3>
          <p>向 AI 提问，自动生成 SQL、查询数据并可视化分析</p>
          <div class="empty-suggest">
            <span>试试：</span>
            <el-button
              v-for="q in quickQuestions.slice(0, 3)"
              :key="q"
              size="small"
              round
              @click="useQuickQuestion(q)"
            >
              {{ q }}
            </el-button>
          </div>
        </div>

        <div v-for="msg in messages" :key="msg.id" class="msg-row">
          <!-- 用户消息 -->
          <div v-if="msg.role === 'user'" class="user-msg">
            <div class="user-bubble">{{ msg.content }}</div>
          </div>

          <!-- AI 消息 -->
          <div v-else class="ai-msg">
            <div class="ai-avatar">AI</div>
            <div class="ai-card">
              <!-- 内容文本 -->
              <div v-if="msg.content" class="ai-content">{{ msg.content }}</div>

              <!-- 加载骨架 -->
              <div v-if="!msg.content && !msg.understanding && !msg.sql && sending" class="ai-loading">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="loading-text">AI 正在思考...</span>
              </div>

              <!-- AI 理解 -->
              <div v-if="msg.understanding" class="ai-section">
                <div class="section-title">
                  <el-icon><ChatLineRound /></el-icon>
                  <span>AI 理解</span>
                </div>
                <div class="section-body">{{ msg.understanding }}</div>
              </div>

              <!-- SQL -->
              <div v-if="msg.sql" class="ai-section">
                <div class="section-title sql-title">
                  <span>生成的 SQL</span>
                  <el-button
                    text
                    size="small"
                    :icon="CopyDocument"
                    @click="copySql(msg.sql!)"
                  >
                    复制
                  </el-button>
                </div>
                <pre class="sql-block"><code>{{ msg.sql }}</code></pre>
              </div>

              <!-- 数据源标签 -->
              <div v-if="msg.connectorName" class="ai-section">
                <el-tag :type="msg.autoMatched ? 'warning' : 'info'" :effect="msg.autoMatched ? 'dark' : 'plain'" size="small">
                  <el-icon style="margin-right: 4px"><Connection /></el-icon>
                  数据源：{{ msg.connectorName }}
                </el-tag>
                <el-tag v-if="msg.autoMatched" type="warning" effect="dark" size="small" style="margin-left: 6px;">
                  AI自动匹配
                </el-tag>
              </div>

              <!-- 查询结果表格 -->
              <div
                v-if="msg.data && msg.columns && msg.columns.length > 0"
                class="ai-section"
              >
                <div class="section-title">
                  <span>查询结果（{{ msg.data.length }} 条）</span>
                </div>
                <el-table
                  :data="msg.data"
                  size="small"
                  border
                  stripe
                  max-height="320"
                  class="result-table"
                >
                  <el-table-column
                    v-for="col in msg.columns"
                    :key="col"
                    :prop="col"
                    :label="col"
                    :min-width="120"
                    show-overflow-tooltip
                  />
                </el-table>
              </div>

              <!-- 图表 -->
              <div v-if="msg.chart" class="ai-section">
                <div class="section-title">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>{{ msg.chart.title || '数据图表' }}</span>
                </div>
                <div
                  class="chart-container"
                  :ref="(el) => setChartRef(el, msg.id)"
                ></div>
              </div>

              <!-- AI 总结 -->
              <div v-if="msg.summary" class="ai-section">
                <div class="section-title">
                  <el-icon><ChatLineRound /></el-icon>
                  <span>AI 分析总结</span>
                </div>
                <div class="section-body summary-body">{{ msg.summary }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入区域 -->
      <footer class="input-area">
        <div class="quick-questions">
          <el-button
            v-for="q in quickQuestions"
            :key="q"
            size="small"
            round
            @click="useQuickQuestion(q)"
          >
            {{ q }}
          </el-button>
        </div>
        <div class="input-row">
          <el-input
            ref="inputRef"
            v-model="inputText"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="请输入你的问题，回车发送，Shift+回车换行"
            :disabled="sending"
            @keydown.enter="handleEnter"
          />
          <el-button
            type="primary"
            :icon="Promotion"
            :loading="sending"
            :disabled="!inputText.trim()"
            @click="handleSend"
          >
            发送
          </el-button>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.data-chat-page {
  display: flex;
  height: 100%;
  background: #f0f4f8;
}

/* ============ 左侧栏 ============ */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.new-chat-btn {
  width: 100%;
  background: linear-gradient(135deg, #1a3a5c, #2c5a8c);
  border-color: #1a3a5c;
}
.new-chat-btn:hover {
  background: linear-gradient(135deg, #2c5a8c, #1a3a5c);
  border-color: #1a3a5c;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  position: relative;
}
.session-item:hover {
  background: #f5f7fa;
}
.session-item.active {
  background: rgba(26, 58, 92, 0.08);
}
.session-item.active .session-icon {
  color: #1a3a5c;
}

.session-icon {
  color: #909399;
  flex-shrink: 0;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.session-time {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.session-delete {
  color: #c0c4cc;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}
.session-item:hover .session-delete {
  opacity: 1;
}
.session-delete:hover {
  color: #e8734a;
}

.sidebar-footer {
  border-top: 1px solid #f0f0f0;
  padding: 12px;
}

.connector-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.connector-select {
  width: 100%;
}

.connector-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* ============ 右侧主区域 ============ */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}

.main-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon {
  color: #1a3a5c;
  font-size: 18px;
}
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a5c;
}

.connector-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ============ 聊天区域 ============ */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}
.empty-icon {
  font-size: 60px;
  color: #c0c4cc;
  margin-bottom: 16px;
}
.empty-state h3 {
  font-size: 20px;
  color: #1a3a5c;
  margin-bottom: 8px;
}
.empty-state p {
  font-size: 14px;
  margin-bottom: 16px;
}
.empty-suggest {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ============ 消息行 ============ */
.msg-row {
  margin-bottom: 20px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}

/* 用户消息 */
.user-msg {
  display: flex;
  justify-content: flex-end;
}
.user-bubble {
  max-width: 70%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #1a3a5c, #2c5a8c);
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(26, 58, 92, 0.15);
}

/* AI 消息 */
.ai-msg {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.ai-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e8734a, #c75930);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.ai-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  min-width: 0;
}

.ai-content {
  font-size: 14px;
  line-height: 1.7;
  color: #303133;
  margin-bottom: 12px;
}

/* AI 加载动画 */
.ai-loading {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
}
.ai-loading .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e8734a;
  animation: dot-bounce 1.2s infinite ease-in-out;
}
.ai-loading .dot:nth-child(2) {
  animation-delay: 0.2s;
}
.ai-loading .dot:nth-child(3) {
  animation-delay: 0.4s;
}
.loading-text {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}
@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 分区块 */
.ai-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #ebeef5;
}
.ai-section:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 8px;
}
.section-title .el-icon {
  color: #e8734a;
}
.sql-title {
  justify-content: space-between;
}

.section-body {
  font-size: 14px;
  line-height: 1.7;
  color: #606266;
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid #e8734a;
}
.summary-body {
  background: linear-gradient(135deg, #fff7f2, #fff);
  border-left-color: #e8734a;
}

/* SQL 代码块 */
.sql-block {
  background: #1e293b;
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 0;
}
.sql-block code {
  color: #4ade80;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
}

/* 结果表格 */
.result-table {
  margin-top: 4px;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 280px;
  margin-top: 4px;
}

/* ============ 底部输入 ============ */
.input-area {
  background: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 12px 20px 16px;
  flex-shrink: 0;
}

.quick-questions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  max-width: 1100px;
  margin: 0 auto;
}

.input-row :deep(.el-textarea__inner) {
  border-radius: 8px;
  font-size: 14px;
}

.input-row .el-button {
  height: 56px;
  background: linear-gradient(135deg, #1a3a5c, #2c5a8c);
  border-color: #1a3a5c;
}
.input-row .el-button:hover {
  background: linear-gradient(135deg, #2c5a8c, #1a3a5c);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .data-chat-page {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }
  .user-bubble {
    max-width: 90%;
  }
}
</style>

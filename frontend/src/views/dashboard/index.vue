<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import * as echarts from 'echarts'
import {
  TrendCharts,
  ArrowUp,
  ArrowDown,
  Warning,
  Bell,
  Loading,
  DataLine
} from '@element-plus/icons-vue'
import {
  getOverview,
  getEfficiency,
  getAlerts,
  type OverviewResult,
  type EfficiencyResult,
  type AlertItem
} from '@/api/dashboard'

const loading = ref(true)
const overview = ref<OverviewResult | null>(null)
const efficiency = ref<EfficiencyResult | null>(null)
const alerts = ref<AlertItem[]>([])

const currentTime = ref('')
let timeTimer: any = null

// ============ 时间 ============
function updateTime() {
  const d = new Date()
  const fmt = (n: number) => (n < 10 ? '0' + n : '' + n)
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  currentTime.value = `${d.getFullYear()}-${fmt(d.getMonth() + 1)}-${fmt(
    d.getDate()
  )} 星期${week} ${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`
}

// ============ 数据 ============
async function fetchAll() {
  loading.value = true
  try {
    const [ov, eff, al] = await Promise.all([
      getOverview().catch(() => null),
      getEfficiency().catch(() => null),
      getAlerts().catch(() => null)
    ])
    overview.value = (ov as any)?.data ?? (ov as any)
    efficiency.value = (eff as any)?.data ?? (eff as any)
    alerts.value = (al as any)?.data ?? (al as any) ?? []
    // 如果后端没有返回，使用 mock 数据
    if (!overview.value) overview.value = mockOverview()
    if (!efficiency.value) efficiency.value = mockEfficiency()
    if (!alerts.value.length) alerts.value = mockAlerts()

    renderCharts()
  } finally {
    loading.value = false
  }
}

function mockOverview(): OverviewResult {
  return {
    totalApprovals: 12683,
    passRate: 94.6,
    backlog: 237,
    timeoutRate: 2.3,
    trends: { total: 8.5, passRate: 1.2, backlog: -15, timeoutRate: -0.5 },
    aiProcessed: 8456,
    aiProcessingRate: 66.7
  }
}

function mockEfficiency(): EfficiencyResult {
  const days = 15
  const trend = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      value: Math.floor(300 + Math.random() * 200),
      passed: Math.floor(280 + Math.random() * 180)
    }
  })
  return {
    trend,
    typeDistribution: [
      { name: '合同审批', value: 3580 },
      { name: '报销审批', value: 4250 },
      { name: '采购审批', value: 2180 },
      { name: '项目审批', value: 1560 },
      { name: '资产审批', value: 1113 }
    ],
    departmentRank: [
      { name: '销售部', value: 2850, avgHours: 4.2 },
      { name: '采购部', value: 2360, avgHours: 5.8 },
      { name: '财务部', value: 2180, avgHours: 3.6 },
      { name: '生产部', value: 1980, avgHours: 6.2 },
      { name: '信息中心', value: 1520, avgHours: 2.8 },
      { name: '人力资源', value: 1240, avgHours: 4.5 }
    ],
    efficiency: { avgProcessTime: 4.5, aiRate: 66.7, passRate: 94.6 }
  }
}

function mockAlerts(): AlertItem[] {
  return [
    {
      id: 1,
      level: 'high',
      title: '审批超时告警',
      content: '采购部有 12 笔采购审批已超时 48 小时，请立即处理',
      source: '审批监控系统',
      time: new Date().toLocaleString(),
      status: '未处理'
    },
    {
      id: 2,
      level: 'high',
      title: '大额合同风险',
      content: '与XX公司签订的采购合同金额 580 万，存在 3 项高风险条款',
      source: 'AI风控引擎',
      time: new Date(Date.now() - 3600000).toLocaleString(),
      status: '未处理'
    },
    {
      id: 3,
      level: 'medium',
      title: '预算使用率告警',
      content: '销售部 6 月预算使用率已达 87%，请关注预算执行情况',
      source: '预算管理系统',
      time: new Date(Date.now() - 7200000).toLocaleString(),
      status: '未处理'
    },
    {
      id: 4,
      level: 'medium',
      title: '审批效率下降',
      content: '财务部平均审批时长环比上升 23%，建议优化流程',
      source: '效能分析系统',
      time: new Date(Date.now() - 10800000).toLocaleString(),
      status: '处理中'
    },
    {
      id: 5,
      level: 'low',
      title: '系统维护通知',
      content: 'AI审核服务将于本周日 02:00-04:00 进行版本升级',
      source: '系统通知',
      time: new Date(Date.now() - 86400000).toLocaleString(),
      status: '已发布'
    }
  ]
}

// ============ 趋势方向 ============
function trendIcon(val?: number) {
  if (val === undefined) return null
  return val >= 0 ? ArrowUp : ArrowDown
}
function trendColor(val?: number) {
  if (val === undefined) return ''
  return val >= 0 ? '#e94f4f' : '#2bb673'
}
function trendText(val?: number) {
  if (val === undefined) return ''
  return Math.abs(val) + '%'
}

// ============ 指标卡 ============
const cards = computed(() => {
  const o = overview.value
  if (!o) return []
  return [
    {
      label: '审批总量',
      value: o.totalApprovals,
      unit: '笔',
      icon: DataLine,
      color: '#5b8ff9',
      trend: o.trends?.total,
      trendGood: false
    },
    {
      label: '通过率',
      value: o.passRate,
      unit: '%',
      icon: TrendCharts,
      color: '#2bb673',
      trend: o.trends?.passRate,
      trendGood: true
    },
    {
      label: '积压量',
      value: o.backlog,
      unit: '笔',
      icon: Bell,
      color: '#f5a623',
      trend: o.trends?.backlog,
      trendGood: false,
      reverse: true
    },
    {
      label: '超时率',
      value: o.timeoutRate,
      unit: '%',
      icon: Warning,
      color: '#e94f4f',
      trend: o.trends?.timeoutRate,
      trendGood: false,
      reverse: true
    }
  ]
})

// ============ 图表 ============
const trendChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

function renderTrendChart() {
  if (!trendChartRef.value || !efficiency.value) return
  trendChart = echarts.init(trendChartRef.value)
  const data = efficiency.value.trend
  trendChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 37, 64, 0.9)',
      borderColor: '#e8734a',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['审批量', '通过量'],
      textStyle: { color: '#cbd5e1' },
      right: 10,
      top: 0
    },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: 'rgba(203, 213, 225, 0.3)' } },
      axisLabel: { color: '#cbd5e1', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#cbd5e1', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(203, 213, 225, 0.1)' } }
    },
    series: [
      {
        name: '审批量',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.value),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#5b8ff9', width: 2 },
        itemStyle: { color: '#5b8ff9' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(91, 143, 249, 0.4)' },
            { offset: 1, color: 'rgba(91, 143, 249, 0)' }
          ])
        }
      },
      {
        name: '通过量',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.passed || 0),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#2bb673', width: 2 },
        itemStyle: { color: '#2bb673' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(43, 182, 115, 0.4)' },
            { offset: 1, color: 'rgba(43, 182, 115, 0)' }
          ])
        }
      }
    ]
  })
}

function renderPieChart() {
  if (!pieChartRef.value || !efficiency.value) return
  pieChart = echarts.init(pieChartRef.value)
  const data = efficiency.value.typeDistribution
  pieChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 37, 64, 0.9)',
      borderColor: '#e8734a',
      textStyle: { color: '#fff' },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'middle',
      textStyle: { color: '#cbd5e1', fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: 'rgba(15, 37, 64, 0.5)',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        data: data.map((d, i) => ({
          ...d,
          itemStyle: {
            color: ['#5b8ff9', '#e8734a', '#2bb673', '#f5a623', '#9b6eff'][i % 5]
          }
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut'
      }
    ]
  })
}

function renderBarChart() {
  if (!barChartRef.value || !efficiency.value) return
  barChart = echarts.init(barChartRef.value)
  const data = efficiency.value.departmentRank
  barChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 37, 64, 0.9)',
      borderColor: '#e8734a',
      textStyle: { color: '#fff' },
      formatter: (p: any) => {
        return `${p[0].name}<br/>审批量：${p[0].value} 笔<br/>平均时长：${data[p[0].dataIndex].avgHours} 小时`
      }
    },
    grid: { left: 80, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#cbd5e1', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(203, 213, 225, 0.1)' } }
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLine: { lineStyle: { color: 'rgba(203, 213, 225, 0.3)' } },
      axisLabel: { color: '#cbd5e1', fontSize: 12 }
    },
    series: [
      {
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.value,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: ['#1a3a5c', '#2c5485', '#4a7bb0', '#5b8ff9', '#9b6eff', '#e8734a'][i % 6] },
              { offset: 1, color: ['#4a7bb0', '#5b8ff9', '#7ba3cd', '#9b6eff', '#f29370', '#f5a623'][i % 6] }
            ]),
            borderRadius: [0, 6, 6, 0]
          }
        })),
        barWidth: '55%',
        animationDelay: (i: number) => i * 100
      }
    ]
  })
}

function renderCharts() {
  setTimeout(() => {
    renderTrendChart()
    renderPieChart()
    renderBarChart()
  }, 100)
}

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
  barChart?.resize()
}

// ============ 告警 ============
function alertLevelColor(level: string) {
  return { high: 'danger', medium: 'warning', low: 'info' }[level] || 'info'
}
function alertLevelText(level: string) {
  return { high: '高级', medium: '中级', low: '低级' }[level] || level
}
function alertBorder(level: string) {
  return {
    high: 'border-color: #e94f4f',
    medium: 'border-color: #f5a623',
    low: 'border-color: #5b8ff9'
  }[level] || ''
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  fetchAll()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
  barChart?.dispose()
})
</script>

<template>
  <div class="dashboard-page" v-loading="loading">
    <!-- 顶部标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <div class="logo-icon">道</div>
        <div class="title-block">
          <div class="main-title">道一云AI协同中台 · 管理驾驶舱</div>
          <div class="sub-title">JINMAILANG AI COLLABORATION COMMAND CENTER</div>
        </div>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <el-button type="warning" plain size="small" @click="fetchAll">
          <el-icon><Loading /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 第一行：核心指标卡 -->
    <div class="kpi-row">
      <div v-for="(c, i) in cards" :key="i" class="kpi-card">
        <div class="kpi-icon" :style="{ color: c.color }">
          <el-icon :size="32"><component :is="c.icon" /></el-icon>
        </div>
        <div class="kpi-info">
          <div class="kpi-label">{{ c.label }}</div>
          <div class="kpi-value" :style="{ color: c.color }">
            {{ c.value }}<span class="kpi-unit">{{ c.unit }}</span>
          </div>
          <div class="kpi-trend" v-if="c.trend !== undefined">
            <el-icon :color="trendColor(c.trend)">
              <component :is="trendIcon(c.trend)" />
            </el-icon>
            <span :style="{ color: trendColor(c.trend) }">{{ trendText(c.trend) }}</span>
            <span class="trend-label">较昨日</span>
          </div>
        </div>
        <div class="kpi-decorations">
          <div class="deco-bar" :style="{ background: c.color }"></div>
        </div>
      </div>
    </div>

    <!-- 第二行：趋势 + 饼图 -->
    <div class="chart-row">
      <div class="chart-card chart-trend">
        <div class="chart-header">
          <span class="chart-title">
            <el-icon><TrendCharts /></el-icon> 审批量趋势（近15天）
          </span>
          <div class="chart-tags">
            <span class="legend-tag"><i style="background:#5b8ff9"></i>审批量</span>
            <span class="legend-tag"><i style="background:#2bb673"></i>通过量</span>
          </div>
        </div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card chart-pie">
        <div class="chart-header">
          <span class="chart-title">
            <el-icon><DataLine /></el-icon> 审批类型分布
          </span>
        </div>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 第三行：部门排行 + 告警 -->
    <div class="chart-row">
      <div class="chart-card chart-bar">
        <div class="chart-header">
          <span class="chart-title">
            <el-icon><DataLine /></el-icon> 部门效率排行
          </span>
        </div>
        <div ref="barChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card alert-card">
        <div class="chart-header">
          <span class="chart-title">
            <el-icon><Warning /></el-icon> 异常预警
          </span>
          <el-tag type="danger" effect="dark" size="small">
            {{ alerts.filter(a => a.level === 'high').length }} 紧急
          </el-tag>
        </div>
        <div class="alert-list">
          <div
            v-for="a in alerts"
            :key="a.id"
            class="alert-item"
            :style="alertBorder(a.level)"
          >
            <div class="alert-head">
              <el-tag :type="alertLevelColor(a.level) as any" size="small" effect="dark">
                {{ alertLevelText(a.level) }}
              </el-tag>
              <span class="alert-title">{{ a.title }}</span>
              <span class="alert-status" v-if="a.status">{{ a.status }}</span>
            </div>
            <div class="alert-content">{{ a.content }}</div>
            <div class="alert-meta">
              <span v-if="a.source">{{ a.source }}</span>
              <span>{{ a.time }}</span>
            </div>
          </div>
          <el-empty v-if="!alerts.length" description="暂无预警" :image-size="60" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: 100%;
  background: linear-gradient(135deg, #0a1929 0%, #0f2540 30%, #1a3a5c 100%);
  padding: 16px;
  color: #cbd5e1;
  overflow-y: auto;
}

/* 顶部 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border: 1px solid rgba(232, 115, 74, 0.2);
  backdrop-filter: blur(8px);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #e8734a, #c75930);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 4px 16px rgba(232, 115, 74, 0.4);
}
.main-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}
.sub-title {
  font-size: 11px;
  color: rgba(203, 213, 225, 0.5);
  letter-spacing: 2px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.time {
  font-size: 14px;
  color: #cbd5e1;
  font-family: 'Courier New', monospace;
}

/* KPI 卡片 */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.kpi-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  backdrop-filter: blur(8px);
  transition: all 0.3s;
}
.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgba(232, 115, 74, 0.3);
}
.kpi-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-info {
  flex: 1;
}
.kpi-label {
  font-size: 13px;
  color: rgba(203, 213, 225, 0.7);
  margin-bottom: 4px;
}
.kpi-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
  font-family: 'DIN Alternate', 'Bebas Neue', sans-serif;
}
.kpi-unit {
  font-size: 14px;
  margin-left: 4px;
  opacity: 0.7;
}
.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 6px;
}
.trend-label {
  color: rgba(203, 213, 225, 0.5);
}
.kpi-decorations {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}
.deco-bar {
  width: 100%;
  height: 100%;
  opacity: 0.8;
}

/* 图表行 */
.chart-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.chart-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(8px);
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.chart-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}
.chart-tags {
  display: flex;
  gap: 12px;
}
.legend-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(203, 213, 225, 0.8);
}
.legend-tag i {
  width: 12px;
  height: 3px;
  border-radius: 2px;
}
.chart-container {
  width: 100%;
  height: 280px;
}

/* 告警 */
.alert-list {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alert-item {
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid;
  font-size: 13px;
}
.alert-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.alert-title {
  flex: 1;
  font-weight: 600;
  color: #fff;
  font-size: 13px;
}
.alert-status {
  font-size: 11px;
  color: rgba(203, 213, 225, 0.6);
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
.alert-content {
  color: rgba(203, 213, 225, 0.85);
  line-height: 1.6;
  margin-bottom: 4px;
}
.alert-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(203, 213, 225, 0.5);
}

/* 响应式 */
@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }
  .header-bar {
    flex-direction: column;
    gap: 12px;
  }
  .main-title {
    font-size: 18px;
  }
  .kpi-value {
    font-size: 26px;
  }
  .chart-container {
    height: 240px;
  }
}
</style>

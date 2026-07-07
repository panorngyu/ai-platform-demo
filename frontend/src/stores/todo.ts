import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getTodos,
  batchApprove as batchApproveApi,
  type TodoItem,
  type TodoQuery,
  type BatchApproveParams
} from '@/api/todo'

export interface TodoFilters {
  keyword: string
  type: string
  status: string
  sortBy: string
  dateRange: [string, string] | []
}

export const useTodoStore = defineStore('todo', () => {
  // ============ state ============
  const todoList = ref<TodoItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(10)
  const selectedIds = ref<(string | number)[]>([])
  const stats = ref({
    pending: 0,
    timeout: 0,
    todayNew: 0,
    monthProcessed: 0
  })
  const filters = ref<TodoFilters>({
    keyword: '',
    type: '',
    status: '',
    sortBy: 'time',
    dateRange: []
  })
  const currentTodo = ref<TodoItem | null>(null)

  // ============ getters ============
  const selectedCount = computed(() => selectedIds.value.length)
  const hasSelection = computed(() => selectedIds.value.length > 0)
  const isEmpty = computed(
    () => !loading.value && todoList.value.length === 0
  )

  // ============ actions ============
  async function fetchTodos(params?: Partial<TodoQuery>) {
    loading.value = true
    try {
      const query: TodoQuery = {
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.value.keyword || undefined,
        type: filters.value.type || undefined,
        status: filters.value.status || undefined,
        sortBy: filters.value.sortBy || undefined,
        ...(params || {})
      }
      if (filters.value.dateRange?.length === 2) {
        query.startDate = filters.value.dateRange[0]
        query.endDate = filters.value.dateRange[1]
      }
      const res: any = await getTodos(query)
      const data = res?.data ?? res
      todoList.value = data?.list || []
      total.value = data?.total || 0
      if (data?.stats) {
        stats.value = { ...stats.value, ...data.stats }
      }
      return data
    } catch (e) {
      todoList.value = []
      total.value = 0
      throw e
    } finally {
      loading.value = false
    }
  }

  async function batchApprove(data: BatchApproveParams) {
    return await batchApproveApi(data)
  }

  function selectTodo(id: string | number) {
    const idx = selectedIds.value.indexOf(id)
    if (idx >= 0) {
      selectedIds.value.splice(idx, 1)
    } else {
      selectedIds.value.push(id)
    }
  }

  function selectAll(ids: (string | number)[]) {
    if (ids.every((id) => selectedIds.value.includes(id))) {
      selectedIds.value = selectedIds.value.filter((id) => !ids.includes(id))
    } else {
      selectedIds.value = [...new Set([...selectedIds.value, ...ids])]
    }
  }

  function clearSelection() {
    selectedIds.value = []
  }

  function resetFilters() {
    filters.value = {
      keyword: '',
      type: '',
      status: '',
      sortBy: 'time',
      dateRange: []
    }
    page.value = 1
  }

  return {
    // state
    todoList,
    total,
    loading,
    page,
    pageSize,
    selectedIds,
    stats,
    filters,
    currentTodo,
    // getters
    selectedCount,
    hasSelection,
    isEmpty,
    // actions
    fetchTodos,
    batchApprove,
    selectTodo,
    selectAll,
    clearSelection,
    resetFilters
  }
})

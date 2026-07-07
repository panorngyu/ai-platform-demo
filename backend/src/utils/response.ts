// 统一响应格式工具

export function success(data?: any, message?: string) {
  return {
    code: 200,
    success: true,
    data,
    message
  }
}

export function fail(message: string, code?: number) {
  return {
    code: code || 400,
    success: false,
    message
  }
}

// 分页响应
export function paginate(list: any[], total: number, page: number, pageSize: number) {
  return {
    code: 200,
    success: true,
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export default { success, fail, paginate }

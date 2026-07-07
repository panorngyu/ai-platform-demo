import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

/* ===========================================================
 * Axios 统一封装
 * =========================================================== */

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success?: boolean
}

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

/* ---------- 请求拦截器 ---------- */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('jml_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* ---------- 响应拦截器 ---------- */
let isLogoutBoxShown = false

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    // 兼容直接返回数据（无 code 字段）的情况
    if (res === null || res === undefined) {
      return response.data as any
    }

    // Blob/文件流直接返回
    if (response.config.responseType === 'blob') {
      return response as any
    }

    if (res.code !== undefined && res.code !== 0 && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res as any
  },
  (error) => {
    const status = error?.response?.status
    const message =
      error?.response?.data?.message || error?.message || '网络异常'

    if (status === 401) {
      if (!isLogoutBoxShown) {
        isLogoutBoxShown = true
        ElMessageBox.confirm('登录状态已失效，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            localStorage.removeItem('jml_token')
            localStorage.removeItem('jml_user')
            window.location.href = '/login'
          })
          .finally(() => {
            isLogoutBoxShown = false
          })
      }
    } else if (status === 403) {
      ElMessage.error('没有权限访问该资源')
    } else if (status >= 500) {
      ElMessage.error('服务异常，请稍后重试')
    } else {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  }
)

/* ---------- 便捷方法 ---------- */
export const request = {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig) {
    return service.get<any, ApiResponse<T>>(url, { params, ...config })
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return service.post<any, ApiResponse<T>>(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return service.put<any, ApiResponse<T>>(url, data, config)
  },
  delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig) {
    return service.delete<any, ApiResponse<T>>(url, { params, ...config })
  },
  upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig) {
    return service.post<any, ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config
    })
  }
}

export default service

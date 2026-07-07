import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  login as loginApi,
  getUserInfo,
  type LoginParams,
  type UserInfo
} from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // ============ state ============
  const token = ref<string>(
    localStorage.getItem('jml_token') || ''
  )
  const userInfo = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('jml_user') || 'null')
  )

  // ============ getters ============
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => {
    const roles = userInfo.value?.roles || []
    const role = userInfo.value?.role || ''
    return roles.includes('admin') || role === 'admin'
  })
  const displayName = computed(() => {
    return (
      userInfo.value?.displayName ||
      userInfo.value?.name ||
      userInfo.value?.username ||
      '用户'
    )
  })

  // ============ actions ============
  function setToken(t: string) {
    token.value = t
    localStorage.setItem('jml_token', t)
  }

  function setUserInfo(info: UserInfo | null) {
    userInfo.value = info
    if (info) {
      localStorage.setItem('jml_user', JSON.stringify(info))
    } else {
      localStorage.removeItem('jml_user')
    }
  }

  async function login(credentials: LoginParams) {
    const res: any = await loginApi(credentials)
    // 兼容返回结构
    const data = res?.data ?? res
    const tk = data?.token
    const user = data?.user
    if (tk) setToken(tk)
    if (user) setUserInfo(user)
    return data
  }

  async function fetchUserInfo() {
    if (!token.value) return null
    try {
      const res: any = await getUserInfo()
      const data = res?.data ?? res
      if (data) setUserInfo(data)
      return data
    } catch (e) {
      return null
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('jml_token')
    localStorage.removeItem('jml_user')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    displayName,
    setToken,
    setUserInfo,
    login,
    fetchUserInfo,
    logout
  }
})

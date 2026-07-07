import { request } from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}

export interface UserInfo {
  id: string | number
  username: string
  name: string
  displayName?: string
  avatar?: string
  department?: string
  role?: string
  roles?: string[]
  email?: string
  phone?: string
  title?: string
}

export function login(data: LoginParams) {
  return request.post<LoginResult>('/auth/login', data)
}

export function getUserInfo() {
  return request.get<UserInfo>('/auth/user-info')
}

export function logout() {
  return request.post('/auth/logout')
}

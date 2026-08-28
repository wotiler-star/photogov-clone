// 会员登录态：跨组件共享的响应式用户状态
import { useApi } from '~/composables/useApi'

export interface AuthUser {
  id: string
  name: string
  email: string
  plan: 'free' | 'premium'
  createdAt: string
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth_user', () => null)
  const loaded = useState<boolean>('auth_loaded', () => false)
  const { me, login: apiLogin, register: apiRegister, logout: apiLogout } = useApi()

  // 从 /auth/me 拉取当前会话用户（由客户端插件在挂载时调用）
  const refresh = async () => {
    try {
      const res = await me()
      user.value = (res.user as AuthUser) || null
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
  }

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    user.value = res.user
    return res
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await apiRegister(name, email, password)
    user.value = res.user
    return res
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      /* 即使接口失败也清除本地状态 */
    }
    user.value = null
  }

  return { user, loaded, refresh, login, register, logout }
}

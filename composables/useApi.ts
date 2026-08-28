// 前端调用自建后端 v1 API 的封装（对齐原站 /api/app/v1/ 契约）
// 用于把页面/工具从「直读本地 JSON」切换到「调用后端 API」。
import { $fetch } from 'ofetch'

const BASE = '/api/app/v1'

export interface ApiDoc {
  slug: string
  country: string
  countryName: string
  name: string
  title: string
  category: string
  popular?: boolean
  quickLink?: boolean
  size: { inch: string; mm: string; cm: string; px: string; w: number; h: number }
  headHeight: string
  eyesLevel: string
  background: string
  format: string
  dpi: number
  fileSize: string
  glasses: boolean
  expression: string
  year: number
  source: string
  verified: boolean
}

export const useApi = () => {
  const fetchCountries = (params: Record<string, any> = {}) =>
    $fetch<{ countries: any[]; total: number }>(`${BASE}/database/countries`, { query: params })

  const fetchDocuments = (params: Record<string, any> = {}) =>
    $fetch<{ documents: ApiDoc[]; total: number }>(`${BASE}/database/documents`, { query: params })

  const fetchDocument = (slug: string) =>
    $fetch<{ document: ApiDoc }>(`${BASE}/database/documents/${slug}`)

  const fetchCategories = () =>
    $fetch<{ categories: { id: string; count: number; label: string }[] }>(`${BASE}/database/categories`)

  // 图片：上传 + 服务端处理（等效原站 Photo.Processing 微服务）
  const uploadPhoto = async (blob: Blob, filename = 'photo.jpg') => {
    const fd = new FormData()
    fd.append('image', blob, filename)
    return $fetch<{ id: string; url: string }>(`${BASE}/photo/upload`, { method: 'POST', body: fd })
  }

  const processPhoto = async (blob: Blob, opts: {
    width: number; height: number; format?: string; background?: string;
    brightness?: number; contrast?: number; cropMode?: string; filename?: string
  }) => {
    const fd = new FormData()
    fd.append('image', blob, opts.filename || 'photo.jpg')
    fd.append('width', String(opts.width))
    fd.append('height', String(opts.height))
    if (opts.format) fd.append('format', opts.format)
    if (opts.background) fd.append('background', opts.background)
    if (opts.brightness != null) fd.append('brightness', String(opts.brightness))
    if (opts.contrast != null) fd.append('contrast', String(opts.contrast))
    if (opts.cropMode) fd.append('cropMode', opts.cropMode)
    return $fetch<Blob>(`${BASE}/photo/process`, { method: 'POST', body: fd, responseType: 'blob' })
  }

  const getServices = () => $fetch(`${BASE}/order/get-services`)
  const getPaymentMethods = () => $fetch(`${BASE}/order/get-payment-methods`)

  // 会员鉴权
  const register = (name: string, email: string, password: string) =>
    $fetch<{ ok: boolean; user: any }>(`${BASE}/auth/register`, {
      method: 'POST',
      body: { name, email, password }
    })

  const login = (email: string, password: string) =>
    $fetch<{ ok: boolean; user: any }>(`${BASE}/auth/login`, {
      method: 'POST',
      body: { email, password }
    })

  const logout = () => $fetch<{ ok: boolean }>(`${BASE}/auth/logout`, { method: 'POST' })

  const me = () => $fetch<{ user: any | null }>(`${BASE}/auth/me`)

  // 邮箱验证 / 密码找回 / 订阅
  const verifyEmail = (token: string) =>
    $fetch<{ ok: boolean; user: any }>(`${BASE}/auth/verify-email`, { query: { token } })

  const resendVerification = () =>
    $fetch<{ ok: boolean; devLink?: string }>(`${BASE}/auth/resend-verification`, { method: 'POST' })

  const forgotPassword = (email: string) =>
    $fetch<{ ok: boolean; devLink?: string }>(`${BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email }
    })

  const resetPassword = (token: string, password: string) =>
    $fetch<{ ok: boolean; user: any }>(`${BASE}/auth/reset-password`, {
      method: 'POST',
      body: { token, password }
    })

  const subscribe = (plan: string) =>
    $fetch<{ ok: boolean; user: any }>(`${BASE}/auth/subscribe`, { method: 'POST', body: { plan } })

  const cancelSubscription = () =>
    $fetch<{ ok: boolean; user: any }>(`${BASE}/auth/cancel-subscription`, { method: 'POST' })

  return {
    BASE,
    fetchCountries,
    fetchDocuments,
    fetchDocument,
    fetchCategories,
    uploadPhoto,
    processPhoto,
    getServices,
    getPaymentMethods,
    register,
    login,
    logout,
    me,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    subscribe,
    cancelSubscription
  }
}

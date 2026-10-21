// 前端调用自建后端 v1 API 的封装（对齐原站 /api/app/v1/ 契约）
// 用于把页面/工具从「直读本地 JSON」切换到「调用后端 API」。
import { $fetch } from 'ofetch'
import { useRequestFetch } from '#imports'

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
  // SSR 下 Node 内置 fetch 无法解析相对 URL，会报
  // "Failed to parse URL from /api/app/v1/database/documents" 导致页面 SSR 取数为空。
  // 使用绑定了 request 上下文的 fetch 即可正常调用内部 API；客户端行为与全局 $fetch 一致。
  const reqFetch = (() => {
    try { return useRequestFetch() } catch { return $fetch }
  })() as ReturnType<typeof useRequestFetch>

  const fetchCountries = (params: Record<string, any> = {}) =>
    reqFetch<{ countries: any[]; total: number }>(`${BASE}/database/countries`, { query: params })

  const fetchDocuments = (params: Record<string, any> = {}) =>
    reqFetch<{ documents: ApiDoc[]; total: number }>(`${BASE}/database/documents`, { query: params })

  const fetchDocument = (slug: string) =>
    reqFetch<{ document: ApiDoc }>(`${BASE}/database/documents/${slug}`)

  // 博客文章 / 文档子页（hub）正文：content 为目标站原始 HTML
  const fetchBlogArticle = (slug: string) =>
    reqFetch<{
      key: string
      type: string
      slug: string
      content: string
      faq: any
      toc: { level: number; id: string; title: string }[]
      schemaOrg: any[]
      meta: { title?: string; description?: string }
      cover?: string
      publishedAt?: string
      readingTime?: number
      views?: number
      ratingAverage?: number
      ratingCount?: number
      author?: any
      reviewer?: any
    }>(`${BASE}/content/blog/${slug}`)

  // 文档子页（hub 文章）：documentSlug + sub 两级路由，content 为目标站原始 HTML
  const fetchHubArticle = (slug: string, sub: string) =>
    reqFetch<{
      type: string
      documentSlug: string
      slug: string
      content: string
      meta: { title?: string; description?: string }
      toc: { level: number; id: string; title: string }[]
      schemaOrg: string[]
      cover?: string
      publishedAt?: string
      readingTime?: number
      author?: any
      reviewer?: any
      document?: any
    }>(`${BASE}/content/hub/${slug}/${sub}`)

  const fetchCategories = () =>
    reqFetch<{ categories: { id: string; count: number; label: string }[] }>(`${BASE}/database/categories`)

  // 图片：上传 + 服务端处理（等效原站 Photo.Processing 微服务）
  const uploadPhoto = async (blob: Blob, filename = 'photo.jpg') => {
    const fd = new FormData()
    fd.append('image', blob, filename)
    return reqFetch<{ id: string; url: string }>(`${BASE}/photo/upload`, { method: 'POST', body: fd })
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
    return reqFetch<Blob>(`${BASE}/photo/process`, { method: 'POST', body: fd, responseType: 'blob' })
  }

  const getServices = () => reqFetch(`${BASE}/order/get-services`)
  const getPaymentMethods = () => reqFetch(`${BASE}/order/get-payment-methods`)

  // 真实评价（Database.Reviews）/ 作者档案（Blog.GetAuthor）
  const getReviews = (params: Record<string, any> = {}) =>
    reqFetch<{ stats: any; reviews: any[]; pagination: any; filters: any }>(`${BASE}/database/reviews`, {
      query: params
    })

  const getAuthor = (slug: string) =>
    reqFetch<{ author: any; posts: any[]; pagination: any; schemaOrg: any }>(`${BASE}/blog/get-author`, {
      query: { slug }
    })

  // 会员鉴权
  const register = (name: string, email: string, password: string) =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/register`, {
      method: 'POST',
      body: { name, email, password }
    })

  const login = (email: string, password: string) =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/login`, {
      method: 'POST',
      body: { email, password }
    })

  const logout = () => reqFetch<{ ok: boolean }>(`${BASE}/auth/logout`, { method: 'POST' })

  const me = () => reqFetch<{ user: any | null }>(`${BASE}/auth/me`)

  // 邮箱验证 / 密码找回 / 订阅
  const verifyEmail = (token: string) =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/verify-email`, { query: { token } })

  const resendVerification = () =>
    reqFetch<{ ok: boolean; devLink?: string }>(`${BASE}/auth/resend-verification`, { method: 'POST' })

  const forgotPassword = (email: string) =>
    reqFetch<{ ok: boolean; devLink?: string }>(`${BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email }
    })

  const resetPassword = (token: string, password: string) =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/reset-password`, {
      method: 'POST',
      body: { token, password }
    })

  const subscribe = (plan: string) =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/subscribe`, { method: 'POST', body: { plan } })

  const cancelSubscription = () =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/cancel-subscription`, { method: 'POST' })

  // 会员中心：改密 / 删除账户（软删除）/ 取消删除 / 资料 / 自动续费
  const changePassword = (currentPassword: string, newPassword: string) =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/change-password`, {
      method: 'POST',
      body: { currentPassword, newPassword }
    })

  const deleteAccount = () =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/delete-account`, { method: 'POST' })

  const cancelDeletion = () =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/cancel-deletion`, { method: 'POST' })

  const updateProfile = (name: string) =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/auth/update-profile`, {
      method: 'POST',
      body: { name }
    })

  const setAutoRenewal = (enabled: boolean) =>
    reqFetch<{ ok: boolean; user: any }>(`${BASE}/subscription/auto-renewal`, {
      method: 'POST',
      body: { enabled }
    })

  // 我的照片 / 订单
  const savePhoto = (imageId: string, meta: { docSlug?: string; docName?: string } = {}) =>
    reqFetch<{ ok: boolean; photo: any }>(`${BASE}/photo/save`, {
      method: 'POST',
      body: { imageId, ...meta }
    })

  const myPhotos = () => reqFetch<{ photos: any[] }>(`${BASE}/photo/my`)

  const deletePhoto = (id: string) =>
    reqFetch<{ ok: boolean }>(`${BASE}/photo/${id}`, { method: 'DELETE' })

  const myOrders = () => reqFetch<{ orders: any[] }>(`${BASE}/order/my`)

  // 订单状态流转：付款 / 取消
  const payOrder = (id: string) =>
    reqFetch<{ ok: boolean; order: any }>(`${BASE}/order/${id}/pay`, { method: 'POST' })

  const cancelOrder = (id: string) =>
    reqFetch<{ ok: boolean; order: any }>(`${BASE}/order/${id}/cancel`, { method: 'POST' })

  // 支付：创建订阅 checkout / 查询支付状态 / demo 收银台确认付款
  const createCheckout = (planId: string, locale = 'en') =>
    reqFetch<{
      ok: boolean
      paymentId: string
      paymentUrl: string
      provider: string
      demo: boolean
      amount: number
      currency: string
    }>(`${BASE}/subscription/checkout`, {
      method: 'POST',
      body: { planId, locale }
    })

  const getPayment = (id: string) =>
    reqFetch<{ payment: { id: string; planId: string; amount: number; currency: string; provider: string; status: string; method: string | null; createdAt: string; paidAt: string | null } }>(
      `${BASE}/subscription/payment/${id}`
    )

  const myPayments = () =>
    reqFetch<{
      payments: {
        id: string
        planId: string
        amount: number
        currency: string
        provider: string
        status: string
        method: string | null
        createdAt: string
        paidAt: string | null
      }[]
    }>(`${BASE}/subscription/payments`)

  const demoPay = (paymentId: string, action: 'pay' | 'cancel' = 'pay') =>
    reqFetch<{ ok?: boolean; received?: boolean; paymentId?: string; status: string }>(
      `${BASE}/subscription/demo-pay`,
      { method: 'POST', body: { paymentId, action } }
    )

  return {
    BASE,
    fetchCountries,
    fetchDocuments,
    fetchDocument,
    fetchBlogArticle,
    fetchHubArticle,
    fetchCategories,
    uploadPhoto,
    processPhoto,
    getServices,
    getPaymentMethods,
    getReviews,
    getAuthor,
    register,
    login,
    logout,
    me,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    subscribe,
    cancelSubscription,
    changePassword,
    deleteAccount,
    cancelDeletion,
    updateProfile,
    setAutoRenewal,
    savePhoto,
    myPhotos,
    deletePhoto,
    myOrders,
    payOrder,
    cancelOrder,
    createCheckout,
    getPayment,
    myPayments,
    demoPay
  }
}

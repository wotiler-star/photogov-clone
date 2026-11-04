// 邮件令牌链接的语言前缀兜底（302）。
// i18n strategy='prefix'：所有页面 URL 必须带 /en /zh /es /fr 前缀，裸路径 404。
// 但服务端生成的邮件链接是无前缀的绝对地址（register/resend-verification →
// /verify-email?token=…，forgot-password → /reset-password?token=…），
// 用户从邮箱点击会直接 404。这里把这两个已知页面路径重定向到默认语言（en），
// 同时也救回已发出、仍在用户邮箱里的旧链接。
// 注意：只放行这两个白名单路径，不做通用前缀重定向，避免误伤 /api、/img 等资源。
const BARE_PAGES = new Set(['verify-email', 'reset-password'])

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const url = getRequestURL(event)
  const first = url.pathname.split('/')[1] || ''
  if (!BARE_PAGES.has(first)) return
  return sendRedirect(event, `${url.origin}/en${url.pathname}${url.search}`, 302)
})

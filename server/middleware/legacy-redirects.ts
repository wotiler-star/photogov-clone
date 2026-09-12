// 旧路径 → 与 photogov.net 对齐的新路径（301，保留语言前缀）
// 注意：目标站真实路径为 /contacts/（/support/ 在目标站返回 500），故 support/contact 均归到 contacts
const LEGACY: Record<string, string> = {
  plans: 'prices',
  contact: 'contacts',
  support: 'contacts',
  about: 'about-us',
  terms: 'terms-of-use',
  privacy: 'privacy-policy',
  cookies: 'cookie-policy',
  signin: 'sign-in'
}

// 已经是正式页面的段（单层路由），避免被旧名规则误命中形成自环/死链
const CURRENT = new Set([
  // 工具与列表
  'documents', 'prices', 'how-it-works', 'why-choose-us', 'reviews',
  'security', 'refund-policy', 'compliance', 'knowledge', 'faq', 'blog',
  // 政策/法律
  'about-us', 'contacts', 'privacy-policy', 'terms-of-use', 'cookie-policy',
  'eu-privacy', 'us-id-photo-compliance', 'global-id-photo-compliance',
  'independence-disclaimer',
  // 其它
  'sign-in', 'help', 'passports', 'visas', 'dv-lottery',
  'account', 'admin', 'forgot-password', 'reset-password', 'verify-email'
])

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  // 只处理无尾斜杠的整段：/en/<slug>
  const m = url.pathname.match(/^\/(en|zh|es|fr)\/([a-z0-9-]+)$/)
  if (!m) return

  const [, locale, slug] = m
  if (CURRENT.has(slug)) return // 已是正式页，无需重定向
  const target = LEGACY[slug]
  if (!target) return

  return sendRedirect(event, `${url.origin}/${locale}/${target}/`, 301)
})

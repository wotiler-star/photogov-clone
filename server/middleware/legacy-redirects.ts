// 旧路径 → 与 photogov.net 对齐的新路径（301，保留语言前缀）
const LEGACY: Record<string, string> = {
  plans: 'prices',
  contact: 'support',
  about: 'about-us',
  contacts: 'support',
  terms: 'terms-of-use',
  privacy: 'privacy-policy',
  cookies: 'cookie-policy',
  signin: 'sign-in',
  compliance: 'eu-privacy'
}

// 已经是正式页面的段（避免 about-us 被 about+- 误命中形成自环）
const CURRENT = new Set([
  'about-us', 'privacy-policy', 'terms-of-use', 'cookie-policy',
  'sign-in', 'eu-privacy', 'prices', 'support'
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

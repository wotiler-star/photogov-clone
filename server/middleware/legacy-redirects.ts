// 旧路径 → 与 photogov.net 对齐的新路径（301，保留语言前缀）
const LEGACY: Record<string, string> = {
  plans: 'prices',
  contact: 'support',
  'about-us': 'about',
  contacts: 'support',
  'terms-of-use': 'terms',
  'privacy-policy': 'privacy',
  'cookie-policy': 'cookies',
  'eu-privacy': 'compliance'
}

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  const m = path.match(/^\/(en|zh|es|fr)\/([a-z0-9-]+)\/?$/)
  if (!m) return

  const [, locale, slug] = m
  const target = LEGACY[slug]
  if (!target) return

  return sendRedirect(event, `/${locale}/${target}`, 301)
})

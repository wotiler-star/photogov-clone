// Dynamic robots.txt — points crawlers at the live sitemap and blocks
// private / auth areas so they are never indexed or crawled.
export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin
  const txt = `User-agent: *
Allow: /

# 私有 / 认证区：禁止抓取（避免被收录或浪费抓取预算）
Disallow: /admin
Disallow: /account
Disallow: /profile
Disallow: /payment
Disallow: /sign-in
Disallow: /verify-email
Disallow: /reset-password
Disallow: /forgot-password

Sitemap: ${origin}/sitemap.xml
`
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return txt
})

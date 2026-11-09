// Dynamic robots.txt — points crawlers at the live sitemap and blocks
// private / auth areas so they are never indexed or crawled.
export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin
  const txt = `User-agent: *
Allow: /

# 后台 / 支付回调：无索引价值，禁止抓取。
# 语言前缀路由（/en/admin 等）用通配覆盖，裸路径保留兼容无前缀 URL。
Disallow: /*/admin
Disallow: /*/account
Disallow: /*/payment
Disallow: /admin
Disallow: /account
Disallow: /payment

# 登录 / 资料等认证页不写 Disallow：必须允许抓取才能读到页面上的 noindex，
# 从而把已收录的私有 URL 从索引中移除（noindex 由 app.vue 统一注入）。

Sitemap: ${origin}/sitemap.xml
`
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return txt
})

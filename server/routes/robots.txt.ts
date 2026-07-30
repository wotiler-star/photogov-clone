// Dynamic robots.txt — points crawlers at the live sitemap.
export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin
  const txt = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return txt
})

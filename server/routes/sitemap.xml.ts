// Dynamic multilingual XML sitemap.
// Every static page, document detail and blog post is emitted once per locale
// (/en, /zh, /es, /fr) so each language version has its own crawlable URL.
// Each <url> also carries <xhtml:link rel="alternate" hreflang="..."> entries
// (incl. x-default) — the standard signal for multilingual SEO.
// Absolute URLs are derived from the incoming request host, so this works on
// any domain (preview, production, custom domain).
import documents from '../../data/documents.json'
import blog from '../../data/blog.json'

const LOCALES = ['en', 'zh', 'es', 'fr']
const HREFLANG: Record<string, string> = {
  en: 'en',
  zh: 'zh-CN',
  es: 'es-ES',
  fr: 'fr-FR'
}
const XDEFAULT = 'en'

// Build a locale-prefixed path. Home ("/") becomes "/en", "/zh", ...
function localePath(p: string, loc: string): string {
  return p === '/' ? `/${loc}` : `/${loc}${p}`
}

export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin

  const staticPages = [
    { p: '/', pri: '1.0', freq: 'weekly' },
    { p: '/documents', pri: '0.9', freq: 'weekly' },
    { p: '/passports', pri: '0.8', freq: 'monthly' },
    { p: '/visas', pri: '0.8', freq: 'monthly' },
    { p: '/dv-lottery', pri: '0.8', freq: 'monthly' },
    { p: '/faq', pri: '0.7', freq: 'monthly' },
    { p: '/blog', pri: '0.8', freq: 'weekly' },
    { p: '/about', pri: '0.5', freq: 'yearly' },
    { p: '/compliance', pri: '0.5', freq: 'yearly' },
    { p: '/privacy', pri: '0.3', freq: 'yearly' },
    { p: '/terms', pri: '0.3', freq: 'yearly' },
    { p: '/help', pri: '0.5', freq: 'monthly' },
    { p: '/cookies', pri: '0.3', freq: 'yearly' },
    { p: '/signin', pri: '0.3', freq: 'yearly' },
    // 与 photogov.net 对齐的新页面
    { p: '/prices', pri: '0.8', freq: 'monthly' },
    { p: '/support', pri: '0.5', freq: 'yearly' },
    { p: '/how-it-works', pri: '0.8', freq: 'monthly' },
    { p: '/why-choose-us', pri: '0.7', freq: 'monthly' },
    { p: '/reviews', pri: '0.7', freq: 'monthly' },
    { p: '/security', pri: '0.6', freq: 'yearly' },
    { p: '/refund-policy', pri: '0.4', freq: 'yearly' },
    { p: '/us-id-photo-compliance', pri: '0.4', freq: 'yearly' },
    { p: '/independence-disclaimer', pri: '0.4', freq: 'yearly' },
    { p: '/knowledge', pri: '0.7', freq: 'weekly' },
    { p: '/knowledge/requirements', pri: '0.6', freq: 'weekly' },
    { p: '/knowledge/guides', pri: '0.6', freq: 'weekly' },
    { p: '/knowledge/standards', pri: '0.6', freq: 'weekly' },
    { p: '/knowledge/faq', pri: '0.6', freq: 'weekly' }
  ]

  const docSlugs = Object.keys((documents as any).documents ?? {})
  const blogSlugs = ((blog as any).posts ?? []).map((p: any) => p.slug)

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const lines: string[] = []

  // (path, priority, changefreq) tuples across all pages
  const allPages: Array<{ p: string; pri: string; freq: string }> = [
    ...staticPages,
    ...docSlugs.map((slug) => ({ p: `/document/${slug}`, pri: '0.8', freq: 'monthly' })),
    ...blogSlugs.map((slug) => ({ p: `/blog/${slug}`, pri: '0.6', freq: 'monthly' }))
  ]

  for (const page of allPages) {
    for (const loc of LOCALES) {
      const locUrl = `${origin}${localePath(page.p, loc)}`
      const alts = LOCALES.map(
        (x) =>
          `    <xhtml:link rel="alternate" hreflang="${HREFLANG[x]}" href="${origin}${localePath(page.p, x)}" />`
      ).join('\n')
      const xdefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${localePath(page.p, XDEFAULT)}" />`
      lines.push(
        `  <url>\n    <loc>${esc(locUrl)}</loc>\n    <priority>${page.pri}</priority>\n    <changefreq>${page.freq}</changefreq>\n${alts}\n${xdefault}\n  </url>`
      )
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${lines.join('\n')}
</urlset>
`

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})

// Dynamic XML sitemap — covers all static pages, document detail pages and blog posts.
// Absolute URLs are built from the incoming request host so it works on any domain.
import documents from '../../data/documents.json'
import blog from '../../data/blog.json'
import faq from '../../data/faq.json'

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
    { p: '/contact', pri: '0.5', freq: 'yearly' },
    { p: '/cookies', pri: '0.3', freq: 'yearly' },
    { p: '/signin', pri: '0.3', freq: 'yearly' }
  ]

  const lines: string[] = []
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  for (const s of staticPages) {
    lines.push(`  <url><loc>${origin}${s.p}</loc><priority>${s.pri}</priority><changefreq>${s.freq}</changefreq></url>`)
  }
  for (const slug of Object.keys((documents as any).documents)) {
    lines.push(`  <url><loc>${origin}/document/${esc(slug)}</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>`)
  }
  for (const post of (blog as any).posts) {
    lines.push(`  <url><loc>${origin}/blog/${esc(post.slug)}</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines.join('\n')}
</urlset>
`

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})

// GET /api/og-image/poster?title=...&subtitle=...  —— 动态 OG 分享图（对齐原站 /api/og-image/poster）
// 用 sharp 合成简单品牌卡片图。
import { defineEventHandler, getQuery, setResponseHeaders } from 'h3'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const title = String(q.title || 'PhotoGov')
  const subtitle = String(q.subtitle || 'Compliant passport, visa & ID photos')

  const W = 1200
  const H = 630
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#eef4ff"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect x="0" y="0" width="${W}" height="12" fill="#2B72E0"/>
    <text x="80" y="280" font-family="Georgia, serif" font-size="72" font-weight="700" fill="#1c2433">${escapeXml(title)}</text>
    <text x="80" y="360" font-family="Inter, sans-serif" font-size="34" fill="#5b6678">${escapeXml(subtitle)}</text>
    <text x="80" y="540" font-family="Inter, sans-serif" font-size="40" font-weight="700" fill="#2B72E0">PhotoGov</text>
  </svg>`

  const sharp = (await import('sharp')).default
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()

  setResponseHeaders(event, {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=86400'
  })
  return buf
})

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string)
  )
}

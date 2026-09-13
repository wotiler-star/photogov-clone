// GET /api/app/v1/content/blog/:slug
// 返回博客文章（或文档子页 hub 文章）的完整正文：content(HTML)、faq、目录、schemaOrg。
// 正文体积约 2.7MB，只在服务端引用，不进客户端 bundle。
import indexRaw from '../../../../../../data/blogContentIndex.json'

const index = indexRaw as Record<string, any>

// slug 全局唯一，故直接用末端 slug 建查找表
const bySlug: Record<string, { key: string; entry: any }> = {}
for (const [key, entry] of Object.entries(index)) {
  bySlug[String((entry as any).slug)] = { key, entry }
}

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const hit = bySlug[slug as string]
  if (!hit) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }
  return { key: hit.key, ...hit.entry }
})

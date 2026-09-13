// GET /api/app/v1/content/hub/:slug/:sub
// 返回文档子页（hub 文章）正文：content(HTML)、meta、目录、schemaOrg、作者等。
// 数据来自 data/blogContentIndex.json 中 type==='hub' 的条目，
// 其键形如 `hub/${documentSlug}/${slug}`（例如 hub/digital-passport-photo/examples）。
import indexRaw from '../../../../../../../data/blogContentIndex.json'

const index = indexRaw as Record<string, any>

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug') // documentSlug，如 digital-passport-photo
  const sub = getRouterParam(event, 'sub') // 子页 slug，如 examples
  const key = `hub/${slug}/${sub}`
  const entry = index[key]
  if (!entry || entry.type !== 'hub') {
    throw createError({ statusCode: 404, statusMessage: 'Hub post not found' })
  }
  // 直接展开条目；documentSlug/sub 已在 key 中，无需重复返回
  return { ...entry }
})

// 单个证件详情 API（与原站后端相同契约）
import documentsRaw from '../../../data/documents.json'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const doc = (documentsRaw as { documents: Record<string, any> }).documents[slug as string]
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  return doc
})

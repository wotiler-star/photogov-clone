// GET /api/app/v1/database/documents/:slug
// 返回单个证件详情（含尺寸规格、合规参数）。
import documentsRaw from '../../../../../../data/documents.json'

const documents = (documentsRaw as { documents: Record<string, any> }).documents

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const doc = documents[slug as string]
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
  return { document: doc }
})

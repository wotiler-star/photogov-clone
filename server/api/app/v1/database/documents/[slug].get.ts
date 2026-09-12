// GET /api/app/v1/database/documents/:slug
// 返回单个证件详情 + 目标站原始内容树（供 DocContent 渲染）+ meta/schemaOrg。
// 内容来源：data/docContentIndex.json（由 scripts/build_documents_data.py 生成，
// 取自目标站 content/document 接口），只在服务端引用，不进客户端 bundle。
import documentsRaw from '../../../../../../data/documents.json'
import contentIndex from '../../../../../../data/docContentIndex.json'

const documents = (documentsRaw as { documents: Record<string, any> }).documents
const contentMap = contentIndex as Record<string, { meta: any; content: any[]; schemaOrg: any }>

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const doc = documents[slug as string]
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
  const extra = contentMap[slug as string]
  return {
    document: doc,
    meta: extra?.meta || null,
    content: extra?.content || null,
    schemaOrg: extra?.schemaOrg || null,
  }
})

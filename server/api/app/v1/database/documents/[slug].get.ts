// GET /api/app/v1/database/documents/:slug
// 返回单个证件详情 + 目标站原始内容树（供 DocContent 渲染）+ meta/schemaOrg。
// 内容来源：data/docContentIndex.json（由 scripts/build_documents_data.py 生成，
// 取自目标站 content/document 接口），只在服务端引用，不进客户端 bundle。
import documentsRaw from '../../../../../../data/documents.json'
import contentIndex from '../../../../../../data/docContentIndex.json'

const documents = (documentsRaw as { documents: Record<string, any> }).documents
const contentMap = contentIndex as Record<string, { meta: any; content: any[]; schemaOrg: any }>

// 文档正文树（来自目标站抓取）自带一个英文 "Related pages" 区块（h2 + ul 链接列表），
// 与页面底部 DocFooterNotice 的四语 "Related pages"（i18n 本地化）重复。
// 在此接口层过滤掉正文树中的该区块，保留四语版，避免重复（REA F6 去重）。
// 判定：组件为 DDSpaceGroup / DDContainerMax700 且其子树含 h2 标题精确为 "Related pages" 的块，
// 仅移除「最小块」（父不是同类块），避免向上冒泡误删父容器里的其它内容。
const RP_HEADING = 'Related pages'
function hasRpHeading(n: any): boolean {
  if (!n || typeof n !== 'object') return false
  if (n.component === 'h2' && (n.innerHtml || '').trim() === RP_HEADING) return true
  return (n.children || []).some(hasRpHeading)
}
function isRpBlock(n: any): boolean {
  return (
    !!n &&
    typeof n === 'object' &&
    (n.component === 'DDSpaceGroup' || n.component === 'DDContainerMax700') &&
    hasRpHeading(n)
  )
}
function pruneRelatedPages(nodes: any[], parentIsBlock = false): any[] {
  const out: any[] = []
  for (const n of nodes || []) {
    if (isRpBlock(n) && !parentIsBlock) continue
    if (n && typeof n === 'object' && Array.isArray(n.children)) {
      n.children = pruneRelatedPages(n.children, isRpBlock(n))
    }
    out.push(n)
  }
  return out
}

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const doc = documents[slug as string]
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
  const extra = contentMap[slug as string]
  // 深拷贝后再过滤，避免改动模块级导入的 contentIndex（会被所有请求共享）。
  const rawContent = extra?.content
  const content = rawContent
    ? pruneRelatedPages(JSON.parse(JSON.stringify(rawContent)))
    : null
  return {
    document: doc,
    meta: extra?.meta || null,
    content,
    schemaOrg: extra?.schemaOrg || null,
  }
})

// GET /api/app/v1/database/categories
// 返回证件类别列表及其统计。
import documentsRaw from '../../../../../data/documents.json'

const documents = Object.values(
  (documentsRaw as { documents: Record<string, any> }).documents
) as any[]

export default defineEventHandler(() => {
  const map: Record<string, number> = {}
  for (const d of documents) {
    map[d.category] = (map[d.category] || 0) + 1
  }
  const categories = Object.entries(map).map(([id, count]) => ({
    id,
    count,
    label: id.charAt(0).toUpperCase() + id.slice(1)
  }))
  return { categories }
})

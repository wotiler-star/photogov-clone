// GET /api/app/v1/database/documents
// 支持 ?country= / ?category= / ?q= / ?popular= / ?limit= 筛选。
// 对齐原站 /api/app/v1/database/documents 契约。
import documentsRaw from '../../../../../data/documents.json'

const documents = Object.values(
  (documentsRaw as { documents: Record<string, any> }).documents
) as any[]

export default defineEventHandler((event) => {
  const q = getQuery(event)
  let list = documents

  if (q.country) list = list.filter((d) => d.country === q.country)
  if (q.category && q.category !== 'all')
    list = list.filter((d) => d.category === q.category)
  if (q.popular === 'true') list = list.filter((d) => d.popular)
  if (q.q) {
    const t = String(q.q).toLowerCase()
    list = list.filter(
      (d) =>
        d.name.toLowerCase().includes(t) ||
        d.countryName.toLowerCase().includes(t) ||
        d.slug.toLowerCase().includes(t) ||
        d.category.toLowerCase().includes(t)
    )
  }
  if (q.limit) {
    const n = parseInt(String(q.limit), 10)
    if (!isNaN(n) && n > 0) list = list.slice(0, n)
  }

  return {
    documents: list,
    total: documents.length
  }
})

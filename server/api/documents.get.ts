// 证件列表 API —— 支持 country / category / q 过滤（与原站后端相同契约）
import documentsRaw from '../../data/documents.json'

const documents = Object.values(
  (documentsRaw as { documents: Record<string, any> }).documents
)

export default defineEventHandler((event) => {
  const q = getQuery(event)
  let list = documents as any[]
  if (q.country) list = list.filter((d) => d.country === q.country)
  if (q.category && q.category !== 'all')
    list = list.filter((d) => d.category === q.category)
  if (q.q) {
    const t = String(q.q).toLowerCase()
    list = list.filter(
      (d) =>
        d.name.toLowerCase().includes(t) ||
        d.countryName.toLowerCase().includes(t) ||
        d.slug.toLowerCase().includes(t)
    )
  }
  return list
})

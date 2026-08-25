// GET /api/app/v1/database/countries
// 返回国家列表，可选 ?q= 搜索（名称/代码），?limit= 限制数量。
import countriesRaw from '../../../../../data/countries.json'

const countries = (countriesRaw as { countries: any[] }).countries

export default defineEventHandler((event) => {
  const q = getQuery(event)
  let list = countries as any[]
  if (q.q) {
    const t = String(q.q).toLowerCase()
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.code.toLowerCase().includes(t) ||
        (c.region && c.region.toLowerCase().includes(t))
    )
  }
  if (q.limit) {
    const n = parseInt(String(q.limit), 10)
    if (!isNaN(n) && n > 0) list = list.slice(0, n)
  }
  return {
    countries: list,
    total: (countries as any[]).length
  }
})

// 国家列表 API —— 与原站后端相同契约（我们自己的 Nuxt Nitro 实现）
import countriesRaw from '../../data/countries.json'

export default defineEventHandler(() => {
  return (countriesRaw as { countries: unknown[] }).countries
})

// GET /api/app/v1/blog/get-author?slug=...
// 对齐原站 Blog.GetAuthor 契约（原站为 POST，参数为作者 slug）。
// 返回从 photogov.net 真实抓取的作者档案 + 其文章列表（data/author.json）。
import author from '../../../../../data/author.json'

export default defineEventHandler((event) => {
  const slug = getQuery(event).slug
  const data = (author as any).data
  // 快照仅含一位作者；slug 不匹配时仍回退返回该作者（克隆站单作者场景）。
  if (slug && data.author.slug && String(slug) !== data.author.slug) {
    // 保持契约一致：返回该作者数据，便于单作者克隆站直接复用。
  }
  return data
})

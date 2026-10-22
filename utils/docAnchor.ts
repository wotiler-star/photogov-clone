/**
 * 文档正文标题 → 锚点 id。
 *
 * 原站（SEEN）：文档页 H2 的 id 就是标题文本的 slug，例如
 *   "2x2 Photo Converter — Make Your US Passport Photo Now (51 × 51 mm / 600 × 600 Pixels)"
 *   → "2x2-photo-converter-make-your-us-passport-photo-now-51-51-mm-600-600-pixels"
 * 目录「On this page」直接用这些 id 做锚点跳转。
 *
 * 本站内容树里只有部分 h2 自带 id（126 篇中 46 篇的导航数据完整），
 * 其余需要在渲染时按同一规则生成，才能让目录与标题对得上。
 */
export const stripTags = (s: string) =>
  String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, '')
    .trim()

export const slugifyHeading = (text: string) =>
  stripTags(text)
    .toLowerCase()
    // 破折号/引号等非字母数字统一先转成连字符，避免被吞掉后产生双连字符
    .replace(/[–—‐-―]/g, '-')
    .replace(/[‘’“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

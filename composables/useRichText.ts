// 富文本标记渲染（F5 信息页）
// 标记语法：[[label~url]] 外链（新窗口）；[[label~:path]] 站内链接（localePath 本地化）；\n → <br>
// ⚠ 分隔符必须用 ~ 而非 | ：vue-i18n 消息编译器把 | 视为复数分隔符，会把消息在第一个 | 处截断
// 仅用于静态 i18n 内容（模板层 v-html 渲染，无用户输入，无注入风险）
import { useLocalePath } from '#imports'

export function useRichText() {
  const localePath = useLocalePath()

  const rich = (s: string) =>
    s
      .replace(/\[\[([^~\]]+)~([^\]]+)\]\]/g, (_m, label: string, url: string) => {
        const internal = url.startsWith(':')
        // 站内路径统一补前导斜杠：localePath('documents/xx') 解析不出，必须是 '/documents/xx'
        const raw = url.slice(1)
        const path = raw && !raw.startsWith('/') ? `/${raw}` : raw
        const href = internal ? (path ? localePath(path) : localePath('/')) : url
        const attrs = internal ? '' : ' target="_blank" rel="noopener"'
        return `<a href="${href}" class="text-blue-600 underline duration-200 hover:text-red-600"${attrs}>${label}</a>`
      })
      .replace(/\n/g, '<br>')

  return { rich }
}

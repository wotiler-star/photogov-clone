/**
 * 正文 HTML 的站内链接本地化。
 *
 * 数据层的站内链接已改成相对路径 /xxx；但 i18n 用 strategy:'prefix'，
 * 裸 /xxx 直接 404，必须变成 /{locale}/xxx，否则非英语页正文链接全部失效。
 * 只处理 href 属性：外链、静态资源、已有语言前缀、JSON-LD 绝对 URL 均不动。
 */
export function localizeHtml(html: string, lp: (path: string) => string): string {
  if (!html || typeof html !== 'string') return html
  return html.replace(/href=(["'])([^"']*)\1/g, (match, q: string, raw: string) => {
    let path = raw
    // 兼容可能残留的本站绝对地址
    const abs = /^https?:\/\/(?:www\.)?photogov\.xyz\/(.*)$/i.exec(raw)
    if (abs) path = '/' + abs[1]
    else if (!path.startsWith('/')) return match
    // 静态资源与已有语言前缀不加前缀
    if (/^\/(?:_nuxt|favicon|og-image|robots\.txt|sitemap\.xml|__nuxt|assets)/.test(path)) return match
    if (/^\/(?:en|zh|es|fr)(?:\/|$)/.test(path)) return match
    return `href=${q}${lp(path)}${q}`
  })
}

/** 递归本地化内容树里所有字符串值（innerHtml / model / faq 答案等） */
export function localizeNodes(nodes: any[], lp: (path: string) => string): any[] {
  const walk = (value: any): any => {
    if (typeof value === 'string') return localizeHtml(value, lp)
    if (Array.isArray(value)) return value.map(walk)
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {}
      for (const key of Object.keys(value)) out[key] = walk(value[key])
      return out
    }
    return value
  }
  return walk(nodes)
}

// 自动为所有缺省 loading 的图片补 loading="lazy"（含 v-html 文章正文图）。
// 已显式设置 loading 的图片（如顶部 LCP 大图 loading="eager"）不会被覆盖。
// 仅客户端运行。
import { nextTick } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const apply = (root: ParentNode = document) => {
    root.querySelectorAll('img:not([loading])').forEach((img) => {
      img.setAttribute('loading', 'lazy')
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async')
    })
  }

  // 初次挂载 + 每次路由切换后扫一遍
  const sweep = () => nextTick(() => apply(document))
  nuxtApp.hook('app:mounted', sweep)
  nuxtApp.hook('page:finish', sweep)

  // 兜底：动态插入的内容（v-html 正文、无限滚动等）也自动补
  const observer = new MutationObserver((mutations) => {
    let dirty = false
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue
        const el = node as Element
        if (el.tagName === 'IMG') {
          if (!el.hasAttribute('loading')) dirty = true
        } else if (el.querySelector && el.querySelector('img:not([loading])')) {
          dirty = true
        }
      }
    }
    if (dirty) apply(document)
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
})

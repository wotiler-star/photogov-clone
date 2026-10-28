<script setup lang="ts">
/**
 * 根组件：默认布局 + 页面出口 + 全站社交分享（Open Graph / Twitter Card）兜底。
 *
 * 为什么放在这里：
 * - 社交爬虫（Facebook / LinkedIn / Slack / Discord / X）只读 SSR 输出的 HTML，
 *   因此 og:image 与 og:locale 必须在服务端渲染时就写进 <head>，不能依赖客户端 document。
 *   app.vue 是根组件，SSR 阶段必定执行，是最合适的注入点。
 * - 各内容页（首页、文档详情页等）已各自注入 og:title / og:description / og:url，
 *   这里只补它们普遍缺失的「缩略图」与「随语言切换的 locale」，
 *   不改动页面级标签，避免重复。
 */
import { useHead, useRequestURL } from '#imports'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const url = useRequestURL()

// 语言代码 → Open Graph locale（社交平台标准写法）
const OG_LOCALES: Record<string, string> = {
  en: 'en_US',
  zh: 'zh_CN',
  es: 'es_ES',
  fr: 'fr_FR'
}

useHead(() => {
  // 用请求域名拼绝对 URL，自托管/预览域也正确（不依赖 NUXT_PUBLIC_SITE_URL）
  const image = `${url.origin}/og-default.png`
  const current = OG_LOCALES[locale.value] || 'en_US'
  const alternates = Object.entries(OG_LOCALES)
    .filter(([code]) => code !== locale.value)
    .map(([, og]) => og)

  return {
    meta: [
      // 站点级 OG 标题/描述「兜底」：页面若已设置 og:title / og:description，
      // 会覆盖此处（实测 unhead 后者覆盖前者：文档页 og:type=product 覆盖全局 website），
      // 因此这里只兜住尚未单独设置的页（如 prices / 法务页），保证社交分享不为空。
      { property: 'og:title', content: 'PhotoGov — Passport Photo, Visa Photo & ID Photo Maker Online' },
      { property: 'og:description', content: 'Make compliant passport, visa and ID photos online in seconds. Free tool with country-specific size specs, white/blue background, and instant JPG/PDF download.' },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'PhotoGov — Passport, Visa & ID Photo Maker' },
      { name: 'twitter:image', content: image },
      { property: 'og:locale', content: current },
      // 其余语言作为 alternate，帮助社交平台发现多语言版本
      ...alternates.map((og) => ({ property: 'og:locale:alternate', content: og }))
    ]
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
/**
 * /blog/ → 301 重定向到 /knowledge/（对齐原站 IA）。
 *
 * SEEN：原站 `GET /blog/` 返回 301，落地 `/knowledge/`（title：Passport & Visa
 * Photo Knowledge Hub）——原站没有独立博客域，文章统一走 `/knowledge/<cat>/<slug>/`。
 * 保留本路由只为让旧外链/书签平滑迁移，redirectCode 301 兼顾 SEO 权重传递。
 */
const localePath = useLocalePath()

await navigateTo(localePath('/knowledge'), { redirectCode: 301 })
</script>

<template>
  <div />
</template>

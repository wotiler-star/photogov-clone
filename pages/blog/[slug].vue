<script setup lang="ts">
/**
 * /blog/<slug> → 301 重定向到 /knowledge/<category>/<slug>（对齐原站 IA）。
 *
 * SEEN：原站文章统一挂在 `/knowledge/<cat>/<slug>/`，`/blog/` 本身已 301 到
 * `/knowledge/`；本站早期用 `/blog/<slug>` 承载同一批文章，现统一收敛到
 * 知识库路由，旧链接用 301 平滑迁移（SEO 权重传递 + 用户无感）。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import posts from '~/data/blog.json'

const route = useRoute()
const localePath = useLocalePath()
const slug = computed(() => String(route.params.slug || ''))

const post = computed(() =>
  ((posts as any).posts as any[]).find((p) => p.slug === slug.value) || null,
)

await navigateTo(
  localePath(post.value ? `/knowledge/${post.value.categorySlug}/${post.value.slug}` : '/knowledge'),
  { redirectCode: 301 },
)
</script>

<template>
  <div />
</template>

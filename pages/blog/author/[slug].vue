<script setup lang="ts">
/**
 * /blog/author/<slug> → 301 重定向到 /author/<slug>（对齐原站作者页 IA）。
 *
 * SEEN：原站作者页统一挂在 `/author/<slug>/`；本站早期把作者页放在
 * `/blog/author/<slug>`，现统一收敛到 `/author/<slug>`，旧链接用 301
 * 平滑迁移（SEO 权重传递 + 用户无感）。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const localePath = useLocalePath()
const slug = computed(() => String(route.params.slug || ''))

await navigateTo(localePath(slug.value ? `/author/${slug.value}` : '/editorial-team'), {
  redirectCode: 301
})
</script>

<template>
  <div />
</template>

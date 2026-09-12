<script setup lang="ts">
/**
 * 文档详情页 —— 直接渲染目标站该页的原始内容树。
 *
 * 数据来源：内部 API /api/app/v1/database/documents/:slug，返回
 *   { document, meta, content, schemaOrg }
 * 其中 content 是从目标站 /api/app/v1/content/document 抓来的完整组件树，
 * 由 DocContent/DocNode 递归渲染（52 类 DD* 组件）。
 *
 * 这样每页呈现的是目标站**专属真实文案**（各自的标题/章节/要求表/FAQ），
 * 而不是早先用 docTemplate.json 占位符推测出来的通用文案。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestURL } from '#imports'
import DocContent from '~/components/DocContent.vue'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { fetchDocument } = useApi()

const { data, error } = await useAsyncData(
  () => `doc-content-${slug.value}`,
  () => fetchDocument(slug.value),
  { default: () => null as any },
)

// 未知 slug（即原先那批凭空生成的幻影文档）按目标站约定返回 404
if (!data.value || !(data.value as any).document || error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Document not found' })
}

const payload = data as unknown as {
  value: { document: any; meta: any; content: any[]; schemaOrg: string[] } | null
}

const doc = computed(() => payload.value?.document || null)
const meta = computed(() => payload.value?.meta || {})
const nodes = computed(() => payload.value?.content || [])
const schemaOrg = computed(() => payload.value?.schemaOrg || [])

const url = useRequestURL()
const pageTitle = computed(() => meta.value.title || doc.value?.title || doc.value?.name)
const pageDescription = computed(() => meta.value.description || doc.value?.description || '')

useHead({
  title: pageTitle.value,
  meta: [
    { name: 'description', content: pageDescription.value },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: pageDescription.value },
    { property: 'og:type', content: 'product' },
    { property: 'og:url', content: url.toString() },
  ],
  link: [{ rel: 'canonical', href: url.toString() }],
  script: (schemaOrg.value || []).map((s: string, i: number) => ({
    key: `ld-doc-${i}`,
    type: 'application/ld+json',
    innerHTML: typeof s === 'string' ? s : JSON.stringify(s),
  })),
})
</script>

<template>
  <article class="pg-document-detail">
    <DocContent :nodes="nodes" />
  </article>
</template>

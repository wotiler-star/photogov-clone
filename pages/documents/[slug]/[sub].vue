<script setup lang="ts">
/**
 * 文档子页（hub 文章） —— 渲染目标站 digital-passport-photo 等文档下的
 * requirements / upload / examples / rejected / faq / how-to-make 等子页。
 *
 * 数据来源：内部 API /api/app/v1/content/hub/:slug/:sub，返回
 *   { type, documentSlug, slug, content, meta, toc, schemaOrg, author, document }
 * 其中 content 是从目标站 Blog.GetHubPost 抓来的完整 HTML 正文。
 *
 * 正文里目标站硬编码了绝对链接 https://photogov.net/documents/.../ ，
 * 这里统一改写为本地相对链接，保证克隆站点自包含（不跳回原站）。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestURL } from '#imports'
import { useApi } from '~/composables/useApi'
import { useData } from '~/composables/useData'

const localePath = useLocalePath()
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const sub = computed(() => route.params.sub as string)
const { fetchHubArticle } = useApi()
const { getDocument } = useData()

const { data, error } = await useAsyncData(
  () => `hub-${slug.value}-${sub.value}`,
  () => fetchHubArticle(slug.value, sub.value),
  { default: () => null as any },
)

if (!data.value || !(data.value as any).content || error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Subpage not found' })
}

const hub = computed(() => data.value as any)
const docName = computed(() => {
  const d = getDocument(slug.value)
  if (d) return d.title || d.name
  return hub.value?.document?.meta?.name?.en || hub.value?.documentSlug || slug.value
})
// 把正文里的绝对链接改写为本地相对链接，保持站点自包含
const body = computed(() =>
  (hub.value?.content || '').replace(/https:\/\/photogov\.net/g, ''),
)
const pageTitle = computed(() => hub.value?.meta?.title || docName.value)
const pageDescription = computed(() => hub.value?.meta?.description || '')

const url = useRequestURL()

useHead(() => ({
  title: pageTitle.value,
  meta: [
    { name: 'description', content: pageDescription.value },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: pageDescription.value },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: url.toString() },
  ],
  link: [{ rel: 'canonical', href: url.toString() }],
  script: (hub.value?.schemaOrg || []).map((s: string, i: number) => ({
    key: `ld-hub-${i}`,
    type: 'application/ld+json',
    // 把目标站 canonical URL 改写为本地，保证结构化数据自包含
    innerHTML: (typeof s === 'string' ? s : JSON.stringify(s)).replace(/https:\/\/photogov\.net/g, ''),
  })),
}))
</script>

<template>
  <div class="bg-slate-50 min-h-[70vh]">
    <!-- 头部 -->
    <header class="border-b border-slate-200 bg-white">
      <div class="container-pg py-10">
        <nav class="text-sm text-muted">
          <NuxtLink :to="localePath('/documents')" class="hover:text-brand-blue">Documents</NuxtLink>
          <span class="mx-1">/</span>
          <NuxtLink :to="localePath(`/documents/${slug}`)" class="hover:text-brand-blue">{{ docName }}</NuxtLink>
          <span class="mx-1">/</span>
          <span class="text-ink">{{ pageTitle }}</span>
        </nav>
        <h1 class="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{{ pageTitle }}</h1>
        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span v-if="hub.author?.name">{{ hub.author.name }}</span>
          <span v-if="hub.author?.name && hub.publishedAt" class="text-slate-300">·</span>
          <span v-if="hub.publishedAt">{{ new Date(hub.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
          <span v-if="hub.readingTime" class="text-slate-300">·</span>
          <span v-if="hub.readingTime">{{ hub.readingTime }} min read</span>
        </div>
      </div>
    </header>

    <div class="container-pg py-10">
      <article class="article card-pg mx-auto max-w-3xl p-6 sm:p-8">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="mt-2" v-html="body"></div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.article :deep(h2) {
  @apply mt-6 mb-2 font-serif text-xl font-bold text-ink;
}
.article :deep(h3) {
  @apply mt-5 mb-2 font-semibold text-lg text-ink;
}
.article :deep(p) {
  @apply my-3 text-[15px] leading-relaxed text-muted;
}
.article :deep(ul) {
  @apply my-3 list-disc space-y-1.5 pl-5 text-[15px] text-muted;
}
.article :deep(ol) {
  @apply my-3 list-decimal space-y-1.5 pl-5 text-[15px] text-muted;
}
.article :deep(strong) {
  @apply font-semibold text-ink;
}
.article :deep(a) {
  @apply text-brand-blue underline;
}
.article :deep(img) {
  @apply my-4 mx-auto max-w-full rounded-xl;
}
.article :deep(blockquote) {
  @apply my-4 rounded-xl border-l-4 border-brand-blue bg-brand-blue/5 px-4 py-3 text-[15px] text-ink;
}
.article :deep(table) {
  @apply my-4 w-full border-collapse text-sm;
}
.article :deep(th),
.article :deep(td) {
  @apply border border-slate-200 px-3 py-2 text-left;
}
.article :deep(th) {
  @apply bg-slate-100 font-semibold;
}
</style>

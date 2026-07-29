<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BlogCard from '~/components/BlogCard.vue'
import { useData } from '~/composables/useData'
import { useRequestURL } from '#imports'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { getPost, relatedPosts } = useData()
const post = computed(() => getPost(slug.value))
const url = useRequestURL()

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

useHead(() => {
  if (!post.value) {
    return { title: 'Article not found', meta: [{ name: 'robots', content: 'noindex' }] }
  }
  const p = post.value
  const canonical = `${url.origin}/blog/${p.slug}`
  const desc = p.excerpt
  const json = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: desc,
    datePublished: p.date,
    author: { '@type': 'Organization', name: p.author || 'PhotoGov' },
    publisher: { '@type': 'Organization', name: 'PhotoGov' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: p.category
  }
  const bc = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${url.origin}/blog` },
      { '@type': 'ListItem', position: 2, name: p.category, item: `${url.origin}/blog` },
      { '@type': 'ListItem', position: 3, name: p.title, item: canonical }
    ]
  }
  return {
    title: `${p.title} | PhotoGov Blog`,
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: p.title },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: p.title },
      { name: 'twitter:description', content: desc }
    ],
    link: [{ rel: 'canonical', href: canonical }],
    script: [
      { key: 'ld-post', type: 'application/ld+json', innerHTML: JSON.stringify(json) },
      { key: 'ld-breadcrumb', type: 'application/ld+json', innerHTML: JSON.stringify(bc) }
    ]
  }
})

const rel = computed(() => (post.value ? relatedPosts(post.value.slug, 3) : []))
</script>

<template>
  <div v-if="post" class="bg-slate-50 min-h-[70vh]">
    <!-- 头部 -->
    <header
      class="border-b border-slate-200"
      :style="{ background: `linear-gradient(135deg, ${post.accent}14, ${post.accent}38)` }"
    >
      <div class="container-pg py-12">
        <nav class="text-sm text-muted">
          <NuxtLink to="/blog" class="hover:text-brand-blue">Blog</NuxtLink>
          <span class="mx-1">/</span>
          <span class="text-ink">{{ post.category }}</span>
        </nav>
        <h1 class="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{{ post.title }}</h1>
        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span class="text-2xl">{{ post.cover }}</span>
          <span>{{ post.author }}</span>
          <span class="text-slate-300">·</span>
          <span>{{ fmt(post.date) }}</span>
          <span class="text-slate-300">·</span>
          <span>{{ post.readTime }}</span>
        </div>
      </div>
    </header>

    <div class="container-pg py-10">
      <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <!-- 正文 -->
        <article class="article card-pg p-6 sm:p-8">
          <div class="flex flex-wrap gap-2">
            <span v-for="t in (post.tags || [])" :key="t" class="chip">#{{ t }}</span>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="mt-5" v-html="post.body"></div>
          <div class="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-muted">
            <strong class="text-ink">Disclaimer:</strong> PhotoGov is an independent tool and is not affiliated with any government agency. Always confirm the latest rules on the official authority website before submitting.
          </div>
        </article>

        <!-- 侧栏 -->
        <aside class="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div class="card-pg p-5">
            <h3 class="font-semibold text-ink">Make your photo</h3>
            <p class="mt-1 text-sm text-muted">Pick your document and download a compliant photo in seconds.</p>
            <NuxtLink to="/documents" class="btn-primary mt-3 w-full">Browse documents</NuxtLink>
          </div>
          <div class="card-pg p-5" v-if="rel.length">
            <h3 class="font-semibold text-ink">Related articles</h3>
            <ul class="mt-3 space-y-3">
              <li v-for="r in rel" :key="r.slug">
                <NuxtLink :to="`/blog/${r.slug}`" class="flex gap-3 group">
                  <span class="text-xl">{{ r.cover }}</span>
                  <span class="text-sm text-muted group-hover:text-brand-blue">{{ r.title }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <!-- 相关卡片 -->
      <section v-if="rel.length" class="mt-12">
        <h2 class="text-2xl font-bold">Keep reading</h2>
        <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <BlogCard v-for="r in rel" :key="r.slug" :post="r" />
        </div>
      </section>
    </div>
  </div>

  <div v-else class="container-pg py-20 text-center">
    <h1 class="text-2xl font-bold">Article not found</h1>
    <NuxtLink to="/blog" class="btn-primary mt-4">Back to blog</NuxtLink>
  </div>
</template>

<style scoped>
.article :deep(h2) {
  @apply mt-6 mb-2 font-serif text-xl font-bold text-ink;
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
.article :deep(blockquote) {
  @apply my-4 rounded-xl border-l-4 border-brand-blue bg-brand-blue/5 px-4 py-3 text-[15px] text-ink;
}
</style>

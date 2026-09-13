<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useLocalePath, useRequestURL } from '#imports'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { getAuthor } = useApi()
const localePath = useLocalePath()
const url = useRequestURL()

const { data } = await useAsyncData(
  () => `author-${slug.value}`,
  () => getAuthor(slug.value).catch(() => null),
  { default: () => null as any }
)

const author = computed(() => data.value?.author || null)
const posts = computed(() => (data.value?.posts || []) as any[])
const schemaOrg = computed(() => data.value?.schemaOrg || null)

const fmtDate = (d?: string) =>
  d ? new Date(d.replace(' ', 'T')).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

useHead(() => {
  if (!author.value) return { title: 'Author not found', meta: [{ name: 'robots', content: 'noindex' }] }
  const a = author.value
  const canonical = `${url.origin}/blog/author/${a.slug}`
  return {
    title: `${a.name} | PhotoGov Blog`,
    meta: [
      { name: 'description', content: a.bio || '' },
      { property: 'og:title', content: `${a.name} | PhotoGov Blog` },
      { property: 'og:description', content: a.bio || '' },
      { property: 'og:type', content: 'profile' },
      { name: 'robots', content: 'index,follow' }
    ].filter((m) => m.content !== ''),
    link: [{ rel: 'canonical', href: canonical }],
    script: schemaOrg.value ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(schemaOrg.value) }] : []
  }
})
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-4xl">
      <NuxtLink :to="localePath('/blog')" class="text-sm text-brand hover:underline">← Back to blog</NuxtLink>

      <template v-if="author">
        <!-- 作者档案 -->
        <header class="mt-6 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <img
            v-if="author.avatar_url"
            :src="author.avatar_url"
            :alt="author.name"
            width="112"
            height="112"
            class="h-28 w-28 flex-none rounded-full object-cover ring-4 ring-[#ccb38d]/40"
            loading="lazy"
          />
          <div
            v-else
            class="flex h-28 w-28 flex-none items-center justify-center rounded-full bg-[#ccb38d]/30 text-3xl font-bold text-[#17304B]"
          >
            {{ (author.name || '?').slice(0, 1) }}
          </div>
          <div>
            <span class="eyebrow">About the author</span>
            <h1 class="mt-1 text-3xl font-bold sm:text-4xl">{{ author.name }}</h1>
            <p class="mt-3 max-w-2xl text-muted">{{ author.bio }}</p>
          </div>
        </header>

        <!-- 作者文章 -->
        <h2 class="mt-12 text-2xl font-bold">Articles by this author</h2>
        <div v-if="posts.length" class="mt-6 grid gap-6 sm:grid-cols-2">
          <article
            v-for="p in posts"
            :key="p.id"
            class="card-pg group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <NuxtLink :to="localePath(`/blog/${p.slug}`)" class="block">
              <div class="relative flex h-40 items-center justify-center overflow-hidden bg-[#17304B]/5">
                <img
                  v-if="p.cover_url"
                  :src="p.cover_url"
                  :alt="p.title"
                  class="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <span
                  class="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-0.5 text-[11px] font-semibold text-ink"
                >{{ p.article_type || 'article' }}</span>
              </div>
            </NuxtLink>
            <div class="flex flex-1 flex-col p-5">
              <h3 class="font-serif text-lg font-bold leading-snug text-ink group-hover:text-brand-blue">
                <NuxtLink :to="localePath(`/blog/${p.slug}`)">{{ p.title }}</NuxtLink>
              </h3>
              <p v-if="p.excerpt" class="mt-2 line-clamp-3 flex-1 text-sm text-muted">{{ p.excerpt }}</p>
              <div class="mt-4 flex items-center gap-2 text-xs text-muted">
                <span>{{ fmtDate(p.published_at) }}</span>
                <span v-if="p.reading_time" class="text-slate-300">·</span>
                <span v-if="p.reading_time">{{ p.reading_time }} min read</span>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="mt-6 text-muted">No articles published yet.</p>
      </template>

      <template v-else>
        <div class="mt-10 text-center">
          <h1 class="text-2xl font-bold">Author not found</h1>
          <p class="mt-3 text-muted">We couldn't find the author you were looking for.</p>
        </div>
      </template>
    </div>
  </div>
</template>

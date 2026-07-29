<script setup lang="ts">
import { ref, computed } from 'vue'
import BlogCard from '~/components/BlogCard.vue'
import { useData } from '~/composables/useData'
import { useRequestURL } from '#imports'

const { blogPosts, blogCategories } = useData()
const url = useRequestURL()

const query = ref('')
const activeCat = ref('all')

const cats = blogCategories()
const posts = blogPosts()

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return posts
    .filter((p: any) => activeCat.value === 'all' || p.category === activeCat.value)
    .filter((p: any) => !q || `${p.title} ${p.excerpt} ${(p.tags || []).join(' ')}`.toLowerCase().includes(q))
    .slice()
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1))
})

const featured = computed(() => filtered.value[0])
const rest = computed(() => filtered.value.slice(1))

useHead(() => {
  const canonical = `${url.origin}/blog`
  const desc =
    'Guides, country spotlights and tips for taking compliant passport, visa and ID photos — straight from the PhotoGov team.'
  return {
    title: 'Blog — Passport & Visa Photo Guides | PhotoGov',
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: 'Blog — Passport & Visa Photo Guides | PhotoGov' },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: 'Blog — Passport & Visa Photo Guides | PhotoGov' },
      { name: 'twitter:description', content: desc }
    ],
    link: [{ rel: 'canonical', href: canonical }]
  }
})
</script>

<template>
  <div class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-12">
      <!-- 头部 -->
      <div class="text-center">
        <span class="eyebrow">Blog</span>
        <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Passport &amp; visa photo guides</h1>
        <p class="mx-auto mt-3 max-w-2xl text-muted">
          Practical tips, country spotlights and requirement explainers to help you get a photo accepted the first time.
        </p>
        <div class="relative mx-auto mt-6 max-w-xl">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <input
            v-model="query"
            type="text"
            placeholder="Search articles…"
            class="w-full rounded-full border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-brand-blue"
          />
        </div>
      </div>

      <!-- 分类 -->
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <button
          class="rounded-full px-4 py-1.5 text-sm font-medium transition"
          :class="activeCat === 'all' ? 'bg-brand-blue text-white' : 'bg-white text-muted ring-1 ring-slate-200 hover:bg-slate-100'"
          @click="activeCat = 'all'"
        >All</button>
        <button
          v-for="c in cats"
          :key="c"
          class="rounded-full px-4 py-1.5 text-sm font-medium transition"
          :class="activeCat === c ? 'bg-brand-blue text-white' : 'bg-white text-muted ring-1 ring-slate-200 hover:bg-slate-100'"
          @click="activeCat = c"
        >{{ c }}</button>
      </div>

      <!-- 精选 -->
      <div v-if="featured" class="mt-10">
        <NuxtLink
          :to="`/blog/${featured.slug}`"
          class="card-pg group grid overflow-hidden transition hover:shadow-card lg:grid-cols-2"
        >
          <div
            class="flex h-48 items-center justify-center text-7xl lg:h-full"
            :style="{ background: `linear-gradient(135deg, ${featured.accent}22, ${featured.accent}55)` }"
          >{{ featured.cover }}</div>
          <div class="flex flex-col justify-center p-6">
            <span class="chip w-fit">{{ featured.category }}</span>
            <h2 class="mt-3 font-serif text-2xl font-bold text-ink group-hover:text-brand-blue">{{ featured.title }}</h2>
            <p class="mt-2 text-muted">{{ featured.excerpt }}</p>
            <div class="mt-4 text-xs text-muted">{{ featured.date }} · {{ featured.readTime }}</div>
          </div>
        </NuxtLink>
      </div>

      <!-- 列表 -->
      <div v-if="rest.length" class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BlogCard v-for="p in rest" :key="p.slug" :post="p" />
      </div>

      <div v-if="!filtered.length" class="mt-12 text-center text-muted">
        No articles match your search.
      </div>
    </div>
  </div>
</template>

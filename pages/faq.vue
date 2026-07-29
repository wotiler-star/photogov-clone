<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from '~/composables/useData'
import { useRequestURL } from '#imports'

const { faqCategories, faqItems } = useData()
const url = useRequestURL()

const query = ref('')
const activeCat = ref('all')
const open = ref<Set<number>>(new Set())

const cats = faqCategories()
const allItems = faqItems().map((it: any, i: number) => ({ ...it, i }))

const catTitle = (id: string) => cats.find((c) => c.id === id)?.title || id
const catEmoji = (id: string) => cats.find((c) => c.id === id)?.emoji || '❓'

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return allItems.filter((it) => {
    if (activeCat.value !== 'all' && it.category !== activeCat.value) return false
    if (q && !(`${it.q} ${it.a}`.toLowerCase().includes(q))) return false
    return true
  })
})

const grouped = computed(() => {
  const map: Record<string, typeof allItems> = {}
  for (const it of filtered.value) (map[it.category] ||= []).push(it)
  return map
})

function toggle(i: number) {
  const s = new Set(open.value)
  s.has(i) ? s.delete(i) : s.add(i)
  open.value = s
}

useHead(() => {
  const canonical = `${url.origin}/faq`
  const desc =
    'Answers to common questions about passport, visa and ID photos — sizes, backgrounds, the PhotoGov tool, downloads, privacy and acceptance.'
  return {
    title: 'FAQ — Passport, Visa & ID Photo Questions | PhotoGov',
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: 'FAQ — Passport, Visa & ID Photo Questions | PhotoGov' },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: 'FAQ — Passport, Visa & ID Photo Questions | PhotoGov' },
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
        <span class="eyebrow">Help Center</span>
        <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Frequently asked questions</h1>
        <p class="mx-auto mt-3 max-w-2xl text-muted">
          Everything you need to know about making compliant passport, visa and ID photos with PhotoGov.
        </p>
        <div class="relative mx-auto mt-6 max-w-xl">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <input
            v-model="query"
            type="text"
            placeholder="Search questions…"
            class="w-full rounded-full border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-brand-blue"
          />
        </div>
      </div>

      <!-- 分类筛选 -->
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <button
          class="rounded-full px-4 py-1.5 text-sm font-medium transition"
          :class="activeCat === 'all' ? 'bg-brand-blue text-white' : 'bg-white text-muted ring-1 ring-slate-200 hover:bg-slate-100'"
          @click="activeCat = 'all'"
        >
          All
        </button>
        <button
          v-for="c in cats"
          :key="c.id"
          class="rounded-full px-4 py-1.5 text-sm font-medium transition"
          :class="activeCat === c.id ? 'bg-brand-blue text-white' : 'bg-white text-muted ring-1 ring-slate-200 hover:bg-slate-100'"
          @click="activeCat = c.id"
        >
          {{ c.emoji }} {{ c.title }}
        </button>
      </div>

      <!-- 分组列表 -->
      <div v-if="filtered.length" class="mx-auto mt-10 max-w-3xl space-y-10">
        <section v-for="(list, catId) in grouped" :key="catId">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span class="text-2xl">{{ catEmoji(catId) }}</span>{{ catTitle(catId) }}
          </h2>
          <div class="space-y-3">
            <div
              v-for="it in list"
              :key="it.i"
              class="card-pg overflow-hidden"
            >
              <button
                class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                @click="toggle(it.i)"
              >
                <span class="font-semibold text-ink">{{ it.q }}</span>
                <svg
                  class="h-5 w-5 shrink-0 text-brand-blue transition-transform"
                  :class="open.has(it.i) ? 'rotate-180' : ''"
                  viewBox="0 0 24 24" fill="none"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <div
                v-show="open.has(it.i)"
                class="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-muted"
              >
                {{ it.a }}
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 空状态 -->
      <div v-else class="mx-auto mt-12 max-w-md text-center text-muted">
        <p>No questions match “{{ query }}”.</p>
        <p class="mt-2 text-sm">
          Try a different keyword, or
          <NuxtLink to="/contact" class="text-brand-blue underline">contact us</NuxtLink>.
        </p>
      </div>

      <!-- 联系 CTA -->
      <div class="mx-auto mt-12 max-w-3xl rounded-2xl bg-header px-6 py-8 text-center text-white">
        <h2 class="text-2xl font-bold">Still have a question?</h2>
        <p class="mt-2 text-white/70">Our team is happy to help you get a compliant photo.</p>
        <NuxtLink to="/contact" class="btn-yellow mt-4">Contact us</NuxtLink>
      </div>
    </div>
  </div>
</template>

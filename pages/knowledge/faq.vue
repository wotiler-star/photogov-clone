<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useData } from '~/composables/useData'
import { useOrgLd } from '~/composables/useOrgLd'
import { useRequestURL } from '#imports'

const { t } = useI18n()
const localePath = useLocalePath()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()
const { faqCategories, faqItems } = useData()

useHead({ title: `${t('knowledge.tabFaq')} — ${t('knowledge.title')}` })

const cats = faqCategories()
const items = faqItems()
const open = ref<Set<number>>(new Set())

const catTitle = (id: string) => cats.find((c: any) => c.id === id)?.title || id
const catEmoji = (id: string) => cats.find((c: any) => c.id === id)?.emoji || '❓'

const grouped = computed(() => {
  const map: Record<string, any[]> = {}
  items.forEach((it: any, i: number) => (map[it.category] ||= []).push({ ...it, i }))
  return map
})

const toggle = (i: number) => {
  const s = new Set(open.value)
  s.has(i) ? s.delete(i) : s.add(i)
  open.value = s
}

// 结构化数据：Organization + BreadcrumbList + FAQPage。
// 该页为独立 FAQ 分类页（不走 KnowledgeList），此前 JSON-LD 为 0，属 SEO 洼地。
const escLd = (s: string) => s.replace(/</g, '\\u003c')
const strip = (s: string) => String(s || '').replace(/<[^>]*>/g, '')
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((it: any) => ({
    '@type': 'Question',
    name: strip(it.q),
    acceptedAnswer: { '@type': 'Answer', text: strip(it.a) },
  })),
}
const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
    { '@type': 'ListItem', position: 2, name: t('knowledge.hubLabel'), item: url.origin + localePath('/knowledge') },
    { '@type': 'ListItem', position: 3, name: t('knowledge.tabFaq') },
  ],
}
useHead({
  script: [
    ...orgScripts.value,
    { key: 'ld-kbfaq-breadcrumb', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(breadcrumbLd)) },
    { key: 'ld-kbfaq-faqpage', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(faqLd)) },
  ],
})
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('knowledge.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('knowledge.faqTitle') }}</h1>
      <p class="mt-4 text-muted">{{ $t('knowledge.sub') }}</p>

      <nav class="mt-8 flex flex-wrap gap-2 border-b border-line pb-3">
        <NuxtLink :to="localePath('/knowledge')" class="rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
          {{ $t('knowledge.tabPopular') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/knowledge/requirements')" class="rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
          {{ $t('knowledge.tabRequirements') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/knowledge/guides')" class="rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
          {{ $t('knowledge.tabGuides') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/knowledge/standards')" class="rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
          {{ $t('knowledge.tabStandards') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/knowledge/faq')" class="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">
          {{ $t('knowledge.tabFaq') }}
        </NuxtLink>
      </nav>

      <div v-for="(list, cat) in grouped" :key="cat" class="mt-10">
        <h2 class="text-xl font-semibold">{{ catEmoji(cat) }} {{ catTitle(cat) }}</h2>
        <div class="mt-4 space-y-3">
          <div v-for="it in list" :key="it.i" class="card-pg overflow-hidden">
            <button
              class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              @click="toggle(it.i)"
            >
              <span class="font-medium">{{ it.q }}</span>
              <span class="shrink-0 text-muted">{{ open.has(it.i) ? '−' : '+' }}</span>
            </button>
            <p v-if="open.has(it.i)" class="border-t border-line px-5 py-4 text-sm text-muted">
              {{ it.a }}
            </p>
          </div>
        </div>
      </div>

      <p class="mt-10 text-sm text-muted">
        <NuxtLink :to="localePath('/faq')" class="text-brand underline">{{ $t('knowledge.fullFaq') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>

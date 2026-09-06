<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogCard from '~/components/BlogCard.vue'
import { useData } from '~/composables/useData'

type Kind = 'popular' | 'requirements' | 'guides' | 'standards'

const props = defineProps<{ kind: Kind }>()

const { t } = useI18n()
const localePath = useLocalePath()
const { blogPosts } = useData()
const posts = blogPosts()

// 目标站知识中心三分类 → 本站文章分类的映射
const MAP: Record<Exclude<Kind, 'popular'>, string[]> = {
  requirements: ['Country Spotlight', 'News'],
  guides: ['Guides'],
  standards: ['Tips']
}

const tabs = computed(() => [
  { key: 'popular', label: t('knowledge.tabPopular'), to: '/knowledge' },
  { key: 'requirements', label: t('knowledge.tabRequirements'), to: '/knowledge/requirements' },
  { key: 'guides', label: t('knowledge.tabGuides'), to: '/knowledge/guides' },
  { key: 'standards', label: t('knowledge.tabStandards'), to: '/knowledge/standards' }
])

const list = computed(() => {
  const arr = props.kind === 'popular'
    ? [...posts]
    : posts.filter((p: any) => MAP[props.kind as Exclude<Kind, 'popular'>].includes(p.category))
  return arr.slice().sort((a: any, b: any) => (a.date < b.date ? 1 : -1))
})
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-5xl">
      <span class="eyebrow">{{ $t('knowledge.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('knowledge.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('knowledge.sub') }}</p>

      <nav class="mt-8 flex flex-wrap gap-2 border-b border-line pb-3">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="localePath(tab.to)"
          class="rounded-full px-4 py-2 text-sm font-medium transition"
          :class="tab.key === kind
            ? 'bg-brand text-white'
            : 'text-muted hover:bg-surface-2 hover:text-ink'"
        >
          {{ tab.label }}
        </NuxtLink>
        <NuxtLink
          :to="localePath('/knowledge/faq')"
          class="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          {{ $t('knowledge.tabFaq') }}
        </NuxtLink>
      </nav>

      <div v-if="list.length" class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <BlogCard v-for="p in list" :key="p.slug" :post="p" />
      </div>
      <p v-else class="mt-10 text-muted">{{ $t('knowledge.empty') }}</p>
    </div>
  </div>
</template>

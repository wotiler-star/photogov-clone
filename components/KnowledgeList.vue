<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import knowledge from '~/data/knowledge.json'

type Kind = 'popular' | 'requirements' | 'guides' | 'standards' | 'faq'

const props = defineProps<{ kind: Kind }>()

const { t } = useI18n()
const localePath = useLocalePath()

// 知识库正文数据（抓取自 photogov.net /knowledge/<cat>/<slug>/）
const KN = knowledge as Record<string, any>
const all = computed(() => Object.values(KN))

const list = computed(() => {
  if (props.kind === 'popular') return all.value.slice(0, 12)
  return all.value.filter((e: any) => e.cat === props.kind)
})

const tabs = computed(() => [
  { key: 'popular', label: t('knowledge.tabPopular'), to: '/knowledge' },
  { key: 'requirements', label: t('knowledge.tabRequirements'), to: '/knowledge/requirements' },
  { key: 'guides', label: t('knowledge.tabGuides'), to: '/knowledge/guides' },
  { key: 'standards', label: t('knowledge.tabStandards'), to: '/knowledge/standards' }
])
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
        <NuxtLink
          v-for="e in list"
          :key="e.slug"
          :to="localePath(`/knowledge/${e.cat}/${e.slug}`)"
          class="card-pg block p-5 transition hover:border-brand-blue hover:shadow-sm"
        >
          <span class="text-xs font-semibold uppercase tracking-wide text-brand-blue">{{ e.cat }}</span>
          <h2 class="mt-2 text-base font-semibold leading-snug">{{ e.h1 }}</h2>
          <p class="mt-2 text-sm text-muted">
            {{ String(e.sections.find((s: any) => s.items.length)?.items[0] || '').slice(0, 150) }}
          </p>
        </NuxtLink>
      </div>
      <p v-else class="mt-10 text-muted">{{ $t('knowledge.empty') }}</p>
    </div>
  </div>
</template>

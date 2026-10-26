<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DocCard from '~/components/DocCard.vue'
import { useApi } from '~/composables/useApi'

const { fetchDocuments, fetchCountries } = useApi()
const { t } = useI18n()

// 切换到后端 v1 API
const { data: docsData } = await useAsyncData('docs-passport', () => fetchDocuments({ category: 'passport' }), { default: () => ({ documents: [] as any[] }) })
const { data: countriesData } = await useAsyncData('ctry-passport', () => fetchCountries(), { default: () => ({ countries: [] as any[] }) })

const documents = computed(() => docsData.value?.documents || [])
const countriesByCode = computed(() =>
  Object.fromEntries((countriesData.value?.countries || []).map((c: any) => [c.code, c]))
)

const grouped: Record<string, any[]> = {}
for (const d of documents.value) (grouped[d.country] ||= []).push(d)
const flagFor = (c: string) => countriesByCode.value[c]?.flag || '📄'
const nameFor = (c: string) => countriesByCode.value[c]?.name || c
const countryCount = Object.keys(grouped).length
</script>

<template>
  <div class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-10">
      <span class="eyebrow">{{ $t('nav.passports') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('lists.passportTitle') }}</h1>
      <p class="mt-2 max-w-2xl text-muted">
        {{ $t('lists.passportSub', { count: countryCount }) }}
      </p>

      <div class="mt-8 space-y-8">
        <div v-for="(items, code) in grouped" :key="code">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span class="text-2xl">{{ flagFor(code) }}</span>{{ nameFor(code) }}
          </h2>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DocCard v-for="d in items" :key="d.slug" :doc="d" :flag="flagFor(d.country)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import DocCard from '~/components/DocCard.vue'
import { useData } from '~/composables/useData'

const { documents, countriesByCode, filterByCategory, countryName } = useData()
const { t } = useI18n()
const list = filterByCategory('visa')
const grouped: Record<string, typeof documents> = {}
for (const d of list) (grouped[d.country] ||= []).push(d)
const flagFor = (c: string) => countriesByCode[c]?.flag || '📄'
const nameFor = (c: string) => countryName(c)
</script>

<template>
  <div class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-10">
      <span class="eyebrow">{{ $t('nav.visas') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('lists.visaTitle') }}</h1>
      <p class="mt-2 max-w-2xl text-muted">
        {{ $t('lists.visaSub') }}
      </p>

      <div class="mt-8 space-y-8">
        <div v-for="(items, code) in grouped" :key="code">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span class="text-2xl">{{ flagFor(code) }}</span>{{ nameFor(code) }}
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DocCard v-for="d in items" :key="d.slug" :doc="d" :flag="flagFor(d.country)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

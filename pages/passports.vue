<script setup lang="ts">
import DocCard from '~/components/DocCard.vue'
import { useData } from '~/composables/useData'

const { documents, categories, categoryLabels, countriesByCode, filterByCategory } = useData()
const list = filterByCategory('passport')
const grouped: Record<string, typeof documents> = {}
for (const d of list) (grouped[d.country] ||= []).push(d)
const flagFor = (c: string) => countriesByCode[c]?.flag || '📄'
const nameFor = (c: string) => countriesByCode[c]?.name || c
</script>

<template>
  <div class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-10">
      <span class="eyebrow">Passports</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Passport photo requirements</h1>
      <p class="mt-2 max-w-2xl text-muted">
        Compliant passport photo sizes for {{ Object.keys(grouped).length }} countries. Select yours and make a photo in seconds.
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

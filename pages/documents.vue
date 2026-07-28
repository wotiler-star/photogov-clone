<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DocCard from '~/components/DocCard.vue'
import { useData } from '~/composables/useData'
import { useCountry } from '~/composables/useCountry'

const route = useRoute()
const router = useRouter()
const { documents, categories, categoryLabels, countriesByCode, searchDocuments, filterByCategory, groupedByCountry } = useData()
const { setCode } = useCountry()

const query = ref((route.query.q as string) || '')
const category = ref((route.query.category as string) || 'all')
const country = ref((route.query.country as string) || '')

watch(
  () => route.query,
  (q) => {
    query.value = (q.q as string) || ''
    category.value = (q.category as string) || 'all'
    country.value = (q.country as string) || ''
  }
)

const results = computed(() => {
  let list = searchDocuments(query.value)
  if (category.value && category.value !== 'all') {
    list = list.filter((d) => d.category === category.value)
  }
  if (country.value) list = list.filter((d) => d.country === country.value)
  return list
})

const grouped = computed(() => {
  const map: Record<string, typeof documents> = {}
  for (const d of results.value) {
    ;(map[d.country] ||= []).push(d)
  }
  return map
})

const flagFor = (code: string) => countriesByCode[code]?.flag || '📄'
const nameFor = (code: string) => countriesByCode[code]?.name || code

function onCountryChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  country.value = v
  if (v) setCode(v)
  updateRoute()
}
function updateRoute() {
  router.replace({
    query: {
      ...(query.value ? { q: query.value } : {}),
      ...(category.value !== 'all' ? { category: category.value } : {}),
      ...(country.value ? { country: country.value } : {})
    }
  })
}
watch([query, category], updateRoute)
</script>

<template>
  <div class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-10">
      <span class="eyebrow">Documents</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Photo document requirements</h1>
      <p class="mt-2 max-w-2xl text-muted">
        Find the exact photo size, background and format for any passport, visa or ID document.
      </p>

      <!-- 过滤栏 -->
      <div class="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input
            v-model="query"
            type="text"
            placeholder="Search documents or countries…"
            class="w-full rounded-full border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <select v-model="category" class="rounded-full border border-slate-300 px-4 py-2.5 text-sm">
          <option value="all">All categories</option>
          <option v-for="c in categories" :key="c" :value="c">{{ categoryLabels[c] || c }}</option>
        </select>
        <select :value="country" @change="onCountryChange" class="rounded-full border border-slate-300 px-4 py-2.5 text-sm">
          <option value="">All countries</option>
          <option v-for="(name, code) in countriesByCode" :key="code" :value="code">{{ name.flag }} {{ name.name }}</option>
        </select>
      </div>

      <p class="mt-4 text-sm text-muted">{{ results.length }} documents found</p>

      <!-- 列表 -->
      <div v-if="results.length" class="mt-4 space-y-8">
        <div v-for="(list, code) in grouped" :key="code">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span class="text-2xl">{{ flagFor(code) }}</span>{{ nameFor(code) }}
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DocCard v-for="d in list" :key="d.slug" :doc="d" :flag="flagFor(d.country)" />
          </div>
        </div>
      </div>
      <div v-else class="mt-10 text-center text-muted">No documents match your search.</div>
    </div>
  </div>
</template>

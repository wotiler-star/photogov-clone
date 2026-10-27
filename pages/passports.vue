<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DocCard from '~/components/DocCard.vue'
import { useApi } from '~/composables/useApi'
import { useCountry } from '~/composables/useCountry'
import { useI18n } from 'vue-i18n'
import { useOrgLd } from '~/composables/useOrgLd'
import { useRequestURL } from '#imports'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { fetchDocuments, fetchCountries } = useApi()
const { setCode } = useCountry()

// Passports hub：对标 /documents/ 的颗粒度，按 passport 类筛选
const CATEGORY = 'passport'

const { data: docsData } = await useAsyncData('docs-passport', () => fetchDocuments({ category: CATEGORY }), { default: () => ({ documents: [], total: 0 }) })
const { data: countriesData } = await useAsyncData('ctry-passport', () => fetchCountries(), { default: () => ({ countries: [], total: 0 }) })

const documents = computed(() => docsData.value?.documents || [])
const countriesByCode = computed(() =>
  Object.fromEntries((countriesData.value?.countries || []).map((c: any) => [c.code, c]))
)
const countryName = (code: string) => countriesByCode.value[code]?.name || code
const nameFor = (code: string) => countryName(code)
// 副标题的 count 指国家数（非文档数）
const countryCount = computed(() => new Set(documents.value.map((d: any) => d.country)).size)

const query = ref((route.query.q as string) || '')
const country = ref((route.query.country as string) || '')
const verifiedOnly = ref(false)

watch(
  () => route.query,
  (q) => {
    query.value = (q.q as string) || ''
    country.value = (q.country as string) || ''
  }
)

const results = computed(() => {
  let list = documents.value
  if (query.value) {
    const t = query.value.toLowerCase()
    list = list.filter(
      (d: any) =>
        d.name.toLowerCase().includes(t) ||
        d.countryName.toLowerCase().includes(t) ||
        d.slug.toLowerCase().includes(t)
    )
  }
  if (country.value) list = list.filter((d: any) => d.country === country.value)
  if (verifiedOnly.value) list = list.filter((d: any) => d.verified)
  return list
})

const grouped = computed(() => {
  const map: Record<string, any[]> = {}
  for (const d of results.value) (map[d.country] ||= []).push(d)
  // 按国家名称字母序排列分组（与 /documents/ 一致）
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => countryName(a[0]).localeCompare(countryName(b[0])))
  )
})

// CDN SVG 国旗（与首页 / /documents 一致），无资源时回退到 emoji 国旗
const CDN = 'https://photogov-com.fra1.cdn.digitaloceanspaces.com'
const flagImg = (code: string) => `${CDN}/frontend/img/svg/flags/4x3/${code.toLowerCase()}.svg`
const flagFor = (code: string) => countriesByCode.value[code]?.flag || '📄'

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
      ...(country.value ? { country: country.value } : {})
    }
  })
}
watch([query, country], updateRoute)

// ── SEO meta 四语化 ──
// 此前该 hub 页未自定义 title，套用了 nuxt.config 的英文默认 title（zh/es/fr 也显示英文）。
const { t } = useI18n()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()
useHead(() => ({
  title: t('lists.passportTitle'),
  meta: [{ name: 'description', content: t('lists.passportSub', { count: countryCount.value }) }],
  link: [{ rel: 'canonical', href: url.origin + localePath('/passports') }],
  script: [
    ...orgScripts.value,
    {
      key: 'ld-passports-bc',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('lists.passportTitle') }
        ]
      }).replace(/</g, '\\u003c')
    }
  ]
}))
</script>

<template>
  <div class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-10">
      <span class="eyebrow">{{ $t('nav.passports') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('lists.passportTitle') }}</h1>
      <p class="mt-2 max-w-2xl text-muted">
        {{ $t('lists.passportSub', { count: countryCount }) }}
      </p>

      <!-- 过滤栏（与 /documents/ 同款：搜索 + 国家 + 仅已核验） -->
      <div class="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input
            v-model="query"
            type="text"
            :placeholder="$t('documents.searchPlaceholder')"
            class="w-full rounded-full border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <select :value="country" @change="onCountryChange" class="rounded-full border border-slate-300 px-4 py-2.5 text-sm">
          <option value="">{{ $t('documents.countryAll') }}</option>
          <option v-for="(c, code) in countriesByCode" :key="code" :value="code">{{ c.flag }} {{ countryName(code) }}</option>
        </select>
        <button
          type="button"
          @click="verifiedOnly = !verifiedOnly"
          :class="verifiedOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-muted border-slate-300'"
          class="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
          {{ $t('documents.verifiedOnly') }}
        </button>
      </div>

      <p class="mt-4 text-sm text-muted">{{ $t('documents.found', { count: results.length }) }}</p>

      <!-- 列表：按国家字母序分组（对标原站：国旗 + 国名 + N doc. + 详细文档网格） -->
      <div v-if="results.length" class="mt-4 space-y-8">
        <div v-for="(list, code) in grouped" :key="code">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-semibold">
            <img
              :src="flagImg(code)"
              :alt="nameFor(code)"
              width="28"
              height="21"
              class="h-[21px] w-7 shrink-0 rounded-sm border border-slate-200 object-cover"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <NuxtLink :to="localePath(`/documents/${String(code).toLowerCase()}`)" class="hover:text-brand-blue hover:underline">
              {{ nameFor(code) }}
            </NuxtLink>
            <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-muted">{{
              $t('documents.docCount', { count: list.length })
            }}</span>
          </h2>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DocCard v-for="d in list" :key="d.slug" :doc="d" :flag="flagFor(d.country)" detailed />
          </div>
        </div>
      </div>
      <div v-else class="mt-10 text-center text-muted">{{ $t('documents.empty') }}</div>
    </div>
  </div>
</template>

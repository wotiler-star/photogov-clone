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
const { fetchDocuments, fetchCategories, fetchCountries } = useApi()
const { setCode } = useCountry()

// 切换到后端 v1 API（SSR 预取，客户端响应式筛选）
const { data: docsData } = await useAsyncData('docs-all', () => fetchDocuments(), { default: () => ({ documents: [], total: 0 }) })
const { data: catData } = await useAsyncData('cats', () => fetchCategories(), { default: () => ({ categories: [] }) })
const { data: countriesData } = await useAsyncData('ctry', () => fetchCountries(), { default: () => ({ countries: [], total: 0 }) })

const documents = computed(() => docsData.value?.documents || [])
const categories = computed(() => (catData.value?.categories || []).map((c: any) => c.id))
const countriesByCode = computed(() =>
  Object.fromEntries((countriesData.value?.countries || []).map((c: any) => [c.code, c]))
)
const categoryLabels: Record<string, string> = {
  passport: 'Passport', visa: 'Visa', id: 'ID Card', driving: 'Driving License', other: 'Other'
}
const countryName = (code: string) => countriesByCode.value[code]?.name || code

const query = ref((route.query.q as string) || '')
const category = ref((route.query.category as string) || 'all')
const country = ref((route.query.country as string) || '')
const verifiedOnly = ref(false)

watch(
  () => route.query,
  (q) => {
    query.value = (q.q as string) || ''
    category.value = (q.category as string) || 'all'
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
  if (category.value && category.value !== 'all') {
    list = list.filter((d: any) => d.category === category.value)
  }
  if (country.value) list = list.filter((d: any) => d.country === country.value)
  if (verifiedOnly.value) list = list.filter((d: any) => d.verified)
  return list
})

const grouped = computed(() => {
  const map: Record<string, any[]> = {}
  for (const d of results.value) {
    ;(map[d.country] ||= []).push(d)
  }
  // 对标原站 /documents/：按国家名称字母序排列分组
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => nameFor(a[0]).localeCompare(nameFor(b[0])))
  )
})

// CDN SVG 国旗（与首页一致），无资源时回退到 emoji 国旗
const CDN = 'https://photogov-com.fra1.cdn.digitaloceanspaces.com'
const flagImg = (code: string) => `${CDN}/frontend/img/svg/flags/4x3/${code.toLowerCase()}.svg`
const flagFor = (code: string) => countriesByCode.value[code]?.flag || '📄'
const nameFor = (code: string) => countryName(code)

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

// ── SEO meta 四语化 ──
// 此前该 hub 页未自定义 title，套用了 nuxt.config 的英文默认 title（zh/es/fr 也显示英文）。
// 改用已有四语键，canonical 用 localePath 生成（不含筛选 query）。
const { t } = useI18n()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()
// 「其它格式」示例（对标原站 Other Passport and Visa Photo Formats 区块）：
// 从本站真实文档数据里每个国家取一条，尺寸取毫米/英寸规格，内容随数据自动更新
const otherFormats = computed(() => {
  const seen = new Set<string>()
  const out: { slug: string; name: string; size: string }[] = []
  for (const d of documents.value as any[]) {
    const code = d.country
    if (!code || seen.has(code)) continue
    const size = d.size?.mm ? `${d.size.mm} mm` : d.size?.inch ? `${d.size.inch} in` : ''
    if (!size) continue
    seen.add(code)
    out.push({ slug: d.slug, name: d.name, size })
    if (out.length >= 12) break
  }
  return out
})

useHead(() => ({
  title: t('documents.title'),
  meta: [
    { name: 'description', content: t('documents.sub') },
    { property: 'og:title', content: t('documents.title') },
    { property: 'og:description', content: t('documents.sub') }
  ],
  link: [{ rel: 'canonical', href: url.origin + localePath('/documents') }],
  script: [
    ...orgScripts.value,
    {
      key: 'ld-documents-bc',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('documents.title') }
        ]
      }).replace(/</g, '\\u003c')
    }
  ]
}))
</script>

<template>
  <div class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-10">
      <span class="eyebrow">{{ $t('documents.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('documents.title') }}</h1>
      <p class="mt-2 max-w-2xl text-muted">
        {{ $t('documents.sub') }}
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
            :placeholder="$t('documents.searchPlaceholder')"
            class="w-full rounded-full border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <select v-model="category" class="rounded-full border border-slate-300 px-4 py-2.5 text-sm">
          <option value="all">{{ $t('documents.catAll') }}</option>
          <option v-for="c in categories" :key="c" :value="c">{{ categoryLabels[c] || c }}</option>
        </select>
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

      <!-- 列表：按国家字母序分组（对标原站：国旗 + 国名 + N doc. + 文档网格） -->
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
            <DocCard v-for="d in list" :key="d.slug" :doc="d" :flag="flagFor(d.country)" />
          </div>
        </div>
      </div>
      <div v-else class="mt-10 text-center text-muted">{{ $t('documents.empty') }}</div>

      <!-- 内容区块（对标原站 /documents/ 列表后的 5 个 H2 区块，此前复刻站全部缺失） -->
      <section class="mt-14 space-y-10">
        <div>
          <h2 class="text-2xl font-bold">{{ $t('documents.aiTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('documents.aiP1') }}</p>
          <p class="mt-2 text-muted">{{ $t('documents.aiP2') }}</p>
        </div>

        <div>
          <h2 class="text-2xl font-bold">{{ $t('documents.embassyTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('documents.embassyP1') }}</p>
          <p class="mt-2 text-muted">{{ $t('documents.embassyP2') }}</p>
        </div>

        <div>
          <h2 class="text-2xl font-bold">{{ $t('documents.testimonialsTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('documents.testimonialsP1') }}</p>
          <NuxtLink :to="localePath('/reviews')" class="mt-3 inline-block font-semibold text-brand-blue hover:underline">
            {{ $t('documents.testimonialsCta') }}
          </NuxtLink>
        </div>

        <div>
          <h2 class="text-2xl font-bold">{{ $t('documents.otherFormatsTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('documents.otherFormatsIntro') }}</p>
          <ul class="mt-4 space-y-2">
            <li v-for="f in otherFormats" :key="f.slug" class="text-muted">
              <NuxtLink :to="localePath(`/documents/${f.slug}`)" class="text-brand-blue hover:underline">
                {{ $t('documents.otherFormatsItem', { name: f.name, size: f.size }) }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-2xl font-bold">{{ $t('documents.conclusionTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('documents.conclusionP1') }}</p>
          <NuxtLink :to="localePath('/faq')" class="mt-3 inline-block font-semibold text-brand-blue hover:underline">
            {{ $t('documents.conclusionCta') }}
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

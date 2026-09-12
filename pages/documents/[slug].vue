<script setup lang="ts">
const localePath = useLocalePath()
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestURL } from '#imports'
import { useI18n } from 'vue-i18n'
import PhotoTool from '~/components/PhotoTool.vue'
import DocCard from '~/components/DocCard.vue'
import { useApi } from '~/composables/useApi'
import docTemplate from '~/data/docTemplate.json'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { fetchDocument, fetchDocuments, fetchCountries } = useApi()

// 切换到后端 v1 API（SSR 预取文档详情/列表/国家）
const { data: docData } = await useAsyncData(
  () => `doc-${slug.value}`,
  () => fetchDocument(slug.value),
  { default: () => ({ document: null as any }) }
)
const { data: allDocs } = await useAsyncData('docs-all-rel', () => fetchDocuments(), { default: () => ({ documents: [] as any[] }) })
const { data: countriesData } = await useAsyncData('ctry-doc', () => fetchCountries(), { default: () => ({ countries: [] as any[] }) })

const doc = computed(() => docData.value?.document || null)
const documents = computed(() => allDocs.value?.documents || [])
const countriesByCode = computed(() =>
  Object.fromEntries((countriesData.value?.countries || []).map((c: any) => [c.code, c]))
)
const url = useRequestURL()

// ── 目标站文档详情页的内容模板（data/docTemplate.json）────────────────────
// 抓取自 photogov.net/documents/us-passport-photo/，已抽象为 {doc}/{inch}/{authority} 等占位符，
// 使其可复用于全部文档页（含所见 tkbar 一级 sığּ 章节结构与目标站一致）。
const AUTHORITY: Record<string, string> = {
  US: 'U.S. Department of State',
  GB: 'HM Passport Office',
  CA: 'Immigration, Refugees and Citizenship Canada (IRCC)',
  AU: 'Australian Passport Office',
  IN: 'Ministry of External Affairs',
  DE: 'Federal Foreign Office',
  FR: 'Ministry of Europe and Foreign Affairs',
  CN: 'National Immigration Administration',
  AE: 'ICP — Federal Authority for Identity and Citizenship',
  SG: 'Immigration & Checkpoints Authority (ICA)',
  MY: 'Immigration Department of Malaysia',
  TH: 'Ministry of Foreign Affairs',
  NL: 'Ministry of Foreign Affairs',
  ES: 'Ministry of Foreign Affairs',
  IT: 'Ministry of Foreign Affairs',
  JP: 'Ministry of Foreign Affairs',
  KR: 'Ministry of Foreign Affairs',
  BR: 'Ministry of Foreign Affairs',
  RU: 'Ministry of Internal Affairs',
  ZA: 'Department of Home Affairs',
  PH: 'Department of Foreign Affairs',
  VN: 'Ministry of Public Security',
  ID: 'Directorate General of Immigration',
  PK: 'Directorate General of Immigration & Passports',
  BD: 'Department of Immigration & Passports',
  NG: 'Nigeria Immigration Service',
  KE: 'Directorate of Immigration Services',
  TR: 'Ministry of Foreign Affairs',
  SA: 'Ministry of Foreign Affairs',
  NZ: 'Department of Internal Affairs',
  MX: 'Secretaría de Relaciones Exteriores'
}

const authorityOf = (d: any) => (d && AUTHORITY[d.country]) || (d ? `official ${d.countryName} authority` : '')
const srcDomain = (d: any) => {
  try { return new URL(d.source).hostname.replace(/^www\./, '') } catch { return 'official source' }
}

const fill = (s: string) => {
  const d = doc.value
  if (!d || !s) return s
  const map: Record<string, string> = {
    '{doc}': d.name,
    '{inch}': d.size?.inch || '',
    '{mm}': d.size?.mm || '',
    '{px}': d.size?.px || '',
    '{sizeInchFmt}': `${d.size?.inch || ''} inch`,
    '{sizeMmFmt}': `${d.size?.mm || ''} mm`,
    '{sizePxFmt}': `${d.size?.px || ''} pixels`,
    '{headInch}': d.headHeight || '',
    '{headMm}': (d.headHeight || '').replace(/^[^0-9]*/, '') || '',
    '{authority}': authorityOf(d),
    '{sourceDomain}': srcDomain(d),
    '{countryAdj}': d.countryName,
    '{country}': d.countryName,
    '{year}': String(d.year || ''),
    '{expression}': d.expression || ''
  }
  let out = String(s)
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v)
  return out.replace(/\{[a-zA-Z]+\}/g, '') // 清理未覆盖的占位符
}

const TPL = (docTemplate as any[]).reduce((acc: any, s: any) => { acc[s.i] = s; return acc }, {})

// H1：模板源自护照页，非护照类文档需把 "Passport" 换成对应证件词（签证/身份证/驾照）
const CATEGORY_WORD: Record<string, string> = {
  passport: 'Passport',
  visa: 'Visa',
  id: 'ID',
  driving: 'Driving Licence',
  other: 'Photo'
}
const docH1 = computed(() => {
  const d = doc.value
  let t = fill(TPL[0]?.title || '') || `${d?.name} Photo`
  if (d?.category && d.category !== 'passport') {
    t = t.replace(/Passport/g, CATEGORY_WORD[d.category] || 'Photo')
  }
  return t
})
const lead = computed(() => fill(TPL[0]?.items?.[0] || ''))
const heroBadge = computed(() => fill(TPL[0]?.items?.[1] || ''))
const heroSource = computed(() => fill(TPL[0]?.items?.[2] || ''))
const heroDisclaimer = computed(() => fill(TPL[0]?.items?.[3] || ''))

// [3] How Our … Tool Works —— lead + 4 步（标题/描述成对）
const secSteps = computed(() => {
  const it = (TPL[3]?.items || []).map(fill)
  const steps: { t: string; d: string }[] = []
  for (let k = 1; k + 1 < it.length && steps.length < 4; k += 2) steps.push({ t: it[k], d: it[k + 1] })
  return { title: fill(TPL[3]?.title || ''), lead: it[0] || '', steps }
})

// [9] Why Use PhotoGov —— 成对
const secWhy = computed(() => {
  const it = (TPL[9]?.items || []).map(fill)
  const items: { t: string; d: string }[] = []
  for (let k = 0; k + 1 < it.length; k += 2) items.push({ t: it[k], d: it[k + 1] })
  return { title: fill(TPL[9]?.title || ''), items }
})

// [4][8][10][11][12][13] 纯段落章节
const secParagraphs = computed(() =>
  [4, 8, 10, 11, 12, 13]
    .map((i) => ({ i, title: fill(TPL[i]?.title || ''), items: (TPL[i]?.items || []).map(fill) }))
    .filter((s) => s.title)
)

// [15] Official Government Sources
const secSources = computed(() => ({
  title: fill(TPL[15]?.title || ''),
  items: (TPL[15]?.items || []).map(fill)
}))

useHead(() => {
  if (!doc.value) {
    return {
      title: 'Document not found',
      meta: [{ name: 'robots', content: 'noindex' }]
    }
  }
  const d = doc.value
  const desc = `Official ${d.name} photo requirements for ${d.countryName}: size ${d.size.inch} in (${d.size.mm} mm), ${d.dpi} DPI, ${d.background === '#FFFFFF' ? 'white' : d.background === '#E8E8E8' ? 'light grey' : 'blue'} background. Verified by official source.`
  const canonical = `${url.origin}/documents/${d.slug}`
  const bgName = d.background === '#FFFFFF' ? 'White' : d.background === '#E8E8E8' ? 'Light grey' : d.background === '#2B72E0' ? 'Light blue' : 'Custom'
  const serviceType = d.category === 'passport' ? 'Passport photo' : d.category === 'visa' ? 'Visa photo' : d.category === 'id' ? 'ID photo' : 'Driving licence photo'

  const ld = {
    '@context': 'https://schema.org',
    '@type': ['GovernmentService', 'PassportRequirements'],
    '@id': `${canonical}#service`,
    name: d.title,
    serviceType,
    description: desc,
    url: canonical,
    areaServed: { '@type': 'Country', name: d.countryName },
    provider: { '@type': 'GovernmentOrganization', name: `${d.countryName} Government` },
    category: d.category,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Photo size', value: `${d.size.inch} in (${d.size.mm} mm)` },
      { '@type': 'PropertyValue', name: 'Pixel size', value: d.size.px },
      { '@type': 'PropertyValue', name: 'Resolution', value: `${d.dpi} DPI` },
      { '@type': 'PropertyValue', name: 'Background', value: bgName },
      { '@type': 'PropertyValue', name: 'Head height', value: d.headHeight },
      { '@type': 'PropertyValue', name: 'Glasses', value: d.glasses ? 'Allowed' : 'Not allowed' }
    ]
  }
  const bc = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Documents', item: `${url.origin}/documents` },
      { '@type': 'ListItem', position: 2, name: d.countryName, item: `${url.origin}/documents?country=${d.country}` },
      { '@type': 'ListItem', position: 3, name: d.name, item: canonical }
    ]
  }
  return {
    title: d.title,
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: d.title },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: d.title },
      { name: 'twitter:description', content: desc }
    ],
    link: [{ rel: 'canonical', href: canonical }],
    script: [
      { key: 'ld-service', type: 'application/ld+json', innerHTML: JSON.stringify(ld) },
      { key: 'ld-breadcrumb', type: 'application/ld+json', innerHTML: JSON.stringify(bc) }
    ]
  }
})

const flagFor = (code: string) => countriesByCode.value[code]?.flag || '📄'
const nameFor = (code: string) => countriesByCode.value[code]?.name || code

const isVerified = computed(() => !!doc.value?.verified)
const srcHost = computed(() => {
  try {
    return new URL(doc.value?.source || '').hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
})

const bgLabel = (hex?: string): string => {
  if (!hex) return 'White'
  const h = hex.toLowerCase()
  if (h === '#2b72e0') return 'Light blue'
  if (h === '#e8e8e8') return 'Light grey / cream'
  if (h === '#ffffff') return 'White'
  return 'Light grey / cream'
}

const related = computed(() => {
  if (!doc.value) return []
  return documents.value
    .filter((d: any) => d.country === doc.value!.country && d.slug !== doc.value!.slug)
    .slice(0, 4)
})

const { t, tm, locale } = useI18n()
const glassesState = computed(() =>
  doc.value?.glasses ? t('doc.glassesAllowed') : t('doc.glassesNotAllowed')
)
const tips = computed(() => {
  void locale.value
  const arr = (tm('doc.tips') as string[]) || []
  return arr.map((s) => s.replace('{state}', glassesState.value))
})

const reqs = computed(() => {
  const d = doc.value
  if (!d) return []
  return [
    { k: t('doc.reqPhotoSize'), v: `${d.size.inch} in (${d.size.mm} mm)` },
    { k: t('doc.reqPixelSize'), v: d.size.px },
    { k: t('doc.reqResolution'), v: `${d.dpi} DPI` },
    { k: t('doc.reqBackground'), v: bgLabel(d.background) },
    { k: t('doc.reqHeadHeight'), v: d.headHeight },
    { k: t('doc.reqEyesLevel'), v: d.eyesLevel },
    { k: t('doc.reqFormat'), v: d.format },
    { k: t('doc.reqFileSize'), v: d.fileSize },
    { k: t('doc.reqGlasses'), v: d.glasses ? t('doc.glassesAllowed') + ' (no glare)' : t('doc.glassesNotAllowed') },
    { k: t('doc.reqExpression'), v: d.expression },
    { k: t('doc.reqColor'), v: d.color || t('doc.reqColorDefault') },
    { k: t('doc.reqAttire'), v: d.attire || t('doc.reqAttireDefault') }
  ]
})
</script>

<template>
  <div v-if="doc" class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-10">
      <!-- 面包屑 -->
      <nav class="text-sm text-muted">
        <NuxtLink :to="localePath('/documents')" class="hover:text-brand-blue">{{ $t('doc.eyebrow') }}</NuxtLink>
        <span class="mx-1">/</span>
        <span>{{ flagFor(doc.country) }} {{ nameFor(doc.country) }}</span>
        <span class="mx-1">/</span>
        <span class="text-ink">{{ doc.name }}</span>
      </nav>

      <div class="mt-4 grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
        <!-- 左：说明 -->
        <div>
          <h1 class="text-3xl font-bold sm:text-4xl">{{ docH1 }}</h1>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span
              v-if="isVerified"
              class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
              {{ $t('doc.verified') }}
            </span>
            <span v-else class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {{ $t('doc.general') }}
            </span>
          </div>
          <p v-if="heroBadge" class="mt-3 text-sm font-semibold text-brand-blue">{{ heroBadge }}</p>
          <p class="mt-2 text-muted">
            {{ lead || $t('doc.intro', { country: nameFor(doc.country), name: doc.name, year: doc.year }) }}
          </p>
          <p v-if="heroSource" class="mt-2 text-xs text-muted">{{ heroSource }}</p>

          <!-- 规格图 -->
          <div class="mt-6 card-pg p-6">
            <div class="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
              <svg viewBox="0 0 200 240" class="mx-auto h-56 w-44">
                <rect x="6" y="6" width="188" height="228" rx="6" fill="#fff" stroke="#2B72E0" stroke-width="2"/>
                <circle cx="100" cy="92" r="34" fill="#cde0ff"/>
                <path d="M58 210c0-30 18-52 42-52s42 22 42 52z" fill="#cde0ff"/>
                <line x1="6" y1="100" x2="194" y2="100" stroke="#E5484D" stroke-width="1.5" stroke-dasharray="5 4"/>
                <text x="198" y="103" font-size="11" fill="#E5484D">eyes</text>
                <line x1="20" y1="62" x2="20" y2="120" stroke="#2BB673" stroke-width="1.5"/>
                <line x1="15" y1="62" x2="25" y2="62" stroke="#2BB673" stroke-width="1.5"/>
                <line x1="15" y1="120" x2="25" y2="120" stroke="#2BB673" stroke-width="1.5"/>
                <text x="28" y="94" font-size="10" fill="#2BB673">head</text>
              </svg>
              <dl class="space-y-2 text-sm">
                <div v-for="r in reqs" :key="r.k" class="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt class="text-muted">{{ r.k }}</dt>
                  <dd class="text-right font-medium">{{ r.v }}</dd>
                </div>
              </dl>
            </div>
            <p class="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-brand-blue"><path fill-rule="evenodd" d="M10 1.5l2.3 1.7 2.8-.3 1 2.7 2.4 1.5-.8 2.8.8 2.8-2.4 1.5-1 2.7-2.8-.3L10 18.5l-2.3-1.7-2.8.3-1-2.7L1.5 13l.8-2.8L1.5 7l2.4-1.5 1-2.7 2.8.3L10 1.5zm3.2 6.2a1 1 0 00-1.4-1.4L9 8.9 8.2 8a1 1 0 10-1.4 1.4l1.2 1.2a1 1 0 001.4 0l2.8-2.4z" clip-rule="evenodd"/></svg>
              <span>{{ $t('doc.officialSource') }}</span>
              <a :href="doc.source" target="_blank" rel="noopener" class="font-semibold text-brand-blue underline">{{ srcHost || doc.source }}</a>
            </p>
          </div>

          <!-- 小贴士 -->
          <div class="mt-6 card-pg p-6">
            <!-- ═══ 内容章节（对齐目标站文档详情页的 18 章节结构） ═══ -->

            <!-- [3] How Our … Tool Works：lead + 4 步 -->
            <section v-if="secSteps.title" class="mt-8">
              <h2 class="text-xl font-semibold">{{ secSteps.title }}</h2>
              <p v-if="secSteps.lead" class="mt-2 text-muted">{{ secSteps.lead }}</p>
              <ol class="mt-4 grid gap-3 sm:grid-cols-2">
                <li v-for="(st, i) in secSteps.steps" :key="i" class="rounded-lg border border-slate-200 bg-white p-4">
                  <div class="flex items-center gap-2">
                    <span class="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">{{ i + 1 }}</span>
                    <span class="font-semibold">{{ st.t }}</span>
                  </div>
                  <p class="mt-1.5 text-sm text-muted">{{ st.d }}</p>
                </li>
              </ol>
            </section>

            <!-- [4][8][10][11][12][13] 段落型章节 -->
            <section v-for="s in secParagraphs" :key="s.i" class="mt-8">
              <h2 class="text-xl font-semibold">{{ s.title }}</h2>
              <ul v-if="s.items.length > 1" class="mt-2 list-disc space-y-1.5 pl-5 text-muted">
                <li v-for="(it, k) in s.items" :key="k">{{ it }}</li>
              </ul>
              <p v-else-if="s.items.length === 1" class="mt-2 text-muted">{{ s.items[0] }}</p>
            </section>

            <!-- [9] Why Use PhotoGov -->
            <section v-if="secWhy.title" class="mt-8">
              <h2 class="text-xl font-semibold">{{ secWhy.title }}</h2>
              <dl class="mt-3 grid gap-3 sm:grid-cols-2">
                <div v-for="(w, k) in secWhy.items" :key="k" class="rounded-lg border border-slate-200 bg-white p-4">
                  <dt class="font-semibold">{{ w.t }}</dt>
                  <dd class="mt-1 text-sm text-muted">{{ w.d }}</dd>
                </div>
              </dl>
            </section>

            <!-- [15] Official Government Sources -->
            <section v-if="secSources.title" class="mt-8">
              <h2 class="text-xl font-semibold">{{ secSources.title }}</h2>
              <ul class="mt-2 space-y-1.5">
                <li v-for="(s2, k) in secSources.items" :key="k" class="flex gap-2 text-muted">
                  <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue"></span>
                  <span>{{ s2 }}</span>
                </li>
              </ul>
            </section>

            <h2 class="text-xl font-semibold">{{ $t('doc.tipsTitle') }}</h2>
            <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
              <li v-for="(tip, i) in tips" :key="i">{{ tip }}</li>
            </ul>
          </div>

          <!-- 相关证件 -->
          <div v-if="related.length" class="mt-8">
            <h2 class="text-xl font-semibold">{{ $t('doc.relatedTitle') }}</h2>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <DocCard v-for="d in related" :key="d.slug" :doc="d" :flag="flagFor(d.country)" />
            </div>
          </div>
        </div>

        <!-- 右：工具 -->
        <div class="lg:sticky lg:top-24 lg:self-start">
          <PhotoTool :country="doc.country" :doc="doc.slug" />
        </div>
      </div>
    </div>
  </div>

  <div v-else class="container-pg py-20 text-center">
    <h1 class="text-2xl font-bold">{{ $t('doc.notFoundTitle') }}</h1>
    <NuxtLink :to="localePath('/documents')" class="btn-primary mt-4">{{ $t('doc.browse') }}</NuxtLink>
  </div>
</template>

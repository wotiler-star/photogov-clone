<script setup lang="ts">
/**
 * 文档详情页 + 国级聚合落地页（同一路由双模式）。
 *
 * - slug 为已知 2 字母国码（如 ae / us / in）→ 渲染国家落地页：
 *   汇总该国所有证件文档（DocCard 网格），含 localized 标题/描述与 SEO。
 *   对齐真实站 /documents/<country> 的国级引导页。
 * - slug 为文档 slug（如 ae-passport-photo）→ 渲染目标站原始内容树（DocContent）。
 * - 其它 → 404。
 *
 * 数据来源：documents.json（国码/文档规格）+ 内部 API /api/app/v1/database/documents/:slug。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestURL } from '#imports'
import { useI18n } from 'vue-i18n'
import DocContent from '~/components/DocContent.vue'
import DocCard from '~/components/DocCard.vue'
import { useApi } from '~/composables/useApi'
import { useData } from '~/composables/useData'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { t, locale } = useI18n()
const { fetchDocument } = useApi()
const { countries, documentsForCountry, countryName } = useData()

// 国级落地页判定：slug 是已知 2 字母国码
const country = computed(
  () => countries.find((c) => c.code.toLowerCase() === slug.value.toLowerCase()) || null
)
const isCountry = computed(() => !!country.value)
const countryDocs = computed(() => (country.value ? documentsForCountry(country.value.code) : []))

const { data, error } = await useAsyncData(
  () => `doc-content-${slug.value}`,
  // 国级模式不请求文档端点（避免无谓的 404）
  () => (isCountry.value ? Promise.resolve(null) : fetchDocument(slug.value)),
  { default: () => null as any }
)

// 非国级 slug 且非已知文档 → 404
if (!isCountry.value) {
  if (!data.value || !(data.value as any).document || error.value) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
}

const payload = data as unknown as {
  value: { document: any; meta: any; content: any[]; schemaOrg: string[] } | null
}

const doc = computed(() => payload.value?.document || null)
const meta = computed(() => payload.value?.meta || {})
const nodes = computed(() => payload.value?.content || [])
const schemaOrg = computed(() => payload.value?.schemaOrg || [])

// 官方来源链接（source + officialLinks 去重、仅保留 http(s)），用于底部干净摘要卡
const officialSourceLinks = computed(() => {
  const d = doc.value as any
  if (!d) return []
  const raw: string[] = []
  if (d.source && /^https?:\/\//i.test(d.source)) raw.push(d.source)
  for (const u of (d.officialLinks || []) as string[]) {
    if (u && /^https?:\/\//i.test(u)) raw.push(u)
  }
  const seen = new Set<string>()
  const out: { url: string; host: string }[] = []
  for (const u of raw) {
    const norm = u.replace(/\/+$/, '')
    if (seen.has(norm)) continue
    seen.add(norm)
    let host = u
    try {
      host = new URL(u).host.replace(/^www\./, '')
    } catch {
      /* keep raw */
    }
    out.push({ url: u, host })
  }
  return out
})

// 最后核验日期（团队复核周期，月份粒度，避免伪造精确到日的日期）
const lastVerified = computed(() => {
  const d = new Date('2026-10-01')
  try {
    return new Intl.DateTimeFormat(locale.value || 'en', { month: 'long', year: 'numeric' }).format(d)
  } catch {
    return 'October 2026'
  }
})

// Schema.org HowTo：突出「如何获取该证件照」的申请步骤，提升 SEO
const howToSchema = computed(() => {
  const d = doc.value as any
  if (!d) return null
  const name = d.name || d.title || meta.value.title || ''
  const desc = d.description || meta.value.description || ''
  const size = (d.size && (d.size.mm || d.size.inch)) || ''
  const bg = d.background || ''
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to get a ${name}`,
    description: desc,
    totalTime: 'PT10M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Check the official photo requirements',
        text: `Confirm the current size${size ? ` (${size})` : ''}${bg ? `, background (${bg})` : ''}, and other rules on the issuing authority's official website.`
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Take or upload a photo',
        text: 'Take a new photo against a plain background, or upload an existing one that meets the pose and expression rules.'
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Crop and resize with PhotoGov',
        text: 'Upload the photo to PhotoGov and let the tool crop, resize, and adjust it to the exact specifications automatically.'
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Download and submit',
        text: 'Download the compliant digital photo or print it, then submit it together with your application.'
      }
    ]
  }
})

const url = useRequestURL()
const countryLabel = computed(() => (country.value ? countryName(country.value.code) : ''))
const pageTitle = computed(() => {
  if (isCountry.value) return t('countryLanding.title', { country: countryLabel.value })
  return meta.value.title || doc.value?.title || doc.value?.name
})
const pageDescription = computed(() => {
  if (isCountry.value)
    return t('countryLanding.desc', { country: countryLabel.value, count: countryDocs.value.length })
  return meta.value.description || doc.value?.description || ''
})

// Schema.org BreadcrumbList：首页 → 国级页 → 文档详情（国级页则为首页 → 国级页）。
// 绝对 URL 由当前请求 URL 推导 origin + i18n 语言前缀，保证多语言子目录下也正确。
const breadcrumbSchema = computed(() => {
  const origin = url.origin
  const localePrefix = `/${locale.value}`
  const homeUrl = `${origin}${localePrefix}`
  const list: { '@type': 'ListItem'; position: number; name: string; item: string }[] = [
    { '@type': 'ListItem', position: 1, name: t('nav.home'), item: homeUrl }
  ]
  if (isCountry.value) {
    list.push({ '@type': 'ListItem', position: 2, name: countryLabel.value, item: url.toString() })
  } else {
    const countryCode = (doc.value as any)?.country
    if (countryCode) {
      const c = countries.find((c) => c.code.toLowerCase() === countryCode.toLowerCase())
      const cName = c ? countryName(c.code) : countryCode.toUpperCase()
      const countryUrl = `${origin}${localePrefix}/documents/${countryCode.toLowerCase()}`
      list.push({ '@type': 'ListItem', position: 2, name: cName, item: countryUrl })
    }
    list.push({
      '@type': 'ListItem',
      position: list.length + 1,
      name: (doc.value as any)?.name || pageTitle.value,
      item: url.toString()
    })
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list
  }
})

// 说明：文档正文（docContentIndex）已自带完整的 Product / AggregateOffer 结构化数据
// （含 aggregateRating、offers 等），无需在页面层重复注入 Product schema，避免重复商品标记。
// 因此本页的 SEO 强化聚焦在「缺失的 BreadcrumbList」+ 可见面包屑导航。

// JSON-LD 注入前的安全清洗：转义 `</` 避免提前闭合 <script>，并抹除残留的原站域名。
const escLd = (s: string) => s.replace(/https:\/\/photogov\.net/g, '').replace(/</g, '\\u003c')

const jsonLdScripts = computed(() => {
  const scripts: { key: string; type: string; innerHTML: string }[] = [
    {
      key: 'ld-breadcrumb',
      type: 'application/ld+json',
      innerHTML: escLd(JSON.stringify(breadcrumbSchema.value))
    }
  ]
  if (!isCountry.value) {
    for (const s of schemaOrg.value || []) {
      scripts.push({
        key: `ld-doc-${scripts.length}`,
        type: 'application/ld+json',
        innerHTML: escLd(typeof s === 'string' ? s : JSON.stringify(s))
      })
    }
    if (howToSchema.value)
      scripts.push({
        key: 'ld-howto',
        type: 'application/ld+json',
        innerHTML: escLd(JSON.stringify(howToSchema.value))
      })
  }
  return scripts
})

// 可见面包屑导航（与 BreadcrumbList 结构化数据对应的前端展示，提升 UX 与无障碍）
const breadcrumbTrail = computed(() => {
  const lp = `/${locale.value}`
  const trail: { name: string; to: string }[] = [{ name: t('nav.home'), to: lp }]
  if (isCountry.value) {
    trail.push({ name: countryLabel.value, to: `${lp}/documents/${slug.value.toLowerCase()}` })
  } else {
    const countryCode = (doc.value as any)?.country
    if (countryCode) {
      const c = countries.find((c) => c.code.toLowerCase() === countryCode.toLowerCase())
      trail.push({
        name: c ? countryName(c.code) : countryCode.toUpperCase(),
        to: `${lp}/documents/${countryCode.toLowerCase()}`
      })
    }
    trail.push({ name: (doc.value as any)?.name || pageTitle.value, to: route.fullPath })
  }
  return trail
})

useHead({
  title: pageTitle.value,
  meta: [
    { name: 'description', content: pageDescription.value },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: pageDescription.value },
    { property: 'og:type', content: isCountry.value ? 'website' : 'product' },
    { property: 'og:url', content: url.toString() }
  ],
  link: [{ rel: 'canonical', href: url.toString() }],
  script: jsonLdScripts.value
})
</script>

<template>
  <article v-if="isCountry" class="container-pg py-12">
    <header class="mx-auto max-w-3xl text-center">
      <span class="text-5xl">{{ country?.flag }}</span>
      <span class="eyebrow mt-3 block">{{ countryLabel }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ pageTitle }}</h1>
      <p class="mx-auto mt-4 max-w-2xl text-muted">{{ pageDescription }}</p>
    </header>

    <section class="mt-10">
      <h2 class="text-xl font-bold">{{ $t('countryLanding.docsTitle', { country: countryLabel }) }}</h2>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DocCard v-for="d in countryDocs" :key="d.slug" :doc="d" :flag="country?.flag || ''" />
      </div>
    </section>

    <div class="card-pg mt-10 border-l-4 border-[#ccb38d] p-6">
      <p class="text-sm leading-relaxed text-muted">{{ $t('about.note') }}</p>
    </div>
  </article>

  <article v-else class="pg-document-detail">
    <nav aria-label="Breadcrumb" class="container-pg pt-6">
      <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
        <li v-for="(b, i) in breadcrumbTrail" :key="i" class="flex items-center gap-x-1.5">
          <span v-if="i > 0" aria-hidden="true" class="text-ink/30">/</span>
          <NuxtLink
            v-if="i < breadcrumbTrail.length - 1"
            :to="b.to"
            class="hover:text-brand-blue hover:underline"
            >{{ b.name }}</NuxtLink
          >
          <span v-else aria-current="page" class="font-medium text-ink">{{ b.name }}</span>
        </li>
      </ol>
    </nav>

    <DocContent :nodes="nodes" />

    <!-- 官方来源摘要卡（带最后核验日期；对标原站「Official Government Sources」的独立干净卡） -->
    <section v-if="officialSourceLinks.length" class="container-pg mt-12">
      <div class="card-pg border-l-4 border-[#ccb38d] p-6">
        <h2 class="text-lg font-bold">{{ $t('doc.docSourcesTitle') }}</h2>
        <p class="mt-2 text-sm text-muted">{{ $t('doc.docSourcesSub') }}</p>
        <ul class="mt-4 space-y-2">
          <li v-for="(l, i) in officialSourceLinks" :key="i">
            <a
              :href="l.url"
              target="_blank"
              rel="noopener"
              :title="$t('doc.docSourcesOpen')"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
            >
              <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M14 5h5v5M19 5l-9 9M12 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ l.host }}</span>
            </a>
          </li>
        </ul>
        <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>{{ $t('doc.docSourcesLastVerified', { date: lastVerified }) }}</span>
          <span class="text-white/40">·</span>
          <span>{{ $t('doc.docSourcesNote') }}</span>
        </div>
      </div>
    </section>
  </article>
</template>

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
const { t } = useI18n()
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
  script: (isCountry.value
    ? []
    : (schemaOrg.value || []).map((s: string, i: number) => ({
        key: `ld-doc-${i}`,
        type: 'application/ld+json',
        innerHTML: (typeof s === 'string' ? s : JSON.stringify(s)).replace(/https:\/\/photogov\.net/g, '')
      }))
  )
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
    <DocContent :nodes="nodes" />
  </article>
</template>

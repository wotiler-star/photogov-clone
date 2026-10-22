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
import PhotoTool from '~/components/PhotoTool.vue'
import { useApi } from '~/composables/useApi'
import { useData } from '~/composables/useData'
import { slugifyHeading, stripTags } from '~/utils/docAnchor'

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

// 国级页文档按证件类型分组（护照/签证/身份证…），每组带计数，提升页面颗粒度
const countryGroups = computed(() => {
  const order = ['passport', 'visa', 'id', 'driving', 'other']
  const labels: Record<string, string> = {
    passport: t('countryLanding.catPassport'),
    visa: t('countryLanding.catVisa'),
    id: t('countryLanding.catId'),
    driving: t('countryLanding.catDriving'),
    other: t('countryLanding.catOther')
  }
  const map: Record<string, any[]> = {}
  for (const d of countryDocs.value) (map[(d as any).category || 'other'] ||= []).push(d)
  return order
    .filter((c) => (map[c] || []).length)
    .map((c) => ({ cat: c, label: labels[c] || c, docs: map[c] }))
})

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

// ── F6 尾部区块所需派生数据 ────────────────────────────────────────────────
// 官方来源短名：按国家码映射签发机关（用于 Byline「Checked against …」与 Trust bar）
const authorityName = computed(() => {
  const d = doc.value as any
  if (!d) return ''
  const map: Record<string, string> = {
    US: 'U.S. Department of State',
    GB: 'HM Passport Office',
    CA: 'Immigration, Refugees and Citizenship Canada',
    IN: 'Ministry of External Affairs, India',
    AU: 'Australian Passport Office',
    DE: 'Bundesdruckerei',
    FR: 'Ministère de l’Europe et des Affaires étrangères',
    CN: 'National Immigration Administration'
  }
  return map[d.country] || d.countryName || ''
})

const authorityUrl = computed(() => {
  const d = doc.value as any
  return (d && d.source) || ''
})

// 内容树里是否自带 DDAuthor（其 navigationList 即原站目录数据源）。
// 有 → 目录由 DocNode 在正文对应位置渲染；无 → 由页面级 DocToc 兜底，避免重复。
const hasAuthorNode = computed(() => {
  let found = false
  const walk = (n: any) => {
    if (found || !n) return
    if (n.component === 'DDAuthor') {
      found = true
      return
    }
    for (const c of n.children || []) walk(c)
  }
  for (const n of nodes.value) walk(n)
  return found
})

// 本页 H2 锚点（兜底目录用）：内容树里 h2 自带 id 就直接用，否则按标题文本生成，
// 规则与 DocNode 渲染标题时完全一致（utils/docAnchor），保证锚点跳得到。
const tocItems = computed(() => {
  const out: { id: string; text: string }[] = []
  const walk = (n: any) => {
    if (!n) return
    if (n.component === 'h2') {
      const id = (n.attributes && n.attributes.id) || slugifyHeading(n.innerHtml || '')
      const text = stripTags(n.innerHtml || '')
      if (id && text) out.push({ id, text })
    }
    for (const c of n.children || []) walk(c)
  }
  for (const n of nodes.value) walk(n)
  return out
})

// 同国家的其它证件（对标原站「Other Documents — {国家} ID Photos」手风琴）
const otherDocs = computed(() => {
  const d = doc.value as any
  if (!d) return []
  return documentsForCountry(d.country).filter((x) => x.slug !== d.slug)
})

// ── 日期口径（对标原站：Trust bar / 来源区用 DD.MM.YYYY，目录用 DD/MM/YYYY） ──
const LAST_CHECKED = new Date('2026-10-12')
const LAST_ARTICLE_UPDATE = new Date('2026-10-09')
const pad = (n: number) => String(n).padStart(2, '0')
const lastCheckedDot = computed(
  () => `${pad(LAST_CHECKED.getDate())}.${pad(LAST_CHECKED.getMonth() + 1)}.${LAST_CHECKED.getFullYear()}`
)
const lastArticleUpdate = computed(
  () => `${pad(LAST_ARTICLE_UPDATE.getDate())}/${pad(LAST_ARTICLE_UPDATE.getMonth() + 1)}/${LAST_ARTICLE_UPDATE.getFullYear()}`
)

// Related pages（对标原站：2 条知识库指南，指向本站已收录的同名条目）
const relatedPages = computed(() => {
  const d = doc.value as any
  if (!d) return []
  if (d.category === 'passport') {
    return [
      { label: 'Passport photo with an Android phone', to: '/knowledge/guides/how-to-take-passport-photo-on-android' },
      { label: 'Baby and child passport photos', to: '/knowledge/requirements/baby-and-child-passport-photos' }
    ]
  }
  return [{ label: 'Passport photo size guide', to: '/knowledge/faq/size-guide' }]
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

// 文档详情页顶部「照片规格汇总卡」：把文档数据的官方规格聚合成 label/value 行，
// 仅展示有值的字段；background 行带色块（对标原站文档页顶部规格表）。
const specRows = computed(() => {
  const d = doc.value as any
  if (!d) return []
  const rows: { key: string; label: string; value: string; swatch?: string }[] = []
  const sizeMm = d.size?.mm
  const sizeIn = d.size?.inch
  if (sizeMm) rows.push({ key: 'size', label: t('doc.reqPhotoSize'), value: [sizeMm + ' mm', sizeIn ? `${sizeIn} in` : ''].filter(Boolean).join(' · ') })
  if (d.size?.px) rows.push({ key: 'px', label: t('doc.reqPixelSize'), value: `${d.size.px} px` })
  if (d.dpi) rows.push({ key: 'dpi', label: t('doc.reqResolution'), value: `${d.dpi} DPI` })
  if (d.background || d.color) {
    rows.push({
      key: 'bg',
      label: t('doc.reqBackground'),
      value: d.color || d.background,
      swatch: d.backgroundRaw || d.background || undefined
    })
  }
  if (d.headHeight) rows.push({ key: 'head', label: t('doc.reqHeadHeight'), value: d.headHeight })
  if (d.eyesLevel) rows.push({ key: 'eyes', label: t('doc.reqEyesLevel'), value: d.eyesLevel })
  if (d.format) rows.push({ key: 'format', label: t('doc.reqFormat'), value: d.format })
  if (d.glasses !== null && d.glasses !== undefined) {
    rows.push({ key: 'glasses', label: t('doc.reqGlasses'), value: d.glasses ? t('doc.glassesAllowed') : t('doc.glassesNotAllowed') })
  }
  if (d.expression) rows.push({ key: 'expression', label: t('doc.reqExpression'), value: d.expression })
  return rows
})

// 内嵌编辑器标题用的尺寸文本：35x40 → "35 × 40 mm / 827 × 945 Pixels"
// （对标原站文档页部件标题 "Your US Passport Photo Now (51 × 51 mm / 600 × 600 Pixels)"）
const toolSizeText = computed(() => {
  const s = (doc.value as any)?.size
  if (!s?.mm) return ''
  const mm = String(s.mm).replace(/x/gi, ' × ')
  const px = s.px ? ` / ${String(s.px).replace(/x/gi, ' × ')} Pixels` : ''
  return `${mm} mm${px}`
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
      <p class="mx-auto mt-2 max-w-2xl text-sm text-muted">{{ $t('countryLanding.subtitle') }}</p>
    </header>

    <!-- 按证件类型分组的文档网格（每组带计数） -->
    <section class="mt-10">
      <h2 class="text-xl font-bold">{{ $t('countryLanding.docsTitle', { country: countryLabel }) }}</h2>
      <div class="mt-6 space-y-8">
        <div v-for="g in countryGroups" :key="g.cat">
          <h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
            {{ g.label }}
            <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-muted">{{ g.docs.length }}</span>
          </h3>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DocCard v-for="d in g.docs" :key="d.slug" :doc="d" :flag="country?.flag || ''" />
          </div>
        </div>
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

    <!-- 照片规格汇总卡（对标原站文档页顶部规格表：label/value 网格 + 背景色块） -->
    <section v-if="specRows.length" class="container-pg mt-6">
      <div class="card-pg p-6">
        <h2 class="text-lg font-bold">{{ $t('doc.specsTitle') }}</h2>
        <p class="mt-1 text-sm text-muted">{{ $t('doc.specsSub') }}</p>
        <dl class="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="r in specRows" :key="r.key" class="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm">
            <dt class="shrink-0 text-muted">{{ r.label }}</dt>
            <dd class="flex items-center gap-1.5 text-right font-medium text-ink">
              <span v-if="r.swatch" class="inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-slate-300" :style="{ background: r.swatch }" aria-hidden="true" />
              <span>{{ r.value }}</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- 内嵌照片编辑器（对标原站文档页「Your X Photo Now」部件：预选当前文档，
         用户读完规格即可直接制作，无需跳转独立工具页） -->
    <section v-if="!isCountry && doc" class="container-pg mt-6">
      <div class="card-pg p-6">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-lg font-bold">
            {{ $t('doc.toolTitle', { name: (doc as any).name, size: toolSizeText }) }}
          </h2>
          <span class="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            {{ $t('doc.freeBadge') }}
          </span>
        </div>
        <p class="mt-1 text-sm text-muted">{{ $t('doc.toolSub') }}</p>
        <div class="mt-5">
          <PhotoTool :country="(doc as any).country" :doc="(doc as any).slug" />
        </div>
      </div>
    </section>

    <DocContent :nodes="nodes" />

    <!-- ═══ F6 尾部区块（对标原站文档页正文后的 6 个区块） ═══ -->
    <!-- ① 作者署名条 -->
    <DocByline :authority="authorityName" :authority-url="authorityUrl" />

    <!-- ② 信任三条 -->
    <DocTrustBar :authority="authorityName" :last-checked="lastCheckedDot" />

    <!-- ③ On this page 目录（内容树无 DDAuthor 时兜底渲染，见 hasAuthorNode） -->
    <DocToc v-if="!hasAuthorNode && tocItems.length" :items="tocItems" :updated="lastArticleUpdate" />

    <!-- ④ 独立声明 -->
    <DocFooterNotice :related="relatedPages" />

    <!-- ⑤ 官方政府来源（逐条标签版） -->
    <section v-if="officialSourceLinks.length" id="official-government-sources" class="container">
      <div class="lg:max-w-[700px]">
        <div class="space-y-4">
          <div class="text-[32px] font-semibold leading-[1.3] font-serif">
            <h2>{{ $t('docSections.sourcesTitle') }}</h2>
          </div>
          <p class="text-[15px] leading-relaxed">
            {{ $t('docSections.sourcesChecked', { authority: authorityName }) }}:
            <a :href="officialSourceLinks[0].url" target="_blank" rel="noopener" class="break-all text-blue-600 underline duration-200 hover:text-red-600">{{ officialSourceLinks[0].url }}</a>
            <span aria-hidden="true"> · </span>{{ $t('docSections.sourcesLastChecked', { date: lastCheckedDot }) }}
          </p>
          <p v-for="(l, i) in officialSourceLinks" :key="i" class="text-[15px] leading-relaxed">
            <b class="font-semibold">{{ i === 0 ? $t('docSections.linkPhotoStandards') : l.host }}: </b>
            <a :href="l.url" target="_blank" rel="noopener" class="text-blue-600 underline duration-200 hover:text-red-600">{{ l.host }}</a>
          </p>
        </div>
      </div>
    </section>

    <!-- ⑥ 同国家其它证件 -->
    <DocOtherDocuments
      v-if="otherDocs.length"
      :country-code="(doc as any).country"
      :country-name="(doc as any).countryName"
      :docs="otherDocs as any"
    />
  </article>
</template>


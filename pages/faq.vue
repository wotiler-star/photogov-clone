<script setup lang="ts">
import { useLocalePath } from '#imports'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useRequestURL } from '#imports'
import InfoPageShell from '~/components/InfoPageShell.vue'
import HeadingSeal from '~/components/HeadingSeal.vue'
import { useOrgLd } from '~/composables/useOrgLd'

const localePath = useLocalePath()
const { t, tm } = useI18n()
const url = useRequestURL()

// 支持邮箱（与语言无关的固定数据，不走 i18n：@ 会触发 vue-i18n 链接格式解析错误）
const SUPPORT_EMAIL = 'info@photogov.net'

// 23 问（原站 /faq/ 全量，四语翻译，见 i18n faqPage.items）
const items = tm('faqPage.items') as Array<{ q: string; a: string }>

// 手风琴：默认全部关闭（对标原站 SSR --rows: 0fr），点击行切换开合
const open = ref<Set<number>>(new Set())
function toggle(i: number) {
  const s = new Set(open.value)
  s.has(i) ? s.delete(i) : s.add(i)
  open.value = s
}
const rowsOf = (i: number) => (open.value.has(i) ? '1fr' : '0fr')

// 答案渲染：{email} 插值 + \n → <br>（对标原站 <br> 分段；静态 i18n 内容，v-html 无注入风险）
const fmt = (s: string) => s.replace(/\{email\}/g, SUPPORT_EMAIL).replace(/\n/g, '<br>')
// JSON-LD 纯文本：插值邮箱 + \n → 空格 + 剥离 HTML 标签
const plain = (s: string) =>
  s
    .replace(/\{email\}/g, SUPPORT_EMAIL)
    .replace(/<[^>]*>/g, '')
    .replace(/\n/g, ' ')

// ═══ SEO / 结构化数据（对标原站 6 个 JSON-LD 块）═══
const canonical = computed(() => `${url.origin}${localePath('/faq')}`)

const escLd = (s: string) => s.replace(/</g, '\\u003c')

const faqPageLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((it) => ({
    '@type': 'Question',
    name: it.q,
    acceptedAnswer: { '@type': 'Answer', text: plain(it.a) }
  }))
}))

const webPageLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url: canonical.value,
  name: t('faqPage.title'),
  description: t('faqPage.metaDesc'),
  publisher: { '@type': 'Organization', '@id': 'https://www.photogov.xyz/#organization' },
  inLanguage: 'en-US'
}))

// 原站注入的两个 App 结构化数据（F4 取证原样）
const appLds = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Passport Photo Maker',
    operatingSystem: 'Android',
    applicationCategory: 'PhotographyApp',
    provider: { '@type': 'Organization', '@id': 'https://www.photogov.xyz/#organization' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '4275' },
    description:
      'Android app to create passport, visa, and ID photos in official sizes (US 2x2 inch, UK 35x45 mm, etc.), with crop and print-ready sheets.',
    downloadUrl:
      'https://play.google.com/store/apps/details?id=com.passport.photo.maker.creator.id.visa.free.size.booth.us.green.card.dv.lottery'
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Passport Photo Maker: ID, Visa',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'iOS 15.6 or later',
    description:
      'PhotoGov iOS app for making passport, visa, and ID photos with automatic resizing, background editing, and compliance-ready formatting.',
    url: 'https://apps.apple.com/us/app/passport-photo-maker-id-visa/id6737547381',
    downloadUrl: 'https://apps.apple.com/us/app/passport-photo-maker-id-visa/id6737547381',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.5', reviewCount: '71' }
  }
]

// BreadcrumbList：对标原站（末项不带 item）
const breadcrumbLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: t('common.homePage'), item: `${url.origin}/` },
    { '@type': 'ListItem', position: 2, name: t('faqPage.title') }
  ]
}))

const { scripts: orgScripts } = useOrgLd()

useHead(() => ({
  title: t('faqPage.metaTitle'),
  meta: [
    { name: 'description', content: t('faqPage.metaDesc') },
    { property: 'og:title', content: t('faqPage.metaTitle') },
    { property: 'og:description', content: t('faqPage.metaDesc') },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical.value },
    { name: 'twitter:title', content: t('faqPage.metaTitle') },
    { name: 'twitter:description', content: t('faqPage.metaDesc') }
  ],
  link: [{ rel: 'canonical', href: canonical.value }],
  script: [
    ...orgScripts.value,
    { key: 'ld-faqpage', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(faqPageLd.value)) },
    { key: 'ld-webpage', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(webPageLd.value)) },
    ...appLds.map((a, i) => ({ key: `ld-app-${i}`, type: 'application/ld+json', innerHTML: escLd(JSON.stringify(a)) })),
    { key: 'ld-breadcrumb', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(breadcrumbLd.value)) }
  ]
}))
</script>

<template>
  <InfoPageShell
    icon="faq"
    :hero-title="$t('faqPage.heroTitle')"
    :hero-desc="$t('faqPage.heroDesc')"
    :breadcrumb="$t('faqPage.breadcrumb')"
  >
    <div class="space-y-10">
      <!-- H1 行 + 金色印章图标 -->
      <div class="flex items-start">
        <h1 class="flex-1 text-[30px] font-bold leading-tight">{{ $t('faqPage.title') }}</h1>
        <HeadingSeal />
      </div>

      <!-- 23 问手风琴（默认全闭，grid-rows 动画） -->
      <div class="space-y-5 pl-4 text-[#374151]">
        <div v-for="(it, i) in items" :key="i">
          <div
            class="group flex cursor-pointer items-center text-[20px] font-semibold text-blue-600"
            role="button"
            tabindex="0"
            :aria-expanded="open.has(i)"
            @click="toggle(i)"
            @keydown.enter.prevent="toggle(i)"
            @keydown.space.prevent="toggle(i)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-6 -ml-6 group-hover:text-red-600">
              <circle cx="12.1" cy="12.1" r="1"></circle>
            </svg>
            <h3 class="flex-1 underline decoration-dotted group-hover:text-red-600">{{ it.q }}</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="size-4 -mr-4 group-hover:text-red-600">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
          </div>
          <div class="grid grid-rows-[var(--rows)] duration-300" :style="`--rows: ${rowsOf(i)}`">
            <div class="overflow-hidden">
              <p class="pt-4" v-html="fmt(it.a)"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </InfoPageShell>
</template>

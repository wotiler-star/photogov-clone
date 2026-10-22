<script setup lang="ts">
import { useLocalePath } from '#imports'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useRequestURL } from '#imports'
import PageSidebar from '~/components/PageSidebar.vue'
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
  publisher: { '@type': 'Organization', '@id': 'https://photogov.net/#organization' },
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
    provider: { '@type': 'Organization', '@id': 'https://photogov.net/#organization' },
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
    { '@type': 'ListItem', position: 1, name: t('faqPage.homePage'), item: `${url.origin}/` },
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
  <div class="bg-gray-100">
    <!-- ═══ Hero（对标原站：封面背景 + 面包屑 + 大使馆图标 + 标题块）═══ -->
    <div class="bg-full bg-center bg-cover py-10 font-serif" style="background-image:url('/img/cover-background.webp')">
      <div class="container space-y-10">
        <!-- 面包屑 -->
        <div class="no-scrollbar max-lg:-mx-4 overflow-auto">
          <nav class="flex items-center gap-x-2 text-[12px] text-[#D1D5DB]" aria-label="Breadcrumb">
            <NuxtLink :to="localePath('/')" class="whitespace-nowrap hover:text-red-600">{{ $t('faqPage.homePage') }}</NuxtLink>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-3.5">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
            <span class="whitespace-nowrap">{{ $t('faqPage.breadcrumb') }}</span>
          </nav>
        </div>
        <!-- 标题块 -->
        <div class="flex items-start gap-x-3">
          <div class="hidden shrink-0 max-lg:hidden">
            <div class="size-9 text-[#fed7aa]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 19" fill="currentColor" stroke="none" class="size-full">
                <path d="M11.025 0.900391V5.45039H4.525C4.43881 5.4504 4.35615 5.48464 4.2952 5.54559C4.23425 5.60654 4.20001 5.6892 4.2 5.77539V8.37539H0.95C0.863807 8.3754 0.781147 8.40964 0.7202 8.47059C0.659252 8.53154 0.625009 8.6142 0.625 8.70039V18.4504C0.625009 18.5366 0.659252 18.6192 0.7202 18.6802C0.781147 18.7411 0.863807 18.7754 0.95 18.7754H23.05C23.1362 18.7754 23.2189 18.7411 23.2798 18.6802C23.3407 18.6192 23.375 18.5366 23.375 18.4504V8.70039C23.375 8.6142 23.3407 8.53154 23.2798 8.47059C23.2189 8.40964 23.1362 8.3754 23.05 8.37539H19.8V5.77539C19.8 5.6892 19.7657 5.60654 19.7048 5.54559C19.6439 5.48464 19.5612 5.4504 19.475 5.45039H11.675V3.34424C13.8051 3.41286 13.1186 4.15039 14.7301 4.15039H15.575V1.71289H14.7301C13.1186 1.71289 13.8051 0.975361 11.675 0.906738V0.900391H11.35H11.025ZM4.85 6.10039H19.15V8.70039C19.15 8.78658 19.1843 8.86924 19.2452 8.93019C19.3061 8.99114 19.3888 9.02538 19.475 9.02539H22.725V18.1254H1.275V9.02539H4.525C4.61119 9.02538 4.69385 8.99114 4.7548 8.93019C4.81575 8.86924 4.84999 8.78658 4.85 8.70039V6.10039ZM5.5 8.37539L5.23975 8.50615L5.18833 8.79243L5.38701 9.00508L5.5 9.02539L5.76025 8.89463L5.81167 8.60835L5.61299 8.3957L5.5 8.37539ZM6.8 8.37539L6.53975 8.50615L6.48833 8.79243L6.68701 9.00508L6.8 9.02539L7.06025 8.89463L7.11167 8.60835L6.91299 8.3957L6.8 8.37539ZM8.1 8.37539L7.83975 8.50615L7.78833 8.79243L7.98701 9.00508L8.1 9.02539L8.36025 8.89463L8.41167 8.60835L8.21299 8.3957L8.1 8.37539ZM9.4 8.37539L9.13975 8.50615L9.08833 8.79243L9.28701 9.00508L9.4 9.02539L9.66025 8.89463L9.71167 8.60835L9.51299 8.3957L9.4 8.37539ZM10.7 8.37539L10.4397 8.50615L10.3883 8.79243L10.587 9.00508L10.7 9.02539L10.9603 8.89463L11.0117 8.60835L10.813 8.3957L10.7 8.37539ZM12 8.37539L11.7397 8.50615L11.6883 8.79243L11.887 9.00508L12 9.02539L12.2603 8.89463L12.3117 8.60835L12.113 8.3957L12 8.37539ZM13.3 8.37539L13.0397 8.50615L12.9883 8.79243L13.187 9.00508L13.3 9.02539L13.5603 8.89463L13.6117 8.60835L13.413 8.3957L13.3 8.37539ZM14.6 8.37539L14.3397 8.50615L14.2883 8.79243L14.487 9.00508L14.6 9.02539L14.8603 8.89463L14.9117 8.60835L14.713 8.3957L14.6 8.37539ZM15.9 8.37539L15.6397 8.50615L15.5883 8.79243L15.787 9.00508L15.9 9.02539L16.1603 8.89463L16.2117 8.60835L16.013 8.3957L15.9 8.37539ZM17.2 8.37539L16.9397 8.50615L16.8883 8.79243L17.087 9.00508L17.2 9.02539L17.4603 8.89463L17.5117 8.60835L17.313 8.3957L17.2 8.37539ZM18.5 8.37539L18.2397 8.50615L18.1883 8.79243L18.387 9.00508L18.5 9.02539L18.7603 8.89463L18.8117 8.60835L18.613 8.3957L18.5 8.37539ZM3.225 10.6504V12.9254H4.525V10.6504H3.225ZM6.475 10.6504V12.9254H7.775V10.6504H6.475ZM9.725 10.6504V12.9254H11.025V10.6504H9.725ZM12.975 10.6504V12.9254H14.275V10.6504H12.975ZM16.225 10.6504V12.9254H17.525V10.6504H16.225ZM19.475 10.6504V12.9254H20.775V10.6504H19.475ZM3.225 14.2254V16.5004H4.525V14.2254H3.225ZM6.475 14.2254V16.5004H7.775V14.2254H6.475ZM9.725 14.2254V16.5004H11.025V14.2254H9.725ZM12.975 14.2254V16.5004H14.275V14.2254H12.975ZM16.225 14.2254V16.5004H17.525V14.2254H16.225ZM19.475 14.2254V16.5004H20.775V14.2254H19.475Z"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 space-y-4">
            <p class="text-[36px] font-bold leading-none text-white">{{ $t('faqPage.heroTitle') }}</p>
            <p class="max-w-[460px] font-medium italic text-[#D1D5DB]">{{ $t('faqPage.heroDesc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 主体：侧栏（原站 DOM 中在前）+ 白卡手风琴 ═══ -->
    <div class="container lg:flex lg:items-start lg:gap-x-20 lg:pt-20 lg:pb-20 max-lg:space-y-20">
      <PageSidebar />

      <div class="flex-1 rounded-lg bg-white px-10 py-12 font-serif max-lg:px-5 max-lg:py-6">
        <div class="space-y-10">
          <!-- H1 行 + 金色印章图标 -->
          <div class="flex items-start">
            <h1 class="flex-1 text-[30px] font-bold leading-tight">{{ $t('faqPage.title') }}</h1>
            <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42" fill="none" class="shrink-0 size-10">
              <path d="M40.25 3.125H38.875V1.75C38.875 1.38533 38.7301 1.03559 38.4723 0.777728C38.2144 0.519866 37.8647 0.375 37.5 0.375H4.5C4.13533 0.375 3.78559 0.519866 3.52773 0.777728C3.26987 1.03559 3.125 1.38533 3.125 1.75V3.125H1.75C1.38533 3.125 1.03559 3.26987 0.777728 3.52773C0.519866 3.78559 0.375 4.13533 0.375 4.5C0.375 4.86467 0.519866 5.21441 0.777728 5.47227C1.03559 5.73013 1.38533 5.875 1.75 5.875H3.125V7.25C3.125 7.61467 3.26987 7.96441 3.52773 8.22227C3.78559 8.48013 4.13533 8.625 4.5 8.625H5.875V34.75C5.87473 35.0254 5.95716 35.2945 6.11161 35.5225C6.26606 35.7505 6.48541 35.9269 6.74125 36.0288L20.4913 41.5288C20.8179 41.6589 21.1821 41.6589 21.5088 41.5288L35.2588 36.0288C35.5146 35.9269 35.7339 35.7505 35.8884 35.5225C36.0428 35.2945 36.1253 35.0254 36.125 34.75V8.625H37.5C37.8647 8.625 38.2144 8.48013 38.4723 8.22227C38.7301 7.96441 38.875 7.61467 38.875 7.25V5.875H40.25C40.6147 5.875 40.9644 5.73013 41.2223 5.47227C41.4801 5.21441 41.625 4.86467 41.625 4.5C41.625 4.13533 41.4801 3.78559 41.2223 3.52773C40.9644 3.26987 40.6147 3.125 40.25 3.125ZM8.625 8.625H14.125V36.015L8.625 33.815V8.625ZM21 38.765L16.875 37.115V8.625H25.125V37.115L21 38.765ZM33.375 33.815L27.875 36.015V8.625H33.375V33.815ZM36.125 5.875H5.875V3.125H36.125V5.875Z" fill="#BDA887"></path>
            </svg>
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
      </div>
    </div>
  </div>
</template>

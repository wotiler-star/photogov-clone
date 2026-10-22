<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath, useRequestURL } from '#imports'
import InfoPageShell from '~/components/InfoPageShell.vue'
import icons from '~/components/reviewsIcons.json'

const { t, tm } = useI18n()
const localePath = useLocalePath()
const url = useRequestURL()

// 20 条真实 Google 评价（F5 取证：初始 4 条 + Show more (+16) 展开全部）
// 内容为用户原文，四语不翻译（引用真实性）
const reviews = tm('reviewsPage.reviews') as any[]
const verifyList = tm('reviewsPage.verifyList') as string[]

const expanded = ref(false)
const visible = computed(() => (expanded.value ? reviews : reviews.slice(0, 4)))
// 双列布局：按索引奇偶分列（对标原站 2 列卡片流）
const columns = computed(() => {
  const even: any[] = []
  const odd: any[] = []
  visible.value.forEach((r, i) => (i % 2 === 0 ? even : odd).push(r))
  return [even, odd]
})

// 每条评价的「Continue...」展开状态
const opened = ref<Record<number, boolean>>({})
const isOpen = (name: string) => !!opened.value[name]
const toggleText = (name: string) => (opened.value[name] = !opened.value[name])

const avatarUrl = (r: any) => (r.avatar ? r.avatar.split('/').pop() : '')
const initialOf = (r: any) => (r.name || '?').trim().charAt(0).toUpperCase()

const canonical = computed(() => `${url.origin}${localePath('/reviews')}`)
const escLd = (s: string) => s.replace(/</g, '\\u003c')

// 对标原站：Product（aggregateRating 4.8/2515）+ BreadcrumbList
const productLd = computed(() => ({
  '@context': 'http://schema.org',
  '@type': 'Product',
  name: 'Photogov',
  image: '/favicon/android-chrome-512x512.png',
  description:
    "At PhotoGov, we understand how frustrating it can be to get the perfect photo for your official documents. That's why we created an online service that provides high-quality photos with just a few clicks. Our team of experts has worked tirelessly to develop an AI-based platform that is efficient, accurate, and user-friendly.",
  brand: { '@type': 'Brand', name: 'Photogov' },
  aggregateRating: {
    '@type': 'AggregateRating',
    bestRating: '5',
    worstRating: '1',
    ratingValue: '4.8',
    ratingCount: '2515'
  }
}))
const breadcrumbLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: t('common.homePage'), item: `${url.origin}/` },
    { '@type': 'ListItem', position: 2, name: t('reviewsPage.breadcrumb') }
  ]
}))

const GOOGLE_URL =
  'https://www.google.com/maps/place//data=!4m3!3m2!1s0x4aac0e30608ca9cd:0x9cf46a57ae12aff!12e1?source=g.page.m._&laa=merchant-review-solicitation'

useHead(() => ({
  title: t('reviewsPage.metaTitle'),
  meta: [
    { name: 'description', content: t('reviewsPage.metaDesc') },
    { property: 'og:title', content: t('reviewsPage.metaTitle') },
    { property: 'og:description', content: t('reviewsPage.metaDesc') },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical.value },
    { name: 'twitter:title', content: t('reviewsPage.metaTitle') },
    { name: 'twitter:description', content: t('reviewsPage.metaDesc') }
  ],
  link: [{ rel: 'canonical', href: canonical.value }],
  script: [
    { key: 'ld-product', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(productLd.value)) },
    { key: 'ld-breadcrumb', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(breadcrumbLd.value)) }
  ]
}))
</script>

<template>
  <InfoPageShell
    icon="reviews"
    :hero-title="$t('reviewsPage.heroTitle')"
    :hero-desc="$t('reviewsPage.heroDesc')"
    :breadcrumb="$t('reviewsPage.breadcrumb')"
    card-class="flex-1 rounded-lg bg-white px-10 pb-12 font-serif overflow-hidden max-lg:px-5 max-lg:pb-6"
  >
    <!-- 卡内顶部出血大图 -->
    <div class="-mx-10 h-[180px] max-lg:-mx-5 max-lg:h-[150px]">
      <img src="/img/reviews/reviews-1.webp" alt="Photogov Reviews" width="1664" height="360" class="size-full object-cover" />
    </div>

    <h1 class="mt-8 text-[30px] font-bold leading-tight">{{ $t('reviewsPage.title') }}</h1>
    <p class="mt-4 font-Golos">
      {{ $t('reviewsPage.intro') }} <b class="font-medium">{{ $t('reviewsPage.introBold') }}</b>
    </p>

    <!-- 精选引用 -->
    <div class="mt-8 flex items-start gap-x-3.5 lg:max-w-[700px] max-lg:gap-x-2.5">
      <span class="shrink-0 max-lg:scale-75" v-html="icons.quote" />
      <div class="flex-1 space-y-5 border-l-[6px] border-[#043361] pl-3.5 max-lg:pl-2.5">
        <div class="font-serif text-[22px] leading-[1.3]">
          <p>“{{ $t('reviewsPage.quote') }}”</p>
        </div>
        <div class="font-Golos text-[#727272]">
          <p>{{ $t('reviewsPage.quoteAuthor') }}</p>
        </div>
      </div>
    </div>

    <p class="mt-8 font-Golos">{{ $t('reviewsPage.body1') }}</p>
    <p class="mt-4 font-Golos">{{ $t('reviewsPage.body2') }}</p>

    <!-- Google 评分行 -->
    <h3 class="mt-10 border-l-4 border-[#BDA887] pl-1.5 text-[22px] font-semibold">{{ $t('reviewsPage.usersSayTitle') }}</h3>
    <div class="mt-6 flex items-center font-Golos">
      <span class="shrink-0" v-html="icons.google" />
      <span class="ml-1.5 font-medium">{{ $t('reviewsPage.byGoogle') }}
        <a :href="GOOGLE_URL" target="_blank" rel="noreferrer nofollow" class="text-blue-600 underline duration-200 hover:text-red-600">{{ $t('reviewsPage.googleName') }}</a>
      </span>
      <div class="ml-8">
        <svg v-for="n in 5" :key="n" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="inline-block size-6">
          <path :d="(icons as any).starPath" fill="#FFD850" />
        </svg>
      </div>
      <span class="ml-3.5 inline-block">
        <span class="font-bold">{{ $t('reviewsPage.ratingValue') }}</span>
        <span class="ml-1.5">{{ $t('reviewsPage.ratingCount') }}</span>
      </span>
    </div>

    <!-- 评价卡（2 列） -->
    <div class="mt-6 flex gap-x-5 max-lg:flex-col">
      <div v-for="(col, ci) in columns" :key="ci" class="flex flex-1 flex-col gap-y-5">
        <div v-for="r in col" :key="r.name" class="rounded-[6px] bg-[#F4F4F4] p-4 font-Golos">
          <div class="flex items-center gap-x-2.5">
            <div v-if="avatarUrl(r)" class="size-8 shrink-0 overflow-hidden rounded-full border border-[#D8D8D8] bg-blue-700 max-lg:size-7">
              <img :src="`/img/reviews/${avatarUrl(r)}`" :alt="`${r.name} user avatar`" width="32" height="32" class="size-full object-cover" />
            </div>
            <div v-else class="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white max-lg:size-7">
              {{ initialOf(r) }}
            </div>
            <span class="flex-1 text-[18px] font-medium max-lg:text-[16px]">{{ r.name }}</span>
            <span class="inline-flex shrink-0 items-center gap-x-0.5">
              <span class="font-semibold">{{ r.rating }}</span>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-6">
                <path :d="(icons as any).starPath" fill="#FFD850" />
              </svg>
            </span>
          </div>
          <p class="mt-3 text-[14px] font-medium">{{ $t('reviewsPage.postedOn') }}</p>
          <p class="mt-2 text-[14px]" :class="isOpen(r.name) ? '' : 'line-clamp-3'">{{ r.text }}</p>
          <button
            v-if="!isOpen(r.name)"
            type="button"
            class="mt-0.5 text-blue-600 duration-200 hover:text-red-600"
            @click="toggleText(r.name)"
          >
            {{ $t('reviewsPage.continueText') }}
          </button>
          <p v-if="r.date" class="mt-2 text-[14px] text-[#6b7280]">{{ r.date }}</p>
        </div>
      </div>
    </div>

    <!-- 展开更多 -->
    <p v-if="!expanded" class="mt-6 text-center">
      <button
        type="button"
        class="inline-flex items-center gap-x-2 text-blue-600 underline decoration-dashed duration-200 hover:text-red-600"
        @click="expanded = true"
      >
        {{ $t('reviewsPage.showMore') }}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4">
          <path d="M8 18L12 22L16 18"></path>
          <path d="M12 2V22"></path>
        </svg>
      </button>
    </p>

    <!-- 经过验证的真实反馈 -->
    <h2 class="mt-8 text-[30px] font-bold leading-tight">{{ $t('reviewsPage.verifyTitle') }}</h2>
    <p class="mt-4 font-Golos">{{ $t('reviewsPage.verifyP1') }}</p>
    <p class="mt-4 font-Golos">{{ $t('reviewsPage.verifyP2') }}</p>
    <p class="mt-4 font-Golos">
      {{ $t('reviewsPage.verifyLead') }} <b class="font-semibold">{{ $t('reviewsPage.verifyLeadBold') }}</b>
    </p>
    <ul class="ml-4 mt-4 list-outside list-disc space-y-1.5 font-Golos">
      <li v-for="(v, i) in verifyList" :key="i" class="list-item">{{ v }}</li>
    </ul>
    <div class="mt-10 h-[300px] w-full overflow-hidden rounded">
      <img src="/img/reviews/reviews-2.webp" alt="Photogov Reviews" width="1280" height="600" class="size-full object-cover" />
    </div>

    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('reviewsPage.shapeTitle') }}</h2>
    <p class="mt-4 font-Golos">{{ $t('reviewsPage.shapeP') }}</p>

    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('reviewsPage.voiceTitle') }}</h2>
    <p class="mt-4 font-Golos">{{ $t('reviewsPage.voiceP1') }}</p>
    <p class="mt-4 font-Golos">{{ $t('reviewsPage.voiceP2') }}</p>
  </InfoPageShell>
</template>

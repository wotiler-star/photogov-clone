<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath, useRequestURL } from '#imports'
import InfoPageShell from '~/components/InfoPageShell.vue'
import HeadingSeal from '~/components/HeadingSeal.vue'
import { useOrgLd } from '~/composables/useOrgLd'
import { useRichText } from '~/composables/useRichText'

const { t, tm } = useI18n()
const localePath = useLocalePath()
const url = useRequestURL()
const { rich } = useRichText()

const reasons = tm('whyChooseUs.reasons') as any[]
const escLd = (s: string) => s.replace(/</g, '\\u003c')
const canonical = computed(() => `${url.origin}${localePath('/why-choose-us')}`)

const collectionPageLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  mainEntity: { '@type': 'Organization', '@id': 'https://photogov.net/#organization' },
  inLanguage: 'en-US'
}))
const webSiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PhotoGov',
  url: 'https://photogov.net/'
}
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
const breadcrumbLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: t('common.homePage'), item: `${url.origin}/` },
    { '@type': 'ListItem', position: 2, name: t('whyChooseUs.breadcrumb') }
  ]
}))

const { scripts: orgScripts } = useOrgLd()

useHead(() => ({
  title: t('whyChooseUs.metaTitle'),
  meta: [
    { name: 'description', content: t('whyChooseUs.metaDesc') },
    { property: 'og:title', content: t('whyChooseUs.metaTitle') },
    { property: 'og:description', content: t('whyChooseUs.metaDesc') },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical.value },
    { name: 'twitter:title', content: t('whyChooseUs.metaTitle') },
    { name: 'twitter:description', content: t('whyChooseUs.metaDesc') }
  ],
  link: [{ rel: 'canonical', href: canonical.value }],
  script: [
    ...orgScripts.value,
    { key: 'ld-collectionpage', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(collectionPageLd.value)) },
    { key: 'ld-website', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(webSiteLd)) },
    ...appLds.map((a, i) => ({ key: `ld-app-${i}`, type: 'application/ld+json', innerHTML: escLd(JSON.stringify(a)) })),
    { key: 'ld-breadcrumb', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(breadcrumbLd.value)) }
  ]
}))
</script>

<template>
  <InfoPageShell
    icon="why-choose-us"
    :hero-title="$t('whyChooseUs.heroTitle')"
    :hero-desc="$t('whyChooseUs.heroDesc')"
    :breadcrumb="$t('whyChooseUs.breadcrumb')"
  >
    <div class="flex items-start">
      <h1 class="flex-1 text-[30px] font-bold leading-tight">{{ $t('whyChooseUs.title') }}</h1>
      <HeadingSeal />
    </div>

    <div class="mt-6 space-y-6 text-[#374151]">
      <p>{{ $t('whyChooseUs.lead') }}</p>
    </div>

    <!-- 11 个理由（编号 H2 平铺，非卡片） -->
    <div class="mt-10 space-y-8">
      <div v-for="(r, i) in reasons" :key="i">
        <h2 class="text-[30px] font-bold leading-tight">{{ r.t }}</h2>
        <div class="mt-4 space-y-4 text-[#374151]">
          <template v-for="(p, j) in r.ps" :key="j">
            <ul v-if="p === '__BULLETS__' && r.bullets" class="ml-4 list-outside list-disc space-y-1.5 font-sans">
              <li v-for="(b, k) in r.bullets" :key="k" class="list-item">{{ b }}</li>
            </ul>
            <p v-else v-html="rich(p)"></p>
          </template>
          <!-- 理由 1 的 CTA（原站 href 为空，判定为其疏失；此处指向首页制照入口） -->
          <p v-if="r.cta" class="mt-4">
            <NuxtLink :to="localePath('/')" class="text-blue-600 underline duration-200 hover:text-red-600">{{ r.cta }}</NuxtLink>
          </p>
        </div>
      </div>
    </div>

    <p class="mt-8 text-[#374151]" v-html="rich($t('whyChooseUs.outro1'))"></p>
    <p class="mt-4 text-[#374151]">{{ $t('whyChooseUs.outro2') }}</p>
  </InfoPageShell>
</template>

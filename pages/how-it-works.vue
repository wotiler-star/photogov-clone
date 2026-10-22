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

const steps = tm('howItWorks.steps') as any[]
const tech = tm('howItWorks.tech') as string[]
const embassy = tm('howItWorks.embassy') as string[]

const escLd = (s: string) => s.replace(/</g, '\\u003c')
const canonical = computed(() => `${url.origin}${localePath('/how-it-works')}`)

// 对标原站：Organization + WebPage + SoftwareApplication×2 + BreadcrumbList
const webPageLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url: canonical.value,
  name: t('howItWorks.title'),
  description: t('howItWorks.metaDesc'),
  publisher: { '@type': 'Organization', '@id': 'https://photogov.net/#organization' },
  inLanguage: 'en-US'
}))
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
    { '@type': 'ListItem', position: 2, name: t('howItWorks.breadcrumb') }
  ]
}))

const { scripts: orgScripts } = useOrgLd()

useHead(() => ({
  title: t('howItWorks.metaTitle'),
  meta: [
    { name: 'description', content: t('howItWorks.metaDesc') },
    { property: 'og:title', content: t('howItWorks.metaTitle') },
    { property: 'og:description', content: t('howItWorks.metaDesc') },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical.value },
    { name: 'twitter:title', content: t('howItWorks.metaTitle') },
    { name: 'twitter:description', content: t('howItWorks.metaDesc') }
  ],
  link: [{ rel: 'canonical', href: canonical.value }],
  script: [
    ...orgScripts.value,
    { key: 'ld-webpage', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(webPageLd.value)) },
    ...appLds.map((a, i) => ({ key: `ld-app-${i}`, type: 'application/ld+json', innerHTML: escLd(JSON.stringify(a)) })),
    { key: 'ld-breadcrumb', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(breadcrumbLd.value)) }
  ]
}))
</script>

<template>
  <InfoPageShell
    icon="how-it-works"
    :hero-title="$t('howItWorks.heroTitle')"
    :hero-desc="$t('howItWorks.heroDesc')"
    :breadcrumb="$t('howItWorks.breadcrumb')"
  >
    <div class="flex items-start">
      <h1 class="flex-1 text-[30px] font-bold leading-tight">{{ $t('howItWorks.title') }}</h1>
      <HeadingSeal />
    </div>

    <div class="mt-6 space-y-6 text-[#374151]">
      <p>{{ $t('howItWorks.lead1') }}</p>
      <p>{{ $t('howItWorks.lead2') }}</p>
      <p>
        <NuxtLink :to="localePath('/')" class="text-blue-600 underline duration-200 hover:text-red-600">
          {{ $t('howItWorks.cta') }}
        </NuxtLink>
      </p>
    </div>

    <!-- 7 个步骤 -->
    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('howItWorks.stepsTitle') }}</h2>
    <div class="mt-6 space-y-6">
      <div v-for="(s, i) in steps" :key="i">
        <h3 class="border-l-4 border-[#BDA887] pl-1.5 text-[22px] font-semibold">{{ s.t }}</h3>
        <div class="mt-3 space-y-3 text-[#374151]">
          <p>{{ s.p }}</p>
          <p v-if="s.note" class="font-medium">{{ s.note }}</p>
        </div>
      </div>
    </div>

    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('howItWorks.techTitle') }}</h2>
    <div class="mt-4 space-y-4 text-[#374151]">
      <p v-for="(p, i) in tech" :key="i">{{ p }}</p>
    </div>

    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('howItWorks.embassyTitle') }}</h2>
    <div class="mt-4 space-y-4 text-[#374151]">
      <p v-for="(p, i) in embassy" :key="i" v-html="rich(p)"></p>
    </div>
  </InfoPageShell>
</template>

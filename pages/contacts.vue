<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath, useRequestURL } from '#imports'
import InfoPageShell from '~/components/InfoPageShell.vue'
import icons from '~/components/contactsIcons.json'
import { useOrgLd } from '~/composables/useOrgLd'

const { t, tm } = useI18n()
const localePath = useLocalePath()
const url = useRequestURL()

// 邮箱为与语言无关的固定数据，不走 i18n（@ 会触发 vue-i18n 链接格式解析错误）
const EMAILS: Record<string, string> = {
  info: 'info@photogov.net',
  partner: 'partner@photogov.net',
  media: 'media@photogov.net'
}
const emailOf = (key: string) => EMAILS[key] || EMAILS.info

const cards = tm('contactPage.cards') as any[]

// 社交账号：句柄与 URL 含 @，放进 i18n 会被 vue-i18n 当成链接消息（code 10/14）报错，
// 故作为与语言无关的组件常量（品牌名在各语言下不变）
const social = [
  { label: 'Instagram:', handle: '@photogov_official', url: 'https://www.instagram.com/photogov_official/' },
  { label: 'Youtube:', handle: '@Photogov', url: 'https://www.youtube.com/@Photogov' }
]
const cardIcon = (id: string) =>
  (icons as any)[{ support: 'cardSupport', billing: 'cardBilling', partnership: 'cardPartnership', media: 'cardMedia' }[id] || 'cardSupport']
const socialIcon = (i: number) => (i === 0 ? (icons as any).instagram : (icons as any).youtube)

// ── 咨询表单（对标原站 /contacts/ 尾部的「Get in touch / Fill-Out the Inquiry Form」区块）──
// 邮箱示例含 @，不放入 i18n（会触发 vue-i18n 链接消息解析错误），与 EMAILS 一样作为组件常量。
const EMAIL_SAMPLE = 'best-customer@gmail.com'
const form = ref({ first: '', last: '', email: '', message: '' })
const attachedName = ref('')

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  attachedName.value = f ? f.name : ''
}

// 复刻站无后端收件接口：用 mailto 把填写内容带入用户自己的邮件客户端，保证功能真实可用
function submitInquiry() {
  const subject = encodeURIComponent('PhotoGov inquiry')
  const body = encodeURIComponent(
    `Name: ${form.value.first} ${form.value.last}\nEmail: ${form.value.email}\n\n${form.value.message}`
  )
  if (typeof window !== 'undefined') {
    window.location.href = `mailto:${EMAILS.info}?subject=${subject}&body=${body}`
  }
}

const canonical = computed(() => `${url.origin}${localePath('/contacts')}`)
const escLd = (s: string) => s.replace(/</g, '\\u003c')

// 对标原站：Organization + CollectionPage + WebSite + SoftwareApplication×2 + BreadcrumbList
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
    { '@type': 'ListItem', position: 2, name: t('contactPage.breadcrumb') }
  ]
}))

const { scripts: orgScripts } = useOrgLd()

useHead(() => ({
  title: t('contactPage.metaTitle'),
  meta: [
    { name: 'description', content: t('contactPage.metaDesc') },
    { property: 'og:title', content: t('contactPage.metaTitle') },
    { property: 'og:description', content: t('contactPage.metaDesc') },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical.value },
    { name: 'twitter:title', content: t('contactPage.metaTitle') },
    { name: 'twitter:description', content: t('contactPage.metaDesc') }
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
    icon="contacts"
    :hero-title="$t('contactPage.heroTitle')"
    :hero-desc="$t('contactPage.heroDesc')"
    :breadcrumb="$t('contactPage.breadcrumb')"
    card-class="flex-1 rounded-lg bg-white px-10 pb-12 font-serif overflow-hidden max-lg:px-5 max-lg:pb-6"
  >
    <h1 class="mt-8 text-[30px] font-bold leading-tight">{{ $t('contactPage.title') }}</h1>

    <!-- 引言（intro3 含支持邮箱） -->
    <div class="mt-4 space-y-4 text-[#374151]">
      <p class="font-sans">{{ $t('contactPage.intro1') }}</p>
      <p class="font-sans">{{ $t('contactPage.intro2') }}</p>
      <p class="font-sans">
        {{ $t('contactPage.intro3', { email: emailOf('info') }) }} {{ $t('contactPage.intro4') }}
      </p>
    </div>

    <!-- 联系信息：4 张卡（2 列） -->
    <h2 class="mt-16 text-[30px] font-bold leading-tight">{{ $t('contactPage.infoTitle') }}</h2>
    <div class="mt-4 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
      <div v-for="c in cards" :key="c.id" class="overflow-hidden rounded-[6px] border border-[#E0E7EE] bg-white">
        <div class="flex items-center gap-x-2.5 bg-[#E0E7EE] p-2.5">
          <span class="shrink-0" v-html="cardIcon(c.id)" />
          <p class="flex-1 font-semibold">{{ c.title }}</p>
        </div>
        <div class="px-3.5 pb-[18px] pt-3">
          <p class="text-[#958366]">{{ c.desc }}</p>
          <!-- 邮箱行 -->
          <div class="mt-3 flex items-center gap-x-2 font-sans">
            <span class="shrink-0" v-html="icons.mail" />
            <span class="flex-1 text-[14px] font-medium">{{ $t('contactPage.emailLabel') }}
              <a :href="`mailto:${emailOf(c.email)}`" class="text-blue-600 underline duration-200 hover:text-red-600 font-normal">{{ emailOf(c.email) }}</a>
            </span>
          </div>
          <!-- 工时（仅支持卡） -->
          <div v-if="c.hours" class="mt-3 flex items-start gap-x-1.5 font-sans">
            <span class="shrink-0" v-html="icons.clock" />
            <span class="flex-1 text-[14px]">
              <span class="font-medium">{{ $t('contactPage.hoursLabel') }}</span>
              <span class="whitespace-pre-line">{{ c.hours }}</span>
            </span>
          </div>
          <!-- 支持卡：FAQ 提示；账单卡：付款指南链接 -->
          <p v-if="c.note1" class="mt-3 text-[14px]">
            {{ c.note1 }}
            <NuxtLink :to="localePath('/faq')" class="text-blue-600 underline duration-200 hover:text-red-600">{{ c.noteLink }}</NuxtLink>
            {{ c.note2 }}
          </p>
          <p v-if="c.guideText" class="mt-3 text-[14px]">
            <NuxtLink :to="localePath('/prices')" class="text-blue-600 underline duration-200 hover:text-red-600">{{ c.guideText }}</NuxtLink>
          </p>
        </div>
      </div>
    </div>

    <!-- 社交 -->
    <h3 class="mt-10 border-l-4 border-[#BDA887] pl-1.5 text-[22px] font-semibold">{{ $t('contactPage.socialTitle') }}</h3>
    <div class="mt-[18px] space-y-3.5 font-sans text-[14px]">
      <div v-for="(s, i) in social" :key="s.url" class="flex items-center gap-x-2">
        <span class="shrink-0" v-html="socialIcon(i)" />
        <p class="flex-1">
          <span class="font-medium">{{ s.label }}</span>
          <a :href="s.url" target="_blank" rel="noopener" class="ml-1.5 text-blue-600 underline duration-200 hover:text-red-600">{{ s.handle }}</a>
        </p>
      </div>
    </div>

    <!-- 邮寄地址 -->
    <h3 class="mt-10 border-l-4 border-[#BDA887] pl-1.5 text-[22px] font-semibold">{{ $t('contactPage.letterTitle') }}</h3>
    <div class="mt-4 rounded-[6px] border border-[#E0E7EE] px-3.5 pb-3 pt-3.5 text-[14px] lg:max-w-[380px]">
      <div class="flex items-center gap-x-2">
        <span class="shrink-0" v-html="icons.location" />
        <span class="flex-1 font-medium">{{ $t('contactPage.postalLabel') }}</span>
      </div>
      <p class="mt-2 text-[#374151]">{{ $t('contactPage.postal') }}</p>
    </div>

    <!-- 办公室 -->
    <h2 class="mt-8 text-[30px] font-bold leading-tight">{{ $t('contactPage.officeTitle') }}</h2>
    <div class="mt-4 grid grid-cols-2 gap-4 max-lg:grid-cols-1">
      <div class="overflow-hidden rounded-[6px] border border-[#E0E7EE]">
        <div class="bg-[#E0E7EE] p-3.5">
          <div class="flex items-start gap-x-3">
            <span class="flex-1 text-[20px] font-bold">{{ $t('contactPage.officeCountry') }}</span>
          </div>
          <p class="font-sans text-[14px]">
            {{ $t('contactPage.officeCompany') }}<br />{{ $t('contactPage.officeAddress') }}
          </p>
        </div>
        <div class="px-3.5 py-4 font-sans">
          <div class="flex items-start gap-x-1.5">
            <span class="shrink-0" v-html="icons.location" />
            <span class="flex-1 text-[14px] font-medium">{{ $t('contactPage.mapLabel') }}</span>
          </div>
          <iframe
            class="mt-2 h-[220px] w-full rounded"
            :src="$t('contactPage.mapEmbed')"
            loading="lazy"
            :title="$t('contactPage.mapLabel')"
          />
        </div>
      </div>
    </div>

    <!-- Get in touch：咨询表单（对标原站 /contacts/ 尾部区块，此前缺失） -->
    <h2 class="mt-8 text-[30px] font-bold leading-tight">{{ $t('contactPage.getInTouchTitle') }}</h2>
    <p class="mt-4 font-sans text-[#374151]">{{ $t('contactPage.formIntro') }}</p>

    <form class="mt-6 rounded-[6px] border border-[#E0E7EE] p-4 font-sans" @submit.prevent="submitInquiry">
      <p class="text-[16px] font-semibold">{{ $t('contactPage.formTitle') }}</p>

      <div class="mt-4 grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <label class="block">
          <span class="text-[14px] font-medium">{{ $t('contactPage.firstName') }}<span class="text-red-600">{{ $t('contactPage.required') }}</span></span>
          <input v-model="form.first" type="text" required class="mt-1 w-full rounded border border-[#E0E7EE] px-3 py-2 text-[14px]" />
        </label>
        <label class="block">
          <span class="text-[14px] font-medium">{{ $t('contactPage.lastName') }}<span class="text-red-600">{{ $t('contactPage.required') }}</span></span>
          <input v-model="form.last" type="text" required class="mt-1 w-full rounded border border-[#E0E7EE] px-3 py-2 text-[14px]" />
        </label>
      </div>

      <label class="mt-4 block">
        <span class="text-[14px] font-medium">{{ $t('contactPage.emailField') }}<span class="text-red-600">{{ $t('contactPage.required') }}</span></span>
        <input v-model="form.email" type="email" required :placeholder="EMAIL_SAMPLE" class="mt-1 w-full rounded border border-[#E0E7EE] px-3 py-2 text-[14px]" />
      </label>

      <label class="mt-4 block">
        <span class="text-[14px] font-medium">{{ $t('contactPage.messageLabel') }}</span>
        <textarea v-model="form.message" rows="4" class="mt-1 w-full rounded border border-[#E0E7EE] px-3 py-2 text-[14px]"></textarea>
      </label>

      <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <label class="inline-flex items-center gap-x-2 text-[14px]">
          <span class="font-medium">{{ $t('contactPage.attachFile') }}</span>
          <input type="file" class="text-[13px]" @change="onFile" />
        </label>
        <span v-if="attachedName" class="text-[13px] text-[#958366]">{{ attachedName }}</span>
      </div>
      <p class="mt-1.5 text-[13px] text-[#958366]">{{ $t('contactPage.addFiles') }}</p>

      <button
        type="submit"
        class="mt-4 rounded bg-[#2563EB] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90"
      >
        {{ $t('contactPage.sendInquiry') }}
      </button>
    </form>
  </InfoPageShell>
</template>

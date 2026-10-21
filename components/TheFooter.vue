<script setup lang="ts">
const year = new Date().getFullYear()
const localePath = useLocalePath()
const { documents, countriesByCode } = useData()

const CDN = 'https://photogov-com.fra1.cdn.digitaloceanspaces.com'
const flagFor = (code: string) => `${CDN}/frontend/img/svg/flags/4x3/${code.toLowerCase()}.svg`

// 按证件类型分组的二级链接（对标原站 Passport / Visa / Other 分栏）
const docItem = (d: any) => ({ to: `/documents/${d.slug}`, label: d.name, flag: d.country })
const passportDocs = documents.filter((d: any) => d.category === 'passport').slice(0, 8)
const visaDocs = documents.filter((d: any) => d.category === 'visa').slice(0, 8)
const otherDocs = documents
  .filter((d: any) => d.category === 'id' || d.category === 'driving')
  .slice(0, 9)

const columns = [
  { titleKey: 'footer.colPassportPhotos', items: passportDocs.map(docItem) },
  { titleKey: 'footer.colVisaPhotos', items: visaDocs.map(docItem) },
  {
    titleKey: 'footer.colOtherServices',
    items: [
      { to: '/documents?category=id', labelKey: 'footer.links.idPhotos' },
      { to: '/documents?category=driving', labelKey: 'footer.links.drivingPhotos' },
      { to: '/dv-lottery', labelKey: 'footer.links.dvLottery' },
      { to: '/documents', labelKey: 'footer.links.allDocuments' },
      { to: '/knowledge', labelKey: 'footer.links.knowledge' }
    ]
  },
  {
    titleKey: 'footer.colCompany',
    items: [
      { to: '/profile', labelKey: 'footer.links.myAccount' },
      { to: '/profile/photos', labelKey: 'footer.links.myPhotos' },
      { to: '/profile/subscription', labelKey: 'footer.links.subscription' },
      { to: '/about-us', labelKey: 'footer.links.aboutUs' },
      { to: '/contacts', labelKey: 'footer.links.contacts' },
      { to: '/prices', labelKey: 'footer.links.prices' }
    ]
  },
  {
    titleKey: 'footer.colSupport',
    items: [
      { to: '/help', labelKey: 'footer.links.helpCenter' },
      { to: '/how-it-works', labelKey: 'footer.links.howItWorks' },
      { to: '/reviews', labelKey: 'footer.links.reviews' },
      { to: '/security', labelKey: 'footer.links.security' },
      { to: '/why-choose-us', labelKey: 'footer.links.whyChooseUs' }
    ]
  },
  {
    titleKey: 'footer.colLegal',
    items: [
      { to: '/terms-of-use', labelKey: 'footer.links.termsOfUse' },
      { to: '/privacy-policy', labelKey: 'footer.links.privacyPolicy' },
      { to: '/cookie-policy', labelKey: 'footer.links.cookiePolicy' },
      { to: '/refund-policy', labelKey: 'footer.links.refundPolicy' },
      { to: '/global-id-photo-compliance', labelKey: 'footer.links.globalCompliance' },
      { to: '/us-id-photo-compliance', labelKey: 'footer.links.usCompliance' },
      { to: '/independence-disclaimer', labelKey: 'footer.links.nonAffiliation' }
    ]
  }
]

// App Store / Google Play 下载徽章（对标原站 Footer 顶部）。
// 注意：此处指向应用商店主页，避免冒充第三方真实 App；上线自有 App 后替换为对应的应用详情页链接。
const appStoreUrl = 'https://apps.apple.com/'
const googlePlayUrl = 'https://play.google.com/store/apps'

// 按国家分组的超大链接矩阵：列出所有有证件的国码，链接到 /documents/<code> 国级落地页
const countryLinks = (() => {
  const seen = new Set<string>()
  const out: { code: string; name: string }[] = []
  for (const d of documents as any[]) {
    if (!seen.has(d.country)) {
      seen.add(d.country)
      out.push({ code: d.country, name: countriesByCode[d.country]?.name || d.country })
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
})()
</script>

<template>
  <footer class="bg-header text-white/80">
    <!-- ═══ App Store / Google Play 下载徽章（对标原站 Footer 顶部） ═══ -->
    <div class="border-b border-white/10">
      <div class="container-pg flex flex-col items-start gap-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg font-bold text-white">{{ $t('footer.getApp') }}</h3>
          <p class="mt-1 max-w-md text-sm text-white/60">{{ $t('footer.getAppSub') }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a
            :href="appStoreUrl"
            target="_blank"
            rel="noopener"
            :aria-label="$t('footer.appStore')"
            class="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-header transition hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.49-.12-1.1.46-2.29 1.177-3.04.744-.86 2.05-1.5 2.987-1.53zM21.5 17.52c-.43 1.01-.85 1.46-1.57 2.36-.99 1.31-2.39 2.95-4.13 2.95-1.55 0-2.02-.91-4.04-.91-2.02 0-2.64.88-4.2.88-1.74 0-3.07-1.6-4.06-2.91C1.1 16.6.43 12.6 1.9 9.95c.87-1.54 2.39-2.5 4.03-2.5 1.55 0 2.53.91 3.82.91 1.27 0 2.04-.91 3.84-.91 1.37 0 2.83.75 3.86 2.04-3.4 1.86-2.85 6.71.99 8.03z"/>
            </svg>
            <span class="text-left leading-tight">
              <span class="block text-[10px] uppercase tracking-wide opacity-70">{{ $t('footer.downloadOn') }}</span>
              <span class="block text-base font-semibold">{{ $t('footer.appStore') }}</span>
            </span>
          </a>
          <a
            :href="googlePlayUrl"
            target="_blank"
            rel="noopener"
            :aria-label="$t('footer.googlePlay')"
            class="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-header transition hover:opacity-90"
          >
            <svg viewBox="0 0 512 512" width="22" height="22" aria-hidden="true">
              <path fill="#34A853" d="M325.3 234.3 104.6 13l280.8 161.2z"/>
              <path fill="#FBBC04" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l257.3-258.4z"/>
              <path fill="#EA4335" d="M25.3 476.7c0 16.1 8.7 28.5 21.7 35.3l257.3-257.3L232.5 233.4z"/>
              <path fill="#4285F4" d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1z"/>
            </svg>
            <span class="text-left leading-tight">
              <span class="block text-[10px] uppercase tracking-wide opacity-70">{{ $t('footer.downloadOn') }}</span>
              <span class="block text-base font-semibold">{{ $t('footer.googlePlay') }}</span>
            </span>
          </a>
        </div>
      </div>
    </div>

    <div class="container-pg grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <div class="sm:col-span-2">
        <div class="flex items-center gap-2 text-xl font-bold text-white">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-accent-yellow text-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 8.5C3 7.7 3.7 7 4.5 7h15c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/>
              <path d="M9 4.5l1.5 2.5M15 4.5l-1.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="font-serif">Photo<span class="text-accent-yellow">Gov</span></span>
        </div>
        <p class="mt-4 max-w-xs text-sm text-white/60">
          {{ $t('footer.tagline') }}
        </p>
        <p class="mt-4 text-xs text-white/45">
          {{ $t('footer.notAffiliated') }}
        </p>
      </div>

      <div v-for="col in columns" :key="col.titleKey">
        <h4 class="text-sm font-semibold uppercase tracking-wide text-white">
          {{ $t(col.titleKey) }}
        </h4>
        <ul class="mt-4 space-y-2 text-sm">
          <li v-for="(l, i) in col.items" :key="i">
            <NuxtLink :to="localePath(l.to)" class="flex items-center gap-2 text-white/65 hover:text-white">
              <img v-if="l.flag" :src="flagFor(l.flag)" :alt="l.flag" class="h-3.5 w-5 shrink-0 rounded-sm object-cover" loading="lazy" />
              <span>{{ l.labelKey ? $t(l.labelKey) : l.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- ═══ 按国家分组的超大链接矩阵（对标原站国家快链） ═══ -->
    <div class="border-t border-white/10">
      <div class="container-pg py-10">
        <h4 class="text-sm font-semibold uppercase tracking-wide text-white">
          {{ $t('footer.browseByCountry') }}
        </h4>
        <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <NuxtLink
            v-for="c in countryLinks"
            :key="c.code"
            :to="localePath(`/documents/${c.code}`)"
            class="flex items-center gap-2 text-sm text-white/65 hover:text-white"
          >
            <img :src="flagFor(c.code)" :alt="c.code" class="h-4 w-6 shrink-0 rounded-sm object-cover" loading="lazy" />
            <span class="truncate">{{ c.name }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="border-t border-white/10">
      <div class="container-pg flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/50 sm:flex-row">
        <p>{{ $t('footer.copyright', { year }) }}</p>
        <p>{{ $t('footer.madeWith') }}</p>
      </div>
    </div>
  </footer>
</template>

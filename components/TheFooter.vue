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

<script setup lang="ts">
import { useLocalePath } from '#imports'
import { useData } from '~/composables/useData'

const localePath = useLocalePath()
const { documents, countriesByCode } = useData()

const CDN = 'https://photogov-com.fra1.cdn.digitaloceanspaces.com'
const flagFor = (code: string) => `${CDN}/frontend/img/svg/flags/4x3/${code.toLowerCase()}.svg`

// 原站真实 App 链接（SEEN 取证：footer a[href*=apps.apple.com] / play.google.com）
const appStoreUrl = 'https://apps.apple.com/us/app/passport-photo-maker-id-visa/id6737547381'
const googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.passport.photo.maker.creator.id.visa.free.size.booth.us.green.card.dv.lottery'

// ── 列 1：Passport Photos（带国旗，对标原站） ──
const passportSlugs = [
  { slug: 'us-passport-photo', cc: 'us' },
  { slug: 'cn-passport-photo', cc: 'cn' },
  { slug: 'ca-passport-photo', cc: 'ca' },
  { slug: 'gb-passport-photo', cc: 'gb' },
  { slug: 'au-passport-photo', cc: 'au' },
  { slug: 'digital-passport-photo', cc: null }
]

// ── 列 2：All Visa Photos ──
const visaSlugs = [
  { slug: 'us-visa-photo', cc: 'us' },
  { slug: 'ca-visa-photo', cc: 'ca' },
  { slug: 'dv-lottery-photo-tool', cc: 'us' },
  { slug: 'eu-visa-photo', cc: 'eu' },
  { slug: 'in-visa-photo', cc: 'in' }
]

// ── 列 4：Company ──
const companyLinks = [
  { to: '/about-us', labelKey: 'footer.links.aboutUs' },
  { to: '/editorial-team', labelKey: 'footer.links.editorialTeam' },
  { to: '/editorial-policy', labelKey: 'footer.links.editorialPolicy' },
  { to: '/contacts', labelKey: 'footer.links.contacts' },
  { to: '/prices', labelKey: 'footer.links.prices' },
  { to: '/why-choose-us', labelKey: 'footer.links.whyChooseUs' },
  { to: '/reviews', labelKey: 'footer.links.reviews' },
  { to: '/security', labelKey: 'footer.links.security' }
]

// ── 列 5：Support ──
const supportLinks = [
  { to: '/support', labelKey: 'footer.links.helpCenter' },
  { to: '/faq', labelKey: 'footer.links.faq' },
  { to: '/how-it-works', labelKey: 'footer.links.howItWorks' }
]

// ── 法律链接行（对标原站底行） ──
const legalLinks = [
  { to: '/privacy-policy', labelKey: 'footer.links.privacyPolicy' },
  { to: '/terms-of-use', labelKey: 'footer.links.termsOfUse' },
  { to: '/cookie-policy', labelKey: 'footer.links.cookiePolicy' },
  { to: '/refund-policy', labelKey: 'footer.links.refundPolicy' },
  { to: '/eu-privacy', labelKey: 'footer.links.euPrivacy' }
]

// 按国家分组的超大链接矩阵（自有 SEO 增强，浅色样式）
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
  <footer class="bg-[#e5e7eb] text-[#111827]">
    <!-- ═══ App Store / Google Play 下载徽章（对标原站，真实商店链接） ═══ -->
    <div class="container-pg flex flex-col items-start gap-5 pb-8 pt-10 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-bold">{{ $t('footer.getApp') }}</h3>
        <p class="mt-1 max-w-md text-sm text-[#4b5563]">{{ $t('footer.getAppSub') }}</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <a
          :href="appStoreUrl"
          target="_blank"
          rel="noopener"
          :aria-label="$t('footer.appStore')"
          class="flex items-center gap-3 rounded-xl bg-black px-4 py-2.5 text-white transition hover:opacity-85"
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
          class="flex items-center gap-3 rounded-xl bg-black px-4 py-2.5 text-white transition hover:opacity-85"
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

    <!-- ═══ 公司信息行（对标原站页脚上行） ═══ -->
    <div class="container-pg border-t border-black/10 py-5 text-center font-serif text-[12px] text-[#6b7280]">
      <p>
        {{ $t('footer.companyInfo') }} ·
        <NuxtLink :to="localePath('/terms-of-use')" class="underline hover:text-black">{{ $t('footer.termsShort') }}</NuxtLink> ·
        <NuxtLink :to="localePath('/refund-policy')" class="underline hover:text-black">{{ $t('footer.refundShort') }}</NuxtLink> ·
        <NuxtLink :to="localePath('/contacts')" class="underline hover:text-black">{{ $t('footer.contactShort') }}</NuxtLink>
      </p>
    </div>

    <!-- ═══ 五列链接组（对标原站） ═══ -->
    <div class="container-pg grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-5">
      <!-- 1. Passport Photos -->
      <div>
        <h4 class="text-sm font-bold">{{ $t('footer.colPassportPhotos') }}</h4>
        <ul class="mt-4 space-y-2 text-[13px]">
          <li v-for="d in passportSlugs" :key="d.slug">
            <NuxtLink :to="localePath(`/documents/${d.slug}`)" class="flex items-center gap-2 text-[#374151] hover:text-black hover:underline">
              <img v-if="d.cc" :src="flagFor(d.cc)" :alt="d.cc" class="h-3.5 w-5 shrink-0 rounded-sm object-cover" loading="lazy" />
              <span>{{ $t(`navDocs.${d.slug}`) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 2. All Visa Photos -->
      <div>
        <h4 class="text-sm font-bold">{{ $t('footer.colVisaPhotos') }}</h4>
        <ul class="mt-4 space-y-2 text-[13px]">
          <li v-for="d in visaSlugs" :key="d.slug">
            <NuxtLink :to="localePath(`/documents/${d.slug}`)" class="flex items-center gap-2 text-[#374151] hover:text-black hover:underline">
              <img :src="flagFor(d.cc)" :alt="d.cc" class="h-3.5 w-5 shrink-0 rounded-sm object-cover" loading="lazy" />
              <span>{{ d.slug === 'dv-lottery-photo-tool' ? $t('footer.links.dvLotteryTools') : $t(`navDocs.${d.slug}`) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 3. Other Services -->
      <div>
        <h4 class="text-sm font-bold">{{ $t('footer.colOtherServices') }}</h4>
        <ul class="mt-4 space-y-2 text-[13px]">
          <li>
            <NuxtLink :to="localePath('/documents')" class="text-[#374151] hover:text-black hover:underline">
              {{ $t('footer.links.allDocuments') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/knowledge')" class="text-[#374151] hover:text-black hover:underline">
              {{ $t('footer.links.knowledge') }}
            </NuxtLink>
          </li>
          <li>
            <a :href="appStoreUrl" target="_blank" rel="noopener" class="text-[#374151] hover:text-black hover:underline">
              {{ $t('footer.links.downloadIos') }}
            </a>
          </li>
          <li>
            <a :href="googlePlayUrl" target="_blank" rel="noopener" class="text-[#374151] hover:text-black hover:underline">
              {{ $t('footer.links.downloadAndroid') }}
            </a>
          </li>
        </ul>
      </div>

      <!-- 4. Company -->
      <div>
        <h4 class="text-sm font-bold">{{ $t('footer.colCompany') }}</h4>
        <ul class="mt-4 space-y-2 text-[13px]">
          <li v-for="l in companyLinks" :key="l.to">
            <NuxtLink :to="localePath(l.to)" class="text-[#374151] hover:text-black hover:underline">
              {{ $t(l.labelKey) }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 5. Support -->
      <div>
        <h4 class="text-sm font-bold">{{ $t('footer.colSupport') }}</h4>
        <ul class="mt-4 space-y-2 text-[13px]">
          <li v-for="l in supportLinks" :key="l.to">
            <NuxtLink :to="localePath(l.to)" class="text-[#374151] hover:text-black hover:underline">
              {{ $t(l.labelKey) }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- ═══ 按国家分组的链接矩阵（自有 SEO 增强） ═══ -->
    <div class="container-pg border-t border-black/10 py-8">
      <h4 class="text-sm font-bold">{{ $t('footer.browseByCountry') }}</h4>
      <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <NuxtLink
          v-for="c in countryLinks"
          :key="c.code"
          :to="localePath(`/documents/${c.code}`)"
          class="flex items-center gap-2 text-[13px] text-[#374151] hover:text-black hover:underline"
        >
          <img :src="flagFor(c.code)" :alt="c.code" class="h-4 w-6 shrink-0 rounded-sm object-cover" loading="lazy" />
          <span class="truncate">{{ c.name }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- ═══ 免责 + 法律链接 + 底行（对标原站） ═══ -->
    <div class="container-pg border-t border-black/10 py-8">
      <p class="text-[12px] text-[#4b5563]">
        {{ $t('footer.disclaimer') }}
        <NuxtLink :to="localePath('/contacts')" class="underline hover:text-black">{{ $t('footer.detailedLegal') }}</NuxtLink>
      </p>

      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
        <NuxtLink
          v-for="l in legalLinks"
          :key="l.to"
          :to="localePath(l.to)"
          class="text-[#374151] underline hover:text-black"
        >
          {{ $t(l.labelKey) }}
        </NuxtLink>
        <NuxtLink :to="localePath('/global-id-photo-compliance')" class="text-[#374151] underline hover:text-black">
          {{ $t('footer.links.globalCompliance') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/us-id-photo-compliance')" class="text-[#374151] underline hover:text-black">
          {{ $t('footer.links.usCompliance') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/independence-disclaimer')" class="text-[#374151] underline hover:text-black">
          {{ $t('footer.links.nonAffiliation') }}
        </NuxtLink>
      </div>

      <div class="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p class="font-serif text-[12px] text-[#374151]">{{ $t('footer.bottomText') }}</p>
        <div class="flex items-center gap-2 font-serif text-[12px] text-[#374151]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="text-[#6b7280]">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" />
            <path d="M3 12h18M12 3c2.6 2.7 2.6 14.3 0 18M12 3c-2.6 2.7-2.6 14.3 0 18" stroke="currentColor" stroke-width="1.2" />
          </svg>
          <span>{{ $t('footer.tmCopyright') }}</span>
        </div>
      </div>

      <p class="mt-4 text-[11px] text-[#6b7280]">{{ $t('footer.notAffiliated') }}</p>
      <p class="mt-1 text-[11px] text-[#6b7280]">{{ $t('footer.copyright', { year: new Date().getFullYear() }) }} · {{ $t('footer.madeWith') }}</p>
    </div>
  </footer>
</template>

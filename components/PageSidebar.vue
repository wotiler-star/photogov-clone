<script setup lang="ts">
import { useLocalePath } from '#imports'

const localePath = useLocalePath()

// 对标原站信息页侧栏：COMPANY / SUPPORT / LEGAL 三组（SEEN 取证）
const groups = [
  {
    titleKey: 'sidebar.company',
    links: [
      { to: '/about-us', key: 'aboutUs' },
      { to: '/contacts', key: 'contacts' },
      { to: '/prices', key: 'prices' },
      { to: '/why-choose-us', key: 'whyChooseUs' },
      { to: '/reviews', key: 'reviews' },
      { to: '/security', key: 'security' }
    ]
  },
  {
    titleKey: 'sidebar.support',
    links: [
      { to: '/support', key: 'helpCenter' },
      { to: '/faq', key: 'faq' },
      { to: '/how-it-works', key: 'howItWorks' }
    ]
  },
  {
    titleKey: 'sidebar.legal',
    links: [
      { to: '/terms-of-use', key: 'termsOfUse' },
      { to: '/privacy-policy', key: 'privacyPolicy' },
      { to: '/cookie-policy', key: 'cookiePolicy' },
      { to: '/refund-policy', key: 'refundPolicy' },
      { to: '/eu-privacy', key: 'euPrivacy' },
      { to: '/us-id-photo-compliance', key: 'usCompliance' },
      { to: '/global-id-photo-compliance', key: 'globalCompliance' },
      { to: '/independence-disclaimer', key: 'nonAffiliation' }
    ]
  }
]
</script>

<template>
  <aside class="space-y-8">
    <div v-for="g in groups" :key="g.titleKey">
      <h3 class="text-[11px] font-bold uppercase tracking-wide text-muted">{{ $t(g.titleKey) }}</h3>
      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="l in g.links" :key="l.to">
          <NuxtLink :to="localePath(l.to)" class="text-ink/80 hover:text-brand-blue hover:underline">
            {{ $t(`sidebar.${l.key}`) }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useLocalePath } from '#imports'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import icons from './sidebarIcons.json'

const localePath = useLocalePath()
const route = useRoute()

// 对标原站信息页侧栏：COMPANY / SUPPORT / LEGAL 三组（F3/F4 取证 SEEN）
// 每链接带方形白底 currentColor 图标（F4 从原站 SSR 提取，sidebarIcons.json）
// 当前页链接：aria-current="page" + text-red-700 + 图标框 border-[#9ca3af]（原站行为）
const groups = [
  {
    titleKey: 'sidebar.company',
    links: [
      { to: '/about-us', key: 'aboutUs', icon: 'aboutUs' },
      { to: '/contacts', key: 'contacts', icon: 'contacts' },
      { to: '/prices', key: 'prices', icon: 'prices' },
      { to: '/why-choose-us', key: 'whyChooseUs', icon: 'whyChooseUs' },
      { to: '/reviews', key: 'reviews', icon: 'reviews' },
      { to: '/security', key: 'security', icon: 'security' }
    ]
  },
  {
    titleKey: 'sidebar.support',
    links: [
      { to: '/support', key: 'helpCenter', icon: 'helpCenter' },
      { to: '/faq', key: 'faq', icon: 'faq' },
      { to: '/how-it-works', key: 'howItWorks', icon: 'howItWorks' }
    ]
  },
  {
    titleKey: 'sidebar.legal',
    links: [
      { to: '/terms-of-use', key: 'termsOfUse', icon: 'termsOfUse' },
      { to: '/privacy-policy', key: 'privacyPolicy', icon: 'privacyPolicy' },
      { to: '/cookie-policy', key: 'cookiePolicy', icon: 'cookiePolicy' },
      { to: '/refund-policy', key: 'refundPolicy', icon: 'refundPolicy' },
      { to: '/eu-privacy', key: 'euPrivacy', icon: 'euPrivacy' },
      { to: '/us-id-photo-compliance', key: 'usCompliance', icon: 'usCompliance' },
      { to: '/global-id-photo-compliance', key: 'globalCompliance', icon: 'globalCompliance' },
      { to: '/independence-disclaimer', key: 'nonAffiliation', icon: 'nonAffiliation' }
    ]
  }
]

// 当前页判定：localePath 带语言前缀，与 route.path 比较
const isCurrent = (to: string) => {
  const p = localePath(to)
  return route.path === p || route.path === `${p}/`
}

// 移动端折叠（对标原站 max-lg 抽屉）：默认收起，点击 Navigation 头切换
const open = ref(false)
const rows = computed(() => (open.value ? '1fr' : '0fr'))
</script>

<template>
  <aside class="font-serif max-lg:sticky max-lg:top-0 max-lg:-mx-6 max-lg:bg-[#f3f4f6] max-lg:shadow-lg max-lg:z-20 shrink-0">
    <!-- 移动端抽屉头（原站：Navigation + chevron，点击展开/收起） -->
    <button
      type="button"
      class="hidden max-lg:flex max-lg:w-full max-lg:items-center max-lg:border-b max-lg:border-[#d1d5db] max-lg:px-6 max-lg:py-4"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="flex-1 text-left font-bold uppercase">{{ $t('sidebar.navigation') }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-5">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <div class="max-lg:grid max-lg:grid-rows-[var(--rows)] max-lg:duration-300" :style="`--rows: ${rows}`">
      <div class="overflow-hidden">
        <div class="space-y-10 max-lg:max-h-[80svh] max-lg:overflow-auto max-lg:px-6 max-lg:py-4">
          <div v-for="g in groups" :key="g.titleKey" class="space-y-5">
            <p class="text-[14px] font-bold text-[#6b7280] uppercase">{{ $t(g.titleKey) }}</p>
            <div class="space-y-3">
              <NuxtLink
                v-for="l in g.links"
                :key="l.to"
                :to="localePath(l.to)"
                class="flex items-center gap-x-3 text-[14px] underline duration-200 cursor-pointer group hover:text-red-700"
                :class="isCurrent(l.to) ? 'text-red-700' : ''"
                :aria-current="isCurrent(l.to) ? 'page' : undefined"
              >
                <span
                  class="shrink-0 size-8 p-1.5 bg-white rounded-sm border duration-200 group-hover:border-[#9ca3af]"
                  :class="isCurrent(l.to) ? 'border-[#9ca3af]' : 'border-transparent'"
                >
                  <svg :viewBox="(icons as any)[l.icon].viewBox" class="size-full" fill="currentColor" v-html="(icons as any)[l.icon].inner" />
                </span>
                <span>{{ $t(`sidebar.${l.key}`) }}</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

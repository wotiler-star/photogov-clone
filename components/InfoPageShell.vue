<script setup lang="ts">
import { useLocalePath } from '#imports'
import PageSidebar from './PageSidebar.vue'
import ServiceProvidedLine from './ServiceProvidedLine.vue'
import heroIcons from './infoHeroIcons.json'

// 对标原站信息页统一外壳（F5 取证 SEEN，9 页中 8 页共用）：
// bg-gray-100 > hero（封面背景 + 面包屑 + 页面图标 + 36px 标题 + 斜体描述）
//          > container lg:flex（侧栏在前 + 白卡）
//          > Service provided by 服务行
defineProps<{
  /** infoHeroIcons.json 的键（faq/contacts/reviews/why-choose-us/how-it-works/security/support/about-us/editorial-policy） */
  icon: string
  heroTitle: string
  heroDesc: string
  /** 面包屑当前页标签（各页不同，见 f5-info-pages-findings.md） */
  breadcrumb: string
  /** 主卡 class 覆盖：contacts/reviews/support/about-us 为 pb-12 px-10 overflow-hidden（无上内边距，H1 自带 mt-8） */
  cardClass?: string
}>()

const localePath = useLocalePath()
</script>

<template>
  <div class="bg-gray-100">
    <!-- ═══ Hero ═══ -->
    <div class="bg-full bg-center bg-cover py-10 font-serif" style="background-image:url('/img/cover-background.webp')">
      <div class="container space-y-10">
        <div class="no-scrollbar max-lg:-mx-4 overflow-auto">
          <nav class="flex items-center gap-x-2 text-[12px] text-[#D1D5DB]" aria-label="Breadcrumb">
            <NuxtLink :to="localePath('/')" class="whitespace-nowrap hover:text-red-600">{{ $t('common.homePage') }}</NuxtLink>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-3.5">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
            <span class="whitespace-nowrap">{{ breadcrumb }}</span>
          </nav>
        </div>
        <div class="flex items-start gap-x-3">
          <div class="hidden shrink-0 max-lg:hidden">
            <div class="size-9 text-[#fed7aa]">
              <svg xmlns="http://www.w3.org/2000/svg" :viewBox="(heroIcons as any)[icon].viewBox" fill="currentColor" stroke="none" class="size-full" v-html="(heroIcons as any)[icon].inner" />
            </div>
          </div>
          <div class="flex-1 space-y-4">
            <p class="text-[36px] font-bold leading-none text-white">{{ heroTitle }}</p>
            <p class="max-w-[460px] font-medium italic text-[#D1D5DB]">{{ heroDesc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 主体：侧栏（DOM 在前）+ 白卡 ═══ -->
    <div class="container lg:flex lg:items-start lg:gap-x-20 lg:pt-20 lg:pb-20 max-lg:space-y-20">
      <PageSidebar />

      <div class="flex-1 rounded-lg bg-white px-10 py-12 font-serif max-lg:px-5 max-lg:py-6" :class="cardClass">
        <slot />
      </div>
    </div>

    <ServiceProvidedLine />
  </div>
</template>

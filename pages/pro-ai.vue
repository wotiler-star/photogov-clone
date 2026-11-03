<script setup lang="ts">
// Pro AI Photos 板块页（+9 PRO AI Photos，$6.90）
// 对标原站 pro_photos 加购服务：AI 增强、合规、9 张成片、一次性付费。
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#imports'
import InfoPageShell from '~/components/InfoPageShell.vue'
import ProAICheckout from '~/components/ProAICheckout.vue'
import { useAuth } from '~/composables/useAuth'
import { PRO_AI_PRICE, formatPrice } from '~/utils/pricing'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN'
}
const priceLabel = formatPrice(PRO_AI_PRICE, LOCALE_MAP[String(locale.value)] || 'en-US')

const checkoutOpen = ref(false)

const features = [
  { icon: 'sparkles', title: t('proAi.feature1Title'), text: t('proAi.feature1Text') },
  { icon: 'shield', title: t('proAi.feature2Title'), text: t('proAi.feature2Text') },
  { icon: 'layers', title: t('proAi.feature3Title'), text: t('proAi.feature3Text') },
  { icon: 'bolt', title: t('proAi.feature4Title'), text: t('proAi.feature4Text') }
]

function buy() {
  if (!user.value) {
    // 未登录：先去登录，回来再买（弹窗也会内联登录）
    checkoutOpen.value = true
    return
  }
  checkoutOpen.value = true
}

useHead(() => ({
  title: t('proAi.metaTitle'),
  meta: [
    { name: 'description', content: t('proAi.metaDesc') }
  ]
}))
</script>

<template>
  <InfoPageShell
    icon="pro-ai"
    :hero-title="t('proAi.title')"
    :hero-desc="t('proAi.heroDesc')"
    :breadcrumb="t('nav.proAi')"
  >
    <!-- 介绍 -->
    <p class="text-[15px] leading-relaxed text-[#374151]">
      {{ t('proAi.intro') }}
    </p>

    <!-- 特性卡片 -->
    <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div
        v-for="f in features"
        :key="f.title"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-[#094DBC]/10 text-[#094DBC]">
          <svg v-if="f.icon === 'sparkles'" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zm7 9l.9 2.6L23 15l-3.1 1-.9 2.6-2.5-1.7-2.5 1.7-.9-2.6L8 15l3.1-1.4L12 11z"/></svg>
          <svg v-else-if="f.icon === 'shield'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"/><path d="m9 12 2 2 4-4"/></svg>
          <svg v-else-if="f.icon === 'layers'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>
        </div>
        <h3 class="text-base font-semibold text-[#212532]">{{ f.title }}</h3>
        <p class="mt-1.5 text-sm leading-relaxed text-[#4b5563]">{{ f.text }}</p>
      </div>
    </div>

    <!-- 购买卡 -->
    <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#094DBC]/5 to-white">
      <div class="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-[#094DBC]">{{ t('proAi.bundle') }}</p>
          <h2 class="mt-1 text-2xl font-bold text-[#212532]">{{ t('proAi.bundleName', { count: 9 }) }}</h2>
          <p class="mt-2 max-w-md text-sm text-[#4b5563]">{{ t('proAi.bundleText') }}</p>
        </div>
        <div class="flex flex-col items-start gap-3 sm:items-end">
          <div class="text-3xl font-bold text-[#094DBC]">{{ priceLabel }}</div>
          <button
            type="button"
            class="rounded-lg bg-[#094DBC] px-6 py-3 text-sm font-semibold text-white duration-200 hover:opacity-80"
            @click="buy"
          >
            {{ t('proAi.buyBtn', { price: priceLabel }) }}
          </button>
          <p class="text-[11px] text-slate-400">{{ t('proAi.demoNote') }}</p>
        </div>
      </div>
    </div>

    <!-- 流程 / 信任行 -->
    <div class="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-[#4b5563]">
      <p class="font-semibold text-[#212532]">{{ t('proAi.howTitle') }}</p>
      <ol class="mt-3 space-y-2">
        <li v-for="(step, i) in 3" :key="i" class="flex gap-3">
          <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#094DBC] text-xs font-bold text-white">{{ i + 1 }}</span>
          <span>{{ t(`proAi.step${i + 1}`) }}</span>
        </li>
      </ol>
    </div>

    <div class="mt-6 text-center">
      <NuxtLink :to="localePath('/prices')" class="text-sm text-[#094DBC] underline hover:opacity-75">
        {{ t('proAi.comparePlans') }}
      </NuxtLink>
    </div>
  </InfoPageShell>

  <ProAICheckout
    :open="checkoutOpen"
    :count="9"
    @close="checkoutOpen = false"
    @success="checkoutOpen = false"
    @subscribe="checkoutOpen = false"
  />
</template>

<script setup lang="ts">
/**
 * 价格页（对标原站 /prices/：Pricing, Services & Subscription Options）
 *
 * 结构：简介 → Free photos → Paid photos（区域定价表）→ Subscriptions（$9.90/月）
 * → Expert Human Verification（$4.90 附加）→ Business Solutions & API → Account Dashboard
 * → 结尾 + 可用性提示 + 合规链接。
 * 订阅动作保留本地账户体系：未登录跳登录页，已登录走 subscribe() 计划流。
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useLocalePath } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { PLANS, planStatus } from '~/utils/plans'
import { useOrgLd } from '~/composables/useOrgLd'

const { t, tm } = useI18n()
const router = useRouter()
const localePath = useLocalePath()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()
const { user, loaded, subscribe, cancelSubscription } = useAuth()

const busy = ref('')
const status = computed(() => planStatus(user.value))
const isLoggedIn = computed(() => !!user.value)
const regions = computed(() => tm('plans.regions') as unknown as Array<{ region: string; digital: string; sheet: string }>)
const premiumPlans = computed(() => PLANS.filter((p) => p.id !== 'free'))
const features = computed(() =>
  (PLANS.find((p) => p.id === 'premium_monthly')?.features || []).map((f) => t(f))
)

async function choose(planId: string) {
  if (!isLoggedIn.value) {
    router.push('/sign-in?redirect=/prices')
    return
  }
  busy.value = planId
  try {
    await subscribe(planId)
  } finally {
    busy.value = ''
  }
}

async function cancel() {
  busy.value = 'cancel'
  try {
    await cancelSubscription()
  } finally {
    busy.value = ''
  }
}

function isCurrent(planId: string): boolean {
  if (planId === 'free') return !status.value.isPremium
  return status.value.isPremium
}

// 结构化数据：Organization + BreadcrumbList（价格页此前 JSON-LD 为 0，属 SEO 洼地）
useHead({
  title: t('plans.title'),
  script: [
    ...orgScripts.value,
    {
      key: 'ld-prices-breadcrumb',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('plans.title') },
        ],
      }).replace(/</g, '\\u003c'),
    },
  ],
})
</script>

<template>
  <div class="container-pg py-16">
    <div class="mx-auto max-w-3xl">
      <h1 class="text-center font-serif text-3xl font-bold text-ink">{{ $t('plans.title') }}</h1>
      <p class="mt-4 text-center leading-relaxed text-muted">{{ $t('plans.subtitle') }}</p>

      <!-- FREE PHOTOS -->
      <section class="mt-12">
        <h2 class="font-serif text-2xl font-bold text-ink">{{ $t('plans.freeTitle') }}</h2>
        <p class="mt-3 leading-relaxed text-muted">{{ $t('plans.freeText') }}</p>
      </section>

      <!-- PAID PHOTOS + 区域定价表 -->
      <section class="mt-12">
        <h2 class="font-serif text-2xl font-bold text-ink">{{ $t('plans.paidTitle') }}</h2>
        <p class="mt-3 leading-relaxed text-muted">{{ $t('plans.paidText') }}</p>
        <p class="mt-4 font-medium text-ink">{{ $t('plans.paidTableCaption') }}</p>
        <div class="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="p-3 text-left font-medium text-muted">{{ $t('plans.colRegion') }}</th>
                <th class="p-3 text-left font-medium text-muted">{{ $t('plans.colDigital') }}</th>
                <th class="p-3 text-left font-medium text-muted">{{ $t('plans.colSheet') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in regions" :key="i" class="border-t border-slate-100">
                <td class="p-3 text-slate-700">{{ r.region }}</td>
                <td class="p-3 font-medium text-ink">{{ r.digital }}</td>
                <td class="p-3 font-medium text-ink">{{ r.sheet }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-4 text-sm leading-relaxed text-muted">
          PhotoGov.net strictly adheres to the
          <NuxtLink :to="localePath('/global-id-photo-compliance')" class="text-brand hover:underline">Global regulations for ID photos</NuxtLink>.
        </p>
      </section>

      <!-- SUBSCRIPTIONS -->
      <section class="mt-12">
        <h2 class="font-serif text-2xl font-bold text-ink">{{ $t('plans.subTitle') }}</h2>
        <p class="mt-3 leading-relaxed text-muted">{{ $t('plans.subText') }}</p>

        <h3 class="mt-6 font-semibold text-ink">{{ $t('plans.subIncludesTitle') }}</h3>
        <ul class="mt-3 space-y-2">
          <li v-for="(f, i) in features" :key="i" class="flex items-start gap-2 text-sm text-slate-600">
            <span class="mt-0.5 text-accent">✓</span><span>{{ f }}</span>
          </li>
        </ul>
        <p class="mt-4 text-sm leading-relaxed text-muted">{{ $t('plans.subAuto') }}</p>

        <h3 class="mt-6 font-semibold text-ink">{{ $t('plans.subConfirmTitle') }}</h3>
        <ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li v-for="(c, i) in $tm('plans.subConfirm')" :key="i">{{ c }}</li>
        </ul>
        <p class="mt-4 text-sm leading-relaxed text-muted">{{ $t('plans.subCancel') }}</p>

        <!-- 订阅操作区（本地账户体系） -->
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            v-for="plan in premiumPlans"
            :key="plan.id"
            class="rounded-2xl border bg-white p-5"
            :class="plan.popular ? 'border-accent shadow-soft' : 'border-slate-200'"
          >
            <div class="flex items-center justify-between gap-2">
              <h4 class="font-semibold text-ink">
                {{ plan.interval === 'year' ? $t('profile.subscription.perYear') : $t('profile.subscription.perMonth') }}
              </h4>
              <span
                v-if="plan.popular"
                class="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white"
              >{{ $t('plans.popular') }}</span>
            </div>
            <p class="mt-2 font-serif text-2xl font-bold text-ink">${{ plan.price }}</p>
            <p v-if="plan.savePercent" class="mt-1 text-xs font-semibold text-green-700">
              {{ $t('plans.save', { n: plan.savePercent }) }}
            </p>
            <button
              v-if="!isLoggedIn && loaded"
              class="btn-outline mt-4 w-full"
              type="button"
              @click="choose(plan.id)"
            >{{ $t('plans.signInToChoose') }}</button>
            <button
              v-else-if="isCurrent(plan.id)"
              class="mt-4 w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-muted"
              type="button"
              disabled
            >{{ $t('plans.current') }}</button>
            <button
              v-else
              class="btn-primary mt-4 w-full"
              type="button"
              :disabled="busy === plan.id"
              @click="choose(plan.id)"
            >{{ $t('plans.upgrade') }}</button>
          </div>
        </div>

        <div class="mt-4 text-center">
          <button
            v-if="isLoggedIn && status.isPremium"
            class="text-sm text-muted underline hover:text-ink"
            type="button"
            :disabled="busy === 'cancel'"
            @click="cancel"
          >{{ $t('plans.downgrade') }}</button>
        </div>
      </section>

      <!-- EXPERT HUMAN VERIFICATION -->
      <section class="mt-12">
        <h2 class="font-serif text-2xl font-bold text-ink">{{ $t('plans.expertTitle') }}</h2>
        <p class="mt-3 leading-relaxed text-muted">{{ $t('plans.expertText') }}</p>
      </section>

      <!-- BUSINESS SOLUTIONS AND API ACCESS -->
      <section class="mt-12">
        <h2 class="font-serif text-2xl font-bold text-ink">{{ $t('plans.businessTitle') }}</h2>
        <p class="mt-3 leading-relaxed text-muted">{{ $t('plans.businessText') }}</p>
      </section>

      <!-- ACCOUNT DASHBOARD -->
      <section class="mt-12">
        <h2 class="font-serif text-2xl font-bold text-ink">{{ $t('plans.dashboardTitle') }}</h2>
        <p class="mt-3 leading-relaxed text-muted">{{ $t('plans.dashboardIntro') }}</p>
        <ul class="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li v-for="(d, i) in $tm('plans.dashboardItems')" :key="i">{{ d }}</li>
        </ul>
        <p class="mt-4 text-sm">
          <NuxtLink :to="localePath('/profile')" class="text-brand hover:underline">{{ $t('plans.managePlans') }}</NuxtLink>
        </p>
      </section>

      <!-- 结尾 + 可用性提示 -->
      <section class="mt-12">
        <p class="leading-relaxed text-muted">{{ $t('plans.closing') }}</p>
        <p class="mt-6 text-sm text-muted">{{ $t('plans.noticeText') }}</p>
        <p v-if="!loaded" class="mt-6 text-center text-sm text-muted">{{ $t('account.loading') }}</p>
      </section>
    </div>
  </div>
</template>

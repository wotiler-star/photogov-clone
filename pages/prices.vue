<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { PLANS, planStatus } from '~/utils/plans'

const { t } = useI18n()
const router = useRouter()
const { user, loaded, subscribe, cancelSubscription } = useAuth()

const busy = ref('')
const status = computed(() => planStatus(user.value))
const isLoggedIn = computed(() => !!user.value)

const compareFeatures = [
  'plans.feat.unlimited',
  'plans.feat.formats',
  'plans.feat.hd',
  'plans.feat.nobg',
  'plans.feat.priority',
  'plans.feat.support'
]
const freePlan = PLANS.find((p) => p.id === 'free')!
const premiumPlan = PLANS.find((p) => p.id === 'premium_monthly')!
const freeHas = (k: string) => freePlan.features.includes(k)
const premiumHas = (k: string) => premiumPlan.features.includes(k)

async function choose(planId: string) {
  if (!isLoggedIn.value) {
    router.push('/sign-in?redirect=/plans')
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

useHead({ title: t('plans.title') })
</script>

<template>
  <div class="container-pg py-16">
    <div class="mx-auto max-w-5xl">
      <h1 class="text-center font-serif text-3xl font-bold text-ink">{{ $t('plans.title') }}</h1>
      <p class="mt-2 text-center text-muted">{{ $t('plans.subtitle') }}</p>

      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <div
          v-for="plan in PLANS"
          :key="plan.id"
          class="relative flex flex-col rounded-2xl border bg-white p-6"
          :class="plan.popular ? 'border-accent shadow-soft' : 'border-slate-200'"
        >
          <span
            v-if="plan.popular"
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white"
          >{{ $t('plans.popular') }}</span>

          <h2 class="text-lg font-bold text-ink">{{ $t(plan.i18n) }}</h2>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-3xl font-bold text-ink">${{ plan.price }}</span>
            <span v-if="plan.interval === 'month'" class="text-sm text-muted">{{ $t('plans.perMonth') }}</span>
            <span v-else-if="plan.interval === 'year'" class="text-sm text-muted">{{ $t('plans.perYear') }}</span>
          </div>
          <span
            v-if="plan.savePercent"
            class="mt-2 inline-block w-fit rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
          >{{ $t('plans.save', { n: plan.savePercent }) }}</span>

          <ul class="mt-4 flex-1 space-y-2 text-sm">
            <li v-for="f in plan.features" :key="f" class="flex items-start gap-2">
              <span class="mt-0.5 text-accent">✓</span>
              <span class="text-slate-600">{{ $t(f) }}</span>
            </li>
          </ul>

          <div class="mt-6">
            <button
              v-if="!isLoggedIn && loaded"
              class="btn-outline w-full"
              type="button"
              @click="choose(plan.id)"
            >{{ $t('plans.signInToChoose') }}</button>

            <button
              v-else-if="isCurrent(plan.id)"
              class="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-muted"
              type="button"
              disabled
            >{{ $t('plans.current') }}</button>

            <button
              v-else-if="plan.id === 'free'"
              class="btn-outline w-full"
              type="button"
              :disabled="busy === 'cancel'"
              @click="cancel"
            >{{ $t('plans.downgrade') }}</button>

            <button
              v-else
              class="btn-primary w-full"
              type="button"
              :disabled="busy === plan.id"
              @click="choose(plan.id)"
            >{{ $t('plans.upgrade') }}</button>
          </div>
        </div>
      </div>

      <!-- 功能对比表 -->
      <div class="mt-14">
        <h2 class="text-center font-serif text-2xl font-bold text-ink">{{ $t('plans.compareTitle') }}</h2>
        <div class="mx-auto mt-6 max-w-2xl overflow-hidden rounded-2xl border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="p-3 text-left font-medium text-muted">{{ $t('plans.feature') }}</th>
                <th class="p-3 text-center font-medium text-muted">{{ $t('plans.free') }}</th>
                <th class="p-3 text-center font-medium text-accent">{{ $t('plans.premium') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in compareFeatures" :key="f" class="border-t border-slate-100">
                <td class="p-3 text-slate-600">{{ $t(f) }}</td>
                <td class="p-3 text-center text-lg">{{ freeHas(f) ? '✓' : '—' }}</td>
                <td class="p-3 text-center text-lg text-accent">{{ premiumHas(f) ? '✓' : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 免费照片说明 + 可用性提示（对标原站价格页的信息板块） -->
      <div class="mx-auto mt-14 max-w-2xl">
        <h2 class="text-center font-serif text-2xl font-bold text-ink">{{ $t('plans.freeTitle') }}</h2>
        <p class="mt-3 text-center text-muted">{{ $t('plans.freeText') }}</p>
        <p class="mt-6 text-center text-sm text-muted">{{ $t('plans.noticeText') }}</p>
      </div>

      <p v-if="!loaded" class="mt-6 text-center text-sm text-muted">{{ $t('account.loading') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// /payment/return —— 支付网关返回页
// 网关处理完成后把用户带回这里（success_url / cancel_url）。
// 页面按 paymentId 轮询本地支付记录直到终态；Webhook 履约可能略晚于跳转，
// 因此 pending 状态会持续轮询（最多 ~30s），成功后刷新登录态并引导去会员中心。
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useLocalePath } from '#imports'
import { getPlan } from '~/utils/plans'

const { t, locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { user, refresh } = useAuth()
const { getPayment } = useApi()

const paymentId = computed(() => String(route.query.paymentId || ''))
const gatewayStatus = computed(() => String(route.query.status || '')) // success | cancel | ''

// pending → 轮询中；paid → 成功；failed/cancelled → 终态
type UiState = 'loading' | 'success' | 'pending' | 'cancelled' | 'failed' | 'missing'
const state = ref<UiState>('loading')
const payment = ref<{ planId: string; amount: number; currency: string; status: string; method: string | null } | null>(null)
const errorMsg = ref('')

let timer: ReturnType<typeof setInterval> | null = null
const POLL_MS = 2000
const POLL_MAX = 15 // 15 × 2s ≈ 30s

async function pollOnce() {
  if (!paymentId.value) {
    state.value = 'missing'
    return true
  }
  try {
    const res = await getPayment(paymentId.value)
    payment.value = res.payment
    const s = res.payment.status
    if (s === 'paid') {
      state.value = 'success'
      await refresh() // 刷新登录态，会员中心立即反映 Premium
      return true
    }
    if (s === 'failed') {
      state.value = 'failed'
      return true
    }
    if (s === 'cancelled') {
      state.value = 'cancelled'
      return true
    }
    return false // pending：继续轮询
  } catch (e: any) {
    errorMsg.value = e?.statusMessage === 'PAYMENT_NOT_FOUND' ? 'missing' : String(e?.message || e)
    if (errorMsg.value === 'missing') {
      state.value = 'missing'
      return true
    }
    return false
  }
}

onMounted(async () => {
  // 用户在收银台主动取消：无需等待 Webhook
  if (gatewayStatus.value === 'cancel' && paymentId.value) {
    try {
      const res = await getPayment(paymentId.value)
      if (res.payment.status === 'pending') state.value = 'cancelled'
      payment.value = res.payment
    } catch {
      state.value = 'cancelled'
    }
    if (state.value === 'cancelled') return
  }

  let tries = 0
  const done = await pollOnce()
  if (!done && state.value !== 'missing') {
    state.value = 'pending'
    timer = setInterval(async () => {
      tries += 1
      const finished = await pollOnce()
      if (finished || tries >= POLL_MAX) {
        if (timer) clearInterval(timer)
        if (state.value === 'pending') state.value = 'pending' // 保持处理中提示
      }
    }, POLL_MS)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const plan = computed(() => (payment.value ? getPlan(payment.value.planId) : undefined))
const amountText = computed(() => {
  if (!payment.value) return ''
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: payment.value.currency || 'USD'
  }).format(payment.value.amount)
})

// 交易流程页：不收录（noindex），但允许跟随链接
useHead({
  title: t('payment.return.title'),
  meta: [{ name: 'robots', content: 'noindex, follow' }]
})
</script>

<template>
  <div class="min-h-[70vh] bg-slate-50">
    <div class="container-pg max-w-xl py-16">
      <div class="card-pg p-8 text-center">
        <!-- 处理中 -->
        <template v-if="state === 'loading' || state === 'pending'">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100">
            <svg class="h-7 w-7 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <h1 class="mt-5 font-serif text-2xl font-bold text-ink">{{ t('payment.return.processing') }}</h1>
          <p class="mt-2 text-sm text-muted">{{ t('payment.return.processingHint') }}</p>
        </template>

        <!-- 成功 -->
        <template v-else-if="state === 'success'">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100">
            <svg class="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h1 class="mt-5 font-serif text-2xl font-bold text-ink">{{ t('payment.return.success') }}</h1>
          <p class="mt-2 text-sm text-muted">{{ t('payment.return.successHint') }}</p>
          <dl v-if="payment" class="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('payment.return.plan') }}</dt>
              <dd class="font-medium text-ink">{{ plan ? t(plan.i18n) : payment.planId }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('payment.return.amount') }}</dt>
              <dd class="font-medium text-ink">{{ amountText }}</dd>
            </div>
            <div v-if="payment.method" class="flex justify-between">
              <dt class="text-muted">{{ t('payment.return.method') }}</dt>
              <dd class="font-medium text-ink">{{ payment.method }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('payment.return.paymentId') }}</dt>
              <dd class="font-mono text-xs text-ink">{{ paymentId }}</dd>
            </div>
          </dl>
          <NuxtLink :to="localePath('/profile/subscription')" class="btn-primary mt-6 inline-flex">
            {{ t('payment.return.goSubscription') }}
          </NuxtLink>
        </template>

        <!-- 已取消 -->
        <template v-else-if="state === 'cancelled'">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100">
            <svg class="h-7 w-7 text-slate-500" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <h1 class="mt-5 font-serif text-2xl font-bold text-ink">{{ t('payment.return.cancelled') }}</h1>
          <p class="mt-2 text-sm text-muted">{{ t('payment.return.cancelledHint') }}</p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <NuxtLink :to="localePath('/profile/subscription')" class="btn-primary">
              {{ t('payment.return.retry') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/')" class="btn-outline">
              {{ t('payment.return.backHome') }}
            </NuxtLink>
          </div>
        </template>

        <!-- 失败 -->
        <template v-else-if="state === 'failed'">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100">
            <svg class="h-7 w-7 text-red-600" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h1 class="mt-5 font-serif text-2xl font-bold text-ink">{{ t('payment.return.failed') }}</h1>
          <p class="mt-2 text-sm text-muted">{{ t('payment.return.failedHint') }}</p>
          <NuxtLink :to="localePath('/profile/subscription')" class="btn-primary mt-6 inline-flex">
            {{ t('payment.return.retry') }}
          </NuxtLink>
        </template>

        <!-- 记录不存在 -->
        <template v-else>
          <h1 class="font-serif text-2xl font-bold text-ink">{{ t('payment.return.missing') }}</h1>
          <p class="mt-2 text-sm text-muted">{{ t('payment.return.missingHint') }}</p>
          <NuxtLink :to="localePath('/')" class="btn-outline mt-6 inline-flex">
            {{ t('payment.return.backHome') }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>

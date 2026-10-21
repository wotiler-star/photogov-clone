<script setup lang="ts">
// /payment/simulate —— Demo 网关收银台（仅 PAYMENT_DEMO_MODE / 未配置 Stripe 时可达）
// 复刻真实网关的收银体验：订单摘要 → Pay / Cancel。
// Pay：调用 /subscription/demo-pay，服务端为回调报文签名后送入与真实
// Webhook 完全相同的验签→履约链路，然后跳回 /payment/return。
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useLocalePath } from '#imports'
import { getPlan } from '~/utils/plans'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { user, loaded } = useAuth()
const { getPayment, demoPay } = useApi()

const paymentId = computed(() => String(route.query.paymentId || ''))
const isDemoGateway = computed(() => route.query.demo === '1')

const payment = ref<{ planId: string; amount: number; currency: string; status: string } | null>(null)
const loading = ref(true)
const notFound = ref(false)
const acting = ref(false)

onMounted(async () => {
  if (!isDemoGateway.value || !paymentId.value) {
    loading.value = false
    return
  }
  try {
    const res = await getPayment(paymentId.value)
    payment.value = res.payment
    if (res.payment.status === 'paid') {
      // 已支付过：直接回返回页
      navigateToReturn('success')
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

function navigateToReturn(status: 'success' | 'cancel') {
  router.push(localePath(`/payment/return?paymentId=${paymentId.value}&status=${status}`))
}

async function onPay() {
  acting.value = true
  try {
    await demoPay(paymentId.value, 'pay')
    navigateToReturn('success')
  } catch (e) {
    console.error(e)
    acting.value = false
  }
}

async function onCancel() {
  acting.value = true
  try {
    await demoPay(paymentId.value, 'cancel')
    navigateToReturn('cancel')
  } catch (e) {
    console.error(e)
    navigateToReturn('cancel')
  }
}

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
  title: t('payment.simulate.title'),
  meta: [{ name: 'robots', content: 'noindex, follow' }]
})
</script>

<template>
  <div class="min-h-[70vh] bg-slate-50">
    <div class="container-pg max-w-lg py-16">
      <!-- 未登录 -->
      <div v-if="loaded && !user" class="card-pg p-8 text-center">
        <h1 class="font-serif text-2xl font-bold text-ink">{{ t('payment.simulate.signInFirst') }}</h1>
        <NuxtLink :to="localePath('/sign-in')" class="btn-primary mt-6 inline-flex">
          {{ t('payment.simulate.signIn') }}
        </NuxtLink>
      </div>

      <!-- 非 Demo 网关入口（真实 Stripe 模式下本页不可用） -->
      <div v-else-if="!isDemoGateway" class="card-pg p-8 text-center">
        <h1 class="font-serif text-2xl font-bold text-ink">{{ t('payment.simulate.unavailable') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ t('payment.simulate.unavailableHint') }}</p>
        <NuxtLink :to="localePath('/')" class="btn-outline mt-6 inline-flex">
          {{ t('payment.simulate.backHome') }}
        </NuxtLink>
      </div>

      <!-- 记录不存在 -->
      <div v-else-if="notFound" class="card-pg p-8 text-center">
        <h1 class="font-serif text-2xl font-bold text-ink">{{ t('payment.simulate.notFound') }}</h1>
        <NuxtLink :to="localePath('/')" class="btn-outline mt-6 inline-flex">
          {{ t('payment.simulate.backHome') }}
        </NuxtLink>
      </div>

      <!-- 加载中 -->
      <div v-else-if="loading" class="card-pg p-8 text-center text-sm text-muted">
        {{ t('payment.simulate.loading') }}
      </div>

      <!-- 收银台 -->
      <div v-else-if="payment" class="card-pg overflow-hidden">
        <div class="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">
            {{ t('payment.simulate.gateway') }}
          </p>
          <h1 class="mt-1 font-serif text-xl font-bold text-ink">{{ t('payment.simulate.title') }}</h1>
        </div>

        <div class="p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm text-muted">{{ t('payment.simulate.merchant') }}</p>
              <p class="font-semibold text-ink">PhotoGov</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-muted">{{ t('payment.simulate.amount') }}</p>
              <p class="font-serif text-2xl font-bold text-ink">{{ amountText }}</p>
            </div>
          </div>

          <dl class="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('payment.simulate.item') }}</dt>
              <dd class="font-medium text-ink">
                {{ plan ? t(plan.i18n) : payment.planId }}
                <span class="text-muted">({{ plan?.interval === 'year' ? t('profile.subscription.annual') : t('profile.subscription.monthly') }})</span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('payment.simulate.email') }}</dt>
              <dd class="font-medium text-ink">{{ user?.email }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('payment.return.paymentId') }}</dt>
              <dd class="font-mono text-xs text-ink">{{ paymentId }}</dd>
            </div>
          </dl>

          <!-- 模拟卡信息（不收集任何真实数据） -->
          <div class="mt-4 rounded-xl border border-slate-200 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">
              {{ t('payment.simulate.cardTitle') }}
            </p>
            <div class="mt-2 flex items-center gap-3">
              <div class="grid h-9 w-12 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-muted">
                CARD
              </div>
              <span class="text-sm font-medium text-ink">{{ t('payment.simulate.cardNumber') }}</span>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button
              class="btn-primary flex-1"
              type="button"
              :disabled="acting"
              @click="onPay"
            >
              {{ acting ? t('payment.simulate.processing') : t('payment.simulate.pay') }}
            </button>
            <button
              class="btn-outline flex-1"
              type="button"
              :disabled="acting"
              @click="onCancel"
            >
              {{ t('payment.simulate.cancel') }}
            </button>
          </div>

          <p class="mt-4 text-center text-xs text-muted">
            {{ t('payment.simulate.demoNotice') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

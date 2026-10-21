<script setup lang="ts">
// /profile/subscription —— 订阅详情 + 自动续费 + 支付方式 + 升级（真实支付链路）
// 免费用户：选择套餐 → createCheckout（服务端定价）→ 跳转网关收银台
// （Demo 网关为 /payment/simulate，配置 Stripe 密钥后为 Stripe Checkout）。
// 高级用户：展示真实订阅明细（周期/费用/下次扣费/支付方式）+ 支付记录。
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useBreadcrumbLd } from '~/composables/useBreadcrumbLd'
import { useLocalePath } from '#imports'
import { PLANS, planStatus } from '~/utils/plans'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()
const { setAutoRenewal, cancelSubscription, createCheckout, myPayments } = useApi()

// BreadcrumbList 结构化数据：首页 → 个人中心 → 订阅管理
const { scripts: breadcrumbScripts } = useBreadcrumbLd(
  computed(() => [
    { name: t('nav.home'), to: localePath('/') },
    { name: t('profile.title'), to: localePath('/profile') },
    { name: t('profile.nav.subscription'), to: localePath('/profile/subscription') }
  ])
)
useHead({ title: t('profile.subscription.title'), script: breadcrumbScripts })

const status = computed(() => planStatus(user.value))
const isPremium = computed(() => status.value.isPremium)
const premiumPlans = computed(() => PLANS.filter((p) => p.id !== 'free'))
const features = computed(() =>
  (PLANS.find((p) => p.id === 'premium_monthly')?.features || []).map((f) => t(f))
)

// 支付记录（高级用户展示周期/支付方式/历史）
const payments = ref<any[]>([])
const latestPaid = computed(() => payments.value.find((p) => p.status === 'paid') || null)
const isAnnual = computed(() => latestPaid.value?.planId === 'premium_annual')
const currentPlan = computed(() =>
  PLANS.find((p) => p.id === (latestPaid.value?.planId || 'premium_monthly'))
)

onMounted(async () => {
  if (!user.value) return
  try {
    const res = await myPayments()
    payments.value = res.payments || []
  } catch (e) {
    console.error(e)
  }
})

const savingRenewal = ref(false)
async function onToggleRenewal() {
  if (!user.value) return
  savingRenewal.value = true
  try {
    const res = await setAutoRenewal(!user.value.autoRenewal)
    if (user.value && res.user) user.value.autoRenewal = res.user.autoRenewal
  } catch (e) {
    console.error(e)
  } finally {
    savingRenewal.value = false
  }
}

const cancelling = ref(false)
async function onCancel() {
  cancelling.value = true
  try {
    const res = await cancelSubscription()
    if (user.value && res.user) {
      user.value.plan = res.user.plan
      user.value.planExpiresAt = res.user.planExpiresAt
    }
  } catch (e) {
    console.error(e)
  } finally {
    cancelling.value = false
  }
}

// 结账：跳转网关收银台
const checkingOut = ref<string | null>(null)
const checkoutError = ref('')
async function onUpgrade(planId: string) {
  checkingOut.value = planId
  checkoutError.value = ''
  try {
    const res = await createCheckout(planId, locale.value)
    if (res?.paymentUrl) {
      window.location.href = res.paymentUrl
      return
    }
    checkoutError.value = t('profile.subscription.checkoutFailed')
  } catch (e: any) {
    console.error(e)
    checkoutError.value = t('profile.subscription.checkoutFailed')
  } finally {
    checkingOut.value = null
  }
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return iso
  }
}

const fmtMoney = (amount: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat(locale.value, { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    paid: t('profile.subscription.statusPaid'),
    pending: t('profile.subscription.statusPending'),
    failed: t('profile.subscription.statusFailed'),
    cancelled: t('profile.subscription.statusCancelled'),
    refunded: t('profile.subscription.statusRefunded')
  }
  return map[s] || s
}
</script>

<template>
  <section class="card-pg p-6">
    <div class="flex items-center justify-between gap-3">
      <h2 class="font-serif text-xl font-bold text-ink">{{ t('profile.subscription.title') }}</h2>
      <span
        v-if="isPremium"
        class="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
      >
        {{ t('profile.subscription.active') }}
      </span>
    </div>

    <!-- ============ 免费用户：套餐选择 + 结账 ============ -->
    <div v-if="!isPremium" class="mt-5">
      <p class="text-sm text-muted">{{ t('profile.subscription.noneDesc') }}</p>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div
          v-for="plan in premiumPlans"
          :key="plan.id"
          class="rounded-xl border border-slate-200 p-5"
          :class="plan.popular ? 'border-accent ring-1 ring-accent/30' : ''"
        >
          <div class="flex items-center justify-between">
            <p class="font-semibold text-ink">{{ t('plans.premium') }}</p>
            <span
              v-if="plan.popular"
              class="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent"
            >
              {{ t('plans.savePercent', { percent: plan.savePercent }) }}
            </span>
          </div>
          <p class="mt-2 font-serif text-2xl font-bold text-ink">{{ fmtMoney(plan.price) }}</p>
          <p class="text-xs text-muted">
            {{ plan.interval === 'year' ? t('profile.subscription.perYear') : t('profile.subscription.perMonth') }}
          </p>
          <button
            class="btn-primary mt-4 w-full"
            type="button"
            :disabled="checkingOut === plan.id"
            @click="onUpgrade(plan.id)"
          >
            {{ checkingOut === plan.id ? t('profile.subscription.redirecting') : t('profile.subscription.upgradeCta') }}
          </button>
        </div>
      </div>

      <p v-if="checkoutError" class="mt-3 text-sm text-red-600">{{ checkoutError }}</p>

      <!-- 权益 -->
      <div class="mt-6">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('profile.subscription.features') }}
        </h3>
        <ul class="mt-3 grid gap-2 sm:grid-cols-2">
          <li v-for="(f, i) in features" :key="i" class="flex items-center gap-2 text-sm text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-accent">
              <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ f }}
          </li>
        </ul>
      </div>

      <!-- 支付记录（若有历史） -->
      <div v-if="payments.length" class="mt-8">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('profile.subscription.history') }}
        </h3>
        <ul class="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
          <li v-for="p in payments" :key="p.id" class="flex items-center justify-between gap-3 p-3 text-sm">
            <div class="min-w-0">
              <p class="truncate font-medium text-ink">{{ p.id }}</p>
              <p class="text-xs text-muted">{{ fmtDate(p.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-muted">{{ fmtMoney(p.amount, p.currency) }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-muted'"
              >
                {{ statusLabel(p.status) }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- ============ 高级用户：订阅详情 ============ -->
    <div v-else class="mt-5 space-y-6">
      <dl class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl bg-slate-50 p-4">
          <dt class="text-xs uppercase tracking-wide text-muted">{{ t('profile.subscription.period') }}</dt>
          <dd class="mt-1 font-medium text-ink">
            {{ isAnnual ? t('profile.subscription.annual') : t('profile.subscription.monthly') }}
          </dd>
        </div>
        <div class="rounded-xl bg-slate-50 p-4">
          <dt class="text-xs uppercase tracking-wide text-muted">{{ t('profile.subscription.fee') }}</dt>
          <dd class="mt-1 font-medium text-ink">
            {{ currentPlan ? fmtMoney(currentPlan.price) : '—' }}
            <span class="text-sm text-muted">
              / {{ isAnnual ? t('profile.subscription.annual').toLowerCase() : t('profile.subscription.monthly').toLowerCase() }}
            </span>
          </dd>
        </div>
        <div class="rounded-xl bg-slate-50 p-4">
          <dt class="text-xs uppercase tracking-wide text-muted">{{ t('profile.subscription.card') }}</dt>
          <dd class="mt-1 font-medium text-ink">
            {{ latestPaid?.method || t('profile.subscription.noMethod') }}
          </dd>
        </div>
        <div class="rounded-xl bg-slate-50 p-4">
          <dt class="text-xs uppercase tracking-wide text-muted">{{ t('profile.subscription.nextDebit') }}</dt>
          <dd class="mt-1 font-medium text-ink">{{ fmtDate(status.expiresAt) }}</dd>
        </div>
      </dl>

      <!-- 权益 -->
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('profile.subscription.features') }}
        </h3>
        <ul class="mt-3 grid gap-2 sm:grid-cols-2">
          <li v-for="(f, i) in features" :key="i" class="flex items-center gap-2 text-sm text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-accent">
              <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ f }}
          </li>
        </ul>
      </div>

      <!-- 自动续费开关 -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
        <div>
          <p class="font-medium text-ink">{{ t('profile.subscription.autoRenewal') }}</p>
          <p class="mt-1 text-xs text-muted">{{ t('profile.subscription.autoRenewalDesc') }}</p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="user?.autoRenewal ? 'true' : 'false'"
          class="relative h-7 w-12 rounded-full transition"
          :class="user?.autoRenewal ? 'bg-accent' : 'bg-slate-300'"
          :disabled="savingRenewal"
          @click="onToggleRenewal"
        >
          <span
            class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition"
            :class="user?.autoRenewal ? 'left-6' : 'left-1'"
          />
        </button>
      </div>

      <!-- 支付方式（真实记录） -->
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('profile.subscription.paymentMethods') }}
        </h3>
        <div v-if="latestPaid" class="mt-2 flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div class="flex items-center gap-3">
            <div class="grid h-9 w-12 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-muted">
              {{ latestPaid.provider === 'stripe' ? 'STRIPE' : 'CARD' }}
            </div>
            <span class="text-sm font-medium text-ink">{{ latestPaid.method || t('profile.subscription.noMethod') }}</span>
          </div>
          <span class="text-xs text-muted">{{ fmtDate(latestPaid.paidAt) }}</span>
        </div>
        <p v-else class="mt-2 rounded-xl border border-slate-200 p-4 text-sm text-muted">
          {{ t('profile.subscription.noMethod') }}
        </p>
      </div>

      <!-- 支付记录 -->
      <div v-if="payments.length">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('profile.subscription.history') }}
        </h3>
        <ul class="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
          <li v-for="p in payments" :key="p.id" class="flex items-center justify-between gap-3 p-3 text-sm">
            <div class="min-w-0">
              <p class="truncate font-medium text-ink">{{ p.id }}</p>
              <p class="text-xs text-muted">{{ fmtDate(p.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-muted">{{ fmtMoney(p.amount, p.currency) }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-muted'"
              >
                {{ statusLabel(p.status) }}
              </span>
            </div>
          </li>
        </ul>
      </div>

      <NuxtLink :to="localePath('/prices')" class="btn-outline inline-flex">
        {{ t('profile.subscription.managePlans') }}
      </NuxtLink>

      <div>
        <button
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          type="button"
          :disabled="cancelling"
          @click="onCancel"
        >
          {{ cancelling ? t('profile.subscription.cancelling') : t('profile.subscription.cancel') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /profile/subscription —— 订阅详情 + 自动续费 + 支付方式 + 升级/取消
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useLocalePath } from '#imports'
import { PLANS, planStatus } from '~/utils/plans'

const { t, locale } = useI18n()
const router = useRouter()
const localePath = useLocalePath()
const { user } = useAuth()
const { setAutoRenewal, cancelSubscription } = useApi()

const status = computed(() => planStatus(user.value))
const isPremium = computed(() => status.value.isPremium)
const premiumPlan = PLANS.find((p) => p.id === 'premium_monthly')
const features = computed(() =>
  (premiumPlan?.features || []).map((f) => t(f))
)

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

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return iso
  }
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

    <!-- 免费用户：升级引导 -->
    <div v-if="!isPremium" class="mt-5">
      <div class="rounded-xl bg-slate-50 p-5">
        <p class="font-medium text-ink">{{ t('profile.subscription.none') }}</p>
        <p class="mt-1 text-sm text-muted">{{ t('profile.subscription.noneDesc') }}</p>
        <NuxtLink :to="localePath('/prices')" class="btn-primary mt-4 inline-flex">
          {{ t('profile.subscription.getPremium') }}
        </NuxtLink>
      </div>

      <div class="mt-6">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('profile.subscription.paymentMethods') }}
        </h3>
        <p class="mt-2 rounded-xl border border-slate-200 p-4 text-sm text-muted">
          {{ t('profile.subscription.noMethod') }}
        </p>
      </div>
    </div>

    <!-- 高级用户：订阅详情 -->
    <div v-else class="mt-5 space-y-6">
      <dl class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl bg-slate-50 p-4">
          <dt class="text-xs uppercase tracking-wide text-muted">{{ t('profile.subscription.period') }}</dt>
          <dd class="mt-1 font-medium text-ink">{{ t('profile.subscription.monthly') }}</dd>
        </div>
        <div class="rounded-xl bg-slate-50 p-4">
          <dt class="text-xs uppercase tracking-wide text-muted">{{ t('profile.subscription.fee') }}</dt>
          <dd class="mt-1 font-medium text-ink">
            ${{ premiumPlan?.price?.toFixed(2) }} / {{ t('profile.subscription.monthly').toLowerCase() }}
          </dd>
        </div>
        <div class="rounded-xl bg-slate-50 p-4">
          <dt class="text-xs uppercase tracking-wide text-muted">{{ t('profile.subscription.card') }}</dt>
          <dd class="mt-1 font-medium text-ink">{{ t('profile.subscription.cardMasked') }}</dd>
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

      <!-- 支付方式 -->
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('profile.subscription.paymentMethods') }}
        </h3>
        <div class="mt-2 flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div class="flex items-center gap-3">
            <div class="grid h-9 w-12 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-muted">
              CARD
            </div>
            <span class="text-sm font-medium text-ink">{{ t('profile.subscription.cardMasked') }}</span>
          </div>
        </div>
      </div>

      <button
        class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        type="button"
        :disabled="cancelling"
        @click="onCancel"
      >
        {{ cancelling ? t('profile.subscription.cancelling') : t('profile.subscription.cancel') }}
      </button>
    </div>
  </section>
</template>

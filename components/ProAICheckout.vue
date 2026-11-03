<script setup lang="ts">
// Pro AI Photos 结账门控弹窗（+9 PRO AI Photos，$6.90，演示模式即时付费）
// 镜像 PhotoCheckout：未登录内联登录/注册，已登录直接付款。
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { PRO_AI_PRICE, formatPrice } from '~/utils/pricing'

const props = defineProps<{
  open: boolean
  count?: number
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'close'): void
  (e: 'subscribe'): void
}>()

const { t, locale } = useI18n()
const { user, login, register } = useAuth()
const { proAiCheckout } = useApi()

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN'
}

const qty = computed(() => Math.min(Math.max(props.count || 9, 1), 30))
const priceLabel = computed(
  () => formatPrice(PRO_AI_PRICE, LOCALE_MAP[String(locale.value)] || 'en-US')
)

const step = computed(() => (user.value ? 'pay' : 'auth'))

// ---- 内联账户校验（未登录时）----
const authMode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const authBusy = ref(false)
const authError = ref('')
const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

async function submitAuth() {
  if (!emailOk.value) { authError.value = t('checkout.authInvalidEmail'); return }
  if (password.value.length < 8) { authError.value = t('checkout.authPwShort'); return }
  authBusy.value = true
  authError.value = ''
  try {
    if (authMode.value === 'signin') {
      const res = await login(email.value.trim(), password.value)
      if (!res?.ok) authError.value = t('checkout.authFail')
    } else {
      const name = email.value.trim().split('@')[0]
      const res = await register(name, email.value.trim(), password.value)
      if (!res?.ok) authError.value = t('checkout.authFail')
    }
  } catch (e: any) {
    const msg = e?.data?.statusMessage || e?.message || ''
    if (msg.includes('EMAIL_TAKEN') || msg.includes('exists')) authError.value = t('checkout.authEmailTaken')
    else if (msg.includes('CREDENTIALS') || msg.includes('Invalid')) authError.value = t('checkout.authWrong')
    else authError.value = t('checkout.authFail')
  } finally {
    authBusy.value = false
  }
}

// ---- 付款（演示）----
const paying = ref(false)
const payError = ref('')

async function pay() {
  paying.value = true
  payError.value = ''
  try {
    const res = await proAiCheckout(qty.value)
    if (res?.ok) {
      emit('success')
    } else {
      payError.value = t('checkout.payFail')
    }
  } catch (e: any) {
    const msg = e?.data?.statusMessage || e?.message || ''
    if (msg.includes('UNAUTHORIZED')) {
      authError.value = t('checkout.sessionLost')
      return
    }
    payError.value = t('checkout.payFail')
  } finally {
    paying.value = false
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      @click.self="close"
    >
      <div
        class="relative w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="absolute right-4 top-4 text-slate-400 duration-200 hover:text-slate-600"
          :aria-label="t('checkout.close')"
          @click="close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>

        <!-- 步骤 1：账户校验 -->
        <div v-if="step === 'auth'" class="space-y-5">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-[#212532]">{{ t('proAi.authTitle') }}</h2>
            <p class="text-sm text-slate-500">{{ t('proAi.authSub') }}</p>
          </div>

          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-[13px] font-medium text-[#5A5A5A]" for="pai-email">{{ t('checkout.email') }}</label>
              <input
                id="pai-email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="example@gmail.com"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm duration-200 focus:border-[#315FB6]"
              >
            </div>
            <div class="space-y-1">
              <label class="text-[13px] font-medium text-[#5A5A5A]" for="pai-pw">{{ t('checkout.password') }}</label>
              <input
                id="pai-pw"
                v-model="password"
                type="password"
                autocomplete="current-password"
                :placeholder="t('checkout.passwordPh')"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm duration-200 focus:border-[#315FB6]"
                @keyup.enter="submitAuth"
              >
            </div>
          </div>

          <p v-if="authError" class="text-sm text-red-600">{{ authError }}</p>

          <button
            type="button"
            class="w-full rounded-lg bg-[#094DBC] px-4 py-3 text-sm font-semibold text-white duration-200 hover:opacity-80 disabled:opacity-50"
            :disabled="authBusy"
            @click="submitAuth"
          >
            {{ authBusy ? t('checkout.pleaseWait') : (authMode === 'signin' ? t('checkout.loginBtn') : t('checkout.signUpBtn')) }}
          </button>

          <p class="text-center text-[13px] text-slate-500">
            <template v-if="authMode === 'signin'">{{ t('checkout.noAccount') }}
              <a class="cursor-pointer text-[#094DBC] underline duration-200 hover:opacity-75" @click="authMode = 'signup'">{{ t('checkout.signUpNow') }}</a>
            </template>
            <template v-else>{{ t('checkout.haveAccount') }}
              <a class="cursor-pointer text-[#094DBC] underline duration-200 hover:opacity-75" @click="authMode = 'signin'">{{ t('checkout.loginNow') }}</a>
            </template>
          </p>
        </div>

        <!-- 步骤 2：结账 -->
        <div v-else class="space-y-5">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-[#212532]">{{ t('proAi.checkoutTitle') }}</h2>
            <p class="text-sm text-slate-500">{{ t('proAi.checkoutSub') }}</p>
          </div>

          <!-- 订单摘要 -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500">{{ t('proAi.bundle') }}</span>
              <span class="font-medium text-[#212532]">{{ t('proAi.bundleName', { count: qty }) }}</span>
            </div>
            <div class="mt-3 flex items-end justify-between border-t border-slate-200 pt-3">
              <span class="text-sm text-slate-500">{{ t('checkout.total') }}</span>
              <span class="text-2xl font-bold text-[#094DBC]">{{ priceLabel }}</span>
            </div>
          </div>

          <p v-if="payError" class="text-sm text-red-600">{{ payError }}</p>

          <button
            type="button"
            class="w-full rounded-lg bg-[#094DBC] px-4 py-3 text-sm font-semibold text-white duration-200 hover:opacity-80 disabled:opacity-50"
            :disabled="paying"
            @click="pay"
          >
            {{ paying ? t('checkout.processing') : t('proAi.payBtn', { price: priceLabel }) }}
          </button>

          <button
            type="button"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-[#212532] duration-200 hover:bg-slate-50"
            @click="emit('subscribe')"
          >
            {{ t('checkout.subscribeCta') }}
          </button>

          <p class="text-center text-[11px] leading-relaxed text-slate-400">
            {{ t('proAi.demoNote') }}
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

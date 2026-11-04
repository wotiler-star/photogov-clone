<script setup lang="ts">
// 证件照下载结账门控弹窗（复刻 photogov.net Upload→Processing→Checkout→Download 商业模型）
// 演示模式：服务端 photoCheckout 即时标记为已付款并解锁下载，无真实扣款。
// 未登录时在弹窗内联登录/注册（等价于原站 checkout 前的账户校验）。
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { priceForCountry, formatPrice } from '~/utils/pricing'
import { useVerifyGate, storeVerifyState } from '~/composables/useVerification'

const props = defineProps<{
  open: boolean
  country: string
  docName: string
  docSlug: string
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'close'): void
  (e: 'subscribe'): void
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { user, login, register } = useAuth()
const { photoCheckout } = useApi()

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN'
}

const price = computed(() => priceForCountry(props.country || 'US'))
const priceLabel = computed(
  () => formatPrice(price.value, LOCALE_MAP[String(locale.value)] || 'en-US')
)

// 验证门控由服务端 403 触发（未在前端猜测 SMTP 配置），pay 为函数声明可安全前向引用
const {
  needsVerify, devLink, mailOff,
  info: verifyInfo, busy: verifyBusy,
  isVerifyBlocked, resend: resendVerify, cont: continueAfterVerify
} = useVerifyGate(pay)

const step = computed(() => (!user.value ? 'auth' : needsVerify.value ? 'verify' : 'pay'))

// ---- 内联账户校验（未登录时）----
const authMode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const authBusy = ref(false)
const authError = ref('')
const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

async function submitAuth() {
  if (!emailOk.value) { authError.value = t('checkout.authInvalidEmail'); return }
  // 与服务端 PASSWORD_RULE 一致：大小写字母 + 数字 + 符号，至少 8 位（仅注册时校验，登录不限制历史密码）
  if (authMode.value === 'signup' && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password.value)) {
    authError.value = t('checkout.authPwShort'); return
  }
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
      else {
        storeVerifyState(res, email.value.trim())
        // 注册响应已带回验证链接（演示/未配 SMTP 时 devLink 非空）：立即展示在验证引导里，
        // 避免用户刚注册完还要再点一次「重发验证码邮件」才能拿到链接。
        if (res.devLink) devLink.value = res.devLink
        if (res.mailDelivered === false) mailOff.value = true
      }
    }
  } catch (e: any) {
    const msg = e?.data?.statusMessage || e?.message || ''
    if (msg.includes('EMAIL_TAKEN') || msg.includes('exists')) authError.value = t('checkout.authEmailTaken')
    else if (msg.includes('PASSWORD') || msg.includes('WEAK')) authError.value = t('checkout.authPwShort')
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
    const res = await photoCheckout(
      props.country || 'US',
      props.docName || 'ID photo',
      props.docSlug || ''
    )
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
    // 未验证邮箱：切到验证引导，而不是笼统报「支付失败」
    if (isVerifyBlocked(e)) return
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
        <!-- 关闭 -->
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
            <h2 class="text-xl font-semibold text-[#212532]">{{ t('checkout.authTitle') }}</h2>
            <p class="text-sm text-slate-500">{{ t('checkout.authSub') }}</p>
          </div>

          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-[13px] font-medium text-[#5A5A5A]" for="co-email">{{ t('checkout.email') }}</label>
              <input
                id="co-email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="example@gmail.com"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm duration-200 focus:border-[#315FB6]"
              >
            </div>
            <div class="space-y-1">
              <label class="text-[13px] font-medium text-[#5A5A5A]" for="co-pw">{{ t('checkout.password') }}</label>
              <input
                id="co-pw"
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

        <!-- 步骤 2：邮箱未验证（服务端 403 触发） -->
        <div v-else-if="step === 'verify'" class="space-y-4">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-[#212532]">{{ t('verify.bannerTitle') }}</h2>
            <p class="text-sm text-slate-500">{{ t('verify.checkoutBlocked') }}</p>
          </div>

          <div v-if="mailOff" class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-left">
            <p class="text-sm font-medium text-amber-800">{{ t('verify.mailOff') }}</p>
            <p class="mt-1 text-xs leading-relaxed text-amber-700">{{ t('verify.mailOffHint') }}</p>
          </div>
          <p v-if="verifyInfo" class="text-sm" :class="mailOff ? 'text-amber-700' : 'text-emerald-700'">{{ verifyInfo }}</p>

          <a
            v-if="devLink"
            :href="devLink"
            class="block rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-[#094DBC] hover:bg-slate-50"
          >
            {{ t('verify.openLink') }}
          </a>
          <button
            type="button"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-[#212532] duration-200 hover:bg-slate-50 disabled:opacity-50"
            :disabled="verifyBusy"
            @click="resendVerify"
          >
            {{ verifyBusy ? t('verify.resending') : t('verify.resend') }}
          </button>
          <button
            type="button"
            class="w-full rounded-lg bg-[#094DBC] px-4 py-3 text-sm font-semibold text-white duration-200 hover:opacity-80 disabled:opacity-50"
            :disabled="verifyBusy"
            @click="continueAfterVerify"
          >
            {{ t('verify.continue') }}
          </button>
          <NuxtLink
            :to="localePath('/verify-email?pending=1')"
            class="block text-center text-[13px] text-[#094DBC] underline hover:opacity-75"
            @click="close"
          >
            {{ t('verify.goVerify') }}
          </NuxtLink>
        </div>

        <!-- 步骤 3：结账 -->
        <div v-else class="space-y-5">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-[#212532]">{{ t('checkout.title') }}</h2>
            <p class="text-sm text-slate-500">{{ t('checkout.sub') }}</p>
          </div>

          <!-- 订单摘要 -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500">{{ t('checkout.doc') }}</span>
              <span class="font-medium text-[#212532]">{{ docName || 'ID photo' }}</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-sm">
              <span class="text-slate-500">{{ t('checkout.region') }}</span>
              <span class="font-medium text-[#212532]">{{ price.region }}</span>
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
            {{ paying ? t('checkout.processing') : t('checkout.payBtn', { price: priceLabel }) }}
          </button>

          <button
            type="button"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-[#212532] duration-200 hover:bg-slate-50"
            @click="emit('subscribe')"
          >
            {{ t('checkout.subscribeCta') }}
          </button>

          <p class="text-center text-[11px] leading-relaxed text-slate-400">
            {{ t('checkout.demoNote') }}
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

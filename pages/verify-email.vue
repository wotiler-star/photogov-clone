<script setup lang="ts">
// 邮箱验证页：
//   ?token=xxx  —— 打开邮件链接后完成验证
//   ?pending=1  —— 激活策略引导页（注册后 / 个人中心 / 结账被拦截时进入）
// 邮件未送达时明确告知用户，不再显示「已发送」这类无法兑现的提示。
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { verifyEmail, resendVerification } = useApi()
const { user, refresh } = useAuth()

type Status = 'loading' | 'ok' | 'error' | 'pending'
const isPending = route.query.pending === '1'
const token = String(route.query.token || '')
const status = ref<Status>(isPending ? 'pending' : 'loading')

const email = ref('')
const devLink = ref('')
const mailOff = ref(false)
const info = ref('')
const busy = ref(false)

onMounted(async () => {
  if (isPending) {
    try {
      email.value = sessionStorage.getItem('pg_verify_email') || user.value?.email || ''
      devLink.value = sessionStorage.getItem('pg_verify_link') || ''
      mailOff.value = sessionStorage.getItem('pg_verify_mail') === 'false'
    } catch {
      email.value = user.value?.email || ''
    }
    return
  }
  if (!token) {
    status.value = 'error'
    return
  }
  try {
    await verifyEmail(token)
    status.value = 'ok'
  } catch {
    status.value = 'error'
  }
})

async function onResend() {
  busy.value = true
  info.value = ''
  try {
    const res = await resendVerification()
    devLink.value = res.devLink || ''
    mailOff.value = res.mailDelivered === false
    info.value = res.mailDelivered === false ? t('verify.mailOff') : t('verify.resent')
    try {
      sessionStorage.setItem('pg_verify_link', devLink.value)
      sessionStorage.setItem('pg_verify_mail', String(!mailOff.value))
    } catch { /* 隐私模式下忽略 */ }
  } catch {
    mailOff.value = true
    info.value = t('verify.mailOff')
  } finally {
    busy.value = false
  }
}

async function onContinue() {
  busy.value = true
  info.value = ''
  try {
    await refresh()
    if (user.value?.emailVerified) await router.push(localePath('/profile'))
    else info.value = t('verify.notVerifiedYet')
  } finally {
    busy.value = false
  }
}

useHead({ title: t('verify.title') })
</script>

<template>
  <div class="container-pg py-16">
    <div class="card-pg mx-auto max-w-md p-8 text-center">
      <template v-if="status === 'loading'">
        <p class="text-muted">{{ $t('verify.checking') }}</p>
      </template>

      <template v-else-if="status === 'ok'">
        <div class="mb-4 text-4xl">✅</div>
        <h1 class="font-serif text-2xl font-bold text-ink">{{ $t('verify.verified') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ $t('verify.verifiedText') }}</p>
        <NuxtLink :to="localePath('/profile')" class="btn-primary mt-6 inline-flex">{{ $t('verify.goAccount') }}</NuxtLink>
      </template>

      <!-- 激活引导：注册成功后、结账被门控拦截时都会落到这里 -->
      <template v-else-if="status === 'pending'">
        <svg class="mx-auto mb-4 h-10 w-10 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" />
        </svg>
        <h1 class="font-serif text-2xl font-bold text-ink">{{ $t('verify.pendingTitle') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ email ? $t('verify.pendingText', { email }) : $t('verify.bannerText') }}</p>

        <div v-if="mailOff" class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-left">
          <p class="text-sm font-medium text-amber-800">{{ $t('verify.mailOff') }}</p>
          <p class="mt-1 text-xs leading-relaxed text-amber-700">{{ $t('verify.mailOffHint') }}</p>
        </div>

        <p v-if="info" class="mt-3 text-sm" :class="mailOff ? 'text-amber-700' : 'text-emerald-700'">{{ info }}</p>

        <a v-if="devLink" :href="devLink" class="btn-outline mt-4 inline-flex text-sm">{{ $t('verify.openLink') }}</a>

        <button
          type="button"
          class="btn-outline mt-4 w-full justify-center text-sm disabled:opacity-50"
          :disabled="busy"
          @click="onResend"
        >
          {{ busy ? $t('verify.resending') : $t('verify.resend') }}
        </button>
        <button
          type="button"
          class="btn-primary mt-3 w-full justify-center text-sm disabled:opacity-50"
          :disabled="busy"
          @click="onContinue"
        >
          {{ $t('verify.continue') }}
        </button>
        <NuxtLink :to="localePath('/profile')" class="mt-4 inline-block text-xs text-muted underline hover:text-ink">
          {{ $t('verify.goAccount') }}
        </NuxtLink>
      </template>

      <template v-else>
        <div class="mb-4 text-4xl">⚠️</div>
        <h1 class="font-serif text-2xl font-bold text-ink">{{ $t('verify.expired') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ $t('verify.expiredText') }}</p>
        <NuxtLink :to="localePath('/sign-in')" class="btn-outline mt-6 inline-flex">{{ $t('verify.backToSignIn') }}</NuxtLink>
      </template>
    </div>
  </div>
</template>

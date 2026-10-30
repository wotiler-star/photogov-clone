<script setup lang="ts">
/**
 * 登录 / 注册 / 重置密码页（对标原站 /sign-in/，SSR + CDP 实证）。
 *
 * SEEN 结构（原站三视图均为 /sign-in/ 上的客户端状态切换，URL 不变）：
 *   外壳 bg-[#F1F5F9] > container pt-20 pb-[120px]
 *   白卡 relative max-w-[700px] py-10 px-[150px] bg-white rounded-lg max-lg:px-4 mx-auto
 *   ┌ Sign in 视图：login.svg 图标 + H1 + 副标题 + 用户数徽章
 *   │              Email + Password（眼睛切换）+ 蓝色 Log in
 *   │              下方：「Don't have an account yet? Sign up now」
 *   │                    hr
 *   │                    「Forgot your password? Reset password」
 *   ├ Registration 视图：add-user.svg + H1 + 礼物副标题 + 徽章
 *   │              Email + 蓝色 Sign up + 条款声明 + 「Log in now」
 *   └ Reset password 视图：← Back 按钮 + password.svg + H1 + 说明
 *                  Email（占位符 Your email）+ Send me new password
 *                  （邮箱为空/非法时按钮灰色 #D9DBE0，合法时蓝色 #094DBC）
 *
 * 与本站能力相关的两处适配（详见 .rea/f8-auth-findings.md）：
 *   1. 注册视图增加 Password 字段——原站为纯邮箱流程（邮件验证码设密），
 *      本站 register 接口需要 (name, email, password)，name 取邮箱前缀。
 *   2. Reset 提交后展示「已发送指引」提示——原站后续为六位码视图（UNKNOWN），
 *      本站 forgotPassword 接口发送带 token 的链接（/reset-password）。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '~/composables/useAuth'
import { useRichText } from '~/composables/useRichText'

type View = 'signin' | 'signup' | 'reset'

const { t } = useI18n()
const router = useRouter()
const { rich } = useRichText()
const { login, register, user, forgotPassword } = useAuth()

const view = ref<View>('signin')
const email = ref('')
const password = ref('')
const showPw = ref(false)
const error = ref('')
const info = ref('')
const busy = ref(false)

// 已登录访问 /sign-in 时跳转账户页（原站 auth-gated 行为）
onMounted(() => {
  if (user.value) router.replace('/account')
})

const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
// 原站实证：reset 按钮在邮箱合法时才变蓝（未禁用，点击空邮箱仍走校验）
const resetBtnClass = computed(() =>
  emailOk.value
    ? 'px-4 py-3 rounded text-white text-[14px] duration-200 bg-[#094DBC] hover:opacity-75 w-full'
    : 'px-4 py-3 rounded text-white text-[14px] duration-200 bg-[#D9DBE0] w-full',
)

const ICONS: Record<View, string> = {
  signin: '/img/auth/login.svg',
  signup: '/img/auth/add-user.svg',
  reset: '/img/auth/password.svg',
}

function switchView(v: View) {
  view.value = v
  error.value = ''
  info.value = ''
  password.value = ''
  showPw.value = false
}

function mapError(e: any): string {
  const msg = e?.data?.statusMessage || e?.message || ''
  if (msg.includes('EMAIL_TAKEN') || msg.includes('exists')) return t('signin.emailExists')
  if (msg.includes('INVALID_EMAIL') || msg.includes('email')) return t('signin.invalidEmail')
  if (msg.includes('PASSWORD') || msg.includes('Password')) return t('signin.passwordTooShort')
  if (msg.includes('CREDENTIALS') || msg.includes('Invalid')) return t('signin.wrongCredentials')
  return t('signin.genericError')
}

async function submitSignIn() {
  error.value = ''
  info.value = ''
  if (!emailOk.value) { error.value = t('signin.invalidEmail'); return }
  busy.value = true
  try {
    const res = await login(email.value.trim(), password.value)
    if (res.ok) await router.push('/account')
  } catch (e: any) {
    error.value = mapError(e)
  } finally {
    busy.value = false
  }
}

async function submitSignUp() {
  error.value = ''
  info.value = ''
  if (!emailOk.value) { error.value = t('signin.invalidEmail'); return }
  if (password.value.length < 8) { error.value = t('signin.passwordTooShort'); return }
  busy.value = true
  try {
    // name 取邮箱前缀（原站无 name 字段；本站接口需要）
    const name = email.value.trim().split('@')[0]
    const res = await register(name, email.value.trim(), password.value)
    if (res.ok) await router.push('/account')
  } catch (e: any) {
    error.value = mapError(e)
  } finally {
    busy.value = false
  }
}

async function submitReset() {
  error.value = ''
  info.value = ''
  if (!emailOk.value) { error.value = t('signin.invalidEmail'); return }
  busy.value = true
  try {
    await forgotPassword(email.value.trim())
    info.value = t('signin.resetSent')
  } catch {
    error.value = t('signin.genericError')
  } finally {
    busy.value = false
  }
}

function onSubmit() {
  if (view.value === 'signin') return submitSignIn()
  if (view.value === 'signup') return submitSignUp()
  return submitReset()
}

useHead({
  title: t('signin.metaTitle'),
  meta: [
    { name: 'description', content: t('signin.metaDesc') },
  ],
})
</script>

<template>
  <div class="bg-[#F1F5F9] text-[#212532]">
    <div class="container pt-20 pb-[120px]">
      <div class="relative mx-auto max-w-[700px] rounded-lg bg-white py-10 px-[150px] max-lg:px-4">
        <div class="space-y-[60px]">
          <div class="space-y-6">
            <div class="space-y-3">
              <!-- Reset 视图专属：左上角返回按钮（原站 mt-5 ml-5 + 左箭头） -->
              <button
                v-if="view === 'reset'"
                type="button"
                class="mt-5 ml-5 inline-flex items-center gap-x-1 duration-200 hover:opacity-75"
                @click="switchView('signin')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                <span class="text-[14px]">{{ $t('signin.back') }}</span>
              </button>

              <!-- 视图图标（原站：50px 圆角方块插图） -->
              <img
                :src="ICONS[view]"
                alt=""
                width="50"
                height="50"
                class="mx-auto block size-[50px] aspect-square rounded-lg"
                loading="lazy"
              >

              <h1 class="text-center text-[32px] font-semibold leading-[1.3] text-[#212532]">
                {{ view === 'signin' ? $t('signin.signInTitle') : view === 'signup' ? $t('signin.signUpTitle') : $t('signin.resetTitle') }}
              </h1>

              <p v-if="view === 'signin'" class="text-center">{{ $t('signin.signInSub') }}</p>
              <p v-else-if="view === 'signup'" class="text-center" v-html="rich($t('signin.signUpSub'))" />
              <p v-else class="text-center">{{ $t('signin.resetSub') }}</p>

              <!-- 用户数徽章（signin / signup 视图有；reset 视图无） -->
              <div v-if="view !== 'reset'" class="flex justify-center">
                <div class="rounded-full bg-[#0C7B381A] px-3 py-1 text-[14px] leading-[1.3] text-[#212532]">
                  <span><span class="font-semibold">{{ $t('signin.badgeCount') }}</span> {{ $t('signin.badgeText') }}</span>
                </div>
              </div>
            </div>

            <form class="space-y-6" @submit.prevent="onSubmit">
              <div class="space-y-4">
                <!-- Email -->
                <div class="space-y-2">
                  <label class="text-[13px] font-medium text-[#5A5A5A]" for="auth-email">{{ $t('signin.email') }}</label>
                  <div :class="view === 'reset' ? '' : 'relative'">
                    <input
                      id="auth-email"
                      v-model="email"
                      type="email"
                      autocomplete="email"
                      :placeholder="view === 'reset' ? $t('signin.resetEmailPh') : 'example@gmail.com'"
                      class="w-full rounded-[4px] border border-[#C4C4C4] bg-[#FFFFFF] px-4 py-3 text-[14px] duration-200 focus:border-[#315FB6] disabled:bg-[#EAEAEA]"
                    >
                  </div>
                </div>

                <!-- Password（signin / signup；reset 视图仅邮箱） -->
                <div v-if="view !== 'reset'" class="space-y-2">
                  <label class="text-[13px] font-medium text-[#5A5A5A]" for="auth-password">{{ $t('signin.password') }}</label>
                  <div class="relative">
                    <input
                      id="auth-password"
                      v-model="password"
                      :type="showPw ? 'text' : 'password'"
                      autocomplete="current-password"
                      :placeholder="$t('signin.passwordPh')"
                      class="w-full rounded-[4px] border border-[#C4C4C4] bg-[#FFFFFF] px-4 py-3 pr-10 text-[14px] duration-200 focus:border-[#315FB6] disabled:bg-[#EAEAEA]"
                    >
                    <!-- 眼睛切换（原站 eye-off 图标，absolute right-2.5 垂直居中） -->
                    <button
                      type="button"
                      class="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 cursor-pointer duration-200 hover:opacity-75"
                      :aria-label="showPw ? $t('signin.hidePassword') : $t('signin.showPassword')"
                      @click="showPw = !showPw"
                    >
                      <svg v-if="showPw" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-full" aria-hidden="true">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-full" aria-hidden="true">
                        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                        <path d="m2 2 20 20" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <p v-if="error" class="text-center text-[14px] text-red-600">{{ error }}</p>
              <p v-if="info" class="text-center text-[14px] text-[#498260]">{{ info }}</p>

              <!-- 提交按钮：signin/signup 恒蓝；reset 邮箱合法才蓝 -->
              <button
                v-if="view !== 'reset'"
                type="submit"
                class="w-full rounded bg-[#094DBC] px-4 py-3 text-[14px] text-white duration-200 hover:opacity-75"
                :disabled="busy"
              >
                {{ busy ? $t('signin.pleaseWait') : view === 'signin' ? $t('signin.loginBtn') : $t('signin.signUpBtn') }}
              </button>
              <button
                v-else
                type="submit"
                :class="resetBtnClass"
                :disabled="busy"
              >
                {{ busy ? $t('signin.pleaseWait') : $t('signin.resetBtn') }}
              </button>

              <!-- 注册视图条款声明（原站 text-[12px] text-[#8E8E8E] 居中） -->
              <p v-if="view === 'signup'" class="text-center text-[12px] text-[#8E8E8E]" v-html="rich($t('signin.termsAgree'))" />
            </form>
          </div>

          <!-- 视图底部链接区（原站 text-[14px] text-[#8E8E8E] + space-y-6 + hr） -->
          <div v-if="view === 'signin'" class="text-[14px] text-[#8E8E8E]">
            <div class="space-y-6">
              <p class="text-center">
                {{ $t('signin.noAccount') }}
                <a class="cursor-pointer text-blue-600 underline duration-200 hover:text-red-600" @click="switchView('signup')">{{ $t('signin.signUpNow') }}</a>
              </p>
              <hr class="border-[#F3F3F3]">
              <p class="text-center">
                {{ $t('signin.forgotPw') }}
                <a class="cursor-pointer text-blue-600 underline duration-200 hover:text-red-600" @click="switchView('reset')">{{ $t('signin.resetPwLink') }}</a>
              </p>
            </div>
          </div>
          <div v-else-if="view === 'signup'" class="text-center text-[14px] text-[#8E8E8E]">
            <a class="cursor-pointer text-blue-600 underline duration-200 hover:text-red-600" @click="switchView('signin')">{{ $t('signin.loginNow') }}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '~/composables/useAuth'

const { t } = useI18n()
const router = useRouter()
const { login, register } = useAuth()

const mode = ref<'signin' | 'signup'>('signin')
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

function mapError(e: any): string {
  const msg: string = e?.data?.statusMessage || e?.message || ''
  if (msg.includes('EMAIL') || msg.includes('exists')) return t('signin.emailExists')
  if (msg.includes('INVALID_EMAIL') || msg.includes('email')) return t('signin.invalidEmail')
  if (msg.includes('PASSWORD') || msg.includes('Password')) return t('signin.passwordTooShort')
  if (msg.includes('CREDENTIALS') || msg.includes('Invalid')) return t('signin.wrongCredentials')
  if (msg.includes('NAME')) return t('signin.nameRequired')
  return t('signin.genericError')
}

async function submit() {
  error.value = ''
  busy.value = true
  try {
    if (mode.value === 'signup') {
      const res = await register(name.value.trim(), email.value.trim(), password.value)
      if (res.ok) await router.push('/account')
    } else {
      const res = await login(email.value.trim(), password.value)
      if (res.ok) await router.push('/account')
    }
  } catch (e: any) {
    error.value = mapError(e)
  } finally {
    busy.value = false
  }
}

useHead({ title: t('signin.signIn') })
</script>

<template>
  <div class="container-pg py-16">
    <div class="mx-auto max-w-md card-pg p-8">
      <h1 class="mb-1 text-center font-serif text-2xl font-bold text-ink">
        {{ mode === 'signin' ? $t('signin.signIn') : $t('signin.signUp') }}
      </h1>
      <p class="mb-6 text-center text-sm text-muted">{{ $t('signin.subtitle') }}</p>

      <div class="mb-6 flex rounded-full bg-slate-100 p-1 text-sm font-medium">
        <button
          type="button"
          class="flex-1 rounded-full py-2"
          :class="mode === 'signin' ? 'bg-white shadow-soft text-ink' : 'text-muted'"
          @click="mode = 'signin'"
        >{{ $t('signin.signIn') }}</button>
        <button
          type="button"
          class="flex-1 rounded-full py-2"
          :class="mode === 'signup' ? 'bg-white shadow-soft text-ink' : 'text-muted'"
          @click="mode = 'signup'"
        >{{ $t('signin.signUp') }}</button>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div v-if="mode === 'signup'">
          <label class="text-sm font-medium">{{ $t('signin.name') }}</label>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('signin.email') }}</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('signin.password') }}</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

        <button class="btn-primary w-full" type="submit" :disabled="busy">
          {{ busy ? $t('signin.pleaseWait') : (mode === 'signin' ? $t('signin.signIn') : $t('signin.create')) }}
        </button>
      </form>

      <div v-if="mode === 'signin'" class="mt-3 text-center">
        <NuxtLink to="/forgot-password" class="text-xs text-accent hover:underline">
          {{ $t('signin.forgot') }}
        </NuxtLink>
      </div>

      <p class="mt-4 text-center text-xs text-muted">
        {{ $t('signin.terms') }}
      </p>
    </div>
  </div>
</template>

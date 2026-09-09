<script setup lang="ts">
const localePath = useLocalePath()
import { ref, computed } from 'vue'
import { useRoute } from '#imports'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'

const { t } = useI18n()
const route = useRoute()
const { resetPassword } = useApi()

const token = String(route.query.token || '')
const password = ref('')
const confirm = ref('')
const error = ref('')
const done = ref(false)
const busy = ref(false)

const mismatch = computed(() => confirm.value.length > 0 && password.value !== confirm.value)

function mapError(e: any): string {
  const msg: string = e?.data?.statusMessage || ''
  if (msg.includes('PASSWORD')) return t('reset.tooShort')
  if (msg.includes('INVALID') || msg.includes('EXPIRED')) return t('reset.invalid')
  return t('reset.error')
}

async function submit() {
  error.value = ''
  if (password.value.length < 8) {
    error.value = t('reset.tooShort')
    return
  }
  if (mismatch.value) {
    error.value = t('reset.mismatch')
    return
  }
  busy.value = true
  try {
    await resetPassword(token, password.value)
    done.value = true
  } catch (e: any) {
    error.value = mapError(e)
  } finally {
    busy.value = false
  }
}

useHead({ title: t('reset.title') })
</script>

<template>
  <div class="container-pg py-16">
    <div class="mx-auto max-w-md card-pg p-8">
      <h1 class="font-serif text-2xl font-bold text-ink">{{ $t('reset.title') }}</h1>

      <form v-if="!done && token" class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-sm font-medium">{{ $t('reset.newPassword') }}</label>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('reset.confirmPassword') }}</label>
          <input
            v-model="confirm"
            type="password"
            autocomplete="new-password"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <p v-if="mismatch" class="text-sm text-red-600">{{ $t('reset.mismatch') }}</p>
        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>
        <button class="btn-primary w-full" type="submit" :disabled="busy">
          {{ busy ? $t('reset.submitting') : $t('reset.submit') }}
        </button>
      </form>

      <div v-else-if="done" class="mt-6">
        <div class="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          <p class="font-medium">{{ $t('reset.success') }}</p>
        </div>
        <NuxtLink :to="localePath('/signin')" class="btn-primary mt-4 inline-flex">{{ $t('reset.goSignIn') }}</NuxtLink>
      </div>

      <div v-else class="mt-6">
        <p class="rounded-xl bg-red-50 p-4 text-sm text-red-600">{{ $t('reset.invalid') }}</p>
        <NuxtLink :to="localePath('/forgot-password')" class="btn-outline mt-4 inline-flex">{{ $t('reset.backToForgot') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

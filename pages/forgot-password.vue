<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'

const { t } = useI18n()
const { forgotPassword } = useApi()

const email = ref('')
const sent = ref(false)
const devLink = ref('')
const busy = ref(false)

async function submit() {
  busy.value = true
  try {
    const res = await forgotPassword(email.value.trim())
    sent.value = true
    devLink.value = res.devLink || ''
  } finally {
    busy.value = false
  }
}

useHead({ title: t('forgot.title') })
</script>

<template>
  <div class="container-pg py-16">
    <div class="mx-auto max-w-md card-pg p-8">
      <h1 class="font-serif text-2xl font-bold text-ink">{{ $t('forgot.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ $t('forgot.subtitle') }}</p>

      <form v-if="!sent" class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-sm font-medium">{{ $t('forgot.emailLabel') }}</label>
          <input
            v-model="email"
            type="email"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <button class="btn-primary w-full" type="submit" :disabled="busy">
          {{ busy ? $t('forgot.sending') : $t('forgot.send') }}
        </button>
      </form>

      <div v-else class="mt-6">
        <div class="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          <p class="font-medium">{{ $t('forgot.sentTitle') }}</p>
          <p class="mt-1">{{ $t('forgot.sentText') }}</p>
        </div>
        <p v-if="devLink" class="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          {{ $t('forgot.devHint') }}<br />
          <a :href="devLink" class="underline break-all">{{ devLink }}</a>
        </p>
        <NuxtLink to="/signin" class="btn-outline mt-4 inline-flex">{{ $t('forgot.backToSignIn') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

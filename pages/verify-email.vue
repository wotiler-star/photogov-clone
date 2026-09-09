<script setup lang="ts">
const localePath = useLocalePath()
import { ref, onMounted } from 'vue'
import { useRoute } from '#imports'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'

const { t } = useI18n()
const route = useRoute()
const { verifyEmail } = useApi()

const status = ref<'loading' | 'ok' | 'error'>('loading')
const token = String(route.query.token || '')

onMounted(async () => {
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

useHead({ title: t('verify.title') })
</script>

<template>
  <div class="container-pg py-16">
    <div class="mx-auto max-w-md card-pg p-8 text-center">
      <template v-if="status === 'loading'">
        <p class="text-muted">{{ $t('verify.checking') }}</p>
      </template>
      <template v-else-if="status === 'ok'">
        <div class="mb-4 text-4xl">✅</div>
        <h1 class="font-serif text-2xl font-bold text-ink">{{ $t('verify.verified') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ $t('verify.verifiedText') }}</p>
        <NuxtLink :to="localePath('/account')" class="btn-primary mt-6 inline-flex">{{ $t('verify.goAccount') }}</NuxtLink>
      </template>
      <template v-else>
        <div class="mb-4 text-4xl">⚠️</div>
        <h1 class="font-serif text-2xl font-bold text-ink">{{ $t('verify.expired') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ $t('verify.expiredText') }}</p>
        <NuxtLink :to="localePath('/signin')" class="btn-outline mt-6 inline-flex">{{ $t('verify.backToSignIn') }}</NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
useHead({ title: t('contact.title') })
const sent = ref(false)
function submit() { sent.value = true }
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-2xl">
      <span class="eyebrow">{{ $t('contact.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('contact.title') }}</h1>
      <p class="mt-3 text-muted">{{ $t('contact.sub') }}</p>

      <form v-if="!sent" class="mt-8 card-pg space-y-4 p-6" @submit.prevent="submit">
        <div>
          <label class="text-sm font-medium">{{ $t('contact.name') }}</label>
          <input class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('contact.email') }}</label>
          <input type="email" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('contact.message') }}</label>
          <textarea rows="4" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required></textarea>
        </div>
        <button class="btn-primary w-full" type="submit">{{ $t('contact.send') }}</button>
      </form>

      <div v-else class="mt-8 card-pg p-6 text-center text-accent-green">
        {{ $t('contact.thanks') }}
      </div>
    </div>
  </div>
</template>

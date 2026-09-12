<script setup lang="ts">
const localePath = useLocalePath()
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()
useHead({ title: t('help.title') })
const faqs = computed(() => (tm('help.qa') as Array<{ q: string, a: string }>) || [])
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('help.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('help.title') }}</h1>
      <p class="mt-3 text-muted">{{ $t('help.sub') }}</p>

      <div class="mt-8 space-y-3">
        <div v-for="(f, i) in faqs" :key="i" class="card-pg p-5">
          <h2 class="font-semibold">{{ f.q }}</h2>
          <p class="mt-1 text-sm text-muted">{{ f.a }}</p>
        </div>
      </div>

      <div class="mt-8 rounded-2xl bg-slate-50 p-6 text-center">
        <p class="text-muted">{{ $t('help.stillNeed') }}</p>
        <NuxtLink :to="localePath('/contacts')" class="btn-primary mt-3">{{ $t('help.btn') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

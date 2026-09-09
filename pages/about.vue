<script setup lang="ts">
const localePath = useLocalePath()
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
useHead({ title: t('about.title') })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('about.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('about.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('about.p1') }}</p>
      <h2 class="mt-8 text-2xl font-semibold">{{ $t('about.mission') }}</h2>
      <p class="mt-2 text-muted">{{ $t('about.p2') }}</p>
      <h2 class="mt-8 text-2xl font-semibold">{{ $t('about.privacy') }}</h2>
      <i18n-t keypath="about.p3" tag="p" class="mt-2 text-muted">
        <template #privacy>
          <NuxtLink :to="localePath('/privacy')" class="text-brand-blue underline">{{ $t('about.privacyLink') }}</NuxtLink>
        </template>
      </i18n-t>
      <p class="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-muted">
        {{ $t('about.note') }}
      </p>
    </div>
  </div>
</template>

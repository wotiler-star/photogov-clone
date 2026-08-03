<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const year = new Date().getFullYear()
useHead({ title: t('legal.cookieTitle') })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('legal.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('legal.cookieTitle') }}</h1>
      <p class="mt-3 text-sm text-muted">{{ $t('legal.updated', { year }) }}</p>

      <div class="mt-6 space-y-5 text-muted">
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.cookieWhatTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.cookieWhatText') }}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.cookieAnalyticsTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.cookieAnalyticsText') }}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.cookieManageTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.cookieManageText') }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

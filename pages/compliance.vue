<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
useHead({ title: t('compliance.title') })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('compliance.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('compliance.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('compliance.sub') }}</p>

      <div class="mt-8 space-y-6">
        <div class="card-pg p-6">
          <h2 class="text-xl font-semibold">{{ $t('compliance.sizesTitle') }}</h2>
          <p class="mt-2 text-sm text-muted">{{ $t('compliance.sizesText') }}</p>
        </div>
        <div class="card-pg p-6">
          <h2 class="text-xl font-semibold">{{ $t('compliance.headTitle') }}</h2>
          <p class="mt-2 text-sm text-muted">{{ $t('compliance.headText') }}</p>
        </div>
        <div class="card-pg p-6">
          <h2 class="text-xl font-semibold">{{ $t('compliance.bgTitle') }}</h2>
          <p class="mt-2 text-sm text-muted">{{ $t('compliance.bgText') }}</p>
        </div>
      </div>

      <p class="mt-8 text-sm text-muted">{{ $t('compliance.note') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const year = new Date().getFullYear()
useHead({ title: t('legal.termsTitle') })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('legal.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('legal.termsTitle') }}</h1>
      <p class="mt-3 text-sm text-muted">{{ $t('legal.updated', { year }) }}</p>

      <div class="mt-6 space-y-5 text-muted">
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.useTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.useText') }}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.warrantyTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.warrantyText') }}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.liabilityTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.liabilityText') }}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.changesTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.changesText') }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

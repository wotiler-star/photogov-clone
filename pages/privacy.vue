<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const year = new Date().getFullYear()
useHead({ title: t('legal.privacyTitle') })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('legal.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('legal.privacyTitle') }}</h1>
      <p class="mt-3 text-sm text-muted">{{ $t('legal.updated', { year }) }}</p>

      <div class="mt-6 space-y-5 text-muted">
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.secPhotosTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.secPhotosText') }}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.secAnalyticsTitle') }}</h2>
          <p class="mt-1">
            {{ $t('legal.secAnalyticsText') }}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.secCookiesTitle') }}</h2>
          <i18n-t keypath="legal.secCookiesText" tag="p" class="mt-1">
            <template #cookie>
              <NuxtLink to="/cookies" class="text-brand-blue underline">{{ $t('legal.cookieLink') }}</NuxtLink>
            </template>
          </i18n-t>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">{{ $t('legal.secContactTitle') }}</h2>
          <i18n-t keypath="legal.secContactText" tag="p" class="mt-1">
            <template #contact>
              <NuxtLink to="/contact" class="text-brand-blue underline">{{ $t('legal.contactLink') }}</NuxtLink>
            </template>
          </i18n-t>
        </section>
      </div>
    </div>
  </div>
</template>

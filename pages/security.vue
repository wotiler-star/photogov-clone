<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()

useHead({ title: t('securityPage.title') })

const items = computed(() => tm('securityPage.items') as Array<{ t: string; p: string }>)
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('securityPage.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('securityPage.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('securityPage.lead') }}</p>

      <div class="mt-8 space-y-5">
        <section v-for="(it, i) in items" :key="i" class="card-pg p-6">
          <h2 class="text-lg font-semibold">{{ it.t }}</h2>
          <p class="mt-2 text-sm text-muted">{{ it.p }}</p>
        </section>
      </div>

      <p class="mt-8 text-sm text-muted">{{ $t('securityPage.outro') }}</p>
    </div>
  </div>
</template>

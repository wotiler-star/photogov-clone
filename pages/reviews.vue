<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()

useHead({ title: t('reviewsPage.title') })

const users = computed(() => tm('reviewsPage.users') as Array<{ name: string; text: string; when: string }>)
const verifyList = computed(() => tm('reviewsPage.verifyList') as string[])
const stats = computed(() => tm('reviewsPage.stats') as Array<{ value: string; label: string }>)
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('reviewsPage.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('reviewsPage.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('reviewsPage.sub') }}</p>

      <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="(s, i) in stats" :key="i" class="card-pg p-4 text-center">
          <div class="text-2xl font-bold text-brand">{{ s.value }}</div>
          <div class="mt-1 text-xs text-muted">{{ s.label }}</div>
        </div>
      </div>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('reviewsPage.statsTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.statsP1') }}</p>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.statsP2') }}</p>

      <blockquote class="card-pg mt-6 border-l-4 border-[#ccb38d] p-6">
        <p class="italic text-muted">“{{ $t('reviewsPage.quote') }}”</p>
        <footer class="mt-3 text-sm font-semibold">— {{ $t('reviewsPage.quoteAuthor') }}</footer>
      </blockquote>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('reviewsPage.sectionTitle') }}</h2>
      <div class="mt-6 space-y-4">
        <article v-for="(u, i) in users" :key="i" class="card-pg p-5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold">{{ u.name }}</h3>
            <span class="text-xs text-muted">{{ u.when }}</span>
          </div>
          <p class="mt-2 text-sm text-muted">{{ u.text }}</p>
        </article>
      </div>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('reviewsPage.verifyTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.verifyP1') }}</p>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.verifyP2') }}</p>
      <ul class="mt-4 space-y-2 pl-5">
        <li v-for="(v, i) in verifyList" :key="i" class="list-disc text-sm text-muted">{{ v }}</li>
      </ul>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('reviewsPage.shapeTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.shapeP') }}</p>

      <div class="card-pg mt-8 p-6">
        <h2 class="text-lg font-semibold">{{ $t('reviewsPage.voiceTitle') }}</h2>
        <p class="mt-2 text-sm text-muted">{{ $t('reviewsPage.voiceP1') }}</p>
        <p class="mt-2 text-sm text-muted">{{ $t('reviewsPage.voiceP2') }}</p>
      </div>
    </div>
  </div>
</template>

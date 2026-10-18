<script setup lang="ts">
const localePath = useLocalePath()
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()
const year = new Date().getFullYear()
useHead({ title: t('legal.cookieTitle') })

// Cookie 政策小节（数据驱动，含可选内链字段 linkPath/linkText）
const sections = computed(() => tm('legal.cookieSections') as Array<{ title: string; text: string; linkPath?: string; linkText?: string }>)
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('legal.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('legal.cookieTitle') }}</h1>
      <p class="mt-3 text-sm text-muted">{{ $t('legal.updated', { year }) }}</p>

      <div class="mt-6 space-y-5 text-muted">
        <section v-for="(s, i) in sections" :key="i">
          <h2 class="text-xl font-semibold text-ink">{{ s.title }}</h2>
          <i18n-t v-if="s.linkPath" :keypath="`legal.cookieSections.${i}.text`" tag="p" class="mt-1">
            <template #link>
              <NuxtLink :to="localePath(s.linkPath)" class="text-brand-blue underline">{{ s.linkText }}</NuxtLink>
            </template>
          </i18n-t>
          <p v-else class="mt-1">{{ s.text }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

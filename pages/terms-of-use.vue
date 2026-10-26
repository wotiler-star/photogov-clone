<script setup lang="ts">
const localePath = useLocalePath()
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()
const year = new Date().getFullYear()
useHead({ title: t('legal.termsTitle') })

// 服务条款小节（数据驱动，含可选内链字段 linkPath/linkText）
const sections = computed(() => tm('legal.termsSections') as Array<{ title: string; text: string; linkPath?: string; linkText?: string }>)
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('legal.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('legal.termsTitle') }}</h1>
      <p class="mt-3 text-sm text-muted">{{ $t('legal.updated', { year }) }}</p>

      <div class="mt-6 space-y-5 text-muted">
        <section v-for="(s, i) in sections" :key="i">
          <h2 class="text-xl font-semibold text-ink">{{ s.title }}</h2>
          <i18n-t v-if="s.linkPath" :keypath="`legal.termsSections.${i}.text`" tag="p" class="mt-1">
            <template #link>
              <NuxtLink :to="localePath(s.linkPath)" class="text-brand-blue underline">{{ s.linkText }}</NuxtLink>
            </template>
          </i18n-t>
          <p v-else class="mt-1">{{ s.text }}</p>
        </section>
      </div>

      <!-- Requisites（对标原站法务页底部的主体信息块） -->
      <div class="mt-8 rounded-xl border border-slate-200 p-5 text-sm">
        <h2 class="text-lg font-semibold text-ink">{{ $t('legal.requisitesTitle') }}</h2>
        <dl class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <dt class="text-muted">{{ $t('legal.requisitesOwner') }}</dt>
            <dd class="font-medium text-ink">{{ $t('legal.requisitesOwnerValue') }}</dd>
          </div>
          <div>
            <dt class="text-muted">{{ $t('legal.requisitesZip') }}</dt>
            <dd class="font-medium text-ink">{{ $t('legal.requisitesZipValue') }}</dd>
          </div>
          <div>
            <dt class="text-muted">{{ $t('legal.requisitesAddress') }}</dt>
            <dd class="font-medium text-ink">{{ $t('legal.requisitesAddressValue') }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

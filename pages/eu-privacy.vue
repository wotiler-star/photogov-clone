<script setup lang="ts">
const localePath = useLocalePath()
import { useI18n } from 'vue-i18n'
import { useOrgLd } from '~/composables/useOrgLd'
const { t } = useI18n()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()
// 邮箱放运行时常量，避免 @ 被 vue-i18n 当成链接消息语法而编译报错
const EMAIL = 'info@photogov.net'
useHead({
  title: t('euPrivacy.h1'),
  script: [
    ...orgScripts.value,
    {
      key: 'ld-euprivacy-bc',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('euPrivacy.h1') }
        ]
      }).replace(/</g, '\\u003c')
    }
  ]
})
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('euPrivacy.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('euPrivacy.h1') }}</h1>
      <p class="mt-3 text-sm text-muted">{{ $t('euPrivacy.intro') }}</p>

      <p class="mt-6 text-muted">{{ $t('euPrivacy.lead') }}</p>

      <!-- Section 1 -->
      <section class="mt-10">
        <h2 class="text-2xl font-bold text-ink">{{ $t('euPrivacy.sec1Title') }}</h2>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s1h1') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s1p1') }}</p>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s1h2') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s1p2') }}</p>
      </section>

      <!-- Section 2: GDPR -->
      <section class="mt-10">
        <h2 class="text-2xl font-bold text-ink">{{ $t('euPrivacy.sec2Title') }}</h2>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s2h1') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s2p1') }}</p>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s2h2') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s2p2') }}</p>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s2h3') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s2p3') }}</p>
        <p class="mt-4 font-medium text-ink">{{ $t('euPrivacy.s2stepsTitle') }}</p>
        <ul class="mt-2 list-disc space-y-2 pl-6 text-muted">
          <li v-for="(it, i) in $tm('euPrivacy.s2li')" :key="i">{{ it }}</li>
        </ul>
      </section>

      <!-- Section 3: DPA -->
      <section class="mt-10">
        <h2 class="text-2xl font-bold text-ink">{{ $t('euPrivacy.sec3Title') }}</h2>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s3h1') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s3p1') }}</p>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s3h2') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s3p2') }}</p>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s3h3') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s3p3') }}</p>
        <ul class="mt-2 list-disc space-y-2 pl-6 text-muted">
          <li v-for="(it, i) in $tm('euPrivacy.s3li')" :key="i">{{ it }}</li>
        </ul>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s3h4') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s3p4') }}</p>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s3h5') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s3p5') }}</p>
        <h3 class="mt-5 text-lg font-semibold text-ink">{{ $t('euPrivacy.s3h6') }}</h3>
        <p class="mt-2 text-muted">{{ $t('euPrivacy.s3p6', { email: EMAIL }) }}</p>
      </section>

      <div class="mt-10">
        <NuxtLink :to="localePath('/security')" class="btn-outline inline-flex">{{ $t('nav.security') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

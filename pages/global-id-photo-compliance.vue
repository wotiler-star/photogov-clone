<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOrgLd } from '~/composables/useOrgLd'
const { t, tm } = useI18n()
const localePath = useLocalePath()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()

useHead({
  title: t('globalCompliance.title'),
  script: [
    ...orgScripts.value,
    {
      key: 'ld-global-bc',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('globalCompliance.title') }
        ]
      }).replace(/</g, '\\u003c')
    }
  ]
})

const paras = computed(() => tm('globalCompliance.paras') as string[])
const policy = computed(() => tm('globalCompliance.policy') as string[])
const countries = computed(
  () => tm('globalCompliance.countries') as Array<{ k: string; v: string }>
)
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('globalCompliance.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('globalCompliance.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('globalCompliance.sub') }}</p>

      <h2 class="mt-10 text-2xl font-bold">{{ $t('globalCompliance.regsTitle') }}</h2>
      <p v-for="(p, i) in paras" :key="i" class="mt-3 text-muted">{{ p }}</p>

      <h2 class="mt-10 text-2xl font-bold">{{ $t('globalCompliance.policyTitle') }}</h2>
      <p v-for="(p, i) in policy" :key="`pol${i}`" class="mt-3 text-muted">{{ p }}</p>

      <div class="card-pg mt-6 p-6">
        <h2 class="text-lg font-semibold">{{ $t('globalCompliance.countriesTitle') }}</h2>
        <ul class="mt-4 space-y-3">
          <li v-for="(c, i) in countries" :key="i">
            <span class="font-semibold">{{ c.k }}</span>
            <span class="text-sm text-muted"> {{ c.v }}</span>
          </li>
        </ul>
      </div>

      <div class="card-pg mt-6 p-6">
        <h2 class="text-lg font-semibold">{{ $t('globalCompliance.commitTitle') }}</h2>
        <p class="mt-2 text-sm text-muted">{{ $t('globalCompliance.commitText') }}</p>
      </div>

      <h2 class="mt-10 text-2xl font-bold">{{ $t('globalCompliance.whyTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('globalCompliance.whyText') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOrgLd } from '~/composables/useOrgLd'
const { t, tm } = useI18n()
const localePath = useLocalePath()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()

useHead({
  title: t('independence.title'),
  script: [
    ...orgScripts.value,
    {
      key: 'ld-independence-bc',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('independence.title') }
        ]
      }).replace(/</g, '\\u003c')
    }
  ]
})

const paras = computed(() => tm('independence.paras') as string[])
const sources = computed(
  () => tm('independence.sources') as Array<{ label: string; url: string }>
)
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('independence.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('independence.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('independence.sub') }}</p>

      <div class="card-pg mt-8 p-6">
        <h2 class="text-lg font-semibold">{{ $t('independence.independenceTitle') }}</h2>
        <p v-for="(p, i) in paras" :key="i" class="mt-2 text-sm text-muted">{{ p }}</p>
      </div>

      <div class="card-pg mt-5 p-6">
        <h2 class="text-lg font-semibold">{{ $t('independence.sourcesTitle') }}</h2>
        <p class="mt-2 text-sm text-muted">{{ $t('independence.sourcesIntro') }}</p>
        <ul class="mt-3 space-y-2">
          <li v-for="(s, i) in sources" :key="i">
            <a
              :href="s.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-brand hover:underline"
            >{{ s.label }}</a>
          </li>
        </ul>
        <p class="mt-4 text-sm text-muted">{{ $t('independence.sourcesNote') }}</p>
      </div>

      <div class="card-pg mt-5 border-l-4 border-[#ccb38d] p-6">
        <h2 class="text-lg font-semibold">{{ $t('independence.legalTitle') }}</h2>
        <p class="mt-2 text-sm text-muted">{{ $t('independence.legalText') }}</p>
      </div>
    </div>
  </div>
</template>

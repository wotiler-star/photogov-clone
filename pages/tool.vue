<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRequestURL } from '#imports'
import PhotoTool from '~/components/PhotoTool.vue'

const { t, tm } = useI18n()
const url = useRequestURL()

useHead({
  title: t('tool.pageTitle'),
  meta: [
    { name: 'description', content: t('tool.pageDesc') },
    { property: 'og:title', content: t('tool.pageTitle') },
    { property: 'og:description', content: t('tool.pageDesc') },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url.origin + '/tool' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'index,follow' }
  ],
  link: [{ rel: 'canonical', href: url.origin + '/tool' }]
})

const steps = computed(() => (tm('tool.steps') as unknown as string[]))
</script>

<template>
  <div class="container-pg py-12">
    <header class="mx-auto max-w-3xl text-center">
      <span class="eyebrow">{{ $t('tool.document') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('tool.pageTitle') }}</h1>
      <p class="mx-auto mt-4 max-w-2xl text-muted">{{ $t('tool.pageDesc') }}</p>
    </header>

    <section class="mt-8">
      <PhotoTool />
    </section>

    <section class="mx-auto mt-12 max-w-3xl">
      <h2 class="text-2xl font-bold">{{ $t('tool.stepsTitle') }}</h2>
      <ol class="mt-5 space-y-4">
        <li
          v-for="(s, i) in steps"
          :key="i"
          class="card-pg flex items-start gap-4 p-5"
        >
          <span
            class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue/10 text-sm font-semibold text-brand-blue"
            >{{ i + 1 }}</span
          >
          <p class="text-sm leading-relaxed text-ink">{{ s }}</p>
        </li>
      </ol>

      <div class="card-pg mt-8 border-l-4 border-[#ccb38d] p-6">
        <p class="text-sm leading-relaxed text-muted">
          {{ $t('about.note') }}
        </p>
      </div>
    </section>
  </div>
</template>

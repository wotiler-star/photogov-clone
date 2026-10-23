<script setup lang="ts">
import { useLocalePath } from '#imports'
import { useI18n } from 'vue-i18n'
import InfoPageShell from '~/components/InfoPageShell.vue'

const localePath = useLocalePath()
const { t, tm } = useI18n()
useHead({
  title: t('editorialPolicy.metaTitle'),
  meta: [{ name: 'description', content: t('editorialPolicy.metaDesc') }]
})

const steps = tm('editorialPolicy.steps') as Array<{ t: string; d: string }>
</script>

<template>
  <InfoPageShell
    icon="editorial-policy"
    :hero-title="$t('editorialPolicy.heroTitle')"
    :hero-desc="$t('editorialPolicy.heroDesc')"
    :breadcrumb="$t('editorialPolicy.breadcrumb')"
  >
    <h1 class="text-[30px] font-bold leading-tight">{{ $t('editorialPolicy.title') }}</h1>
    <p class="mt-4 font-sans text-gray-600">{{ $t('editorialPolicy.lastUpdated') }}</p>

    <div class="mt-10 space-y-10 text-[#374151]">
      <section>
        <h2 class="mb-4 text-[24px] font-semibold">{{ $t('editorialPolicy.createTitle') }}</h2>
        <p class="font-sans">{{ $t('editorialPolicy.createP') }}</p>
      </section>

      <section>
        <h2 class="mb-4 text-[24px] font-semibold">{{ $t('editorialPolicy.teamTitle') }}</h2>
        <p class="font-sans">
          {{ $t('editorialPolicy.teamP') }}
          <NuxtLink :to="localePath('/editorial-team')" class="text-blue-600 underline duration-200 hover:text-red-600">
            {{ $t('editorialPolicy.teamLink') }}
          </NuxtLink>
        </p>
      </section>

      <section>
        <h2 class="mb-4 text-[24px] font-semibold">{{ $t('editorialPolicy.sourcesTitle') }}</h2>
        <p class="font-sans">{{ $t('editorialPolicy.sourcesP') }}</p>
      </section>

      <section>
        <h2 class="mb-4 text-[24px] font-semibold">{{ $t('editorialPolicy.stepsTitle') }}</h2>
        <div class="space-y-4">
          <div v-for="(s, i) in steps" :key="i">
            <h3 class="font-semibold">{{ s.t }}</h3>
            <p class="mt-1 font-sans">{{ s.d }}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-[24px] font-semibold">{{ $t('editorialPolicy.updatesTitle') }}</h2>
        <p class="font-sans">{{ $t('editorialPolicy.updatesP') }}</p>
      </section>

      <section>
        <h2 class="mb-4 text-[24px] font-semibold">{{ $t('editorialPolicy.correctionsTitle') }}</h2>
        <p class="font-sans">
          {{ $t('editorialPolicy.correctionsP') }}
          <NuxtLink :to="localePath('/contacts')" class="text-blue-600 underline duration-200 hover:text-red-600">
            {{ $t('footer.links.contacts') }}
          </NuxtLink>
        </p>
      </section>
    </div>
  </InfoPageShell>
</template>

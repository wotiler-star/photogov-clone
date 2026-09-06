<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()
const localePath = useLocalePath()

useHead({ title: t('howItWorks.title') })

const steps = computed(() => tm('howItWorks.steps') as Array<{ t: string; p: string }>)
const tech = computed(() => tm('howItWorks.tech') as string[])
const embassy = computed(() => tm('howItWorks.embassy') as string[])
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('howItWorks.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('howItWorks.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('howItWorks.lead1') }}</p>
      <p class="mt-3 text-muted">{{ $t('howItWorks.lead2') }}</p>

      <NuxtLink :to="localePath('/')" class="btn-pg mt-6 inline-flex">
        {{ $t('howItWorks.cta') }}
      </NuxtLink>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('howItWorks.stepsTitle') }}</h2>

      <ol class="mt-6 space-y-5">
        <li v-for="(s, i) in steps" :key="i" class="card-pg p-6">
          <h3 class="text-lg font-semibold">{{ s.t }}</h3>
          <p class="mt-2 text-sm text-muted">{{ s.p }}</p>
          <p v-if="i === 3" class="mt-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>{{ $t('howItWorks.noteTitle') }}</strong> {{ $t('howItWorks.note') }}
          </p>
        </li>
      </ol>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('howItWorks.techTitle') }}</h2>
      <p v-for="(p, i) in tech" :key="`t${i}`" class="mt-3 text-muted">{{ p }}</p>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('howItWorks.embassyTitle') }}</h2>
      <p v-for="(p, i) in embassy" :key="`e${i}`" class="mt-3 text-muted">{{ p }}</p>

      <div class="card-pg mt-8 border-l-4 border-[#ccb38d] p-6">
        <p class="text-sm text-muted">{{ $t('howItWorks.disclaimer') }}</p>
      </div>
    </div>
  </div>
</template>

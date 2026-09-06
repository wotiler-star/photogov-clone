<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()

useHead({ title: t('usCompliance.title') })

const paras = computed(() => tm('usCompliance.paras') as string[])
const policy = computed(() => tm('usCompliance.policy') as string[])
const alterations = computed(() => tm('usCompliance.alterations') as string[])
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('usCompliance.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('usCompliance.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('usCompliance.sub') }}</p>

      <div class="card-pg mt-8 p-6">
        <p v-for="(p, i) in paras" :key="i" class="mt-2 text-sm text-muted first:mt-0">{{ p }}</p>
      </div>

      <h2 class="mt-10 text-2xl font-bold">{{ $t('usCompliance.policyTitle') }}</h2>
      <p v-for="(p, i) in policy" :key="`p${i}`" class="mt-3 text-muted">{{ p }}</p>

      <div class="card-pg mt-6 p-6">
        <h2 class="text-lg font-semibold">{{ $t('usCompliance.alterationsTitle') }}</h2>
        <ul class="mt-3 space-y-2 pl-5">
          <li v-for="(a, i) in alterations" :key="i" class="list-disc text-sm text-muted">
            {{ a }}
          </li>
        </ul>
        <p class="mt-4 text-sm text-muted">{{ $t('usCompliance.alterationsNote') }}</p>
      </div>

      <p class="mt-8 text-sm text-muted">
        {{ $t('usCompliance.source') }}
        <a
          href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html"
          target="_blank"
          rel="noopener noreferrer"
          class="text-brand hover:underline"
        >{{ $t('usCompliance.sourceState') }}</a>
        ·
        <a
          href="https://www.icao.int/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-brand hover:underline"
        >{{ $t('usCompliance.sourceIcao') }}</a>
      </p>
    </div>
  </div>
</template>

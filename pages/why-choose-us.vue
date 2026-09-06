<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()
const localePath = useLocalePath()

useHead({ title: t('whyChooseUs.title') })

const reasons = computed(
  () => tm('whyChooseUs.reasons') as Array<{ t: string; ps: string[]; bullets?: string[] }>
)
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('whyChooseUs.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('whyChooseUs.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('whyChooseUs.lead1') }}</p>
      <p class="mt-3 text-muted">{{ $t('whyChooseUs.lead2') }}</p>

      <div class="mt-10 space-y-5">
        <section v-for="(r, i) in reasons" :key="i" class="card-pg p-6">
          <h2 class="text-lg font-semibold">{{ r.t }}</h2>
          <p v-for="(p, j) in r.ps" :key="j" class="mt-2 text-sm text-muted">{{ p }}</p>

          <ul v-if="r.bullets" class="mt-3 space-y-1 pl-5">
            <li v-for="(b, k) in r.bullets" :key="k" class="list-disc text-sm text-muted">
              {{ b }}
            </li>
          </ul>

          <NuxtLink
            v-if="i === 0"
            :to="localePath('/')"
            class="btn-pg mt-4 inline-flex"
          >
            {{ $t('whyChooseUs.cta') }}
          </NuxtLink>

          <p v-if="i === 3" class="mt-4 text-sm">
            <NuxtLink :to="localePath('/prices')" class="font-semibold text-brand underline">
              {{ $t('whyChooseUs.learnPricing') }}
            </NuxtLink>
            {{ $t('whyChooseUs.learnPricingTail') }}
          </p>
        </section>
      </div>

      <p class="mt-8 text-muted">{{ $t('whyChooseUs.outro1') }}</p>
      <p class="mt-3 text-sm text-muted">{{ $t('whyChooseUs.outro2') }}</p>
    </div>
  </div>
</template>

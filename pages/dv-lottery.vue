<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PhotoTool from '~/components/PhotoTool.vue'
import { useData } from '~/composables/useData'

const { getDocument } = useData()
const doc = getDocument('dv-lottery-photo-tool')
const { t, tm } = useI18n()
useHead({ title: 'US DV Lottery Photo Tool — Free & Compliant' })

const dvRules = computed(() => {
  const arr = (tm('dv.rules') as string[]) || []
  return arr.map((s, i) => i === 0 && doc ? s.replace('{size}', doc.size.inch).replace('{px}', doc.size.px) : s)
})
</script>

<template>
  <div class="bg-gradient-to-b from-[#eef4ff] to-white">
    <div class="container-pg py-12">
      <div class="text-center">
        <span class="eyebrow">{{ $t('dv.eyebrow') }}</span>
        <h1 class="mt-2 text-4xl font-bold sm:text-5xl">{{ $t('dv.title') }}</h1>
        <p class="mx-auto mt-3 max-w-2xl text-muted">{{ $t('dv.sub') }}</p>
      </div>

      <div class="mx-auto mt-8 max-w-xl">
        <PhotoTool country="US" doc="dv-lottery-photo-tool" />
      </div>

      <div v-if="doc" class="mx-auto mt-10 max-w-3xl card-pg p-6">
        <h2 class="text-xl font-semibold">{{ $t('dv.rulesTitle') }}</h2>
        <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li v-for="(rule, i) in dvRules" :key="i">{{ rule }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

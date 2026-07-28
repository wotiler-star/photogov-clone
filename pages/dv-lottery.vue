<script setup lang="ts">
import PhotoTool from '~/components/PhotoTool.vue'
import { useData } from '~/composables/useData'

const { getDocument } = useData()
const doc = getDocument('us-dv-lottery-photo')
useHead({ title: 'US DV Lottery Photo Tool — Free & Compliant' })
</script>

<template>
  <div class="bg-gradient-to-b from-[#eef4ff] to-white">
    <div class="container-pg py-12">
      <div class="text-center">
        <span class="eyebrow">Diversity Visa</span>
        <h1 class="mt-2 text-4xl font-bold sm:text-5xl">DV Lottery Photo Tool</h1>
        <p class="mx-auto mt-3 max-w-2xl text-muted">
          Make a photo that meets the U.S. Diversity Visa (green card) lottery rules:
          2×2 inches, 600×600 pixels, plain white background, head centered.
        </p>
      </div>

      <div class="mx-auto mt-8 max-w-xl">
        <PhotoTool country="US" doc="us-dv-lottery-photo" />
      </div>

      <div v-if="doc" class="mx-auto mt-10 max-w-3xl card-pg p-6">
        <h2 class="text-xl font-semibold">DV Lottery photo rules</h2>
        <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>Size: {{ doc.size.inch }} in ({{ doc.size.px }} px), square.</li>
          <li>Background: plain white, no shadows.</li>
          <li>Full face visible, neutral expression, both eyes open.</li>
          <li>No glasses, hats, or head coverings (except religious).</li>
          <li>Taken within the last 6 months.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

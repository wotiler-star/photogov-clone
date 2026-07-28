<script setup lang="ts">
import type { PhotoDoc } from '~/composables/useData'
defineProps<{ doc: PhotoDoc; flag?: string }>()
</script>

<template>
  <NuxtLink
    :to="`/document/${doc.slug}`"
    class="card-pg group flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-card"
  >
    <div class="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-blue/10 text-lg">
      {{ flag || '📄' }}
    </div>
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-ink">{{ doc.name }}</p>
      <p class="truncate text-xs text-muted">
        {{ doc.size.inch }} in · {{ doc.size.mm }} mm · {{ doc.countryName }}
      </p>
    </div>
    <svg class="ml-auto h-4 w-4 shrink-0 text-brand-blue opacity-0 transition group-hover:opacity-100" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </NuxtLink>
</template>

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
    <span
      v-if="doc.verified"
      class="ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      title="Verified by official source"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
    </span>
    <svg class="ml-auto h-4 w-4 shrink-0 text-brand-blue opacity-0 transition group-hover:opacity-100" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </NuxtLink>
</template>
